import { useEffect, useState } from 'react';
import { useStudent } from '../student.tsx';
import Progress, { StudentPicker } from './Progress.tsx';

interface Task {
    id: string;
    title: string;
    course: string;
    priority: 'High' | 'Medium' | 'Low';
    completed: boolean;
    exam?: boolean;
}

type TaskList = Record<number, Task[]>;

const STORAGE_KEY = 'clear-view-deadlines';
const DUE_SOON_DAYS = 7;

// shown the first time the app opens; after that the student's own list is kept in the browser
const sampleTasks: TaskList = {
    9: [
        { id: '1', title: 'Computer Science Project', course: 'CSC 216', priority: 'High', completed: false },
        { id: '2', title: 'Read Chapter 4 Frameworks', course: 'CSC 216', priority: 'Low', completed: true },
    ],
    11: [
        { id: '3', title: 'Biology 111 Lab Report', course: 'BIO 181', priority: 'Medium', completed: false },
    ],
    14: [
        { id: '4', title: 'BIO 181 Midterm', course: 'BIO 181', priority: 'High', completed: false, exam: true },
    ],
};

function loadTasks(): TaskList {
    try {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) return JSON.parse(saved);
    } catch {
        // storage blocked or corrupted: fall back to the samples
    }
    return sampleTasks;
}

// the calendar shows october 2026; outside that month, count from the 1st
function firstUpcomingDay(): number {
    const now = new Date();
    return now.getFullYear() === 2026 && now.getMonth() === 9 ? now.getDate() : 1;
}

// Border configuration styles
const borderStyles = [
    { id: 'none', label: 'Simple Slate', class: 'border-slate-200 dark:border-slate-800' },
    { id: 'hearts', label: '💖 Hearts', class: 'border-pink-400 [border-image:url("data:image/svg+xml;utf8,<svg xmlns=\'http://w3.org\' width=\'24\' height=\'24\' viewBox=\'0 0 24 24\'><text y=\'18\' font-size=\'16\'>💖</text></svg>")]_10_repeat]' },
    { id: 'skulls', label: '💀 Skulls', class: 'border-zinc-500 [border-image:url("data:image/svg+xml;utf8,<svg xmlns=\'http://w3.org\' width=\'24\' height=\'24\' viewBox=\'0 0 24 24\'><text y=\'18\' font-size=\'16\'>💀</text></svg>")]_10_repeat]' },
    { id: 'chains', label: '⛓️ Chains', class: 'border-slate-400 [border-image:url("data:image/svg+xml;utf8,<svg xmlns=\'http://w3.org\' width=\'24\' height=\'24\' viewBox=\'0 0 24 24\'><text y=\'18\' font-size=\'16\'>⛓️</text></svg>")]_10_repeat]' },
];

// neutral placeholder shown until the student uploads a picture
const defaultAvatar =
    "data:image/svg+xml;utf8," +
    encodeURIComponent(
        '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 80 80"><rect width="80" height="80" fill="#e2e8f0"/><circle cx="40" cy="31" r="14" fill="#94a3b8"/><path d="M12 80c2-18 14-27 28-27s26 9 28 27z" fill="#94a3b8"/></svg>'
    );

