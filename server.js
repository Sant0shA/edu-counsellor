import express from 'express';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { spawn } from 'child_process';
import crypto from 'crypto';
import pg from 'pg';
import { Resend } from 'resend';
import Razorpay from 'razorpay';

const { Pool } = pg;
const __dirname = dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = process.env.PORT || 3000;

// Capture raw body for Razorpay webhook — collect Buffers, never setEncoding (breaks body-parser)
app.use((req, res, next) => {
  if (req.path !== '/api/payment/webhook') return next();
  const chunks = [];
  req.on('data', chunk => chunks.push(chunk));
  req.on('end', () => { req.rawBody = Buffer.concat(chunks).toString('utf8'); next(); });
});

// Skip express.json for webhook — stream already consumed above
app.use((req, res, next) => {
  if (req.rawBody !== undefined) return next();
  express.json({ limit: '64kb' })(req, res, next);
});
app.set('trust proxy', 1);

// ── HTML-escape user input before embedding in email templates ────────────────
function escHtml(str) {
  return String(str ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

// ── In-memory rate-limit state ────────────────────────────────────────────────
const otpSendLog        = new Map(); // email → lastSentMs
const otpAttempts       = new Map(); // email → { count, windowStart }
const vegRateLog        = new Map(); // ip    → { count, windowStart }
const couponValidateLog = new Map(); // ip    → { count, windowStart }
const sessionRateLog    = new Map(); // ip    → { count, windowStart }
const redeemRateLog     = new Map(); // ip    → { count, windowStart }

const OTP_SEND_COOLDOWN_MS   = 60 * 1000;
const OTP_ATTEMPT_WINDOW_MS  = 15 * 60 * 1000;
const OTP_MAX_ATTEMPTS       = 3;
const VEG_WINDOW_MS          = 60 * 1000;
const VEG_MAX_PER_WINDOW     = 10;
const COUPON_WINDOW_MS       = 60 * 1000;
const COUPON_MAX_PER_WINDOW  = 10;
const SESSION_WINDOW_MS      = 60 * 1000;
const SESSION_MAX            = 60;  // school networks share a single IP
const REDEEM_WINDOW_MS       = 60 * 1000;
const REDEEM_MAX             = 10;

// ── Test email bypass ─────────────────────────────────────────────────────────
// santosh180181@gmail.com is always free; add extras via TEST_EMAILS env var (comma-separated)
function isTestEmail(email) {
  if (!email) return false;
  const normalized = String(email).trim().toLowerCase();
  if (normalized === 'santosh180181@gmail.com') return true;
  if (!process.env.TEST_EMAILS) return false;
  return process.env.TEST_EMAILS.split(',').map(e => e.trim().toLowerCase()).includes(normalized);
}

// ── Report concurrency state ──────────────────────────────────────────────────
let activeReports = 0;
const MAX_CONCURRENT_REPORTS = 20;

// ── Postgres + Resend clients ─────────────────────────────────────────────────
const pool = process.env.DATABASE_URL
  ? new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: { rejectUnauthorized: false },
      max: 15,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 5000,
    })
  : null;

const resend = process.env.RESEND_API_KEY
  ? new Resend(process.env.RESEND_API_KEY)
  : null;

const razorpay = (process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET)
  ? new Razorpay({ key_id: process.env.RAZORPAY_KEY_ID, key_secret: process.env.RAZORPAY_KEY_SECRET })
  : null;

// ── Admin alert (uses existing Resend) ───────────────────────────────────────
async function sendAdminAlert(type, queueId) {
  if (!resend || !pool) return;
  try {
    const { rows } = await pool.query(
      `SELECT id, email, status, error, created_at FROM report_queue WHERE id = $1`,
      [queueId]
    );
    const r = rows[0];
    if (!r) return;
    const adminEmail = process.env.ADMIN_EMAIL || 'santosh.abraham@atrios.in';
    await resend.emails.send({
      from: 'CareerShifu <contact@careershifu.com>',
      to: adminEmail,
      subject: `[CareerShifu] Report ${type} — ${r.email}`,
      html: `<p><b>Queue ID:</b> ${r.id}<br><b>Student:</b> ${escHtml(r.email)}<br><b>Status:</b> ${r.status}<br><b>Error:</b> ${escHtml(r.error || '—')}<br><b>Created:</b> ${r.created_at}</p>`,
    });
  } catch (err) {
    console.error(`[alert] failed to send ${type} alert for queue_id=${queueId}:`, err.message);
  }
}

// ── Report spawn + concurrency-capped queue drain ────────────────────────────
function spawnReport(queueId) {
  activeReports++;
  const child = spawn(
    'python3',
    [join(__dirname, 'report/generate.py'), '--queue-id', String(queueId)],
    { detached: true, stdio: ['ignore', 'pipe', 'pipe'], env: { ...process.env } }
  );
  child.stdout.on('data', d => console.log(`[report ${queueId}]`, d.toString().trim()));
  child.stderr.on('data', d => console.error(`[report ${queueId}]`, d.toString().trim()));
  child.on('close', async (code) => {
    activeReports--;
    if (code !== 0) sendAdminAlert('failed', queueId).catch(() => {});
    drainReportQueue().catch(() => {});
  });
  child.on('error', async (err) => {
    activeReports--;
    console.error(`[report ${queueId}] spawn error:`, err.message);
    if (pool) {
      pool.query(
        "UPDATE report_queue SET status = 'failed', error = $1, updated_at = now() WHERE id = $2",
        [err.message, queueId]
      ).catch(() => {});
    }
    sendAdminAlert('failed', queueId).catch(() => {});
    drainReportQueue().catch(() => {});
  });
  child.unref();
}

