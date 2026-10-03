import { NavLink, Route, Routes } from 'react-router-dom'
import Overview from './pages/Overview.tsx'

const links = [
  { to: '/', label: 'overview' },
  { to: '/details', label: 'details' },
]

function App() {
  return (
    <div className="flex min-h-svh bg-zinc-50 text-zinc-900 dark:bg-zinc-950 dark:text-zinc-100">
      <aside className="w-52 shrink-0 border-r border-zinc-200 p-4 dark:border-zinc-800">
        <h1 className="mb-6 text-lg font-semibold">clear view</h1>
        <nav className="flex flex-col gap-1">
          {links.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              end
              className={({ isActive }) =>
                `rounded-md px-3 py-2 text-sm ${
                  isActive
                    ? 'bg-zinc-200 font-medium dark:bg-zinc-800'
                    : 'text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-900'
                }`
              }
            >
              {link.label}
            </NavLink>
          ))}
        </nav>
      </aside>
      <main className="min-w-0 flex-1 p-6">
        <Routes>
          <Route path="/" element={<Overview />} />
          <Route
            path="/details"
            element={<p className="text-sm text-zinc-500">nothing here yet</p>}
          />
        </Routes>
      </main>
    </div>
  )
}

export default App
