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

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="w-8 h-8 border-2 border-green-500/30 border-t-green-500 rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div>
      <div className="mb-6">
        <p className="text-xs text-green-500/70 uppercase tracking-widest font-medium mb-1">Training</p>
        <h2 className="text-2xl font-bold text-white">Programs</h2>
      </div>

      <div className="space-y-4">
        {programs?.map((program) => {
          const isEnrolled = enrollment?.program_id === program.id

          return (
            <div
              key={program.id}
              className={`bg-[#141414] border rounded-2xl p-5 transition-all ${
                isEnrolled
                  ? 'border-green-500/40 glow-green-sm'
                  : 'border-neutral-800 hover:border-neutral-700'
              }`}
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 mb-1.5">
                    <h3 className="text-white font-semibold">{program.name}</h3>
                    {isEnrolled && (
                      <span className="text-xs bg-green-500/15 text-green-400 border border-green-500/30 px-2 py-0.5 rounded-full font-medium">
                        ✓ Active
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
                      className="text-sm bg-green-500 hover:bg-green-400 disabled:opacity-40 text-black font-semibold px-4 py-1.5 rounded-xl transition-colors cursor-pointer"
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
