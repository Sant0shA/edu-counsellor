/**
 * Signal test — runs 4 student profiles through the actual OpenRouter API
 * and prints the domains Claude returns for each.
 *
 * Usage: OPENROUTER_KEY=sk-... node test/signal_test.mjs
 */

import { buildPrompt } from '../src/data/prompt.js';

const cognitiveQuestions = [
  { id: 'cm1', correct: '162' },
  { id: 'cm2', correct: 'Client' },
  { id: 'cm3', correct: '₹900' },
  { id: 'cm4', correct: 'Priya reads' },
  { id: 'ceq', correct: null },
];

const PROFILES = [
  {
    label: 'Commerce / Management (Class 10)',
    expectedDomains: ['business', 'finance', 'commerce', 'management', 'entrepreneurship'],
    answers: {
      grade: 'Class 10',
      cognitiveQuestions,
      psychometric: [
        'Note it down and stay on task for now',
        'Jump in and start conversations — you actually enjoy this',
        'Break it into steps and start a rough plan the same day',
        'Find a way to help a little without losing too much',
        'Bounce back fairly quickly — on to the next thing',
        'Curious but unsure where to start',
        'Step in and try to get everyone aligned',
        'Acknowledge it, fix it, move on — everyone makes mistakes',
      ],
      cognitive: ['162', 'Client', '₹900', 'Priya reads', 'Ask them directly'],
      personal: [
        'Business or Economics',
        'Commerce or Economics',
        'Talking to people or being out in the world||Figuring out how businesses, money or markets work',
        'A startup founder or entrepreneur',
        'Wolf — loyal to their pack, strategic, built for endurance',
        "The things they've built or created",
        'Making organisations and businesses work more effectively',
        'Why some businesses and economies grow while others collapse',
      ],
      context: [],
      motivations: ['Making good money', 'Being known and respected'],
    },
  },
  {
    label: 'Law / Policy (Class 11 or 12)',
    expectedDomains: ['law', 'legal', 'policy', 'advocacy', 'rights', 'justice'],
    answers: {
      grade: 'Class 11 or 12',
      cognitiveQuestions,
      psychometric: [
        'Note it down and stay on task for now',
        'Find one or two people and go deep with them',
        'Break it into steps and start a rough plan the same day',
        'Tell them honestly you can\'t right now',
        'Feel it hard, then figure out what to do differently',
        'Curious but unsure where to start',
        'Take a clear position and defend it calmly',
        'Acknowledge it, fix it, move on — everyone makes mistakes',
      ],
      cognitive: ['162', 'Client', '₹900', 'Priya reads', 'Give space but stay nearby'],
      personal: [
        'History, Psychology or Social Sciences',
        'English or Languages',
        'Following news, debates or how society works||Talking to people or being out in the world',
        'A lawyer, activist or policy maker',
        'Crow — clever problem-solver, quietly observant',
        'The way they spot problems others miss',
        'Understanding why rules exist — and how to make them fairer',
        'Why certain rules and laws exist — and who has the power to change them',
      ],
      context: [],
      motivations: ['Making a real difference', 'Being known and respected'],
    },
  },
  {
    label: 'Biology / Medicine (Class 10)',
    expectedDomains: ['health', 'medicine', 'biology', 'biotech', 'medical', 'doctor'],
    answers: {
      grade: 'Class 10',
      cognitiveQuestions,
      psychometric: [
        'Follow the thread — end up reading about it for an hour',
        'Find one or two people and go deep with them',
        'Break it into steps and start a rough plan the same day',
        'Help anyway — it matters to you that they\'re okay',
        'Feel it hard, then figure out what to do differently',
        'Excited — finally you can do something original',
        'Listen to all sides before you say anything',
        'Analyse exactly what went wrong so it doesn\'t repeat',
      ],
      cognitive: ['162', 'Client', '₹900', 'Priya reads', 'Ask them directly'],
      personal: [
        'Biology or Life Sciences',
        'Maths or Science',
        'Reading or going deep on topics I care about||Sports or staying physically active',
        'A doctor, scientist or researcher',
        'Octopus — endlessly curious, adapts to anything',
        "The real-world difference they've made",
        'Researching and discovering things not yet known',
        'How living things actually work — bodies, ecosystems, disease',
      ],
      context: [],
      motivations: ['Making a real difference', 'Being really good at something'],
    },
  },
  {
    label: 'Psychology / Social Work — over-signal regression test (Class 11 or 12)',
    expectedDomains: ['social', 'psychology', 'counseling', 'mental health'],
    regressionCheck: true,
    answers: {
      grade: 'Class 11 or 12',
      cognitiveQuestions,
      psychometric: [
        'Note it down and stay on task for now',
        'Stay near someone you know and keep to yourself',
        'Let it sit for a bit, then start when it feels right',
        'Help anyway — it matters to you that they\'re okay',
        'Keep replaying it in your head for a few days',
        'Anxious — you\'d rather have clear direction',
        'Listen to all sides before you say anything',
        'Feel embarrassed for a bit, but recover',
      ],
      cognitive: ['162', 'Client', '₹900', 'None of the above', 'Give space but stay nearby'],
      personal: [
        'History, Psychology or Social Sciences',
        'English or Languages',
        'Talking to people or being out in the world',
        'A coach, teacher or social worker',
        'Elephant — deep memory, protective, emotionally complex',
        "The real-world difference they've made",
        'Understanding how people feel and how to help them',
        'What makes people feel understood, seen, or connected',
      ],
      context: [],
      motivations: ['Making a real difference', 'Having freedom and flexibility'],
    },
  },
];

