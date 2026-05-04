import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { clearToken } from '../hooks/useAuth'
import { useWeightUnit } from '../contexts/WeightUnitContext'

export default function Layout() {
  const navigate = useNavigate()
  const { unit, toggle } = useWeightUnit()

  function logout() {
    clearToken()
    navigate('/login')
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-neutral-100 flex flex-col">
      <nav className="sticky top-0 z-50 border-b border-neutral-800/60 bg-[#0a0a0a]/80 backdrop-blur-md px-6 py-4 flex items-center gap-6">
        <span className="font-bold text-green-400 text-lg tracking-tight">
          🏋️ GymProg
        </span>
        <NavLink
          to="/"
          end
          className={({ isActive }) =>
            `text-sm px-3 py-1.5 rounded-lg transition-colors ${
              isActive
                ? 'bg-green-500/10 text-green-400 font-medium'
                : 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800/60'
            }`
          }
        >
          Today
        </NavLink>
        <NavLink
          to="/programs"
          className={({ isActive }) =>
            `text-sm px-3 py-1.5 rounded-lg transition-colors ${
              isActive
                ? 'bg-green-500/10 text-green-400 font-medium'
                : 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800/60'
            }`
          }
        >
          Programs
        </NavLink>
        <NavLink
          to="/progress"
          className={({ isActive }) =>
            `text-sm px-3 py-1.5 rounded-lg transition-colors ${
              isActive
                ? 'bg-green-500/10 text-green-400 font-medium'
                : 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800/60'
            }`
          }
        >
          Progress
        </NavLink>
        <div className="ml-auto flex items-center gap-3">
          <button
            onClick={toggle}
            className="text-xs bg-neutral-800 hover:bg-neutral-700 border border-neutral-700 text-neutral-300 px-3 py-1.5 rounded-lg transition-colors cursor-pointer font-medium"
          >
            {unit === 'lbs' ? 'lbs → kg' : 'kg → lbs'}
          </button>
          <button
            onClick={logout}
            className="text-sm text-neutral-600 hover:text-neutral-400 transition-colors cursor-pointer"
          >
            Log out
          </button>
        </div>
      </nav>
      <main className="flex-1 px-6 py-8 max-w-2xl mx-auto w-full">
        <Outlet />
      </main>
    </div>
  )
}
