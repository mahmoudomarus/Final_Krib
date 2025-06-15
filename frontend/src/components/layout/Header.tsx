import React, { useState, useRef, useEffect } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { 
  Search, 
  Menu, 
  X, 
  User, 
  Settings, 
  LogOut, 
  Bell, 
  MessageSquare, 
  Calendar,
  Home,
  Building,
  ToggleLeft,
  ToggleRight,
  Globe,
  MessageCircle,
  UserPlus,
  LogIn
} from 'lucide-react'
import { Button } from '../ui/Button'
import { useAuth } from '../../contexts/AuthContext'
import { useSearch } from '../../contexts/SearchContext'
import { UnifiedSearchBar } from '../search/UnifiedSearchBar'
import NotificationBell from '../ui/NotificationBell'

const Header: React.FC = () => {
  const { t, i18n } = useTranslation()
  const { isAuthenticated, user, logout } = useAuth()
  const { searchData, handleSearch: contextHandleSearch } = useSearch()
  const navigate = useNavigate()
  const location = useLocation()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false)
  const [currentMode, setCurrentMode] = useState<'guest' | 'host' | 'agent'>('guest')
  const userMenuRef = useRef<HTMLDivElement>(null)
  
  // Search state - now using SearchContext
  const [isSearchExpanded, setIsSearchExpanded] = useState(false)

  // Check if we're on the homepage
  const isHomePage = location.pathname === '/'

  // Determine current mode based on URL and user roles
  useEffect(() => {
    if (location.pathname.startsWith('/host')) {
      setCurrentMode('host')
    } else if (location.pathname.startsWith('/agent')) {
      setCurrentMode('agent')
    } else {
      setCurrentMode('guest')
    }
  }, [location.pathname])

  // Close everything when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement
      
      // Don't close if clicking inside the user menu or user menu button
      if (target.closest('.user-menu') || target.closest('.user-menu-button')) {
        return
      }
      
      // Close search if clicking outside the header when search is expanded
      if (isSearchExpanded && !target.closest('header')) {
        setIsSearchExpanded(false)
      } else if (target.closest('header') && !target.closest('.search-area')) {
        // Close search if clicking on header but outside search area
        setIsSearchExpanded(false)
      }
      
      setIsUserMenuOpen(false)
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isSearchExpanded])

  const toggleLanguage = () => {
    const newLang = i18n.language === 'en' ? 'ar' : 'en'
    i18n.changeLanguage(newLang)
  }

  const handleLogout = () => {
    logout()
    navigate('/')
    setIsUserMenuOpen(false)
  }

  const closeUserMenu = () => {
    setIsUserMenuOpen(false)
  }

  const formatDateForDisplay = (dateString: string) => {
    if (!dateString) return ''
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric'
    })
  }

  const formatGuestsText = () => {
    const total = searchData.adults + searchData.children
    if (total === 1) return 'Add guests'
    
    let text = `${total} guests`
    if (searchData.infants > 0) {
      text += `, ${searchData.infants} infant${searchData.infants > 1 ? 's' : ''}`
    }
    return text
  }

  const handleSearch = () => {
    console.log('Searching with:', searchData)
    setIsSearchExpanded(false)
    
    // Use the context's handle search function
    contextHandleSearch()
  }

  const handleModeSwitch = (mode: 'guest' | 'host' | 'agent') => {
    setCurrentMode(mode)
    setIsUserMenuOpen(false)
    
    // Navigate to appropriate dashboard
    if (mode === 'host' && user?.is_host) {
      navigate('/host')
    } else if (mode === 'agent' && user?.is_agent) {
      navigate('/agent')
    } else {
      navigate('/')
    }
  }

  const getModeIcon = (mode: 'guest' | 'host' | 'agent') => {
    switch (mode) {
      case 'host':
        return <Home className="w-4 h-4" />
      case 'agent':
        return <Building className="w-4 h-4" />
      default:
        return <User className="w-4 h-4" />
    }
  }

  const getModeLabel = (mode: 'guest' | 'host' | 'agent') => {
    switch (mode) {
      case 'host':
        return 'Host Mode'
      case 'agent':
        return 'Agent Mode'
      default:
        return 'Guest Mode'
    }
  }

  const canSwitchModes = user && (user.is_host || user.is_agent)

  return (
    <>
      {/* Backdrop when search is expanded */}
      {isSearchExpanded && (
        <div className="fixed inset-0 bg-black bg-opacity-30 z-40" />
      )}

      <header className={`bg-white shadow-sm border-b border-neutral-200 sticky top-0 z-50 transition-all duration-300 ${
        isSearchExpanded ? 'shadow-2xl' : ''
      }`}>
        <div className="container mx-auto px-4">
          {/* Regular Header Layout */}
          {!isSearchExpanded && (
            <div className="flex items-center justify-between h-16">
              {/* Logo */}
              <Link to="/" className="flex items-center space-x-2 group">
                <img 
                  src="/logo.png" 
                  alt="Krib Logo" 
                  className="w-10 h-10 object-contain transition-transform group-hover:scale-105"
                />
                <span className="text-xl font-bold text-neutral-900 group-hover:text-primary-600 transition-colors">Krib</span>
              </Link>

              {/* Compact Search Bar - Desktop (show on all pages except homepage) */}
              {!isHomePage && (
                <div className="hidden lg:flex items-center flex-1 max-w-md mx-8">
                  <UnifiedSearchBar variant="compact" />
                </div>
              )}

              {/* Regular Navigation */}
              <nav className="hidden md:flex items-center space-x-6">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={toggleLanguage}
                  leftIcon={<Globe className="w-4 h-4" />}
                >
                  {i18n.language === 'en' ? 'العربية' : 'English'}
                </Button>

                <NotificationBell />

                {isAuthenticated && !user?.is_host && !user?.is_agent && (
                  <Link to="/list-with-us" className="text-neutral-700 hover:text-primary-600 transition-colors font-medium">
                    List with Us
                  </Link>
                )}

                <div className="relative">
                  <Button
                    variant="ghost"
                    onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                    className="user-menu-button flex items-center space-x-2 border border-gray-300 rounded-full px-3 py-2 hover:shadow-md transition-all"
                  >
                    <Menu className="w-4 h-4" />
                    <div className="w-6 h-6 bg-gray-500 rounded-full flex items-center justify-center">
                      <User className="w-4 h-4 text-white" />
                    </div>
                  </Button>
                  
                  {/* User Dropdown Menu */}
                  {isUserMenuOpen && (
                    <div className="user-menu absolute right-0 top-full mt-2 w-56 bg-white rounded-xl shadow-lg border border-gray-200 py-2 z-50">
                      {isAuthenticated ? (
                        <>
                          <div className="px-4 py-3 border-b border-gray-100">
                            <p className="text-sm font-medium text-gray-900">
                              {user?.first_name ? `Hi, ${user.first_name}!` : 'My Account'}
                            </p>
                            <p className="text-xs text-gray-500">{user?.email}</p>
                          </div>
                          
                          <Link 
                            to="/profile" 
                            className="flex items-center px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                            onClick={closeUserMenu}
                          >
                            <User className="w-4 h-4 mr-3" />
                            Profile
                          </Link>
                          
                          <Link 
                            to="/bookings" 
                            className="flex items-center px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                            onClick={closeUserMenu}
                          >
                            <Settings className="w-4 h-4 mr-3" />
                            My Bookings
                          </Link>
                          
                          <Link 
                            to="/messages" 
                            className="flex items-center px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                            onClick={closeUserMenu}
                          >
                            <MessageCircle className="w-4 h-4 mr-3" />
                            Messages
                          </Link>
                          
                          {user?.is_host && (
                            <Link 
                              to="/host" 
                              className="flex items-center px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                              onClick={closeUserMenu}
                            >
                              <Home className="w-4 h-4 mr-3" />
                              Host Dashboard
                            </Link>
                          )}

                          {user?.is_agent && (
                            <Link 
                              to="/agent" 
                              className="flex items-center px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                              onClick={closeUserMenu}
                            >
                              <Building className="w-4 h-4 mr-3" />
                              Agent Dashboard
                            </Link>
                          )}
                          
                          {!user?.is_host && !user?.is_agent && (
                            <Link 
                              to="/list-with-us" 
                              className="flex items-center px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 transition-colors border-t border-gray-100"
                              onClick={closeUserMenu}
                            >
                              <Building className="w-4 h-4 mr-3" />
                              List with Us
                            </Link>
                          )}
                          
                          <div className="border-t border-gray-100 mt-1">
                            <button
                              onClick={handleLogout}
                              className="flex items-center w-full px-4 py-3 text-sm text-red-600 hover:bg-red-50 transition-colors"
                            >
                              <LogOut className="w-4 h-4 mr-3" />
                              Logout
                            </button>
                          </div>
                        </>
                      ) : (
                        <>
                          <Link 
                            to="/register" 
                            className="flex items-center px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 transition-colors font-medium"
                            onClick={closeUserMenu}
                          >
                            <UserPlus className="w-4 h-4 mr-3" />
                            Sign up
                          </Link>
                          
                          <Link 
                            to="/login" 
                            className="flex items-center px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                            onClick={closeUserMenu}
                          >
                            <LogIn className="w-4 h-4 mr-3" />
                            Log in
                          </Link>
                          
                          <div className="border-t border-gray-100 mt-1">
                            <Link 
                              to="/list-with-us" 
                              className="flex items-center px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                              onClick={closeUserMenu}
                            >
                              <Building className="w-4 h-4 mr-3" />
                              List with Us
                            </Link>
                          </div>
                        </>
                      )}
                    </div>
                  )}
                </div>
              </nav>

              {/* Mobile Menu Button */}
              <Button
                variant="ghost"
                size="icon"
                className="md:hidden"
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              >
                <Menu className="w-5 h-5" />
              </Button>
            </div>
          )}

          {/* Expanded Search Layout - Transform entire header */}
          {isSearchExpanded && (
            <div className="search-area py-6 animate-in slide-in-from-top-4 duration-300">
              {/* Top section - Logo and close/minimize */}
              <div className="flex items-center justify-between mb-8">
                <Link to="/" className="flex items-center space-x-2 group">
                  <img 
                    src="/logo.png" 
                    alt="Krib Logo" 
                    className="w-8 h-8 object-contain transition-transform group-hover:scale-105"
                  />
                  <span className="text-lg font-bold text-neutral-900 group-hover:text-primary-600 transition-colors">Krib</span>
                </Link>
                
                {/* Close/Minimize button */}
                <button
                  onClick={() => {
                    setIsSearchExpanded(false)
                  }}
                  className="text-gray-500 hover:text-gray-700 transition-colors p-2"
                >
                  ✕
                </button>
              </div>

              {/* Use UnifiedSearchBar component for consistency */}
              <div className="max-w-4xl mx-auto">
                <UnifiedSearchBar />
              </div>
            </div>
          )}

          {/* Mobile Menu */}
          {isMobileMenuOpen && !isSearchExpanded && (
            <div className="md:hidden py-4 border-t border-neutral-200">
              <div className="flex flex-col space-y-4">
                {/* Mobile Search - show on all pages except homepage */}
                {!isHomePage && (
                  <div className="mb-4">
                    <button
                      onClick={() => setIsSearchExpanded(true)}
                      className="w-full flex items-center justify-center px-4 py-3 bg-gray-100 rounded-xl text-gray-700 font-medium"
                    >
                      <Search className="w-4 h-4 mr-2" />
                      Search
                    </button>
                  </div>
                )}

                {/* Mobile Navigation */}
                <div className="flex flex-col space-y-2">
                  <Button
                    variant="ghost"
                    onClick={toggleLanguage}
                    leftIcon={<Globe className="w-4 h-4" />}
                    fullWidth
                    className="justify-start"
                  >
                    {i18n.language === 'en' ? 'العربية' : 'English'}
                  </Button>
                  
                  {isAuthenticated ? (
                    <>
                      <div className="border-t border-gray-200 pt-4">
                        <p className="text-sm font-medium text-gray-900 px-4 mb-2">
                          {user?.first_name ? `Hi, ${user.first_name}!` : 'My Account'}
                        </p>
                      </div>
                      
                      <Link to="/profile" onClick={() => setIsMobileMenuOpen(false)}>
                        <Button variant="ghost" fullWidth leftIcon={<User className="w-4 h-4" />} className="justify-start">
                          Profile
                        </Button>
                      </Link>
                      
                      <Link to="/bookings" onClick={() => setIsMobileMenuOpen(false)}>
                        <Button variant="ghost" fullWidth leftIcon={<Settings className="w-4 h-4" />} className="justify-start">
                          My Bookings
                        </Button>
                      </Link>
                      
                      <Link to="/messages" onClick={() => setIsMobileMenuOpen(false)}>
                        <Button variant="ghost" fullWidth leftIcon={<MessageCircle className="w-4 h-4" />} className="justify-start">
                          Messages
                        </Button>
                      </Link>
                      
                      {user?.is_host && (
                        <Link to="/host" onClick={() => setIsMobileMenuOpen(false)}>
                          <Button variant="ghost" fullWidth leftIcon={<Home className="w-4 h-4" />} className="justify-start">
                            Host Dashboard
                          </Button>
                        </Link>
                      )}

                      {user?.is_agent && (
                        <Link to="/agent" onClick={() => setIsMobileMenuOpen(false)}>
                          <Button variant="ghost" fullWidth leftIcon={<Building className="w-4 h-4" />} className="justify-start">
                            Agent Dashboard
                          </Button>
                        </Link>
                      )}

                      {!user?.is_host && !user?.is_agent && (
                        <Link to="/list-with-us" onClick={() => setIsMobileMenuOpen(false)}>
                          <Button variant="ghost" fullWidth leftIcon={<Building className="w-4 h-4" />} className="justify-start">
                            List with Us
                          </Button>
                        </Link>
                      )}
                      
                      <div className="border-t border-gray-200 pt-2">
                        <Button 
                          variant="ghost" 
                          fullWidth 
                          leftIcon={<LogOut className="w-4 h-4" />}
                          onClick={() => {
                            handleLogout()
                            setIsMobileMenuOpen(false)
                          }}
                          className="text-red-600 hover:bg-red-50 justify-start"
                        >
                          Logout
                        </Button>
                      </div>
                    </>
                  ) : (
                    <>
                      <Link to="/register" onClick={() => setIsMobileMenuOpen(false)}>
                        <Button variant="ghost" fullWidth leftIcon={<UserPlus className="w-4 h-4" />} className="justify-start">
                          Sign up
                        </Button>
                      </Link>
                      
                      <Link to="/login" onClick={() => setIsMobileMenuOpen(false)}>
                        <Button variant="ghost" fullWidth leftIcon={<LogIn className="w-4 h-4" />} className="justify-start">
                          Log in
                        </Button>
                      </Link>
                      
                      <div className="border-t border-gray-200 pt-2">
                        <Link to="/list-with-us" onClick={() => setIsMobileMenuOpen(false)}>
                          <Button variant="ghost" fullWidth leftIcon={<Building className="w-4 h-4" />} className="justify-start">
                            List with Us
                          </Button>
                        </Link>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </header>
    </>
  )
}

export default Header 