const HARD_SCIENCE_PROFILES = [
  {
    label: 'JEE / Physics + Chemistry (Class 11 or 12)',
    expectedDomains: ['physics', 'chemistry', 'engineering', 'science', 'research', 'materials'],
    answers: {
      grade: 'Class 11 or 12',
      cognitiveQuestions,
      psychometric: [
        'Follow the thread — end up reading about it for an hour',
        'Find one or two people and go deep with them',
        'Break it into steps and start a rough plan the same day',
        'Tell them honestly you can\'t right now',
        'Feel it hard, then figure out what to do differently',
        'Excited — finally you can do something original',
        'Take a clear position and defend it calmly',
        'Analyse exactly what went wrong so it doesn\'t repeat',
      ],
      cognitive: ['162', 'Client', '18 hours', 'Mehta is dishonest', 'Give space but stay nearby'],
      personal: [
        'Physics or Chemistry',
        'Maths or Science',
        'Reading or going deep on topics I care about||Gaming or building with tech',
        'A doctor, scientist or researcher',
        'Eagle — solitary, sharp-eyed, sees the full picture',
        'The way they spot problems others miss',
        'Researching and discovering things not yet known',
        'Why the universe follows precise mathematical and physical laws',
      ],
      context: [],
      motivations: ['Being really good at something', 'Having freedom and flexibility'],
    },
  },
  {
    label: 'Pure Mathematics / ISI-CMI track (Class 11 or 12)',
    expectedDomains: ['math', 'statistic', 'research', 'quantitative', 'theoretical', 'data'],
    answers: {
      grade: 'Class 11 or 12',
      cognitiveQuestions,
      psychometric: [
        'Follow the thread — end up reading about it for an hour',
        'Find one or two people and go deep with them',
        'Break it into steps and start a rough plan the same day',
        'Tell them honestly you can\'t right now',
        'Bounce back fairly quickly — on to the next thing',
        'Excited — finally you can do something original',
        'Take a clear position and defend it calmly',
        'Analyse exactly what went wrong so it doesn\'t repeat',
      ],
      cognitive: ['162', 'Client', '18 hours', 'We cannot conclude whether any A is C', 'Give space but stay nearby'],
      personal: [
        'Maths or Statistics',
        'Maths or Science',
        'Reading or going deep on topics I care about',
        'A doctor, scientist or researcher',
        'Crow — clever problem-solver, quietly observant',
        'The way they spot problems others miss',
        'Researching and discovering things not yet known',
        'Why the universe follows precise mathematical and physical laws',
      ],
      context: [],
      motivations: ['Being really good at something', 'Having freedom and flexibility'],
    },
  },
  {
    label: 'Statistics / Actuarial / Data Science via stats (Class 11 or 12)',
    expectedDomains: ['statistic', 'data', 'actuar', 'quantitative', 'analyt', 'research', 'finance'],
    answers: {
      grade: 'Class 11 or 12',
      cognitiveQuestions,
      psychometric: [
        'Note it down and stay on task for now',
        'Find one or two people and go deep with them',
        'Break it into steps and start a rough plan the same day',
        'Find a way to help a little without losing too much',
        'Bounce back fairly quickly — on to the next thing',
        'Curious but unsure where to start',
        'Listen to all sides before you say anything',
        'Analyse exactly what went wrong so it doesn\'t repeat',
      ],
      cognitive: ['162', 'Client', '18 hours', 'We cannot conclude whether any A is C', 'Give space but stay nearby'],
      personal: [
        'Maths or Statistics',
        'Maths or Science',
        'Figuring out how businesses, money or markets work||Reading or going deep on topics I care about',
        'A doctor, scientist or researcher',
        'Crow — clever problem-solver, quietly observant',
        'The way they spot problems others miss',
        'Researching and discovering things not yet known',
        'Why the universe follows precise mathematical and physical laws',
      ],
      context: [],
      motivations: ['Being really good at something', 'Making good money'],
    },
  },
  {
    label: 'Data Science via tech vs via stats — separation test (Class 11 or 12)',
    expectedDomains: ['data', 'tech', 'software', 'programming', 'engineer', 'computer'],
    answers: {
      grade: 'Class 11 or 12',
      cognitiveQuestions,
      psychometric: [
        'Follow the thread — end up reading about it for an hour',
        'Find one or two people and go deep with them',
        'Break it into steps and start a rough plan the same day',
        'Tell them honestly you can\'t right now',
        'Bounce back fairly quickly — on to the next thing',
        'Excited — finally you can do something original',
        'Take a clear position and defend it calmly',
        'Analyse exactly what went wrong so it doesn\'t repeat',
      ],
      cognitive: ['162', 'Client', '18 hours', 'We cannot conclude whether any A is C', 'Give space but stay nearby'],
      personal: [
        'Tech or Computers',
        'Maths or Science',
        'Gaming or building with tech||Reading or going deep on topics I care about',
        'A startup founder or entrepreneur',
        'Crow — clever problem-solver, quietly observant',
        'The things they\'ve built or created',
        'Designing or building things that don\'t exist yet',
        'How to build reliable things — systems, machines, software',
      ],
      context: [],
      motivations: ['Being really good at something', 'Making good money'],
    },
  },
];

