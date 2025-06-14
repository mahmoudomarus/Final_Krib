import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { RoleService, User } from '../services/roleService';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  register: (userData: RegisterData) => Promise<boolean>;
  logout: () => void;
  refreshUser: () => Promise<void>;
  sendPasswordReset: (email: string) => Promise<void>;
  resetPassword: (token: string, password: string) => Promise<void>;
  verifyEmail: (token: string) => Promise<void>;
  loginWithGoogle: (token: string, role?: string) => Promise<boolean>;
}

interface RegisterData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone?: string;
  nationality?: string;
  acceptTerms: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5001/api';

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  const checkAuthStatus = async () => {
    try {
      const token = localStorage.getItem('token');
      if (token) {
        const response = await fetch(`${API_BASE_URL}/auth/me`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });

        if (response.ok) {
          const userData = await response.json();
          const userInfo = userData.data || userData.user; // Handle both response formats
          setUser(userInfo);
          setIsAuthenticated(true);
          
          // Use RoleService for consistent role-based navigation
          const currentPath = window.location.pathname;
          const userRole = RoleService.getUserRole(userInfo);
          
          console.log('Auth check:', { userRole, email: userInfo.email, currentPath });
          
          // Handle role-based redirects
          if (userRole === 'super_admin' && !currentPath.startsWith('/admin')) {
            // Super admin should go to admin interface
            setTimeout(() => {
              window.location.href = '/admin/dashboard';
            }, 100);
          } else if (userRole === 'agent' && !currentPath.startsWith('/listers') && !currentPath.startsWith('/admin')) {
            // Regular agent should go to listers interface
            setTimeout(() => {
              window.location.href = '/listers';
            }, 100);
          } else if (userRole === 'host' && !currentPath.startsWith('/host') && !currentPath.startsWith('/admin') && !currentPath.startsWith('/listers')) {
            // Host should go to host interface
            setTimeout(() => {
              window.location.href = '/host/dashboard';
            }, 100);
          } else if (!RoleService.canAccessRoute(userInfo, currentPath)) {
            // User trying to access unauthorized route
            setTimeout(() => {
              window.location.href = RoleService.getDashboardUrl(userInfo);
            }, 100);
          }
        } else {
          localStorage.removeItem('token');
        }
      }
    } catch (error) {
      console.error('Auth check failed:', error);
      localStorage.removeItem('token');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkAuthStatus();
  }, []);

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      if (response.ok) {
        const data = await response.json();
        const token = data.data?.token || data.token; // Handle both response formats
        const userData = data.data?.user || data.user || data.data;
        
        localStorage.setItem('token', token);
        setUser(userData);
        setIsAuthenticated(true);
        return true;
      } else {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Login failed');
      }
    } catch (error) {
      console.error('Login error:', error);
      return false;
    }
  };

  const register = async (userData: RegisterData): Promise<boolean> => {
    try {
      // Check if this is an admin registration attempt
      const isAdminEmail = userData.email.includes('admin@') || userData.email.includes('@admin');
      
      if (isAdminEmail) {
        throw new Error('Admin accounts cannot be registered through this interface. Please contact system administrator.');
      }

      const response = await fetch(`${API_BASE_URL}/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userData),
      });

      if (response.ok) {
        const data = await response.json();
        const token = data.data?.token || data.token; // Handle both response formats
        const userData = data.data?.user || data.user || data.data;
        
        localStorage.setItem('token', token);
        setUser(userData);
        setIsAuthenticated(true);
        return true;
      } else {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Registration failed');
      }
    } catch (error) {
      console.error('Registration error:', error);
      throw error;
    }
  };

  const logout = async () => {
    try {
      // Clear local storage
      localStorage.removeItem('token');
      setUser(null);
      setIsAuthenticated(false);
      
      // Determine redirect based on current location
      const currentPath = window.location.pathname;
      if (currentPath.startsWith('/admin')) {
        window.location.href = '/admin/login';
      } else {
        window.location.href = '/';
      }
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const refreshUser = async () => {
    try {
      const token = localStorage.getItem('token');
      if (token) {
        const response = await fetch('/api/auth/me', {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });

        if (response.ok) {
          const result = await response.json();
          if (result.success && result.data) {
            setUser(result.data.user || result.data);
          }
        }
      }
    } catch (error) {
      console.error('Failed to refresh user:', error);
    }
  };

  const sendPasswordReset = async (email: string) => {
    try {
      const response = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to send password reset email');
      }
    } catch (error: any) {
      throw new Error(error.message || 'Failed to send password reset email');
    }
  };

  const resetPassword = async (token: string, password: string) => {
    try {
      const response = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token, password }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Password reset failed');
      }
    } catch (error: any) {
      throw new Error(error.message || 'Password reset failed');
    }
  };

  const verifyEmail = async (token: string) => {
    try {
      const response = await fetch('/api/auth/verify-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Email verification failed');
      }

      // Refresh user data after verification
      await refreshUser();
    } catch (error: any) {
      throw new Error(error.message || 'Email verification failed');
    }
  };

  const loginWithGoogle = async (token: string, role: string = 'guest'): Promise<boolean> => {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/google`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token, role }),
      });

      if (response.ok) {
        const data = await response.json();
        const jwtToken = data.data?.token || data.token;
        const userData = data.data?.user || data.user || data.data;
        
        localStorage.setItem('token', jwtToken);
        setUser(userData);
        setIsAuthenticated(true);
        return true;
      } else {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Google authentication failed');
      }
    } catch (error) {
      console.error('Google login error:', error);
      return false;
    }
  };

  const value = {
    user,
    loading,
    isAuthenticated,
    login,
    register,
    logout,
    refreshUser,
    sendPasswordReset,
    resetPassword,
    verifyEmail,
    loginWithGoogle,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}; 