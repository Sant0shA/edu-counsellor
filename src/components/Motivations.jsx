import { useState } from 'react';
import { motivations } from '../data/questions.js';

const MAX = 2;

export default function Motivations({ onComplete }) {
  const [selected, setSelected] = useState([]);

  function toggle(m) {
    if (selected.includes(m)) {
      setSelected(selected.filter((s) => s !== m));
    } else if (selected.length < MAX) {
      setSelected([...selected, m]);
    }
  }

  return (
    <div className="screen motivations-screen">
      <div className="screen-header">
        <span className="screen-logo">CareerMap</span>
        <span className="section-tag">What matters most</span>
      </div>

      <h2 className="motivations-title">What matters most to you?</h2>
      <p className="motivations-sub">Pick your top 2</p>

      <div className="motivations-counter">
        <span className={selected.length === MAX ? 'counter-full' : ''}>
          {selected.length} of {MAX} selected
        </span>
      </div>

      <div className="motivations-grid">
        {motivations.map((m) => {
          const isSelected = selected.includes(m);
          const isDisabled = !isSelected && selected.length >= MAX;
          return (
            <button
              key={m}
              className={`motivation-btn ${isSelected ? 'selected' : ''} ${isDisabled ? 'disabled' : ''}`}
              onClick={() => toggle(m)}
              disabled={isDisabled}
            >
              {m}
            </button>
          );
        })}
      </div>

      <button
        className="btn-primary"
        onClick={() => onComplete(selected)}
        disabled={selected.length < MAX}
      >
        See my results →
      </button>
    </div>
  );
}
