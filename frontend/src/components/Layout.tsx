import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { clearToken } from '../hooks/useAuth'

export default function Layout() {
  const navigate = useNavigate()

  function logout() {
    clearToken()
    navigate('/login')
  }

  return (
    <div className="min-h-screen bg-[#0f0f0f] text-neutral-100 flex flex-col">
      <nav className="border-b border-neutral-800 px-6 py-4 flex items-center gap-6">
        <span className="font-semibold text-orange-500 text-lg tracking-tight">GymProg</span>
        <NavLink
          to="/"
          end
          className={({ isActive }) =>
            `text-sm ${isActive ? 'text-white' : 'text-neutral-400 hover:text-neutral-200'}`
          }
        >
          Today
        </NavLink>
        <NavLink
          to="/programs"
          className={({ isActive }) =>
            `text-sm ${isActive ? 'text-white' : 'text-neutral-400 hover:text-neutral-200'}`
          }
        >
          Programs
        </NavLink>
        <button
          onClick={logout}
          className="ml-auto text-sm text-neutral-500 hover:text-neutral-300 cursor-pointer"
        >
          Log out
        </button>
      </nav>
      <main className="flex-1 px-6 py-8 max-w-2xl mx-auto w-full">
        <Outlet />
      </main>
    </div>
  )
}
