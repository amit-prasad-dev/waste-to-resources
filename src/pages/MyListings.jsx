import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { collection, query, where, getDocs, deleteDoc, doc } from 'firebase/firestore'
import { db } from '../firebase'
import { useAuth } from '../AuthContext'

export default function MyListings() {
  const { user } = useAuth()
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)

  const load = async () => {
    const s = await getDocs(query(collection(db, 'items'), where('ownerId', '==', user.uid)))
    setItems(s.docs.map(d => ({ id: d.id, ...d.data() })).sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0)))
    setLoading(false)
  }
  useEffect(() => { load() }, [])

  const remove = async (id) => {
    if (!confirm('Delete this listing?')) return
    await deleteDoc(doc(db, 'items', id)); load()
  }

  return (
    <>
      <div className="page-head row" style={{ justifyContent: 'space-between' }}>
        <h1>My Listings</h1><Link className="btn" to="/post">+ Post Item</Link>
      </div>
      {loading ? <p className="muted">Loading…</p> : items.length === 0 ?
        <div className="card empty muted">You haven't posted anything yet.</div> :
        <div className="list">{items.map(it => (
          <div key={it.id} className="card">
            <div className="top"><div><strong>{it.title}</strong>
              <div className="tags"><span className="tag">{it.category}</span><span className="tag">{it.action}</span>
                <span className="tag">{it.condition}</span></div></div>
              <span className={'badge ' + it.status}>{it.status}</span></div>
            <div className="row">
              {it.status === 'available' && <Link className="btn outline small" to={'/edit/' + it.id}>Edit</Link>}
              <button className="btn ghost small" onClick={() => remove(it.id)}>Delete</button>
            </div>
          </div>))}</div>}
    </>
  )
}
