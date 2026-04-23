const DEMO_RESULT = {
  headline: "Quietly curious, widely capable",
  observation:
    "Something stood out — you described following a thread until you've read about it for an hour, and yet you also said structure helps you work. I noticed that combination is rarer than it sounds. You seem to do your best thinking when you're genuinely interested, not just instructed.",
  question:
    "When you imagine yourself doing work you actually enjoy at 25 — what's the part that makes it feel like yours? Not the job title, but what you're actually doing in the room.",
  domains: [
    {
      name: "Technology & Systems",
      connection:
        "The way you described getting absorbed in problems and following threads points toward a mind that enjoys understanding how things work — and building things that do. Students who pick the octopus often end up here.",
      paths: [
        "Software development",
        "Data analysis",
        "Cybersecurity",
        "Product management",
        "Systems design",
        "Robotics & hardware",
      ],
      explore:
        "Spend 30 minutes on CS50 on YouTube — not to become a coder, but to see how building things feels. Notice whether the problem-solving part pulls you in.",
    },
    {
      name: "Research & Discovery",
      connection:
        "You mentioned losing yourself in topics you care about. That kind of sustained attention and appetite for depth is exactly what research environments reward — going deep is the actual job, not a distraction from it.",
      paths: [
        "Scientific research",
        "Medical & clinical research",
        "Journalism & investigation",
        "Policy & social research",
        "Data science",
        "Psychology & behavioural science",
      ],
      explore:
        "Find one long-form article or documentary about a topic you're genuinely curious about and read it end to end. Notice how your brain responds to going that deep.",
    },
    {
      name: "Design & Creative Problem-Solving",
      connection:
        "This might surprise you — design is less about aesthetics and more about solving real problems in ways that feel right to people. The way you approach open-ended situations suggests that kind of thinking comes naturally.",
      paths: [
        "UX & product design",
        "Architecture & spatial design",
        "Brand & communication",
        "Film & documentary",
        "Urban & social design",
        "Game design",
      ],
      explore:
        "Watch a short documentary on how a product you use daily was designed — search 'design of everyday things' on YouTube. Notice what questions it sparks.",
    },
  ],
};

export async function saveSession(grade, answers, result, userId) {
  if (!import.meta.env.PROD) return null;
  try {
    const res = await fetch('/api/session', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ grade, answers, result, userId: userId ?? null }),
    });
    if (!res.ok) return null;
    const data = await res.json();
    return data.sessionId ?? null;
  } catch { return null; }
}

export async function fetchLatestSession(email) {
  if (!import.meta.env.PROD) return null;
  if (!email) return null;
  try {
    const res = await fetch(`/api/session/latest?email=${encodeURIComponent(email)}`);
    if (!res.ok) return null;
    const data = await res.json();
    return data.session ?? null;
  } catch { return null; }
}

export async function submitProInterest({ name, phone, email, grade, sessionId }) {
  const res = await fetch('/api/waitlist', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, phone, email, grade, sessionId }),
  });
  if (!res.ok) throw new Error('Failed to submit');
}

async function parseVEGResponse(response) {
  const data = await response.json();
  const raw = data.choices?.[0]?.message?.content || '';
  const cleaned = raw.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
  try {
    return JSON.parse(cleaned);
  } catch (err) {
    console.error('Model returned non-JSON. Raw output:', raw);
    throw new Error(`Model returned non-JSON: "${raw.slice(0, 120)}"`);
  }
}

export async function callVEG(prompt, attempt = 1) {
  // ── Production: proxy through server (key stays on Railway) ──────────────
  if (import.meta.env.PROD) {
    const response = await fetch('/api/veg', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt }),
    });
    if (!response.ok) {
      const err = await response.json().catch(() => ({ error: response.statusText }));
      throw new Error(`Server error: ${response.status} — ${err.error}`);
    }
    try {
      return await parseVEGResponse(response);
    } catch (err) {
      if (attempt < 2) {
        console.warn('VEG parse failed, retrying...', err.message);
        return callVEG(prompt, 2);
      }
      throw err;
    }
  }

  // ── Development: use VITE_OPENROUTER_KEY from .env.local ─────────────────
  const key = import.meta.env.VITE_OPENROUTER_KEY;

  if (!key || key === 'paste-your-key-here') {
    // Demo mode — no key configured locally
    await new Promise((r) => setTimeout(r, 3200));
    return DEMO_RESULT;
  }

  const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${key}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': window.location.origin,
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

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`OpenRouter error: ${response.status} — ${err}`);
  }

  try {
    return await parseVEGResponse(response);
  } catch (err) {
    if (attempt < 2) {
      console.warn('VEG parse failed, retrying...', err.message);
      return callVEG(prompt, 2);
    }
    throw err;
  }
}
