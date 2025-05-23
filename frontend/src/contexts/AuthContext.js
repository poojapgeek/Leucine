"use client"

import { createContext, useContext, useState, useEffect } from "react"
import api from "../services/api"

const AuthContext = createContext()

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Check if user is logged in
    const token = localStorage.getItem("token")
    const userData = localStorage.getItem("user")

    if (token && userData) {
      setUser(JSON.parse(userData))
      api.defaults.headers.common["Authorization"] = `Bearer ${token}`
    }

    setLoading(false)
  }, [])

  const login = async (username, password) => {
    try {
      const response = await api.post("/auth/login", { username, password })
      const { token, user } = response.data

      localStorage.setItem("token", token)
      localStorage.setItem("user", JSON.stringify(user))

      api.defaults.headers.common["Authorization"] = `Bearer ${token}`

      setUser(user)
    } catch (error) {
      console.error("Login error:", error)
      throw error
    }
  }

  const signup = async (username, email, password) => {
    try {
      await api.post("/auth/signup", { username, email, password })
    } catch (error) {
      console.error("Signup error:", error)
      throw error
    }
  }

  const logout = () => {
    localStorage.removeItem("token")
    localStorage.removeItem("user")
    delete api.defaults.headers.common["Authorization"]
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, isAuthenticated: !!user, loading, login, signup, logout }}>
      {children}
    </AuthContext.Provider>
  )
}
