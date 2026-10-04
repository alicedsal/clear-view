// client for the python api in api/main.py
const API = import.meta.env.VITE_API_URL ?? 'http://localhost:8000'

export const treeImageUrl = `${API}/artifacts/tree.png`

export type Student = {
  midterm_score: number
  course?: string
  class_year?: string
  credit_hours?: number
  work_hours_per_week?: number
  avg_weekly_study_hours?: number
  study_sessions_logged?: number
  materials_uploaded?: number
  avg_practice_quiz_score?: number
  flashcards_reviewed?: number
  missed_deadlines?: number
  avg_sleep_hours?: number
  practice_quizzes_taken?: number
  avg_days_started_before_exam?: number
  // rates are fractions: 0.85, not 85
  on_time_submission_rate?: number
  late_night_study_pct?: number
  attendance_rate?: number
}

export type Prediction = {
  level: 'on track' | 'some support' | 'extra support'
  flagged: boolean
  score: number
  message: string
  reasons: string[]
  strengths: string[]
  actions: string[]
}

export type QuizQuestion = {
  question: string
  options: string[]
  answer_index: number
  explanation: string
}

export type StudyAid = {
  summary: string
  key_points: string[]
  quiz: QuizQuestion[]
}

export type Scores = { accuracy: number; recall: number; precision: number; f2: number }

export type Metrics = {
  rows: { total: number; train: number; test: number }
  at_risk_rate: number
  missing_values: Record<string, number>
  chosen_depth: number
  min_samples_leaf: number
  threshold: number
  depth_curve: { depth: number; train_recall: number; cv_recall: number }[]
  train: Scores
  test: Scores
  baselines: {
    always_not_at_risk: Scores
    midterm_rule: Scores & { cutoff: number }
  }
  feature_importances: { feature: string; importance: number }[]
}

export type Options = { courses: string[]; class_years: string[] }

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  let response: Response
  try {
    response = await fetch(`${API}${path}`, init)
  } catch {
    throw new Error('could not reach the api. is it running on port 8000?')
  }
  if (!response.ok) {
    const body = await response.json().catch(() => null)
    const detail = typeof body?.detail === 'string' ? body.detail : 'something went wrong'
    throw new Error(detail)
  }
  return response.json()
}

export function predict(student: Student) {
  return request<Prediction>('/predict', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(student),
  })
}

export function studyAidFromFile(file: File, numQuestions = 5) {
  const form = new FormData()
  form.append('file', file)
  form.append('num_questions', String(numQuestions))
  return request<StudyAid>('/ai/file', { method: 'POST', body: form })
}

export type StudentRecord = {
  student_id: string
  student: Student
  prediction: Prediction
  course_average: Record<string, number>
  course_size: number
}

export const getStudent = (id: string) => request<StudentRecord>(`/students/${encodeURIComponent(id)}`)
export const getMetrics = () => request<Metrics>('/metrics')
export const getOptions = () => request<Options>('/options')
