import { useState, useEffect } from 'react';
import SignOutChip from './SignOutChip';
import { checkReportStatus, resendReport, authHeaders } from '../utils/api';

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

export default function Results({ result, sessionId, grade, userId, userEmail, onRestart, onSignOut, daysRemaining }) {
  const [couponOpen, setCouponOpen] = useState(false);
  const [couponInput, setCouponInput] = useState('');
  const [couponLoading, setCouponLoading] = useState(false);
  const [couponError, setCouponError] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [redeemLoading, setRedeemLoading] = useState(false);
  const [redeemSuccess, setRedeemSuccess] = useState(false);
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [reportSent, setReportSent] = useState(null); // null=checking, false=not sent, true=sent
  const [resendCooldownSecs, setResendCooldownSecs] = useState(0);
  const [resendLoading, setResendLoading] = useState(false);
  const [resendDone, setResendDone] = useState(false);

  useEffect(() => {
    if (!userEmail) { setReportSent(false); return; }
    checkReportStatus().then(({ sent, secondsUntilResend }) => {
      setReportSent(sent);
      if (sent && secondsUntilResend > 0) setResendCooldownSecs(secondsUntilResend);
    });
  }, [userEmail]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (resendCooldownSecs <= 0) return;
    const t = setInterval(() => setResendCooldownSecs(s => Math.max(0, s - 1)), 1000);
    return () => clearInterval(t);
  }, [resendCooldownSecs]);

  async function handleResend() {
    setResendLoading(true);
    try {
      await resendReport();
      setResendDone(true);
      setResendCooldownSecs(30 * 60);
    } catch (err) {
      if (err.secondsRemaining) setResendCooldownSecs(err.secondsRemaining);
    }
    setResendLoading(false);
  }

  const BASE_PRICE = 499;
  const effectivePrice = !appliedCoupon ? BASE_PRICE
    : appliedCoupon.type === 'free'  ? 0
    : appliedCoupon.type === 'flat'  ? Math.max(0, BASE_PRICE - appliedCoupon.discountValue)
    : Math.round(BASE_PRICE * (1 - appliedCoupon.discountValue / 100));
  const isFree = effectivePrice === 0;

  async function handlePaidCheckout(amountRupees, type = 'report') {
    setPaymentLoading(true);
    try {
      const res = await fetch('/api/payment/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeaders() },
        body: JSON.stringify({ amount: amountRupees, sessionId, type }),
      });
      if (!res.ok) throw new Error('Could not create order');
      const order = await res.json();

      const rzp = new window.Razorpay({
        key: import.meta.env.VITE_RAZORPAY_KEY_ID,
        amount: order.amount,
        currency: order.currency,
        name: 'CareerShifu',
        description: type === 'retake' ? 'Assessment Retake' : 'CareerShifu Report',
        order_id: order.orderId,
        prefill: { email: userEmail || '' },
        theme: { color: '#a53600' },
        handler() { setRedeemSuccess(true); },
        modal: { ondismiss() { setPaymentLoading(false); } },
      });
      rzp.on('payment.failed', () => setPaymentLoading(false));
      rzp.open();
    } catch (err) {
      console.error('Checkout error:', err);
      setPaymentLoading(false);
    }
  }

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
        headers: { 'Content-Type': 'application/json', ...authHeaders() },
        body: JSON.stringify({ code: trimmed }),
      });
      const data = await res.json().catch(() => ({}));
      if (!data.valid) {
        setCouponError(data.error || 'Invalid coupon code.');
        setAppliedCoupon(null);
      } else {
        setAppliedCoupon({ code: data.code, type: data.type, discountValue: data.discountValue });
        setCouponError('');
      }
    } catch {
      setCouponError('Network error. Please check your connection and try again.');
    }
    setCouponLoading(false);
  }

  async function handleFreeCouponRedeem() {
    if (!appliedCoupon || !isFree) return;
    setRedeemLoading(true);
    try {
      const res = await fetch('/api/coupon/redeem', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeaders() },
        body: JSON.stringify({
          code: appliedCoupon.code,
          sessionId: sessionId || null,
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
        <a className="screen-logo" href="https://careershifu.com" target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'none' }}>CareerShifu</a>
        <div className="results-header-right">
          {gradeLabel && <span className="grade-label-badge">{gradeLabel}</span>}
          <span className="results-badge">Your results</span>
          {onSignOut && <SignOutChip email={userEmail} onSignOut={onSignOut} />}
        </div>
      </div>

      {daysRemaining != null && (
        <div className="prior-result-banner">
          <span className="prior-result-days">
            {daysRemaining} day{daysRemaining !== 1 ? 's' : ''} remaining to view this result
          </span>
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

      {/* Report bridge hook */}
      <div style={{
        background: 'linear-gradient(135deg, #fff3ee 0%, #fff8f5 100%)',
        border: '1.5px solid rgba(165,54,0,0.18)',
        borderRadius: '16px',
        padding: '20px 20px',
        margin: '0 0 4px',
        textAlign: 'center',
      }}>
        <p style={{ fontSize: '15px', fontWeight: 700, color: '#a53600', margin: '0 0 6px', lineHeight: 1.4 }}>
          If the above felt like it was describing you —
        </p>
        <p style={{ fontSize: '14px', color: '#594139', margin: 0, lineHeight: 1.6 }}>
          you've only seen the surface. The full 10-page report goes much deeper, and is built entirely from your answers.
        </p>
      </div>

      {/* Report card */}
      <div className="report-card" id="report-card">
        <p className="report-eyebrow">CareerShifu Report · 10 pages · Built from your answers</p>
        <h2 className="report-headline">You've only seen 6 of 15 paths — here's the full picture</h2>
        <p className="report-sub">
          Everything above is a preview. The report covers your complete profile — thinking style, all 15 paths, subject guidance specific to your grade, and a parent summary written for them to read.
        </p>

        <ul className="report-features">
          <li><span className="feat-check">✓</span> <strong>All 15 career paths</strong> — 5 per domain, with India demand context for each</li>
          <li><span className="feat-check">✓</span> Your thinking style and decision-making pattern — explained in plain language</li>
          <li><span className="feat-check">✓</span> Stream and subject guidance specific to your grade and goals</li>
          <li><span className="feat-check">✓</span> Your strengths and areas to develop — drawn from your own answers</li>
          <li><span className="feat-check">✓</span> 6–8 personalised things to try over the next 3 months</li>
          <li><span className="feat-check">✓</span> <strong>A parent summary</strong> — written for them, so the conversation doesn't have to start from scratch</li>
          <li><span className="feat-check">✓</span> WhatsApp support included — message us after you receive it and we'll respond within 24 hours</li>
        </ul>

        <div className="counsellor-callout">
          <span className="callout-icon">💬</span>
          <div>
            <strong>Guided session available</strong>
            <p>Want help making sense of your report? WhatsApp us at <a href="https://wa.me/919004493138" target="_blank" rel="noopener noreferrer" style={{ color: 'inherit', fontWeight: 700 }}>9004493138</a> to schedule a session.</p>
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

        {(redeemSuccess || reportSent) ? (
          <div className="coupon-success-card">
            <p style={{ fontSize: '22px', marginBottom: '8px' }}>✓</p>
            <p style={{ fontWeight: 700, color: 'var(--report-green-text)', marginBottom: '6px', fontSize: '15px' }}>Your CareerShifu Report has been sent</p>
            <p style={{ fontSize: '13px', color: 'var(--report-green-text)', lineHeight: 1.6, marginBottom: '14px' }}>
              Check your inbox — it may be in <strong>Spam or Promotions</strong>.
            </p>
            {resendDone ? (
              <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Resent ✓ — check Spam / Promotions if you don't see it.</p>
            ) : (
              <button
                type="button"
                disabled={resendCooldownSecs > 0 || resendLoading}
                onClick={handleResend}
                style={{ background: 'none', border: '1px solid var(--report-green-text)', borderRadius: 8, padding: '8px 18px', cursor: resendCooldownSecs > 0 ? 'default' : 'pointer', fontSize: '13px', color: 'var(--report-green-text)', opacity: resendCooldownSecs > 0 ? 0.55 : 1 }}
              >
                {resendLoading ? 'Sending…'
                  : resendCooldownSecs > 0 ? `Resend in ${Math.floor(resendCooldownSecs / 60)}:${String(resendCooldownSecs % 60).padStart(2, '0')}`
                  : 'Resend report to my email'}
              </button>
            )}
          </div>
        ) : reportSent === false ? (
          <>
            {isFree ? (
              <button className="btn-report" type="button" disabled={redeemLoading} onClick={handleFreeCouponRedeem}>
                {redeemLoading ? 'Confirming…' : 'Get my full 10-page report — free'}
              </button>
            ) : (
              <button className="btn-report" type="button" disabled={paymentLoading} onClick={() => handlePaidCheckout(effectivePrice, 'report')}>
                {paymentLoading ? 'Preparing payment…' : 'Get my full 10-page CareerShifu report →'}
              </button>
            )}
            <p className="payment-note">
              {isFree ? 'PDF sent to your email within 24 hours' : 'Secure payment · PDF sent to your email instantly'}
            </p>
            <p className="urgency-note">Your session expires in 48 hours</p>
          </>
        ) : null}

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
        href={`https://wa.me/?text=${encodeURIComponent('Took me 5 mins and the result was surprisingly specific to me. Worth trying if you\'re figuring out careers or streams. It\'s free 👉 https://careershifu.com/')}`}
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

      {/* WhatsApp floating button */}
      <a
        href={`https://wa.me/919004493138?text=${encodeURIComponent('Hi, I just completed the CareerShifu assessment and have a question.')}`}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Chat on WhatsApp"
        style={{
          position: 'fixed', bottom: '24px', right: '20px', zIndex: 9999,
          width: '52px', height: '52px', borderRadius: '50%', background: '#25D366',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: '0 4px 14px rgba(0,0,0,0.22)', textDecoration: 'none',
        }}
      >
        <svg viewBox="0 0 32 32" width="28" height="28" fill="white" xmlns="http://www.w3.org/2000/svg">
          <path d="M16 2C8.268 2 2 8.268 2 16c0 2.49.648 4.83 1.782 6.862L2 30l7.338-1.762A13.94 13.94 0 0 0 16 30c7.732 0 14-6.268 14-14S23.732 2 16 2zm0 25.5a11.44 11.44 0 0 1-5.844-1.606l-.418-.248-4.354 1.046 1.074-4.24-.272-.436A11.46 11.46 0 0 1 4.5 16C4.5 9.596 9.596 4.5 16 4.5S27.5 9.596 27.5 16 22.404 27.5 16 27.5zm6.29-8.476c-.344-.172-2.036-1.004-2.352-1.118-.316-.114-.546-.172-.776.172-.23.344-.888 1.118-1.088 1.348-.2.23-.4.258-.744.086-.344-.172-1.452-.536-2.766-1.708-1.022-.912-1.712-2.038-1.912-2.382-.2-.344-.022-.53.15-.702.156-.154.344-.4.516-.6.172-.2.23-.344.344-.574.114-.23.058-.43-.028-.602-.086-.172-.776-1.872-1.062-2.562-.28-.672-.564-.58-.776-.59l-.66-.012c-.23 0-.602.086-.916.43-.316.344-1.204 1.176-1.204 2.868s1.232 3.326 1.404 3.556c.172.23 2.424 3.702 5.872 5.19.82.354 1.46.566 1.96.724.822.262 1.572.224 2.164.136.66-.098 2.036-.832 2.322-1.634.286-.802.286-1.49.2-1.634-.084-.144-.314-.23-.658-.402z"/>
        </svg>
      </a>

    </div>
  );
}
