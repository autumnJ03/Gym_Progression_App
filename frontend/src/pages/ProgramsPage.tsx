import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { enrollProgram, getPrograms, unenrollProgram } from '../api/programs'
import { client } from '../api/client'

interface Enrollment {
  id: number
  program_id: number
  next_session_position: number
}

async function getEnrollment(): Promise<Enrollment | null> {
  try {
    const { data } = await client.get<Enrollment>('/me/program')
    return data
  } catch (err: any) {
    if (err.response?.status === 404) return null
    throw err
  }
}

export default function ProgramsPage() {
  const qc = useQueryClient()

  const { data: programs, isLoading } = useQuery({
    queryKey: ['programs'],
    queryFn: getPrograms,
  })

  const { data: enrollment } = useQuery({
    queryKey: ['enrollment'],
    queryFn: getEnrollment,
  })

  const enrollMutation = useMutation({
    mutationFn: (id: number) => enrollProgram(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['enrollment'] })
      qc.invalidateQueries({ queryKey: ['today'] })
    },
  })

  const unenrollMutation = useMutation({
    mutationFn: unenrollProgram,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['enrollment'] })
      qc.invalidateQueries({ queryKey: ['today'] })
    },
  })

  if (isLoading) return <p className="text-neutral-500">Loading…</p>

  return (
    <div>
      <h2 className="text-xl font-semibold text-white mb-6">Programs</h2>

      <div className="space-y-4">
        {programs?.map((program) => {
          const isEnrolled = enrollment?.program_id === program.id

          return (
            <div
              key={program.id}
              className={`bg-[#1a1a1a] border rounded-xl p-5 ${
                isEnrolled ? 'border-orange-500/50' : 'border-neutral-800'
              }`}
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="text-white font-medium">{program.name}</h3>
                    {isEnrolled && (
                      <span className="text-xs bg-orange-500/20 text-orange-400 border border-orange-500/30 px-2 py-0.5 rounded-full">
                        Active
                      </span>
                    )}
                  </div>
                  <p className="text-neutral-400 text-sm">{program.description}</p>
                </div>

                <div className="shrink-0">
                  {isEnrolled ? (
                    <button
                      onClick={() => unenrollMutation.mutate()}
                      disabled={unenrollMutation.isPending}
                      className="text-sm text-neutral-500 hover:text-red-400 disabled:opacity-50 transition-colors cursor-pointer"
                    >
                      Unenroll
                    </button>
                  ) : (
                    <button
                      onClick={() => enrollMutation.mutate(program.id)}
                      disabled={enrollMutation.isPending || !!enrollment}
                      className="text-sm bg-orange-500 hover:bg-orange-600 disabled:opacity-40 text-white px-3 py-1.5 rounded-lg transition-colors cursor-pointer"
                    >
                      Enroll
                    </button>
                  )}
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
