import { useEffect } from 'react'
import { collection, query, where, onSnapshot, doc, getDoc, setDoc, updateDoc, Timestamp } from 'firebase/firestore'
import { db } from '../firebase'
import { useAuth } from '../AuthContext'
import { notifData } from '../notify'

// Renders nothing. When someone else posts a new item, this user gets a "New item posted" notification
// (bell, unread count, popup and history all work as usual).
//  - Live: new items posted while the app is open.
//  - Catch-up: items posted since the user last used the app (latest 5 only).
// The notification id is fixed per (item, user), so a notification is never created twice.
export default function NewItemNotifier() {
  const { user } = useAuth()

  useEffect(() => {
    if (!user) return
    let cancelled = false
    let unsub = () => {}

    ;(async () => {
      const uref = doc(db, 'users', user.uid)
      const snap = await getDoc(uref)
      if (cancelled || !snap.exists()) return
      let since = snap.data().itemsSeenAt
      if (!since) { since = Timestamp.now(); await updateDoc(uref, { itemsSeenAt: since }).catch(() => {}) }

      const notify = async (it) => {
        try {
          await setDoc(doc(db, 'notifications', `item_${it.id}_${user.uid}`),
            notifData(user.uid, user.uid, 'item_posted', 'New item posted',
              `${it.ownerName || 'Someone'} posted “${it.title}” (${it.category}).`, '/browse'))
        } catch { /* already exists: nothing to do */ }
      }

      let first = true
      unsub = onSnapshot(query(collection(db, 'items'), where('createdAt', '>', since)), async s => {
        let items = s.docChanges().filter(c => c.type === 'added').map(c => ({ id: c.doc.id, ...c.doc.data() }))
          .filter(i => i.ownerId !== user.uid && i.createdAt)
          .sort((a, b) => a.createdAt.seconds - b.createdAt.seconds)
        if (first) { items = items.slice(-5); first = false }       // catch-up: latest 5 only
        for (const it of items) await notify(it)
        if (items.length) updateDoc(uref, { itemsSeenAt: items[items.length - 1].createdAt }).catch(() => {})
      }, () => {})
    })()

    return () => { cancelled = true; unsub() }
  }, [user?.uid])

  return null
}
