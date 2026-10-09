import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { collection, query, where, getDocs, doc, updateDoc } from 'firebase/firestore'
import { sendPasswordResetEmail, updateProfile } from 'firebase/auth'
import { auth, db } from '../firebase'
import { useAuth } from '../AuthContext'
import ProfileCompleteness from '../components/ProfileCompleteness'
import '../profile.css'

const DEPTS = ['Computer Science', 'Information Technology', 'Mechanical', 'Civil', 'Electrical', 'Electronics', 'Science', 'Commerce', 'Arts', 'Administration', 'Other']
const YEARS = ['1st Year', '2nd Year', '3rd Year', '4th Year', 'Postgraduate']

export default function Profile() {
  const { user, profile, refreshProfile, isAdmin, logout } = useAuth()
  const [f, setF] = useState({ name: '', userType: 'student', department: '', year: '' })
  const [stats, setStats] = useState(null)
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState(null)
  const set = k => e => setF({ ...f, [k]: e.target.value })

  useEffect(() => { if (profile) setF({ name: profile.name || '', userType: profile.userType || 'student', department: profile.department || '', year: profile.year || '' }) }, [profile])

  useEffect(() => { (async () => {
    const n = async (col, field) => (await getDocs(query(collection(db, col), where(field, '==', user.uid)))).docs.map(d => d.data())
    const [items, sent, recv] = await Promise.all([n('items', 'ownerId'), n('requests', 'requesterId'), n('requests', 'ownerId')])
    setStats({ listings: items.length, requests: sent.length, completed: [...sent, ...recv].filter(r => r.status === 'completed').length })
  })() }, [])

  useEffect(() => {
    if (!msg) return
    const ms = msg.ok ? 5000 : 8000
    const t = setTimeout(() => setMsg(null), ms)
    return () => clearTimeout(t)
  }, [msg])

  const save = async e => {
    e.preventDefault(); setBusy(true); setMsg(null)
    try {
      const data = { name: f.name.trim(), userType: f.userType, department: f.department, year: f.userType === 'student' ? f.year : '' }
      await updateDoc(doc(db, 'users', user.uid), data)
      await updateProfile(auth.currentUser, { displayName: data.name })
      await refreshProfile?.()
      setMsg({ ok: true, text: 'Profile updated.' })
    } catch (err) { setMsg({ ok: false, text: 'Could not save: ' + err.message }) }
    setBusy(false)
  }

  const resetPw = async () => {
    try { await sendPasswordResetEmail(auth, user.email); setMsg({ ok: true, text: `Password reset email sent to ${user.email}. Check Spam too.` }) }
    catch { setMsg({ ok: false, text: 'Could not send the reset email.' }) }
  }

  if (!profile) return <p className="muted">Loading…</p>
  const letter = (profile.name || user.email).charAt(0).toUpperCase()
  return (
    <div className="form">
      <div className="profile-head">
        <span className="avatar lg" aria-hidden="true">{letter}</span>
        <div><h1>{profile.name}</h1>
          <span className="tag">{profile.userType}</span> {isAdmin && <span className="tag">admin</span>}</div>
      </div>

      {stats && <div className="mini">
        <div><b>{stats.listings}</b><span className="muted small">Listings</span></div>
        <div><b>{stats.requests}</b><span className="muted small">Requests</span></div>
        <div><b>{stats.completed}</b><span className="muted small">Completed</span></div>
      </div>}

      <div className="row" style={{ marginBottom: '1rem' }}>
        <Link className="btn outline small" to="/my-listings">📦 My Listings</Link>
        <Link className="btn outline small" to="/my-requests">📨 Requests</Link>
      </div>

      <ProfileCompleteness />

      {msg && (
        <div className={msg.ok ? 'ok-msg' : 'error'} role="status" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span>{msg.text}</span>
          <button type="button" aria-label="Dismiss message" onClick={() => setMsg(null)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', fontSize: '1.2rem', lineHeight: 1, padding: '0 0 0 10px', color: 'inherit' }}>&times;</button>
        </div>
      )}

      <form id="personal-details" className="card" onSubmit={save}>
        <h3 style={{ marginTop: 0 }}>Personal details</h3>
        <label>Full name<input required value={f.name} onChange={set('name')} /></label>
        <label>Email<input className="ro" value={user.email} readOnly /></label>
        <label>I am a<select value={f.userType} onChange={set('userType')}>
          <option value="student">Student</option><option value="faculty">Faculty</option><option value="staff">Staff</option></select></label>
        <div className="two">
          <label>Department<select value={f.department} onChange={set('department')}>
            <option value="">Select department</option>{DEPTS.map(d => <option key={d}>{d}</option>)}</select></label>
          {f.userType === 'student' &&
            <label>Year<select value={f.year} onChange={set('year')}>
              <option value="">Select year</option>{YEARS.map(y => <option key={y}>{y}</option>)}</select></label>}
        </div>
        <button className="btn" disabled={busy}>{busy ? 'Saving…' : 'Save changes'}</button>
      </form>

      <div className="card" style={{ marginTop: '1rem' }}>
        <h3 style={{ marginTop: 0 }}>Security</h3>
        <p className="muted small">We will email you a link to set a new password.</p>
        <button className="btn ghost" onClick={resetPw}>Change password</button>
      </div>

      {/* Logout lives here on phones and tablets; on desktop it is in the sidebar */}
      <button className="btn danger profile-logout" onClick={logout}>Logout</button>
    </div>
  )
}
