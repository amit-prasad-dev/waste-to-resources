import { WEIGHTS } from './constants'
// Units handed over for an item (supports older items without completedCount)
const units = i => i.completedCount ?? (i.status === 'completed' ? (i.quantity || 1) : 0)

export function impact(items) {
  const byCat = {}
  let kg = 0, reused = 0, donated = 0, exchanged = 0, recycled = 0
  items.forEach(i => {
    const u = units(i)
    if (!u) return
    reused += u
    if (i.action === 'Donate') donated += u
    if (i.action === 'Exchange') exchanged += u
    if (i.action === 'Recycle') recycled += u
    const w = (WEIGHTS[i.category] || 0.5) * u
    kg += w; byCat[i.category] = (byCat[i.category] || 0) + w
  })
  return { total: items.length, available: items.filter(i => i.status === 'available').length,
    reused, donated, exchanged, recycled, kg: Math.round(kg * 10) / 10, byCat }
}
