import { createContext, useContext, useState, useEffect } from 'react'
import axios from 'axios'

const AuthContext = createContext()

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const token = localStorage.getItem('access_token')
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`
      fetchUser()
    } else {
      setLoading(false)
    }

    // Add response interceptor for automatic token refresh
    const interceptor = axios.interceptors.response.use(
      (response) => response,
      async (error) => {
        const originalRequest = error.config

        // If error is 401 and we haven't already retried
        if (error.response?.status === 401 && !originalRequest._retry) {
          originalRequest._retry = true

          try {
            const refreshToken = localStorage.getItem('refresh_token')
            if (!refreshToken) {
              logout()
              return Promise.reject(error)
            }

            // Try to refresh the token
            const response = await axios.post('/api/auth/refresh/', {
              refresh: refreshToken,
            })

            const { access } = response.data
            localStorage.setItem('access_token', access)
            axios.defaults.headers.common['Authorization'] = `Bearer ${access}`
            originalRequest.headers['Authorization'] = `Bearer ${access}`

            // Retry the original request
            return axios(originalRequest)
          } catch (refreshError) {
            // Refresh failed, logout user
            logout()
            return Promise.reject(refreshError)
          }
        }

        return Promise.reject(error)
      }
    )

    // Cleanup interceptor on unmount
    return () => {
      axios.interceptors.response.eject(interceptor)
    }
  }, [])

  const fetchUser = async () => {
    try {
      const token = localStorage.getItem('access_token')
      if (!token) {
        setLoading(false)
        return
      }

      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`
      const response = await axios.get('/api/auth/me/')
      setUser(response.data)
    } catch (error) {
      console.error('Error fetching user:', error)
      // If 401, token is invalid, clear it
      if (error.response?.status === 401) {
        logout()
      }
    } finally {
      setLoading(false)
    }
  }

  const login = async (email, password, code = '') => {
    try {
      const response = await axios.post('/api/auth/login/', {
        email,
        password,
        code,
      })

      const { access, refresh, user: userData } = response.data
      localStorage.setItem('access_token', access)
      localStorage.setItem('refresh_token', refresh)
      axios.defaults.headers.common['Authorization'] = `Bearer ${access}`
      setUser(userData)
      return { success: true, user: userData }
    } catch (error) {
      console.error('Login error:', error)
      console.error('Error response:', error.response?.data)
      
      // Check for MFA requirement
      if (error.response?.data?.mfa_required || error.response?.data?.message?.includes('MFA')) {
        return { success: false, mfaRequired: true, error: error.response.data.message || 'MFA code is required' }
      }
      
      // Check for validation errors
      if (error.response?.data?.non_field_errors) {
        return { success: false, error: error.response.data.non_field_errors[0] }
      }
      
      // Check for field-specific errors
      if (error.response?.data?.email) {
        return { success: false, error: error.response.data.email[0] }
      }
      
      if (error.response?.data?.password) {
        return { success: false, error: error.response.data.password[0] }
      }
      
      // Generic error message
      const errorMessage = error.response?.data?.error || 
                          error.response?.data?.message || 
                          error.message || 
                          'Login failed. Please check your credentials.'
      
      return { success: false, error: errorMessage }
    }
  }

  const logout = () => {
    localStorage.removeItem('access_token')
    localStorage.removeItem('refresh_token')
    delete axios.defaults.headers.common['Authorization']
    setUser(null)
  }

  const value = {
    user,
    loading,
    login,
    logout,
    fetchUser,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

