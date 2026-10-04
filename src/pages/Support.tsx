import { useEffect, useState } from 'react'
import { getOptions, getStudent, predict } from '../api.ts'
import type { Options, Prediction, Student } from '../api.ts'

type Field = {
  key: keyof Student
  label: string
  hint: string
  percent?: boolean
  max: number
}

const fields: Field[] = [
  { key: 'midterm_score', label: 'midterm score', hint: '0 to 100', max: 100 },
  { key: 'attendance_rate', label: 'classes attended', hint: '%', percent: true, max: 100 },
  { key: 'on_time_submission_rate', label: 'deadlines met on time', hint: '%', percent: true, max: 100 },
  { key: 'avg_days_started_before_exam', label: 'days you start studying before an exam', hint: 'days', max: 60 },
  { key: 'late_night_study_pct', label: 'studying done after midnight', hint: '%', percent: true, max: 100 },
  { key: 'practice_quizzes_taken', label: 'practice quizzes taken', hint: 'count', max: 200 },
  { key: 'work_hours_per_week', label: 'paid work per week', hint: 'hours', max: 80 },
]

const levelStyle: Record<Prediction['level'], string> = {
  'on track': 'border-emerald-300 bg-emerald-50 dark:border-emerald-800 dark:bg-emerald-950/40',
  'some support': 'border-amber-300 bg-amber-50 dark:border-amber-800 dark:bg-amber-950/40',
  'extra support': 'border-orange-300 bg-orange-50 dark:border-orange-800 dark:bg-orange-950/40',
}

const inputClass =
  'w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900'

function Support() {
  const [options, setOptions] = useState<Options>({ courses: [], class_years: [] })
  const [values, setValues] = useState<Record<string, string>>({ midterm_score: '' })
  const [result, setResult] = useState<Prediction | null>(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [studentId, setStudentId] = useState('S1000')

  useEffect(() => {
    getOptions().then(setOptions).catch((e: Error) => setError(e.message))
  }, [])

  const set = (key: string, value: string) => setValues((prev) => ({ ...prev, [key]: value }))

  // fill the form from a record in the wolfhacks dataset
  async function load() {
    setLoading(true)
    setError('')
    try {
      const record = await getStudent(studentId)
      const next: Record<string, string> = {
        course: record.student.course ?? '',
        class_year: record.student.class_year ?? '',
      }
      for (const field of fields) {
        const value = record.student[field.key]
        if (typeof value !== 'number') continue
        next[field.key] = String(field.percent ? Math.round(value * 100) : value)
      }
      setValues(next)
      setResult(record.prediction)
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setLoading(false)
    }
  }

  async function submit(event: React.FormEvent) {
    event.preventDefault()
    const student: Record<string, string | number> = {}
    for (const field of fields) {
      const raw = values[field.key]
      if (raw === undefined || raw === '') continue
      student[field.key] = field.percent ? Number(raw) / 100 : Number(raw)
    }
    if (values.course) student.course = values.course
    if (values.class_year) student.class_year = values.class_year

    setLoading(true)
    setError('')
    try {
      setResult(await predict(student as Student))
    } catch (e) {
      setResult(null)
      setError((e as Error).message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex max-w-5xl flex-col gap-6 p-2">
      <div>
        <h2 className="text-xl font-bold">where could i use support?</h2>
        <p className="mt-1 text-sm text-zinc-500">
          tell us how a course is going. only the midterm score is required. change a number and check
          again to see what would move the result.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <form
          onSubmit={submit}
          className="flex flex-col gap-3 rounded-lg border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900"
        >
          <div className="flex items-end gap-2 border-b border-zinc-200 pb-4 dark:border-zinc-800">
            <label className="flex-1 text-sm">
              <span className="mb-1 block text-zinc-500">start from a student in the dataset</span>
              <input className={inputClass} value={studentId} onChange={(e) => setStudentId(e.target.value)} />
            </label>
            <button
              type="button"
              onClick={load}
              disabled={loading}
              className="rounded-md border border-zinc-300 px-4 py-2 text-sm font-semibold hover:bg-zinc-100 disabled:opacity-60 dark:border-zinc-700 dark:hover:bg-zinc-800"
            >
              load
            </button>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <label className="text-sm">
              <span className="mb-1 block text-zinc-500">course</span>
              <select className={inputClass} value={values.course ?? ''} onChange={(e) => set('course', e.target.value)}>
                <option value="">any</option>
                {options.courses.map((course) => (
                  <option key={course}>{course}</option>
                ))}
              </select>
            </label>
            <label className="text-sm">
              <span className="mb-1 block text-zinc-500">class year</span>
              <select
                className={inputClass}
                value={values.class_year ?? ''}
                onChange={(e) => set('class_year', e.target.value)}
              >
                <option value="">any</option>
                {options.class_years.map((year) => (
                  <option key={year}>{year}</option>
                ))}
              </select>
            </label>
          </div>

          {fields.map((field) => (
            <label key={field.key} className="text-sm">
              <span className="mb-1 block text-zinc-500">
                {field.label} <span className="text-zinc-400">({field.hint})</span>
              </span>
              <input
                className={inputClass}
                type="number"
                min={0}
                max={field.max}
                step="any"
                required={field.key === 'midterm_score'}
                value={values[field.key] ?? ''}
                onChange={(e) => set(field.key, e.target.value)}
              />
            </label>
          ))}

          <button
            type="submit"
            disabled={loading}
            className="mt-2 rounded-md bg-amber-500 px-4 py-2 text-sm font-semibold text-white hover:bg-amber-600 disabled:opacity-60"
          >
            {loading ? 'checking…' : 'check'}
          </button>
          {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}
        </form>

        <div className="flex flex-col gap-4">
          {!result && (
            <p className="rounded-lg border border-dashed border-zinc-300 p-5 text-sm text-zinc-500 dark:border-zinc-700">
              your result shows up here, with what is going well and what to do next.
            </p>
          )}
          {result && (
            <>
              <div className={`rounded-lg border p-5 ${levelStyle[result.level]}`}>
                <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">this course</p>
                <p className="mt-1 text-2xl font-bold">{result.level}</p>
                <p className="mt-2 text-sm">{result.message}</p>
              </div>
              <ResultList title="next steps" items={result.actions} />
              <ResultList title="what to work on" items={result.reasons} />
              <ResultList title="what is going well" items={result.strengths} />
            </>
          )}
          <p className="text-xs text-zinc-500">
            this is an estimate from a decision tree trained on synthetic data, not a prediction of your
            grade. it can be wrong. use it as a prompt to ask for help early, and talk to your instructor
            or advisor about anything that worries you.
          </p>
        </div>
      </div>
    </div>
  )
}

function ResultList({ title, items }: { title: string; items: string[] }) {
  if (items.length === 0) return null
  return (
    <div className="rounded-lg border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
      <h3 className="mb-2 text-sm font-semibold">{title}</h3>
      <ul className="list-disc space-y-1 pl-5 text-sm text-zinc-700 dark:text-zinc-300">
        {items.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    </div>
  )
}

export default Support
