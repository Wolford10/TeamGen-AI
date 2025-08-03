'use client'
import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'

const questions = [
  { key: 'sport', question: 'What sport?' },
  { key: 'style', question: 'What style?' },
  { key: 'location', question: 'Location or color? (e.g. Boston, blue)' },
  { key: 'cleanOrDirty', question: 'Appropriate?' },
  { key: 'extra', question: 'Is there anything else you want to be included? Any keywords or tones you want?' },
  { key: 'player', question: 'Player name? (optional - for fantasy puns)' },
]

// Function to get dynamic question text based on current answers
const getQuestionText = (questionKey: string, currentAnswers: { sport: string; style: string }) => {
  if (questionKey === 'location') {
    // Show "Location or Team" for fantasy football, "Location or color" for others
    if (currentAnswers.style === 'fantasy' && currentAnswers.sport?.toLowerCase() === 'football') {
      return 'Location or Team? (e.g. Bengals, Chiefs, Boston)'
    }
    return 'Location or color? (e.g. Boston, blue)'
  }
  if (questionKey === 'extra') {
    return `Is there anything else you want to be included? Any keywords or tones you want?

Examples:
• Keywords: "ballers", "crushers", "thunder", "fire"
• Tones: "funny", "aggressive", "elegant", "fierce"
• Leave blank if none`
  }
  return questions.find(q => q.key === questionKey)?.question || ''
}

