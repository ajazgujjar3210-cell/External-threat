import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import axios from 'axios'
import { useAuth } from '../contexts/AuthContext'

const InviteAccept = () => {
  const { token } = useParams()
  const navigate = useNavigate()
  const { fetchUser } = useAuth()
  const [loading, setLoading] = useState(true)
  const [invitation, setInvitation] = useState(null)
  const [error, setError] = useState(null)
  const [step, setStep] = useState('password') // 'password', 'mfa', 'complete'
  const [formData, setFormData] = useState({
    password: '',
    password_confirm: '',
    mfa_code: '',
  })
  const [mfaSetup, setMfaSetup] = useState(null)
  const [recoveryCodes, setRecoveryCodes] = useState(null)

  useEffect(() => {
    if (token) {
      fetchInvitation()
    }
  }, [token])

  const fetchInvitation = async () => {
    try {
      const response = await axios.get(`/api/auth/invite/accept/?token=${token}`)
      setInvitation(response.data)
      setError(null)
    } catch (err) {
      setError(err.response?.data?.error || 'Invalid or expired invitation')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(null)

    if (step === 'password') {
      if (formData.password !== formData.password_confirm) {
        setError('Passwords do not match')
        return
      }
      if (formData.password.length < 8) {
        setError('Password must be at least 8 characters')
        return
      }
    }

    try {
      const response = await axios.post('/api/auth/invite/accept/', {
        token: token,
        password: formData.password,
        password_confirm: formData.password_confirm,
        mfa_code: formData.mfa_code || '',
      })

      if (response.data.mfa_required && !response.data.access) {
        // MFA setup required
        setMfaSetup(response.data.mfa_setup)
        setStep('mfa')
      } else if (response.data.recovery_codes) {
        // MFA enabled, show recovery codes
        setRecoveryCodes(response.data.recovery_codes)
        setStep('complete')
        // Save auth tokens
        if (response.data.access) {
          localStorage.setItem('access_token', response.data.access)
          localStorage.setItem('refresh_token', response.data.refresh)
          axios.defaults.headers.common['Authorization'] = `Bearer ${response.data.access}`
          await fetchUser()
        }
      } else {
        // Account created successfully
        setStep('complete')
        if (response.data.access) {
          localStorage.setItem('access_token', response.data.access)
          localStorage.setItem('refresh_token', response.data.refresh)
          axios.defaults.headers.common['Authorization'] = `Bearer ${response.data.access}`
          await fetchUser()
        }
      }
    } catch (err) {
      setError(err.response?.data?.error || err.response?.data?.message || 'Failed to accept invitation')
      if (err.response?.data?.mfa_setup) {
        setMfaSetup(err.response.data.mfa_setup)
        setStep('mfa')
      }
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-purple-50">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-blue-600 border-t-transparent"></div>
          <p className="mt-4 text-gray-600">Loading invitation...</p>
        </div>
      </div>
    )
  }

  if (error && !invitation) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-purple-50">
        <div className="bg-white rounded-xl shadow-2xl p-8 max-w-md w-full mx-4">
          <div className="text-center">
            <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
              <i className="fas fa-exclamation-triangle text-red-600 text-2xl"></i>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Invalid Invitation</h2>
            <p className="text-gray-600 mb-6">{error}</p>
            <button
              onClick={() => navigate('/login')}
              className="px-6 py-2 bg-gradient-to-r from-blue-900 to-purple-600 text-white rounded-lg hover:from-blue-800 hover:to-purple-700"
            >
              Go to Login
            </button>
          </div>
        </div>
      </div>
    )
  }

  if (step === 'complete') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-purple-50">
        <div className="bg-white rounded-xl shadow-2xl p-8 max-w-md w-full mx-4">
          <div className="text-center">
            <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
              <i className="fas fa-check text-green-600 text-2xl"></i>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Account Created Successfully!</h2>
            <p className="text-gray-600 mb-6">
              Your account has been set up. You can now access the platform.
            </p>
            
            {recoveryCodes && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6 text-left">
                <p className="text-sm font-semibold text-yellow-800 mb-2">
                  <i className="fas fa-exclamation-triangle mr-2"></i>
                  Save these recovery codes:
                </p>
                <div className="bg-white rounded p-3 font-mono text-xs space-y-1">
                  {recoveryCodes.map((code, idx) => (
                    <div key={idx}>{code}</div>
                  ))}
                </div>
                <p className="text-xs text-yellow-700 mt-2">
                  Store these codes in a safe place. You'll need them if you lose access to your MFA device.
                </p>
              </div>
            )}
            
            <button
              onClick={() => navigate('/dashboard')}
              className="px-6 py-2 bg-gradient-to-r from-blue-900 to-purple-600 text-white rounded-lg hover:from-blue-800 hover:to-purple-700"
            >
              Go to Dashboard
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-purple-50 py-12 px-4">
      <div className="bg-white rounded-xl shadow-2xl p-8 max-w-md w-full">
        <div className="text-center mb-6">
          <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center mx-auto mb-4">
            <i className="fas fa-user-plus text-blue-600 text-2xl"></i>
          </div>
          <h2 className="text-2xl font-bold text-gray-900">Set Up Your Account</h2>
          <p className="text-gray-600 mt-2">
            {invitation?.organization_name && (
              <>Welcome to <strong>{invitation.organization_name}</strong></>
            )}
          </p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
            <p className="text-sm text-red-800">{error}</p>
          </div>
        )}

        {step === 'password' && (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email
              </label>
              <input
                type="email"
                value={invitation?.email || ''}
                disabled
                className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-600"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Password *
              </label>
              <input
                type="password"
                required
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter your password"
                minLength={8}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Confirm Password *
              </label>
              <input
                type="password"
                required
                value={formData.password_confirm}
                onChange={(e) => setFormData({ ...formData, password_confirm: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Confirm your password"
                minLength={8}
              />
            </div>

            <button
              type="submit"
              className="w-full px-6 py-3 bg-gradient-to-r from-blue-900 to-purple-600 text-white font-semibold rounded-lg hover:from-blue-800 hover:to-purple-700 transition-all duration-200"
            >
              Continue
            </button>
          </form>
        )}

        {step === 'mfa' && mfaSetup && (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
              <p className="text-sm text-blue-800 mb-3">
                <strong>MFA is required</strong> for your organization. Please scan the QR code with your authenticator app and enter the code.
              </p>
              <div className="text-center">
                <img
                  src={mfaSetup.qr_code}
                  alt="MFA QR Code"
                  className="mx-auto border-2 border-gray-200 rounded-lg"
                />
              </div>
              <p className="text-xs text-blue-700 mt-2 text-center">
                Secret: <code className="bg-white px-2 py-1 rounded">{mfaSetup.secret}</code>
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                MFA Code *
              </label>
              <input
                type="text"
                required
                value={formData.mfa_code}
                onChange={(e) => setFormData({ ...formData, mfa_code: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-center text-2xl tracking-widest"
                placeholder="000000"
                maxLength={6}
                pattern="[0-9]{6}"
              />
              <p className="text-xs text-gray-500 mt-1">
                Enter the 6-digit code from your authenticator app
              </p>
            </div>

            <button
              type="submit"
              className="w-full px-6 py-3 bg-gradient-to-r from-blue-900 to-purple-600 text-white font-semibold rounded-lg hover:from-blue-800 hover:to-purple-700 transition-all duration-200"
            >
              Complete Setup
            </button>
          </form>
        )}
      </div>
    </div>
  )
}

export default InviteAccept

