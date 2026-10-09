import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { collection, query, where, onSnapshot } from 'firebase/firestore'
import { db } from '../firebase'
import { useAuth } from '../AuthContext'
import '../toast.css'

const ICON = { new_request: '📨', handover: '🤝', otp: '🔐', completed: '✅', cancelled: '❌', item_available: '🔔', item_posted: '🆕' }
const DURATION = 4000

// One popup at a time. A new notification replaces the visible one at once and gets a fresh 4s timer.
// Nothing is deleted: history and the unread badge still come from the same Firestore notifications.
export default function NotificationToast() {
  const { user } = useAuth()
  const nav = useNavigate()
  const [current, setCurrent] = useState(null)
  const timer = useRef(null)

  const clearTimer = () => { if (timer.current) { clearTimeout(timer.current); timer.current = null } }
  const hide = () => { clearTimer(); setCurrent(null) }
  const show = n => { clearTimer(); setCurrent(n); timer.current = setTimeout(() => { timer.current = null; setCurrent(null) }, DURATION) }

  useEffect(() => {
    if (!user) return
    let first = true                       // first snapshot = existing notifications, no popup for them
    const unsub = onSnapshot(query(collection(db, 'notifications'), where('userId', '==', user.uid)), snap => {
      if (first) { first = false; return }
      const fresh = snap.docChanges().filter(c => c.type === 'added' && !c.doc.data().read)
        .map(c => ({ id: c.doc.id, ...c.doc.data() }))
        .sort((a, b) => (a.createdAt?.seconds ?? Infinity) - (b.createdAt?.seconds ?? Infinity))
      if (fresh.length) show(fresh[fresh.length - 1])   // latest wins, no queue
    }, () => {})
    return () => { unsub(); clearTimer(); setCurrent(null) }
  }, [user?.uid])

  if (!current) return null
  return (
    <div className="nt-wrap">
      <div key={current.id} className="nt" role="status" aria-live="polite" tabIndex={0}
        onClick={() => { hide(); nav('/notifications') }}
        onKeyDown={e => { if (e.key === 'Enter') { hide(); nav('/notifications') } }}>
        <span className="ico" aria-hidden="true">{ICON[current.type] || '🔔'}</span>
        <span><strong>{current.title}</strong><span className="msg">{current.message}</span></span>
        <button className="nt-x" aria-label="Close notification" onClick={e => { e.stopPropagation(); hide() }}>×</button>
      </div>
    </div>
  )
}
