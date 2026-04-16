export default function Intro({ onStart }) {
  return (
    <div className="screen intro-screen">
      <div className="intro-logo">
        <span className="logo-text">CareerMap</span>
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
          <li>3 broad domains that match how you actually think</li>
          <li>A coaching question to sit with</li>
          <li>One concrete thing to try this week</li>
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