async function drainReportQueue() {
  if (!pool || activeReports >= MAX_CONCURRENT_REPORTS) return;
  const slots = MAX_CONCURRENT_REPORTS - activeReports;
  try {
    const { rows } = await pool.query(
      `UPDATE report_queue SET status = 'generating', updated_at = now()
       WHERE id IN (
         SELECT id FROM report_queue WHERE status = 'pending'
         ORDER BY created_at LIMIT $1
       ) RETURNING id`,
      [slots]
    );
    if (rows.length > 0) console.log(`[drain] active=${activeReports} spawning=${rows.length}`);
    for (const { id } of rows) spawnReport(id);
  } catch (err) {
    console.error('[drain] queue drain failed:', err.message);
  }
}

// ── DB init — ensures report_queue exists on every deploy ────────────────────
async function initDb() {
  if (!pool) return;
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS report_queue (
        id         SERIAL PRIMARY KEY,
        session_id INTEGER,
        user_id    TEXT        NOT NULL,
        email      TEXT        NOT NULL,
        status     TEXT        NOT NULL DEFAULT 'pending',
        error      TEXT,
        created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
      )
    `);
    console.log('[db] report_queue table ready');
    // Migrate report_queue.user_id from UUID → TEXT if created with wrong type
    await pool.query(`
      DO $$
      BEGIN
        IF (SELECT data_type FROM information_schema.columns
            WHERE table_name='report_queue' AND column_name='user_id') = 'uuid' THEN
          ALTER TABLE report_queue ALTER COLUMN user_id TYPE TEXT USING user_id::TEXT;
        END IF;
      END;
      $$
    `);
    // Migrate report_queue.session_id from INTEGER → TEXT if needed
    await pool.query(`
      DO $$
      BEGIN
        IF (SELECT data_type FROM information_schema.columns
            WHERE table_name='report_queue' AND column_name='session_id') = 'integer' THEN
          ALTER TABLE report_queue DROP CONSTRAINT IF EXISTS report_queue_session_id_fkey;
          ALTER TABLE report_queue ALTER COLUMN session_id TYPE TEXT USING session_id::TEXT;
        END IF;
      END;
      $$
    `);
    await pool.query(`ALTER TABLE sessions ADD COLUMN IF NOT EXISTS user_id TEXT`);
    // Migrate INTEGER → TEXT if the column was previously created as INTEGER
    await pool.query(`
      DO $$
      BEGIN
        IF (SELECT data_type FROM information_schema.columns
            WHERE table_name='sessions' AND column_name='user_id') = 'integer' THEN
          ALTER TABLE sessions ALTER COLUMN user_id TYPE TEXT USING user_id::TEXT;
        END IF;
      END;
      $$
    `);
    console.log('[db] sessions.user_id column ready');
    await pool.query(`
      CREATE TABLE IF NOT EXISTS coupons (
        id             SERIAL PRIMARY KEY,
        code           TEXT        UNIQUE NOT NULL,
        type           TEXT        NOT NULL DEFAULT 'flat',
        discount_value INTEGER     NOT NULL DEFAULT 0,
        active         BOOLEAN     NOT NULL DEFAULT true,
        uses_count     INTEGER     NOT NULL DEFAULT 0,
        max_uses       INTEGER     NOT NULL DEFAULT 1,
        expires_at     TIMESTAMPTZ
      )
    `);
    await pool.query(`
      CREATE TABLE IF NOT EXISTS coupon_redemptions (
        id         SERIAL PRIMARY KEY,
        coupon_id  INTEGER     NOT NULL,
        user_id    TEXT        NOT NULL,
        session_id INTEGER,
        created_at TIMESTAMPTZ NOT NULL DEFAULT now()
      )
    `);
    // Seed test coupon — ₹498 off, 10 uses
    await pool.query(`
      INSERT INTO coupons (code, type, discount_value, max_uses)
      VALUES ('ZING@498', 'flat', 498, 10)
      ON CONFLICT (code) DO NOTHING
    `);
    // Nudge coupon — ₹100 off, high volume
    await pool.query(`
      INSERT INTO coupons (code, type, discount_value, max_uses)
      VALUES ('SAVE100', 'flat', 100, 10000)
      ON CONFLICT (code) DO NOTHING
    `);
    // Referral coupon — ₹100 off, included in report delivery email
    await pool.query(`
      INSERT INTO coupons (code, type, discount_value, max_uses)
      VALUES ('GOAL26', 'flat', 100, 10000)
      ON CONFLICT (code) DO NOTHING
    `);
    // Internal test coupon — free, unlimited uses, for santosh180181@gmail.com
    await pool.query(`
      INSERT INTO coupons (code, type, discount_value, max_uses)
      VALUES ('S@NT1801', 'free', 0, 99999)
      ON CONFLICT (code) DO NOTHING
    `);
    await pool.query(`
      CREATE TABLE IF NOT EXISTS nudge_log (
        id        SERIAL PRIMARY KEY,
        email     TEXT    NOT NULL,
        nudge_day INTEGER NOT NULL,
        sent_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
        UNIQUE (email, nudge_day)
      )
    `);
    console.log('[db] coupons + nudge_log ready');
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_sessions_user_id           ON sessions(user_id)`);
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_sessions_created_at        ON sessions(created_at)`);
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_report_queue_email_status  ON report_queue(LOWER(email), status)`);
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_otp_codes_email            ON otp_codes(email, used, expires_at)`);
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_coupon_redemptions_user    ON coupon_redemptions(user_id)`);
    console.log('[db] indexes ready');
  } catch (err) {
    console.error('[db] initDb failed:', err.message);
  }
}

