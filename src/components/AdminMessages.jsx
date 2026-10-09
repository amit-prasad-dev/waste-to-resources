import { useEffect, useRef, useState } from 'react'
import { collection, getDocs, doc, writeBatch, serverTimestamp } from 'firebase/firestore'
import { db } from '../firebase'
import { useAuth } from '../AuthContext'
import { newNotifRef, notifData } from '../notify'
import '../admin-messages.css'

const MAX_TITLE = 80, MAX_MSG = 500, CHUNK = 400
const sortNew = (a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0)

// Admin tab: send a personal message to one user, or an important update to everyone.
// Messages arrive as normal notifications (bell, unread count, popup, history).
export default function AdminMessages() {
  const { user } = useAuth()
  const [audience, setAudience] = useState('one')           // 'one' | 'all'
  const [users, setUsers] = useState([])
  const [history, setHistory] = useState([])
  const [search, setSearch] = useState('')
  const [toId, setToId] = useState('')
  const [title, setTitle] = useState('')
  const [text, setText] = useState('')
  const [important, setImportant] = useState(false)
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState(null)
  const timer = useRef(null)

  const load = async () => {
    const [u, h] = await Promise.all([getDocs(collection(db, 'users')), getDocs(collection(db, 'adminMessages'))])
    setUsers(u.docs.map(d => ({ id: d.id, ...d.data() })).sort((a, b) => (a.name || '').localeCompare(b.name || '')))
    setHistory(h.docs.map(d => ({ id: d.id, ...d.data() })).sort(sortNew).slice(0, 20))
  }
  useEffect(() => { load().catch(() => {}) }, [])
  useEffect(() => () => clearTimeout(timer.current), [])

  const say = (m, ms) => { clearTimeout(timer.current); setMsg(m); timer.current = setTimeout(() => setMsg(null), ms) }

  const recipients = audience === 'all' ? users.filter(u => u.id !== user.uid && !u.disabled) : users.filter(u => u.id === toId)
  const shown = users.filter(u => u.id !== user.uid &&
    (!search || ((u.name || '') + ' ' + (u.email || '')).toLowerCase().includes(search.toLowerCase())))

  const send = async () => {
    if (!title.trim() || !text.trim()) return say({ ok: false, text: 'Please enter a title and a message.' }, 8000)
    if (!recipients.length) return say({ ok: false, text: audience === 'one' ? 'Please choose a user.' : 'There are no users to send to.' }, 8000)
    if (audience === 'all' && !confirm(`Send this to ${recipients.length} users?`)) return
    setBusy(true)
    try {
      const type = audience === 'all' ? 'announcement' : 'admin_message'
      const fullTitle = (important ? 'Important: ' : '') + title.trim()
      for (let i = 0; i < recipients.length; i += CHUNK) {
        const b = writeBatch(db)
        recipients.slice(i, i + CHUNK).forEach(r => {
          b.set(newNotifRef(), { ...notifData(user.uid, r.id, type, fullTitle, text.trim(), '/notifications'), important })
        })
        if (i === 0) b.set(doc(collection(db, 'adminMessages')), { audience, toUserId: audience === 'one' ? toId : '',
          toName: audience === 'one' ? (recipients[0].name || recipients[0].email) : 'Everyone', title: fullTitle, message: text.trim(),
          important, recipients: recipients.length, sentBy: user.uid, createdAt: serverTimestamp() })
        await b.commit()
      }
      setTitle(''); setText(''); setImportant(false)
      say({ ok: true, text: `Sent to ${recipients.length} ${recipients.length === 1 ? 'user' : 'users'}.` }, 5000)
      load().catch(() => {})
    } catch (e) { say({ ok: false, text: 'Could not send: ' + e.message }, 8000) }
    setBusy(false)
  }

  return (
    <>
      <div className="card">
        <h3 style={{ marginTop: 0 }}>Send a message</h3>
        <div className="tabs" role="tablist">
          <button type="button" role="tab" aria-selected={audience === 'one'} className={audience === 'one' ? 'on' : ''} onClick={() => setAudience('one')}>One user</button>
          <button type="button" role="tab" aria-selected={audience === 'all'} className={audience === 'all' ? 'on' : ''} onClick={() => setAudience('all')}>Everyone</button>
        </div>

        {msg && <div className={msg.ok ? 'am-ok' : 'error'} role="status"><span>{msg.text}</span>
          <button type="button" aria-label="Dismiss message" onClick={() => { clearTimeout(timer.current); setMsg(null) }}>×</button></div>}

        {audience === 'one' ? <>
          <label>Find user<input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search name or email" /></label>
          <label>Send to<select value={toId} onChange={e => setToId(e.target.value)}>
            <option value="">Select a user ({shown.length})</option>
            {shown.map(u => <option key={u.id} value={u.id}>{u.name || 'No name'} · {u.email}</option>)}</select></label>
        </> : <p className="muted small">This goes to all {recipients.length} active users (disabled users and you are skipped).</p>}

        <label>Title<input value={title} maxLength={MAX_TITLE} onChange={e => setTitle(e.target.value)} placeholder="e.g. Campus recycling drive on Friday" />
          <div className="am-count">{title.length}/{MAX_TITLE}</div></label>
        <label>Message<textarea rows="4" value={text} maxLength={MAX_MSG} onChange={e => setText(e.target.value)} placeholder="Write your message…" />
          <div className="am-count">{text.length}/{MAX_MSG}</div></label>
        <label className="am-check"><input type="checkbox" checked={important} onChange={e => setImportant(e.target.checked)} /> Mark as important</label>
        <button type="button" className="btn" style={{ marginTop: '.8rem' }} disabled={busy} onClick={send}>
          {busy ? 'Sending…' : audience === 'all' ? 'Send to everyone' : 'Send message'}</button>
      </div>

      <h3 style={{ marginTop: '1.4rem' }}>Sent messages</h3>
      {history.length === 0 ? <div className="card empty muted">Nothing sent yet.</div> :
        <div className="am-hist">{history.map(h => (
          <div key={h.id} className="item-row">
            <strong>{h.title}</strong>
            <div className="muted small">{h.message}</div>
            <small>To {h.toName} · {h.recipients} recipient{h.recipients === 1 ? '' : 's'} · {h.createdAt?.toDate().toLocaleString()}</small>
          </div>))}</div>}
    </>
  )
}