// PaywallModal component
function PaywallModal({ show, onClose }: { show: boolean, onClose: () => void }) {
  const [loading, setLoading] = useState(false);
  
  const handleCheckout = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/create-checkout-session', { method: 'POST' });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        alert('Failed to start checkout. Please try again.');
        setLoading(false);
      }
    } catch (err) {
      alert('Error connecting to payment service.');
      setLoading(false);
    }
  };

  if (!show) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-70">
      <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full text-center relative">
        <button
          className="absolute top-3 right-3 text-gray-400 hover:text-gray-700 text-2xl font-bold"
          onClick={onClose}
          aria-label="Close"
        >
          ×
        </button>
        <div className="text-4xl mb-2">🛑 Hold up, Coach!</div>
        <div className="text-lg font-bold mb-4 text-gray-800">You&apos;ve hit your 5 free team drafts.</div>
        <div className="mb-4 text-gray-700">
          Ready to build more dream squads, generate custom mascot art, and unlock limitless creativity?
        </div>
        <div className="bg-yellow-100 rounded-lg p-4 mb-4 text-left">
          <div className="mb-2 text-xl font-semibold text-gray-800">🔓 Unlock unlimited access for just <span className='text-green-600'>$3.99</span> (one-time)</div>
          <ul className="list-disc list-inside text-gray-800 text-left">
            <li>✅ Unlimited team name generations</li>
            <li>✅ Mascot + logo image generation</li>
            <li>✅ No account needed — instant access</li>
          </ul>
        </div>
        <button
          onClick={handleCheckout}
          disabled={loading}
          className={`inline-block w-full py-3 rounded-full bg-purple-600 text-white font-bold text-lg mb-2 hover:bg-purple-700 transition ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          {loading ? 'Redirecting…' : 'Unlock Now'}
        </button>
        <div className="text-xs text-gray-500">One-time payment. Instant access. No recurring fees.</div>
      </div>
    </div>
  );
}

export default function PromptForm() {
  const [answers, setAnswers] = useState<{
    [key: string]: string
    sport: string
    style: string
    location: string
    cleanOrDirty: string
    extra: string
    player: string
  }>({
    sport: '',
    style: '',
    location: '',
    cleanOrDirty: '',
    extra: '',
    player: '',
  })
  const [currentStep, setCurrentStep] = useState(0)
  const [input, setInput] = useState('')
  const [teamNames, setTeamNames] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const [isTyping, setIsTyping] = useState(false)
  const [pendingAnswer, setPendingAnswer] = useState<string | null>(null)
  const [editingKey, setEditingKey] = useState<string | null>(null)
  const [genBlocked, setGenBlocked] = useState(false)
  const [genCount, setGenCount] = useState(0)
  const [userHasPaid, setUserHasPaid] = useState(false)
  const [showPaywall, setShowPaywall] = useState(false)
  const [paidGenCount, setPaidGenCount] = useState(0)
  const [paidGenDate, setPaidGenDate] = useState('')
  const [paidCapReached, setPaidCapReached] = useState(false)

  // Ref for auto-scrolling to bottom
  const bottomRef = useRef<HTMLDivElement>(null)

  // On mount, read localStorage values
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const count = parseInt(localStorage.getItem('nameGenCount') || '0', 10)
      setGenCount(count)
      setUserHasPaid(localStorage.getItem('userHasPaid') === 'true')
      if (localStorage.getItem('userHasPaid') !== 'true' && count >= 5) {
        setGenBlocked(true)
        setShowPaywall(true)
      }
      // Paid user daily cap logic
      if (localStorage.getItem('userHasPaid') === 'true') {
        const today = new Date().toISOString().slice(0, 10)
        const paidDate = localStorage.getItem('paidNameGenDate') || ''
        let paidCount = parseInt(localStorage.getItem('paidNameGenCount') || '0', 10)
        if (paidDate !== today) {
          paidCount = 0
          localStorage.setItem('paidNameGenDate', today)
          localStorage.setItem('paidNameGenCount', '0')
        }
        setPaidGenDate(today)
        setPaidGenCount(paidCount)
        if (paidCount >= 200) {
          setPaidCapReached(true)
        }
      }
    }
  }, [])

  // Auto-scroll to bottom when conversation updates
  useEffect(() => {
    const scrollToBottom = () => {
      if (bottomRef.current) {
        bottomRef.current.scrollIntoView({ 
          behavior: 'smooth', 
          block: 'end' 
        })
      }
    }

    // Immediate scroll for most updates
    scrollToBottom()
    
    // Additional scroll after typing animation for better UX
    if (isTyping) {
      const timer = setTimeout(scrollToBottom, 500)
      return () => clearTimeout(timer)
    }
  }, [currentStep, isTyping, teamNames.length, editingKey])

  // Helper to check if generation is allowed
  const canGenerate = userHasPaid || genCount < 5

  const handleNext = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const key = questions[currentStep].key
    setPendingAnswer(input) // Show answer bubble immediately
    setInput('')
    setIsTyping(true)
    await new Promise((resolve) => setTimeout(resolve, 1000))
    setIsTyping(false)
    setAnswers((prev) => ({ ...prev, [key]: pendingAnswer || input }))
    setPendingAnswer(null)
    setCurrentStep((prev) => prev + 1)
  }

  const handleGenerate = async () => {
    // Check again in case localStorage changed
    const paid = localStorage.getItem('userHasPaid') === 'true'
    const count = parseInt(localStorage.getItem('nameGenCount') || '0', 10)
    if (!paid && count >= 5) {
      setGenBlocked(true)
      setShowPaywall(true)
      return
    }
    // Paid user daily cap logic
    if (paid) {
      const today = new Date().toISOString().slice(0, 10)
      let paidDate = localStorage.getItem('paidNameGenDate') || ''
      let paidCount = parseInt(localStorage.getItem('paidNameGenCount') || '0', 10)
      if (paidDate !== today) {
        paidDate = today
        paidCount = 0
        localStorage.setItem('paidNameGenDate', today)
        localStorage.setItem('paidNameGenCount', '0')
      }
      if (paidCount >= 200) {
        setPaidCapReached(true)
        return
      }
      paidCount += 1
      localStorage.setItem('paidNameGenCount', paidCount.toString())
      setPaidGenCount(paidCount)
      if (paidCount >= 200) {
        setPaidCapReached(true)
      }
    }
    // Increment count if not paid
    if (!paid) {
      const newCount = count + 1
      localStorage.setItem('nameGenCount', newCount.toString())
      setGenCount(newCount)
      if (newCount >= 5) {
        setGenBlocked(true)
      }
    }
    setLoading(true)
    const res = await fetch('/api/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(answers),
    })
    const data = await res.json()
    setTeamNames(Array.isArray(data.names) ? data.names : [data.name])
    setLoading(false)
  }

  // For select-type questions, show clean input fields
  const renderInput = () => {
    const key = questions[currentStep].key
    const inputClass =
      'w-full border border-gray-300 rounded-lg px-6 py-4 bg-white text-gray-800 focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-purple-400 transition shadow-sm text-lg';
    
    if (key === 'style') {
      return (
        <div className="flex gap-3">
          <button
            type="button"
            className={`flex-1 px-6 py-4 rounded-lg font-medium transition focus:outline-none focus:ring-2 focus:ring-purple-400 text-lg ${input === 'fantasy' ? 'bg-purple-500 text-white shadow-md' : 'bg-white text-gray-700 border border-gray-300 hover:border-purple-300 shadow-sm'}`}
            onClick={() => setInput('fantasy')}
          >
            Fantasy
          </button>
          <button
            type="button"
            className={`flex-1 px-6 py-4 rounded-lg font-medium transition focus:outline-none focus:ring-2 focus:ring-purple-400 text-lg ${input === 'real' ? 'bg-purple-500 text-white shadow-md' : 'bg-white text-gray-700 border border-gray-300 hover:border-purple-300 shadow-sm'}`}
            onClick={() => setInput('real')}
          >
            Real
          </button>
        </div>
      )
    }
    if (key === 'cleanOrDirty') {
      return (
        <div className="flex gap-3">
          <button
            type="button"
            className={`flex-1 px-6 py-4 rounded-lg font-medium transition focus:outline-none focus:ring-2 focus:ring-purple-400 text-lg ${input === 'clean' ? 'bg-purple-500 text-white shadow-md' : 'bg-white text-gray-700 border border-gray-300 hover:border-purple-300 shadow-sm'}`}
            onClick={() => setInput('clean')}
          >
            Yes
          </button>
          <button
            type="button"
            className={`flex-1 px-6 py-4 rounded-lg font-medium transition focus:outline-none focus:ring-2 focus:ring-purple-400 text-lg ${input === 'dirty' ? 'bg-purple-500 text-white shadow-md' : 'bg-white text-gray-700 border border-gray-300 hover:border-purple-300 shadow-sm'}`}
            onClick={() => setInput('dirty')}
          >
            No
          </button>
        </div>
      )
    }
    return (
      <input
        className={inputClass}
        value={input}
        onChange={(e) => setInput(e.target.value)}
        placeholder={
          key === 'sport' ? 'Football, Soccer, Basketball, ETC' : 
          key === 'location' ? 
            (answers.style === 'fantasy' && answers.sport?.toLowerCase() === 'football' ? 
              'Bengals, Chiefs, Boston, etc.' : 
              'Boston, Blue, etc.') : 
          key === 'extra' ? 'ballers, crushers, funny, aggressive, etc.' : 
          key === 'player' ? 'Player name for fantasy puns' : ''
        }
        autoFocus
      />
    )
  }

  // Filter questions based on style selection
  const filteredQuestions = questions.filter((q, index) => {
    // Always show first 5 questions (sport, style, location, cleanOrDirty, extra)
    if (index < 5) return true
    // Only show player question if style is fantasy
    if (q.key === 'player') return answers.style === 'fantasy'
    return true
  })

  // Build a flat list of messages (question, then answer if present)
  const messages = [] as { type: 'question' | 'answer', text: string, key: string }[]
  for (let i = 0; i < currentStep; i++) {
    const question = filteredQuestions[i]
    if (question) {
      messages.push({ type: 'question', text: getQuestionText(question.key, answers), key: question.key + '-q' })
      if (answers[question.key]) {
        messages.push({ type: 'answer', text: answers[question.key], key: question.key + '-a' })
      }
    }
  }
  // If waiting for typing, show the pending Q/A pair
  if (isTyping && currentStep < filteredQuestions.length && pendingAnswer) {
    const currentQuestion = filteredQuestions[currentStep]
    if (currentQuestion) {
      messages.push({ type: 'question', text: getQuestionText(currentQuestion.key, answers), key: currentQuestion.key + '-q-current' })
      messages.push({ type: 'answer', text: pendingAnswer, key: currentQuestion.key + '-a-current' })
    }
  }

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-pink-50 via-purple-50 to-white flex flex-col items-center py-8 px-4">
      
      <PaywallModal show={showPaywall && genBlocked && !userHasPaid} onClose={() => setShowPaywall(false)} />
      
      {/* Logo and Title */}
      <div className="text-center mb-12 relative z-10">
        <div className="flex justify-center mb-4">
          <div className="w-8 h-8 flex items-center justify-center">
            <div className="w-2 h-2 bg-gray-800 rounded-full mx-1"></div>
            <div className="w-2 h-2 bg-gray-800 rounded-full mx-1"></div>
            <div className="w-2 h-2 bg-gray-800 rounded-full mx-1"></div>
          </div>
        </div>
        <h1 className="text-4xl md:text-5xl font-bold text-gray-800 tracking-tight">Team Name Generator</h1>
      </div>
      
      <div className="w-full max-w-2xl mx-auto flex-1 flex flex-col relative z-10">
        {/* Progress indicator with navigation */}
        {currentStep > 0 && (
          <div className="flex justify-center mb-6">
            <div className="flex gap-2 items-center">
              {filteredQuestions.slice(0, currentStep).map((question, idx) => (
                <button
                  key={question.key}
                  onClick={() => {
                    setCurrentStep(idx)
                    setInput(answers[question.key] || '')
                  }}
                  className={`w-3 h-3 rounded-full transition ${
                    idx === currentStep - 1 
                      ? 'bg-purple-500 ring-2 ring-purple-200' 
                      : 'bg-gray-300 hover:bg-gray-400'
                  }`}
                  title={`Go back to: ${getQuestionText(question.key, answers)}`}
                />
              ))}
              {/* Current question indicator */}
              {currentStep < filteredQuestions.length && (
                <div className="w-3 h-3 rounded-full bg-purple-300 border-2 border-purple-500 animate-pulse" />
              )}
            </div>
          </div>
        )}
        
        {/* Render each message (question or answer) as its own row */}
        {messages.map((msg, idx) => {
          if (msg.type === 'answer') {
            // Find the question key
            const qIdx = filteredQuestions.findIndex(q => q.key + '-a' === msg.key)
            const qKey = filteredQuestions[qIdx]?.key
            
            return (
              <div key={msg.key} className="flex w-full justify-end items-center gap-2 mb-4">
                {editingKey === qKey ? (
                  <EditAnswerForm
                    qKey={qKey}
                    initialValue={answers[qKey] || ''}
                    onSave={val => {
                      setAnswers(prev => ({ ...prev, [qKey]: val }))
                      setEditingKey(null)
                    }}
                    onCancel={() => setEditingKey(null)}
                  />
                ) : (
                  <>
                    <div
                      className="bg-white rounded-lg px-4 py-3 text-base max-w-[70%] md:max-w-[40%] text-gray-800 font-medium shadow-sm border border-gray-200"
                    >
                      {msg.text}
                    </div>
                    <button
                      type="button"
                      className="ml-2 px-3 py-1 rounded-lg bg-purple-500 text-white text-xs font-semibold hover:bg-purple-600 transition"
                      onClick={() => setEditingKey(qKey)}
                    >
                      Edit
                    </button>
                  </>
                )}
              </div>
            )
          }
          // Default rendering for questions
          return (
            <div
              key={msg.key}
              className="flex w-full justify-start mb-4"
            >
              <div
                className="rounded-lg px-4 py-3 text-base max-w-[70%] md:max-w-[40%] bg-white text-gray-800 font-semibold shadow-sm border border-gray-200"
              >
                {msg.text}
              </div>
            </div>
          )
        })}
        {/* Current question as AI bubble (always visible, except when isTyping and already rendered above) */}
        {currentStep < filteredQuestions.length && !isTyping && (
          <div className="flex w-full justify-start mb-4">
            <div className="rounded-lg px-4 py-3 bg-white text-gray-800 font-semibold text-base max-w-[70%] md:max-w-[40%] shadow-sm border border-gray-200">
              {getQuestionText(filteredQuestions[currentStep].key, answers)}
            </div>
          </div>
        )}

        {/* Typing indicator (shows below the question/answer bubbles) */}
        {isTyping && (
          <div className="flex w-full justify-start mt-2">
            <div className="rounded-full px-4 py-2 bg-gray-700 text-white font-normal text-base max-w-[60%] flex items-center gap-2 animate-pulse">
              <span className="opacity-80">AI is typing</span>
              <span className="flex gap-1">
                <span className="inline-block w-2 h-2 bg-white rounded-full animate-bounce" style={{ animationDelay: '0s' }}></span>
                <span className="inline-block w-2 h-2 bg-white rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></span>
                <span className="inline-block w-2 h-2 bg-white rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></span>
              </span>
            </div>
          </div>
        )}
        {/* Generate button after last question */}
        {currentStep === filteredQuestions.length && (
          <>
            <button
              onClick={handleGenerate}
              className="w-full max-w-md mx-auto mt-6 px-6 py-4 rounded-lg bg-purple-500 text-white font-semibold text-lg transition disabled:opacity-50 hover:bg-purple-600 shadow-md"
              disabled={loading || genBlocked || paidCapReached}
            >
              {loading ? 'Generating...' : 'Generate Team Names'}
            </button>
            {genBlocked && !userHasPaid && (
              <div className="mt-4 text-center text-red-400 font-semibold">
                You&apos;ve reached your 5 free team name generations.<br />
                <button
                  className="underline text-blue-400 hover:text-blue-600 mt-2"
                  onClick={() => setShowPaywall(true)}
                >
                  Upgrade to unlock unlimited names!
                </button>
              </div>
            )}
            {userHasPaid && paidCapReached && (
              <div className="mt-4 text-center text-yellow-500 font-semibold">
                You&apos;ve hit today&apos;s limit. Come back tomorrow for more team-building action!
              </div>
            )}
          </>
        )}
        {/* Team name choices as clean cards */}
        {teamNames.length > 0 && (
          <div className="flex flex-col gap-4 w-full items-center mt-8">
            <div className="rounded-lg px-4 py-3 bg-white text-gray-800 font-semibold text-base max-w-[70%] md:max-w-[40%] text-center shadow-sm border border-gray-200">
              Click a team name to see mascot, lore, and a custom AI mascot image!
            </div>
            <div className="flex flex-col gap-3 w-full items-center">
              {teamNames.map((name, idx) => (
                <Link
                  key={idx}
                  href={`/team/${encodeURIComponent(name)}`}
                  className="rounded-lg px-4 py-3 w-full max-w-[70%] md:max-w-[40%] text-base font-medium transition bg-white text-gray-800 hover:bg-purple-50 hover:border-purple-300 text-center shadow-sm border border-gray-200 hover:shadow-md"
                >
                  {name}
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
      
      {/* Input form at bottom center */}
      {!isTyping && currentStep < filteredQuestions.length && (
        <div className="w-full flex justify-center mt-8 relative z-10">
          <div className="flex flex-col gap-3 w-full max-w-lg">
            <form onSubmit={handleNext} className="flex flex-row gap-3 items-center w-full">
              <div className="flex-1">{renderInput()}</div>
              <button
                type="submit"
                className="px-6 py-3 rounded-lg bg-purple-500 text-white font-semibold transition disabled:opacity-50 transform hover:scale-105 hover:bg-purple-600 active:scale-95 duration-200 ease-in-out shadow-sm"
                disabled={!input}
              >
                →
              </button>
            </form>
            {/* Back button */}
            {currentStep > 0 && (
              <button
                type="button"
                onClick={() => {
                  setCurrentStep(currentStep - 1)
                  setInput(answers[filteredQuestions[currentStep - 1].key] || '')
                }}
                className="self-center px-4 py-2 text-sm text-gray-600 hover:text-gray-800 transition"
              >
                ← Back to previous question
              </button>
            )}
          </div>
        </div>
      )}
      
      {/* Auto-scroll target */}
      <div ref={bottomRef} />
    </div>
  )
}

// Add EditAnswerForm component for editing answers
function EditAnswerForm({ qKey, initialValue, onSave, onCancel }: { qKey: string, initialValue: string, onSave: (val: string) => void, onCancel: () => void }) {
  const [val, setVal] = useState(initialValue)
  // Reuse the input UI logic for each question type
  const inputClass =
    'w-full border border-gray-300 rounded-lg px-4 py-3 bg-white text-gray-800 focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-purple-400 transition shadow-sm';
  let inputElem = null
  if (qKey === 'style') {
    inputElem = (
      <div className="flex gap-3">
        <button
          type="button"
          className={`flex-1 px-4 py-3 rounded-lg font-medium transition focus:outline-none focus:ring-2 focus:ring-purple-400 ${val === 'fantasy' ? 'bg-purple-500 text-white shadow-md' : 'bg-white text-gray-700 border border-gray-300 hover:border-purple-300 shadow-sm'}`}
          onClick={() => setVal('fantasy')}
        >
          Fantasy
        </button>
        <button
          type="button"
          className={`flex-1 px-4 py-3 rounded-lg font-medium transition focus:outline-none focus:ring-2 focus:ring-purple-400 ${val === 'real' ? 'bg-purple-500 text-white shadow-md' : 'bg-white text-gray-700 border border-gray-300 hover:border-purple-300 shadow-sm'}`}
          onClick={() => setVal('real')}
        >
          Real
        </button>
      </div>
    )
  } else if (qKey === 'cleanOrDirty') {
    inputElem = (
      <div className="flex gap-3">
        <button
          type="button"
          className={`flex-1 px-4 py-3 rounded-lg font-medium transition focus:outline-none focus:ring-2 focus:ring-purple-400 ${val === 'clean' ? 'bg-purple-500 text-white shadow-md' : 'bg-white text-gray-700 border border-gray-300 hover:border-purple-300 shadow-sm'}`}
          onClick={() => setVal('clean')}
        >
          Yes
        </button>
        <button
          type="button"
          className={`flex-1 px-4 py-3 rounded-lg font-medium transition focus:outline-none focus:ring-2 focus:ring-purple-400 ${val === 'dirty' ? 'bg-purple-500 text-white shadow-md' : 'bg-white text-gray-700 border border-gray-300 hover:border-purple-300 shadow-sm'}`}
          onClick={() => setVal('dirty')}
        >
          No
        </button>
      </div>
    )
  } else {
    inputElem = (
      <input
        className={inputClass}
        value={val}
        onChange={e => setVal(e.target.value)}
        autoFocus
      />
    )
  }
  return (
    <form
      onSubmit={e => {
        e.preventDefault()
        onSave(val)
      }}
      className="flex flex-row gap-2 items-center w-full max-w-[70%] md:max-w-[40%]"
    >
      <div className="flex-1">{inputElem}</div>
      <button
        type="submit"
        className="px-4 py-3 rounded-lg bg-purple-500 text-white font-semibold transition hover:bg-purple-600 shadow-sm"
        disabled={!val}
      >
        Save
      </button>
      <button
        type="button"
        className="px-4 py-3 rounded-lg bg-gray-500 text-white font-semibold transition hover:bg-gray-600 shadow-sm"
        onClick={onCancel}
      >
        Cancel
      </button>
    </form>
  )
}
