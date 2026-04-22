import { useState, useEffect } from 'react';

const MESSAGES = [
  'Reading between the lines…',
  'Connecting your signals…',
  'Noticing what stands out…',
  'Almost there — this one takes a moment…',
];

export default function Loading() {
  const [msgIndex, setMsgIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setMsgIndex((i) => (i + 1) % MESSAGES.length);
    }, 2200);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="screen loading-screen">
      <div className="loading-top">
        <span className="logo-text loading-logo">CareerShifu</span>
      </div>

      <div className="loading-body">
        <div className="spinner" />
        <p className="loading-label">Your Virtual Edu Guide is thinking</p>
        <p className="loading-msg">{MESSAGES[msgIndex]}</p>
      </div>
    </div>
  );
}
