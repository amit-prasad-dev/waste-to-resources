import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { collection, query, where, onSnapshot, updateDoc, doc, writeBatch } from 'firebase/firestore'
import { db } from '../firebase'
import { useAuth } from '../AuthContext'
import '../notif.css'

const ICON = { new_request: '📨', handover: '🤝', otp: '🔐', completed: '✅', cancelled: '❌', item_available: '🔔', item_posted: '🆕' }

export default function Notifications() {
  const { user } = useAuth()
  const nav = useNavigate()
  const [list, setList] = useState(null)

  useEffect(() => onSnapshot(query(collection(db, 'notifications'), where('userId', '==', user.uid)),
    s => setList(s.docs.map(d => ({ id: d.id, ...d.data() })).sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0))),
    () => setList([])), [])

  const open = async n => {
    if (!n.read) await updateDoc(doc(db, 'notifications', n.id), { read: true })
    if (n.link) nav(n.link)
  }
  const readAll = async () => {
    const b = writeBatch(db)
    list.filter(n => !n.read).forEach(n => b.update(doc(db, 'notifications', n.id), { read: true }))
    await b.commit()
  }
  const unread = list?.filter(n => !n.read).length || 0

  return (
    <>
      <div className="page-head row" style={{ justifyContent: 'space-between', alignItems: 'center' }}>
        <div><h1>Notifications</h1><p className="muted">{unread ? `${unread} unread` : 'You are all caught up.'}</p></div>
        {unread > 0 && <button className="btn ghost small" onClick={readAll}>Mark all as read</button>}
      </div>
      {!list ? <p className="muted">Loading…</p> : list.length === 0 ?
        <div className="card empty muted">No notifications yet.</div> :
        <div className="list">{list.map(n => (
          <button key={n.id} className={'notif' + (n.read ? '' : ' unread')} onClick={() => open(n)}>
            <span className="ico" aria-hidden="true">{ICON[n.type] || '🔔'}</span>
            <span><strong>{n.title}</strong><span className="muted small">{n.message}</span>
              <span className="muted small" style={{ display: 'block' }}>{n.createdAt?.toDate().toLocaleString()}</span></span>
          </button>))}</div>}
    </>
  )
}
