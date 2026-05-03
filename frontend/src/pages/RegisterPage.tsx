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
    <div className="min-h-screen bg-[#0f0f0f] flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <h1 className="text-2xl font-semibold text-white mb-1 text-center">GymProg</h1>
        <p className="text-neutral-500 text-sm text-center mb-8">Create your account to get started.</p>

        <form onSubmit={handleSubmit} className="bg-[#1a1a1a] border border-neutral-800 rounded-xl p-6 space-y-4">
          {error && (
            <p className="text-red-400 text-sm bg-red-900/20 border border-red-800 rounded-lg px-3 py-2">
              {error}
            </p>
          )}
          <div>
            <label className="block text-sm text-neutral-400 mb-1">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full bg-[#111] border border-neutral-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-orange-500"
            />
          </div>
          <div>
            <label className="block text-sm text-neutral-400 mb-1">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={8}
              className="w-full bg-[#111] border border-neutral-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-orange-500"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white font-medium rounded-lg py-2 text-sm transition-colors cursor-pointer"
          >
            {loading ? 'Creating account…' : 'Create account'}
          </button>
        </form>

        <p className="text-center text-sm text-neutral-500 mt-4">
          Already have an account?{' '}
          <Link to="/login" className="text-orange-400 hover:text-orange-300">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  )
}
