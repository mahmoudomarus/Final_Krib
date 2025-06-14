export type UserRole = 'guest' | 'host' | 'agent' | 'admin' | 'super_admin';

export interface User {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  is_host: boolean;
  is_agent: boolean;
  is_verified: boolean;
  is_active: boolean;
}

export class RoleService {
  /**
   * Determine the primary role of a user based on their flags
   */
  static getUserRole(user: User): UserRole {
    if (!user) return 'guest';
    
    // Check for super admin (agent with admin email)
    if (user.is_agent && user.email?.includes('admin')) {
      return 'super_admin';
    }
    
    // Check for regular admin/agent
    if (user.is_agent) {
      return 'agent';
    }
    
    // Check for host
    if (user.is_host) {
      return 'host';
    }
    
    // Default to guest
    return 'guest';
  }

  /**
   * Get the appropriate dashboard URL for a user's role
   */
  static getDashboardUrl(user: User): string {
    const role = this.getUserRole(user);
    
    switch (role) {
      case 'super_admin':
        return '/admin/dashboard';
      case 'agent':
        return '/listers';
      case 'host':
        return '/host/dashboard';
      case 'guest':
      default:
        return '/';
    }
  }

  /**
   * Get the appropriate redirect URL after login based on role
   */
  static getLoginRedirectUrl(user: User, intendedPath?: string): string {
    // If there's an intended path and it's not an admin route, use it
    if (intendedPath && !intendedPath.startsWith('/admin') && !intendedPath.startsWith('/listers')) {
      return intendedPath;
    }
    
    // Otherwise, redirect to appropriate dashboard
    return this.getDashboardUrl(user);
  }

  /**
   * Get the appropriate redirect URL after registration based on role
   */
  static getRegistrationRedirectUrl(role: UserRole): string {
    switch (role) {
      case 'host':
        return '/host/dashboard';
      case 'agent':
        return '/listers';
      case 'guest':
      default:
        return '/';
    }
  }

  /**
   * Check if user has permission to access a specific route
   */
  static canAccessRoute(user: User, route: string): boolean {
    const userRole = this.getUserRole(user);
    
    // Admin routes
    if (route.startsWith('/admin')) {
      return userRole === 'super_admin';
    }
    
    // Listers routes (for agents)
    if (route.startsWith('/listers')) {
      return userRole === 'agent' || userRole === 'super_admin';
    }
    
    // Agent routes (legacy)
    if (route.startsWith('/agent')) {
      return userRole === 'agent' || userRole === 'super_admin';
    }
    
    // Host routes
    if (route.startsWith('/host')) {
      return userRole === 'host' || userRole === 'super_admin';
    }
    
    // Public and guest routes
    return true;
  }

  /**
   * Get user-friendly role display name
   */
  static getRoleDisplayName(role: UserRole): string {
    switch (role) {
      case 'super_admin':
        return 'Super Administrator';
      case 'agent':
        return 'Real Estate Agent';
      case 'host':
        return 'Property Host';
      case 'guest':
        return 'Guest';
      default:
        return 'User';
    }
  }

  /**
   * Get available navigation options for a user
   */
  static getNavigationOptions(user: User): Array<{
    label: string;
    path: string;
    icon: string;
    role: UserRole;
  }> {
    const userRole = this.getUserRole(user);
    const options = [];

    // Always show guest/home option
    options.push({
      label: 'Browse Properties',
      path: '/',
      icon: 'search',
      role: 'guest' as UserRole
    });

    // Show host option if user is host
    if (user.is_host) {
      options.push({
        label: 'Host Dashboard',
        path: '/host/dashboard',
        icon: 'home',
        role: 'host' as UserRole
      });
    }

    // Show agent option if user is agent
    if (user.is_agent && !user.email?.includes('admin')) {
      options.push({
        label: 'Agent Dashboard',
        path: '/listers',
        icon: 'building',
        role: 'agent' as UserRole
      });
    }

    // Show admin option if user is super admin
    if (userRole === 'super_admin') {
      options.push({
        label: 'Admin Dashboard',
        path: '/admin/dashboard',
        icon: 'shield',
        role: 'super_admin' as UserRole
      });
    }

    return options;
  }

  /**
   * Validate role transition (e.g., guest becoming host)
   */
  static canTransitionToRole(currentUser: User, targetRole: UserRole): boolean {
    const currentRole = this.getUserRole(currentUser);
    
    // Super admins can't transition to other roles
    if (currentRole === 'super_admin') {
      return false;
    }
    
    // Can't transition to super admin
    if (targetRole === 'super_admin') {
      return false;
    }
    
    // Guests can become hosts or agents
    if (currentRole === 'guest') {
      return targetRole === 'host' || targetRole === 'agent';
    }
    
    // Hosts can become agents (but not back to guest)
    if (currentRole === 'host') {
      return targetRole === 'agent';
    }
    
    // Agents can become hosts (but not back to guest)
    if (currentRole === 'agent') {
      return targetRole === 'host';
    }
    
    return false;
  }

  /**
   * Get role-specific onboarding steps
   */
  static getOnboardingSteps(role: UserRole): Array<{
    title: string;
    description: string;
    path: string;
    completed?: boolean;
  }> {
    switch (role) {
      case 'host':
        return [
          {
            title: 'Complete Profile',
            description: 'Add your personal information and verification documents',
            path: '/profile'
          },
          {
            title: 'Add Your First Property',
            description: 'List your property with photos and details',
            path: '/host/properties/new'
          },
          {
            title: 'Set Up Calendar',
            description: 'Configure availability and pricing',
            path: '/host/calendar'
          }
        ];
      
      case 'agent':
        return [
          {
            title: 'Complete Profile',
            description: 'Add your professional information and credentials',
            path: '/profile'
          },
          {
            title: 'Verify License',
            description: 'Upload your real estate license and certifications',
            path: '/kyc-verification'
          },
          {
            title: 'Set Up Commission Structure',
            description: 'Configure your commission rates and payment preferences',
            path: '/listers?tab=settings'
          }
        ];
      
      case 'guest':
      default:
        return [
          {
            title: 'Complete Profile',
            description: 'Add your personal information for easier bookings',
            path: '/profile'
          },
          {
            title: 'Verify Identity',
            description: 'Upload ID for secure bookings',
            path: '/kyc-verification'
          }
        ];
    }
  }
} 