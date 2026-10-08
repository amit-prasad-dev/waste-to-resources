import { useEffect, useState } from 'react'
import { collection, query, where, getDocs, addDoc, doc, runTransaction, serverTimestamp } from 'firebase/firestore'
import { db } from '../firebase'
import { useAuth } from '../AuthContext'
import { CATEGORIES, CONDITIONS, ACTIONS } from '../constants'
import { newNotifRef, notifData } from '../notify'

export default function Browse() {
  const { user, profile } = useAuth()
  const [items, setItems] = useState([])
  const [active, setActive] = useState(new Set())     // items I already hold a unit of
  const [watching, setWatching] = useState(new Set()) // items I pressed "Notify me" on
  const [loading, setLoading] = useState(true)
  const [busyId, setBusyId] = useState('')
  const [msg, setMsg] = useState(null)
  const [f, setF] = useState({ q: '', category: '', condition: '', action: '', location: '' })
  const set = k => e => setF({ ...f, [k]: e.target.value })

  const load = async () => {
    const [i, r, w] = await Promise.all([
      getDocs(query(collection(db, 'items'), where('status', 'in', ['available', 'reserved']))),
      getDocs(query(collection(db, 'requests'), where('requesterId', '==', user.uid))),
      getDocs(query(collection(db, 'watches'), where('userId', '==', user.uid))),
    ])
    setItems(i.docs.map(d => ({ id: d.id, ...d.data() })).sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0)))
    setActive(new Set(r.docs.map(d => d.data()).filter(x => ['accepted', 'handover'].includes(x.status)).map(x => x.itemId)))
    setWatching(new Set(w.docs.map(d => d.data().itemId)))
    setLoading(false)
  }
  useEffect(() => { load() }, [])

  // FIFO: the transaction hands out units in the order requests arrive.
  const request = async (it) => {
    setMsg(null); setBusyId(it.id)
    try {
      const itemRef = doc(db, 'items', it.id)
      await runTransaction(db, async (tx) => {
        const s = await tx.get(itemRef)
        if (!s.exists()) throw new Error('GONE')
        const d = s.data(), rem = d.remaining ?? d.quantity
        if (d.status === 'completed' || rem <= 0) throw new Error('SOLD_OUT')
        tx.update(itemRef, { remaining: rem - 1, status: rem - 1 === 0 ? 'reserved' : 'available' })
        tx.set(doc(collection(db, 'requests')), { itemId: it.id, itemTitle: d.title, category: d.category, ownerId: d.ownerId,
          requesterId: user.uid, requesterName: profile?.name || user.email, status: 'accepted', createdAt: serverTimestamp() })
        tx.set(newNotifRef(), notifData(user.uid, d.ownerId, 'new_request', 'New request',
          `${profile?.name || user.email} requested “${d.title}”. Unit reserved for them.`))
      })
      setMsg({ ok: true, text: `Reserved! “${it.title}” is yours. Meet the owner and share the OTP shown in Requests.` })
    } catch (e) {
      setMsg({ ok: false, text: e.message === 'SOLD_OUT' || e.message === 'GONE'
        ? `Sorry, all units of “${it.title}” were taken before your request. Tap “Notify me” to hear when one is available.`
        : 'Could not send request: ' + e.message })
    }
    setBusyId(''); load()
  }

  const notifyMe = async (it) => {
    await addDoc(collection(db, 'watches'), { userId: user.uid, itemId: it.id, itemTitle: it.title, category: it.category,
      titleKey: it.title.toLowerCase(), createdAt: serverTimestamp() })
    setWatching(new Set([...watching, it.id]))
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
    (!f.action || it.action === f.action) && (!f.location || it.location.toLowerCase().includes(f.location.toLowerCase())))

  const sel = (k, label, opts) => (
    <select aria-label={label} value={f[k]} onChange={set(k)}><option value="">{label}</option>{opts.map(o => <option key={o}>{o}</option>)}</select>)

  return (
    <>
      <div className="page-head"><h1>Browse Resources</h1><p className="muted">Find something useful from your campus. First come, first served.</p></div>
      <div className="filters">
        <input className="search" aria-label="Search" placeholder="Search e.g. physics" value={f.q} onChange={set('q')} />
        {sel('category', 'Category', CATEGORIES)}{sel('condition', 'Condition', CONDITIONS)}{sel('action', 'Action', ACTIONS)}
        <input aria-label="Location" placeholder="Location" value={f.location} onChange={set('location')} />
      </div>
      {msg && <div className={msg.ok ? 'ok' : 'error'} role="status" style={{ marginBottom: '1rem' }}>{msg.text}</div>}
      {loading ? <p className="muted">Loading…</p> : shown.length === 0 ?
        <div className="card empty muted">No items found.</div> :
        <div className="items">{shown.map(it => {
          const rem = it.remaining ?? it.quantity, out = rem <= 0
          return (
            <div key={it.id} className="card item">
              <span className={'badge ' + (out ? 'reserved' : 'available')}>{out ? 'Out of stock' : it.action}</span>
              <h3>{it.title}</h3>
              <p className="muted small">{it.description}</p>
              <div className="tags"><span className="tag">{it.category}</span><span className="tag">{it.condition}</span>
                <span className="tag">{rem} of {it.quantity} left</span>{out && <span className="tag">{it.action}</span>}</div>
              <p className="small">📍 {it.location}<br />👤 {it.ownerName}</p>
              {it.ownerId === user.uid ? <span className="muted small">Your item</span> :
                active.has(it.id) ? <button className="btn ghost" disabled>Reserved by you</button> :
                out ? (watching.has(it.id) ? <button className="btn ghost" disabled>✓ We'll notify you</button> :
                  <button className="btn outline" onClick={() => notifyMe(it)}>🔔 Notify me</button>) :
                <button className="btn" disabled={busyId === it.id} onClick={() => request(it)}>{busyId === it.id ? 'Requesting…' : 'Request Resource'}</button>}
              {it.ownerId !== user.uid && <button className="link small" onClick={() => report(it)}> 🚩 Report</button>}
            </div>)})}</div>}
    </>
  )
}
