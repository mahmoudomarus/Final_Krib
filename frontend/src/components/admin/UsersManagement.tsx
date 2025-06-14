import React, { useState, useEffect } from 'react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { apiService } from '../../services/api';
import { formatDate } from '../../lib/utils';
import {
  Users,
  Search,
  Filter,
  Plus,
  Edit,
  Shield,
  ShieldCheck,
  ShieldX,
  Eye,
  Ban,
  CheckCircle,
  AlertTriangle,
  MoreHorizontal,
  UserCheck,
  Calendar,
  Mail,
  Phone,
  Activity,
  RefreshCw
} from 'lucide-react';

interface User {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  phone?: string;
  is_host: boolean;
  is_agent: boolean;
  is_verified?: boolean;
  avatar_url?: string;
  created_at: string;
  updated_at: string;
  last_login_at?: string;
  status: 'active' | 'suspended' | 'pending' | 'deleted';
  verification_level?: 'unverified' | 'pending' | 'verified';
  suspension_reason?: string;
  suspension_until?: string;
  properties?: { count: number }[];
  bookings_as_guest?: { count: number }[];
  bookings_as_host?: { count: number }[];
}

interface UserStats {
  total: number;
  active: number;
  suspended: number;
  pending: number;
  guests: number;
  hosts: number;
  agents: number;
  verified: number;
  unverified: number;
}

