import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import {
  LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts'
import { getProgress } from '../api/progress'
import { useWeightUnit } from '../contexts/WeightUnitContext'

const SESSIONS = ['Push', 'Pull', 'Legs']

const axisProps = {
  tickLine: false,
  axisLine: false,
  tick: { fill: '#525252', fontSize: 11 },
}

export default function ProgressPage() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['progress'],
    queryFn: getProgress,
  })

  const { toDisplay, unit } = useWeightUnit()
  const [selected, setSelected] = useState<string>('')

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="w-8 h-8 border-2 border-green-500/30 border-t-green-500 rounded-full animate-spin" />
      </div>
    )
  }

  if (error) return <p className="text-red-400">Failed to load progress.</p>

  if (!data || data.length === 0) {
    return (
      <div className="text-center py-16">
        <div className="text-5xl mb-4">📈</div>
        <h2 className="text-xl font-semibold text-white mb-2">No data yet</h2>
        <p className="text-neutral-400 text-sm">Complete a workout to start tracking your progress.</p>
      </div>
    )
  }

  const activeExercise = selected || data[0].exercise_name
  const exerciseData = data.find((e) => e.exercise_name === activeExercise)

  const tooltipStyle = {
    contentStyle: {
      background: '#141414',
      border: '1px solid rgba(34,197,94,0.2)',
      borderRadius: '12px',
      color: '#e5e5e5',
      fontSize: '13px',
    },
    formatter: (value: unknown) => [`${toDisplay(Number(value))} ${unit}`, 'Weight'],
  }

  return (
    <div>
      <div className="mb-6">
        <p className="text-xs text-green-500/70 uppercase tracking-widest font-medium mb-1">Tracking</p>
        <h2 className="text-2xl font-bold text-white">Progress</h2>
      </div>

      <div className="space-y-4 mb-6">
        {SESSIONS.map((sessionName) => {
          const exercises = data.filter((e) => e.session_name === sessionName)
          if (exercises.length === 0) return null
          return (
            <div key={sessionName}>
              <p className="text-xs text-neutral-500 uppercase tracking-widest font-medium mb-2">{sessionName}</p>
              <div className="flex gap-2 flex-wrap">
                {exercises.map((ex) => (
                  <button
                    key={ex.exercise_name}
                    onClick={() => setSelected(ex.exercise_name)}
                    className={`text-sm px-3.5 py-1.5 rounded-xl border transition-all cursor-pointer ${
                      activeExercise === ex.exercise_name
                        ? 'bg-green-500/15 border-green-500/40 text-green-400 font-medium'
                        : 'border-neutral-800 text-neutral-400 hover:text-neutral-200 hover:border-neutral-600'
                    }`}
                  >
                    {ex.exercise_name}
                  </button>
                ))}
              </div>
            </div>
          )
        })}
      </div>

      {exerciseData && (
        <div className="bg-[#141414] border border-neutral-800 rounded-2xl p-5">
          <div className="flex items-center justify-between mb-5">
            <p className="text-white font-semibold">{activeExercise}</p>
            <p className="text-xs text-neutral-500">{exerciseData.history.length} sessions</p>
          </div>
          {exerciseData.history.length < 2 ? (
            <p className="text-neutral-500 text-sm py-8 text-center">
              Only one session logged — keep lifting to see your trend.
            </p>
          ) : (
            <ResponsiveContainer width="100%" height={260}>
              <LineChart data={exerciseData.history} margin={{ top: 4, right: 8, bottom: 0, left: -16 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1f1f1f" />
                <XAxis dataKey="date" {...axisProps} />
                <YAxis
                  {...axisProps}
                  domain={['auto', 'auto']}
                  tickFormatter={(v) => String(toDisplay(v))}
                />
                <Tooltip {...tooltipStyle} />
                <Line
                  type="monotone"
                  dataKey="weight"
                  stroke="#22c55e"
                  strokeWidth={2.5}
                  dot={{ fill: '#22c55e', r: 4, strokeWidth: 0 }}
                  activeDot={{ r: 6, fill: '#4ade80' }}
                />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>
      )}
    </div>
  )
}
