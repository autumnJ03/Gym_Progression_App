import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { register } from '../api/auth'
import { saveToken } from '../hooks/useAuth'

export default function RegisterPage() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const { access_token } = await register(email, password)
      saveToken(access_token)
      navigate('/')
    } catch (err: any) {
      setError(err.response?.data?.detail ?? 'Registration failed.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center px-4">
      <div className="w-full max-w-sm animate-slide-up">
        <div className="text-center mb-8">
          <div className="text-5xl mb-3">🏋️</div>
          <h1 className="text-2xl font-bold text-white mb-1">Create account</h1>
          <p className="text-neutral-500 text-sm">Start tracking your progress today.</p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="bg-[#141414] border border-neutral-800 rounded-2xl p-6 space-y-4 glow-green-sm"
        >
          {error && (
            <p className="text-red-400 text-sm bg-red-900/20 border border-red-800/60 rounded-xl px-3 py-2">
              {error}
            </p>
          )}
          <div>
            <label className="block text-sm text-neutral-400 mb-1.5">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full bg-[#0f0f0f] border border-neutral-700 rounded-xl px-3 py-2.5 text-white text-sm focus:outline-none focus:border-green-500 transition-colors"
            />
          </div>
          <div>
            <label className="block text-sm text-neutral-400 mb-1.5">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={8}
              className="w-full bg-[#0f0f0f] border border-neutral-700 rounded-xl px-3 py-2.5 text-white text-sm focus:outline-none focus:border-green-500 transition-colors"
            />
            <p className="text-xs text-neutral-600 mt-1">Minimum 8 characters</p>
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-green-500 hover:bg-green-400 disabled:opacity-50 text-black font-semibold rounded-xl py-2.5 text-sm transition-colors cursor-pointer glow-green-sm"
          >
            {loading ? 'Creating account…' : 'Create account'}
          </button>
        </form>

        <p className="text-center text-sm text-neutral-500 mt-4">
          Already have an account?{' '}
          <Link to="/login" className="text-green-400 hover:text-green-300">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  )
}