async function callOpenRouter(prompt) {
  const key = process.env.OPENROUTER_KEY;
  if (!key) throw new Error('OPENROUTER_KEY not set');

  const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${key}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': 'https://edu.atrios.in',
      'X-Title': 'CareerShifu-SignalTest',
    },
    body: JSON.stringify({
      model: 'anthropic/claude-haiku-4-5',
      max_tokens: 2000,
      messages: [
        {
          role: 'system',
          content: 'You output only valid JSON. No explanation, no preamble, no markdown.',
        },
        { role: 'user', content: prompt },
      ],
    }),
  });

  if (!res.ok) throw new Error(`OpenRouter error: ${res.status} ${await res.text()}`);
  const data = await res.json();
  const text = data.choices[0].message.content;
  return text.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim();
}

function checkResult(profile, result) {
  const domainNames = result.domains.map((d) => d.name.toLowerCase()).join(' | ');
  const allText = domainNames + ' ' + result.domains.map((d) => d.paths.join(' ')).join(' ').toLowerCase();

  if (profile.regressionCheck) {
    // Check each domain independently — fail only if ALL 3 are psychology/counseling/UX
    const psychKeywords = ['psycholog', 'counsel', 'therapist', 'social work', 'mental health', 'ux designer', 'user experience'];
    const psychDomainCount = result.domains.filter((d) => {
      const dText = (d.name + ' ' + d.paths.join(' ')).toLowerCase();
      return psychKeywords.some((k) => dText.includes(k));
    }).length;
    if (psychDomainCount === 3) {
      return `FAIL — all 3 domains are psychology/UX (${result.domains.map((d) => d.name).join(' | ')})`;
    }
    return `PASS — psychology/counseling in ${psychDomainCount}/3 domains; other domains are distinct (${result.domains.map((d) => d.name).join(' | ')})`;
  }

  const matched = profile.expectedDomains.filter((k) => allText.includes(k));
  if (matched.length === 0) {
    return `FAIL — none of expected keywords found (${profile.expectedDomains.join(', ')})`;
  }
  return `PASS — matched: ${matched.join(', ')}`;
}

async function run() {
  console.log('CareerShifu Signal Test\n' + '='.repeat(50));

  for (const profile of [...PROFILES, ...HARD_SCIENCE_PROFILES]) {
    console.log(`\n\nProfile: ${profile.label}`);
    console.log('-'.repeat(50));

    try {
      const prompt = buildPrompt(profile.answers);
      const raw = await callOpenRouter(prompt);
      const result = JSON.parse(raw);

      console.log(`Headline: ${result.headline}`);
      console.log(`Observation: ${result.observation}`);
      console.log('\nDomains:');
      result.domains.forEach((d, i) => {
        console.log(`  ${i + 1}. ${d.name}`);
        console.log(`     Paths: ${d.paths.join(', ')}`);
        console.log(`     Explore: ${d.explore}`);
      });

      const verdict = checkResult(profile, result);
      console.log(`\n→ ${verdict}`);
    } catch (err) {
      console.error(`ERROR: ${err.message}`);
    }

    // Avoid rate limiting
    await new Promise((r) => setTimeout(r, 1500));
  }

  console.log('\n' + '='.repeat(50));
  console.log('Done.');
}

run().catch(console.error);
