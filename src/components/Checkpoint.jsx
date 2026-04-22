const insights = {
  // After psychometric (8 Big Five vignettes)
  1: (answers) => {
    const p = answers?.psychometric || [];
    // Q5 = emotional recovery (Neuroticism), Q3 = planning (Conscientiousness)
    const recovery = p[4] || '';
    const planning = p[2] || '';
    if (recovery.toLowerCase().includes('replaying')) {
      return "Something stood out — you mentioned you tend to replay things more than you'd like. That kind of self-awareness is actually rare at your age, and it tells your Virtual Edu Guide something real about how you process things.";
    }
    if (recovery.toLowerCase().includes('bounce back')) {
      return "I noticed you tend to bounce back from setbacks fairly quickly. That kind of resilience doesn't mean things don't affect you — it usually means you've learned how to keep moving. Worth thinking about when that shows up.";
    }
    if (planning.toLowerCase().includes('plan the same day')) {
      return "Something stood out — you said you'd start planning the same day. Students who work that way tend to do well in environments that reward initiative over instruction. Keep going.";
    }
    if (planning.toLowerCase().includes('pressure')) {
      return "I noticed you work better under pressure. That's not a flaw — some of the best work happens when the stakes are real. Your Virtual Edu Guide is building a clearer picture.";
    }
    return "I noticed a pattern in how you respond to situations — there's a consistency there that tells your Virtual Edu Guide more than most assessments would. Keep going.";
  },

  // After cognitive
  2: (answers) => {
    const c = answers?.cognitive || [];
    const corrects = ['162', 'Student', '₹150', 'Priya reads'];
    const score = c.filter((a, i) => corrects[i] === a).length;
    const situational = c[4] || '';
    if (score === 4) {
      return `You got all 4 reasoning questions right. Sharp. What's more interesting is the situational one — how you said you'd respond to a friend who's upset. That says something different, and your Virtual Edu Guide noticed.`;
    }
    if (score >= 2) {
      return `You got ${score} of 4 reasoning questions right. The score matters less than the pattern — how you approached the ones you weren't certain about is more revealing than the ones you nailed.`;
    }
    return "Scores on these questions matter less than you might think. Your Virtual Edu Guide is much more interested in the situational question — the way you handle people tells a different story than numbers ever could.";
  },

  // After personal
  3: (answers) => {
    const pe = answers?.personal || [];
    const animal = pe[4] || '';
    const flowMoment = pe[6] || '';
    if (animal.toLowerCase().includes('octopus')) {
      return "You picked the octopus. Students who do that tend to have unusually wide curiosity — they don't fit neatly into one lane, and that's actually a strength, not a problem. Your Virtual Edu Guide is paying close attention to this.";
    }
    if (animal.toLowerCase().includes('crow')) {
      return "You picked the crow — the quiet observer who solves things others don't notice. That's a specific kind of intelligence. Your Virtual Edu Guide is connecting this with everything else you've shared.";
    }
    if (animal.toLowerCase().includes('wolf')) {
      return "You picked the wolf. There's something about loyalty and endurance in how you see yourself. Your Virtual Edu Guide is connecting that with the rest of what you've shared.";
    }
    if (flowMoment.length > 15) {
      return `"${flowMoment.slice(0, 55)}${flowMoment.length > 55 ? '…' : ''}" — that moment you described is the kind of signal most career assessments completely miss. Your Virtual Edu Guide is building the full picture now.`;
    }
    return "You're almost there. The last few questions — especially the ones you wrote yourself — carry more weight than everything else combined. Your Virtual Edu Guide has been paying close attention.";
  },
};

export default function Checkpoint({ number, answers, onContinue }) {
  const getInsight = insights[number];
  const text = getInsight
    ? getInsight(answers)
    : 'Your Virtual Edu Guide is building a picture — keep going.';

  return (
    <div className="screen checkpoint-screen">
      <div className="screen-header">
        <span className="screen-logo">CareerShifu</span>
        <span className="checkpoint-badge">Checkpoint {number} of 3</span>
      </div>

      <div className="insight-card">
        <p className="insight-text">{text}</p>
      </div>

      <p className="checkpoint-sub">
        {number < 3
          ? 'Keep going — the picture gets clearer with every answer.'
          : 'Last step — tell your Virtual Edu Guide what drives you.'}
      </p>

      <button className="btn-primary" onClick={onContinue}>
        {number < 3 ? 'Continue' : 'Almost done'}
      </button>
    </div>
  );
}
