import React, { ReactElement } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

interface PrivateRouteProps {
  children: ReactElement;
  requireHost?: boolean;
  requireAgent?: boolean;
  requireAdmin?: boolean;
  requireSuperAdmin?: boolean;
}

export const PrivateRoute: React.FC<PrivateRouteProps> = ({ 
  children, 
  requireHost = false, 
  requireAgent = false,
  requireAdmin = false, 
  requireSuperAdmin = false 
}) => {
  const { isAuthenticated, loading, user } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary-600"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    // Check if trying to access admin routes
    if (location.pathname.startsWith('/admin')) {
      return <Navigate to="/admin/login" replace />;
    }
    // Redirect to regular login for non-admin routes
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Check if user is accessing admin routes
  const isAdminRoute = location.pathname.startsWith('/admin');
  const isAgent = user?.is_agent === true;
  const isSuperAdmin = isAgent && user?.email?.includes('admin');

  if (isAdminRoute && !isSuperAdmin) {
    // Regular user trying to access admin routes
    return <Navigate to="/" replace />;
  }

  // Don't auto-redirect agents/admins unless they're accessing wrong interface
  // Let them navigate freely but protect specific routes

  if (requireHost && user && !user.is_host) {
    // Redirect to upgrade page or home if host access is required but user is not a host
    return <Navigate to="/become-host" replace />;
  }

  if (requireAgent && user && !user.is_agent) {
    // Redirect to home if agent access is required but user is not an agent
    return <Navigate to="/" replace />;
  }

  if (requireAdmin && user && !user.is_agent) {
    // Redirect to home if admin access is required but user is not an agent
    return <Navigate to="/" replace />;
  }

  if (requireSuperAdmin && !isSuperAdmin) {
    // Redirect unauthorized access
    if (isAdminRoute) {
      return <Navigate to="/admin/login" replace />;
    }
    return <Navigate to="/" replace />;
  }

  return children;
}; 