interface UsersResponse {
  users: User[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  stats: UserStats;
}

const UsersManagement: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [stats, setStats] = useState<UserStats | null>(null);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0
  });
  const [loading, setLoading] = useState(true);
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [filters, setFilters] = useState({
    status: '',
    role: '',
    search: '',
    sortBy: 'created_at',
    sortOrder: 'desc'
  });
  const [showFilters, setShowFilters] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [showSuspendModal, setShowSuspendModal] = useState(false);
  const [showAddUserModal, setShowAddUserModal] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    fetchUsers();
  }, [pagination.page, filters]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
        ...(filters.status && { status: filters.status }),
        ...(filters.role && { role: filters.role }),
        ...(filters.search && { search: filters.search }),
        sortBy: filters.sortBy,
        sortOrder: filters.sortOrder
      });

      const response = await apiService.get(`/super-admin/users?${params}`) as { data: UsersResponse };
      const data: UsersResponse = response.data;
      
      setUsers(data.users);
      setStats(data.stats);
      setPagination(data.pagination);
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUserAction = async (action: string, userId: string, data?: any) => {
    try {
      setActionLoading(true);
      let endpoint = '';
      let method = 'POST';
      
      switch (action) {
        case 'suspend':
          endpoint = `/super-admin/users/${userId}/suspend`;
          break;
        case 'unsuspend':
          endpoint = `/super-admin/users/${userId}/unsuspend`;
          break;
        case 'verify':
          endpoint = `/super-admin/users/${userId}/verify`;
          break;
        case 'delete':
          endpoint = `/super-admin/users/${userId}`;
          method = 'DELETE';
          break;
        case 'update':
          endpoint = `/super-admin/users/${userId}`;
          method = 'PUT';
          break;
      }
      
      if (method === 'DELETE') {
        await apiService.delete(endpoint, data);
      } else if (method === 'PUT') {
        await apiService.put(endpoint, data);
      } else {
        await apiService.post(endpoint, data);
      }
      
      await fetchUsers(); // Refresh the list
      setShowSuspendModal(false);
      setSelectedUser(null);
    } catch (error) {
      console.error(`Error performing ${action}:`, error);
    } finally {
      setActionLoading(false);
    }
  };

  const handleCreateUser = async (userData: any) => {
    try {
      setActionLoading(true);
      await apiService.post('/super-admin/users', userData);
      await fetchUsers(); // Refresh the list
      setShowAddUserModal(false);
    } catch (error) {
      console.error('Error creating user:', error);
      // You could add a toast notification here
    } finally {
      setActionLoading(false);
    }
  };

  const getUserBadgeColor = (status: string) => {
    switch (status) {
      case 'active': return 'success';
      case 'suspended': return 'error';
      case 'pending': return 'warning';
      case 'deleted': return 'gray';
      default: return 'gray';
    }
  };

  const getRoleBadge = (user: User) => {
    if (user.is_agent) return { label: 'Agent', color: 'purple' };
    if (user.is_host) return { label: 'Host', color: 'blue' };
    return { label: 'Guest', color: 'gray' };
  };

  const formatUserName = (user: User) => {
    return `${user.first_name} ${user.last_name}`.trim() || user.email.split('@')[0];
  };

  const getPropertyCount = (user: User) => {
    return user.properties?.[0]?.count || 0;
  };

  const getBookingCount = (user: User) => {
    const guestBookings = user.bookings_as_guest?.[0]?.count || 0;
    const hostBookings = user.bookings_as_host?.[0]?.count || 0;
    return guestBookings + hostBookings;
  };

  if (loading && users.length === 0) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-16 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">User Management</h2>
          <p className="text-gray-600">Manage platform users, roles, and permissions</p>
        </div>
        <div className="flex items-center space-x-3">
          <Button onClick={() => setShowFilters(!showFilters)} variant="outline">
            <Filter className="w-4 h-4 mr-2" />
            Filters
          </Button>
          <Button onClick={fetchUsers} variant="outline">
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button onClick={() => setShowAddUserModal(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Add User
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 lg:grid-cols-8 gap-4">
          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Users</p>
                <p className="text-2xl font-bold">{stats.total}</p>
              </div>
              <Users className="w-8 h-8 text-blue-500" />
            </div>
          </Card>
          
          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Active</p>
                <p className="text-2xl font-bold text-green-600">{stats.active}</p>
              </div>
              <CheckCircle className="w-8 h-8 text-green-500" />
            </div>
          </Card>
          
          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Suspended</p>
                <p className="text-2xl font-bold text-red-600">{stats.suspended}</p>
              </div>
              <Ban className="w-8 h-8 text-red-500" />
            </div>
          </Card>
          
          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Pending</p>
                <p className="text-2xl font-bold text-yellow-600">{stats.pending}</p>
              </div>
              <AlertTriangle className="w-8 h-8 text-yellow-500" />
            </div>
          </Card>
          
          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Guests</p>
                <p className="text-2xl font-bold">{stats.guests}</p>
              </div>
              <UserCheck className="w-8 h-8 text-gray-500" />
            </div>
          </Card>
          
          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Hosts</p>
                <p className="text-2xl font-bold">{stats.hosts}</p>
              </div>
              <UserCheck className="w-8 h-8 text-blue-500" />
            </div>
          </Card>
          
          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Agents</p>
                <p className="text-2xl font-bold">{stats.agents}</p>
              </div>
              <Shield className="w-8 h-8 text-purple-500" />
            </div>
          </Card>
          
          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Verified</p>
                <p className="text-2xl font-bold text-green-600">{stats.verified}</p>
              </div>
              <ShieldCheck className="w-8 h-8 text-green-500" />
            </div>
          </Card>
        </div>
      )}

      {/* Users Table */}
      <Card className="overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium text-gray-900">
              Users ({pagination.total})
            </h3>
          </div>
        </div>
        
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  User
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Role
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Verification
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Activity
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Joined
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {users.map((user) => {
                const role = getRoleBadge(user);
                const propertyCount = getPropertyCount(user);
                const bookingCount = getBookingCount(user);
                
                return (
                  <tr key={user.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10">
                          {user.avatar_url ? (
                            <img className="h-10 w-10 rounded-full" src={user.avatar_url} alt="" />
                          ) : (
                            <div className="h-10 w-10 rounded-full bg-gray-300 flex items-center justify-center">
                              <span className="text-sm font-medium text-gray-700">
                                {formatUserName(user).charAt(0).toUpperCase()}
                              </span>
                            </div>
                          )}
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">
                            {formatUserName(user)}
                          </div>
                          <div className="text-sm text-gray-500 flex items-center">
                            <Mail className="w-3 h-3 mr-1" />
                            {user.email}
                          </div>
                          {user.phone && (
                            <div className="text-sm text-gray-500 flex items-center">
                              <Phone className="w-3 h-3 mr-1" />
                              {user.phone}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Badge variant={role.color as any}>{role.label}</Badge>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Badge variant={getUserBadgeColor(user.status) as any}>
                        {user.status}
                      </Badge>
                      {user.suspension_reason && (
                        <div className="text-xs text-red-600 mt-1">
                          {user.suspension_reason}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        {user.verification_level === 'verified' ? (
                          <ShieldCheck className="w-4 h-4 text-green-500 mr-1" />
                        ) : user.verification_level === 'pending' ? (
                          <Shield className="w-4 h-4 text-yellow-500 mr-1" />
                        ) : (
                          <ShieldX className="w-4 h-4 text-red-500 mr-1" />
                        )}
                        <span className="text-sm capitalize">
                          {user.verification_level || 'unverified'}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      <div className="space-y-1">
                        {propertyCount > 0 && (
                          <div className="flex items-center text-xs text-gray-600">
                            <Activity className="w-3 h-3 mr-1" />
                            {propertyCount} properties
                          </div>
                        )}
                        {bookingCount > 0 && (
                          <div className="flex items-center text-xs text-gray-600">
                            <Calendar className="w-3 h-3 mr-1" />
                            {bookingCount} bookings
                          </div>
                        )}
                        {user.last_login_at && (
                          <div className="text-xs text-gray-500">
                            Last: {formatDate(user.last_login_at)}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(user.created_at)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end space-x-2">
                        <Button size="sm" variant="ghost">
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button size="sm" variant="ghost">
                          <Edit className="w-4 h-4" />
                        </Button>
                        {user.status === 'active' ? (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => {
                              setSelectedUser(user);
                              setShowSuspendModal(true);
                            }}
                          >
                            <Ban className="w-4 h-4 text-red-500" />
                          </Button>
                        ) : user.status === 'suspended' ? (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleUserAction('unsuspend', user.id)}
                          >
                            <CheckCircle className="w-4 h-4 text-green-500" />
                          </Button>
                        ) : null}
                        <Button size="sm" variant="ghost">
                          <MoreHorizontal className="w-4 h-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Suspend User Modal */}
      {showSuspendModal && selectedUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              Suspend User: {formatUserName(selectedUser)}
            </h3>
            <form onSubmit={(e) => {
              e.preventDefault();
              const formData = new FormData(e.currentTarget);
              handleUserAction('suspend', selectedUser.id, {
                reason: formData.get('reason'),
                duration: formData.get('duration') ? Number(formData.get('duration')) : null
              });
            }}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Reason for suspension
                  </label>
                  <textarea
                    name="reason"
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    rows={3}
                    placeholder="Enter reason for suspension..."
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Duration (days, leave empty for permanent)
                  </label>
                  <input
                    name="duration"
                    type="number"
                    min="1"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter duration in days..."
                  />
                </div>
              </div>
              <div className="mt-6 flex items-center justify-end space-x-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setShowSuspendModal(false);
                    setSelectedUser(null);
                  }}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="destructive"
                  disabled={actionLoading}
                >
                  {actionLoading ? 'Suspending...' : 'Suspend User'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add User Modal */}
      {showAddUserModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              Add New User
            </h3>
            <form onSubmit={(e) => {
              e.preventDefault();
              const formData = new FormData(e.currentTarget);
              const userData = {
                email: formData.get('email'),
                first_name: formData.get('first_name'),
                last_name: formData.get('last_name'),
                phone: formData.get('phone'),
                password: formData.get('password'),
                is_host: formData.get('is_host') === 'on',
                is_agent: formData.get('is_agent') === 'on',
                status: formData.get('status') || 'active',
                verification_level: formData.get('verification_level') || 'unverified',
                send_welcome_email: formData.get('send_welcome_email') === 'on'
              };
              handleCreateUser(userData);
            }}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Personal Information */}
                <div className="md:col-span-2">
                  <h4 className="text-md font-medium text-gray-900 mb-3 border-b pb-2">
                    Personal Information
                  </h4>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    First Name *
                  </label>
                  <input
                    name="first_name"
                    type="text"
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter first name"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Last Name *
                  </label>
                  <input
                    name="last_name"
                    type="text"
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter last name"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email Address *
                  </label>
                  <input
                    name="email"
                    type="email"
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter email address"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Phone Number
                  </label>
                  <input
                    name="phone"
                    type="tel"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="+971 50 123 4567"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Password *
                  </label>
                  <input
                    name="password"
                    type="password"
                    required
                    minLength={8}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter password (min 8 characters)"
                  />
                </div>
                
                {/* Account Settings */}
                <div className="md:col-span-2 mt-4">
                  <h4 className="text-md font-medium text-gray-900 mb-3 border-b pb-2">
                    Account Settings
                  </h4>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Account Status
                  </label>
                  <select
                    name="status"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="active">Active</option>
                    <option value="pending">Pending</option>
                    <option value="suspended">Suspended</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Verification Level
                  </label>
                  <select
                    name="verification_level"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="unverified">Unverified</option>
                    <option value="pending">Pending Verification</option>
                    <option value="verified">Verified</option>
                  </select>
                </div>
                
                {/* User Roles */}
                <div className="md:col-span-2 mt-4">
                  <h4 className="text-md font-medium text-gray-900 mb-3 border-b pb-2">
                    User Roles
                  </h4>
                  <div className="space-y-3">
                    <label className="flex items-center">
                      <input
                        name="is_host"
                        type="checkbox"
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="ml-2 text-sm text-gray-700">
                        Host - Can list and manage properties
                      </span>
                    </label>
                    
                    <label className="flex items-center">
                      <input
                        name="is_agent"
                        type="checkbox"
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="ml-2 text-sm text-gray-700">
                        Agent - Real estate agent with special permissions
                      </span>
                    </label>
                  </div>
                </div>
                
                {/* Notification Settings */}
                <div className="md:col-span-2 mt-4">
                  <h4 className="text-md font-medium text-gray-900 mb-3 border-b pb-2">
                    Notification Settings
                  </h4>
                  <div className="space-y-3">
                    <label className="flex items-center">
                      <input
                        name="send_welcome_email"
                        type="checkbox"
                        defaultChecked
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="ml-2 text-sm text-gray-700">
                        Send welcome email to user
                      </span>
                    </label>
                  </div>
                </div>
              </div>
              
              <div className="mt-6 flex items-center justify-end space-x-3 pt-4 border-t">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowAddUserModal(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={actionLoading}
                >
                  {actionLoading ? 'Creating User...' : 'Create User'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default UsersManagement; 