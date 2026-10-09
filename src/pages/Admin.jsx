import { useEffect, useState } from 'react'
import { collection, getDocs, deleteDoc, updateDoc, doc } from 'firebase/firestore'
import { db } from '../firebase'
import { useAuth } from '../AuthContext'
import { impact } from '../impact'
import AdminMessages from '../components/AdminMessages'

export default function Admin() {
  const { user } = useAuth()
  const [tab, setTab] = useState('overview')
  const [d, setD] = useState(null)

  const load = async () => {
    const g = async n => (await getDocs(collection(db, n))).docs.map(x => ({ id: x.id, ...x.data() }))
    const [users, items, requests, reports] = await Promise.all([g('users'), g('items'), g('requests'), g('reports')])
    setD({ users, items, requests, reports })
  }
  useEffect(() => { load() }, [])
  if (!d) return <p className="muted">Loading…</p>

  const m = impact(d.items)
  const toggleUser = async u => { await updateDoc(doc(db, 'users', u.id), { disabled: !u.disabled }); load() }
  const delItem = async id => { if (confirm('Remove this listing?')) { await deleteDoc(doc(db, 'items', id)); load() } }
  const delReport = async id => { await deleteDoc(doc(db, 'reports', id)); load() }
  const removeFromReport = async r => { await deleteDoc(doc(db, 'items', r.itemId)); await deleteDoc(doc(db, 'reports', r.id)); load() }

  const kpis = [['Total Users', d.users.length], ['Total Listings', d.items.length], ['Active Listings', m.available],
    ['Active Requests', d.requests.filter(r => r.status === 'accepted' || r.status === 'handover').length],
    ['Completed', d.requests.filter(r => r.status === 'completed').length],
    ['Open Reports', d.reports.length], ['Waste Diverted', m.kg + ' kg'], ['Items Recycled', m.recycled]]
  const tabs = [['overview', 'Overview'], ['users', 'Users'], ['listings', 'Listings'], ['requests', 'Requests'], ['reports', `Reports (${d.reports.length})`], ['messages', 'Messages']]
  const Tbl = ({ head, children }) => <div className="card tbl"><table><thead><tr>{head.map(h => <th key={h}>{h}</th>)}</tr></thead><tbody>{children}</tbody></table></div>

  return (
    <>
      <div className="page-head"><h1>Admin Panel 🛡️</h1></div>
      <div className="tabs scroll">{tabs.map(([k, l]) => <button key={k} className={tab === k ? 'on' : ''} onClick={() => setTab(k)}>{l}</button>)}</div>

      {tab === 'overview' && <div className="kpis">{kpis.map(([l, v]) => <div key={l} className="card kpi"><div className="num">{v}</div><div className="muted">{l}</div></div>)}</div>}

      {tab === 'users' && <Tbl head={['Name', 'Email', 'Type', 'Role', 'Status', '']}>
        {d.users.map(u => <tr key={u.id}><td>{u.name}</td><td>{u.email}</td><td>{u.userType}</td><td>{u.role}</td>
          <td><span className={'badge ' + (u.disabled ? 'rejected' : 'accepted')}>{u.disabled ? 'disabled' : 'active'}</span></td>
          <td>{u.id !== user.uid && u.role !== 'admin' &&
            <button className="btn ghost small" onClick={() => toggleUser(u)}>{u.disabled ? 'Enable' : 'Disable'}</button>}</td></tr>)}</Tbl>}

      {tab === 'listings' && <Tbl head={['Item', 'Category', 'Action', 'Owner', 'Status', '']}>
        {d.items.map(i => <tr key={i.id}><td>{i.title}</td><td>{i.category}</td><td>{i.action}</td><td>{i.ownerName}</td>
          <td><span className={'badge ' + i.status}>{i.status}</span></td>
          <td><button className="btn danger small" onClick={() => delItem(i.id)}>Remove</button></td></tr>)}</Tbl>}

      {tab === 'requests' && <Tbl head={['Item', 'Requested by', 'Status']}>
        {d.requests.map(r => <tr key={r.id}><td>{r.itemTitle}</td><td>{r.requesterName}</td>
          <td><span className={'badge ' + r.status}>{r.status}</span></td></tr>)}</Tbl>}

      {tab === 'reports' && (d.reports.length === 0 ? <div className="card empty muted">No reports. 🎉</div> :
        <div className="list">{d.reports.map(r => <div key={r.id} className="card">
          <strong>{r.itemTitle}</strong>
          <p className="muted small">Reported by {r.reporterName}: {r.reason}</p>
          <div className="row"><button className="btn danger small" onClick={() => removeFromReport(r)}>Remove listing</button>
            <button className="btn ghost small" onClick={() => delReport(r.id)}>Dismiss</button></div></div>)}</div>)}

      {tab === 'messages' && <AdminMessages />}
    </>
  )
}
