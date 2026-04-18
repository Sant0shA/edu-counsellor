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

export default function Results({ result, sessionId, grade, userId, onRestart }) {
  if (!result) return (
    <div className="screen" style={{display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',minHeight:'100vh',padding:'32px',textAlign:'center'}}>
      <p style={{color:'#a53600',fontWeight:600,marginBottom:8}}>Something went wrong</p>
      <p style={{color:'#594139',fontSize:14}}>We couldn't load your results. Please try again.</p>
    </div>
  );

  const { headline, observation, question, domains = [] } = result;
  const gradeLabel = GRADE_LABELS[grade] || null;

  return (
    <div className="screen results-screen">
      <div className="results-header">
        <span className="screen-logo">CareerMap</span>
        <div className="results-header-right">
          {gradeLabel && <span className="grade-label-badge">{gradeLabel}</span>}
          <span className="results-badge">Your results</span>
        </div>
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
                See all 5 paths in your CareerMap Report →
              </a>
            )}
          </div>
        ))}
      </div>

      {/* Report card */}
      <div className="report-card" id="report-card">
        <p className="report-eyebrow">Your CareerMap Report</p>
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
          <li><span className="feat-check">✓</span> A free counsellor call within 48 hours — to help you understand your report</li>
        </ul>

        <div className="counsellor-callout">
          <span className="callout-icon">📞</span>
          <div>
            <strong>Free counsellor call included</strong>
            <p>A CareerMap counsellor will call within 48 hours to walk you through the report and answer questions.</p>
          </div>
        </div>

        <div className="price-row">
          <span className="price-amount">₹499</span>
          <span className="price-note">One time. Instant download. Counsellor call included.</span>
        </div>

        <button className="btn-report" type="button" onClick={() => alert('Payment coming soon — Razorpay integration in progress.')}>
          Download my CareerMap report
        </button>
        <p className="payment-note">Secure payment · PDF to your email instantly</p>

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

      <p className="results-footer">CareerMap · Virtual Edu Guide · V1</p>
    </div>
  );
}
