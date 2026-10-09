import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { GoogleAuthProvider, signInWithPopup, getAdditionalUserInfo, deleteUser, signOut } from 'firebase/auth'
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore'
import { auth, db } from '../firebase'
import { useAuth } from '../AuthContext'
import '../google.css'

// While a Google sign-in is being checked, Login/Register must not auto-redirect.
// They use:  if (user && !googleCheck.active) return <Navigate ... />
export const googleCheck = { active: false }

const ERRORS = {
  'auth/popup-blocked': 'The sign-in popup was blocked. Allow popups for this site and try again.',
  'auth/unauthorized-domain': 'This domain is not authorized in Firebase (Authentication > Settings > Authorized domains).',
  'auth/network-request-failed': 'Network error. Check your internet connection.',
  'auth/account-exists-with-different-credential': 'This email is already registered with another sign-in method.',
}

// mode="login":  only existing accounts can enter. A brand-new Google account is NOT created.
// mode="signup": creates the account (profile document) for a new Google user.
export default function GoogleButton({ mode = 'login', label }) {
  const nav = useNavigate()
  const { refreshProfile } = useAuth()
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')
  const text = label || (mode === 'signup' ? 'Sign up with Google' : 'Continue with Google')

  const go = async () => {
    setErr(''); setBusy(true); googleCheck.active = true
    try {
      const result = await signInWithPopup(auth, new GoogleAuthProvider())
      const user = result.user
      const isNew = getAdditionalUserInfo(result)?.isNewUser
      const ref = doc(db, 'users', user.uid)
      const snap = await getDoc(ref)

      if (snap.exists()) {                      // existing account: log in (both modes)
        await refreshProfile?.()
        googleCheck.active = false
        nav('/dashboard')
      } else if (mode === 'signup') {           // new account: create profile
        await setDoc(ref, { name: user.displayName || user.email.split('@')[0], email: user.email, userType: 'student',
          department: '', year: '', role: 'user', provider: 'google', createdAt: serverTimestamp() })
        await refreshProfile?.()
        googleCheck.active = false
        nav('/profile')                         // pick type, department and year
      } else {                                  // login mode but no account: undo the sign-in
        if (isNew) { try { await deleteUser(user) } catch {} }   // remove the Auth user that was just created
        await signOut(auth).catch(() => {})
        setErr(isNew
          ? 'No account found for this Google email. Please use “Sign up with Google” on the Register page first.'
          : 'Your profile was not found. Please sign up again or contact the admin.')
      }
    } catch (e) {
      if (e.code !== 'auth/popup-closed-by-user' && e.code !== 'auth/cancelled-popup-request')
        setErr(ERRORS[e.code] || 'Google sign-in failed: ' + (e.message || '').replace('Firebase: ', ''))
    } finally {
      googleCheck.active = false
      setBusy(false)
    }
  }

  return (
    <>
      <button type="button" className="google-btn" onClick={go} disabled={busy}>
        <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true">
          <path fill="#FFC107" d="M43.6 20.1H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 8 3l5.7-5.7C34 6.1 29.3 4 24 4 13 4 4 13 4 24s9 20 20 20 20-9 20-20c0-1.3-.1-2.7-.4-3.9z"/>
          <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.8 1.2 8 3l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z"/>
          <path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-7.9l-6.5 5C9.5 39.6 16.2 44 24 44z"/>
          <path fill="#1976D2" d="M43.6 20.1H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.3-.1-2.7-.4-3.9z"/>
        </svg>
        {busy ? 'Please wait…' : text}
      </button>
      {err && <div className="error" role="alert" style={{ marginTop: '.7rem' }}>{err}</div>}
    </>
  )
}
