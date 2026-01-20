import { useState, useEffect, useRef } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { useTheme } from '../contexts/ThemeContext'
import axios from 'axios'

const Layout = ({ children }) => {
  const { user, logout } = useAuth()
  const { theme, toggleTheme } = useTheme()
  const location = useLocation()
  const navigate = useNavigate()
  
  // State
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [showNotificationDropdown, setShowNotificationDropdown] = useState(false)
  const [showProfileDropdown, setShowProfileDropdown] = useState(false)
  const [notifications, setNotifications] = useState([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [loadingNotifications, setLoadingNotifications] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [showSearchModal, setShowSearchModal] = useState(false)
  
  // Refs
  const notificationRef = useRef(null)
  const profileRef = useRef(null)

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (notificationRef.current && !notificationRef.current.contains(event.target)) {
        setShowNotificationDropdown(false)
      }
      if (profileRef.current && !profileRef.current.contains(event.target)) {
        setShowProfileDropdown(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Cmd/Ctrl + K for search
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        setShowSearchModal(true)
      }
      // Escape to close modals
      if (e.key === 'Escape') {
        setShowSearchModal(false)
        setShowNotificationDropdown(false)
        setShowProfileDropdown(false)
      }
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [])

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const isActive = (path) => {
    if (path === '/org/dashboard' || path === '/super-admin' || path === '/viewer/dashboard' || path === '/app/dashboard') {
      return location.pathname === path
    }
    return location.pathname.startsWith(path)
  }

  const getUserDisplayName = () => {
    if (user?.first_name && user?.last_name) {
      return `${user.first_name} ${user.last_name}`
    } else if (user?.first_name) {
      return user.first_name
    } else if (user?.email) {
      return user.email.split('@')[0]
    }
    return 'User'
  }

  const getUserInitials = () => {
    const name = getUserDisplayName()
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
  }

  // Fetch notifications
  useEffect(() => {
    fetchNotifications()
    const interval = setInterval(fetchNotifications, 30000)
    return () => clearInterval(interval)
  }, [])

  const fetchNotifications = async () => {
    try {
      setLoadingNotifications(true)
      const response = await axios.get('/api/assets/notifications/unread-count/')
      setUnreadCount(response.data.count || 0)
      const notifResponse = await axios.get('/api/assets/notifications/', { params: { limit: 5 } })
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
              { path: '/super-admin', label: 'Dashboard', icon: 'fa-gauge', description: 'System overview' },
            ],
          },
          {
            title: 'Management',
            items: [
              { path: '/organizations', label: 'Organizations', icon: 'fa-building', description: 'Manage orgs' },
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
              { path: '/viewer/dashboard', label: 'Dashboard', icon: 'fa-gauge', description: 'Overview' },
            ],
          },
          {
            title: 'Assets',
            items: [
              { path: '/viewer/assets/inventory', label: 'Assets', icon: 'fa-server', description: 'View assets' },
            ],
          },
          {
            title: 'Security',
            items: [
              { path: '/viewer/risk/summary', label: 'Risks', icon: 'fa-triangle-exclamation', description: 'Risk summary' },
            ],
          },
          {
            title: 'Reports',
            items: [
              { path: '/viewer/reports/generate', label: 'Reports', icon: 'fa-file-lines', description: 'Generate reports' },
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
              { path: '/org/dashboard', label: 'Dashboard', icon: 'fa-gauge', description: 'Organization overview' },
            ],
          },
          {
            title: 'Assets',
            items: [
              { path: '/org/assets/inventory', label: 'Asset Inventory', icon: 'fa-server', description: 'Manage assets' },
              { path: '/org/asset-discovery', label: 'Discovery', icon: 'fa-satellite-dish', description: 'Discover new assets' },
            ],
          },
          {
            title: 'Security',
            items: [
              { path: '/org/security-scans', label: 'Scans', icon: 'fa-shield', description: 'Security scans' },
              { path: '/org/vulnerabilities/all', label: 'Vulnerabilities', icon: 'fa-bug', description: 'View vulnerabilities' },
              { path: '/org/risk/prioritization', label: 'Risk Analysis', icon: 'fa-chart-line', description: 'Analyze risks' },
              { path: '/org/assets/changes', label: 'Change Log', icon: 'fa-clock', description: 'Track changes' },
            ],
          },
          {
            title: 'Management',
            items: [
              { path: '/org/reports/generate', label: 'Reports', icon: 'fa-file-lines', description: 'Generate reports' },
              { path: '/org/users/list', label: 'Team', icon: 'fa-users', description: 'Manage users' },
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
              { path: '/app/dashboard', label: 'Dashboard', icon: 'fa-gauge', description: 'Overview' },
            ],
          },
          {
            title: 'Assets',
            items: [
              { path: '/app/assets/inventory', label: 'Assets', icon: 'fa-server', description: 'View assets' },
              { path: '/org/asset-discovery', label: 'Discovery', icon: 'fa-satellite-dish', description: 'Asset discovery' },
            ],
          },
          {
            title: 'Security',
            items: [
              { path: '/org/security-scans', label: 'Scans', icon: 'fa-shield', description: 'Security scans' },
              { path: '/app/vulnerabilities/all', label: 'Vulnerabilities', icon: 'fa-bug', description: 'Vulnerabilities' },
              { path: '/app/risk/prioritization', label: 'Risks', icon: 'fa-chart-line', description: 'Risk analysis' },
              { path: '/org/assets/changes', label: 'Changes', icon: 'fa-clock', description: 'Change log' },
            ],
          },
          {
            title: 'Reports',
            items: [
              { path: '/app/reports/generate', label: 'Reports', icon: 'fa-file-lines', description: 'Reports' },
            ],
          },
        ],
      }
    }
    return {
      sections: [
        {
          title: 'Overview',
          items: [
            { path: '/dashboard', label: 'Dashboard', icon: 'fa-gauge', description: 'Overview' },
            { path: '/assets', label: 'Assets', icon: 'fa-server', description: 'View assets' },
          ],
        },
      ],
    }
  }

  const navItems = getNavItems()

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 transition-colors duration-300">
      {/* Sidebar */}
      <aside 
        className={`fixed inset-y-0 left-0 z-50 flex flex-col bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 transition-all duration-300 ease-in-out ${
          sidebarCollapsed ? 'w-20' : 'w-72'
        } ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}
      >
        {/* Logo Section */}
        <div className={`flex items-center h-18 px-4 border-b border-slate-200 dark:border-slate-800 ${sidebarCollapsed ? 'justify-center' : 'justify-between'}`}>
          <Link to="/" className="flex items-center gap-3 group">
            <div className="relative">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center shadow-lg shadow-primary-500/25 group-hover:shadow-primary-500/40 transition-shadow duration-300">
                <i className="fa-solid fa-shield-halved text-white text-lg"></i>
              </div>
              <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white dark:border-slate-900 animate-pulse"></div>
            </div>
            {!sidebarCollapsed && (
              <div className="animate-fade-in">
                <h1 className="text-lg font-bold text-slate-900 dark:text-white tracking-tight">EASM</h1>
                <p className="text-xs text-slate-500 dark:text-slate-400 -mt-0.5">Threat Management</p>
              </div>
            )}
          </Link>
          {!sidebarCollapsed && (
            <button
              onClick={() => setSidebarCollapsed(true)}
              className="p-2 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 dark:hover:text-slate-300 transition-colors lg:flex hidden"
            >
              <i className="fa-solid fa-angles-left text-sm"></i>
            </button>
          )}
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-4 overflow-y-auto space-y-6">
          {navItems.sections.map((section, sectionIndex) => (
            <div key={sectionIndex} className="space-y-1">
              {!sidebarCollapsed && (
                <h3 className="px-3 mb-2 text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                  {section.title}
                </h3>
              )}
              {section.items.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`group flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 relative ${
                    isActive(item.path)
                      ? 'bg-gradient-to-r from-primary-500 to-primary-600 text-white shadow-lg shadow-primary-500/25'
                      : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white'
                  } ${sidebarCollapsed ? 'justify-center' : ''}`}
                  title={sidebarCollapsed ? item.label : ''}
                >
                  <div className={`flex items-center justify-center w-9 h-9 rounded-lg transition-colors ${
                    isActive(item.path) 
                      ? 'bg-white/20' 
                      : 'bg-slate-100 dark:bg-slate-800 group-hover:bg-primary-100 dark:group-hover:bg-primary-900/30'
                  }`}>
                    <i className={`fa-solid ${item.icon} text-sm ${isActive(item.path) ? 'text-white' : 'text-slate-500 dark:text-slate-400 group-hover:text-primary-500'}`}></i>
                  </div>
                  {!sidebarCollapsed && (
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-medium truncate ${isActive(item.path) ? 'text-white' : ''}`}>
                        {item.label}
                      </p>
                    </div>
                  )}
                  {!sidebarCollapsed && isActive(item.path) && (
                    <div className="w-1.5 h-1.5 rounded-full bg-white animate-pulse"></div>
                  )}
                </Link>
              ))}
            </div>
          ))}
        </nav>

        {/* Sidebar Footer */}
        <div className="p-3 border-t border-slate-200 dark:border-slate-800">
          {/* Expand Button (when collapsed) */}
          {sidebarCollapsed && (
            <button
              onClick={() => setSidebarCollapsed(false)}
              className="w-full p-3 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 dark:hover:text-slate-300 transition-colors flex items-center justify-center"
            >
              <i className="fa-solid fa-angles-right text-sm"></i>
            </button>
          )}
          
          {/* User Card (when expanded) */}
          {!sidebarCollapsed && (
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center text-white font-semibold text-sm shadow-lg">
                  {getUserInitials()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-slate-900 dark:text-white truncate">
                    {getUserDisplayName()}
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 truncate capitalize">
                    {user?.role?.replace('_', ' ')}
                  </p>
                </div>
              </div>
              <button
                onClick={handleLogout}
                className="mt-3 w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-sm font-medium text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors"
              >
                <i className="fa-solid fa-right-from-bracket"></i>
                <span>Sign Out</span>
              </button>
            </div>
          )}
        </div>
      </aside>

      {/* Mobile Overlay */}
      {mobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Main Content Area */}
      <div className={`transition-all duration-300 ${sidebarCollapsed ? 'lg:pl-20' : 'lg:pl-72'}`}>
        {/* Header */}
        <header className="sticky top-0 z-30 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center justify-between h-18 px-4 lg:px-8">
            {/* Left Section */}
            <div className="flex items-center gap-4">
              {/* Mobile Menu Button */}
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="lg:hidden p-2.5 rounded-xl text-slate-500 hover:text-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 dark:hover:text-slate-300 transition-colors"
              >
                <i className={`fa-solid ${mobileMenuOpen ? 'fa-xmark' : 'fa-bars'} text-lg`}></i>
              </button>

              {/* Search Bar */}
              <div className="hidden md:flex items-center">
                <button
                  onClick={() => setShowSearchModal(true)}
                  className="flex items-center gap-3 px-4 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors w-64 lg:w-80"
                >
                  <i className="fa-solid fa-magnifying-glass text-sm"></i>
                  <span className="text-sm">Search...</span>
                  <kbd className="ml-auto px-2 py-0.5 rounded bg-white dark:bg-slate-700 text-xs font-medium text-slate-400 border border-slate-200 dark:border-slate-600">
                    ⌘K
                  </kbd>
                </button>
              </div>
            </div>

            {/* Right Section */}
            <div className="flex items-center gap-2">
              {/* Theme Toggle */}
              <button
                onClick={toggleTheme}
                className="p-2.5 rounded-xl text-slate-500 hover:text-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 dark:hover:text-slate-300 transition-all duration-200 hover:scale-105"
                title={theme === 'light' ? 'Dark mode' : 'Light mode'}
              >
                {theme === 'light' ? (
                  <i className="fa-solid fa-moon text-lg"></i>
                ) : (
                  <i className="fa-solid fa-sun text-lg text-amber-400"></i>
                )}
              </button>

              {/* Notifications */}
              <div className="relative" ref={notificationRef}>
                <button
                  onClick={() => setShowNotificationDropdown(!showNotificationDropdown)}
                  className="relative p-2.5 rounded-xl text-slate-500 hover:text-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 dark:hover:text-slate-300 transition-all duration-200 hover:scale-105"
                >
                  <i className="fa-solid fa-bell text-lg"></i>
                  {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center animate-bounce">
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                  )}
                </button>

                {/* Notification Dropdown */}
                {showNotificationDropdown && (
                  <div className="absolute right-0 mt-2 w-96 bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden animate-fade-in-down">
                    <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
                      <div>
                        <h3 className="font-semibold text-slate-900 dark:text-white">Notifications</h3>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                          {unreadCount} unread
                        </p>
                      </div>
                      <button className="text-xs text-primary-500 hover:text-primary-600 font-medium">
                        Mark all read
                      </button>
                    </div>
                    <div className="max-h-80 overflow-y-auto">
                      {loadingNotifications ? (
                        <div className="p-8 text-center">
                          <i className="fa-solid fa-spinner animate-spin text-2xl text-slate-300 dark:text-slate-600"></i>
                        </div>
                      ) : notifications.length === 0 ? (
                        <div className="p-8 text-center">
                          <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mx-auto mb-3">
                            <i className="fa-solid fa-bell-slash text-slate-400 dark:text-slate-500"></i>
                          </div>
                          <p className="text-sm text-slate-500 dark:text-slate-400">No notifications yet</p>
                        </div>
                      ) : (
                        notifications.map((notification, index) => (
                          <div
                            key={notification.id || index}
                            className="p-4 border-b border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer transition-colors"
                            onClick={() => {
                              navigate('/notifications')
                              setShowNotificationDropdown(false)
                            }}
                          >
                            <div className="flex items-start gap-3">
                              <div className={`w-2 h-2 rounded-full mt-2 ${notification.is_read ? 'bg-slate-300 dark:bg-slate-600' : 'bg-primary-500 animate-pulse'}`}></div>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-slate-900 dark:text-white truncate">
                                  {notification.title || 'Asset Change Detected'}
                                </p>
                                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-2">
                                  {notification.message}
                                </p>
                                <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
                                  {new Date(notification.created_at).toLocaleString()}
                                </p>
                              </div>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                    <div className="p-3 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-200 dark:border-slate-800">
                      <button
                        onClick={() => {
                          navigate('/notifications')
                          setShowNotificationDropdown(false)
                        }}
                        className="w-full py-2.5 px-4 rounded-xl bg-primary-500 hover:bg-primary-600 text-white text-sm font-medium transition-colors"
                      >
                        View All Notifications
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Profile Dropdown */}
              <div className="relative" ref={profileRef}>
                <button
                  onClick={() => setShowProfileDropdown(!showProfileDropdown)}
                  className="flex items-center gap-3 p-1.5 pr-3 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                >
                  <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center text-white font-semibold text-sm shadow-lg shadow-primary-500/20">
                    {getUserInitials()}
                  </div>
                  <div className="hidden md:block text-left">
                    <p className="text-sm font-medium text-slate-700 dark:text-slate-200">
                      {getUserDisplayName()}
                    </p>
                  </div>
                  <i className="fa-solid fa-chevron-down text-xs text-slate-400 hidden md:block"></i>
                </button>

                {/* Profile Dropdown Menu */}
                {showProfileDropdown && (
                  <div className="absolute right-0 mt-2 w-72 bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden animate-fade-in-down">
                    <div className="p-4 bg-gradient-to-br from-primary-500 to-accent-500">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-xl bg-white/20 backdrop-blur flex items-center justify-center text-white font-bold text-lg">
                          {getUserInitials()}
                        </div>
                        <div className="text-white">
                          <p className="font-semibold">{getUserDisplayName()}</p>
                          <p className="text-sm text-white/80 truncate">{user?.email}</p>
                        </div>
                      </div>
                      <div className="mt-3 px-2 py-1 rounded-lg bg-white/20 backdrop-blur text-xs text-white inline-block capitalize">
                        {user?.role?.replace('_', ' ')}
                      </div>
                    </div>
                    <div className="p-2">
                      <button
                        onClick={() => {
                          navigate('/profile')
                          setShowProfileDropdown(false)
                        }}
                        className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                      >
                        <i className="fa-solid fa-user w-5 text-slate-400"></i>
                        <span className="text-sm font-medium">View Profile</span>
                      </button>
                      <button
                        onClick={() => {
                          navigate('/profile')
                          setShowProfileDropdown(false)
                        }}
                        className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                      >
                        <i className="fa-solid fa-gear w-5 text-slate-400"></i>
                        <span className="text-sm font-medium">Settings</span>
                      </button>
                      <div className="my-2 border-t border-slate-200 dark:border-slate-800"></div>
                      <button
                        onClick={handleLogout}
                        className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                      >
                        <i className="fa-solid fa-right-from-bracket w-5"></i>
                        <span className="text-sm font-medium">Sign Out</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="p-4 lg:p-8 animate-fade-in">
          {children}
        </main>
      </div>

      {/* Search Modal */}
      {showSearchModal && (
        <>
          <div 
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
            onClick={() => setShowSearchModal(false)}
          />
          <div className="fixed top-[20%] left-1/2 -translate-x-1/2 w-full max-w-2xl z-50 p-4">
            <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden animate-scale-in">
              <div className="flex items-center gap-4 p-4 border-b border-slate-200 dark:border-slate-800">
                <i className="fa-solid fa-magnifying-glass text-slate-400"></i>
                <input
                  type="text"
                  placeholder="Search assets, vulnerabilities, reports..."
                  className="flex-1 bg-transparent border-none outline-none text-slate-900 dark:text-white placeholder-slate-400"
                  autoFocus
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                <kbd className="px-2 py-1 rounded bg-slate-100 dark:bg-slate-800 text-xs font-medium text-slate-400 border border-slate-200 dark:border-slate-700">
                  ESC
                </kbd>
              </div>
              <div className="p-4 max-h-96 overflow-y-auto">
                <p className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-3">
                  Quick Actions
                </p>
                <div className="space-y-1">
                  {[
                    { icon: 'fa-satellite-dish', label: 'Run Asset Discovery', path: '/org/asset-discovery' },
                    { icon: 'fa-server', label: 'View Assets', path: '/org/assets/inventory' },
                    { icon: 'fa-bug', label: 'View Vulnerabilities', path: '/org/vulnerabilities/all' },
                    { icon: 'fa-file-lines', label: 'Generate Report', path: '/org/reports/generate' },
                  ].map((action) => (
                    <button
                      key={action.path}
                      onClick={() => {
                        navigate(action.path)
                        setShowSearchModal(false)
                      }}
                      className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                    >
                      <i className={`fa-solid ${action.icon} w-5 text-slate-400`}></i>
                      <span className="text-sm font-medium">{action.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}

export default Layout
