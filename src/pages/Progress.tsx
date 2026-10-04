import { useState } from 'react'
import type { Student } from '../api.ts'
import { useStudent } from '../student.tsx'

const percent = (value: number) => `${Math.round(value * 100)}%`
const plain = (value: number) => String(Math.round(value * 10) / 10)

// every number here is read from the student's record in the wolfhacks dataset
const stats: { key: keyof Student; label: string; format: (value: number) => string }[] = [
  { key: 'midterm_score', label: 'Midterm Score', format: plain },
  { key: 'attendance_rate', label: 'Classes Attended', format: percent },
  { key: 'on_time_submission_rate', label: 'Deadlines Met On Time', format: percent },
  { key: 'missed_deadlines', label: 'Missed Deadlines', format: plain },
  { key: 'avg_weekly_study_hours', label: 'Study Hours per Week', format: plain },
  { key: 'study_sessions_logged', label: 'Study Sessions Logged', format: plain },
  { key: 'practice_quizzes_taken', label: 'Practice Quizzes Taken', format: plain },
  { key: 'avg_practice_quiz_score', label: 'Practice Quiz Average', format: plain },
  { key: 'flashcards_reviewed', label: 'Flashcards Reviewed', format: plain },
  { key: 'materials_uploaded', label: 'Materials Uploaded', format: plain },
  { key: 'avg_days_started_before_exam', label: 'Days of Head Start Before Exams', format: plain },
  { key: 'avg_sleep_hours', label: 'Hours of Sleep', format: plain },
]

export function StudentPicker() {
  const { id, setId, error } = useStudent()
  const [draft, setDraft] = useState(id)

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault()
        setId(draft.trim().toUpperCase())
      }}
      className="flex flex-col gap-1 text-xs"
    >
      <div className="flex items-center gap-2">
        <label htmlFor="student-id" className="font-bold text-slate-400">
          Student:
        </label>
        <input
          id="student-id"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          className="w-20 rounded-md border border-slate-300 bg-white px-2 py-1 font-semibold dark:border-slate-700 dark:bg-slate-900"
        />
        <button type="submit" className="rounded-md bg-amber-500 px-2 py-1 font-semibold text-white hover:bg-amber-600">
          Switch
        </button>
      </div>
      {error && <span className="text-red-600 dark:text-red-400">{error}</span>}
    </form>
  )
}

function Progress() {
  const { record } = useStudent()
  if (!record) return null
  const { student, course_average: average, course_size: size } = record

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <h2 className="text-xl font-bold">My Progress in {student.course}</h2>
      <p className="mb-4 mt-1 text-sm text-slate-500 dark:text-slate-400">
        This semester so far, next to the average of the {size} students in {student.course}.
      </p>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {stats.map((stat) => {
          const value = student[stat.key]
          if (typeof value !== 'number') return null
          const typical = average[stat.key]
          return (
            <div key={stat.key} className="rounded-md bg-slate-50 p-3 dark:bg-slate-950">
              <p className="text-xs font-medium text-slate-500 dark:text-slate-400">{stat.label}</p>
              <p className="mt-1 text-xl font-bold">{stat.format(value)}</p>
              {typeof typical === 'number' && (
                <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">course average {stat.format(typical)}</p>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default Progress
