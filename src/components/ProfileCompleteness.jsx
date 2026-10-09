import { Link } from 'react-router-dom'
import { useAuth } from '../AuthContext'
import { profileCompletion } from '../profileCompletion'
import '../profile-progress.css'

// Banner shown only while the profile has empty fields. compact = Dashboard version with a link to /profile.
export default function ProfileCompleteness({ compact = false }) {
  const { profile } = useAuth()
  const { pct, missing, complete, ready } = profileCompletion(profile)
  if (!ready || complete) return null
  const goForm = () => document.getElementById('personal-details')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  return (
    <div className="pc" role="status">
      <div className="pc-top"><strong>Complete your profile</strong><span>{pct}%</span></div>
      <div className="pc-bar" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100} aria-label="Profile completion"><span style={{ width: pct + '%' }} /></div>
      <p>Still missing: {missing.join(', ')}</p>
      {compact ? <Link to="/profile" className="btn small">Complete now</Link>
        : <button type="button" className="btn small" onClick={goForm}>Fill in details</button>}
    </div>
  )
}
