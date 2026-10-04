import { createContext, useContext, useEffect, useState } from 'react'
import { getStudent } from './api.ts'
import type { StudentRecord } from './api.ts'

// the student the whole dashboard is showing: one record from the wolfhacks
// dataset, loaded from the api and shared by every page
type StudentState = {
  id: string
  setId: (id: string) => void
  record: StudentRecord | null
  error: string
}

const STORAGE_KEY = 'clear-view-student'
const DEFAULT_STUDENT = 'S1000'

const StudentContext = createContext<StudentState>({
  id: DEFAULT_STUDENT,
  setId: () => {},
  record: null,
  error: '',
})

function savedId(): string {
  try {
    return localStorage.getItem(STORAGE_KEY) || DEFAULT_STUDENT
  } catch {
    return DEFAULT_STUDENT
  }
}

export function StudentProvider({ children }: { children: React.ReactNode }) {
  const [id, setId] = useState(savedId)
  const [record, setRecord] = useState<StudentRecord | null>(null)
  const [error, setError] = useState('')

  useEffect(() => {
    let current = true
    getStudent(id)
      .then((loaded) => {
        if (!current) return
        setRecord(loaded)
        setError('')
        try {
          localStorage.setItem(STORAGE_KEY, loaded.student_id)
        } catch {
          // storage blocked: the choice just won't survive a reload
        }
      })
      .catch((e: Error) => {
        if (current) setError(e.message)
      })
    return () => {
      current = false
    }
  }, [id])

  return <StudentContext.Provider value={{ id, setId, record, error }}>{children}</StudentContext.Provider>
}

// eslint-disable-next-line react-refresh/only-export-components
export const useStudent = () => useContext(StudentContext)
