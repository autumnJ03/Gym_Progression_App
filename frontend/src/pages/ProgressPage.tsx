import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'
import { getProgress } from '../api/progress'

export default function ProgressPage() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['progress'],
    queryFn: getProgress,
  })

  const [selected, setSelected] = useState<string>('')

  if (isLoading) return <p className="text-neutral-500">Loading…</p>
  if (error) return <p className="text-red-400">Failed to load progress.</p>

  if (!data || data.length === 0) {
    return (
      <div>
        <h2 className="text-xl font-semibold text-white mb-2">Progress</h2>
        <p className="text-neutral-400 text-sm">
          No data yet — complete a workout to start tracking your progress.
        </p>
      </div>
    )
  }

  const activeExercise = selected || data[0].exercise_name
  const exerciseData = data.find((e) => e.exercise_name === activeExercise)

  return (
    <div>
      <h2 className="text-xl font-semibold text-white mb-6">Progress</h2>

      <div className="flex gap-2 flex-wrap mb-6">
        {data.map((ex) => (
          <button
            key={ex.exercise_name}
            onClick={() => setSelected(ex.exercise_name)}
            className={`text-sm px-3 py-1.5 rounded-lg border transition-colors cursor-pointer ${
              activeExercise === ex.exercise_name
                ? 'bg-orange-500 border-orange-500 text-white'
                : 'border-neutral-700 text-neutral-400 hover:text-white hover:border-neutral-500'
            }`}
          >
            {ex.exercise_name}
          </button>
        ))}
      </div>

      {exerciseData && (
        <div className="bg-[#1a1a1a] border border-neutral-800 rounded-xl p-4">
          <p className="text-white font-medium mb-4">{activeExercise}</p>
          {exerciseData.history.length === 1 ? (
            <p className="text-neutral-500 text-sm">
              Only one session logged — keep lifting to see your trend.
            </p>
          ) : (
            <ResponsiveContainer width="100%" height={260}>
              <LineChart data={exerciseData.history} margin={{ top: 4, right: 8, bottom: 0, left: -16 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#2a2a2a" />
                <XAxis
                  dataKey="date"
                  tick={{ fill: '#737373', fontSize: 11 }}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  tick={{ fill: '#737373', fontSize: 11 }}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(v) => `${v}`}
                />
                <Tooltip
                  contentStyle={{
                    background: '#1a1a1a',
                    border: '1px solid #2a2a2a',
                    borderRadius: '8px',
                    color: '#e5e5e5',
                    fontSize: '13px',
                  }}
                  formatter={(value) => [`${value} lbs`, 'Weight']}
                />
                <Line
                  type="monotone"
                  dataKey="weight"
                  stroke="#f97316"
                  strokeWidth={2}
                  dot={{ fill: '#f97316', r: 3 }}
                  activeDot={{ r: 5 }}
                />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>
      )}
    </div>
  )
}
