import { useState, useEffect } from 'react'
import Intro from './components/Intro'
import GradeSelect from './components/GradeSelect'
import Assessment from './components/Assessment'
import Checkpoint from './components/Checkpoint'
import Motivations from './components/Motivations'
import Loading from './components/Loading'
import Results from './components/Results'
import { psychometric, personal, context as contextQs, getCognitiveQuestions } from './data/questions'
import { buildPrompt } from './data/prompt'
import { callVEG } from './utils/api'

export default function App() {
  const [screen, setScreen] = useState('intro')
  const [answers, setAnswers] = useState({
    grade: '',
    cognitiveQuestions: [],
    psychometric: [],
    cognitive: [],
    personal: [],
    context: [],
    motivations: [],
  })
  const [result, setResult] = useState(null)

  useEffect(() => {
    if (screen !== 'loading') return
    const prompt = buildPrompt(answers)
    callVEG(prompt)
      .then((data) => {
        setResult(data)
        setScreen('results')
      })
      .catch((err) => {
        console.error('VEG error:', err)
        setScreen('results')
      })
  }, [screen]) // eslint-disable-line react-hooks/exhaustive-deps

  function restart() {
    setAnswers({
      grade: '',
      cognitiveQuestions: [],
      psychometric: [],
      cognitive: [],
      personal: [],
      context: [],
      motivations: [],
    })
    setResult(null)
    setScreen('intro')
  }

  if (screen === 'intro') {
    return <Intro onStart={() => setScreen('grade')} />
  }

  if (screen === 'grade') {
    return (
      <GradeSelect
        onComplete={(g) => {
          const cogQs = getCognitiveQuestions(g)
          setAnswers((prev) => ({ ...prev, grade: g, cognitiveQuestions: cogQs }))
          setScreen('psychometric')
        }}
      />
    )
  }

  if (screen === 'psychometric') {
    return (
      <Assessment
        tag="How you think"
        questions={psychometric}
        multiSelect={false}
        onComplete={(a) => {
          setAnswers((prev) => ({ ...prev, psychometric: a }))
          setScreen('checkpoint1')
        }}
      />
    )
  }

  if (screen === 'checkpoint1') {
    return (
      <Checkpoint
        number={1}
        answers={answers}
        onContinue={() => setScreen('cognitive')}
      />
    )
  }

  if (screen === 'cognitive') {
    return (
      <Assessment
        tag="How you solve things"
        questions={answers.cognitiveQuestions}
        multiSelect={false}
        onComplete={(a) => {
          setAnswers((prev) => ({ ...prev, cognitive: a }))
          setScreen('checkpoint2')
        }}
      />
    )
  }

  if (screen === 'checkpoint2') {
    return (
      <Checkpoint
        number={2}
        answers={answers}
        onContinue={() => setScreen('personal')}
      />
    )
  }

  if (screen === 'personal') {
    return (
      <Assessment
        tag="What you're into"
        questions={personal}
        multiSelect={true}
        onComplete={(a) => {
          setAnswers((prev) => ({ ...prev, personal: a }))
          setScreen('checkpoint3')
        }}
      />
    )
  }

  if (screen === 'checkpoint3') {
    return (
      <Checkpoint
        number={3}
        answers={answers}
        onContinue={() => setScreen('motivations')}
      />
    )
  }

  if (screen === 'motivations') {
    return (
      <Motivations
        onComplete={(m) => {
          setAnswers((prev) => ({ ...prev, motivations: m }))
          setScreen('context')
        }}
      />
    )
  }

  if (screen === 'context') {
    return (
      <Assessment
        tag="One last thing"
        questions={contextQs}
        multiSelect={false}
        onComplete={(a) => {
          setAnswers((prev) => ({ ...prev, context: a }))
          setScreen('loading')
        }}
      />
    )
  }

  if (screen === 'loading') {
    return <Loading />
  }

  if (screen === 'results') {
    return <Results result={result} onRestart={restart} />
  }

  return null
}
