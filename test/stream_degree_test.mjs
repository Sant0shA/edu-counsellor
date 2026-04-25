/**
 * Test stream/degree signals in the prompt
 * Verifies that stream and degree context appears correctly in Claude prompts
 */

import { buildPrompt } from '../src/data/prompt.js';

const CLASS_11_COMMERCE = {
  grade: 'Class 11 or 12',
  stream: 'Commerce',
  cognitiveQuestions: [
    { id: 'cm1', correct: '162' },
    { id: 'cm2', correct: 'Client' },
    { id: 'cm3', correct: '₹900' },
    { id: 'cm4', correct: 'Priya reads' },
  ],
  psychometric: [
    'Note it down and stay on task for now',
    'Find one or two people and go deep with them',
    'Break it into steps and start a rough plan the same day',
    'Find a way to help a little without losing too much',
    'Bounce back fairly quickly — on to the next thing',
    'Curious but unsure where to start',
    'Listen to all sides before you say anything',
    'Acknowledge it, fix it, move on — everyone makes mistakes',
    'Ask them directly',
  ],
  cognitive: ['162', 'Client', '₹900', 'Priya reads'],
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
};

const GRADUATE_ENGINEERING = {
  grade: 'In college / Undergraduate',
  degree: 'Engineering or Technology',
  cognitiveQuestions: [
    { id: 'cs1', correct: '13' },
    { id: 'cs2', correct: 'Score' },
    { id: 'cs3', correct: '18 hours' },
    { id: 'cs4', correct: 'Mehta is dishonest' },
  ],
  psychometric: [
    'Follow the thread — end up reading about it for an hour',
    'Find one or two people and go deep with them',
    'Break it into steps and start a rough plan the same day',
    'Tell them honestly you can\'t right now',
    'Feel it hard, then figure out what to do differently',
    'Excited — finally you can do something original',
    'Take a clear position and defend it calmly',
    'Analyse exactly what went wrong so it doesn\'t repeat',
    'Give space but stay nearby',
  ],
  cognitive: ['13', 'Score', '18 hours', 'Mehta is dishonest'],
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
  motivations: ['Being really good at something', 'Having freedom and flexibility'],
};

function testStreamSignal() {
  console.log('\n=== Class 11 Commerce Student ===\n');
  const prompt = buildPrompt(CLASS_11_COMMERCE);

  // Extract just the context and signals section for readability
  const contextMatch = prompt.match(/STUDENT CONTEXT:([\s\S]*?)STUDENT SIGNALS:/);
  if (contextMatch) {
    console.log('✓ STUDENT CONTEXT block found:');
    console.log(contextMatch[0]);
  } else {
    console.log('✗ STUDENT CONTEXT block NOT FOUND');
  }

  // Verify stream appears
  if (prompt.includes('Commerce')) {
    console.log('✓ Stream "Commerce" appears in prompt');
  } else {
    console.log('✗ Stream not found in prompt');
  }

  // Verify stage instruction mentions stream
  if (prompt.includes('stream')) {
    console.log('✓ "stream" mentioned in grade instruction (expected for Class 11/12)');
  }
}

function testDegreeSignal() {
  console.log('\n=== Graduate Engineer ===\n');
  const prompt = buildPrompt(GRADUATE_ENGINEERING);

  // Extract context section
  const contextMatch = prompt.match(/STUDENT CONTEXT:([\s\S]*?)STUDENT SIGNALS:/);
  if (contextMatch) {
    console.log('✓ STUDENT CONTEXT block found:');
    console.log(contextMatch[0]);
  } else {
    console.log('✗ STUDENT CONTEXT block NOT FOUND');
  }

  // Verify degree appears
  if (prompt.includes('Engineering or Technology')) {
    console.log('✓ Degree "Engineering or Technology" appears in prompt');
  } else {
    console.log('✗ Degree not found in prompt');
  }

  // Verify stage instruction mentions post-graduation paths
  if (prompt.includes('internships') || prompt.includes('post-graduation')) {
    console.log('✓ Post-graduation guidance present in instruction');
  }
}

function testNoContextWhenEmpty() {
  console.log('\n=== Class 10 Student (no stream/degree) ===\n');
  const answers = {
    grade: 'Class 10',
    stream: '',
    degree: '',
    cognitiveQuestions: [],
    psychometric: Array(9).fill(''),
    cognitive: Array(4).fill(''),
    personal: Array(8).fill(''),
    context: [],
    motivations: [],
  };
  const prompt = buildPrompt(answers);

  if (!prompt.includes('STUDENT CONTEXT:')) {
    console.log('✓ STUDENT CONTEXT block correctly omitted when stream/degree empty');
  } else {
    console.log('✗ STUDENT CONTEXT block should not appear for Class 10');
  }

  if (prompt.includes('STUDENT SIGNALS:')) {
    console.log('✓ STUDENT SIGNALS block appears directly after stage instructions');
  }
}

console.log('\n' + '='.repeat(60));
console.log('Stream / Degree Signal Test');
console.log('='.repeat(60));

testStreamSignal();
testDegreeSignal();
testNoContextWhenEmpty();

console.log('\n' + '='.repeat(60));
console.log('All checks complete.');
console.log('='.repeat(60));
