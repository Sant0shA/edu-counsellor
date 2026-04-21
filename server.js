import express from 'express';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { spawn } from 'child_process';
import pg from 'pg';
import { Resend } from 'resend';

const { Pool } = pg;
const __dirname = dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json({ limit: '64kb' }));
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
const otpSendLog    = new Map(); // email → lastSentMs
const otpAttempts   = new Map(); // email → { count, windowStart }
const vegRateLog          = new Map(); // ip    → { count, windowStart }
const couponValidateLog   = new Map(); // ip    → { count, windowStart }

const OTP_SEND_COOLDOWN_MS   = 60 * 1000;
const OTP_ATTEMPT_WINDOW_MS  = 15 * 60 * 1000;
const OTP_MAX_ATTEMPTS       = 3;
const VEG_WINDOW_MS          = 60 * 1000;
const VEG_MAX_PER_WINDOW     = 10;
const COUPON_WINDOW_MS       = 60 * 1000;
const COUPON_MAX_PER_WINDOW  = 10;

// ── Postgres + Resend clients ─────────────────────────────────────────────────
const pool = process.env.DATABASE_URL
  ? new Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } })
  : null;

const resend = process.env.RESEND_API_KEY
  ? new Resend(process.env.RESEND_API_KEY)
  : null;

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
        'X-Title': 'CareerMap',
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

