import { useCallback, useEffect, useMemo, useState } from 'react'
import { http } from '../api/http.js'
import { AuthContext } from './AuthContext.js'

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(() => Boolean(localStorage.getItem('careflow_token')))

  const signOut = useCallback(() => {
    localStorage.removeItem('careflow_token')
    setUser(null)
  }, [])

  useEffect(() => {
    let active = true
    const onUnauthorized = () => signOut()
    window.addEventListener('careflow:unauthorized', onUnauthorized)
    const token = localStorage.getItem('careflow_token')
    if (!token) {
      return () => window.removeEventListener('careflow:unauthorized', onUnauthorized)
    }

    http.get('/auth/me')
      .then(({ data }) => { if (active) setUser(data.user) })
      .catch(() => { if (active) signOut() })
      .finally(() => { if (active) setLoading(false) })

    return () => {
      active = false
      window.removeEventListener('careflow:unauthorized', onUnauthorized)
    }
  }, [signOut])

  const signIn = useCallback(async (credentials) => {
    const { data } = await http.post('/auth/login', credentials)
    localStorage.setItem('careflow_token', data.token)
    setUser(data.user)
    return data.user
  }, [])

  const value = useMemo(() => ({ user, loading, signIn, signOut }), [user, loading, signIn, signOut])
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
