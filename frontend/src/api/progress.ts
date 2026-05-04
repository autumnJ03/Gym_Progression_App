import { client } from './client'

export interface ProgressPoint {
  date: string
  weight: number
}

export interface ExerciseProgress {
  exercise_name: string
  session_name: string
  history: ProgressPoint[]
}

export async function getProgress(): Promise<ExerciseProgress[]> {
  const { data } = await client.get<ExerciseProgress[]>('/me/progress')
  return data
}
