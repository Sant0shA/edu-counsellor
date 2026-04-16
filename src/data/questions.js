// ── Psychometric: 8 situational vignettes, single-select, Big Five mapping ──
export const psychometric = [
  {
    id: 'p1',
    bigFive: 'Openness',
    question: "You're studying and something completely unrelated catches your eye. You...",
    options: [
      "Follow the thread — end up reading about it for an hour",
      "Note it down and stay on task for now",
      "Feel distracted and try to refocus",
      "Quickly scan it and move on",
    ],
  },
  {
    id: 'p2',
    bigFive: 'Extraversion',
    question: "You're at a gathering where you know almost nobody. You...",
    options: [
      "Jump in and start conversations — you actually enjoy this",
      "Find one or two people and go deep with them",
      "Stay near someone you know and keep to yourself",
      "Feel drained but push through it anyway",
    ],
  },
  {
    id: 'p3',
    bigFive: 'Conscientiousness',
    question: "You have a big assignment due in 3 weeks. Your first move is...",
    options: [
      "Break it into steps and start a rough plan the same day",
      "Let it sit for a bit, then start when it feels right",
      "Wait — pressure closer to the deadline actually helps you",
      "Ask around what others are doing before you decide",
    ],
  },
  {
    id: 'p4',
    bigFive: 'Agreeableness',
    question: "A friend keeps asking for your help even when you're already stretched. You...",
    options: [
      "Help anyway — it matters to you that they're okay",
      "Find a way to help a little without losing too much",
      "Tell them honestly you can't right now",
      "Say yes but quietly feel resentful about it",
    ],
  },
  {
    id: 'p5',
    bigFive: 'Neuroticism',
    question: "You didn't get selected for something you really wanted. The next day you...",
    options: [
      "Feel it hard, then figure out what to do differently",
      "Bounce back fairly quickly — on to the next thing",
      "Keep replaying it in your head for a few days",
      "Tell yourself it wasn't meant to be, and genuinely believe it",
    ],
  },
  {
    id: 'p6',
    bigFive: 'Openness',
    question: "Your teacher gives you complete freedom — no topic, no format, no guidelines. You feel...",
    options: [
      "Excited — finally you can do something original",
      "Curious but unsure where to start",
      "Anxious — you'd rather have clear direction",
      "Neutral — you'll make something decent regardless",
    ],
  },
  {
    id: 'p7',
    bigFive: 'Extraversion + Agreeableness',
    question: "Your friend group is disagreeing about something. You usually...",
    options: [
      "Step in and try to get everyone aligned",
      "Take a clear position and defend it calmly",
      "Listen to all sides before you say anything",
      "Lighten the mood — a bit of humour usually helps",
    ],
  },
  {
    id: 'p8',
    bigFive: 'Conscientiousness + Neuroticism',
    question: "You make a mistake in front of people. Your first instinct is...",
    options: [
      "Acknowledge it, fix it, move on — everyone makes mistakes",
      "Feel embarrassed for a bit, but recover",
      "Replay it more than you'd like",
      "Analyse exactly what went wrong so it doesn't repeat",
    ],
  },
];

// ── Cognitive question bank — tiered by grade ──
// Each tier has 6 scored questions; 4 are picked randomly per session.
// The EQ situational question is always appended as question 5.

const cognitiveJunior = [
  {
    id: 'cj1',
    question: '4, 8, 16, 32 — what comes next?',
    options: ['48', '64', '56', '60'],
    correct: '64',
  },
  {
    id: 'cj2',
    question: 'Bird is to nest as bee is to…',
    options: ['Honey', 'Hive', 'Flower', 'Wing'],
    correct: 'Hive',
  },
  {
    id: 'cj3',
    question: 'A book costs ₹80 after a 20% discount. What was the original price?',
    options: ['₹96', '₹100', '₹95', '₹90'],
    correct: '₹100',
  },
  {
    id: 'cj4',
    question: 'All plants need water. A cactus is a plant. Therefore…',
    options: [
      'A cactus needs water',
      'Cacti grow in deserts',
      'A cactus does not need much water',
      'All water comes from plants',
    ],
    correct: 'A cactus needs water',
  },
  {
    id: 'cj5',
    question: '1, 4, 9, 16 — what comes next?',
    options: ['20', '24', '25', '36'],
    correct: '25',
  },
  {
    id: 'cj6',
    question: 'Chef is to kitchen as pilot is to…',
    options: ['Plane', 'Cockpit', 'Airport', 'Sky'],
    correct: 'Cockpit',
  },
];

const cognitiveMiddle = [
  {
    id: 'cm1',
    question: '2, 6, 18, 54 — what comes next?',
    options: ['108', '162', '72', '81'],
    correct: '162',
  },
  {
    id: 'cm2',
    question: 'Doctor is to patient as lawyer is to…',
    options: ['Court', 'Law', 'Client', 'Judge'],
    correct: 'Client',
  },
  {
    id: 'cm3',
    question: 'A shop sells for ₹120 after 20% discount. Original price?',
    options: ['₹140', '₹144', '₹150', '₹160'],
    correct: '₹150',
  },
  {
    id: 'cm4',
    question: 'All leaders are readers. Priya is a leader. Therefore…',
    options: [
      'Priya reads',
      'All readers are leaders',
      'Priya is smart',
      'None of the above',
    ],
    correct: 'Priya reads',
  },
  {
    id: 'cm5',
    question: '3, 5, 9, 17 — what comes next?',
    options: ['25', '29', '33', '35'],
    correct: '33',
  },
  {
    id: 'cm6',
    question: 'Thermometer is to temperature as barometer is to…',
    options: ['Weather', 'Altitude', 'Air pressure', 'Wind'],
    correct: 'Air pressure',
  },
];

