import { useState, useMemo } from 'react';

const MULTI_MAX = 2;

export default function Assessment({ tag, questions, multiSelect = false, onComplete }) {
  const [current, setCurrent] = useState(0);
  const [answers, setAnswers] = useState([]);
  const [selectedSingle, setSelectedSingle] = useState(null);
  const [selectedMulti, setSelectedMulti] = useState([]);

  const q = questions[current];
  const total = questions.length;
  // Per-question override: singleSelect:true forces single-select even in a multi-select section
  const isMulti = multiSelect && !q.singleSelect;
  // Shuffle options once per question — stable within a question, different each session
  const shuffledOptions = useMemo(
    () => [...(q.options || [])].sort(() => Math.random() - 0.5),
    [current] // eslint-disable-line react-hooks/exhaustive-deps
  );
  const capReached = selectedMulti.length >= MULTI_MAX;

  function goBack() {
    const prevIndex   = current - 1;
    const prevQ       = questions[prevIndex];
    const prevIsMulti = multiSelect && !prevQ.singleSelect;
    const lastAnswer  = answers[answers.length - 1];

    setAnswers(answers.slice(0, -1));
    setCurrent(prevIndex);
    setSelectedSingle(null);
    setSelectedMulti([]);

    if (prevIsMulti) {
      setSelectedMulti(lastAnswer ? lastAnswer.split(', ') : []);
    } else {
      setSelectedSingle(lastAnswer || null);
    }
  }

  function advance(value) {
    const next = [...answers, value];
    setAnswers(next);
    setSelectedSingle(null);
    setSelectedMulti([]);
    if (current + 1 < total) {
      setCurrent(current + 1);
    } else {
      onComplete(next);
    }
  }

  function handleSingleSelect(opt) {
    setSelectedSingle(opt);
    setTimeout(() => advance(opt), 220);
  }

  function toggleMulti(opt) {
    setSelectedMulti((prev) =>
      prev.includes(opt)
        ? prev.filter((o) => o !== opt)
        : prev.length < MULTI_MAX
        ? [...prev, opt]
        : prev
    );
  }

  return (
    <div className="screen assessment-screen">
      <div className="screen-header">
        <span className="screen-logo">CareerMap</span>
        <span className="section-tag">{tag}</span>
      </div>

      <div className="progress-pills">
        {questions.map((_, i) => (
          <div
            key={i}
            className={`pill ${i < current ? 'done' : i === current ? 'active' : ''}`}
          />
        ))}
      </div>

      <div className="question-block">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
          <p className="question-counter" style={{ margin: 0 }}>{current + 1} of {total}</p>
          {current > 0 && (
            <button className="btn-back" type="button" onClick={goBack}>← back</button>
          )}
        </div>
        <h2 className="question-text">{q.question}</h2>
        <p className="question-hint">
          {isMulti ? 'Choose 1 or 2 that resonate most' : 'Choose one'}
        </p>
      </div>

      <div className="options-list">
        {shuffledOptions.map((opt) => {
          const isSelected = isMulti
            ? selectedMulti.includes(opt)
            : selectedSingle === opt;
          const isDimmed = isMulti && capReached && !isSelected;
          return (
            <button
              key={opt}
              className={`option-btn${isSelected ? ' selected' : ''}${isDimmed ? ' dimmed' : ''}`}
              onClick={() =>
                isMulti ? toggleMulti(opt) : handleSingleSelect(opt)
              }
            >
              {opt}
            </button>
          );
        })}
      </div>

      {isMulti && (
        <button
          className="btn-primary"
          onClick={() => advance(selectedMulti.join(', '))}
          disabled={selectedMulti.length === 0}
        >
          Continue
        </button>
      )}
    </div>
  );
}
