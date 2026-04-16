import { useState } from 'react';

const MULTI_MAX = 2;

export default function Assessment({ tag, questions, multiSelect = false, onComplete }) {
  const [current, setCurrent] = useState(0);
  const [answers, setAnswers] = useState([]);
  const [selectedSingle, setSelectedSingle] = useState(null);
  const [selectedMulti, setSelectedMulti] = useState([]);
  const [textValue, setTextValue] = useState('');

  const q = questions[current];
  const total = questions.length;
  const isText = q.type === 'text';
  // Per-question override: singleSelect:true forces single-select even in a multi-select section
  const isMulti = multiSelect && !q.singleSelect && !isText;
  const capReached = selectedMulti.length >= MULTI_MAX;

  function advance(value) {
    const next = [...answers, value];
    setAnswers(next);
    setSelectedSingle(null);
    setSelectedMulti([]);
    setTextValue('');
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

  function handleTextSubmit() {
    if (!textValue.trim()) return;
    advance(textValue.trim());
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
        <p className="question-counter">{current + 1} of {total}</p>
        <h2 className="question-text">{q.question}</h2>
        {!isText && (
          <p className="question-hint">
            {isMulti ? 'Choose 1 or 2 that resonate most' : 'Choose one'}
          </p>
        )}
      </div>

      {isText ? (
        <div className="text-input-area">
          {q.hint && <p className="text-hint">{q.hint}</p>}
          <textarea
            className="text-input"
            rows={4}
            placeholder="Type your answer here…"
            value={textValue}
            onChange={(e) => setTextValue(e.target.value)}
            autoFocus
          />
          <button
            className="btn-primary"
            onClick={handleTextSubmit}
            disabled={!textValue.trim()}
          >
            Continue
          </button>
        </div>
      ) : (
        <>
          <div className="options-list">
            {q.options.map((opt) => {
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
        </>
      )}
    </div>
  );
}
