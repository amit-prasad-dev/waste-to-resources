import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { collection, query, where, getDocs } from 'firebase/firestore'
import { db } from '../firebase'
import { useAuth } from '../AuthContext'

export default function Dashboard() {
  const { profile, user } = useAuth()
  const [c, setC] = useState({ listings: 0, requests: 0, completed: 0 })
  const [activity, setActivity] = useState(null)

  useEffect(() => {
    (async () => {
      const n = async (col, field) => (await getDocs(query(collection(db, col), where(field, '==', user.uid)))).docs.map(d => d.data())
      const [items, sent, recv] = await Promise.all([n('items', 'ownerId'), n('requests', 'requesterId'), n('requests', 'ownerId')])
      setC({ listings: items.length, requests: sent.length,
        completed: [...sent, ...recv].filter(r => r.status === 'completed').length })
      const ev = [
        ...items.map(i => ({ t: i.createdAt, text: `You posted “${i.title}”` })),
        ...sent.map(r => ({ t: r.createdAt, text: `You requested “${r.itemTitle}” (${r.status})` })),
        ...recv.map(r => ({ t: r.createdAt, text: `${r.requesterName} requested “${r.itemTitle}” (${r.status})` })),
      ].sort((a, b) => (b.t?.seconds || 0) - (a.t?.seconds || 0)).slice(0, 6)
      setActivity(ev)
    })()
  }, [])

  const stats = [
    { label: 'My Listings', value: c.listings }, { label: 'My Requests', value: c.requests },
    { label: 'Completed', value: c.completed }, { label: 'Impact (items)', value: c.completed },
  ]
  return (
    <>
      <h1>Welcome, {profile?.name || user?.displayName} 👋</h1>
      <p className="muted">Give unused items a second life.</p>
      <div className="grid stats">
        {stats.map(s => (
          <div key={s.label} className="card stat">
            <div className="num">{s.value}</div><div className="muted">{s.label}</div>
          </div>
        ))}
      </div>
      <h3>Quick actions</h3>
      <div className="row">
        <Link className="btn" to="/post">Post Item</Link>
        <Link className="btn outline" to="/browse">Browse Resources</Link>
        <Link className="btn outline" to="/my-listings">My Listings</Link>
        <Link className="btn outline" to="/my-requests">My Requests</Link>
      </div>
      <h3 style={{ marginTop: '1.6rem' }}>Recent activity</h3>
      <div className="card">
        {!activity ? <p className="muted">Loading…</p> : activity.length === 0 ?
          <p className="muted">No activity yet. Post an item or browse resources to get started.</p> :
          <ul style={{ margin: 0, paddingLeft: '1.1rem', display: 'grid', gap: '.5rem' }}>
            {activity.map((a, i) => <li key={i}>{a.text} <span className="muted small">· {a.t?.toDate().toLocaleDateString()}</span></li>)}
          </ul>}
      </div>
    </>
  )
}