export default function Overview() {
    const { id: studentId, record } = useStudent();
    const [selectedDay, setSelectedDay] = useState<number>(9);
    const [profilePic, setProfilePic] = useState<string>(defaultAvatar);
    const [activeBorder, setActiveBorder] = useState<string>('none');

    const [taskList, setTaskList] = useState<TaskList>(loadTasks);
    const [draft, setDraft] = useState({ title: '', course: '', priority: 'Medium' as Task['priority'], exam: false });

    useEffect(() => {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(taskList));
        } catch {
            // nothing to do: the list still works for this visit
        }
    }, [taskList]);

    const addTask = (e: React.FormEvent) => {
        e.preventDefault();
        const title = draft.title.trim();
        if (!title) return;
        const task: Task = { id: crypto.randomUUID(), title, course: draft.course.trim() || 'General', priority: draft.priority, completed: false, exam: draft.exam };
        setTaskList((prev) => ({ ...prev, [selectedDay]: [...(prev[selectedDay] || []), task] }));
        setDraft({ title: '', course: '', priority: 'Medium', exam: false });
    };

    const removeTask = (day: number, taskId: string) => {
        setTaskList((prev) => ({ ...prev, [day]: prev[day].filter((t) => t.id !== taskId) }));
    };

    const today = firstUpcomingDay();
    const open = Object.entries(taskList).flatMap(([day, tasks]) =>
        tasks.filter((t) => !t.completed).map((t) => ({ ...t, day: Number(day) })),
    );
    const dueSoon = open.filter((t) => t.day >= today && t.day <= today + DUE_SOON_DAYS).length;
    const examsAhead = open.filter((t) => t.exam && t.day >= today).length;
    const daysWithOpenTasks = new Set(open.map((t) => t.day));

    const toggleTask = (day: number, taskId: string) => {
        setTaskList((prev) => ({
            ...prev,
            [day]: prev[day].map((t) => (t.id === taskId ? { ...t, completed: !t.completed } : t)),
        }));
    };

    const activeTasks = taskList[selectedDay] || [];
    const currentBorderClass = borderStyles.find(b => b.id === activeBorder)?.class || '';

    return (
        <div className= "p-5 font-sans min-h-screen bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors duration-200" >

        {/* NEW INTERACTIVE STUDENT IDENTITY HEADER */ }
        < div className = "flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-6 mb-6" >
            <div className="flex items-center gap-4" >

            {/* Avatar Upload Box with Customizable Border Frame */ }
                < label className = {`group relative h-20 w-20 cursor-pointer overflow-hidden rounded-full border-4 shadow-sm shrink-0 flex items-center justify-center transition-all ${currentBorderClass}`
}>
    <img 
              src={ profilePic }
alt = "Student Avatar"
className = "h-full w-full object-cover transition group-hover:opacity-75"
    />
    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity" >
        <span className="text-[10px] font-bold text-white uppercase tracking-wider" > Change </span>
            </div>
            < input
type = "file"
accept = "image/*"
className = "hidden"
onChange = {(e) => {
    const file = e.target.files?.[0];
    if (file) setProfilePic(URL.createObjectURL(file));
}} 
            />
    </label>

{/* Student Credentials text info */ }
<div className="flex flex-col" >
    <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white" >
        Student ID: #{studentId}
            </h1>
            < p className = "text-sm font-semibold text-amber-500 dark:text-amber-400 mt-0.5" >
                {record ? `Classification: ${record.student.class_year} Year · ${record.student.course}` : 'Loading student…'}
                    </p>
                    </div>
                    </div>

<div className="flex flex-col items-start sm:items-end gap-2">
<StudentPicker />
{/* Custom border aesthetic controller options dropdown */ }
<div className="flex items-center gap-2 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-md p-2 w-fit" >
    <span className="font-bold text-slate-400" >✨ Avatar Border: </span>
        < select
value = { activeBorder }
onChange = {(e) => setActiveBorder(e.target.value)}
className = "bg-transparent border-none p-0 focus:ring-0 focus:outline-none cursor-pointer font-semibold text-slate-700 dark:text-slate-200"
    >
{
    borderStyles.map(style => (
        <option key= { style.id } value = { style.id } className = "dark:bg-slate-900" > { style.label } </option>
    ))
}
    </select>
    </div>
</div>
    </div>

{/* Quick Stats Grid View */ }
<div className="flex gap-4 mb-6" >
    <div className="bg-slate-100 dark:bg-slate-800 p-4 rounded-lg flex-1" >
        <h3 className="text-sm font-medium text-slate-500 dark:text-slate-400" > Due Soon </h3>
            <p className="text-2xl font-bold mt-1">{dueSoon} {dueSoon === 1 ? "Task" : "Tasks"}</p>
<p className="text-xs text-slate-500 dark:text-slate-400 mt-1">in the next {DUE_SOON_DAYS} days</p>
                </div>
                < div className = "bg-red-50 dark:bg-red-950/30 p-4 rounded-lg flex-1" >
                    <h3 className="text-sm font-medium text-red-700 dark:text-red-300" > Exams </h3>
                        <p className="text-2xl font-bold text-red-600 dark:text-red-400 mt-1">{examsAhead} Coming Up</p>
                            </div>
                            </div>

<div className="mb-6"><Progress /></div>

{/* Layout Grid Panels for Calendar and Deadlines list */ }
<div className="grid grid-cols-1 lg:grid-cols-3 gap-6" >
    <div className="lg:col-span-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-lg shadow-sm" >
        <div className="flex items-center justify-between mb-4" >
            <h2 className="text-xl font-bold" > October 2026 </h2>
                </div>
                < div className = "grid grid-cols-7 text-center font-semibold text-xs text-slate-400 mb-2" >
                    <div>Sun </div><div>Mon</div > <div>Tue </div><div>Wed</div > <div>Thu </div><div>Fri</div > <div>Sat </div>
                    </div>
                    < div className = "grid grid-cols-7 gap-1" >
                    { Array.from({ length: 4 }).map((_, i) => <div key={ i } className = "h-12" />) }
{
    Array.from({ length: 31 }, (_, i) => i + 1).map((day) => (
        <button
                key= { day }
                onClick = {() => setSelectedDay(day)}
className = {`h-12 rounded-md flex flex-col items-center justify-center border text-sm font-medium transition-all ${selectedDay === day ? 'bg-amber-500 text-white border-amber-500' : 'border-slate-100 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800'
    }`}
              >
{ day }
{daysWithOpenTasks.has(day) && <span className={`h-1.5 w-1.5 rounded-full ${selectedDay === day ? "bg-white" : "bg-amber-500"}`} />}
    </button>
            ))}
</div>
    </div>

    < div className = "bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-lg shadow-sm" >
        <h2 className="text-xl font-bold mb-4">Deadlines · Oct {selectedDay}</h2>
{
    activeTasks.length === 0 ? (
        <div className= "text-center py-12 text-sm text-slate-400" >✨ No assignments due! </div>
          ) : (
        <ul className= "space-y-3" >
        {
            activeTasks.map((task) => (
                <li key= { task.id } className = "flex items-start gap-3 bg-slate-50 dark:bg-slate-950 p-3 rounded-md border border-slate-100 dark:border-slate-800" >
                <input
                    type="checkbox"
                    checked = { task.completed }
                    onChange = {() => toggleTask(selectedDay, task.id)}
    className = "mt-1 accent-amber-500 h-4 w-4 cursor-pointer rounded"
        />
        <div>
        <p className={ `text-sm font-medium ${task.completed ? 'line-through text-slate-400' : ''}` }> { task.title } </p>
            < p className = "text-xs text-slate-400 mt-0.5" > { task.course } • { task.priority } Priority{task.exam ? ' • Exam' : ''} </p>
                </div>
                <button onClick={() => removeTask(selectedDay, task.id)} aria-label={`Remove ${task.title}`} className="ml-auto text-slate-400 hover:text-red-500 text-sm px-1">✕</button>
                </li>
              ))
}
</ul>
          )}
<form onSubmit={addTask} className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800 flex flex-col gap-2">
    <h3 className="text-sm font-semibold">Add a deadline for Oct {selectedDay}</h3>
    <input
        required
        aria-label="Title"
        placeholder="Title"
        value={draft.title}
        onChange={(e) => setDraft({ ...draft, title: e.target.value })}
        className="rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-2 text-sm"
    />
    <div className="flex gap-2">
        <input
            aria-label="Course"
            placeholder="Course"
            value={draft.course}
            onChange={(e) => setDraft({ ...draft, course: e.target.value })}
            className="min-w-0 flex-1 rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-2 text-sm"
        />
        <select
            aria-label="Priority"
            value={draft.priority}
            onChange={(e) => setDraft({ ...draft, priority: e.target.value as Task['priority'] })}
            className="rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-2 py-2 text-sm"
        >
            <option>High</option>
            <option>Medium</option>
            <option>Low</option>
        </select>
    </div>
    <label className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
        <input type="checkbox" checked={draft.exam} onChange={(e) => setDraft({ ...draft, exam: e.target.checked })} className="accent-amber-500 h-4 w-4" />
        This is an exam
    </label>
    <button type="submit" className="rounded-md bg-amber-500 hover:bg-amber-600 text-white text-sm font-semibold px-3 py-2">
        Add deadline
    </button>
</form>

</div>
    </div>

    </div>
  );
}

