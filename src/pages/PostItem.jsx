import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { addDoc, collection, doc, getDoc, updateDoc, serverTimestamp } from 'firebase/firestore'
import { db } from '../firebase'
import { useAuth } from '../AuthContext'
import { CATEGORIES, CONDITIONS, ACTIONS } from '../constants'

export default function PostItem() {
  const { id } = useParams()            // present when editing
  const { user, profile } = useAuth()
  const nav = useNavigate()
  const [f, setF] = useState({ title: '', category: 'Books', description: '', quantity: 1,
    condition: 'Good', location: '', action: 'Donate' })
  const [loading, setLoading] = useState(!!id)
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')
  const set = k => e => setF({ ...f, [k]: e.target.value })

  useEffect(() => {
    if (!id) return
    getDoc(doc(db, 'items', id)).then(s => {
      if (!s.exists() || s.data().ownerId !== user.uid || s.data().status !== 'available') return nav('/my-listings')
      const d = s.data()
      setF({ title: d.title, category: d.category, description: d.description || '', quantity: d.quantity,
        condition: d.condition, location: d.location, action: d.action })
      setLoading(false)
    })
  }, [id])

  const submit = async (e) => {
    e.preventDefault(); setBusy(true); setErr('')
    try {
      const data = { ...f, quantity: Number(f.quantity) }
      if (id) await updateDoc(doc(db, 'items', id), data)
      else await addDoc(collection(db, 'items'), { ...data, ownerId: user.uid,
        ownerName: profile?.name || user.email, status: 'available', createdAt: serverTimestamp() })
      nav('/my-listings')
    } catch (e) { setErr(e.message); setBusy(false) }
  }

  if (loading) return <p className="muted">Loading…</p>
  return (
    <div className="form">
      <div className="page-head"><h1>{id ? 'Edit Item' : 'Post Item'}</h1>
        <p className="muted">{id ? 'Update your listing details.' : 'List something you no longer need.'}</p></div>
      <form className="card" onSubmit={submit}>
        <label>Item name<input required value={f.title} onChange={set('title')} placeholder="Physics Textbook" /></label>
        <div className="two">
          <label>Category<select value={f.category} onChange={set('category')}>{CATEGORIES.map(c => <option key={c}>{c}</option>)}</select></label>
          <label>Action<select value={f.action} onChange={set('action')}>{ACTIONS.map(c => <option key={c}>{c}</option>)}</select></label>
          <label>Condition<select value={f.condition} onChange={set('condition')}>{CONDITIONS.map(c => <option key={c}>{c}</option>)}</select></label>
          <label>Quantity<input type="number" min="1" required value={f.quantity} onChange={set('quantity')} /></label>
        </div>
        <label>Description<textarea rows="3" value={f.description} onChange={set('description')} placeholder="B.Sc. Physics textbook" /></label>
        <label>Pickup location<input required value={f.location} onChange={set('location')} placeholder="Library, 2nd floor" /></label>
        {err && <div className="error">{err}</div>}
        <div className="row">
          <button className="btn" disabled={busy}>{busy ? 'Saving…' : id ? 'Save Changes' : 'Post Item'}</button>
          {id && <button type="button" className="btn ghost" onClick={() => nav('/my-listings')}>Cancel</button>}
        </div>
      </form>
    </div>
  )
}
