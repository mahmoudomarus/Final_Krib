import React, { ReactNode, useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Button } from '../ui/Button';
import { 
  Shield, 
  LogOut, 
  User, 
  Settings,
  Bell,
  BarChart3,
  Activity,
  Users,
  Building,
  Calendar,
  DollarSign,
  Server,
  AlertTriangle,
  ChevronDown,
  UserCog
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import NotificationsDropdown from '../admin/NotificationsDropdown';

interface AdminLayoutProps {
  children: ReactNode;
  title?: string;
}

const AdminLayout: React.FC<AdminLayoutProps> = ({ children, title = 'Dashboard' }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);

  const handleLogout = async () => {
    await logout();
    navigate('/admin/login');
  };

  // Close user menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setShowUserMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Determine which tab is currently active based on the URL
  const getActiveTab = () => {
    const path = location.pathname;
    const searchParams = new URLSearchParams(location.search);
    const tab = searchParams.get('tab');
    
    // First check for explicit tab parameter
    if (tab) {
      return tab;
    }
    
    // Then check path-based routing
    if (path.includes('/analytics')) return 'analytics';
    if (path.includes('/users')) return 'users';
    if (path.includes('/properties')) return 'properties';
    if (path.includes('/bookings')) return 'bookings';
    if (path.includes('/finance')) return 'finance';
    if (path.includes('/system')) return 'system';
    if (path.includes('/security')) return 'security';
    if (path.includes('/settings')) return 'settings';
    if (path.includes('/profile')) return 'profile';
    
    // Default to overview for /admin/dashboard
    return 'overview';
  };

  const activeTab = getActiveTab();

  const menuItems = [
    { icon: BarChart3, label: 'Overview', tab: 'overview', path: '/admin/dashboard' },
    { icon: Activity, label: 'Analytics', tab: 'analytics', path: '/admin/dashboard?tab=analytics' },
    { icon: Users, label: 'Users', tab: 'users', path: '/admin/dashboard?tab=users' },
    { icon: Building, label: 'Properties', tab: 'properties', path: '/admin/dashboard?tab=properties' },
    { icon: Calendar, label: 'Bookings', tab: 'bookings', path: '/admin/dashboard?tab=bookings' },
    { icon: DollarSign, label: 'Finance', tab: 'finance', path: '/admin/dashboard?tab=finance' },
    { icon: Server, label: 'System', tab: 'system', path: '/admin/dashboard?tab=system' },
    { icon: Shield, label: 'Security', tab: 'security', path: '/admin/dashboard?tab=security' },
    { icon: Settings, label: 'Settings', tab: 'settings', path: '/admin/dashboard?tab=settings' },
  ];

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Admin Header */}
      <header className="bg-white shadow-lg border-b border-gray-200 sticky top-0 z-50">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            {/* Logo and Title */}
            <div className="flex items-center">
              <div className="flex items-center mr-8">
                <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center mr-3">
                  <Shield className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-gray-900">Admin Portal</h1>
                  <p className="text-sm text-gray-500">Krib</p>
                </div>
              </div>
              
              {/* Breadcrumb */}
              <div className="hidden md:flex items-center text-sm text-gray-600">
                <span>Admin</span>
                <span className="mx-2">/</span>
                <span className="text-gray-900 font-medium">{title}</span>
              </div>
            </div>

            {/* Right side actions */}
            <div className="flex items-center space-x-4">
              {/* Notifications */}
              <NotificationsDropdown />

              {/* Settings */}
              <button 
                onClick={() => navigate('/admin/dashboard?tab=settings')}
                className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <Settings className="w-5 h-5" />
              </button>

              {/* User Menu */}
              <div className="relative" ref={userMenuRef}>
                <button
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className="flex items-center space-x-3 pl-4 border-l border-gray-200 hover:bg-gray-50 rounded-lg p-2 transition-colors"
                >
                <div className="text-right">
                  <p className="text-sm font-medium text-gray-900">{user?.first_name} {user?.last_name}</p>
                  <p className="text-xs text-gray-500">Super Admin</p>
                </div>
                <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                  <User className="w-4 h-4 text-white" />
                </div>
                  <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${showUserMenu ? 'rotate-180' : ''}`} />
                </button>

                {/* User Dropdown Menu */}
                {showUserMenu && (
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50">
                    <button
                      onClick={() => {
                        navigate('/admin/dashboard?tab=profile');
                        setShowUserMenu(false);
                      }}
                      className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center space-x-2"
                    >
                      <UserCog className="w-4 h-4" />
                      <span>Admin Profile</span>
                    </button>
                    <button
                      onClick={() => {
                        navigate('/admin/dashboard?tab=settings');
                        setShowUserMenu(false);
                      }}
                      className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center space-x-2"
                    >
                      <Settings className="w-4 h-4" />
                      <span>Settings</span>
                    </button>
                    <hr className="my-1" />
                    <button
                      onClick={() => {
                        handleLogout();
                        setShowUserMenu(false);
                      }}
                      className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center space-x-2"
              >
                <LogOut className="w-4 h-4" />
                <span>Logout</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Admin Sidebar */}
        <aside className="w-64 bg-white shadow-lg min-h-screen border-r border-gray-200">
          <nav className="p-4">
            <div className="space-y-2">
              {menuItems.map((item, index) => (
                <button
                  key={index}
                  onClick={() => navigate(item.path)}
                  className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-left transition-colors ${
                    activeTab === item.tab
                      ? 'bg-blue-50 text-blue-700 border border-blue-200' 
                      : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
                  }`}
                >
                  <item.icon className={`w-5 h-5 ${activeTab === item.tab ? 'text-blue-600' : 'text-gray-500'}`} />
                  <span className="font-medium">{item.label}</span>
                </button>
              ))}
            </div>

            {/* System Status */}
            <div className="mt-8 p-4 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-center space-x-2 mb-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-sm font-medium text-green-800">System Status</span>
              </div>
              <p className="text-xs text-green-700">All systems operational</p>
              <div className="mt-2 text-xs text-green-600">
                <div>Uptime: 99.9%</div>
                <div>Response: 245ms</div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="mt-6">
              <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
                Quick Actions
              </h3>
              <div className="space-y-2">
                <button className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded transition-colors">
                  View Recent Activity
                </button>
                <button className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded transition-colors">
                  Generate Report
                </button>
                <button className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded transition-colors">
                  System Backup
                </button>
              </div>
            </div>
          </nav>
        </aside>

        {/* Main Content Area */}
        <main className="flex-1 overflow-auto">
          {children}
        </main>
      </div>

      {/* Emergency Alert Bar (if needed) */}
      <div className="hidden" id="emergency-alert">
        <div className="bg-red-600 text-white px-6 py-2">
          <div className="flex items-center space-x-3">
            <AlertTriangle className="w-5 h-5" />
            <span className="font-medium">System Alert:</span>
            <span>High traffic detected - monitoring situation</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminLayout; 