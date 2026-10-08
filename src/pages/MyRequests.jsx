import { useEffect, useRef, useState } from 'react'
import { collection, query, where, onSnapshot, doc, getDoc, setDoc, deleteDoc, updateDoc, writeBatch, runTransaction,
  increment, Timestamp } from 'firebase/firestore'
import { db } from '../firebase'
import { useAuth } from '../AuthContext'
import { newNotifRef, notifData, notifyWatchersFreed } from '../notify'
import '../notif.css'

const sortNew = (a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0)
const genCode = () => { const a = new Uint32Array(1); crypto.getRandomValues(a); return String(100000 + (a[0] % 900000)) }

export default function MyRequests() {
  const { user, profile } = useAuth()
  const [tab, setTab] = useState('sent')
  const [sent, setSent] = useState(null)
  const [received, setReceived] = useState(null)
  const [otps, setOtps] = useState({})
  const [otpIn, setOtpIn] = useState({})
  const [note, setNote] = useState({})
  const [busy, setBusy] = useState('')
  const creating = useRef(new Set())
  const me = profile?.name || user.email

  useEffect(() => {
    const sub = (field, set) => onSnapshot(query(collection(db, 'requests'), where(field, '==', user.uid)),
      s => set(s.docs.map(d => ({ id: d.id, ...d.data() })).sort(sortNew)), () => set([]))
    const a = sub('requesterId', setSent), b = sub('ownerId', setReceived)
    return () => { a(); b() }
  }, [])

  // Receiver's device creates the OTP once the owner starts the handover
  const makeOtp = async (r, replace) => {
    const ref = doc(db, 'otps', r.id)
    if (replace) await deleteDoc(ref).catch(() => {})
    await setDoc(ref, { code: genCode(), requesterId: user.uid, ownerId: r.ownerId, attempts: 0,
      expiresAt: Timestamp.fromMillis(Date.now() + 30 * 60000) })
    const s = await getDoc(ref); setOtps(o => ({ ...o, [r.id]: s.data() }))
  }
  useEffect(() => {
    (sent || []).filter(r => r.status === 'handover').forEach(async r => {
      if (otps[r.id] || creating.current.has(r.id)) return
      creating.current.add(r.id)
      try {
        const s = await getDoc(doc(db, 'otps', r.id))
        if (s.exists()) setOtps(o => ({ ...o, [r.id]: s.data() })); else await makeOtp(r, false)
      } catch (e) { creating.current.delete(r.id) }
    })
  }, [sent])

  const say = (id, text) => setNote(n => ({ ...n, [id]: text }))

  const startHandover = async (r) => {
    setBusy(r.id)
    const b = writeBatch(db)
    b.update(doc(db, 'requests', r.id), { status: 'handover' })
    b.set(newNotifRef(), notifData(user.uid, r.requesterId, 'otp', 'Handover started',
      `The owner is ready to hand over “${r.itemTitle}”. Open Requests to see your OTP and share it with the owner.`))
    await b.commit(); setBusy('')
  }

  const cancel = async (r) => {
    if (!confirm('Cancel this request? The unit will be released.')) return
    setBusy(r.id)
    try {
      const iref = doc(db, 'items', r.itemId)
      const other = user.uid === r.ownerId ? r.requesterId : r.ownerId
      await runTransaction(db, async (tx) => {
        const s = await tx.get(iref)
        tx.update(doc(db, 'requests', r.id), { status: 'cancelled' })
        if (s.exists()) {
          const d = s.data(), rem = d.remaining ?? d.quantity
          if (rem < d.quantity - (d.completedCount || 0)) tx.update(iref, { remaining: rem + 1, status: 'available' })
        }
        tx.set(newNotifRef(), notifData(user.uid, other, 'cancelled', 'Request cancelled',
          `The request for “${r.itemTitle}” was cancelled by ${me}.`))
      })
      notifyWatchersFreed({ id: r.itemId, title: r.itemTitle }, user.uid).catch(() => {})
    } catch (e) { say(r.id, 'Could not cancel: ' + e.message) }
    setBusy('')
  }

  const verify = async (r) => {
    const code = (otpIn[r.id] || '').trim()
    if (!/^\d{6}$/.test(code)) return say(r.id, 'Enter the 6-digit OTP.')
    setBusy(r.id); say(r.id, '')
    try { await updateDoc(doc(db, 'otps', r.id), { attempts: increment(1) }) }
    catch { setBusy(''); return say(r.id, 'OTP is not available. Ask the receiver to open Requests (or generate a new OTP), or too many attempts were made.') }
    try {
      const iref = doc(db, 'items', r.itemId)
      const is = await getDoc(iref), d = is.data() || {}
      const cc = (d.completedCount || 0) + 1
      const b = writeBatch(db)
      b.update(doc(db, 'requests', r.id), { status: 'completed', otpInput: code })
      b.update(iref, { completedCount: cc, ...(cc >= d.quantity ? { status: 'completed' } : {}) })
      b.set(newNotifRef(), notifData(user.uid, r.requesterId, 'completed', 'Handover completed',
        `You received “${r.itemTitle}”. Thank you for reusing!`))
      await b.commit()
    } catch { say(r.id, 'Wrong or expired OTP. Check the code on the receiver\'s screen and try again.') }
    setBusy('')
  }

  const list = tab === 'sent' ? sent : received
  const date = r => r.createdAt?.toDate().toLocaleDateString() || ''
  const fmt = t => t?.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })

  return (
    <>
      <div className="page-head"><h1>Requests</h1></div>
      <div className="tabs">
        <button className={tab === 'sent' ? 'on' : ''} onClick={() => setTab('sent')}>My Requests ({sent?.length || 0})</button>
        <button className={tab === 'received' ? 'on' : ''} onClick={() => setTab('received')}>Received ({received?.length || 0})</button>
      </div>
      {!list ? <p className="muted">Loading…</p> : list.length === 0 ? <div className="card empty muted">Nothing here yet.</div> :
        <div className="list">{list.map(r => {
          const o = otps[r.id], expired = o && o.expiresAt.toDate() < new Date()
          const live = ['accepted', 'handover'].includes(r.status)
          return (
            <div key={r.id} className="card">
              <div className="top">
                <div><strong>{r.itemTitle}</strong>
                  <div className="muted small">{tab === 'sent' ? 'Requested' : 'By ' + r.requesterName} · {date(r)}</div></div>
                <span className={'badge ' + r.status}>{r.status}</span>
              </div>

              {tab === 'sent' && r.status === 'accepted' && <p className="muted small">Unit reserved for you. Meet the owner; they will start the handover.</p>}
              {tab === 'sent' && r.status === 'handover' && (
                <div className="otp-box">
                  <div className="muted small">Your handover OTP. Tell it to the owner only after you receive the item.</div>
                  {o ? <><div className="otp-code" aria-label="OTP">{o.code}</div>
                    <div className="muted small">{expired ? 'Expired.' : 'Valid until ' + fmt(o.expiresAt)} · Attempts used: {o.attempts}/5</div>
                    {(expired || o.attempts >= 5) && <button className="btn small" onClick={() => makeOtp(r, true)}>Generate new OTP</button>}</>
                    : <div className="muted">Generating…</div>}
                </div>)}

              {tab === 'received' && r.status === 'handover' && (
                <div className="inline">
                  <input className="otp-input" inputMode="numeric" maxLength={6} placeholder="6-digit OTP" aria-label="OTP from receiver"
                    value={otpIn[r.id] || ''} onChange={e => setOtpIn({ ...otpIn, [r.id]: e.target.value.replace(/\D/g, '') })} />
                  <button className="btn small" disabled={busy === r.id} onClick={() => verify(r)}>Verify & Complete</button>
                </div>)}

              {note[r.id] && <div className="error" role="alert" style={{ marginTop: '.7rem' }}>{note[r.id]}</div>}

              <div className="row" style={{ marginTop: '.7rem' }}>
                {tab === 'received' && r.status === 'accepted' &&
                  <button className="btn small" disabled={busy === r.id} onClick={() => startHandover(r)}>Mark Handover</button>}
                {live && <button className="btn ghost small" disabled={busy === r.id} onClick={() => cancel(r)}>Cancel request</button>}
              </div>
            </div>)})}</div>}
    </>
  )
}
