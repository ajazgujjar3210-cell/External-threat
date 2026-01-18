import { useState, useEffect } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { useTheme } from '../contexts/ThemeContext'
import axios from 'axios'

const Layout = ({ children }) => {
  const { user, logout } = useAuth()
  const { theme, toggleTheme } = useTheme()
  const location = useLocation()
  const navigate = useNavigate()
  const [showNotificationDropdown, setShowNotificationDropdown] = useState(false)
  const [showProfileDropdown, setShowProfileDropdown] = useState(false)
  const [notifications, setNotifications] = useState([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [loadingNotifications, setLoadingNotifications] = useState(false)

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const isActive = (path) => location.pathname === path

  // Get user display name
  const getUserDisplayName = () => {
    if (user?.first_name && user?.last_name) {
      return `${user.first_name} ${user.last_name}`
    } else if (user?.first_name) {
      return user.first_name
    } else if (user?.last_name) {
      return user.last_name
    } else if (user?.email) {
      return user.email.split('@')[0]
    }
    return 'User'
  }

  // Fetch notifications
  useEffect(() => {
    fetchNotifications()
    const interval = setInterval(fetchNotifications, 30000) // Refresh every 30 seconds
    return () => clearInterval(interval)
  }, [])

  const fetchNotifications = async () => {
    try {
      setLoadingNotifications(true)
      const response = await axios.get('/api/assets/notifications/unread-count/')
      setUnreadCount(response.data.count || 0)

      // Fetch latest 5 notifications for dropdown
      const notifResponse = await axios.get('/api/assets/notifications/', {
        params: { limit: 5 },
      })
      setNotifications(notifResponse.data.results || notifResponse.data.slice(0, 5) || [])
    } catch (error) {
      console.error('Error fetching notifications:', error)
    } finally {
      setLoadingNotifications(false)
    }
  }

  const getNavItems = () => {
    if (user?.role === 'super_admin') {
      return {
        sections: [
          {
            title: 'Overview',
            items: [
              { path: '/super-admin', label: 'Dashboard', icon: 'fa-chart-pie' },
            ],
          },
          {
            title: 'Management',
            items: [
              { path: '/organizations', label: 'Organizations', icon: 'fa-building' },
            ],
          },
        ],
      }
    } else if (user?.role === 'viewer') {
      return {
        sections: [
          {
            title: 'Overview',
            items: [
              { path: '/viewer/dashboard', label: 'Dashboard', icon: 'fa-chart-pie' },
            ],
          },
          {
            title: 'Assets',
            items: [
              { path: '/viewer/assets/inventory', label: 'Assets', icon: 'fa-network-wired' },
            ],
          },
          {
            title: 'Security',
            items: [
              { path: '/viewer/risk/summary', label: 'Risks', icon: 'fa-exclamation-triangle' },
            ],
          },
          {
            title: 'Management',
            items: [
              { path: '/viewer/reports/generate', label: 'Reports', icon: 'fa-file-alt' },
            ],
          },
        ],
      }
    } else if (user?.role === 'org_admin') {
      return {
        sections: [
          {
            title: 'Overview',
            items: [
              { path: '/org/dashboard', label: 'Dashboard', icon: 'fa-chart-pie' },
            ],
          },
          {
            title: 'Assets',
            items: [
              { path: '/org/assets/inventory', label: 'Assets', icon: 'fa-network-wired' },
              { path: '/org/asset-discovery', label: 'Asset Discovery', icon: 'fa-search' },
            ],
          },
          {
            title: 'Security',
            items: [
              { path: '/org/security-scans', label: 'Security Scans', icon: 'fa-shield-alt' },
              { path: '/org/vulnerabilities/all', label: 'Vulnerabilities', icon: 'fa-bug' },
              { path: '/org/risk/prioritization', label: 'Risks', icon: 'fa-exclamation-triangle' },
              { path: '/org/assets/changes', label: 'Change Log', icon: 'fa-history' },
            ],
          },
          {
            title: 'Management',
            items: [
              { path: '/org/reports/generate', label: 'Reports', icon: 'fa-file-alt' },
              { path: '/org/users/list', label: 'Users', icon: 'fa-users' },
            ],
          },
        ],
      }
    } else if (user?.role === 'user' || user?.role === 'security_analyst') {
      return {
        sections: [
          {
            title: 'Overview',
            items: [
              { path: '/app/dashboard', label: 'Dashboard', icon: 'fa-chart-pie' },
            ],
          },
          {
            title: 'Assets',
            items: [
              { path: '/app/assets/inventory', label: 'Assets', icon: 'fa-network-wired' },
              { path: '/org/asset-discovery', label: 'Asset Discovery', icon: 'fa-search' },
            ],
          },
          {
            title: 'Security',
            items: [
              { path: '/org/security-scans', label: 'Security Scans', icon: 'fa-shield-alt' },
              { path: '/app/vulnerabilities/all', label: 'Vulnerabilities', icon: 'fa-bug' },
              { path: '/app/risk/prioritization', label: 'Risks', icon: 'fa-exclamation-triangle' },
              { path: '/org/assets/changes', label: 'Change Log', icon: 'fa-history' },
            ],
          },
          {
            title: 'Management',
            items: [
              { path: '/app/reports/generate', label: 'Reports', icon: 'fa-file-alt' },
            ],
          },
        ],
      }
    } else {
      return {
        sections: [
          {
            title: 'Overview',
            items: [
              { path: '/dashboard', label: 'Dashboard', icon: 'fa-chart-pie' },
              { path: '/assets', label: 'Assets', icon: 'fa-network-wired' },
            ],
          },
        ],
      }
    }
  }

  const navItems = getNavItems()

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 transition-colors">
      {/* Sidebar */}
      <div className="fixed inset-y-0 left-0 w-64 bg-white dark:bg-gray-800 shadow-lg z-30 transition-colors">
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="flex items-center justify-center h-16 bg-gradient-to-r from-[#00C8FF] to-[#0066FF]">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-lg bg-white/20 flex items-center justify-center">
                <i className="fas fa-shield-alt text-white text-xl"></i>
              </div>
              <span className="text-white font-bold text-lg">EASM Platform</span>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 py-6 space-y-6 overflow-y-auto">
            {navItems.sections.map((section, sectionIndex) => (
              <div key={sectionIndex} className="space-y-2">
                <h3 className="px-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  {section.title}
                </h3>
                <div className="space-y-1">
                  {section.items.map((item) => (
                    <Link
                      key={item.path}
                      to={item.path}
                      className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-all duration-200 ${
                        isActive(item.path)
                          ? 'bg-gradient-to-r from-[#00C8FF] to-[#0066FF] text-white shadow-lg'
                          : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                      }`}
                    >
                      <i className={`fas ${item.icon} w-5`}></i>
                      <span className="font-medium">{item.label}</span>
                    </Link>
                  ))}
                </div>
              </div>
            ))}
          </nav>

          {/* Logout at bottom */}
          <div className="p-4 border-t border-gray-200 dark:border-gray-700">
            <button
              onClick={handleLogout}
              className="w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            >
              <i className="fas fa-sign-out-alt w-5"></i>
              <span className="font-medium">Logout</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="pl-64">
        {/* Header */}
        <header className="sticky top-0 z-20 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 shadow-sm transition-colors">
          <div className="px-8 py-4 flex items-center justify-between">
            <div className="flex-1">
              {/* Page title can go here if needed */}
            </div>
            <div className="flex items-center space-x-4">
              {/* Theme Toggle */}
              <button
                onClick={toggleTheme}
                className="p-2 rounded-lg text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                title={theme === 'light' ? 'Switch to dark mode' : 'Switch to light mode'}
              >
                {theme === 'light' ? (
                  <i className="fas fa-moon text-xl"></i>
                ) : (
                  <i className="fas fa-sun text-xl"></i>
                )}
              </button>

              {/* Notification Icon */}
              <div className="relative">
                <button
                  onClick={() => setShowNotificationDropdown(!showNotificationDropdown)}
                  className="relative p-2 rounded-lg text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                  title="Notifications"
                >
                  <i className="fas fa-bell text-xl"></i>
                  {unreadCount > 0 && (
                    <span className="absolute top-0 right-0 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                  )}
                </button>

                {/* Notification Dropdown */}
                {showNotificationDropdown && (
                  <>
                    <div
                      className="fixed inset-0 z-10"
                      onClick={() => setShowNotificationDropdown(false)}
                    ></div>
                    <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 z-20 max-h-96 overflow-y-auto">
                      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                        <h3 className="font-semibold text-gray-900 dark:text-white">
                          Notifications
                        </h3>
                      </div>
                      <div className="max-h-64 overflow-y-auto">
                        {loadingNotifications ? (
                          <div className="p-4 text-center text-gray-500 dark:text-gray-400">
                            Loading...
                          </div>
                        ) : notifications.length === 0 ? (
                          <div className="p-4 text-center text-gray-500 dark:text-gray-400">
                            No notifications
                          </div>
                        ) : (
                          notifications.map((notification) => (
                            <div
                              key={notification.id}
                              className="p-4 border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer"
                              onClick={() => {
                                navigate('/notifications')
                                setShowNotificationDropdown(false)
                              }}
                            >
                              <div className="flex items-start space-x-3">
                                <div
                                  className={`w-2 h-2 rounded-full mt-2 ${
                                    notification.is_read
                                      ? 'bg-gray-300 dark:bg-gray-600'
                                      : 'bg-blue-600'
                                  }`}
                                ></div>
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                                    {notification.title || 'Asset Change Detected'}
                                  </p>
                                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 line-clamp-2">
                                    {notification.message}
                                  </p>
                                  <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                                    {new Date(notification.created_at).toLocaleString()}
                                  </p>
                                </div>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                      <div className="p-4 border-t border-gray-200 dark:border-gray-700">
                        <button
                          onClick={() => {
                            navigate('/notifications')
                            setShowNotificationDropdown(false)
                          }}
                          className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                        >
                          View All Notifications
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>

              {/* Profile Dropdown */}
              <div className="relative">
                <button
                  onClick={() => setShowProfileDropdown(!showProfileDropdown)}
                  className="flex items-center space-x-2 p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                >
                  <div className="w-10 h-10 rounded-full bg-gradient-to-r from-[#00C8FF] to-[#0066FF] flex items-center justify-center">
                    <i className="fas fa-user text-white"></i>
                  </div>
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300 hidden md:block">
                    {getUserDisplayName()}
                  </span>
                  <i className="fas fa-chevron-down text-xs text-gray-500 dark:text-gray-400"></i>
                </button>

                {/* Profile Dropdown Menu */}
                {showProfileDropdown && (
                  <>
                    <div
                      className="fixed inset-0 z-10"
                      onClick={() => setShowProfileDropdown(false)}
                    ></div>
                    <div className="absolute right-0 mt-2 w-64 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 z-20">
                      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                        <p className="font-semibold text-gray-900 dark:text-white">
                          {getUserDisplayName()}
                        </p>
                        <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
                          {user?.email}
                        </p>
                        <p className="text-xs text-gray-400 dark:text-gray-500 mt-1 capitalize">
                          {user?.role?.replace('_', ' ')}
                        </p>
                      </div>
                      <div className="py-2">
                        <button
                          onClick={() => {
                            navigate('/profile')
                            setShowProfileDropdown(false)
                          }}
                          className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors flex items-center space-x-2"
                        >
                          <i className="fas fa-user w-4"></i>
                          <span>View Profile</span>
                        </button>
                        <button
                          onClick={handleLogout}
                          className="w-full text-left px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors flex items-center space-x-2"
                        >
                          <i className="fas fa-sign-out-alt w-4"></i>
                          <span>Logout</span>
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="p-8">{children}</main>
      </div>
    </div>
  )
}

export default Layout
