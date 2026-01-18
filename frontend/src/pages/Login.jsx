import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

const Login = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    code: '',
  })
  const [mfaRequired, setMfaRequired] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const { login, user } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    if (user) {
      if (user.role === 'super_admin') {
        navigate('/super-admin')
      } else if (user.role === 'viewer') {
        navigate('/viewer/dashboard')
      } else if (user.role === 'org_admin') {
        navigate('/org/dashboard')
      } else if (user.role === 'user' || user.role === 'security_analyst') {
        navigate('/app/dashboard')
      } else {
        navigate('/dashboard')
      }
    }
  }, [user, navigate])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    const result = await login(formData.email, formData.password, formData.code)

    if (result.success) {
      if (result.user.role === 'super_admin') {
        navigate('/super-admin')
      } else if (result.user.role === 'viewer') {
        navigate('/viewer/dashboard')
      } else if (result.user.role === 'org_admin') {
        navigate('/org/dashboard')
      } else if (result.user.role === 'user' || result.user.role === 'security_analyst') {
        navigate('/app/dashboard')
      } else {
        navigate('/dashboard')
      }
    } else {
      if (result.mfaRequired) {
        setMfaRequired(true)
        setError('')
      } else {
        setError(result.error || 'Login failed')
      }
    }

    setLoading(false)
  }

  return (
    <div className="h-screen login-page-wrapper relative overflow-hidden" style={{ backgroundColor: '#0a0e27' }}>
      {/* Animated Background - Modern Purple/Blue Gradient */}
      <div className="fixed inset-0 bg-gradient-to-br from-indigo-950 via-purple-900 to-pink-900 z-0" style={{ zIndex: 0 }}>
        <div 
          className="absolute inset-0 opacity-15"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.03'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
          }}
        ></div>
        
        {/* Floating Orbs - Modern Purple/Blue/Pink */}
        <div className="absolute top-20 left-20 w-96 h-96 bg-purple-600 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"></div>
        <div className="absolute top-40 right-20 w-96 h-96 bg-indigo-600 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>
        <div className="absolute -bottom-20 left-1/2 w-96 h-96 bg-pink-600 rounded-full mix-blend-multiply filter blur-3xl opacity-15 animate-blob animation-delay-4000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-blue-500 rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-blob animation-delay-6000"></div>
      </div>

      {/* Content Container - Unified Layout (No Split Pages) */}
      <div className="login-content-container relative w-full h-full flex flex-col lg:flex-row items-center justify-center overflow-y-auto overflow-x-hidden px-4 py-4" style={{ position: 'relative', zIndex: 100, minHeight: '100vh' }}>
        
        {/* Mobile: Welcome Message at Top (Smaller) - Only visible on mobile */}
        <div className="lg:hidden w-full flex flex-col items-center justify-center p-3 sm:p-4 mb-4 fade-in" style={{ visibility: 'visible', opacity: 1, display: 'flex' }}>
          <div className="w-full max-w-md space-y-2 sm:space-y-3 text-center">
            {/* Logo Section - Mobile */}
            <div className="space-y-2" style={{ visibility: 'visible', opacity: 1 }}>
              <div className="flex items-center justify-center space-x-2 sm:space-x-3 group" style={{ visibility: 'visible', opacity: 1 }}>
                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-gradient-to-br from-purple-500 via-indigo-500 to-pink-500 flex items-center justify-center shadow-2xl shadow-purple-500/50 ring-4 ring-purple-500/20 transform transition-all duration-500 group-hover:scale-110 group-hover:rotate-6" style={{ visibility: 'visible', opacity: 1 }}>
                  <i className="fas fa-shield-alt text-base sm:text-lg" style={{ color: '#ffffff', visibility: 'visible', opacity: 1 }}></i>
                </div>
                <div style={{ visibility: 'visible', opacity: 1 }}>
                  <h1 className="text-xl sm:text-2xl font-extrabold mb-0.5 tracking-tight" style={{ color: '#ffffff', visibility: 'visible', opacity: 1 }}>
                    EASM Platform
                  </h1>
                  <p className="text-xs sm:text-sm font-semibold" style={{ color: '#a78bfa', visibility: 'visible', opacity: 1 }}>
                    External Threat Surface Management
                  </p>
                </div>
              </div>
              <div className="w-16 sm:w-20 h-0.5 mx-auto bg-gradient-to-r from-purple-500 via-indigo-500 to-pink-500 rounded-full shadow-lg shadow-purple-500/50" style={{ visibility: 'visible', opacity: 1 }}></div>
            </div>

            {/* Welcome Message - Mobile (Smaller) */}
            <div className="space-y-1" style={{ visibility: 'visible', opacity: 1 }}>
              <h2 className="text-2xl sm:text-3xl font-extrabold leading-tight" style={{ color: '#ffffff', visibility: 'visible', opacity: 1 }}>
                Welcome
                <span className="bg-gradient-to-r from-purple-400 via-indigo-400 to-pink-400 bg-clip-text text-transparent" style={{ visibility: 'visible', opacity: 1 }}> Back</span>
              </h2>
              <p className="text-xs sm:text-sm font-medium" style={{ color: '#e5e7eb', visibility: 'visible', opacity: 1 }}>
                Secure access to your threat surface management dashboard
              </p>
            </div>
          </div>
        </div>

        {/* Desktop: Left Side - Branding (Welcome Message + Feature Cards) */}
        <div 
          className="hidden lg:flex lg:w-1/2 flex-col items-center justify-center p-6 xl:p-8 relative flex-shrink-0" 
          style={{ 
            zIndex: 101, 
            visibility: 'visible', 
            opacity: 1, 
            display: 'flex',
            position: 'relative',
            minHeight: 'auto',
            height: 'auto',
            maxHeight: 'none',
            overflow: 'visible'
          }}
        >
          <div className="w-full max-w-lg space-y-6 xl:space-y-8 fade-in" style={{ visibility: 'visible', opacity: 1 }}>
            {/* Logo Section - Desktop */}
            <div className="space-y-3 xl:space-y-4" style={{ visibility: 'visible', opacity: 1 }}>
              <div className="flex items-center space-x-3 xl:space-x-4 group" style={{ visibility: 'visible', opacity: 1 }}>
                <div className="w-12 h-12 xl:w-14 xl:h-14 rounded-2xl bg-gradient-to-br from-purple-500 via-indigo-500 to-pink-500 flex items-center justify-center shadow-2xl shadow-purple-500/50 ring-4 ring-purple-500/20 transform transition-all duration-500 group-hover:scale-110 group-hover:rotate-6" style={{ visibility: 'visible', opacity: 1 }}>
                  <i className="fas fa-shield-alt text-lg xl:text-xl" style={{ color: '#ffffff', visibility: 'visible', opacity: 1 }}></i>
                </div>
                <div style={{ visibility: 'visible', opacity: 1 }}>
                  <h1 className="text-3xl xl:text-4xl 2xl:text-5xl font-extrabold mb-1 tracking-tight" style={{ color: '#ffffff', visibility: 'visible', opacity: 1 }}>
                    EASM Platform
                  </h1>
                  <p className="text-base xl:text-lg 2xl:text-xl font-semibold" style={{ color: '#a78bfa', visibility: 'visible', opacity: 1 }}>
                    External Threat Surface Management
                  </p>
                </div>
              </div>
              <div className="w-20 h-1 bg-gradient-to-r from-purple-500 via-indigo-500 to-pink-500 rounded-full shadow-lg shadow-purple-500/50" style={{ visibility: 'visible', opacity: 1 }}></div>
            </div>

            {/* Welcome Message - Desktop */}
            <div className="space-y-2 xl:space-y-3" style={{ visibility: 'visible', opacity: 1 }}>
              <h2 className="text-4xl xl:text-5xl 2xl:text-6xl font-extrabold leading-tight" style={{ color: '#ffffff', visibility: 'visible', opacity: 1 }}>
                Welcome
                <br />
                <span className="bg-gradient-to-r from-purple-400 via-indigo-400 to-pink-400 bg-clip-text text-transparent" style={{ visibility: 'visible', opacity: 1 }}>
                  Back
                </span>
              </h2>
              <p className="text-base xl:text-lg font-medium" style={{ color: '#e5e7eb', visibility: 'visible', opacity: 1 }}>
                Secure access to your threat surface management dashboard
              </p>
            </div>

            {/* Feature Cards - Desktop */}
            <div className="space-y-2 xl:space-y-3 relative pt-2 xl:pt-4" style={{ zIndex: 102, visibility: 'visible', opacity: 1 }}>
              {[
                { icon: 'fa-shield-alt', title: 'Enterprise Security', desc: 'Advanced vulnerability scanning', gradient: 'from-purple-500/30 to-indigo-500/30', border: 'border-purple-400/40', iconColor: '#a78bfa' },
                { icon: 'fa-chart-line', title: 'Real-Time Analytics', desc: 'Comprehensive risk assessment', gradient: 'from-indigo-500/30 to-pink-500/30', border: 'border-indigo-400/40', iconColor: '#818cf8' },
                { icon: 'fa-network-wired', title: 'Asset Discovery', desc: 'Continuous monitoring', gradient: 'from-pink-500/30 to-purple-500/30', border: 'border-pink-400/40', iconColor: '#f472b6' },
              ].map((feature, index) => (
                <div
                  key={`feature-desktop-${index}`}
                  className="glass-card-feature rounded-xl p-3 xl:p-4 group cursor-pointer transform transition-all duration-300 hover:scale-105 hover:translate-x-2 fade-in"
                  style={{ animationDelay: `${index * 100}ms`, visibility: 'visible', opacity: 1, display: 'block' }}
                >
                  <div className="flex items-center space-x-3" style={{ visibility: 'visible', opacity: 1 }}>
                    <div className={`w-9 h-9 xl:w-10 xl:h-10 rounded-lg bg-gradient-to-br ${feature.gradient} flex items-center justify-center backdrop-blur-sm border-2 ${feature.border} transform transition-transform duration-300 group-hover:scale-110 group-hover:rotate-6 shadow-lg`} style={{ visibility: 'visible', opacity: 1 }}>
                      <i className={`fas ${feature.icon} text-sm xl:text-base`} style={{ color: feature.iconColor, visibility: 'visible', opacity: 1 }}></i>
                    </div>
                    <div style={{ visibility: 'visible', opacity: 1 }}>
                      <p className="font-bold text-xs xl:text-sm mb-0.5" style={{ color: '#ffffff', visibility: 'visible', opacity: 1 }}>{feature.title}</p>
                      <p className="text-xs" style={{ color: '#d1d5db', visibility: 'visible', opacity: 1 }}>{feature.desc}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Side - Login Form */}
        <div className="w-full lg:w-1/2 flex flex-col items-center justify-center p-4 sm:p-6 lg:p-6 xl:p-8 relative flex-shrink-0" style={{ zIndex: 51 }}>
          <div className="w-full max-w-md" style={{ position: 'relative', zIndex: 52 }}>
            
            {/* Login Form Card */}
            <div className="glass-card-form rounded-2xl p-5 sm:p-6 xl:p-8 shadow-2xl fade-in" style={{ position: 'relative', zIndex: 101, visibility: 'visible', opacity: 1, display: 'block' }}>
              {/* Header */}
              <div className="text-center mb-6 xl:mb-8">
                <div className="inline-flex items-center justify-center w-14 h-14 xl:w-16 xl:h-16 rounded-2xl bg-gradient-to-br from-purple-500 via-indigo-500 to-pink-500 mb-3 xl:mb-4 shadow-xl shadow-purple-500/30 ring-4 ring-purple-500/20 transform transition-transform duration-300 hover:scale-110 hover:rotate-6">
                  <i className="fas fa-lock text-white text-lg xl:text-xl"></i>
                </div>
                <h2 className="text-2xl sm:text-3xl xl:text-4xl font-extrabold bg-gradient-to-r from-purple-400 via-indigo-400 to-pink-400 bg-clip-text text-transparent mb-2 tracking-tight">
                  Sign In
                </h2>
                <p className="text-gray-200 text-xs sm:text-sm font-medium" style={{ color: '#e5e7eb' }}>
                  Enter your credentials to access your account
                </p>
              </div>

              {/* Form */}
              <form className="space-y-5" onSubmit={handleSubmit}>
                {/* Email Field */}
                <div className="space-y-1.5">
                  <label htmlFor="email" className="block text-xs font-bold text-white flex items-center" style={{ color: '#ffffff' }}>
                    <i className="fas fa-envelope text-purple-400 mr-2 text-sm"></i>
                    Email Address
                  </label>
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <i className="fas fa-envelope text-gray-500 group-focus-within:text-purple-400 transition-colors text-sm"></i>
                    </div>
                    <input
                      id="email"
                      type="email"
                      required
                      className="login-input w-full pl-10 pr-4 py-2.5 sm:py-3 rounded-lg bg-white/10 backdrop-blur-sm border-2 border-white/20 text-white placeholder-gray-400 focus:outline-none focus:border-purple-400 focus:ring-4 focus:ring-purple-400/20 transition-all duration-300 text-sm"
                      style={{ color: '#ffffff' }}
                      placeholder="you@example.com"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    />
                  </div>
                </div>

                {/* Password Field */}
                <div className="space-y-1.5">
                  <label htmlFor="password" className="block text-xs font-bold text-white flex items-center" style={{ color: '#ffffff' }}>
                    <i className="fas fa-lock text-purple-400 mr-2 text-sm"></i>
                    Password
                  </label>
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <i className="fas fa-lock text-gray-500 group-focus-within:text-purple-400 transition-colors text-sm"></i>
                    </div>
                    <input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      required
                      className="login-input w-full pl-10 pr-10 py-2.5 sm:py-3 rounded-lg bg-white/10 backdrop-blur-sm border-2 border-white/20 text-white placeholder-gray-400 focus:outline-none focus:border-purple-400 focus:ring-4 focus:ring-purple-400/20 transition-all duration-300 text-sm"
                      style={{ color: '#ffffff' }}
                      placeholder="Enter your password"
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-500 hover:text-purple-400 transition-colors"
                    >
                      <i className={`fas ${showPassword ? 'fa-eye-slash' : 'fa-eye'} text-sm`}></i>
                    </button>
                  </div>
                </div>

                {/* MFA Code Field */}
                {mfaRequired && (
                  <div className="space-y-1.5 animate-fadeIn">
                    <label htmlFor="code" className="block text-xs font-bold text-white flex items-center" style={{ color: '#ffffff' }}>
                      <i className="fas fa-shield-alt text-purple-400 mr-2 text-sm"></i>
                      MFA Code
                    </label>
                    <div className="relative group">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <i className="fas fa-shield-alt text-gray-500 group-focus-within:text-purple-400 transition-colors text-sm"></i>
                      </div>
                      <input
                        id="code"
                        type="text"
                        required
                        maxLength={6}
                        className="login-input w-full pl-10 pr-4 py-2.5 sm:py-3 rounded-lg bg-white/10 backdrop-blur-sm border-2 border-white/20 text-white placeholder-gray-400 focus:outline-none focus:border-purple-400 focus:ring-4 focus:ring-purple-400/20 transition-all duration-300 text-center text-lg sm:text-xl tracking-widest font-mono"
                        style={{ color: '#ffffff' }}
                        placeholder="000000"
                        value={formData.code}
                        onChange={(e) => {
                          // Only allow digits, auto-format
                          const value = e.target.value.replace(/\D/g, '').slice(0, 6)
                          setFormData({ ...formData, code: value })
                        }}
                        autoComplete="one-time-code"
                        inputMode="numeric"
                      />
                    </div>
                  </div>
                )}

                {/* Error Message */}
                {error && (
                  <div className="rounded-lg bg-red-500/10 backdrop-blur-sm border-2 border-red-500/30 p-3 animate-fadeIn">
                    <div className="flex items-center space-x-2">
                      <i className="fas fa-exclamation-circle text-red-400 text-sm"></i>
                      <p className="text-xs text-red-300 font-semibold">{error}</p>
                    </div>
                  </div>
                )}

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={loading || !formData.email || !formData.password}
                  className="login-button w-full py-2.5 sm:py-3 px-6 rounded-lg bg-gradient-to-r from-purple-500 via-indigo-500 to-pink-500 text-white font-bold text-sm shadow-xl shadow-purple-500/30 hover:shadow-2xl hover:shadow-purple-500/50 focus:outline-none focus:ring-4 focus:ring-purple-500/30 disabled:opacity-50 disabled:cursor-not-allowed transform transition-all duration-300 hover:scale-105 active:scale-95 relative overflow-hidden group"
                >
                  <span className="relative z-10 flex items-center justify-center">
                    {loading ? (
                      <>
                        <i className="fas fa-spinner fa-spin mr-2 text-sm"></i>
                        Signing in...
                      </>
                    ) : (
                      <>
                        <i className="fas fa-sign-in-alt mr-2 group-hover:translate-x-1 transition-transform text-sm"></i>
                        Sign In
                      </>
                    )}
                  </span>
                  <div className="absolute inset-0 bg-gradient-to-r from-purple-600 via-indigo-600 to-pink-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                </button>
              </form>

              {/* Footer */}
              <div className="mt-6 pt-4 border-t border-white/10 text-center">
                <p className="text-xs text-gray-500 font-medium">
                  © 2025 EASM Platform. All rights reserved.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes blob {
          0%, 100% {
            transform: translate(0, 0) scale(1);
          }
          33% {
            transform: translate(30px, -50px) scale(1.1);
          }
          66% {
            transform: translate(-20px, 20px) scale(0.9);
          }
        }
        .animate-blob {
          animation: blob 7s infinite;
        }
        .animation-delay-2000 {
          animation-delay: 2s;
        }
        .animation-delay-4000 {
          animation-delay: 4s;
        }
        .animation-delay-6000 {
          animation-delay: 6s;
        }
        .fade-in {
          animation: fadeIn 0.8s ease-out;
        }
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fadeIn {
          animation: fadeIn 0.5s ease-out;
        }
        .glass-card-feature {
          background: rgba(139, 92, 246, 0.15) !important;
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          border: 2px solid rgba(139, 92, 246, 0.3) !important;
          box-shadow: 0 8px 32px 0 rgba(139, 92, 246, 0.2) !important;
          visibility: visible !important;
          opacity: 1 !important;
        }
        .glass-card-form {
          background: rgba(15, 23, 42, 0.85) !important;
          backdrop-filter: blur(30px);
          -webkit-backdrop-filter: blur(30px);
          border: 2px solid rgba(139, 92, 246, 0.3) !important;
          box-shadow: 0 8px 32px 0 rgba(139, 92, 246, 0.3) !important;
          visibility: visible !important;
          opacity: 1 !important;
          display: block !important;
        }
        .login-input {
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .login-input:focus {
          transform: translateY(-2px);
          box-shadow: 0 10px 25px rgba(139, 92, 246, 0.3);
        }
        .login-button {
          background-size: 200% 200%;
          animation: gradientShift 3s ease infinite;
        }
        @keyframes gradientShift {
          0%, 100% {
            background-position: 0% 50%;
          }
          50% {
            background-position: 100% 50%;
          }
        }
        .login-page-wrapper {
          position: relative;
          overflow: hidden;
          display: flex;
          flex-direction: column;
        }
        /* Unified scrolling container - prevents split pages */
        .login-content-container {
          overflow-y: auto;
          overflow-x: hidden;
          scrollbar-width: thin;
          scrollbar-color: rgba(139, 92, 246, 0.5) transparent;
          flex: 1;
          width: 100%;
        }
        .login-content-container::-webkit-scrollbar {
          width: 6px;
        }
        .login-content-container::-webkit-scrollbar-track {
          background: transparent;
        }
        .login-content-container::-webkit-scrollbar-thumb {
          background-color: rgba(139, 92, 246, 0.5);
          border-radius: 3px;
        }
        .login-content-container::-webkit-scrollbar-thumb:hover {
          background-color: rgba(139, 92, 246, 0.7);
        }
        /* Ensure mobile section is hidden on desktop */
        @media (min-width: 1024px) {
          .login-content-container > div:first-of-type {
            display: none !important;
          }
        }
        /* Mobile Welcome Message - Always Visible on mobile only */
        @media (max-width: 1023px) {
          .login-content-container > div:first-of-type {
            display: flex !important;
            visibility: visible !important;
            opacity: 1 !important;
          }
        }
        /* Responsive fixes for minimizing */
        @media (max-width: 1024px) {
          .login-content-container {
            flex-direction: column !important;
          }
          .glass-card-form {
            padding: 1rem !important;
          }
        }
        @media (max-height: 800px) {
          .login-content-container {
            align-items: flex-start;
            padding-top: 1rem;
            padding-bottom: 1rem;
          }
          .glass-card-form {
            padding: 1rem !important;
          }
        }
        @media (max-width: 640px) {
          .login-content-container {
            padding: 0.5rem;
          }
          .glass-card-form {
            padding: 1rem !important;
          }
        }
        /* Ensure unified layout on desktop - no split pages */
        @media (min-width: 1024px) {
          .login-content-container {
            display: flex !important;
            flex-direction: row !important;
            align-items: center !important;
          }
        }
      `}</style>
    </div>
  )
}

export default Login
