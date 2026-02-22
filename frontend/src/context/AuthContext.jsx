import React, { createContext, useContext, useState, useEffect } from 'react'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [token, setToken] = useState(() => localStorage.getItem('token'))
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split('.')[1]))
        if (payload.exp && payload.exp * 1000 < Date.now()) {
          localStorage.removeItem('token')
          setToken(null)
        } else {
          setUser({ id: payload.sub, role: payload.role, email: payload.email, firstName: payload.first_name, lastName: payload.last_name })
        }
      } catch {
        localStorage.removeItem('token')
        setToken(null)
      }
    }
    setLoading(false)
  }, [token])

  const login = (newToken) => {
    try {
      const payload = JSON.parse(atob(newToken.split('.')[1]))
      if (payload.exp && payload.exp * 1000 < Date.now()) {
        return
      }
      localStorage.setItem('token', newToken)
      setToken(newToken)
      setUser({ id: payload.sub, role: payload.role, email: payload.email, firstName: payload.first_name, lastName: payload.last_name })
    } catch {
      // invalid token, do nothing
    }
  }

  const logout = () => {
    localStorage.removeItem('token')
    setToken(null)
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, token, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}
