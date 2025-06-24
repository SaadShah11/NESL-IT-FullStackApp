import React, { createContext, useContext, useState, useEffect } from 'react'
import { clearAllCache } from '../hooks/useApi'

const AuthContext = createContext()

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

export const AuthProvider = ({ children }) => {
  const [token, setToken] = useState(null)
  const [user, setUser] = useState(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isAuthenticated, setIsAuthenticated] = useState(false)

  // API base URL - adjust if your API runs on different port
  const API_BASE_URL = 'http://localhost:3000'

  const login = async (credentials) => {
    setIsLoading(true)
    try {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 10000) // 10 second timeout

      const response = await fetch(`${API_BASE_URL}/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(credentials),
        signal: controller.signal
      })

      clearTimeout(timeoutId)

      if (!response.ok) {
        let errorMessage = 'Login failed'
        try {
          const errorData = await response.json()
          errorMessage = errorData.error || errorData.message || 'Login failed'
        } catch (parseError) {
          // If can't parse JSON, use status-based message
          if (response.status === 401) {
            errorMessage = 'Invalid credentials'
          } else if (response.status >= 500) {
            errorMessage = 'Server error. Please try again later.'
          } else if (response.status >= 400) {
            errorMessage = 'Invalid request. Please check your input.'
          }
        }
        throw new Error(errorMessage)
      }

      const data = await response.json()
      
      // Clear any cached data from previous user
      clearAllCache()
      
      // Store token and user info in memory
      setToken(data.token)
      setUser(data.user)
      setIsAuthenticated(true)
      
      return { success: true, data }
    } catch (error) {
      let errorMessage = error.message

      // Handle specific error types
      if (error.name === 'AbortError') {
        errorMessage = 'Request timed out. Please try again.'
      } else if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
        errorMessage = 'Unable to connect to the server. Please check your internet connection.'
      } else if (error.message.includes('TypeError')) {
        errorMessage = 'Network error. Please try again.'
      }

      return { success: false, error: errorMessage }
    } finally {
      setIsLoading(false)
    }
  }

  const logout = () => {
    // Clear all cached data when logging out
    clearAllCache()
    
    setToken(null)
    setUser(null)
    setIsAuthenticated(false)
  }

  // Helper function to make authenticated API calls
  const apiCall = async (endpoint, options = {}) => {
    const config = {
      headers: {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
        ...options.headers,
      },
      ...options,
    }

    const response = await fetch(`${API_BASE_URL}${endpoint}`, config)
    
    // Handle token expiration or unauthorized access
    if (response.status === 401) {
      logout()
      throw new Error('Session expired. Please login again.')
    }

    return response
  }

  const value = {
    token,
    user,
    isAuthenticated,
    isLoading,
    login,
    logout,
    apiCall,
    API_BASE_URL
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
} 