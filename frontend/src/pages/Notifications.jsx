import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'
import Layout from '../components/Layout'

const Notifications = () => {
  const [notifications, setNotifications] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all') // 'all', 'unread', 'read'
  const navigate = useNavigate()

  useEffect(() => {
    fetchNotifications()
  }, [filter])

  const fetchNotifications = async () => {
    try {
      setLoading(true)
      const params = {}
      if (filter === 'unread') {
        params.is_read = false
      } else if (filter === 'read') {
        params.is_read = true
      }

      const response = await axios.get('/api/assets/notifications/', { params })
      setNotifications(response.data.results || response.data)
    } catch (error) {
      console.error('Error fetching notifications:', error)
    } finally {
      setLoading(false)
    }
  }

  const markAsRead = async (notificationId) => {
    try {
      await axios.post(`/api/assets/notifications/${notificationId}/read/`)
      setNotifications((prev) =>
        prev.map((notif) =>
          notif.id === notificationId ? { ...notif, is_read: true } : notif
        )
      )
    } catch (error) {
      console.error('Error marking notification as read:', error)
    }
  }

  const markAllAsRead = async () => {
    try {
      await axios.post('/api/assets/notifications/mark-all-read/')
      setNotifications((prev) => prev.map((notif) => ({ ...notif, is_read: true })))
    } catch (error) {
      console.error('Error marking all as read:', error)
    }
  }

  const formatDate = (dateString) => {
    const date = new Date(dateString)
    return date.toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const getChangeTypeColor = (changeType) => {
    const colors = {
      port: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
      service: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
      header: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
      certificate: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
      subdomain: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200',
      ip: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
      metadata: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200',
    }
    return colors[changeType] || colors.metadata
  }

  const unreadCount = notifications.filter((n) => !n.is_read).length

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Notifications
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              Stay updated with asset changes and alerts
            </p>
          </div>
          {unreadCount > 0 && (
            <button
              onClick={markAllAsRead}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Mark All as Read
            </button>
          )}
        </div>

        {/* Filters */}
        <div className="flex space-x-2">
          <button
            onClick={() => setFilter('all')}
            className={`px-4 py-2 rounded-lg transition-colors ${
              filter === 'all'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
            }`}
          >
            All ({notifications.length})
          </button>
          <button
            onClick={() => setFilter('unread')}
            className={`px-4 py-2 rounded-lg transition-colors ${
              filter === 'unread'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
            }`}
          >
            Unread ({unreadCount})
          </button>
          <button
            onClick={() => setFilter('read')}
            className={`px-4 py-2 rounded-lg transition-colors ${
              filter === 'read'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
            }`}
          >
            Read ({notifications.length - unreadCount})
          </button>
        </div>

        {/* Notifications List */}
        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <p className="mt-4 text-gray-600 dark:text-gray-400">Loading notifications...</p>
          </div>
        ) : notifications.length === 0 ? (
          <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-lg shadow">
            <i className="fas fa-bell-slash text-4xl text-gray-400 mb-4"></i>
            <p className="text-gray-600 dark:text-gray-400">
              {filter === 'unread'
                ? 'No unread notifications'
                : filter === 'read'
                ? 'No read notifications'
                : 'No notifications yet'}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {notifications.map((notification) => (
              <div
                key={notification.id}
                className={`bg-white dark:bg-gray-800 rounded-lg shadow p-6 border-l-4 ${
                  notification.is_read
                    ? 'border-gray-300 dark:border-gray-600'
                    : 'border-blue-600'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <span
                        className={`px-2 py-1 rounded text-xs font-semibold ${getChangeTypeColor(
                          notification.change_type
                        )}`}
                      >
                        {notification.change_type?.toUpperCase() || 'CHANGE'}
                      </span>
                      {!notification.is_read && (
                        <span className="w-2 h-2 bg-blue-600 rounded-full"></span>
                      )}
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
                      {notification.title || 'Asset Change Detected'}
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400 mb-3">
                      {notification.message}
                    </p>
                    <div className="flex items-center space-x-4 text-sm text-gray-500 dark:text-gray-400">
                      <span>
                        <i className="fas fa-clock mr-1"></i>
                        {formatDate(notification.created_at)}
                      </span>
                      {notification.asset && (
                        <button
                          onClick={() => navigate(`/org/assets/${notification.asset}`)}
                          className="text-blue-600 dark:text-blue-400 hover:underline"
                        >
                          <i className="fas fa-external-link-alt mr-1"></i>
                          View Asset
                        </button>
                      )}
                    </div>
                  </div>
                  {!notification.is_read && (
                    <button
                      onClick={() => markAsRead(notification.id)}
                      className="ml-4 px-3 py-1 text-sm bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                    >
                      Mark as Read
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </Layout>
  )
}

export default Notifications

