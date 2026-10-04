import { useState } from 'react'
import { NavLink, Route, Routes } from 'react-router-dom'
import Overview from './pages/Overview'

const links = [
    { to: '/', label: 'overview' },
    { to: '/courses', label: 'courses' },
    { to: '/materials', label: 'course materials' },
    { to: '/notes', label: 'notes' },
    { to: '/duckie', label: 'duckie 🦆' },
    { to: '/details', label: 'details' },
]

/* NOTES PAGE */
function NotesPage() {
    const [uploadedNotes, setUploadedNotes] = useState<File[]>([])

    const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files
        if (!files) return
        setUploadedNotes(prev => [...prev, ...Array.from(files)])
    }

    return (
        <div className= "p-4 flex flex-col gap-6" >
        <h2 className="text-xl font-bold" > Study Notes </h2>
            < p className = "text-sm text-zinc-500" >
                Upload your own notes, PDFs, slides, or images.
            </p>

                    < label className = "border border-zinc-300 dark:border-zinc-700 rounded-lg p-6 bg-zinc-50 dark:bg-zinc-900 cursor-pointer hover:bg-zinc-100 dark:hover:bg-zinc-800 transition flex flex-col items-center gap-2 text-center" >
                        <span className="text-lg font-semibold text-zinc-700 dark:text-zinc-200" >
                            Upload Notes
                                </span>
                                < span className = "text-sm text-zinc-500 dark:text-zinc-400" >
                                    Click to upload PDFs, images, docs, or text files
                                        </span>

                                        < input type = "file" multiple className = "hidden" onChange = { handleUpload } />
                                            </label>

                                            < div className = "mt-4" >
                                                <h3 className="text-lg font-semibold mb-3" > Your Uploaded Notes </h3>

    {
        uploadedNotes.length === 0 ? (
            <p className= "text-sm text-zinc-500" > No notes uploaded yet.</p>
                ) : (
            <ul className= "space-y-3" >
            {
                uploadedNotes.map((file, index) => (
                    <li
                                key= { index }
                                className = "p-3 border border-zinc-200 dark:border-zinc-700 rounded-md bg-white dark:bg-zinc-900 flex justify-between items-center"
                    >
                    <div>
                    <p className="text-sm font-medium text-zinc-800 dark:text-zinc-200" >
                    { file.name }
                    </p>
                < p className = "text-xs text-zinc-500 dark:text-zinc-400" >
                {(file.size / 1024).toFixed(1)} KB
                    </p>
                    </div>

                    < a
        href = { URL.createObjectURL(file) }
        target = "_blank"
        rel = "noopener noreferrer"
        className = "text-amber-600 dark:text-amber-400 text-sm font-semibold hover:underline"
            >
            Open
            </a>
            </li>
                        ))
    }
    </ul>
                )
}
</div>
    </div>
    )
}

/* COURSE RISK + WORKLOAD DATA */
const courseRisk = {
    "CSC 216": "fail",
    "BIO 181": "risk"
}

const workload = {
    "CSC 216": [
        {
            week: 1,
            tasks: [
                { label: "Project Setup", importance: "high" },
                { label: "Read Chapter 4", importance: "medium" },
                { label: "Study Sessions: 4", importance: "normal" },
                { label: "Flashcards: 40", importance: "normal" },
            ]
        },
        {
            week: 2,
            tasks: [
                { label: "OOP Practice", importance: "critical" },
                { label: "Study Sessions: 5", importance: "normal" },
                { label: "Practice Quizzes: 2", importance: "high" },
            ]
        },
        {
            week: 3,
            tasks: [
                { label: "Unit Testing", importance: "critical" },
                { label: "Study Sessions: 6", importance: "normal" },
                { label: "Flashcards: 75", importance: "normal" },
                { label: "Missed Deadline", importance: "critical" },
            ]
        },
        {
            week: 4,
            tasks: [
                { label: "Midterm Review", importance: "critical" },
                { label: "Study Sessions: 7", importance: "normal" },
                { label: "Practice Quizzes: 3", importance: "high" },
            ]
        }
    ],

    "BIO 181": [
        {
            week: 1,
            tasks: [
                { label: "Lab Report", importance: "high" },
                { label: "Study Sessions: 3", importance: "normal" },
                { label: "Flashcards: 20", importance: "normal" },
            ]
        },
        {
            week: 2,
            tasks: [
                { label: "Genetics Worksheet", importance: "medium" },
                { label: "Study Sessions: 4", importance: "normal" },
                { label: "Practice Quizzes: 2", importance: "high" },
            ]
        },
        {
            week: 3,
            tasks: [
                { label: "Evolution Notes", importance: "medium" },
                { label: "Study Sessions: 5", importance: "normal" },
                { label: "Flashcards: 60", importance: "normal" },
            ]
        },
        {
            week: 4,
            tasks: [
                { label: "Exam Review", importance: "high" },
                { label: "Study Sessions: 6", importance: "normal" },
                { label: "Practice Quizzes: 3", importance: "high" },
            ]
        }
    ]
}

const importanceColor = {
    critical: "text-red-500 font-semibold",
    high: "text-yellow-500 font-semibold",
    medium: "text-blue-500",
    normal: "text-zinc-500"
}

const riskColor = {
    fail: "bg-red-500",
    risk: "bg-yellow-500",
    pass: "bg-green-500"
}

