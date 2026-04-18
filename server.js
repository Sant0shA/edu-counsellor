import express from 'express';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
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
const vegRateLog    = new Map(); // ip    → { count, windowStart }

const OTP_SEND_COOLDOWN_MS   = 60 * 1000;
const OTP_ATTEMPT_WINDOW_MS  = 15 * 60 * 1000;
const OTP_MAX_ATTEMPTS       = 3;
const VEG_WINDOW_MS          = 60 * 1000;
const VEG_MAX_PER_WINDOW     = 10;

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
          <p style="margin:0 0 8px;font-size:14px;color:#666">CareerMap Report — ₹499</p>
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

// ── Static files (built Vite app) ─────────────────────────────────────────────
app.use(express.static(join(__dirname, 'dist')));

// SPA fallback — all unmatched routes serve index.html
app.get('*', (_req, res) => {
  res.sendFile(join(__dirname, 'dist', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`CareerMap server running on port ${PORT}`);
});
