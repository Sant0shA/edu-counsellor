import express from 'express';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { createClient } from '@supabase/supabase-js';
import { Resend } from 'resend';

const __dirname = dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json({ limit: '64kb' }));

// ── Supabase + Resend clients ─────────────────────────────────────────────────
const supabase = process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_KEY
  ? createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY)
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
  if (!supabase) return res.status(503).json({ error: 'DB not configured' });
  const { grade, answers, result } = req.body;
  if (!answers || !result) return res.status(400).json({ error: 'Missing data' });

  const { data, error } = await supabase
    .from('sessions')
    .insert({ grade, answers, result })
    .select('id')
    .single();

  if (error) return res.status(500).json({ error: error.message });
  res.json({ sessionId: data.id });
});

// ── Pro waitlist signup + confirmation email ──────────────────────────────────
app.post('/api/waitlist', async (req, res) => {
  if (!supabase) return res.status(503).json({ error: 'DB not configured' });
  const { name, phone, email, grade, sessionId } = req.body;
  if (!name || !phone || !email) return res.status(400).json({ error: 'Missing fields' });

  const { error } = await supabase
    .from('waitlist')
    .insert({ name, phone, email, grade, session_id: sessionId || null });

  if (error) return res.status(500).json({ error: error.message });

  // Send confirmation email — non-blocking, failure doesn't affect the response
  if (resend) {
    resend.emails.send({
      from: 'CareerMap <hello@edu.atrios.in>',
      to: email,
      subject: "You're on the CareerMap Pro list",
      html: `<p>Hi ${name},</p>
             <p>We've got your details. We'll reach out on WhatsApp (${phone}) when CareerMap Pro launches.</p>
             <p>— The CareerMap team</p>`,
    }).catch((err) => console.error('Resend error:', err));
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
