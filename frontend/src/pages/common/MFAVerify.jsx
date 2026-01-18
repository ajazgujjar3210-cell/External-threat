import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import axios from 'axios'

const MFAVerify = () => {
  const [code, setCode] = useState('')
  const [backupCode, setBackupCode] = useState('')
  const [useBackup, setUseBackup] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { user, fetchUser } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const response = await axios.post('/api/auth/login/', {
        email: user?.email,
        password: '', // Password already verified
        code: useBackup ? backupCode : code,
      })

      if (response.data.access) {
        localStorage.setItem('access_token', response.data.access)
        localStorage.setItem('refresh_token', response.data.refresh)
        axios.defaults.headers.common['Authorization'] = `Bearer ${response.data.access}`
        await fetchUser()
        
        // Redirect based on role
        if (user?.role === 'super_admin') {
          navigate('/super-admin')
        } else {
          navigate('/org/dashboard')
        }
      }
    } catch (error) {
      setError(error.response?.data?.error || 'Invalid MFA code')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <div className="bg-white rounded-xl shadow-2xl p-8 max-w-md w-full">
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[#00C8FF] to-[#0066FF] flex items-center justify-center mx-auto mb-4">
            <i className="fas fa-shield-alt text-white text-2xl"></i>
          </div>
          <h2 className="text-2xl font-bold text-gray-900">MFA Verification</h2>
          <p className="text-gray-600 mt-2">Enter your authentication code</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {!useBackup ? (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                6-Digit Code
              </label>
              <input
                type="text"
                maxLength={6}
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00C8FF] focus:border-transparent text-center text-2xl tracking-widest"
                placeholder="000000"
                required
              />
            </div>
          ) : (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Backup Code
              </label>
              <input
                type="text"
                value={backupCode}
                onChange={(e) => setBackupCode(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00C8FF] focus:border-transparent"
                placeholder="Enter backup code"
                required
              />
            </div>
          )}

          <button
            type="button"
            onClick={() => setUseBackup(!useBackup)}
            className="text-sm text-[#00C8FF] hover:underline"
          >
            {useBackup ? 'Use OTP code instead' : 'Use backup code instead'}
          </button>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading || (!code && !backupCode)}
            className="w-full px-6 py-3 bg-gradient-to-r from-[#00C8FF] to-[#0066FF] text-white font-semibold rounded-lg hover:from-[#00B8E6] hover:to-[#0055E6] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Verifying...' : 'Verify'}
          </button>
        </form>
      </div>
    </div>
  )
}

export default MFAVerify


