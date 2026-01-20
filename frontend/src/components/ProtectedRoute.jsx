import { Navigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import Layout from './Layout'

const ProtectedRoute = ({ children, requiredRole = null, allowedRoles = null }) => {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950">
        <div className="text-center">
          <div className="relative">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center shadow-2xl shadow-primary-500/30 animate-pulse">
              <i className="fa-solid fa-shield-halved text-white text-2xl"></i>
            </div>
            <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-primary-500 rounded-full border-2 border-white dark:border-slate-950 animate-bounce"></div>
          </div>
          <p className="mt-6 text-slate-500 dark:text-slate-400 font-medium">Loading...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return <Navigate to="/login" replace />
  }

  // Check role access
  let hasAccess = true
  if (allowedRoles && Array.isArray(allowedRoles)) {
    hasAccess = allowedRoles.includes(user.role)
  } else if (requiredRole) {
    hasAccess = user.role === requiredRole
  }

  if (!hasAccess) {
    // Redirect based on role
    if (user.role === 'super_admin') {
      return <Navigate to="/super-admin" replace />
    }
    return <Navigate to="/dashboard" replace />
  }

  return <Layout>{children}</Layout>
}

export default ProtectedRoute
