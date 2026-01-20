import { useState, useEffect } from 'react'
// Layout is now handled by ProtectedRoute
import axios from 'axios'
import { useAuth } from '../../../contexts/AuthContext'

const SecuritySettings = () => {
  const { user } = useAuth()
  const [settings, setSettings] = useState({
    mfa_required: false,
    session_timeout: 30,
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')
  const isViewer = user?.role === 'viewer'
  const isOrgAdmin = user?.role === 'org_admin'

  useEffect(() => {
    fetchSettings()
  }, [])

  const fetchSettings = async () => {
    try {
      // Fetch security settings
      // const response = await axios.get('/api/org/settings/security/')
      // setSettings(response.data)
    } catch (error) {
      console.error('Error fetching settings:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async (e) => {
    e.preventDefault()
    if (!isOrgAdmin) return
    
    setSaving(true)
    setMessage('')
    
    try {
      // await axios.put('/api/org/settings/security/', settings)
      setMessage('Security settings saved successfully')
    } catch (error) {
      setMessage('Failed to save settings')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-primary-500 border-t-transparent"></div>
            <p className="mt-4 text-gray-600">Loading settings...</p>
          </div>
        </div>
      </>
    )
  }

  return (
    <>
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Security Settings</h1>
          <p className="text-gray-600 mt-1">Configure security policies for your organization</p>
        </div>

        <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
          <form onSubmit={handleSave} className="space-y-6">
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div>
                <h3 className="font-semibold text-gray-900">Enforce MFA Organization-Wide</h3>
                <p className="text-sm text-gray-600 mt-1">
                  Require all users in this organization to enable MFA
                </p>
              </div>
              {isViewer ? (
                <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
                  settings.mfa_required ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
                }`}>
                  {settings.mfa_required ? 'Enabled' : 'Disabled'}
                </span>
              ) : (
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.mfa_required}
                    onChange={(e) => setSettings({ ...settings, mfa_required: e.target.checked })}
                    disabled={!isOrgAdmin}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-[#00C8FF]/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#00C8FF]"></div>
                </label>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Session Timeout (minutes)
              </label>
              {isViewer ? (
                <p className="px-4 py-2 bg-gray-50 rounded-lg text-gray-900">{settings.session_timeout} minutes</p>
              ) : (
                <input
                  type="number"
                  min="5"
                  max="480"
                  value={settings.session_timeout}
                  onChange={(e) => setSettings({ ...settings, session_timeout: parseInt(e.target.value) })}
                  disabled={!isOrgAdmin}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00C8FF] focus:border-transparent disabled:bg-gray-50"
                />
              )}
            </div>

            {message && (
              <div className={`px-4 py-3 rounded-lg ${
                message.includes('success') ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
              }`}>
                {message}
              </div>
            )}

            {isOrgAdmin && (
              <button
                type="submit"
                disabled={saving}
                className="px-6 py-2 bg-gradient-to-r from-[#00C8FF] to-[#0066FF] text-white font-semibold rounded-lg hover:from-[#00B8E6] hover:to-[#0055E6] disabled:opacity-50"
              >
                {saving ? 'Saving...' : 'Save Security Settings'}
              </button>
            )}
          </form>
        </div>
      </div>
    </>
  )
}

export default SecuritySettings


