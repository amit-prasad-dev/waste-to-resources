import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './AuthContext'
import Layout from './components/Layout'
import Login from './pages/Login'
import Register from './pages/Register'
import Landing from './pages/Landing'
import Dashboard from './pages/Dashboard'
import PostItem from './pages/PostItem'
import Browse from './pages/Browse'
import MyListings from './pages/MyListings'
import MyRequests from './pages/MyRequests'
import Impact from './pages/Impact'
import Admin from './pages/Admin'
import './day2.css'
import './day3.css'

function Home() {
  const { user, loading } = useAuth()
  if (loading) return null
  return user ? <Navigate to="/dashboard" replace /> : <Landing />
}

function Protected({ children, admin }) {
  const { user, profile, isAdmin, loading, logout } = useAuth()
  if (loading) return <div className="center">Loading…</div>
  if (!user) return <Navigate to="/login" replace />
  if (profile?.disabled) return <div className="center" style={{ textAlign: 'center' }}><div><h2>Account disabled</h2><p className="muted">Contact the admin.</p><button className="btn" onClick={logout}>Logout</button></div></div>
  if (admin && !isAdmin) return <Navigate to="/dashboard" replace />
  return children
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route element={<Protected><Layout /></Protected>}>
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="browse" element={<Browse />} />
        <Route path="post" element={<PostItem />} />
        <Route path="edit/:id" element={<PostItem />} />
        <Route path="my-listings" element={<MyListings />} />
        <Route path="my-requests" element={<MyRequests />} />
        <Route path="impact" element={<Impact />} />
        <Route path="admin" element={<Protected admin><Admin /></Protected>} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
