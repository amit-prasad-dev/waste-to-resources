import { createContext, useContext, useEffect, useState } from 'react'
import { onAuthStateChanged, signInWithEmailAndPassword, createUserWithEmailAndPassword,
         updateProfile, signOut } from 'firebase/auth'
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore'
import { auth, db } from './firebase'

const Ctx = createContext(null)
export const useAuth = () => useContext(Ctx)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => onAuthStateChanged(auth, async (u) => {
    setUser(u)
    if (u) {
      const snap = await getDoc(doc(db, 'users', u.uid))
      setProfile(snap.exists() ? snap.data() : null)
    } else setProfile(null)
    setLoading(false)
  }), [])

  const refreshProfile = async () => {
    if (!user) return
    const snap = await getDoc(doc(db, 'users', user.uid))
    setProfile(snap.exists() ? snap.data() : null)
  }

  const login = (email, pw) => signInWithEmailAndPassword(auth, email, pw)

  const register = async (name, email, pw, extra = {}) => {
    const { user: u } = await createUserWithEmailAndPassword(auth, email, pw)
    await updateProfile(u, { displayName: name })
    const data = { name, email, ...extra, role: 'user', createdAt: serverTimestamp() }
    await setDoc(doc(db, 'users', u.uid), data)
    setProfile(data)
  }

  const logout = () => signOut(auth)

  return <Ctx.Provider value={{ user, profile, loading, login, register, logout, refreshProfile,
    isAdmin: profile?.role === 'admin' }}>{children}</Ctx.Provider>
}
