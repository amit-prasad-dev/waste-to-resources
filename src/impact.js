import { WEIGHTS } from './constants'
export function impact(items) {
  const done = items.filter(i => i.status === 'completed')
  const byCat = {}
  let kg = 0
  done.forEach(i => {
    const w = (WEIGHTS[i.category] || 0.5) * (i.quantity || 1)
    kg += w; byCat[i.category] = (byCat[i.category] || 0) + w
  })
  return {
    total: items.length, available: items.filter(i => i.status === 'available').length,
    reused: done.length, donated: done.filter(i => i.action === 'Donate').length,
    exchanged: done.filter(i => i.action === 'Exchange').length,
    recycled: done.filter(i => i.action === 'Recycle').length,
    kg: Math.round(kg * 10) / 10, byCat,
  }
}
