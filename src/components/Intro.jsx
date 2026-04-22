export default function Intro({ onStart }) {
  return (
    <div className="screen intro-screen">
      <div className="intro-logo">
        <a className="logo-text" href="https://careershifu.com" target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'none' }}>CareerShifu</a>
      </div>

      <div className="intro-tagline">
        Find what you're <em>actually</em> built for
      </div>

      <div className="intro-chips">
        <span className="chip">10 mins</span>
        <span className="chip">8 signals</span>
        <span className="chip">Free</span>
      </div>

      <div className="intro-outcomes">
        <p className="intro-outcomes-label">What you walk away with</p>
        <ul className="intro-outcomes-list">
          <li>3 career domains matched to <strong>how you actually think</strong></li>
          <li>A question <strong>that'll stay with you</strong></li>
          <li>One thing to try this week — <strong>specific to your result</strong></li>
        </ul>
      </div>

      <p className="intro-subtext">
        Answer honestly. Your Virtual Edu Guide reads between the lines — not
        just what you pick, but how you think.
      </p>

      <button className="btn-primary" onClick={onStart}>
        Let's find out →
      </button>
    </div>
  );
}
