import { useEffect, useRef, useState } from 'react'
import { askDuck } from '../api.ts'
import type { DuckMessage } from '../api.ts'
import { useStudent } from '../student.tsx'

const greeting: DuckMessage = {
  who: 'duck',
  text: "quack. i'm spookie. tell me what's going wrong in a class, out loud, one piece at a time. we'll untangle it together.",
}

const starters = [
  "i don't know where to start studying",
  'i keep leaving things to the last night',
  'i did badly on the midterm',
]

// fixed positions so the sparks don't jump around on every render
const sparks = Array.from({ length: 28 }, (_, i) => ({
  left: `${(i * 37) % 100}%`,
  top: `${(i * 53) % 100}%`,
  size: 2 + (i % 3),
  delay: `${(i % 7) * 0.4}s`,
  color: ['#ffd33d', '#f778ba', '#a371f7', '#58a6ff', '#39d353'][i % 5],
}))

function Duck() {
  const { id, record } = useStudent()
  const [messages, setMessages] = useState<DuckMessage[]>([greeting])
  const [draft, setDraft] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const chat = useRef<HTMLDivElement>(null)

  useEffect(() => {
    // scroll only the chat box: scrollIntoView would also shift the pond
    if (chat.current) chat.current.scrollTop = chat.current.scrollHeight
  }, [messages, loading])

  async function send(text: string) {
    const clean = text.trim()
    if (!clean || loading) return
    const next: DuckMessage[] = [...messages, { who: 'student', text: clean }]
    setMessages(next)
    setDraft('')
    setLoading(true)
    setError('')
    try {
      // the greeting is ours, not the model's: the conversation starts with the student
      const reply = await askDuck(next.slice(1), record ? id : undefined)
      setMessages([...next, { who: 'duck', text: reply }])
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex max-w-3xl flex-col gap-4 p-2">
      <div>
        <h2 className="text-xl font-bold">spookie's pond</h2>
        <p className="mt-1 text-sm text-zinc-500">
          rubber duck debugging, for classes. explain what's stuck and spookie helps you find the next small step.
        </p>
      </div>

      <div className="relative overflow-hidden rounded-2xl border border-purple-900 bg-gradient-to-b from-[#1b1033] via-[#1e1b4b] to-[#0f3d4a] text-white shadow-lg">
        <div aria-hidden="true" className="pointer-events-none absolute inset-0">
          <div className="absolute -right-8 -top-8 h-36 w-36 rounded-full bg-amber-200/30 blur-2xl" />
          <div className="absolute right-8 top-6 h-12 w-12 rounded-full bg-amber-100 shadow-[0_0_40px_10px_rgba(253,230,138,0.5)]" />
          {sparks.map((spark, i) => (
            <span
              key={i}
              className="pond-spark absolute rounded-full"
              style={{
                left: spark.left,
                top: spark.top,
                width: spark.size,
                height: spark.size,
                background: spark.color,
                boxShadow: `0 0 8px 2px ${spark.color}`,
                animationDelay: spark.delay,
              }}
            />
          ))}
        </div>

        <div className="relative flex items-end gap-3 px-5 pt-5">
          <img src="/duck.svg" alt="spookie, a rubber duck in a witch hat" className="pond-duck h-24 w-24 shrink-0" />
          <p className="mb-3 text-sm text-purple-100">
            {record
              ? `i can see how ${record.student.course} is going for you, so my advice matches your dashboard.`
              : 'tell me which class is on your mind.'}
          </p>
        </div>

        <div
          ref={chat}
          className="relative mx-4 mt-2 flex h-80 flex-col gap-3 overflow-y-auto rounded-xl bg-cyan-950/50 p-4 ring-1 ring-cyan-300/20"
          aria-live="polite"
        >
          {messages.map((message, i) => (
            <div
              key={i}
              className={`max-w-[85%] whitespace-pre-wrap rounded-2xl px-4 py-2 text-sm ${
                message.who === 'duck'
                  ? 'self-start bg-purple-950/80 ring-1 ring-purple-300/30'
                  : 'self-end bg-amber-300 text-zinc-900'
              }`}
            >
              {message.text}
            </div>
          ))}
          {loading && <div className="self-start rounded-2xl bg-purple-950/80 px-4 py-2 text-sm text-purple-200">spookie is thinking…</div>}
        </div>

        {messages.length === 1 && (
          <div className="relative flex flex-wrap gap-2 px-4 pt-3">
            {starters.map((starter) => (
              <button
                key={starter}
                onClick={() => send(starter)}
                className="rounded-full border border-purple-300/40 px-3 py-1 text-xs text-purple-100 hover:bg-purple-900/60"
              >
                {starter}
              </button>
            ))}
          </div>
        )}

        <form
          onSubmit={(e) => {
            e.preventDefault()
            send(draft)
          }}
          className="relative flex gap-2 p-4"
        >
          <input
            aria-label="message to spookie"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            maxLength={2000}
            placeholder="talk it through…"
            className="min-w-0 flex-1 rounded-full border border-cyan-300/30 bg-slate-950/60 px-4 py-2 text-sm text-white placeholder:text-slate-400"
          />
          <button
            type="submit"
            disabled={loading || !draft.trim()}
            className="rounded-full bg-amber-400 px-4 py-2 text-sm font-semibold text-zinc-900 hover:bg-amber-300 disabled:opacity-50"
          >
            send
          </button>
        </form>
        {error && <p className="relative px-5 pb-3 text-sm text-orange-300">{error}</p>}
      </div>

      <p className="text-xs text-zinc-500">
        spookie is an ai (google gemini) and can be wrong. your messages are sent to gemini to write the reply and are
        not stored by this app. spookie is not a counsellor: if you are struggling, please reach out to campus support.
      </p>
    </div>
  )
}

export default Duck
