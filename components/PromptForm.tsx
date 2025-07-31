'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'

const questions = [
  { key: 'sport', question: 'What sport?' },
  { key: 'style', question: 'What style?' },
  { key: 'location', question: 'Location or color? (e.g. Boston, blue)' },
  { key: 'cleanOrDirty', question: 'Appropriate?' },
  { key: 'extra', question: 'Is there anything else you want to be included? Any keywords you want?' },
  { key: 'player', question: 'Player name? (optional - for fantasy puns)' },
]

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

  // For select-type questions, show dropdowns
  const renderInput = () => {
    const key = questions[currentStep].key
    const inputClass =
      'w-full border border-gray-600 rounded-full px-4 py-2 bg-transparent text-white focus:outline-none focus:ring-2 focus:ring-blue-400 transition';
    if (key === 'style') {
      return (
        <div className="flex gap-4">
          <button
            type="button"
            className={`px-4 py-2 rounded-full font-semibold transition focus:outline-none focus:ring-2 focus:ring-blue-400 ${input === 'fantasy' ? 'bg-blue-500 text-white' : 'bg-gray-700 text-white hover:bg-blue-400'}`}
            onClick={() => setInput('fantasy')}
          >
            Fantasy
          </button>
          <button
            type="button"
            className={`px-4 py-2 rounded-full font-semibold transition focus:outline-none focus:ring-2 focus:ring-green-400 ${input === 'real' ? 'bg-green-600 text-white' : 'bg-gray-700 text-white hover:bg-green-400'}`}
            onClick={() => setInput('real')}
          >
            Real
          </button>
        </div>
      )
    }
    if (key === 'cleanOrDirty') {
      return (
        <div className="flex gap-4">
          <button
            type="button"
            className={`px-4 py-2 rounded-full font-semibold transition focus:outline-none focus:ring-2 focus:ring-blue-400 ${input === 'clean' ? 'bg-blue-500 text-white' : 'bg-gray-700 text-white hover:bg-blue-400'}`}
            onClick={() => setInput('clean')}
          >
            Yes
          </button>
          <button
            type="button"
            className={`px-4 py-2 rounded-full font-semibold transition focus:outline-none focus:ring-2 focus:ring-purple-400 ${input === 'dirty' ? 'bg-purple-600 text-white' : 'bg-gray-700 text-white hover:bg-purple-400'}`}
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
      messages.push({ type: 'question', text: question.question, key: question.key + '-q' })
      if (answers[question.key]) {
        messages.push({ type: 'answer', text: answers[question.key], key: question.key + '-a' })
      }
    }
  }
  // If waiting for typing, show the pending Q/A pair
  if (isTyping && currentStep < filteredQuestions.length && pendingAnswer) {
    const currentQuestion = filteredQuestions[currentStep]
    if (currentQuestion) {
      messages.push({ type: 'question', text: currentQuestion.question, key: currentQuestion.key + '-q-current' })
      messages.push({ type: 'answer', text: pendingAnswer, key: currentQuestion.key + '-a-current' })
    }
  }

  return (
    <div className="chat-container flex flex-col min-h-screen items-center justify-start py-8 px-2">
      <PaywallModal show={showPaywall && genBlocked && !userHasPaid} onClose={() => setShowPaywall(false)} />
      <div className="chat-header text-center text-6xl font-extrabold text-white mb-12 tracking-tight">Team Name Generator</div>
      <div className="chat-body flex flex-col gap-6 w-full max-w-4xl mx-auto">
        {/* Render each message (question or answer) as its own row, left or right aligned */}
        {messages.map((msg, idx) => {
          if (
            msg.type === 'answer' &&
            currentStep === questions.length &&
            teamNames.length > 0 &&
            !isTyping
          ) {
            // Find the question key
            const qIdx = questions.findIndex(q => q.key + '-a' === msg.key)
            const qKey = questions[qIdx]?.key
            return (
              <div key={msg.key} className="flex w-full justify-end items-center gap-2">
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
                      className="rounded-full px-4 py-2 text-base max-w-[70%] md:max-w-[40%] bg-gradient-to-r from-pink-500 to-yellow-400 text-white font-medium"
                    >
                      {msg.text}
                    </div>
                    <button
                      type="button"
                      className="ml-2 px-3 py-1 rounded-full bg-blue-500 text-white text-xs font-semibold hover:bg-blue-600"
                      onClick={() => setEditingKey(qKey)}
                    >
                      Edit
                    </button>
                  </>
                )}
              </div>
            )
          }
          // Default rendering for other messages
          return (
            <div
              key={msg.key}
              className={`flex w-full ${msg.type === 'question' ? 'justify-start' : 'justify-end'}`}
            >
              <div
                className={`rounded-full px-4 py-2 text-base max-w-[70%] md:max-w-[40%] ${
                  msg.type === 'question'
                    ? 'bg-gradient-to-r from-blue-400 to-purple-500 text-white font-semibold'
                    : 'bg-gradient-to-r from-pink-500 to-yellow-400 text-white font-medium'
                }`}
              >
                {msg.text}
              </div>
            </div>
          )
        })}
        {/* Current question as AI bubble (always visible, except when isTyping and already rendered above) */}
        {currentStep < filteredQuestions.length && !isTyping && (
          <div className="flex w-full justify-start">
            <div className="rounded-full px-4 py-2 bg-gradient-to-r from-blue-400 to-purple-500 text-white font-semibold text-base max-w-[70%] md:max-w-[40%]">
              {filteredQuestions[currentStep].question}
            </div>
          </div>
        )}
        {/* Input form (hidden while typing) */}
        {!isTyping && currentStep < filteredQuestions.length && (
          <div className="flex w-full justify-end">
            <form onSubmit={handleNext} className="flex flex-row gap-2 items-center w-full max-w-[70%] md:max-w-[40%]">
              <div className="flex-1">{renderInput()}</div>
              <button
                type="submit"
                className="px-6 py-2 rounded-full bg-blue-500 text-white font-semibold transition disabled:opacity-50 transform hover:scale-105 hover:bg-blue-600 active:scale-95 duration-200 ease-in-out"
                disabled={!input}
              >
                Next
              </button>
            </form>
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
              className="w-full max-w-md mx-auto mt-4 px-6 py-3 rounded-full bg-purple-600 text-white font-semibold text-lg transition disabled:opacity-50"
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
        {/* Team name choices as AI message bubbles */}
        {teamNames.length > 0 && (
          <div className="flex flex-col gap-4 w-full items-center mt-6">
            <div className="rounded-full px-4 py-2 bg-gradient-to-r from-blue-400 to-purple-500 text-white font-semibold text-base max-w-[70%] md:max-w-[40%] text-center">
              Click a team name to see mascot, lore, and a custom AI mascot image!
            </div>
            <div className="flex flex-col gap-2 w-full items-center">
              {teamNames.map((name, idx) => (
                <Link
                  key={idx}
                  href={`/team/${encodeURIComponent(name)}`}
                  className="rounded-full px-4 py-2 w-full max-w-[70%] md:max-w-[40%] text-base font-medium transition bg-gray-800 text-white hover:bg-blue-500 hover:text-white text-center"
                >
                  {name}
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// Add EditAnswerForm component for editing answers
function EditAnswerForm({ qKey, initialValue, onSave, onCancel }: { qKey: string, initialValue: string, onSave: (val: string) => void, onCancel: () => void }) {
  const [val, setVal] = useState(initialValue)
  // Reuse the input UI logic for each question type
  const inputClass =
    'w-full border border-gray-600 rounded-full px-4 py-2 bg-transparent text-white focus:outline-none focus:ring-2 focus:ring-blue-400 transition';
  let inputElem = null
  if (qKey === 'style') {
    inputElem = (
      <div className="flex gap-4">
        <button
          type="button"
          className={`px-4 py-2 rounded-full font-semibold transition focus:outline-none focus:ring-2 focus:ring-blue-400 ${val === 'fantasy' ? 'bg-blue-500 text-white' : 'bg-gray-700 text-white hover:bg-blue-400'}`}
          onClick={() => setVal('fantasy')}
        >
          Fantasy
        </button>
        <button
          type="button"
          className={`px-4 py-2 rounded-full font-semibold transition focus:outline-none focus:ring-2 focus:ring-green-400 ${val === 'real' ? 'bg-green-600 text-white' : 'bg-gray-700 text-white hover:bg-green-400'}`}
          onClick={() => setVal('real')}
        >
          Real
        </button>
      </div>
    )
  } else if (qKey === 'cleanOrDirty') {
    inputElem = (
      <div className="flex gap-4">
        <button
          type="button"
          className={`px-4 py-2 rounded-full font-semibold transition focus:outline-none focus:ring-2 focus:ring-blue-400 ${val === 'clean' ? 'bg-blue-500 text-white' : 'bg-gray-700 text-white hover:bg-blue-400'}`}
          onClick={() => setVal('clean')}
        >
          Yes
        </button>
        <button
          type="button"
          className={`px-4 py-2 rounded-full font-semibold transition focus:outline-none focus:ring-2 focus:ring-purple-400 ${val === 'dirty' ? 'bg-purple-600 text-white' : 'bg-gray-700 text-white hover:bg-purple-400'}`}
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
        className="px-4 py-2 rounded-full bg-green-500 text-white font-semibold transition hover:bg-green-600"
        disabled={!val}
      >
        Save
      </button>
      <button
        type="button"
        className="px-4 py-2 rounded-full bg-gray-500 text-white font-semibold transition hover:bg-gray-600"
        onClick={onCancel}
      >
        Cancel
      </button>
    </form>
  )
}
