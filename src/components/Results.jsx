export default function Results({ result, onRestart }) {
  if (!result) return null;

  const { headline, observation, question, domains = [] } = result;

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

      <div className="pro-card">
        <div className="pro-card-header">
          <span className="pro-badge">CareerMap Pro</span>
          <p className="pro-card-title">Your guide has more to show you</p>
          <p className="pro-card-sub">
            The free result gives you direction. Pro gives you a plan.
          </p>
        </div>
        <ul className="pro-features">
          <li>
            <span className="pro-feat-icon">📄</span>
            <div><strong>Detailed PDF report</strong><br />Big Five profile, strengths breakdown, and a parent summary</div>
          </li>
          <li>
            <span className="pro-feat-icon">🎯</span>
            <div><strong>1:1 Edu Counseling session</strong><br />45 minutes with a trained counselor, personalised to your results</div>
          </li>
          <li>
            <span className="pro-feat-icon">🗺️</span>
            <div><strong>Career handholding</strong><br />Monthly check-ins, goal tracking, and curated next steps</div>
          </li>
          <li>
            <span className="pro-feat-icon">🎤</span>
            <div><strong>Expert session invites</strong><br />Live sessions with industry leaders — ask them anything</div>
          </li>
        </ul>
        <a
          className="btn-pro"
          href="mailto:hello@careermap.in?subject=CareerMap Pro — Early Access"
        >
          Get early access →
        </a>
        <p className="pro-card-note">Early access is free. We'll reach out when Pro launches.</p>
      </div>

      <div className="results-disclaimer">
        This is a starting point based on how you answered today. Interests and
        strengths develop over time — come back as you grow.
      </div>

      <button className="btn-secondary" onClick={onRestart}>
        Start over
      </button>

      <p className="results-footer">CareerMap · Virtual Edu Guide · V1</p>
    </div>
  );
}
