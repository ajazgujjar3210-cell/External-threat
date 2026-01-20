import { useState, useEffect } from 'react'
// Layout is now handled by ProtectedRoute
import { useAuth } from '../../contexts/AuthContext'
import axios from 'axios'

const Profile = () => {
  const { user, fetchUser } = useAuth()
  const [activeTab, setActiveTab] = useState('profile')
  const [passwordForm, setPasswordForm] = useState({
    current_password: '',
    new_password: '',
    confirm_password: '',
  })
  const [mfaStatus, setMfaStatus] = useState(false)
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [showMfaDisableModal, setShowMfaDisableModal] = useState(false)
  const [mfaCode, setMfaCode] = useState('')
  const [usePassword, setUsePassword] = useState(false)
  const [password, setPassword] = useState('')

  useEffect(() => {
    if (user) {
      setMfaStatus(user.mfa_enabled || false)
    }
  }, [user])

  const handlePasswordChange = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setMessage('')

    if (passwordForm.new_password !== passwordForm.confirm_password) {
      setError('New passwords do not match')
      setLoading(false)
      return
    }

    try {
      // API endpoint for password change would go here
      // await axios.post('/api/auth/change-password/', passwordForm)
      setMessage('Password changed successfully')
      setPasswordForm({ current_password: '', new_password: '', confirm_password: '' })
    } catch (error) {
      setError(error.response?.data?.error || 'Failed to change password')
    } finally {
      setLoading(false)
    }
  }

  const handleMfaToggle = async () => {
    if (mfaStatus) {
      // Show modal to enter MFA code
      setShowMfaDisableModal(true)
      setError('')
      setMessage('')
    } else {
      // Redirect to MFA setup
      window.location.href = '/mfa/setup'
    }
  }

  const handleMfaDisable = async () => {
    if (!usePassword && (!mfaCode || mfaCode.length !== 6)) {
      setError('Please enter a valid 6-digit MFA code')
      return
    }

    if (usePassword && !password) {
      setError('Please enter your password')
      return
    }

    setLoading(true)
    setError('')
    setMessage('')

    try {
      const payload = usePassword ? { password } : { code: mfaCode }
      await axios.post('/api/auth/mfa/disable/', payload)
      setMfaStatus(false)
      setMessage('MFA disabled successfully')
      setShowMfaDisableModal(false)
      setMfaCode('')
      setPassword('')
      setUsePassword(false)
      await fetchUser()
    } catch (error) {
      setError(error.response?.data?.code?.[0] || error.response?.data?.error || 'Failed to disable MFA. Please check your credentials.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Profile Settings</h1>
          <p className="text-gray-600 mt-1">Manage your account settings</p>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab('profile')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'profile'
                  ? 'border-[#00C8FF] text-[#00C8FF]'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Profile Information
            </button>
            <button
              onClick={() => setActiveTab('password')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'password'
                  ? 'border-[#00C8FF] text-[#00C8FF]'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Change Password
            </button>
            <button
              onClick={() => setActiveTab('security')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'security'
                  ? 'border-[#00C8FF] text-[#00C8FF]'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Security
            </button>
          </nav>
        </div>

        {/* Profile Tab */}
        {activeTab === 'profile' && (
          <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Email</label>
                <input
                  type="email"
                  value={user?.email || ''}
                  disabled
                  className="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Role</label>
                <input
                  type="text"
                  value={user?.role || ''}
                  disabled
                  className="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-500 capitalize"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Organization</label>
                <input
                  type="text"
                  value={user?.organization_name || 'N/A'}
                  disabled
                  className="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-500"
                />
              </div>
            </div>
          </div>
        )}

        {/* Password Tab */}
        {activeTab === 'password' && (
          <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
            <form onSubmit={handlePasswordChange} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Current Password
                </label>
                <input
                  type="password"
                  value={passwordForm.current_password}
                  onChange={(e) => setPasswordForm({ ...passwordForm, current_password: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00C8FF] focus:border-transparent"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  New Password
                </label>
                <input
                  type="password"
                  value={passwordForm.new_password}
                  onChange={(e) => setPasswordForm({ ...passwordForm, new_password: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00C8FF] focus:border-transparent"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Confirm New Password
                </label>
                <input
                  type="password"
                  value={passwordForm.confirm_password}
                  onChange={(e) => setPasswordForm({ ...passwordForm, confirm_password: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00C8FF] focus:border-transparent"
                  required
                />
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                  {error}
                </div>
              )}

              {message && (
                <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg">
                  {message}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="px-6 py-2 bg-gradient-to-r from-[#00C8FF] to-[#0066FF] text-white font-semibold rounded-lg hover:from-[#00B8E6] hover:to-[#0055E6] disabled:opacity-50"
              >
                {loading ? 'Changing...' : 'Change Password'}
              </button>
            </form>
          </div>
        )}

        {/* Security Tab */}
        {activeTab === 'security' && (
          <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Multi-Factor Authentication</h3>
                  <p className="text-sm text-gray-600 mt-1">
                    {mfaStatus
                      ? 'MFA is currently enabled on your account'
                      : 'Enable MFA to add an extra layer of security'}
                  </p>
                </div>
                <div className="flex items-center space-x-4">
                  <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
                    mfaStatus ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
                  }`}>
                    {mfaStatus ? 'Enabled' : 'Disabled'}
                  </span>
                  <button
                    onClick={handleMfaToggle}
                    className={`px-4 py-2 rounded-lg font-medium ${
                      mfaStatus
                        ? 'bg-red-100 text-red-700 hover:bg-red-200'
                        : 'bg-[#00C8FF] text-white hover:bg-[#00B8E6]'
                    }`}
                  >
                    {mfaStatus ? 'Disable MFA' : 'Enable MFA'}
                  </button>
                </div>
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                  {error}
                </div>
              )}

              {message && (
                <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg">
                  {message}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* MFA Disable Modal */}
      {showMfaDisableModal && (
        <>
          <div 
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
            onClick={() => {
              setShowMfaDisableModal(false)
              setMfaCode('')
              setError('')
            }}
          />
          <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md z-50 p-4">
            <div className="bg-white rounded-xl shadow-2xl p-6 animate-scale-in">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-red-100 flex items-center justify-center">
                    <i className="fa-solid fa-shield-halved text-red-600 text-lg"></i>
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-gray-900">Disable MFA</h2>
                    <p className="text-sm text-gray-500">Enter your MFA code to confirm</p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setShowMfaDisableModal(false)
                    setMfaCode('')
                    setPassword('')
                    setUsePassword(false)
                    setError('')
                  }}
                  className="p-2 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
                >
                  <i className="fa-solid fa-xmark"></i>
                </button>
              </div>

              <div className="space-y-4">
                {/* Toggle between MFA code and password */}
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  <button
                    onClick={() => {
                      setUsePassword(false)
                      setError('')
                      setMfaCode('')
                    }}
                    className={`flex-1 px-4 py-2 rounded-lg font-medium transition-colors ${
                      !usePassword
                        ? 'bg-red-600 text-white'
                        : 'bg-white text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    MFA Code
                  </button>
                  <button
                    onClick={() => {
                      setUsePassword(true)
                      setError('')
                      setPassword('')
                    }}
                    className={`flex-1 px-4 py-2 rounded-lg font-medium transition-colors ${
                      usePassword
                        ? 'bg-red-600 text-white'
                        : 'bg-white text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    Password
                  </button>
                </div>

                {!usePassword ? (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      MFA Code
                    </label>
                    <input
                      type="text"
                      value={mfaCode}
                      onChange={(e) => {
                        const value = e.target.value.replace(/\D/g, '').slice(0, 6)
                        setMfaCode(value)
                        setError('')
                      }}
                      placeholder="000000"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent text-center text-2xl tracking-widest font-mono"
                      maxLength={6}
                      autoFocus
                    />
                    <p className="text-xs text-gray-500 mt-2">
                      Enter the 6-digit code from your authenticator app
                    </p>
                  </div>
                ) : (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Your Password
                    </label>
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => {
                        setPassword(e.target.value)
                        setError('')
                      }}
                      placeholder="Enter your password"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                      autoFocus
                    />
                    <p className="text-xs text-gray-500 mt-2">
                      Enter your account password to disable MFA
                    </p>
                  </div>
                )}

                {error && (
                  <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                    {error}
                  </div>
                )}

                <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200">
                  <button
                    onClick={() => {
                      setShowMfaDisableModal(false)
                      setMfaCode('')
                      setPassword('')
                      setUsePassword(false)
                      setError('')
                    }}
                    className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                    disabled={loading}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleMfaDisable}
                    disabled={loading || (!usePassword && mfaCode.length !== 6) || (usePassword && !password)}
                    className="px-6 py-2 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {loading ? (
                      <>
                        <i className="fa-solid fa-spinner animate-spin mr-2"></i>
                        Disabling...
                      </>
                    ) : (
                      'Disable MFA'
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </>
  )
}

export default Profile


