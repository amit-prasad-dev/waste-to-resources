import { collection, doc, getDocs, query, where, writeBatch, serverTimestamp } from 'firebase/firestore'
import { db } from './firebase'

export const newNotifRef = () => doc(collection(db, 'notifications'))
export const notifData = (fromId, userId, type, title, message, link = '/my-requests') =>
  ({ userId, fromId, type, title, message, link, read: false, createdAt: serverTimestamp() })

// A unit became free again -> tell everyone who pressed "Notify me" for this item
export async function notifyWatchersFreed(item, fromId) {
  const s = await getDocs(query(collection(db, 'watches'), where('itemId', '==', item.id)))
  if (s.empty) return
  const b = writeBatch(db)
  s.docs.forEach(w => {
    b.set(newNotifRef(), notifData(fromId, w.data().userId, 'item_available', 'Item available again',
      `A unit of “${item.title}” is available now. Request it before it's gone.`, '/browse'))
    b.delete(w.ref)
  })
  await b.commit()
}

// Someone posted a similar item (same category, similar name) -> tell the watchers
export async function notifyWatchersNewPost(item, fromId) {
  const s = await getDocs(query(collection(db, 'watches'), where('category', '==', item.category)))
  const t = item.title.toLowerCase()
  const hits = s.docs.filter(w => {
    const d = w.data()
    return d.userId !== fromId && d.titleKey && (t.includes(d.titleKey) || d.titleKey.includes(t))
  })
  if (!hits.length) return
  const b = writeBatch(db)
  hits.forEach(w => {
    b.set(newNotifRef(), notifData(fromId, w.data().userId, 'item_posted', 'New item posted',
      `“${item.title}” was just posted, similar to what you were waiting for.`, '/browse'))
    b.delete(w.ref)
  })
  await b.commit()
}