// ── API proxy ─────────────────────────────────────────────────────────────────
// OPENROUTER_KEY lives only in Railway env vars — never in the client bundle
app.post('/api/veg', async (req, res) => {
  const key = process.env.OPENROUTER_KEY;
  if (!key) {
    return res.status(500).json({ error: 'API key not configured on server' });
  }

  const ip = req.ip || 'unknown';
  const vegEntry = vegRateLog.get(ip) || { count: 0, windowStart: Date.now() };
  if (Date.now() - vegEntry.windowStart > VEG_WINDOW_MS) {
    vegEntry.count = 0; vegEntry.windowStart = Date.now();
  }
  if (++vegEntry.count > VEG_MAX_PER_WINDOW) {
    vegRateLog.set(ip, vegEntry);
    return res.status(429).json({ error: 'Too many requests. Please wait a moment.' });
  }
  vegRateLog.set(ip, vegEntry);

  const { prompt } = req.body;
  if (!prompt || typeof prompt !== 'string') {
    return res.status(400).json({ error: 'Missing prompt' });
  }

  try {
    const upstream = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${key}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://edu.atrios.in',
        'X-Title': 'CareerShifu',
      },
      body: JSON.stringify({
        model: 'anthropic/claude-haiku-4-5',
        max_tokens: 2000,
        messages: [
          { role: 'system', content: 'You output only valid JSON. No explanation, no preamble, no markdown. Your entire response must be parseable by JSON.parse().' },
          { role: 'user', content: prompt },
        ],
      }),
    });

    if (!upstream.ok) {
      const err = await upstream.text();
      return res.status(upstream.status).json({ error: err });
    }

    const data = await upstream.json();
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── Save session ─────────────────────────────────────────────────────────────
app.post('/api/session', async (req, res) => {
  if (!pool) return res.status(503).json({ error: 'DB not configured' });

  const ip = req.ip || 'unknown';
  const sEntry = sessionRateLog.get(ip) || { count: 0, windowStart: Date.now() };
  if (Date.now() - sEntry.windowStart > SESSION_WINDOW_MS) {
    sEntry.count = 0; sEntry.windowStart = Date.now();
  }
  if (++sEntry.count > SESSION_MAX) {
    sessionRateLog.set(ip, sEntry);
    return res.status(429).json({ error: 'Too many requests. Please wait a moment.' });
  }
  sessionRateLog.set(ip, sEntry);

  const { grade, answers, result, userId } = req.body;
  if (!answers || !result) return res.status(400).json({ error: 'Missing data' });

  try {
    const { rows } = await pool.query(
      'INSERT INTO sessions (grade, answers, result, user_id) VALUES ($1, $2, $3, $4) RETURNING id',
      [grade, answers, result, userId || null]
    );
    res.json({ sessionId: rows[0].id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── Latest session for a user (30-day window) ─────────────────────────────────
// Looks up by email (JOIN with users) as primary key — more reliable than user_id
// which can be null if the integer didn't save correctly.
app.get('/api/session/latest', async (req, res) => {
  if (!pool) return res.status(503).json({ error: 'DB not configured' });
  const email = (req.query.email || '').trim().toLowerCase();
  if (!email) return res.status(400).json({ error: 'Missing email' });

  try {
    const { rows } = await pool.query(
      `SELECT s.id, s.grade, s.result, s.created_at
       FROM sessions s
       JOIN users u ON u.id::TEXT = s.user_id
       WHERE u.email = $1
         AND s.created_at > now() - INTERVAL '30 days'
       ORDER BY s.created_at DESC
       LIMIT 1`,
      [email]
    );
    if (rows.length === 0) return res.json({ session: null });

    // Test emails can always retake — skip the returning screen
    if (isTestEmail(email)) return res.json({ session: null });

    const elapsed = Date.now() - new Date(rows[0].created_at).getTime();
    const daysRemaining = 30 - Math.floor(elapsed / (1000 * 60 * 60 * 24));

    res.json({
      session: {
        id: rows[0].id,
        grade: rows[0].grade,
        result: rows[0].result,
        daysRemaining: Math.max(1, daysRemaining),
      },
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── Pro waitlist signup + confirmation email ──────────────────────────────────
app.post('/api/waitlist', async (req, res) => {
  if (!pool) return res.status(503).json({ error: 'DB not configured' });
  const { name, phone, email, grade, sessionId } = req.body;
  if (!name || !phone || !email) return res.status(400).json({ error: 'Missing fields' });

  try {
    await pool.query(
      'INSERT INTO waitlist (name, phone, email, grade, session_id) VALUES ($1, $2, $3, $4, $5)',
      [name, phone, email, grade || null, sessionId || null]
    );
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }

  // Send emails — non-blocking, failure doesn't affect the response
  if (resend) {
    const safeName     = escHtml(name);
    const safePhone    = escHtml(phone);
    const safeEmail    = escHtml(email);
    const safeGrade    = escHtml(grade || '—');
    const safeSession  = escHtml(sessionId || '—');

    // Confirmation to user
    resend.emails.send({
      from: 'CareerShifu <contact@careershifu.com>',
      to: email,
      subject: "Your CareerShifu Report: request received",
      html: `
        <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:24px;color:#1a1a1a">
          <h2 style="margin:0 0 8px;color:#E8541A">Got it, ${safeName}.</h2>
          <p style="margin:0 0 20px;color:#555">We'll be in touch by email to complete your order and send your report.</p>
          <p style="margin:0 0 8px;font-weight:600">Your report includes:</p>
          <ul style="padding-left:20px;color:#444;line-height:1.8">
            <li><strong>Full report PDF</strong>: Strengths, traits, all domain paths, and a parent summary</li>
            <li><strong>Activity tracker</strong>: 6-8 things to do over the next 3 months, mapped to your results</li>
            <li><strong>Parent summary</strong>: Written for your parents so they understand where you're headed</li>
            <li><strong>All career paths unlocked</strong>: The full list of paths within every domain</li>
          </ul>
          <p style="margin:24px 0 0;color:#888;font-size:13px">The CareerShifu team · <a href="https://app.careershifu.com" style="color:#E8541A">CareerShifu</a></p>
        </div>`,
    }).catch((err) => console.error('Resend user email error:', err));

    // Notification to admin
    const adminEmail = process.env.ADMIN_EMAIL || 'santosh.abraham@atrios.in';
    resend.emails.send({
      from: 'CareerShifu <contact@careershifu.com>',
      to: adminEmail,
      subject: `New Pro lead: ${safeName}`,
      html: `
        <p><strong>Name:</strong> ${safeName}</p>
        <p><strong>Phone:</strong> ${safePhone}</p>
        <p><strong>Email:</strong> ${safeEmail}</p>
        <p><strong>Grade:</strong> ${safeGrade}</p>
        <p><strong>Session ID:</strong> ${safeSession}</p>`,
    }).catch((err) => console.error('Resend admin email error:', err));
  }

  res.json({ ok: true });
});

// ── Dev-mode OTP store (used when DATABASE_URL is not set) ───────────────────
const devOtpStore = new Map(); // email → { code, expires }

// Purge expired dev entries every 10 minutes
setInterval(() => {
  const now = Date.now();
  for (const [k, v] of devOtpStore) { if (v.expires < now) devOtpStore.delete(k); }
}, 10 * 60 * 1000);

// ── Auth: send OTP via Resend ─────────────────────────────────────────────────
app.post('/api/auth/otp/send', async (req, res) => {
  const { email } = req.body;
  if (!email || typeof email !== 'string' || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
    return res.status(400).json({ error: 'Valid email required' });
  }

  const normalEmail = email.trim().toLowerCase();

  // 1 OTP per 60 seconds per email
  const lastSent = otpSendLog.get(normalEmail) || 0;
  if (Date.now() - lastSent < OTP_SEND_COOLDOWN_MS) {
    const retryAfter = Math.ceil((OTP_SEND_COOLDOWN_MS - (Date.now() - lastSent)) / 1000);
    return res.status(429).json({ error: `Please wait ${retryAfter}s before requesting another code.` });
  }
  otpSendLog.set(normalEmail, Date.now());

  const code = String(Math.floor(100000 + Math.random() * 900000));
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

  // ── Persist code: DB if available, else in-memory dev store ─────────────
  if (pool) {
    try {
      await pool.query(
        'INSERT INTO otp_codes (email, code, expires_at) VALUES ($1, $2, $3)',
        [normalEmail, code, expiresAt]
      );
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  } else {
    devOtpStore.set(normalEmail, { code, expires: expiresAt.getTime() });
    console.log(`\n[DEV] OTP for ${normalEmail}: ${code}\n`);
  }

  // ── Send email via Resend (works with or without DB) ─────────────────────
  if (resend) {
    resend.emails.send({
      from: 'CareerShifu <contact@careershifu.com>',
      to: email.trim(),
      subject: 'Your CareerShifu verification code',
      html: `
        <div style="font-family:sans-serif;max-width:420px;margin:0 auto;padding:32px 24px;color:#1a1a1a">
          <p style="margin:0 0 8px;font-size:14px;color:#666">CareerShifu · Virtual Edu Guide</p>
          <h2 style="margin:0 0 24px;font-size:24px;color:#26215C">Your verification code</h2>
          <div style="background:#EEEDFE;border-radius:12px;padding:24px;text-align:center;margin-bottom:24px">
            <span style="font-size:40px;font-weight:800;letter-spacing:8px;color:#3C3489">${code}</span>
          </div>
          <p style="margin:0 0 8px;font-size:14px;color:#555">This code expires in <strong>10 minutes</strong>.</p>
          <p style="margin:0;font-size:13px;color:#999">If you didn't request this, you can safely ignore this email.</p>
        </div>`,
    }).catch((err) => console.error('OTP email error:', err));
  }

  res.json({ ok: true });
});

// ── Auth: verify OTP + upsert user ───────────────────────────────────────────
app.post('/api/auth/otp/verify', async (req, res) => {
  const { email, code, grade } = req.body;
  if (!email || !code) return res.status(400).json({ error: 'Missing fields' });

  const normalEmail = email.trim().toLowerCase();

  // Brute-force guard: 3 attempts per 15 min per email
  const entry = otpAttempts.get(normalEmail) || { count: 0, windowStart: Date.now() };
  if (Date.now() - entry.windowStart > OTP_ATTEMPT_WINDOW_MS) {
    entry.count = 0; entry.windowStart = Date.now();
  }
  if (entry.count >= OTP_MAX_ATTEMPTS) {
    otpAttempts.set(normalEmail, entry);
    return res.status(429).json({ error: 'Too many attempts. Please request a new code.' });
  }
  entry.count++;
  otpAttempts.set(normalEmail, entry);

  // ── Dev fallback: no DB → check in-memory store ───────────────────────────
  if (!pool) {
    const stored = devOtpStore.get(normalEmail);
    if (!stored || stored.code !== String(code) || stored.expires < Date.now()) {
      return res.status(401).json({ error: 'Invalid or expired code. Please try again.' });
    }
    devOtpStore.delete(normalEmail);
    otpAttempts.delete(normalEmail);
    return res.json({ ok: true, userId: `dev-${normalEmail}` });
  }

  try {
    // Find valid, unused, unexpired code
    const { rows } = await pool.query(
      `SELECT id FROM otp_codes
       WHERE email = $1 AND code = $2 AND used = false AND expires_at > now()
       ORDER BY created_at DESC LIMIT 1`,
      [normalEmail, String(code)]
    );

    if (rows.length === 0) {
      return res.status(401).json({ error: 'Invalid or expired code. Please try again.' });
    }

    // Mark used
    await pool.query('UPDATE otp_codes SET used = true WHERE id = $1', [rows[0].id]);

    // Upsert user
    const { rows: userRows } = await pool.query(
      `INSERT INTO users (email, grade) VALUES ($1, $2)
       ON CONFLICT (email) DO UPDATE SET grade = EXCLUDED.grade
       RETURNING id`,
      [normalEmail, grade || null]
    );

    otpAttempts.delete(normalEmail);
    res.json({ ok: true, userId: userRows[0].id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── Coupon: validate (read-only, does not consume a use) ─────────────────────
app.post('/api/coupon/validate', async (req, res) => {
  if (!pool) return res.status(503).json({ valid: false, error: 'DB not configured' });

  // Rate limit by IP: 10 checks per minute
  const ip = req.ip || 'unknown';
  const cvEntry = couponValidateLog.get(ip) || { count: 0, windowStart: Date.now() };
  if (Date.now() - cvEntry.windowStart > COUPON_WINDOW_MS) {
    cvEntry.count = 0; cvEntry.windowStart = Date.now();
  }
  if (++cvEntry.count > COUPON_MAX_PER_WINDOW) {
    couponValidateLog.set(ip, cvEntry);
    return res.status(429).json({ valid: false, error: 'Too many attempts. Please wait a minute.' });
  }
  couponValidateLog.set(ip, cvEntry);

  const { code, userId, email } = req.body || {};
  if (!code || typeof code !== 'string') {
    return res.status(400).json({ valid: false, error: 'Enter a coupon code.' });
  }

  const normalCode = code.trim().toUpperCase();

  // Alphanumeric only, max 20 chars
  if (!/^[A-Z0-9@]{1,20}$/.test(normalCode)) {
    return res.status(400).json({ valid: false, error: 'Invalid coupon code format.' });
  }

  try {
    const { rows } = await pool.query(
      `SELECT id, type, discount_value
       FROM coupons
       WHERE code = $1
         AND active = true
         AND uses_count < max_uses
         AND (expires_at IS NULL OR expires_at > now())`,
      [normalCode]
    );

    if (rows.length === 0) {
      return res.json({ valid: false, error: 'Invalid or expired coupon code.' });
    }

    // If userId provided, check prior redemption (any coupon — 1 report per account)
    // Bypass for test emails so they can re-run unlimited times
    if (userId && !isTestEmail(email)) {
      const { rows: used } = await pool.query(
        'SELECT 1 FROM coupon_redemptions WHERE user_id = $1',
        [String(userId)]
      );
      if (used.length > 0) {
        return res.json({ valid: false, error: 'A report has already been redeemed on this account.' });
      }
    }

    res.json({ valid: true, type: rows[0].type, discountValue: rows[0].discount_value, code: normalCode });
  } catch (err) {
    res.status(500).json({ valid: false, error: err.message });
  }
});

// ── Coupon: redeem (consumes a use, triggers report delivery) ─────────────────
app.post('/api/coupon/redeem', async (req, res) => {
  if (!pool) return res.status(503).json({ error: 'DB not configured' });

  const ip = req.ip || 'unknown';
  const rEntry = redeemRateLog.get(ip) || { count: 0, windowStart: Date.now() };
  if (Date.now() - rEntry.windowStart > REDEEM_WINDOW_MS) {
    rEntry.count = 0; rEntry.windowStart = Date.now();
  }
  if (++rEntry.count > REDEEM_MAX) {
    redeemRateLog.set(ip, rEntry);
    return res.status(429).json({ error: 'Too many requests. Please wait a moment.' });
  }
  redeemRateLog.set(ip, rEntry);

  const { code, userId, sessionId, email } = req.body;
  if (!code || !userId || !email) {
    return res.status(400).json({ error: 'Missing required fields.' });
  }

  const normalCode = code.trim().toUpperCase();
  if (!/^[A-Z0-9@]{1,20}$/.test(normalCode)) {
    return res.status(400).json({ error: 'Invalid coupon code format.' });
  }

  const client = await pool.connect();
  let queueId = null;

  try {
    await client.query('BEGIN');

    // Re-validate inside transaction (race-safe)
    const { rows } = await client.query(
      `SELECT id, type FROM coupons
       WHERE code = $1 AND active = true
         AND uses_count < max_uses
         AND (expires_at IS NULL OR expires_at > now())
       FOR UPDATE`,
      [normalCode]
    );
    if (rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: 'Coupon no longer valid.' });
    }

    const couponId = rows[0].id;

    // Check not already redeemed by this user (any coupon — 1 report per account)
    // Bypass for test emails so they can re-run unlimited times
    if (!isTestEmail(email)) {
      const { rows: alreadyUsed } = await client.query(
        'SELECT 1 FROM coupon_redemptions WHERE user_id = $1',
        [String(userId)]
      );
      if (alreadyUsed.length > 0) {
        await client.query('ROLLBACK');
        return res.status(400).json({ error: 'A report has already been redeemed on this account.' });
      }
    }

    // Increment uses_count
    await client.query('UPDATE coupons SET uses_count = uses_count + 1 WHERE id = $1', [couponId]);

    // Record redemption
    await client.query(
      'INSERT INTO coupon_redemptions (coupon_id, user_id, session_id) VALUES ($1, $2, $3)',
      [couponId, String(userId), sessionId || null]
    );

    // Queue report generation
    const { rows: qRows } = await client.query(
      `INSERT INTO report_queue (session_id, user_id, email, status)
       VALUES ($1, $2, $3, 'pending') RETURNING id`,
      [sessionId || null, String(userId), email]
    );
    queueId = qRows[0].id;

    await client.query('COMMIT');
  } catch (err) {
    await client.query('ROLLBACK');
    return res.status(500).json({ error: err.message });
  } finally {
    client.release();
  }

  // Trigger queue drain — spawns immediately if a slot is free, queues otherwise
  if (queueId != null) {
    drainReportQueue().catch(() => {});
  } else {
    console.error(`[report] queueId is null — PDF will not be generated for email=${email}`);
  }

  // Send emails — non-blocking
  if (resend) {
    const safeEmail   = escHtml(email);
    const safeCode    = escHtml(normalCode);
    const safeUserId  = escHtml(String(userId));
    const safeSession = escHtml(sessionId ? String(sessionId) : '—');

    resend.emails.send({
      from: 'CareerShifu <contact@careershifu.com>',
      to: email,
      subject: 'Request Confirmed | Your CareerShifu Report',
      html: `
        <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:24px;color:#1a1a1a">
          <h2 style="margin:0 0 16px;color:#3C3489">Your request is confirmed!</h2>
          <p style="margin:0 0 16px;color:#555;line-height:1.6">
            We are currently preparing your personalized CareerShifu Report, which will be sent
            to <strong>${safeEmail}</strong> within 24 hours.
          </p>
          <p style="margin:0 0 16px;color:#555;line-height:1.6">
            To respect your privacy, we have not collected your name or phone number,
            as we have no intention of spamming you. We hope this report provides
            the detail and clarity you are looking for.
          </p>
          <p style="margin:24px 0 0;color:#888;font-size:13px">Regards<br>The CareerShifu Team</p>
        </div>`,
    }).catch((err) => console.error('Coupon redeem user email error:', err));

    const adminEmail = process.env.ADMIN_EMAIL || 'santosh.abraham@atrios.in';
    resend.emails.send({
      from: 'CareerShifu <contact@careershifu.com>',
      to: adminEmail,
      subject: `Report request: coupon ${safeCode}`,
      html: `
        <p><strong>Email:</strong> ${safeEmail}</p>
        <p><strong>User ID:</strong> ${safeUserId}</p>
        <p><strong>Session ID:</strong> ${safeSession}</p>
        <p><strong>Coupon:</strong> ${safeCode}</p>
        <p><strong>Queue ID:</strong> ${queueId ?? '—'}</p>`,
    }).catch((err) => console.error('Coupon redeem admin email error:', err));
  }

  res.json({ ok: true });
});

// ── Report: status check + resend ────────────────────────────────────────────
app.get('/api/report/status', async (req, res) => {
  if (!pool) return res.json({ sent: false });
  const email = (req.query.email || '').trim().toLowerCase();
  if (!email) return res.json({ sent: false });
  try {
    const { rows } = await pool.query(
      `SELECT updated_at FROM report_queue
       WHERE LOWER(email) = $1 AND status = 'done'
       ORDER BY updated_at DESC LIMIT 1`,
      [email]
    );
    if (rows.length === 0) return res.json({ sent: false });
    const elapsed = Date.now() - new Date(rows[0].updated_at).getTime();
    const cooldownMs = 30 * 60 * 1000;
    const secondsUntilResend = elapsed >= cooldownMs ? 0 : Math.ceil((cooldownMs - elapsed) / 1000);
    res.json({ sent: true, secondsUntilResend });
  } catch { res.json({ sent: false }); }
});

app.post('/api/report/resend', async (req, res) => {
  if (!pool) return res.status(503).json({ error: 'DB not configured' });
  const { email } = req.body;
  if (!email) return res.status(400).json({ error: 'Missing email' });
  const normalEmail = email.trim().toLowerCase();
  try {
    const { rows } = await pool.query(
      `SELECT session_id, user_id, updated_at FROM report_queue
       WHERE LOWER(email) = $1 AND status = 'done'
       ORDER BY updated_at DESC LIMIT 1`,
      [normalEmail]
    );
    if (rows.length === 0) return res.status(404).json({ error: 'No completed report found.' });
    const elapsed = Date.now() - new Date(rows[0].updated_at).getTime();
    const cooldownMs = 30 * 60 * 1000;
    if (elapsed < cooldownMs) {
      return res.status(429).json({ error: 'Too soon to resend.', secondsRemaining: Math.ceil((cooldownMs - elapsed) / 1000) });
    }
    const { rows: qRows } = await pool.query(
      `INSERT INTO report_queue (session_id, user_id, email, status)
       VALUES ($1, $2, $3, 'pending') RETURNING id`,
      [rows[0].session_id, rows[0].user_id, normalEmail]
    );
    const queueId = qRows[0]?.id;
    if (queueId) drainReportQueue().catch(() => {});
    res.json({ ok: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ── Payment: create Razorpay order ────────────────────────────────────────────
app.post('/api/payment/create-order', async (req, res) => {
  if (!razorpay) return res.status(503).json({ error: 'Payment not configured' });
  const { amount, sessionId, userId, email, type } = req.body;
  if (!amount || !email) return res.status(400).json({ error: 'Missing amount or email' });
  try {
    const order = await razorpay.orders.create({
      amount: Math.round(Number(amount) * 100), // paise
      currency: 'INR',
      receipt: `cs_${type || 'report'}_${Date.now()}`,
      notes: {
        sessionId: String(sessionId || ''),
        userId: String(userId || ''),
        email,
        type: type || 'report',
      },
    });
    res.json({ orderId: order.id, amount: order.amount, currency: order.currency });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── Payment: Razorpay webhook → queue report ──────────────────────────────────
app.post('/api/payment/webhook', async (req, res) => {
  const sig = req.headers['x-razorpay-signature'];
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
  if (!secret) return res.status(503).json({ error: 'Webhook secret not configured' });
  if (!sig)    return res.status(400).json({ error: 'Missing signature' });

  const expected = crypto.createHmac('sha256', secret).update(req.rawBody).digest('hex');
  if (sig !== expected) return res.status(400).json({ error: 'Invalid signature' });

  try {
    const event = JSON.parse(req.rawBody);
    if (event.event === 'payment.captured') {
      const notes = event.payload?.payment?.entity?.notes || {};
      const { sessionId, userId, email, type } = notes;
      const adminEmail = process.env.ADMIN_EMAIL || 'santosh.abraham@atrios.in';

      if (email && pool) {
        const queueId = await pool.query(
          `INSERT INTO report_queue (session_id, user_id, email, status)
           VALUES ($1, $2, $3, 'pending') RETURNING id`,
          [sessionId || null, userId || '', email]
        ).then(r => r.rows[0]?.id);

        if (queueId != null) {
          drainReportQueue().catch(() => {});
        } else {
          console.error(`[report] queueId is null — PDF will not be generated for email=${email}`);
        }

        const amount = event.payload?.payment?.entity?.amount;
        const amountRs = amount ? `₹${(amount / 100).toFixed(0)}` : '—';

        if (resend) {
          // Admin notification
          resend.emails.send({
            from: 'CareerShifu <contact@careershifu.com>',
            to: adminEmail,
            subject: `Payment received — ${type || 'report'} ${amountRs} — ${escHtml(email)}`,
            html: `
              <p><strong>Email:</strong> ${escHtml(email)}</p>
              <p><strong>Amount:</strong> ${amountRs}</p>
              <p><strong>Type:</strong> ${escHtml(type || 'report')}</p>
              <p><strong>User ID:</strong> ${escHtml(userId || '—')}</p>
              <p><strong>Session ID:</strong> ${escHtml(sessionId || '—')}</p>
              <p><strong>Queue ID:</strong> ${queueId ?? '—'}</p>`,
          }).catch(err => console.error('Webhook admin email error:', err));

          // Customer confirmation
          resend.emails.send({
            from: 'CareerShifu <contact@careershifu.com>',
            to: email,
            subject: 'Your CareerShifu Report is on its way',
            html: `
              <p>Hi,</p>
              <p>We've received your payment of ${amountRs}. Your personalised CareerShifu Report will be sent to this email within 24 hours.</p>
              <p>If you have any questions, just reply to this email.</p>
              <p>— CareerShifu Team</p>`,
          }).catch(err => console.error('Webhook customer email error:', err));
        }
      }
    }
    res.json({ ok: true });
  } catch (err) {
    console.error('Webhook processing error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// ── Nudge emails: day 7 / 15 / 25 for users who haven't downloaded their report ─
const NUDGE_CONFIGS = [
  {
    day: 7,
    subject: 'You figured out how you think. Here\'s what comes next.',
    html: (email) => `
      <div style="font-family:sans-serif;max-width:520px;margin:0 auto;padding:28px 24px;color:#1a1a1a">
        <p style="margin:0 0 6px;font-size:13px;color:#a53600;font-weight:600;letter-spacing:0.5px;text-transform:uppercase">CareerShifu</p>
        <h2 style="margin:0 0 20px;font-size:22px;font-weight:800;color:#1f1b18;line-height:1.3">You figured out how you think.<br>Here's what comes next.</h2>
        <p style="margin:0 0 16px;line-height:1.7;color:#333">A week ago you mapped how you actually think, what kind of problems pull you in, and what matters to you. Most people don't do that. They follow the nearest path, not the right one.</p>
        <p style="margin:0 0 16px;line-height:1.7;color:#333">Your CareerShifu Report takes those signals further: specific career domains, all 5 paths per domain (you've only seen 2), stream and subject guidance, and a parent summary so that conversation doesn't have to start from scratch.</p>
        <p style="margin:0 0 24px;line-height:1.7;color:#333">Use code <strong style="color:#a53600;font-size:16px">SAVE100</strong> at checkout: ₹100 off, brings it to <strong>₹399</strong>.</p>
        <a href="https://app.careershifu.com" style="display:inline-block;background:#a53600;color:#fff;text-decoration:none;padding:13px 28px;border-radius:8px;font-weight:700;font-size:15px;margin-bottom:24px">Get my CareerShifu Report: ₹399 →</a>
        <p style="margin:0 0 4px;font-size:13px;color:#888">Your results are valid for 30 days from when you took the assessment.</p>
        <hr style="border:none;border-top:1px solid #eee;margin:20px 0">
        <p style="margin:0;font-size:13px;color:#aaa">CareerShifu · <a href="https://app.careershifu.com" style="color:#aaa">app.careershifu.com</a></p>
      </div>`,
  },
  {
    day: 15,
    subject: '15 days left. Your results + ₹100 off.',
    html: (email) => `
      <div style="font-family:sans-serif;max-width:520px;margin:0 auto;padding:28px 24px;color:#1a1a1a">
        <p style="margin:0 0 6px;font-size:13px;color:#a53600;font-weight:600;letter-spacing:0.5px;text-transform:uppercase">CareerShifu</p>
        <h2 style="margin:0 0 20px;font-size:22px;font-weight:800;color:#1f1b18;line-height:1.3">You're halfway through your window.</h2>
        <p style="margin:0 0 16px;line-height:1.7;color:#333">15 days left before your CareerShifu results expire. The thinking you put into that assessment: how you solve problems, what pulls your attention, what you actually care about. It's sitting there, specific to you.</p>
        <p style="margin:0 0 16px;line-height:1.7;color:#333">The full report takes it from "interesting" to "here's what to actually do": stream guidance, career paths mapped to how you think, and a parent summary built from your answers.</p>
        <p style="margin:0 0 24px;line-height:1.7;color:#333">Code <strong style="color:#a53600;font-size:16px">SAVE100</strong> still works: <strong>₹399 today</strong>.</p>
        <a href="https://app.careershifu.com" style="display:inline-block;background:#a53600;color:#fff;text-decoration:none;padding:13px 28px;border-radius:8px;font-weight:700;font-size:15px;margin-bottom:24px">Claim my report before it expires →</a>
        <p style="margin:0 0 4px;font-size:13px;color:#888">Results expire 30 days from your assessment date.</p>
        <hr style="border:none;border-top:1px solid #eee;margin:20px 0">
        <p style="margin:0;font-size:13px;color:#aaa">CareerShifu · <a href="https://app.careershifu.com" style="color:#aaa">app.careershifu.com</a></p>
      </div>`,
  },
  {
    day: 25,
    subject: 'Last reminder: 5 days left before your results expire',
    html: (email) => `
      <div style="font-family:sans-serif;max-width:520px;margin:0 auto;padding:28px 24px;color:#1a1a1a">
        <p style="margin:0 0 6px;font-size:13px;color:#a53600;font-weight:600;letter-spacing:0.5px;text-transform:uppercase">CareerShifu · Final reminder</p>
        <h2 style="margin:0 0 20px;font-size:22px;font-weight:800;color:#1f1b18;line-height:1.3">5 days left.<br>Then your results are gone.</h2>
        <p style="margin:0 0 16px;line-height:1.7;color:#333">This is the last time we'll write about this.</p>
        <p style="margin:0 0 16px;line-height:1.7;color:#333">Your CareerShifu results expire in 5 days. After that, the session closes and you'd need to take the assessment again. If you've been on the fence, this is the moment.</p>
        <p style="margin:0 0 16px;line-height:1.7;color:#333">The report gives you the full picture: all 15 career paths across your 3 domains, a thinking-style breakdown, stream and subject guidance, a 30-day action plan, and a parent summary written so you don't have to explain it yourself.</p>
        <p style="margin:0 0 24px;line-height:1.7;color:#333">Code <strong style="color:#a53600;font-size:16px">SAVE100</strong> is still valid: <strong>₹399</strong>. Final 5 days.</p>
        <a href="https://app.careershifu.com" style="display:inline-block;background:#a53600;color:#fff;text-decoration:none;padding:13px 28px;border-radius:8px;font-weight:700;font-size:15px;margin-bottom:24px">Get the report: last chance →</a>
        <hr style="border:none;border-top:1px solid #eee;margin:20px 0">
        <p style="margin:0;font-size:13px;color:#aaa">CareerShifu · <a href="https://app.careershifu.com" style="color:#aaa">app.careershifu.com</a></p>
      </div>`,
  },
];

async function runNudgeCheck() {
  if (!pool || !resend) return;
  for (const { day, subject, html } of NUDGE_CONFIGS) {
    try {
      const { rows } = await pool.query(
        `SELECT DISTINCT LOWER(u.email) AS email
         FROM sessions s
         JOIN users u ON u.id::TEXT = s.user_id
         WHERE s.created_at BETWEEN now() - INTERVAL '${day} days' - INTERVAL '12 hours'
                                AND now() - INTERVAL '${day} days' + INTERVAL '12 hours'
           AND NOT EXISTS (
             SELECT 1 FROM report_queue rq
             WHERE LOWER(rq.email) = LOWER(u.email) AND rq.status = 'done'
           )
           AND NOT EXISTS (
             SELECT 1 FROM nudge_log nl
             WHERE LOWER(nl.email) = LOWER(u.email) AND nl.nudge_day = ${day}
           )`
      );
      console.log(`[nudge] day ${day}: ${rows.length} email(s) to send`);
      for (const { email } of rows) {
        try {
          await resend.emails.send({
            from: 'CareerShifu <contact@careershifu.com>',
            to: email,
            subject,
            html: html(email),
          });
          await pool.query(
            'INSERT INTO nudge_log (email, nudge_day) VALUES ($1, $2) ON CONFLICT DO NOTHING',
            [email, day]
          );
          console.log(`[nudge] day ${day} sent to ${email}`);
        } catch (err) {
          console.error(`[nudge] day ${day} failed for ${email}:`, err.message);
        }
      }
    } catch (err) {
      console.error(`[nudge] day ${day} query failed:`, err.message);
    }
  }
}

// ── Health check ──────────────────────────────────────────────────────────────
app.get('/api/health', async (req, res) => {
  if (!pool) return res.json({ status: 'ok', db: false, activeReports });
  try {
    const { rows } = await pool.query(
      `SELECT status, COUNT(*) AS count FROM report_queue
       WHERE created_at > now() - INTERVAL '24 hours'
       GROUP BY status`
    );
    const queue = Object.fromEntries(rows.map(r => [r.status, parseInt(r.count)]));
    res.json({ status: 'ok', db: true, activeReports, queue });
  } catch (err) {
    res.status(500).json({ status: 'error', error: err.message });
  }
});

// ── Static files (built Vite app) ─────────────────────────────────────────────
app.use(express.static(join(__dirname, 'dist')));

// SPA fallback — all unmatched routes serve index.html
app.get('*', (_req, res) => {
  res.sendFile(join(__dirname, 'dist', 'index.html'));
});

initDb().then(() => {
  app.listen(PORT, () => {
    console.log(`CareerShifu server running on port ${PORT}`);
  });

  // Drain pending reports on startup and every 30s
  drainReportQueue().catch(err => console.error('[drain] startup drain failed:', err.message));
  setInterval(() => {
    drainReportQueue().catch(err => console.error('[drain] interval failed:', err.message));
  }, 30_000);

  // Alert on reports stuck in 'generating' >30 min (process died without updating status)
  if (pool) {
    setInterval(async () => {
      try {
        const { rows } = await pool.query(
          `UPDATE report_queue SET status = 'failed', error = 'stuck >30min', updated_at = now()
           WHERE status = 'generating' AND updated_at < now() - INTERVAL '30 minutes'
           RETURNING id`
        );
        for (const { id } of rows) {
          console.error(`[stuck] queue_id=${id} was generating >30min, marked failed`);
          sendAdminAlert('stuck', id).catch(() => {});
        }
      } catch (err) {
        console.error('[stuck] check failed:', err.message);
      }
    }, 30 * 60 * 1000);
  }

  // Prune stale rate-limit map entries every 15 minutes
  setInterval(() => {
    const now = Date.now();
    for (const [map, windowMs] of [
      [otpSendLog,        OTP_SEND_COOLDOWN_MS],
      [otpAttempts,       OTP_ATTEMPT_WINDOW_MS],
      [vegRateLog,        VEG_WINDOW_MS],
      [couponValidateLog, COUPON_WINDOW_MS],
      [sessionRateLog,    SESSION_WINDOW_MS],
      [redeemRateLog,     REDEEM_WINDOW_MS],
    ]) {
      for (const [k, v] of map) {
        const ts = typeof v === 'number' ? v : v.windowStart;
        if (now - ts > windowMs * 2) map.delete(k);
      }
    }
  }, 15 * 60 * 1000);

  if (pool && resend) {
    runNudgeCheck().catch(err => console.error('[nudge] startup run failed:', err.message));
    setInterval(() => {
      runNudgeCheck().catch(err => console.error('[nudge] scheduled run failed:', err.message));
    }, 6 * 60 * 60 * 1000);
  }
});