// ── Save anonymous session ────────────────────────────────────────────────────
app.post('/api/session', async (req, res) => {
  if (!pool) return res.status(503).json({ error: 'DB not configured' });
  const { grade, answers, result } = req.body;
  if (!answers || !result) return res.status(400).json({ error: 'Missing data' });

  try {
    const { rows } = await pool.query(
      'INSERT INTO sessions (grade, answers, result) VALUES ($1, $2, $3) RETURNING id',
      [grade, answers, result]
    );
    res.json({ sessionId: rows[0].id });
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
      from: 'CareerMap <noreply@atrios.in>',
      to: email,
      subject: "Your CareerMap Report — we'll be in touch",
      html: `
        <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:24px;color:#1a1a1a">
          <h2 style="margin:0 0 8px;color:#E8541A">Got it, ${safeName}.</h2>
          <p style="margin:0 0 20px;color:#555">We'll reach out on WhatsApp (<strong>${safePhone}</strong>) to complete your order and send your report.</p>
          <p style="margin:0 0 8px;font-weight:600">Your report includes:</p>
          <ul style="padding-left:20px;color:#444;line-height:1.8">
            <li><strong>Full report PDF</strong> — Strengths, traits, all domain paths, and a parent summary</li>
            <li><strong>Activity tracker</strong> — 6–8 things to do over the next 3 months, mapped to your results</li>
            <li><strong>Parent summary</strong> — Written for your parents so they understand where you're headed</li>
            <li><strong>All career paths unlocked</strong> — The full list of paths within every domain</li>
          </ul>
          <p style="margin:24px 0 0;color:#888;font-size:13px">— The CareerMap team · <a href="https://edu-counsellor-production.up.railway.app" style="color:#E8541A">CareerMap</a></p>
        </div>`,
    }).catch((err) => console.error('Resend user email error:', err));

    // Notification to admin
    const adminEmail = process.env.ADMIN_EMAIL || 'santosh.abraham@atrios.in';
    resend.emails.send({
      from: 'CareerMap <noreply@atrios.in>',
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
      from: 'CareerMap <noreply@atrios.in>',
      to: email.trim(),
      subject: 'Your CareerMap verification code',
      html: `
        <div style="font-family:sans-serif;max-width:420px;margin:0 auto;padding:32px 24px;color:#1a1a1a">
          <p style="margin:0 0 8px;font-size:14px;color:#666">CareerMap · Virtual Edu Guide</p>
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

  const { code, userId } = req.body;
  if (!code || typeof code !== 'string') {
    return res.status(400).json({ valid: false, error: 'Enter a coupon code.' });
  }

  const normalCode = code.trim().toUpperCase();

  // Alphanumeric only, max 20 chars
  if (!/^[A-Z0-9]{1,20}$/.test(normalCode)) {
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

    // If userId provided, check prior redemption
    if (userId) {
      const { rows: used } = await pool.query(
        'SELECT 1 FROM coupon_redemptions WHERE coupon_id = $1 AND user_id = $2',
        [rows[0].id, String(userId)]
      );
      if (used.length > 0) {
        return res.json({ valid: false, error: 'This coupon has already been used.' });
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

  const { code, userId, sessionId, email } = req.body;
  if (!code || !userId || !email) {
    return res.status(400).json({ error: 'Missing required fields.' });
  }

  const normalCode = code.trim().toUpperCase();
  if (!/^[A-Z0-9]{1,20}$/.test(normalCode)) {
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

    // Check not already redeemed by this user
    const { rows: alreadyUsed } = await client.query(
      'SELECT 1 FROM coupon_redemptions WHERE coupon_id = $1 AND user_id = $2',
      [couponId, String(userId)]
    );
    if (alreadyUsed.length > 0) {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: 'This coupon has already been used.' });
    }

    // Increment uses_count
    await client.query('UPDATE coupons SET uses_count = uses_count + 1 WHERE id = $1', [couponId]);

    // Record redemption
    await client.query(
      'INSERT INTO coupon_redemptions (coupon_id, user_id, session_id) VALUES ($1, $2, $3)',
      [couponId, String(userId), sessionId || null]
    );

    // Create report queue entry (table added in Item 3 — fails silently until then)
    try {
      const { rows: qRows } = await client.query(
        `INSERT INTO report_queue (session_id, user_id, email, status)
         VALUES ($1, $2, $3, 'pending') RETURNING id`,
        [sessionId || null, String(userId), email]
      );
      queueId = qRows[0].id;
    } catch (_) { /* report_queue table not yet created */ }

    await client.query('COMMIT');
  } catch (err) {
    await client.query('ROLLBACK');
    return res.status(500).json({ error: err.message });
  } finally {
    client.release();
  }

  // Spawn PDF generator — fire-and-forget (only if queue row was created)
  if (queueId != null) {
    const child = spawn(
      'python3',
      [join(__dirname, 'report/generate.py'), '--queue-id', String(queueId)],
      { detached: true, stdio: 'ignore', env: { ...process.env } },
    );
    child.on('error', (err) => {
      console.error(`[report] spawn failed for queue_id=${queueId}: ${err.message}`);
      if (pool) {
        pool.query(
          "UPDATE report_queue SET status = 'failed', error = $1, updated_at = now() WHERE id = $2",
          [err.message, queueId],
        ).catch(() => {});
      }
    });
    child.unref();
  }

  // Send emails — non-blocking
  if (resend) {
    const safeEmail   = escHtml(email);
    const safeCode    = escHtml(normalCode);
    const safeUserId  = escHtml(String(userId));
    const safeSession = escHtml(sessionId ? String(sessionId) : '—');

    resend.emails.send({
      from: 'CareerMap <noreply@atrios.in>',
      to: email,
      subject: 'Request Confirmed | Your CareerMap Report',
      html: `
        <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:24px;color:#1a1a1a">
          <h2 style="margin:0 0 16px;color:#3C3489">Your request is confirmed!</h2>
          <p style="margin:0 0 16px;color:#555;line-height:1.6">
            We are currently preparing your personalized CareerMap Report, which will be sent
            to <strong>${safeEmail}</strong> within 24 hours.
          </p>
          <p style="margin:0 0 16px;color:#555;line-height:1.6">
            To respect your privacy, we have not collected your name or phone number,
            as we have no intention of spamming you. We hope this report provides
            the detail and clarity you are looking for.
          </p>
          <p style="margin:24px 0 0;color:#888;font-size:13px">Regards<br>The CareerMap Team</p>
        </div>`,
    }).catch((err) => console.error('Coupon redeem user email error:', err));

    const adminEmail = process.env.ADMIN_EMAIL || 'santosh.abraham@atrios.in';
    resend.emails.send({
      from: 'CareerMap <noreply@atrios.in>',
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

// ── Static files (built Vite app) ─────────────────────────────────────────────
app.use(express.static(join(__dirname, 'dist')));

// SPA fallback — all unmatched routes serve index.html
app.get('*', (_req, res) => {
  res.sendFile(join(__dirname, 'dist', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`CareerMap server running on port ${PORT}`);
});
