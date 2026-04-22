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
import { callVEG, saveSession, fetchLatestSession } from './utils/api'
import Returning from './components/Returning'
import SignOutChip from './components/SignOutChip'

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
  const [priorSession, setPriorSession] = useState(null)
  const [checkingSession, setCheckingSession] = useState(false)

  // Restore auth from localStorage on mount and check for active session
  useEffect(() => {
    try {
      const saved = localStorage.getItem('cs_auth')
      if (!saved) return
      const { userId: uid, userEmail: em } = JSON.parse(saved)
      if (!uid) return
      setUserId(uid)
      setUserEmail(em)
      setCheckingSession(true)
      fetchLatestSession(uid)
        .then((sess) => {
          if (sess) {
            setPriorSession(sess)
            setResult(sess.result)
            setSessionId(sess.id)
            setAnswers((prev) => ({ ...prev, grade: sess.grade }))
            setScreen('returning')
          }
          // No session found — stay on intro; userId is already set so
          // the next "Let's find out" click skips sign-in and goes to grade
        })
        .catch(() => {})
        .finally(() => setCheckingSession(false))
    } catch {
      localStorage.removeItem('cs_auth')
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (screen !== 'loading') return
    const prompt = buildPrompt(answers)
    callVEG(prompt)
      .then(async (data) => {
        const { cognitiveQuestions: _cq, ...answersToSave } = answers
        const sid = await saveSession(answers.grade, answersToSave, data, userId)
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
    setPriorSession(null)
    setCheckingSession(false)
    setScreen('intro')
    localStorage.removeItem('cs_auth')
  }

  async function handleVerified(uid, email) {
    setUserId(uid)
    setUserEmail(email)
    localStorage.setItem('cs_auth', JSON.stringify({ userId: uid, userEmail: email }))
    setShowSignIn(false)
    setCheckingSession(true)
    try {
      const sess = await fetchLatestSession(uid)
      if (sess) {
        setPriorSession(sess)
        setResult(sess.result)
        setSessionId(sess.id)
        setAnswers((prev) => ({ ...prev, grade: sess.grade }))
        setScreen('returning')
      } else {
        setScreen('grade')
      }
    } catch {
      setScreen('grade')
    } finally {
      setCheckingSession(false)
    }
  }

  if (checkingSession) return <Loading />

  if (screen === 'intro') {
    return (
      <>
        <Intro onStart={() => setShowSignIn(true)} />
        {showSignIn && (
          <SignIn
            onClose={() => setShowSignIn(false)}
            onVerified={handleVerified}
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

  if (screen === 'returning') {
    return <Returning daysRemaining={priorSession?.daysRemaining} userEmail={userEmail} onViewResults={() => setScreen('results')} onSignOut={restart} />
  }

  if (screen === 'results') {
    return <Results result={result} sessionId={sessionId} grade={answers.grade} userId={userId} userEmail={userEmail} onRestart={restart} onSignOut={restart} daysRemaining={priorSession ? priorSession.daysRemaining : null} />
  }

  return null
}
