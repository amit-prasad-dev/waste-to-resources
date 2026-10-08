import { useState } from 'react'
import { Link, useNavigate, Navigate } from 'react-router-dom'
import { sendPasswordResetEmail } from 'firebase/auth'
import { auth } from '../firebase'
import { useAuth } from '../AuthContext'
import AuthShell from '../components/AuthShell'
import GoogleButton from '../components/GoogleButton'

export default function Login() {
  const { user, login } = useAuth()
  const nav = useNavigate()
  const [f, setF] = useState({ email: '', pw: '' })
  const [err, setErr] = useState(''); const [msg, setMsg] = useState(''); const [busy, setBusy] = useState(false)
  if (user) return <Navigate to="/dashboard" replace />

  const submit = async e => {
    e.preventDefault(); setErr(''); setMsg(''); setBusy(true)
    try { await login(f.email, f.pw); nav('/dashboard') }
    catch (e) { setErr('Invalid email or password.') }
    setBusy(false)
  }
  const forgot = async () => {
    if (!f.email) return setErr('Enter your email first.')
    try { await sendPasswordResetEmail(auth, f.email); setErr(''); setMsg('Password reset email sent.') }
    catch { setErr('Could not send reset email.') }
  }
  return (
    <AuthShell title="Turn waste into opportunity."
      text="Join our campus community to share, reuse, and recycle resources."
      points={['Donate items you no longer need', 'Find resources shared by others', 'Track your sustainability impact']}>
      <form className="auth-card" onSubmit={submit}>
        <h1>Welcome back</h1><p className="muted">Enter your credentials to access your account</p>
        <label>Email<input type="email" required placeholder="yourname@college.edu" value={f.email} onChange={e => setF({ ...f, email: e.target.value })} /></label>
        <label>Password<input type="password" required placeholder="Enter your password" value={f.pw} onChange={e => setF({ ...f, pw: e.target.value })} /></label>
        <div className="between"><span /><button type="button" className="link" onClick={forgot}>Forgot password?</button></div>
        {err && <div className="error">{err}</div>}{msg && <div className="ok">{msg}</div>}
        <button className="btn full" disabled={busy}>{busy ? 'Please wait…' : 'Log In'}</button>
        <div className="divider">or</div>
        <GoogleButton label="Continue with Google" />
        <p className="center-text muted">Don't have an account? <Link to="/register">Create one</Link></p>
      </form>
    </AuthShell>
  )
}
