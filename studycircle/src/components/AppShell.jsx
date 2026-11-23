import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { LayoutDashboard, Search, UserRound, LogOut, Users } from 'lucide-react'
import { useStore } from '../store'
import { Logo, Avatar } from './ui'
import { isMember } from '../lib/match'
export default function AppShell() {
  const { state, dispatch } = useStore()
  const nav = useNavigate()
  const mine = state.groups.filter((g) => isMember(g))
  const link = ({ isActive }) => `side-link ${isActive ? 'active' : ''}`
  return (
    <div className="shell">
      <aside className="side">
        <Logo to="/app" />
        <nav className="side-nav" aria-label="Main">
          <NavLink end to="/app" className={link}>
            <LayoutDashboard size={17} /> Dashboard
          </NavLink>
          <NavLink to="/app/find" className={link}>
            <Search size={17} /> Find groups
          </NavLink>
          <NavLink to="/app/profile" className={link}>
            <UserRound size={17} /> My profile
          </NavLink>
        </nav>
        <div className="side-section">
          <p className="eyebrow">My groups</p>
          {mine.length === 0 && <p className="muted small">None yet. Try “Find groups”.</p>}
          {mine.map((g) => (
            <NavLink key={g.id} to={`/app/groups/${g.id}`} className={link}>
              <Users size={16} />
              <span className="side-group">
                {g.name}
                <small>{g.course}</small>
              </span>
            </NavLink>
          ))}
        </div>
        <div className="side-user">
          <Avatar name={state.user.name} size={34} />
          <div>
            <strong>{state.user.name}</strong>
            <small>{state.user.school || 'Add your school'}</small>
          </div>
          <button
            className="icon-btn"
            aria-label="Log out"
            title="Log out"
            onClick={() => {
              dispatch({ type: 'logout' })
              nav('/')
            }}
          >
            <LogOut size={17} />
          </button>
        </div>
      </aside>
      <main className="main">
        <Outlet />
      </main>
    </div>
  )
}
