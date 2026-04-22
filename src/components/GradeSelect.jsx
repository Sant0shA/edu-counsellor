import { useState } from 'react';

const GRADES = [
  'Class 8 or 9',
  'Class 10',
  'Class 11 or 12',
  'Just finished school or gap year',
  'In college / Undergraduate',
];

export default function GradeSelect({ onComplete }) {
  const [selected, setSelected] = useState(null);

  function handleSelect(option) {
    setSelected(option);
    setTimeout(() => onComplete(option), 220);
  }

  return (
    <div className="screen grade-screen">
      <span className="screen-logo">CareerShifu</span>
      <div className="grade-intro">
        <p className="grade-intro-tag">Before we begin</p>
        <h1 className="grade-intro-title">Where are you in your studies right now?</h1>
        <p className="grade-intro-sub">
          This helps us ask the right questions for where you are right now.
        </p>
      </div>
      <div className="options-list">
        {GRADES.map((opt) => (
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
