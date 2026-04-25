import { useState } from 'react';

const STREAMS = [
  'Science (PCM / PCB)',
  'Commerce',
  'Humanities / Arts',
  'Still deciding',
];

export default function StreamSelect({ onComplete }) {
  const [selected, setSelected] = useState(null);

  function handleSelect(option) {
    setSelected(option);
    setTimeout(() => onComplete(option), 220);
  }

  return (
    <div className="screen grade-screen">
      <span className="screen-logo">CareerShifu</span>
      <div className="grade-intro">
        <p className="grade-intro-tag">One more thing</p>
        <h1 className="grade-intro-title">Which stream are you studying in?</h1>
        <p className="grade-intro-sub">
          This helps us give you advice that actually makes sense for your path.
        </p>
      </div>
      <div className="options-list">
        {STREAMS.map((opt) => (
          <button
            key={opt}
            className={`option-btn${selected === opt ? ' selected' : ''}`}
            onClick={() => handleSelect(opt)}
          >
            {opt}
          </button>
        ))}
      </div>
    </div>
  );
}
