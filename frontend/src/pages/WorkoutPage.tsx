import { useEffect, useRef, useState } from 'react'
import { useMutation, useQuery } from '@tanstack/react-query'
import { useNavigate, useParams } from 'react-router-dom'
import { getTodaySession, type TodayExercise } from '../api/programs'
import { completeWorkout, getSets, logSet, updateSet } from '../api/workout'

interface LoggedSet {
  id: number
  setNumber: number
  weightUsed: number
  repsCompleted: number
  hit: boolean
}

interface EditingSet {
  setLogId: number
  seId: number
  weight: string
  reps: string
}

export default function WorkoutPage() {
  const { workoutLogId } = useParams<{ workoutLogId: string }>()
  const navigate = useNavigate()
  const id = Number(workoutLogId)

  const { data: session, isLoading: sessionLoading } = useQuery({
    queryKey: ['today'],
    queryFn: getTodaySession,
  })

  const { data: existingSets, isLoading: setsLoading } = useQuery({
    queryKey: ['sets', id],
    queryFn: () => getSets(id),
    enabled: !isNaN(id),
  })

  const [loggedSets, setLoggedSets] = useState<Record<number, LoggedSet[]>>({})
  const [inputs, setInputs] = useState<Record<number, { weight: string; reps: string }>>({})
  const [editingSet, setEditingSet] = useState<EditingSet | null>(null)
  const initializedRef = useRef(false)

  // Populate logged sets from server on resume
  useEffect(() => {
    if (!existingSets || !session || initializedRef.current) return
    initializedRef.current = true
    const grouped: Record<number, LoggedSet[]> = {}
    for (const s of existingSets) {
      if (!grouped[s.session_exercise_id]) grouped[s.session_exercise_id] = []
      grouped[s.session_exercise_id].push({
        id: s.id,
        setNumber: s.set_number,
        weightUsed: s.weight_used,
        repsCompleted: s.reps_completed,
        hit: s.hit,
      })
    }
    setLoggedSets(grouped)
  }, [existingSets, session])

  const logMutation = useMutation({
    mutationFn: ({
      seId, setNum, weight, reps,
    }: { seId: number; setNum: number; weight: number; reps: number }) =>
      logSet(id, seId, setNum, weight, reps),
    onSuccess: (result, vars) => {
      setLoggedSets((prev) => ({
        ...prev,
        [vars.seId]: [
          ...(prev[vars.seId] ?? []),
          {
            id: result.id,
            setNumber: vars.setNum,
            weightUsed: vars.weight,
            repsCompleted: vars.reps,
            hit: result.hit,
          },
        ],
      }))
    },
  })

  const updateMutation = useMutation({
    mutationFn: ({ setLogId, weight, reps }: { setLogId: number; weight: number; reps: number }) =>
      updateSet(id, setLogId, weight, reps),
    onSuccess: (result, vars) => {
      setLoggedSets((prev) => {
        const updated = { ...prev }
        for (const seId of Object.keys(updated)) {
          updated[Number(seId)] = updated[Number(seId)].map((s) =>
            s.id === vars.setLogId
              ? { ...s, weightUsed: vars.weight, repsCompleted: vars.reps, hit: result.hit }
              : s
          )
        }
        return updated
      })
      setEditingSet(null)
    },
  })

  const completeMutation = useMutation({
    mutationFn: () => completeWorkout(id),
    onSuccess: () => navigate('/'),
  })

  if (sessionLoading || setsLoading || !session) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="w-8 h-8 border-2 border-green-500/30 border-t-green-500 rounded-full animate-spin" />
      </div>
    )
  }

  function getNextSetNumber(ex: TodayExercise): number {
    return (loggedSets[ex.session_exercise_id]?.length ?? 0) + 1
  }

  function allSetsLogged(ex: TodayExercise): boolean {
    return (loggedSets[ex.session_exercise_id]?.length ?? 0) >= ex.sets_prescribed
  }

  const allDone = session.exercises.every(allSetsLogged)
  const totalDone = session.exercises.reduce(
    (sum, ex) => sum + (loggedSets[ex.session_exercise_id]?.length ?? 0), 0
  )
  const totalSets = session.exercises.reduce((sum, ex) => sum + ex.sets_prescribed, 0)

  function getInput(ex: TodayExercise, field: 'weight' | 'reps'): string {
    if (field === 'weight') return inputs[ex.session_exercise_id]?.weight ?? String(ex.current_weight)
    return inputs[ex.session_exercise_id]?.reps ?? '8'
  }

  function handleLog(ex: TodayExercise) {
    const weight = parseFloat(getInput(ex, 'weight'))
    const reps = parseInt(getInput(ex, 'reps'))
    if (isNaN(weight) || isNaN(reps)) return
    logMutation.mutate({ seId: ex.session_exercise_id, setNum: getNextSetNumber(ex), weight, reps })
  }

  function setInput(seId: number, field: 'weight' | 'reps', value: string) {
    setInputs((prev) => ({ ...prev, [seId]: { ...prev[seId], [field]: value } }))
  }

  function handleSaveEdit() {
    if (!editingSet) return
    const weight = parseFloat(editingSet.weight)
    const reps = parseInt(editingSet.reps)
    if (isNaN(weight) || isNaN(reps)) return
    updateMutation.mutate({ setLogId: editingSet.setLogId, weight, reps })
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <p className="text-xs text-green-500/70 uppercase tracking-widest font-medium mb-1">In session</p>
          <h2 className="text-2xl font-bold text-white">{session.session_name}</h2>
        </div>
        {allDone ? (
          <button
            onClick={() => completeMutation.mutate()}
            disabled={completeMutation.isPending}
            className="bg-green-500 hover:bg-green-400 disabled:opacity-50 text-black font-semibold px-5 py-2.5 rounded-xl text-sm transition-colors cursor-pointer glow-green"
          >
            {completeMutation.isPending ? 'Saving…' : '✓ Complete workout'}
          </button>
        ) : (
          <div className="text-right">
            <p className="text-xs text-neutral-500">
              <span className="text-green-400 font-semibold text-sm">{totalDone}</span>
              <span className="text-neutral-600">/{totalSets}</span>
            </p>
            <p className="text-xs text-neutral-600">sets done</p>
          </div>
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
              className={`bg-[#141414] border rounded-2xl p-4 transition-all ${
                done ? 'border-green-500/30' : 'border-neutral-800'
              }`}
            >
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-white font-semibold">{ex.exercise_name}</h3>
                <div className="flex items-center gap-2">
                  {Number(ex.current_weight) > 0 && (
                    <span className="text-xs text-neutral-500">{ex.current_weight} lbs</span>
                  )}
                  <span
                    className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
                      done
                        ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                        : 'bg-neutral-800 text-neutral-400 border border-neutral-700'
                    }`}
                  >
                    {logged.length}/{ex.sets_prescribed}
                  </span>
                </div>
              </div>

              {logged.length > 0 && (
                <div className="flex gap-2 mb-3 flex-wrap">
                  {logged.map((s) =>
                    editingSet?.setLogId === s.id ? (
                      <div key={s.id} className="flex items-center gap-1.5">
                        <input
                          type="number"
                          step="0.25"
                          value={editingSet.weight}
                          onChange={(e) => setEditingSet({ ...editingSet, weight: e.target.value })}
                          className="w-16 bg-[#0f0f0f] border border-green-500/50 rounded-lg px-2 py-1 text-white text-xs text-center focus:outline-none"
                        />
                        <span className="text-neutral-600 text-xs">lbs</span>
                        <input
                          type="number"
                          value={editingSet.reps}
                          onChange={(e) => setEditingSet({ ...editingSet, reps: e.target.value })}
                          className="w-12 bg-[#0f0f0f] border border-green-500/50 rounded-lg px-2 py-1 text-white text-xs text-center focus:outline-none"
                        />
                        <span className="text-neutral-600 text-xs">reps</span>
                        <button
                          onClick={handleSaveEdit}
                          disabled={updateMutation.isPending}
                          className="text-xs bg-green-500/20 border border-green-500/40 text-green-400 px-2 py-1 rounded-lg cursor-pointer hover:bg-green-500/30 transition-colors"
                        >
                          ✓
                        </button>
                        <button
                          onClick={() => setEditingSet(null)}
                          className="text-xs text-neutral-500 hover:text-neutral-300 px-1 cursor-pointer"
                        >
                          ✕
                        </button>
                      </div>
                    ) : (
                      <div
                        key={s.id}
                        className={`group flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-lg font-medium ${
                          s.hit
                            ? 'bg-green-900/30 text-green-400 border border-green-800/60'
                            : 'bg-red-900/20 text-red-400 border border-red-800/60'
                        }`}
                      >
                        {s.weightUsed} lbs × {s.repsCompleted} {s.hit ? '✓' : '✗'}
                        <button
                          onClick={() =>
                            setEditingSet({
                              setLogId: s.id,
                              seId: ex.session_exercise_id,
                              weight: String(s.weightUsed),
                              reps: String(s.repsCompleted),
                            })
                          }
                          className="opacity-0 group-hover:opacity-100 text-neutral-500 hover:text-neutral-300 transition-opacity cursor-pointer ml-0.5"
                          title="Edit set"
                        >
                          ✎
                        </button>
                      </div>
                    )
                  )}
                </div>
              )}

              {!done && (
                <div className="flex items-center gap-2">
                  <span className="text-xs text-neutral-600 w-10 shrink-0">Set {nextSet}</span>
                  <input
                    type="number"
                    step="0.25"
                    min="0"
                    value={getInput(ex, 'weight')}
                    onChange={(e) => setInput(ex.session_exercise_id, 'weight', e.target.value)}
                    placeholder="0"
                    className="w-20 bg-[#0f0f0f] border border-neutral-700 rounded-xl px-2 py-2 text-white text-sm text-center focus:outline-none focus:border-green-500 transition-colors"
                  />
                  <span className="text-neutral-600 text-xs">lbs</span>
                  <input
                    type="number"
                    min="0"
                    value={getInput(ex, 'reps')}
                    onChange={(e) => setInput(ex.session_exercise_id, 'reps', e.target.value)}
                    placeholder="reps"
                    className="w-20 bg-[#0f0f0f] border border-neutral-700 rounded-xl px-2 py-2 text-white text-sm text-center focus:outline-none focus:border-green-500 transition-colors"
                  />
                  <span className="text-neutral-600 text-xs">reps</span>
                  <button
                    onClick={() => handleLog(ex)}
                    disabled={logMutation.isPending}
                    className="ml-auto text-sm bg-green-500/15 hover:bg-green-500/25 border border-green-500/30 disabled:opacity-50 text-green-400 font-medium px-4 py-2 rounded-xl transition-colors cursor-pointer"
                  >
                    Log
                  </button>
                </div>
              )}

              {done && (
                <p className="text-xs text-green-500/60 font-medium">All sets complete ✓</p>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
