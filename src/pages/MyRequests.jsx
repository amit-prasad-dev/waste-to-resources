import { useEffect, useState } from 'react'
import { collection, query, where, getDocs, updateDoc, doc } from 'firebase/firestore'
import { db } from '../firebase'
import { useAuth } from '../AuthContext'

export default function MyRequests() {
  const { user } = useAuth()
  const [tab, setTab] = useState('sent')
  const [sent, setSent] = useState([])
  const [received, setReceived] = useState([])
  const [loading, setLoading] = useState(true)

  const load = async () => {
    const get = async (field) => (await getDocs(query(collection(db, 'requests'), where(field, '==', user.uid))))
      .docs.map(d => ({ id: d.id, ...d.data() })).sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0))
    const [s, r] = await Promise.all([get('requesterId'), get('ownerId')])
    setSent(s); setReceived(r); setLoading(false)
  }
  useEffect(() => { load() }, [])

  // status = new request status, itemStatus = optional new item status (owner only)
  const change = async (r, status, itemStatus) => {
    await updateDoc(doc(db, 'requests', r.id), { status })
    if (itemStatus) await updateDoc(doc(db, 'items', r.itemId), { status: itemStatus })
    load()
  }

  const date = r => r.createdAt?.toDate().toLocaleDateString() || ''
  const list = tab === 'sent' ? sent : received

  return (
    <>
      <div className="page-head"><h1>Requests</h1></div>
      <div className="tabs">
        <button className={tab === 'sent' ? 'on' : ''} onClick={() => setTab('sent')}>My Requests ({sent.length})</button>
        <button className={tab === 'received' ? 'on' : ''} onClick={() => setTab('received')}>Received ({received.length})</button>
      </div>
      {loading ? <p className="muted">Loading…</p> : list.length === 0 ?
        <div className="card empty muted">Nothing here yet.</div> :
        <div className="list">{list.map(r => (
          <div key={r.id} className="card">
            <div className="top">
              <div><strong>{r.itemTitle}</strong>
                <div className="muted small">{tab === 'sent' ? 'Requested' : 'By ' + r.requesterName} · {date(r)}</div></div>
              <span className={'badge ' + r.status}>{r.status}</span>
            </div>
            <div className="row" style={{ marginTop: '.7rem' }}>
              {tab === 'sent' && r.status === 'pending' &&
                <button className="btn ghost small" onClick={() => change(r, 'cancelled')}>Cancel</button>}
              {tab === 'received' && r.status === 'pending' && <>
                <button className="btn small" onClick={() => change(r, 'accepted', 'reserved')}>Accept</button>
                <button className="btn danger small" onClick={() => change(r, 'rejected')}>Reject</button></>}
              {tab === 'received' && r.status === 'accepted' &&
                <button className="btn small" onClick={() => change(r, 'handover')}>Mark Handover</button>}
              {tab === 'received' && r.status === 'handover' &&
                <button className="btn small" onClick={() => change(r, 'completed', 'completed')}>Mark Completed</button>}
            </div>
          </div>))}</div>}
    </>
  )
}
