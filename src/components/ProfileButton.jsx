import { Link } from 'react-router-dom'
import { useAuth } from '../AuthContext'
import '../profile.css'

// Round avatar only (first letter of the name). No text label.
export default function ProfileButton({ showName }) {
  const { profile, user } = useAuth()
  const name = profile?.name || user?.email || '?'
  const letter = name.trim().charAt(0).toUpperCase()
  return (
    <Link to="/profile" className="profile-btn" aria-label="Profile" title="Profile">
      <span className="avatar" aria-hidden="true">{letter}</span>
      {showName && <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', minWidth: 0, whiteSpace: 'nowrap' }}>{profile?.name || user?.email}</span>}
    </Link>
  )
}
