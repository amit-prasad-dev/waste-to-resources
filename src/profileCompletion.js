// Which profile fields are still empty? Year is required only for students.
const LABELS = { name: 'Full name', userType: 'User type', department: 'Department', year: 'Year' }

export function profileCompletion(profile) {
  if (!profile) return { pct: 0, missing: [], complete: true, ready: false }
  const need = ['name', 'userType', 'department']
  if ((profile.userType || 'student') === 'student') need.push('year')
  const missing = need.filter(k => !String(profile[k] || '').trim()).map(k => LABELS[k])
  const pct = Math.round(((need.length - missing.length) / need.length) * 100)
  return { pct, missing, complete: missing.length === 0, ready: true }
}
