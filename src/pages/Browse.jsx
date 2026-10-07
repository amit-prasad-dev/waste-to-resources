import { useEffect, useState } from 'react'
import { collection, query, where, getDocs, addDoc, serverTimestamp } from 'firebase/firestore'
import { db } from '../firebase'
import { useAuth } from '../AuthContext'
import { CATEGORIES, CONDITIONS, ACTIONS } from '../constants'

export default function Browse() {
  const { user, profile } = useAuth()
  const [items, setItems] = useState([])
  const [requested, setRequested] = useState(new Set())
  const [loading, setLoading] = useState(true)
  const [f, setF] = useState({ q: '', category: '', condition: '', action: '', location: '' })
  const set = k => e => setF({ ...f, [k]: e.target.value })

  const load = async () => {
    const [i, r] = await Promise.all([
      getDocs(query(collection(db, 'items'), where('status', '==', 'available'))),
      getDocs(query(collection(db, 'requests'), where('requesterId', '==', user.uid))),
    ])
    setItems(i.docs.map(d => ({ id: d.id, ...d.data() })).sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0)))
    setRequested(new Set(r.docs.map(d => d.data()).filter(x => ['pending', 'accepted', 'handover'].includes(x.status)).map(x => x.itemId)))
    setLoading(false)
  }
  useEffect(() => { load() }, [])

  const request = async (it) => {
    await addDoc(collection(db, 'requests'), {
      itemId: it.id, itemTitle: it.title, category: it.category, ownerId: it.ownerId,
      requesterId: user.uid, requesterName: profile?.name || user.email,
      status: 'pending', createdAt: serverTimestamp(),
    })
    setRequested(new Set([...requested, it.id]))
  }

  const report = async (it) => {
    const reason = prompt('Why are you reporting this listing?')
    if (!reason) return
    await addDoc(collection(db, 'reports'), { itemId: it.id, itemTitle: it.title, reporterId: user.uid,
      reporterName: profile?.name || user.email, reason, createdAt: serverTimestamp() })
    alert('Thanks, the admin will review it.')
  }

  const shown = items.filter(it =>
    (!f.q || (it.title + ' ' + (it.description || '')).toLowerCase().includes(f.q.toLowerCase())) &&
    (!f.category || it.category === f.category) && (!f.condition || it.condition === f.condition) &&
    (!f.action || it.action === f.action) &&
    (!f.location || it.location.toLowerCase().includes(f.location.toLowerCase())))

  const sel = (k, label, opts) => (
    <select value={f[k]} onChange={set(k)}><option value="">{label}</option>{opts.map(o => <option key={o}>{o}</option>)}</select>)

  return (
    <>
      <div className="page-head"><h1>Browse Resources</h1><p className="muted">Find something useful from your campus.</p></div>
      <div className="filters">
        <input className="search" placeholder="Search e.g. physics" value={f.q} onChange={set('q')} />
        {sel('category', 'Category', CATEGORIES)}{sel('condition', 'Condition', CONDITIONS)}{sel('action', 'Action', ACTIONS)}
        <input placeholder="Location" value={f.location} onChange={set('location')} />
      </div>
      {loading ? <p className="muted">Loading…</p> : shown.length === 0 ?
        <div className="card empty muted">No items found.</div> :
        <div className="items">{shown.map(it => (
          <div key={it.id} className="card item">
            <span className="badge available">{it.action}</span>
            <h3>{it.title}</h3>
            <p className="muted small">{it.description}</p>
            <div className="tags"><span className="tag">{it.category}</span><span className="tag">{it.condition}</span>
              <span className="tag">Qty {it.quantity}</span></div>
            <p className="small">📍 {it.location}<br />👤 {it.ownerName}</p>
            {it.ownerId === user.uid ? <span className="muted small">Your item</span> :
              requested.has(it.id) ? <button className="btn ghost" disabled>Requested</button> :
              <button className="btn" onClick={() => request(it)}>Request Resource</button>}
            {it.ownerId !== user.uid && <button className="link small" onClick={() => report(it)}> 🚩 Report</button>}
          </div>))}</div>}
    </>
  )
}