/* MAIN APP */
export default function App() {
    const [sidebarWidth, setSidebarWidth] = useState<number>(200)
    const [showWorkload, setShowWorkload] = useState<boolean>(false)

    return (
        <div className= "flex min-h-svh bg-zinc-50 text-zinc-900 dark:bg-zinc-950 dark:text-zinc-100 relative" >

        {/* SIDEBAR */ }
        < aside
    style = {{ width: `${sidebarWidth}px` }
}
className = "shrink-0 border-r border-zinc-200 p-4 dark:border-zinc-800 flex flex-col gap-5 max-h-screen overflow-y-auto bg-zinc-50 dark:bg-zinc-950 transition-[width] duration-75 ease-out relative"
    >
    <h1
                    className="text-xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50 overflow-hidden whitespace-nowrap"
style = {{ fontFamily: "'Quincy', 'Quincy CF', 'Georgia', serif" }}
                >
    Clear View
        </h1>

        < nav className = "flex flex-col gap-1 border-t border-zinc-200 dark:border-zinc-800 pt-3" >
        {
            links.map((link) => (
                <NavLink
                            key= { link.to }
                            to = { link.to }
                            end
                            className = {({ isActive }) =>
                `rounded-md px-3 py-2 text-sm transition-colors block overflow-hidden whitespace-nowrap text-ellipsis ${isActive
                    ? 'bg-zinc-200 font-medium text-zinc-900 dark:bg-zinc-800 dark:text-zinc-50'
                    : 'text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-900'
                }`
                            }
            >
        { link.label }
            </NavLink>
                    ))}
</nav>
    </aside>

{/* MAIN VIEWPORT */ }
<main className="min-w-0 flex-1 p-6 overflow-y-auto max-h-screen" >
    <Routes>

    <Route path="/" element = {< Overview />} />

{/* COURSES */ }
<Route
                        path="/courses"
element = {
                            < div className = "p-2 flex flex-col gap-4" >

    <h2 className="text-xl font-bold mb-2" > My Courses </h2>
        < p className = "text-sm text-zinc-500" >
            Your registered course timeline will show up here.
                                </p>

{/* WORKLOAD CHART */ }
<div className="mt-4" >
    <button
                                        onClick={ () => setShowWorkload(prev => !prev) }
className = "w-full flex items-center justify-between p-4 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition"
    >
    <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300" >
        Weekly Workload Chart(Risk‑Weighted)
            </span>
            < span className = "text-xl" > { showWorkload? "▲": "▼" } </span>
                </button>

                < div
className = {`overflow-hidden transition-all duration-300 ${showWorkload ? "max-h-[1200px] mt-3" : "max-h-0"
    }`}
                                    >
    <div className="p-4 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 space-y-10" >

    {
        Object.keys(workload).map(course => (
            <div key= { course } >
            <h3 className="text-lg font-bold text-zinc-800 dark:text-zinc-200 mb-4" >
            { course }
            </h3>

        < p className = {`text-sm font-semibold mb-2 ${courseRisk[course] === "fail"
                ? "text-red-500"
                : courseRisk[course] === "risk"
                    ? "text-yellow-500"
                    : "text-green-500"
            }`} >
    { courseRisk[course] === "fail" && "🔥 Critical Risk — Every task matters" }
{ courseRisk[course] === "risk" && "⚠️ At Risk — Tasks are high importance" }
{ courseRisk[course] === "pass" && "🌿 Passing — Tasks normal importance" }
</p>

    < div className = "relative border-l border-zinc-300 dark:border-zinc-700 pl-6 space-y-8" >

    {
        workload[course].map(week => (
            <div key= { week.week } >
            <div className={`absolute -left-3 top-1 w-3 h-3 ${riskColor[courseRisk[course]]
                } rounded-full`} > </div>

        < h4 className = "font-semibold text-zinc-800 dark:text-zinc-200" >
            Week { week.week }
</h4>

    < ul className = "text-xs text-zinc-500 dark:text-zinc-400 mt-1 space-y-1" >
    {
        week.tasks.map((task, i) => (
            <li key= { i } className = { importanceColor[task.importance]} >
                                                                            • { task.label }
            </li>
        ))
    }
        </ul>
        </div>
                                                        ))}

</div>
    </div>
                                            ))}

</div>
    </div>
    </div>
    </div>
                        }
                    />

{/* NOTES */ }
<Route path="/notes" element = {< NotesPage />} />

{/* OTHER ROUTES */ }
<Route
                        path="/materials"
element = {
                            < div className = "p-2" >
    <h2 className="text-xl font-bold mb-2" > Course Materials </h2>
        < p className = "text-sm text-zinc-500" > Access your syllabus and resource documentation links.</p>
            </div>
                        }
                    />

    < Route
path = "/duckie"
element = {
                            < div className = "p-2 flex flex-col gap-2" >
    <h2 className="text-xl font-bold" > Rubber Duck Debugging 🦆</h2>
        < p className = "text-sm text-zinc-500" > Troubleshoot tricky script blocks line - by - line with the duck! </p>
            </div>
                        }
                    />

    < Route path = "/details" element = {< p className = "text-sm text-zinc-500" > nothing here yet < /p>} / >

        </Routes>
        </main>
        </div>
    )
}