const cognitiveSenior = [
  {
    id: 'cs1',
    question: '1, 1, 2, 3, 5, 8 — what comes next?',
    options: ['11', '12', '13', '16'],
    correct: '13',
  },
  {
    id: 'cs2',
    question: 'Architect is to blueprint as composer is to…',
    options: ['Piano', 'Concert', 'Score', 'Conductor'],
    correct: 'Score',
  },
  {
    id: 'cs3',
    question: 'A invests ₹6000 for 6 months, B invests ₹4000 for 9 months. How do they share profit?',
    options: ['1:1', '2:3', '3:4', '4:3'],
    correct: '1:1',
  },
  {
    id: 'cs4',
    question: 'No honest official takes bribes. Mehta takes bribes. Therefore…',
    options: [
      'Mehta is not an official',
      'Mehta is dishonest',
      'All officials are honest',
      'None of the above',
    ],
    correct: 'Mehta is dishonest',
  },
  {
    id: 'cs5',
    question: '2, 3, 5, 7, 11, 13 — what comes next?',
    options: ['15', '16', '17', '19'],
    correct: '17',
  },
  {
    id: 'cs6',
    question: 'All A are B. Some B are C. Therefore…',
    options: [
      'All A are C',
      'Some A are C',
      'No A are C',
      'We cannot conclude whether any A is C',
    ],
    correct: 'We cannot conclude whether any A is C',
  },
];

const cognitiveEQ = {
  id: 'ceq',
  question: "Your friend looks upset but hasn't said anything. You…",
  options: [
    'Ask them directly',
    'Give space but stay nearby',
    'Distract them with something fun',
    'Wait for them to bring it up',
  ],
  correct: null, // situational — no correct answer
};

// Kept as fallback for any code that still imports `cognitive` directly
export const cognitive = [...cognitiveMiddle, cognitiveEQ];

/** Pick 4 random scored questions from the right tier, then append the EQ question. */
export function getCognitiveQuestions(grade) {
  const tier =
    grade === 'Class 8 or 9'
      ? cognitiveJunior
      : grade === 'Class 10'
      ? cognitiveMiddle
      : cognitiveSenior; // Class 11/12 + gap year

  const shuffled = [...tier].sort(() => Math.random() - 0.5);
  return [...shuffled.slice(0, 4), cognitiveEQ];
}

// ── Personal: 7 questions (5 MCQ + 2 free text) ──
export const personal = [
  {
    id: 'pe1',
    type: 'options',
    question: 'Which subjects actually get you going?',
    hint: 'Choose 1 or 2 that resonate most',
    options: [
      'Science or Maths',
      'Arts, Music or Writing',
      'Business or Economics',
      'Tech or Computers',
      'History, Psychology or Social Sciences',
    ],
  },
  {
    id: 'pe2',
    type: 'options',
    singleSelect: true,
    question: "Which subject have you consistently done well in — even if it's not your favourite?",
    options: [
      'Maths or Science',
      'English or Languages',
      'Social Studies or History',
      'Arts or Music',
      'Commerce or Economics',
    ],
  },
  {
    id: 'pe3',
    type: 'options',
    question: 'What do you spend most free time on?',
    hint: 'Choose 1 or 2 that resonate most',
    options: [
      'Gaming or building with tech',
      'Creating — art, music, writing, video',
      'Sports or staying physically active',
      'Reading or going deep on topics I care about',
      'Talking to people or being out in the world',
    ],
  },
  {
    id: 'pe4',
    type: 'options',
    question: "If you could shadow someone for a week, you'd pick…",
    hint: 'Choose 1 or 2 that resonate most',
    options: [
      'A startup founder or entrepreneur',
      'A doctor, scientist or researcher',
      'A designer, filmmaker or artist',
      'A coach, teacher or social worker',
      'A journalist, writer or storyteller',
    ],
  },
  {
    id: 'pe5',
    type: 'options',
    singleSelect: true,
    question: 'Of these, which animal do you find most fascinating?',
    options: [
      'Wolf — loyal to their pack, strategic, built for endurance',
      'Dolphin — playful, deeply social, surprisingly intelligent',
      'Eagle — solitary, sharp-eyed, sees the full picture',
      'Octopus — endlessly curious, adapts to anything',
      'Elephant — deep memory, protective, emotionally complex',
      'Crow — clever problem-solver, quietly observant',
    ],
  },
  {
    id: 'pe6',
    type: 'text',
    question: 'Think of someone whose work genuinely inspires you. What is it about them?',
    hint: '',
  },
  {
    id: 'pe7',
    type: 'text',
    question: 'One moment last week when you completely lost track of time…',
    hint: 'This is the most honest career signal there is',
  },
];

// ── Context: 2 questions, single-select — Indian market calibration ──
// Grade is asked separately (GradeSelect screen) before the assessment begins.
export const context = [
  {
    id: 'cx1',
    question: 'Which best describes where you live?',
    options: [
      'Metro city (Mumbai, Delhi, Bengaluru, Chennai, Hyderabad, Pune)',
      'Mid-size city (Jaipur, Kochi, Indore, Chandigarh, etc.)',
      'Small town or rural area',
    ],
  },
  {
    id: 'cx2',
    question: 'Would moving to another city for education or work be an option?',
    options: [
      'Definitely — open to it',
      'Possibly — depends on the situation',
      'Unlikely — prefer to stay close to home',
    ],
  },
];

// ── Motivations: pick top 2 ──
export const motivations = [
  'Making good money',
  'Having freedom and flexibility',
  'Being really good at something',
  'Making a real difference',
  'Being known and respected',
  'Feeling secure and stable',
];
