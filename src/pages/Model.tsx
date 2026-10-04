import { useEffect, useState } from 'react'
import { CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { getMetrics, treeImageUrl } from '../api.ts'
import type { Metrics, Scores } from '../api.ts'

const pct = (value: number) => `${Math.round(value * 100)}%`
const card = 'rounded-lg border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900'

function Model() {
  const [metrics, setMetrics] = useState<Metrics | null>(null)
  const [error, setError] = useState('')

  useEffect(() => {
    getMetrics().then(setMetrics).catch((e: Error) => setError(e.message))
  }, [])

  if (error) return <p className="p-2 text-sm text-red-600 dark:text-red-400">{error}</p>
  if (!metrics) return <p className="p-2 text-sm text-zinc-500">loading…</p>

  const rule = metrics.baselines.midterm_rule
  const rows: { name: string; scores: Scores }[] = [
    { name: `our decision tree (depth ${metrics.chosen_depth})`, scores: metrics.test },
    { name: `one-line rule: midterm below ${rule.cutoff}`, scores: rule },
    { name: 'always say "not at risk"', scores: metrics.baselines.always_not_at_risk },
  ]
  const topImportance = metrics.feature_importances[0]?.importance ?? 1

  return (
    <div className="flex max-w-5xl flex-col gap-6 p-2">
      <div>
        <h2 className="text-xl font-bold">how the model works</h2>
        <p className="mt-1 text-sm text-zinc-500">
          a decision tree asks a short series of yes/no questions about a student's semester and
          estimates whether they may finish a course with a d or f.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Stat label="at-risk students caught (recall)" value={pct(metrics.test.recall)} />
        <Stat label="students it was tested on, never seen in training" value={String(metrics.rows.test)} />
        <Stat label="students in the dataset" value={String(metrics.rows.total)} />
      </div>

      <div className={card}>
        <h3 className="mb-1 font-semibold">compared with simple baselines</h3>
        <p className="mb-3 text-sm text-zinc-500">all scored on the same {metrics.rows.test} held-out students.</p>
        <table className="w-full text-left text-sm">
          <thead className="text-zinc-500">
            <tr>
              <th className="py-1 font-medium">approach</th>
              <th className="py-1 font-medium">recall</th>
              <th className="py-1 font-medium">precision</th>
              <th className="py-1 font-medium">accuracy</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.name} className="border-t border-zinc-100 dark:border-zinc-800">
                <td className="py-2">{row.name}</td>
                <td className="py-2 font-semibold">{pct(row.scores.recall)}</td>
                <td className="py-2">{pct(row.scores.precision)}</td>
                <td className="py-2">{pct(row.scores.accuracy)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <p className="mt-3 text-sm text-zinc-600 dark:text-zinc-400">
          the midterm rule catches slightly more students here, and across repeated splits the two
          roughly tie. we kept the tree because a cutoff can only say "your midterm was low", while the
          tree points at attendance, deadlines and late nights, which a student can still change.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className={card}>
          <h3 className="mb-1 font-semibold">checking for overfitting</h3>
          <p className="mb-3 text-sm text-zinc-500">
            recall on training rows versus rows held back during cross-validation. the gap grows as the
            tree gets deeper. final model: {pct(metrics.train.recall)} on training rows,{' '}
            {pct(metrics.test.recall)} on held-out rows.
          </p>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={metrics.depth_curve}>
                <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.3} />
                <XAxis dataKey="depth" fontSize={12} label={{ value: 'tree depth', position: 'insideBottom', offset: -2, fontSize: 12 }} />
                <YAxis domain={[0.6, 1]} tickFormatter={pct} fontSize={12} width={40} />
                <Tooltip formatter={(value) => pct(Number(value))} labelFormatter={(depth) => `depth ${depth}`} />
                <Legend verticalAlign="top" height={28} />
                <Line name="training" type="monotone" dataKey="train_recall" stroke="#f59e0b" strokeWidth={2} />
                <Line name="cross-validation" type="monotone" dataKey="cv_recall" stroke="#6366f1" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className={card}>
          <h3 className="mb-3 font-semibold">what the tree looks at most</h3>
          <ul className="flex flex-col gap-2 text-sm">
            {metrics.feature_importances.slice(0, 6).map((item) => (
              <li key={item.feature}>
                <div className="mb-1 flex justify-between">
                  <span>{item.feature.replaceAll('_', ' ')}</span>
                  <span className="text-zinc-500">{pct(item.importance)}</span>
                </div>
                <div className="h-2 rounded bg-zinc-100 dark:bg-zinc-800">
                  <div className="h-2 rounded bg-amber-500" style={{ width: pct(item.importance / topImportance) }} />
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className={card}>
        <h3 className="mb-2 font-semibold">how we built it</h3>
        <ul className="list-disc space-y-1 pl-5 text-sm text-zinc-700 dark:text-zinc-300">
          <li>
            {metrics.rows.train} students for training, {metrics.rows.test} held out before anything else and
            kept out of training and tuning.
          </li>
          <li>
            blanks filled with the typical training value:{' '}
            {Object.entries(metrics.missing_values)
              .map(([name, count]) => `${name.replaceAll('_', ' ')} (${count})`)
              .join(', ')}
            . a blank quiz score always meant no quizzes taken, so that became its own signal.
          </li>
          <li>
            depth and cutoff chosen by 5-fold cross-validation, counting a missed student as twice as
            costly as a false alarm. anyone scoring above {metrics.threshold} gets flagged for support.
          </li>
        </ul>
      </div>

      <div className={card}>
        <h3 className="mb-3 font-semibold">the tree</h3>
        <a href={treeImageUrl} target="_blank" rel="noopener noreferrer">
          <img src={treeImageUrl} alt="diagram of the decision tree" className="w-full rounded bg-white" />
        </a>
        <p className="mt-2 text-xs text-zinc-500">click to open full size.</p>
      </div>

      <div className={card}>
        <h3 className="mb-2 font-semibold">limits</h3>
        <ul className="list-disc space-y-1 pl-5 text-sm text-zinc-700 dark:text-zinc-300">
          <li>the data is synthetic and small, and some of it is self-reported. it has not been tested on real students.</li>
          <li>about half of the students it flags would have been fine. a flag is a prompt to check in, not a verdict.</li>
          <li>the score is relative, not a probability of failing.</li>
          <li>no real student data is used. uploaded notes go to google gemini for the summary and quiz and are not stored by this app.</li>
        </ul>
      </div>
    </div>
  )
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className={card}>
      <p className="text-3xl font-bold">{value}</p>
      <p className="mt-1 text-sm text-zinc-500">{label}</p>
    </div>
  )
}

export default Model
