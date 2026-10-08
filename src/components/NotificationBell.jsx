import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { collection, query, where, onSnapshot } from 'firebase/firestore'
import { db } from '../firebase'
import { useAuth } from '../AuthContext'
import '../notif.css'

export default function NotificationBell() {
  const { user } = useAuth()
  const [count, setCount] = useState(0)
  useEffect(() => {
    if (!user) return
    return onSnapshot(query(collection(db, 'notifications'), where('userId', '==', user.uid)),
      s => setCount(s.docs.filter(d => !d.data().read).length), () => {})
  }, [user])
  return (
    <Link to="/notifications" className="bell" aria-label={`Notifications${count ? `, ${count} unread` : ''}`}>
      <span aria-hidden="true">🔔</span>
      {count > 0 && <span className="bell-count">{count > 9 ? '9+' : count}</span>}
    </Link>
  )
}
