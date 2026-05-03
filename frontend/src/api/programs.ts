import { client } from './client'

export interface Program {
  id: number
  name: string
  description: string
}

export interface TodayExercise {
  session_exercise_id: number
  exercise_name: string
  sets_prescribed: number
  reps_prescribed: number
  current_weight: number
  order_in_session: number
}

export interface TodaySession {
  workout_log_id: number | null
  session_name: string
  exercises: TodayExercise[]
}

export interface UserStatus {
  days_idle: number | null
  show_return_prompt: boolean
}

export async function getPrograms(): Promise<Program[]> {
  const { data } = await client.get<Program[]>('/programs')
  return data
}

export async function enrollProgram(programId: number): Promise<void> {
  await client.post('/me/program', { program_id: programId })
}

export async function unenrollProgram(): Promise<void> {
  await client.delete('/me/program')
}

export async function getTodaySession(): Promise<TodaySession> {
  const { data } = await client.get<TodaySession>('/me/session/today')
  return data
}

export async function getStatus(): Promise<UserStatus> {
  const { data } = await client.get<UserStatus>('/me/status')
  return data
}

export async function acceptReturnReduction(): Promise<void> {
  await client.post('/me/accept-return-reduction')
}
