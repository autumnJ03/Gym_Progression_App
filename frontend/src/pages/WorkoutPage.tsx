import { useState } from 'react'
import { useMutation, useQuery } from '@tanstack/react-query'
import { useNavigate, useParams } from 'react-router-dom'
import { getTodaySession, type TodayExercise } from '../api/programs'
import { completeWorkout, logSet } from '../api/workout'

interface LoggedSet {
  setNumber: number
  weightUsed: number
  repsCompleted: number
  hit: boolean
}

export default function WorkoutPage() {
  const { workoutLogId } = useParams<{ workoutLogId: string }>()
  const navigate = useNavigate()
  const id = Number(workoutLogId)

  const { data: session, isLoading } = useQuery({
    queryKey: ['today'],
    queryFn: getTodaySession,
  })

  // track logged sets per session_exercise_id
  const [loggedSets, setLoggedSets] = useState<Record<number, LoggedSet[]>>({})
  // track current input state per exercise
  const [inputs, setInputs] = useState<Record<number, { weight: string; reps: string }>>({})

  const logMutation = useMutation({
    mutationFn: ({
      seId,
      setNum,
      weight,
      reps,
    }: {
      seId: number
      setNum: number
      weight: number
      reps: number
    }) => logSet(id, seId, setNum, weight, reps),
    onSuccess: (result, vars) => {
      setLoggedSets((prev) => ({
        ...prev,
        [vars.seId]: [
          ...(prev[vars.seId] ?? []),
          {
            setNumber: vars.setNum,
            weightUsed: vars.weight,
            repsCompleted: vars.reps,
            hit: result.hit,
          },
        ],
      }))
    },
  })

  const completeMutation = useMutation({
    mutationFn: () => completeWorkout(id),
    onSuccess: () => navigate('/'),
  })

  if (isLoading || !session) return <p className="text-neutral-500">Loading…</p>

  function getNextSetNumber(ex: TodayExercise): number {
    return (loggedSets[ex.session_exercise_id]?.length ?? 0) + 1
  }

  function allSetsLogged(ex: TodayExercise): boolean {
    return (loggedSets[ex.session_exercise_id]?.length ?? 0) >= ex.sets_prescribed
  }

  const allDone = session.exercises.every(allSetsLogged)

  function handleLog(ex: TodayExercise) {
    const inp = inputs[ex.session_exercise_id] ?? {
      weight: String(ex.current_weight || ex.sets_prescribed),
      reps: String(ex.reps_prescribed),
    }
    const weight = parseFloat(inp.weight)
    const reps = parseInt(inp.reps)
    if (isNaN(weight) || isNaN(reps)) return
    logMutation.mutate({
      seId: ex.session_exercise_id,
      setNum: getNextSetNumber(ex),
      weight,
      reps,
    })
  }

  function getInput(ex: TodayExercise, field: 'weight' | 'reps'): string {
    if (field === 'weight') {
      return inputs[ex.session_exercise_id]?.weight ?? String(ex.current_weight || '')
    }
    return inputs[ex.session_exercise_id]?.reps ?? String(ex.reps_prescribed)
  }

  function setInput(seId: number, field: 'weight' | 'reps', value: string) {
    setInputs((prev) => ({
      ...prev,
      [seId]: { ...prev[seId], [field]: value },
    }))
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <p className="text-xs text-neutral-500 uppercase tracking-widest mb-1">Workout</p>
          <h2 className="text-2xl font-semibold text-white">{session.session_name}</h2>
        </div>
        {allDone && (
          <button
            onClick={() => completeMutation.mutate()}
            disabled={completeMutation.isPending}
            className="bg-green-600 hover:bg-green-500 disabled:opacity-50 text-white font-medium px-5 py-2 rounded-lg text-sm transition-colors cursor-pointer"
          >
            {completeMutation.isPending ? 'Saving…' : 'Complete workout ✓'}
          </button>
        )}
      </div>

      <div className="space-y-5">
        {session.exercises.map((ex) => {
          const logged = loggedSets[ex.session_exercise_id] ?? []
          const done = allSetsLogged(ex)
          const nextSet = getNextSetNumber(ex)

          return (
            <div
              key={ex.session_exercise_id}
              className="bg-[#1a1a1a] border border-neutral-800 rounded-xl p-4"
            >
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-white font-medium">{ex.exercise_name}</h3>
                <span className="text-xs text-neutral-500">
                  {ex.sets_prescribed} × {ex.reps_prescribed} reps
                  {Number(ex.current_weight) > 0 && ` @ ${ex.current_weight} kg`}
                </span>
              </div>

              {/* logged sets */}
              {logged.length > 0 && (
                <div className="flex gap-2 mb-3 flex-wrap">
                  {logged.map((s) => (
                    <div
                      key={s.setNumber}
                      className={`text-xs px-2 py-1 rounded-md font-medium ${
                        s.hit
                          ? 'bg-green-900/40 text-green-400 border border-green-800'
                          : 'bg-red-900/30 text-red-400 border border-red-800'
                      }`}
                    >
                      Set {s.setNumber}: {s.weightUsed}kg × {s.repsCompleted}{' '}
                      {s.hit ? '✓' : '✗'}
                    </div>
                  ))}
                </div>
              )}

              {/* log next set */}
              {!done && (
                <div className="flex items-center gap-2">
                  <span className="text-xs text-neutral-500 w-12">Set {nextSet}</span>
                  <input
                    type="number"
                    step="0.25"
                    min="0"
                    value={getInput(ex, 'weight')}
                    onChange={(e) => setInput(ex.session_exercise_id, 'weight', e.target.value)}
                    placeholder="kg"
                    className="w-20 bg-[#111] border border-neutral-700 rounded-lg px-2 py-1.5 text-white text-sm text-center focus:outline-none focus:border-orange-500"
                  />
                  <span className="text-neutral-600 text-xs">kg</span>
                  <input
                    type="number"
                    min="0"
                    value={getInput(ex, 'reps')}
                    onChange={(e) => setInput(ex.session_exercise_id, 'reps', e.target.value)}
                    placeholder="reps"
                    className="w-20 bg-[#111] border border-neutral-700 rounded-lg px-2 py-1.5 text-white text-sm text-center focus:outline-none focus:border-orange-500"
                  />
                  <span className="text-neutral-600 text-xs">reps</span>
                  <button
                    onClick={() => handleLog(ex)}
                    disabled={logMutation.isPending}
                    className="ml-auto text-sm bg-neutral-700 hover:bg-neutral-600 disabled:opacity-50 text-white px-3 py-1.5 rounded-lg transition-colors cursor-pointer"
                  >
                    Log
                  </button>
                </div>
              )}

              {done && (
                <p className="text-xs text-green-500">All sets logged ✓</p>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
