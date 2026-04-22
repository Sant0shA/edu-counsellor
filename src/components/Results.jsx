import { useState } from 'react';

const GRADE_LABELS = {
  'Class 8 or below': 'Early Explorer',
  'Class 9': 'Early Explorer',
  'Class 10': 'Early Explorer',
  'Class 11': 'Decision Window',
  'Class 12': 'Decision Window',
  'In college / Undergraduate': 'Transition Point',
  'Graduate / Working': 'Transition Point',
};

const VALUE_PROPS = [
  {
    text: <>Always assumed you'd follow a familiar path because that's what everyone around you did? This report looks at <strong>how you actually think</strong> — not just your marks or what's expected.</>,
  },
  {
    text: <>The parent summary is written for your family — not for you. It gives them the language to understand where you're headed, and turns <strong>a difficult conversation into a real one.</strong></>,
  },
  {
    text: <>If you're a parent trying to figure out which subjects or stream to choose — this report gives you something specific to work with. Not generic advice. <strong>Your child's actual signals.</strong></>,
  },
];

export default function Results({ result, sessionId, grade, userId, userEmail, onRestart, daysRemaining }) {
  const [couponOpen, setCouponOpen] = useState(false);
  const [retakeOpen, setRetakeOpen] = useState(false);
  const [couponInput, setCouponInput] = useState('');
  const [couponLoading, setCouponLoading] = useState(false);
  const [couponError, setCouponError] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [redeemLoading, setRedeemLoading] = useState(false);
  const [redeemSuccess, setRedeemSuccess] = useState(false);

  const BASE_PRICE = 499;
  const effectivePrice = !appliedCoupon ? BASE_PRICE
    : appliedCoupon.type === 'free'  ? 0
    : appliedCoupon.type === 'flat'  ? Math.max(0, BASE_PRICE - appliedCoupon.discountValue)
    : Math.round(BASE_PRICE * (1 - appliedCoupon.discountValue / 100));
  const isFree = effectivePrice === 0;

  if (!result) return (
    <div className="screen" style={{display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',minHeight:'100vh',padding:'32px',textAlign:'center'}}>
      <p style={{color:'#a53600',fontWeight:600,marginBottom:8}}>Something went wrong</p>
      <p style={{color:'#594139',fontSize:14}}>We couldn't load your results. Please try again.</p>
    </div>
  );

  const { headline, observation, question, domains = [] } = result;
  const gradeLabel = GRADE_LABELS[grade] || null;

  async function handleApplyCoupon() {
    const trimmed = couponInput.trim();
    if (!trimmed) { setCouponError('Enter a coupon code.'); return; }
    setCouponError('');
    setCouponLoading(true);
    try {
      const res = await fetch('/api/coupon/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: trimmed, userId: userId || '' }),
      });
      const data = await res.json();
      if (!data.valid) {
        setCouponError(data.error || 'Invalid coupon code.');
        setAppliedCoupon(null);
      } else {
        setAppliedCoupon({ code: data.code, type: data.type, discountValue: data.discountValue });
        setCouponError('');
      }
    } catch {
      setCouponError('Could not apply coupon. Please try again.');
    }
    setCouponLoading(false);
  }

  async function handleFreeCouponRedeem() {
    if (!appliedCoupon || !isFree) return;
    setRedeemLoading(true);
    try {
      const res = await fetch('/api/coupon/redeem', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: appliedCoupon.code,
          userId: userId || '',
          sessionId: sessionId || null,
          email: userEmail || '',
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        setCouponError(data.error || 'Could not redeem coupon. Please try again.');
      } else {
        setRedeemSuccess(true);
      }
    } catch {
      setCouponError('Something went wrong. Please try again.');
    }
    setRedeemLoading(false);
  }

  return (
    <div className="screen results-screen">
      <div className="results-header">
        <span className="screen-logo">CareerShifu</span>
        <div className="results-header-right">
          {gradeLabel && <span className="grade-label-badge">{gradeLabel}</span>}
          <span className="results-badge">Your results</span>
        </div>
      </div>

      {daysRemaining != null && (
        <div className="prior-result-banner">
          <span className="prior-result-days">
            {daysRemaining} day{daysRemaining !== 1 ? 's' : ''} remaining to view this result
          </span>
          <button type="button" className="btn-retake" onClick={() => setRetakeOpen(true)}>
            Retake for ₹150
          </button>
        </div>
      )}

      {/* Headline */}
      <div className="headline-card">
        <p className="headline-label">Your Virtual Edu Guide sees</p>
        <h1 className="headline-text">{headline}</h1>
      </div>

      {/* Observation */}
      <div className="observation-card">
        <p className="observation-text">{observation}</p>
      </div>

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
              {(d.paths || []).slice(0, 2).map((p) => (
                <span className="domain-path" key={p}>{p}</span>
              ))}
            </div>

            {d.explore && (
              <div className="explore-box">
                <span className="explore-label">Try this</span>
                <p className="explore-text">{d.explore}</p>
              </div>
            )}

            {(d.paths || []).length > 2 && (
              <a className="paths-lock-note" href="#report-card">
                See all 5 paths in your CareerShifu Report →
              </a>
            )}
          </div>
        ))}
      </div>

      {/* Report card */}
      <div className="report-card" id="report-card">
        <p className="report-eyebrow">Your CareerShifu Report</p>
        <h2 className="report-headline">See what your answers actually say about you</h2>
        <p className="report-sub">
          A personalised report built from your responses.
          Specific to your grade, your thinking style, your paths.
        </p>

        <ul className="report-features">
          <li><span className="feat-check">✓</span> Your thinking style and how you make decisions — explained in plain language</li>
          <li><span className="feat-check">✓</span> All 5 career paths per domain — you've only seen 6 of 15 so far</li>
          <li><span className="feat-check">✓</span> Stream and subject guidance for your grade and goals</li>
          <li><span className="feat-check">✓</span> Your strengths and areas to develop — drawn from your own answers</li>
          <li><span className="feat-check">✓</span> 6–8 personalised things to try over the next 3 months</li>
          <li><span className="feat-check">✓</span> A parent summary — written for them, so you don't have to explain it yourself</li>
          <li><span className="feat-check">✓</span> Guided session available — message us on WhatsApp to schedule</li>
        </ul>

        <div className="counsellor-callout">
          <span className="callout-icon">💬</span>
          <div>
            <strong>Guided session available</strong>
            <p>Want help making sense of your report? Reach out on WhatsApp to schedule a session with us.</p>
          </div>
        </div>

        <div className="price-row">
          {appliedCoupon ? (
            <>
              <span className="price-amount" style={{ textDecoration: 'line-through', opacity: 0.4, fontSize: '20px' }}>₹{BASE_PRICE}</span>
              <span className="price-amount" style={{ color: isFree ? '#1D9E75' : 'var(--report-purple-text)' }}>
                {isFree ? 'FREE' : `₹${effectivePrice}`}
              </span>
            </>
          ) : (
            <span className="price-amount">₹{BASE_PRICE}</span>
          )}
          <span className="price-note">One time. WhatsApp support included.</span>
        </div>

        {!redeemSuccess && (
          <div style={{ marginBottom: '16px' }}>
            {!couponOpen ? (
              <button
                type="button"
                onClick={() => setCouponOpen(true)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '13px', color: 'var(--text-muted)', textDecoration: 'underline', padding: 0, display: 'block', marginBottom: '12px' }}
              >
                Have a coupon code?
              </button>
            ) : (
              <div style={{ marginBottom: '12px' }}>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <input
                    className="coupon-input"
                    type="text"
                    placeholder="Enter coupon code"
                    value={couponInput}
                    onChange={(e) => { setCouponInput(e.target.value.toUpperCase()); setCouponError(''); setAppliedCoupon(null); }}
                    onKeyDown={(e) => e.key === 'Enter' && handleApplyCoupon()}
                    disabled={couponLoading}
                    style={{ borderColor: appliedCoupon ? '#1D9E75' : couponError ? '#cc4400' : undefined }}
                  />
                  <button
                    type="button"
                    onClick={handleApplyCoupon}
                    disabled={couponLoading || !couponInput.trim()}
                    className="coupon-apply-btn"
                  >
                    {couponLoading ? '…' : appliedCoupon ? '✓' : 'Apply'}
                  </button>
                </div>
                {couponError && <p className="coupon-error-text">{couponError}</p>}
                {appliedCoupon && (
                  <p className="coupon-success-text">
                    {appliedCoupon.type === 'free' ? 'Coupon applied — your report is free!'
                      : appliedCoupon.type === 'percent' ? `${appliedCoupon.discountValue}% off applied`
                      : `₹${appliedCoupon.discountValue} off applied`}
                  </p>
                )}
              </div>
            )}
          </div>
        )}

        {redeemSuccess ? (
          <div className="coupon-success-card">
            <p style={{ fontSize: '22px', marginBottom: '8px' }}>✓</p>
            <p style={{ fontWeight: 700, color: 'var(--report-green-text)', marginBottom: '6px', fontSize: '15px' }}>Your report is confirmed</p>
            <p style={{ fontSize: '13px', color: 'var(--report-green-text)', lineHeight: 1.6 }}>
              We'll send your CareerShifu Report to your email within 24 hours.
              If you'd like a guided walkthrough, message us on WhatsApp to schedule a session.
            </p>
          </div>
        ) : (
          <button
            className="btn-report"
            type="button"
            disabled={redeemLoading}
            onClick={isFree ? handleFreeCouponRedeem : () => alert('Payment coming soon — Razorpay integration in progress.')}
          >
            {redeemLoading ? 'Confirming…' : isFree ? 'Get my free CareerShifu report' : 'Download my CareerShifu report'}
          </button>
        )}

        <p className="payment-note">
          {isFree ? 'Report sent to your email within 24 hours' : 'Secure payment · PDF to your email instantly'}
        </p>

        <p className="urgency-note">Your session expires in 48 hours</p>

        <div className="testimonials">
          {VALUE_PROPS.map((v, i) => (
            <div className="testimonial-card" key={i}>
              <p className="testimonial-text">{v.text}</p>
            </div>
          ))}
        </div>

        <p className="report-disclaimer">
          Stream and course guidance reflects CBSE/ISC 2025 pathways.
        </p>
      </div>

      {/* WhatsApp share */}
      <a
        className="btn-whatsapp"
        href={`https://wa.me/?text=${encodeURIComponent('Took me 5 mins and the result was surprisingly specific to me. Worth trying if you\'re figuring out careers or streams. It\'s free 👉 https://edu-counsellor-production.up.railway.app/')}`}
        target="_blank"
        rel="noopener noreferrer"
      >
        Share this — it's free to try →
      </a>

      <div className="results-disclaimer">
        These results are based on your responses today and are meant to give you a broad
        starting point — not a final answer. Career paths are shaped by many factors that
        a short assessment can't fully capture. Use this to explore directions that feel
        worth looking into, not to close off others. Your interests and strengths will keep
        evolving — the picture will get clearer as you grow.
      </div>

      <p className="results-footer">CareerShifu · Virtual Edu Guide · V1</p>

      {retakeOpen && (
        <div
          className="retake-modal-overlay"
          onClick={(e) => e.target === e.currentTarget && setRetakeOpen(false)}
        >
          <div className="retake-modal-card">
            <button className="modal-close" type="button" onClick={() => setRetakeOpen(false)}>✕</button>
            <p className="retake-modal-eyebrow">Retake Test</p>
            <h2 className="retake-modal-title">Paid retakes coming soon</h2>
            <p className="retake-modal-body">
              We're setting up Razorpay payments. Once live, you'll be able to
              retake the test for ₹150 and get a fresh result.
            </p>
            <button type="button" className="btn-report" onClick={() => setRetakeOpen(false)}>
              Got it
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
