import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { acceptReturnReduction, getStatus, getTodaySession } from '../api/programs'
import { startWorkout } from '../api/workout'

export default function DashboardPage() {
  const navigate = useNavigate()
  const qc = useQueryClient()

  const { data: session, isLoading, error } = useQuery({
    queryKey: ['today'],
    queryFn: getTodaySession,
    retry: false,
  })

  const { data: status } = useQuery({
    queryKey: ['status'],
    queryFn: getStatus,
  })

  const startMutation = useMutation({
    mutationFn: startWorkout,
    onSuccess: ({ workout_log_id }) => navigate(`/workout/${workout_log_id}`),
  })

  const reduceMutation = useMutation({
    mutationFn: acceptReturnReduction,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['today'] }),
  })

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="w-8 h-8 border-2 border-green-500/30 border-t-green-500 rounded-full animate-spin" />
      </div>
    )
  }

  if (error) {
    const status_code = (error as any).response?.status
    if (status_code === 404) {
      return (
        <div className="text-center py-16">
          <div className="text-5xl mb-4">📋</div>
          <h2 className="text-xl font-semibold text-white mb-2">No program selected</h2>
          <p className="text-neutral-400 text-sm mb-6">
            Head over to Programs to enroll in a training plan.
          </p>
          <button
            onClick={() => navigate('/programs')}
            className="bg-green-500 hover:bg-green-400 text-black font-semibold px-6 py-2.5 rounded-xl text-sm transition-colors cursor-pointer glow-green-sm"
          >
            Browse programs →
          </button>
        </div>
      )
    }
    return <p className="text-red-400">Failed to load session.</p>
  }

  if (!session) return null

  return (
    <div>
      {status?.show_return_prompt && (
        <div className="mb-6 bg-yellow-900/20 border border-yellow-700/60 rounded-2xl p-4">
          <p className="text-yellow-300 font-medium text-sm mb-1">👋 Welcome back!</p>
          <p className="text-neutral-400 text-sm mb-3">
            You've been away for {status.days_idle} days. We recommend reducing all weights by 10% to ease back in.
          </p>
          <button
            onClick={() => reduceMutation.mutate()}
            disabled={reduceMutation.isPending}
            className="bg-yellow-600 hover:bg-yellow-500 disabled:opacity-50 text-white text-sm font-medium px-4 py-2 rounded-xl transition-colors cursor-pointer"
          >
            {reduceMutation.isPending ? 'Applying…' : 'Apply 10% reduction'}
          </button>
        </div>
      )}

      <div className="flex items-center justify-between mb-6">
        <div>
          <p className="text-xs text-green-500/70 uppercase tracking-widest font-medium mb-1">Today's session</p>
          <h2 className="text-2xl font-bold text-white">{session.session_name}</h2>
        </div>
        <button
          onClick={() => {
            if (session.workout_log_id) {
              navigate(`/workout/${session.workout_log_id}`)
            } else {
              startMutation.mutate()
            }
          }}
          disabled={startMutation.isPending}
          className="bg-green-500 hover:bg-green-400 disabled:opacity-50 text-black font-semibold px-5 py-2.5 rounded-xl text-sm transition-colors cursor-pointer glow-green-sm"
        >
          {startMutation.isPending
            ? 'Starting…'
            : session.workout_log_id
            ? '▶ Resume workout'
            : '▶ Start workout'}
        </button>
      </div>

      <div className="space-y-3">
        {session.exercises.map((ex) => (
          <div
            key={ex.session_exercise_id}
            className="bg-[#141414] border border-neutral-800 hover:border-neutral-700 rounded-2xl px-4 py-3.5 flex items-center justify-between transition-colors"
          >
            <div>
              <p className="text-white text-sm font-medium">{ex.exercise_name}</p>
              <p className="text-neutral-500 text-xs mt-0.5">
                {ex.sets_prescribed} × {ex.reps_prescribed} reps
              </p>
            </div>
            <div className="text-right">
              <p className="text-green-400 font-semibold text-sm">
                {Number(ex.current_weight) === 0 ? '—' : `${ex.current_weight} lbs`}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
