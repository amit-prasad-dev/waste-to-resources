import { NavLink, Outlet } from 'react-router-dom'
import { useAuth } from '../AuthContext'

const links = [
  { to: '/dashboard', label: 'Home', icon: '🏠' },
  { to: '/browse', label: 'Browse', icon: '🔍' },
  { to: '/post', label: 'Post', icon: '➕' },
  { to: '/my-requests', label: 'Requests', icon: '📨' },
  { to: '/impact', label: 'Impact', icon: '🌱' },
]

export default function Layout() {
  const { profile, user, isAdmin, logout } = useAuth()
  const all = [...links,
    { to: '/my-listings', label: 'My Listings', icon: '📦', desktopOnly: true },
    ...(isAdmin ? [{ to: '/admin', label: 'Admin', icon: '🛡️', desktopOnly: true }] : [])]

  return (
    <div className="shell">
      <aside className="sidebar">
        <div className="brand">♻️ Waste-to-Resources</div>
        <nav>
          {all.map(l => (
            <NavLink key={l.to} to={l.to} end={l.end}
              className={({ isActive }) => 'navlink' + (isActive ? ' active' : '')}>
              <span>{l.icon}</span> {l.label}
            </NavLink>
          ))}
        </nav>
        <div className="sidebar-foot">
          <div className="muted small">{profile?.name || user?.email}</div>
          <button className="btn ghost" onClick={logout}>Logout</button>
        </div>
      </aside>

      <div className="main">
        <header className="topbar">
          <span className="brand-sm">♻️ Waste-to-Resources</span>
          <button className="btn ghost small" onClick={logout}>Logout</button>
        </header>
        <main className="content"><Outlet /></main>
      </div>

      <nav className="bottomnav">
        {all.filter(l => !l.desktopOnly).map(l => (
          <NavLink key={l.to} to={l.to} end={l.end}
            className={({ isActive }) => 'bn' + (isActive ? ' active' : '')}>
            <span>{l.icon}</span><small>{l.label}</small>
          </NavLink>
        ))}
      </nav>
    </div>
  )
}
