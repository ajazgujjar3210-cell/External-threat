import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import axios from 'axios'

const MFASetup = () => {
  const [qrCode, setQrCode] = useState('')
  const [secret, setSecret] = useState('')
  const [verificationCode, setVerificationCode] = useState('')
  const [recoveryCodes, setRecoveryCodes] = useState([])
  const [step, setStep] = useState('qr') // qr, verify, codes
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { user } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    fetchQRCode()
  }, [])

  const fetchQRCode = async () => {
    try {
      const response = await axios.get('/api/auth/mfa/setup/')
      setQrCode(response.data.qr_code)
      setSecret(response.data.secret)
    } catch (error) {
      setError('Failed to load MFA setup')
    }
  }

  const handleVerify = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const response = await axios.post('/api/auth/mfa/setup/', {
        code: verificationCode,
      })
      
      if (response.data.recovery_codes) {
        setRecoveryCodes(response.data.recovery_codes)
        setStep('codes')
      }
    } catch (error) {
      setError(error.response?.data?.error || 'Invalid verification code')
    } finally {
      setLoading(false)
    }
  }

  const handleContinue = () => {
    navigate('/org/dashboard')
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <div className="bg-white rounded-xl shadow-2xl p-8 max-w-md w-full">
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[#00C8FF] to-[#0066FF] flex items-center justify-center mx-auto mb-4">
            <i className="fas fa-shield-alt text-white text-2xl"></i>
          </div>
          <h2 className="text-2xl font-bold text-gray-900">Setup MFA</h2>
          <p className="text-gray-600 mt-2">Secure your account with two-factor authentication</p>
        </div>

        {step === 'qr' && (
          <div className="space-y-6">
            <div className="text-center">
              <p className="text-sm text-gray-600 mb-4">
                Scan this QR code with your authenticator app (Google Authenticator, Microsoft Authenticator, etc.)
              </p>
              {qrCode && (
                <div className="bg-white p-4 rounded-lg inline-block">
                  <img src={qrCode} alt="QR Code" className="w-48 h-48" />
                </div>
              )}
              {secret && (
                <div className="mt-4">
                  <p className="text-xs text-gray-500 mb-2">Or enter this code manually:</p>
                  <code className="bg-gray-100 px-3 py-2 rounded text-sm font-mono">{secret}</code>
                </div>
              )}
            </div>
            <button
              onClick={() => setStep('verify')}
              className="w-full px-6 py-3 bg-gradient-to-r from-[#00C8FF] to-[#0066FF] text-white font-semibold rounded-lg hover:from-[#00B8E6] hover:to-[#0055E6]"
            >
              I've scanned the code
            </button>
          </div>
        )}

        {step === 'verify' && (
          <form onSubmit={handleVerify} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Enter verification code
              </label>
              <input
                type="text"
                maxLength={6}
                value={verificationCode}
                onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, ''))}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00C8FF] focus:border-transparent text-center text-2xl tracking-widest"
                placeholder="000000"
                required
              />
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading || verificationCode.length !== 6}
              className="w-full px-6 py-3 bg-gradient-to-r from-[#00C8FF] to-[#0066FF] text-white font-semibold rounded-lg hover:from-[#00B8E6] hover:to-[#0055E6] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Verifying...' : 'Verify & Enable MFA'}
            </button>
          </form>
        )}

        {step === 'codes' && (
          <div className="space-y-6">
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <p className="text-sm text-yellow-800 font-semibold mb-2">
                ⚠️ Save these recovery codes!
              </p>
              <p className="text-xs text-yellow-700">
                These codes can be used to access your account if you lose your authenticator device.
                Store them in a safe place.
              </p>
            </div>

            <div className="bg-gray-50 rounded-lg p-4">
              <div className="grid grid-cols-2 gap-2">
                {recoveryCodes.map((code, index) => (
                  <code key={index} className="text-sm font-mono bg-white px-2 py-1 rounded text-center">
                    {code}
                  </code>
                ))}
              </div>
            </div>

            <button
              onClick={handleContinue}
              className="w-full px-6 py-3 bg-gradient-to-r from-[#00C8FF] to-[#0066FF] text-white font-semibold rounded-lg hover:from-[#00B8E6] hover:to-[#0055E6]"
            >
              Continue to Dashboard
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

export default MFASetup


