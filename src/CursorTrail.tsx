import { useEffect, useState } from 'react'

// a trail behind the cursor. it is decoration only, so it can be switched
// off, and it starts off for people who ask for reduced motion.
type Mode = 'off' | 'sparks' | 'duck'

const STORAGE_KEY = 'clear-view-cursor-trail'
const COLORS = ['#39d353', '#a371f7', '#f778ba', '#58a6ff', '#ffa657', '#ffd33d']
const DUCK_IMAGE = '/duck.svg'
const DUCK_SIZE = 28
// ducks are bigger than sparks, so they are dropped less often
const GAP_MS: Record<Exclude<Mode, 'off'>, number> = { sparks: 35, duck: 90 }
const LIFE_MS = 700

function startingMode(): Mode {
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved === 'off' || saved === 'sparks' || saved === 'duck') return saved
  } catch {
    // storage blocked: use the default
  }
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'off' : 'sparks'
}

function spark(count: number): HTMLElement {
  const dot = document.createElement('span')
  const color = COLORS[count % COLORS.length]
  const size = 6 + Math.random() * 8
  Object.assign(dot.style, {
    width: `${size}px`,
    height: `${size}px`,
    borderRadius: '9999px',
    background: color,
    boxShadow: `0 0 ${size}px ${color}, 0 0 ${size * 2}px ${color}`,
  })
  return dot
}

function duck(): HTMLElement {
  const image = document.createElement('img')
  image.src = DUCK_IMAGE
  image.alt = ''
  Object.assign(image.style, { width: `${DUCK_SIZE}px`, height: `${DUCK_SIZE}px` })
  return image
}

function CursorTrail() {
  const [mode, setMode] = useState<Mode>(startingMode)

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, mode)
    } catch {
      // the choice just won't survive a reload
    }
    if (mode === 'off') return

    let last = 0
    let count = 0
    const onMove = (event: MouseEvent) => {
      const now = performance.now()
      if (now - last < GAP_MS[mode]) return
      last = now
      count += 1

      const particle = mode === 'duck' ? duck() : spark(count)
      particle.setAttribute('aria-hidden', 'true')
      Object.assign(particle.style, {
        position: 'fixed',
        left: `${event.clientX}px`,
        top: `${event.clientY}px`,
        pointerEvents: 'none',
        zIndex: '9999',
      })
      document.body.appendChild(particle)

      const driftX = (Math.random() - 0.5) * 40
      const driftY = 10 + Math.random() * 30
      particle
        .animate(
          [
            { transform: 'translate(-50%, -50%) scale(1)', opacity: 1 },
            { transform: `translate(calc(-50% + ${driftX}px), calc(-50% + ${driftY}px)) scale(0.2)`, opacity: 0 },
          ],
          { duration: LIFE_MS, easing: 'ease-out' },
        )
        .finished.finally(() => particle.remove())
    }

    window.addEventListener('mousemove', onMove)
    return () => window.removeEventListener('mousemove', onMove)
  }, [mode])

  return (
    <label className="mt-auto flex flex-col gap-1 border-t border-zinc-200 pt-3 text-xs text-zinc-500 dark:border-zinc-800">
      cursor trail
      <select
        value={mode}
        onChange={(e) => setMode(e.target.value as Mode)}
        className="rounded-md border border-zinc-300 bg-white px-2 py-1.5 text-sm text-zinc-800 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
      >
        <option value="off">off</option>
        <option value="sparks">sparks</option>
        <option value="duck">spookie duck</option>
      </select>
    </label>
  )
}

export default CursorTrail
