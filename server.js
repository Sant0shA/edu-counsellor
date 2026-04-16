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
        max_tokens: 1200,
        messages: [{ role: 'user', content: prompt }],
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
    // Confirmation to user
    resend.emails.send({
      from: 'CareerMap <hello@edu.atrios.in>',
      to: email,
      subject: "You're on the CareerMap Pro list",
      html: `
        <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:24px;color:#1a1a1a">
          <h2 style="margin:0 0 8px;color:#E8541A">You're on the list, ${name}.</h2>
          <p style="margin:0 0 20px;color:#555">We'll reach out on WhatsApp (<strong>${phone}</strong>) as soon as CareerMap Pro launches.</p>
          <p style="margin:0 0 8px;font-weight:600">Here's what Pro includes:</p>
          <ul style="padding-left:20px;color:#444;line-height:1.8">
            <li><strong>Detailed PDF report</strong> — Personality profile, strengths breakdown, and a parent summary</li>
            <li><strong>Advanced Virtual Counselling</strong> — Helping you find the right academic institutes for your path</li>
            <li><strong>Career handholding</strong> — Monthly check-ins, goal tracking, and curated next steps</li>
            <li><strong>Expert session invites</strong> — Live sessions with industry leaders — ask them anything</li>
          </ul>
          <p style="margin:24px 0 0;color:#888;font-size:13px">— The CareerMap team · <a href="https://edu.atrios.in" style="color:#E8541A">edu.atrios.in</a></p>
        </div>`,
    }).catch((err) => console.error('Resend user email error:', err));

    // Notification to admin
    const adminEmail = process.env.ADMIN_EMAIL || 'santosh.abraham@atrios.in';
    resend.emails.send({
      from: 'CareerMap <hello@edu.atrios.in>',
      to: adminEmail,
      subject: `New Pro lead: ${name}`,
      html: `
        <p><strong>Name:</strong> ${name}</p>
        <p><strong>Phone:</strong> ${phone}</p>
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>Grade:</strong> ${grade || '—'}</p>
        <p><strong>Session ID:</strong> ${sessionId || '—'}</p>`,
    }).catch((err) => console.error('Resend admin email error:', err));
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
