import { client } from './client'

export interface WorkoutLog {
  workout_log_id: number
}

export interface SetResult {
  id: number
  hit: boolean
}

export interface SetLog {
  id: number
  session_exercise_id: number
  set_number: number
  weight_used: number
  reps_completed: number
  hit: boolean
}

export async function startWorkout(): Promise<WorkoutLog> {
  const { data } = await client.post<WorkoutLog>('/me/session/today/start')
  return data
}

export async function logSet(
  workoutLogId: number,
  sessionExerciseId: number,
  setNumber: number,
  weightUsed: number,
  repsCompleted: number
): Promise<SetResult> {
  const { data } = await client.post<SetResult>(`/me/workout/${workoutLogId}/sets`, {
    session_exercise_id: sessionExerciseId,
    set_number: setNumber,
    weight_used: weightUsed,
    reps_completed: repsCompleted,
  })
  return data
}

export async function completeWorkout(workoutLogId: number): Promise<void> {
  await client.post(`/me/workout/${workoutLogId}/complete`)
}

export async function deleteSet(workoutLogId: number, setLogId: number): Promise<void> {
  await client.delete(`/me/workout/${workoutLogId}/sets/${setLogId}`)
}

export async function getSets(workoutLogId: number): Promise<SetLog[]> {
  const { data } = await client.get<SetLog[]>(`/me/workout/${workoutLogId}/sets`)
  return data
}

export async function updateSet(
  workoutLogId: number,
  setLogId: number,
  weightUsed: number,
  repsCompleted: number,
): Promise<SetResult> {
  const { data } = await client.patch<SetResult>(
    `/me/workout/${workoutLogId}/sets/${setLogId}`,
    { weight_used: weightUsed, reps_completed: repsCompleted },
  )
  return data
}
