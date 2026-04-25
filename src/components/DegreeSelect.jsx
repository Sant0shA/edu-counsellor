import { useState } from 'react';

const DEGREES = [
  'Engineering or Technology',
  'Medicine or Biology',
  'Commerce or Business',
  'Arts or Humanities',
  'Maths or Pure Sciences',
  'Law',
  'Design or Media',
  'Social Sciences or Psychology',
  'Something else',
];

export default function DegreeSelect({ onComplete }) {
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
        <h1 className="grade-intro-title">What are you currently studying — or what did you study?</h1>
        <p className="grade-intro-sub">
          This helps us give you advice grounded in where you actually are.
        </p>
      </div>
      <div className="options-list">
        {DEGREES.map((opt) => (
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
