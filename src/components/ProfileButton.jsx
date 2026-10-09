import { Link } from 'react-router-dom'
import { useAuth } from '../AuthContext'
import { profileCompletion } from '../profileCompletion'
import '../profile.css'
import '../profile-progress.css'

// Round avatar (first letter of the name). A small amber dot shows in its corner while the profile is incomplete.
// showName: also show the full user name to the right of the avatar (used in the desktop sidebar).
export default function ProfileButton({ showName = false }) {
  const { profile, user } = useAuth()
  const fullName = profile?.name || user?.email || ''
  const letter = (fullName || '?').trim().charAt(0).toUpperCase()
  const { pct, missing, complete, ready } = profileCompletion(profile)
  const incomplete = ready && !complete
  const tip = incomplete ? `Profile ${pct}% complete. Add: ${missing.join(', ')}` : 'Profile'
  return (
    <Link to="/profile" className={'profile-btn' + (showName ? ' with-name' : '')} aria-label={showName ? `${fullName}. ${tip}` : tip} title={tip}>
      <span className="avatar-wrap">
        <span className="avatar" aria-hidden="true">{letter}</span>
        {incomplete && <span className="avatar-dot" aria-hidden="true" />}
      </span>
      {showName && <span className="pb-name">{fullName}</span>}
    </Link>
  )
}
