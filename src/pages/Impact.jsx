import { useEffect, useState } from 'react'
import { collection, getDocs } from 'firebase/firestore'
import { db } from '../firebase'
import { impact } from '../impact'

export default function Impact() {
  const [m, setM] = useState(null)
  useEffect(() => { (async () => {
    const s = await getDocs(collection(db, 'items'))
    setM(impact(s.docs.map(d => d.data())))
  })() }, [])
  if (!m) return <p className="muted">Loading…</p>
  const kpis = [['Total Listings', m.total], ['Available Now', m.available], ['Resources Reused', m.reused],
    ['Items Donated', m.donated], ['Successful Exchanges', m.exchanged], ['Items Recycled', m.recycled]]
  const max = Math.max(1, ...Object.values(m.byCat))
  return (
    <>
      <div className="page-head"><h1>Impact Dashboard 🌱</h1><p className="muted">What our campus has saved from the bin.</p></div>
      <div className="card hero-kpi"><div className="num">{m.kg} kg</div><div>Estimated waste diverted</div></div>
      <div className="kpis">{kpis.map(([l, v]) => <div key={l} className="card kpi"><div className="num">{v}</div><div className="muted">{l}</div></div>)}</div>
      <div className="card"><h3>Waste diverted by category</h3>
        {Object.keys(m.byCat).length === 0 ? <p className="muted">Complete a transaction to see data here.</p> :
          <div className="bars">{Object.entries(m.byCat).sort((a, b) => b[1] - a[1]).map(([c, v]) => (
            <div key={c} className="bar-row"><span>{c}</span>
              <div className="bar-track"><div className="bar-fill" style={{ width: (v / max * 100) + '%' }} /></div>
              <span>{Math.round(v * 10) / 10} kg</span></div>))}</div>}
        <p className="muted small">Weights are estimates based on category, not exact measurements.</p>
      </div>
    </>
  )
}
