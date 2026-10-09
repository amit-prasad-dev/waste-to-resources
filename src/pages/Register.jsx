import { useState } from 'react'
import { Link, useNavigate, Navigate } from 'react-router-dom'
import { useAuth } from '../AuthContext'
import AuthShell from '../components/AuthShell'
import GoogleButton, { googleCheck } from '../components/GoogleButton'

const DEPTS = ['Computer Science', 'Information Technology', 'Mechanical', 'Civil', 'Electrical', 'Electronics', 'Science', 'Commerce', 'Arts', 'Administration', 'Other']
const YEARS = ['1st Year', '2nd Year', '3rd Year', '4th Year', 'Postgraduate']

export default function Register() {
  const { user, register } = useAuth()
  const nav = useNavigate()
  const [f, setF] = useState({ name: '', email: '', pw: '', pw2: '', userType: 'student', department: '', year: '', agree: false })
  const [err, setErr] = useState(''); const [busy, setBusy] = useState(false)
  const set = k => e => setF({ ...f, [k]: e.target.value })
  if (user && !googleCheck.active) return <Navigate to="/dashboard" replace />

  const submit = async e => {
    e.preventDefault(); setErr('')
    if (f.pw !== f.pw2) return setErr('Passwords do not match.')
    if (!f.agree) return setErr('Please accept the terms to continue.')
    setBusy(true)
    try { await register(f.name, f.email, f.pw, { userType: f.userType, department: f.department, year: f.userType === 'student' ? f.year : '' }); nav('/dashboard') }
    catch (e) { setErr(e.code === 'auth/email-already-in-use' ? 'This email is already registered.' : e.message.replace('Firebase: ', '')); setBusy(false) }
  }
  return (
    <AuthShell title="Join the movement."
      text="Create your account to start sharing resources, reducing waste, and making a positive impact on our campus community."
      points={['Post items in under 2 minutes', 'Connect with campus members', 'Free and open to all students & staff']}>
      <form className="auth-card" onSubmit={submit}>
        <h1>Create your account</h1><p className="muted">Fill in your details to get started</p>
        <label>Full Name<input required placeholder="Enter your full name" value={f.name} onChange={set('name')} /></label>
        <label>College Email<input type="email" required placeholder="yourname@college.edu" value={f.email} onChange={set('email')} /></label>
        <div className="two">
          <label>Password<input type="password" minLength={6} required placeholder="Min. 6 characters" value={f.pw} onChange={set('pw')} /></label>
          <label>Confirm Password<input type="password" required placeholder="Re-enter password" value={f.pw2} onChange={set('pw2')} /></label>
        </div>
        <div className="two">
          <label>I am a<select value={f.userType} onChange={set('userType')}><option value="student">Student</option><option value="faculty">Faculty</option><option value="staff">Staff</option></select></label>
          <label>Department<select required value={f.department} onChange={set('department')}><option value="">Select department</option>{DEPTS.map(d => <option key={d}>{d}</option>)}</select></label>
        </div>
        {f.userType === 'student' && <label>Year<select required value={f.year} onChange={set('year')}><option value="">Select year</option>{YEARS.map(y => <option key={y}>{y}</option>)}</select></label>}
        <label className="check"><input type="checkbox" checked={f.agree} onChange={e => setF({ ...f, agree: e.target.checked })} />
          <span>I agree to use this platform responsibly and in accordance with the college's community guidelines.</span></label>
        {err && <div className="error">{err}</div>}
        <button className="btn full" disabled={busy}>{busy ? 'Please wait…' : 'Create Account'}</button>
        <div className="divider">or</div>
        <GoogleButton mode="signup" label="Sign up with Google" />
        <p className="center-text muted">Already have an account? <Link to="/login">Log in</Link></p>
      </form>
    </AuthShell>
  )
}
