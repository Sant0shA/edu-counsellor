import { useState } from 'react';
import { submitProInterest } from '../utils/api';

export default function Results({ result, sessionId, grade, onRestart }) {
  const [form, setForm] = useState({ name: '', phone: '', email: '' });
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  if (!result) return null;

  const { headline, observation, question, domains = [], strengths = [] } = result;

  async function handleProSubmit(e) {
    e.preventDefault();
    setFormError('');

    const phoneDigits = form.phone.replace(/\D/g, '');
    const normalised = phoneDigits.startsWith('91') && phoneDigits.length === 12
      ? phoneDigits.slice(2)
      : phoneDigits;
    if (!/^[6-9]\d{9}$/.test(normalised)) {
      setFormError('Enter a valid 10-digit Indian mobile number.');
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) {
      setFormError('Enter a valid email address.');
      return;
    }

    setSubmitting(true);
    try {
      await submitProInterest({ ...form, grade, sessionId });
      setSubmitted(true);
    } catch {
      setFormError('Something went wrong. Please try again.');
    }
    setSubmitting(false);
  }

  return (
    <div className="screen results-screen">
      <div className="results-header">
        <span className="screen-logo">CareerMap</span>
        <span className="results-badge">Your results</span>
      </div>

      {/* Headline */}
      <div className="headline-card">
        <p className="headline-label">Your Virtual Edu Guide sees</p>
        <h1 className="headline-text">{headline}</h1>
      </div>

      {/* Observation */}
      <div className="observation-card">
        <p className="observation-text">{observation}</p>
      </div>

      {/* Strengths */}
      {strengths.length > 0 && (
        <div className="strengths-section">
          <p className="strengths-title">What stands out about you</p>
          <ul className="strengths-list">
            {strengths.map((s, i) => (
              <li key={i} className="strength-item">{s}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Coaching question */}
      <div className="question-card-result">
        <p className="question-label">Something to sit with</p>
        <p className="question-result-text">"{question}"</p>
      </div>

      {/* Domains */}
      <div className="domains-section">
        <p className="domains-title">Domains worth exploring</p>
        <p className="domains-sub">
          These are starting points — not conclusions. Each domain contains many
          different paths. Use them to explore, not to decide.
        </p>

        {domains.map((d, i) => (
          <div className="domain-card" key={i}>
            <h3 className="domain-name">{d.name}</h3>
            <p className="domain-connection">{d.connection}</p>

            <div className="domain-paths-label">Paths within this domain</div>
            <div className="domain-paths">
              {(d.paths || []).map((p) => (
                <span className="domain-path" key={p}>{p}</span>
              ))}
            </div>

            {d.explore && (
              <div className="explore-box">
                <span className="explore-label">Try this</span>
                <p className="explore-text">{d.explore}</p>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Report card */}
      <div className="pro-card">
        <div className="pro-card-header">
          <span className="pro-badge">Your CareerMap Report</span>
          <p className="pro-card-title">Turn your result into a plan</p>
          <p className="pro-card-sub">
            One report. Your personalised guide for the next few months. ₹99 + GST
          </p>
        </div>
        <ul className="pro-features">
          <li>
            <span className="pro-feat-icon">📄</span>
            <div><strong>Full report PDF</strong><br />Strengths, traits, all domain paths, and a parent summary — yours to keep</div>
          </li>
          <li>
            <span className="pro-feat-icon">🗺️</span>
            <div><strong>Activity tracker</strong><br />6–8 things to do over the next 3 months, mapped to your results</div>
          </li>
          <li>
            <span className="pro-feat-icon">👨‍👩‍👧</span>
            <div><strong>Parent summary</strong><br />A section written for your parents so they understand where you're headed</div>
          </li>
          <li>
            <span className="pro-feat-icon">🎯</span>
            <div><strong>All career paths unlocked</strong><br />The full list of paths within every domain — not just the highlights</div>
          </li>
        </ul>

        {submitted ? (
          <div className="pro-thankyou">
            <p className="pro-thankyou-title">We've got your details</p>
            <p className="pro-thankyou-sub">
              We'll be in touch on WhatsApp to complete your order.<br />Check your email for next steps.
            </p>
          </div>
        ) : (
          <form className="pro-form" onSubmit={handleProSubmit}>
            <input
              className="pro-input"
              type="text"
              placeholder="Your name"
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              required
            />
            <input
              className="pro-input"
              type="tel"
              placeholder="WhatsApp number"
              value={form.phone}
              onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
              required
            />
            <input
              className="pro-input"
              type="email"
              placeholder="Email address"
              value={form.email}
              onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
              required
            />
            {formError && <p className="pro-form-error">{formError}</p>}
            <button className="btn-pro" type="submit" disabled={submitting}>
              {submitting ? 'Saving…' : 'Get your report — ₹99 →'}
            </button>
            <p className="pro-card-note">One-time purchase. We'll reach out on WhatsApp to complete your order.</p>
          </form>
        )}
      </div>

      {/* WhatsApp share */}
      <a
        className="btn-whatsapp"
        href={`https://wa.me/?text=${encodeURIComponent('Take a look at this virtual career guide. Took me 5 mins and I was quite impressed with the feedback 👉 https://edu-counsellor-production.up.railway.app/')}`}
        target="_blank"
        rel="noopener noreferrer"
      >
        Know someone who should try this?
      </a>

      <div className="results-disclaimer">
        These results are based on your responses today and are meant to give you a broad
        starting point — not a final answer. Career paths are shaped by many factors that
        a short assessment can't fully capture. Use this to explore directions that feel
        worth looking into, not to close off others. Your interests and strengths will keep
        evolving — the picture will get clearer as you grow.
      </div>

      <p className="results-footer">CareerMap · Virtual Edu Guide · V1</p>
    </div>
  );
}
