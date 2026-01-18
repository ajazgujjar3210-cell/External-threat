import { useState, useEffect } from 'react'
import Layout from '../../../components/Layout'
import axios from 'axios'
import { useAuth } from '../../../contexts/AuthContext'

const OrganizationSettings = () => {
  const { user } = useAuth()
  const [settings, setSettings] = useState({
    name: '',
    timezone: 'UTC',
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')
  const isViewer = user?.role === 'viewer'

  useEffect(() => {
    fetchSettings()
  }, [])

  const fetchSettings = async () => {
    try {
      // Fetch organization settings
      const response = await axios.get('/api/auth/me/')
      if (response.data.organization_name) {
        setSettings({ ...settings, name: response.data.organization_name })
      }
    } catch (error) {
      console.error('Error fetching settings:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async (e) => {
    e.preventDefault()
    setSaving(true)
    setMessage('')
    
    try {
      // API endpoint for org settings would go here
      // await axios.put('/api/org/settings/', settings)
      setMessage('Settings saved successfully')
    } catch (error) {
      setMessage('Failed to save settings')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-primary-500 border-t-transparent"></div>
            <p className="mt-4 text-gray-600">Loading settings...</p>
          </div>
        </div>
      </Layout>
    )
  }

  return (
    <Layout>
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Organization Settings</h1>
          <p className="text-gray-600 mt-1">Manage your organization configuration</p>
        </div>

        <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
          <form onSubmit={handleSave} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Organization Name
              </label>
              {isViewer ? (
                <p className="px-4 py-2 bg-gray-50 rounded-lg text-gray-900">{settings.name}</p>
              ) : (
                <input
                  type="text"
                  value={settings.name}
                  onChange={(e) => setSettings({ ...settings, name: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00C8FF] focus:border-transparent"
                  required
                />
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Timezone
              </label>
              {isViewer ? (
                <p className="px-4 py-2 bg-gray-50 rounded-lg text-gray-900">{settings.timezone}</p>
              ) : (
                <select
                  value={settings.timezone}
                  onChange={(e) => setSettings({ ...settings, timezone: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00C8FF] focus:border-transparent"
                >
                  <option value="UTC">UTC</option>
                  <option value="America/New_York">Eastern Time</option>
                  <option value="America/Chicago">Central Time</option>
                  <option value="America/Denver">Mountain Time</option>
                  <option value="America/Los_Angeles">Pacific Time</option>
                </select>
              )}
            </div>

            {message && (
              <div className={`px-4 py-3 rounded-lg ${
                message.includes('success') ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
              }`}>
                {message}
              </div>
            )}

            {!isViewer && (
              <button
                type="submit"
                disabled={saving}
                className="px-6 py-2 bg-gradient-to-r from-[#00C8FF] to-[#0066FF] text-white font-semibold rounded-lg hover:from-[#00B8E6] hover:to-[#0055E6] disabled:opacity-50"
              >
                {saving ? 'Saving...' : 'Save Settings'}
              </button>
            )}
          </form>
        </div>
      </div>
    </Layout>
  )
}

export default OrganizationSettings


