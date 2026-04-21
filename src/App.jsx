import { useState, useEffect } from 'react'
import Intro from './components/Intro'
import GradeSelect from './components/GradeSelect'
import Assessment from './components/Assessment'
import Checkpoint from './components/Checkpoint'
import Motivations from './components/Motivations'
import Loading from './components/Loading'
import Results from './components/Results'
import SignIn from './components/SignIn'
import { psychometric, personal, getCognitiveQuestions } from './data/questions'
import { buildPrompt } from './data/prompt'
import { callVEG, saveSession } from './utils/api'

export default function App() {
  const [screen, setScreen] = useState('intro')
  const [showSignIn, setShowSignIn] = useState(false)
  const [userId, setUserId] = useState(null)
  const [userEmail, setUserEmail] = useState(null)
  const [answers, setAnswers] = useState({
    grade: '',
    cognitiveQuestions: [],
    psychometric: [],
    cognitive: [],
    personal: [],
    motivations: [],
  })
  const [result, setResult] = useState(null)
  const [sessionId, setSessionId] = useState(null)

  useEffect(() => {
    if (screen !== 'loading') return
    const prompt = buildPrompt(answers)
    callVEG(prompt)
      .then(async (data) => {
        const sid = await saveSession(answers.grade, answers, data)
        setSessionId(sid)
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
      motivations: [],
    })
    setResult(null)
    setSessionId(null)
    setUserId(null)
    setUserEmail(null)
    setScreen('intro')
  }

  if (screen === 'intro') {
    return (
      <>
        <Intro onStart={() => setShowSignIn(true)} />
        {showSignIn && (
          <SignIn
            onClose={() => setShowSignIn(false)}
            onVerified={(uid, email) => {
              setUserId(uid)
              setUserEmail(email)
              setShowSignIn(false)
              setScreen('grade')
            }}
          />
        )}
      </>
    )
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
          setScreen('loading')
        }}
      />
    )
  }

  if (screen === 'loading') {
    return <Loading />
  }

  if (screen === 'results') {
    return <Results result={result} sessionId={sessionId} grade={answers.grade} userId={userId} userEmail={userEmail} onRestart={restart} />
  }

  return null
}
