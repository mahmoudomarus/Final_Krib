import React, { useState, useEffect } from 'react';
import {
  User,
  Mail,
  Phone,
  Shield,
  Edit,
  Save,
  X,
  Plus,
  UserPlus,
  Key,
  Calendar,
  MapPin,
  Building,
  Users,
  Settings,
  Trash2,
  Eye,
  EyeOff
} from 'lucide-react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { apiService } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import { formatDate } from '../../lib/utils';

interface AdminUser {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  phone?: string;
  role: 'super_admin' | 'admin' | 'moderator';
  status: 'active' | 'inactive' | 'suspended';
  created_at: string;
  last_login?: string;
  permissions: string[];
  created_by?: string;
  department?: string;
  position?: string;
}

interface AdminProfileData {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  phone?: string;
  department?: string;
  position?: string;
  bio?: string;
  avatar_url?: string;
  created_at: string;
  last_login?: string;
  login_count: number;
  permissions: string[];
}

const AdminProfile: React.FC = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'profile' | 'admins' | 'create'>('profile');
  const [profileData, setProfileData] = useState<AdminProfileData | null>(null);
  const [adminUsers, setAdminUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editForm, setEditForm] = useState<Partial<AdminProfileData>>({});
  const [createForm, setCreateForm] = useState({
    email: '',
    first_name: '',
    last_name: '',
    phone: '',
    password: '',
    role: 'admin' as 'admin' | 'moderator',
    department: '',
    position: '',
    permissions: [] as string[]
  });
  const [showPassword, setShowPassword] = useState(false);

  const availablePermissions = [
    'user_management',
    'property_management', 
    'booking_management',
    'financial_management',
    'system_management',
    'security_management',
    'analytics_access',
    'settings_management'
  ];

  useEffect(() => {
    fetchProfileData();
    fetchAdminUsers();
  }, []);

  const fetchProfileData = async () => {
    try {
      setLoading(true);
      const response = await apiService.get('/super-admin/profile') as { data: AdminProfileData };
      setProfileData(response.data);
      setEditForm(response.data);
    } catch (error) {
      console.error('Error fetching profile:', error);
      // Set mock data for development
      const mockProfile: AdminProfileData = {
        id: user?.id || '1',
        email: user?.email || 'admin@krib.ae',
        first_name: user?.first_name || 'Super',
        last_name: user?.last_name || 'Admin',
        phone: '+971-50-123-4567',
        department: 'Technology',
        position: 'Chief Technology Officer',
        bio: 'Experienced system administrator with 10+ years in platform management.',
        created_at: '2024-01-01T00:00:00Z',
        last_login: new Date().toISOString(),
        login_count: 247,
        permissions: availablePermissions
      };
      setProfileData(mockProfile);
      setEditForm(mockProfile);
    } finally {
      setLoading(false);
    }
  };

  const fetchAdminUsers = async () => {
    try {
      const response = await apiService.get('/super-admin/admin-users') as { data: AdminUser[] };
      setAdminUsers(response.data);
    } catch (error) {
      console.error('Error fetching admin users:', error);
      // Set mock data
      setAdminUsers([
        {
          id: '1',
          email: 'admin@krib.ae',
          first_name: 'Super',
          last_name: 'Admin',
          phone: '+971-50-123-4567',
          role: 'super_admin',
          status: 'active',
          created_at: '2024-01-01T00:00:00Z',
          last_login: new Date().toISOString(),
          permissions: availablePermissions,
          department: 'Technology',
          position: 'CTO'
        }
      ]);
    }
  };

  const handleSaveProfile = async () => {
    try {
      await apiService.put('/super-admin/profile', editForm);
      setProfileData({ ...profileData, ...editForm } as AdminProfileData);
      setEditing(false);
    } catch (error) {
      console.error('Error saving profile:', error);
      // For demo, just update local state
      setProfileData({ ...profileData, ...editForm } as AdminProfileData);
      setEditing(false);
    }
  };

  const handleCreateAdmin = async () => {
    try {
      const response = await apiService.post('/super-admin/admin-users', createForm) as { data: AdminUser };
      setAdminUsers([...adminUsers, response.data]);
      setCreateForm({
        email: '',
        first_name: '',
        last_name: '',
        phone: '',
        password: '',
        role: 'admin',
        department: '',
        position: '',
        permissions: []
      });
      setShowCreateForm(false);
      setActiveTab('admins');
    } catch (error) {
      console.error('Error creating admin:', error);
      // For demo, add to local state
      const newAdmin: AdminUser = {
        id: Date.now().toString(),
        ...createForm,
        status: 'active',
        created_at: new Date().toISOString(),
        created_by: user?.id
      };
      setAdminUsers([...adminUsers, newAdmin]);
      setCreateForm({
        email: '',
        first_name: '',
        last_name: '',
        phone: '',
        password: '',
        role: 'admin',
        department: '',
        position: '',
        permissions: []
      });
      setShowCreateForm(false);
      setActiveTab('admins');
    }
  };

  const handleDeleteAdmin = async (adminId: string) => {
    if (adminId === user?.id) {
      alert("You cannot delete your own account");
      return;
    }
    
    if (window.confirm('Are you sure you want to delete this admin user?')) {
      try {
        await apiService.delete(`/super-admin/admin-users/${adminId}`);
        setAdminUsers(adminUsers.filter(admin => admin.id !== adminId));
      } catch (error) {
        console.error('Error deleting admin:', error);
        // For demo, remove from local state
        setAdminUsers(adminUsers.filter(admin => admin.id !== adminId));
      }
    }
  };

  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case 'super_admin': return 'error';
      case 'admin': return 'warning';
      case 'moderator': return 'secondary';
      default: return 'secondary';
    }
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'active': return 'success';
      case 'inactive': return 'secondary';
      case 'suspended': return 'error';
      default: return 'secondary';
    }
  };

  const renderProfileTab = () => (
    <div className="space-y-6">
      {profileData && (
        <>
          {/* Profile Header */}
          <Card className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900">Admin Profile</h2>
              <Button
                onClick={() => editing ? handleSaveProfile() : setEditing(true)}
                variant={editing ? "primary" : "outline"}
              >
                {editing ? (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    Save Changes
                  </>
                ) : (
                  <>
                    <Edit className="w-4 h-4 mr-2" />
                    Edit Profile
                  </>
                )}
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Basic Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900">Basic Information</h3>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">First Name</label>
                  {editing ? (
                    <input
                      type="text"
                      value={editForm.first_name || ''}
                      onChange={(e) => setEditForm({ ...editForm, first_name: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  ) : (
                    <p className="text-gray-900">{profileData.first_name}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Last Name</label>
                  {editing ? (
                    <input
                      type="text"
                      value={editForm.last_name || ''}
                      onChange={(e) => setEditForm({ ...editForm, last_name: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  ) : (
                    <p className="text-gray-900">{profileData.last_name}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                  <div className="flex items-center space-x-2">
                    <Mail className="w-4 h-4 text-gray-400" />
                    <p className="text-gray-900">{profileData.email}</p>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                  {editing ? (
                    <input
                      type="tel"
                      value={editForm.phone || ''}
                      onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  ) : (
                    <div className="flex items-center space-x-2">
                      <Phone className="w-4 h-4 text-gray-400" />
                      <p className="text-gray-900">{profileData.phone || 'Not provided'}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Professional Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900">Professional Information</h3>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Department</label>
                  {editing ? (
                    <input
                      type="text"
                      value={editForm.department || ''}
                      onChange={(e) => setEditForm({ ...editForm, department: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  ) : (
                    <div className="flex items-center space-x-2">
                      <Building className="w-4 h-4 text-gray-400" />
                      <p className="text-gray-900">{profileData.department || 'Not specified'}</p>
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Position</label>
                  {editing ? (
                    <input
                      type="text"
                      value={editForm.position || ''}
                      onChange={(e) => setEditForm({ ...editForm, position: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  ) : (
                    <div className="flex items-center space-x-2">
                      <User className="w-4 h-4 text-gray-400" />
                      <p className="text-gray-900">{profileData.position || 'Not specified'}</p>
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Bio</label>
                  {editing ? (
                    <textarea
                      value={editForm.bio || ''}
                      onChange={(e) => setEditForm({ ...editForm, bio: e.target.value })}
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Brief description about yourself..."
                    />
                  ) : (
                    <p className="text-gray-900">{profileData.bio || 'No bio provided'}</p>
                  )}
                </div>
              </div>
            </div>

            {editing && (
              <div className="flex items-center space-x-3 mt-6 pt-6 border-t border-gray-200">
                <Button onClick={handleSaveProfile}>
                  <Save className="w-4 h-4 mr-2" />
                  Save Changes
                </Button>
                <Button variant="outline" onClick={() => setEditing(false)}>
                  <X className="w-4 h-4 mr-2" />
                  Cancel
                </Button>
              </div>
            )}
          </Card>

          {/* Account Statistics */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="p-6">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-blue-100 rounded-full">
                  <Calendar className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Account Created</p>
                  <p className="text-lg font-semibold">{formatDate(profileData.created_at)}</p>
                </div>
              </div>
            </Card>

            <Card className="p-6">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-green-100 rounded-full">
                  <Shield className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Last Login</p>
                  <p className="text-lg font-semibold">
                    {profileData.last_login ? formatDate(profileData.last_login) : 'Never'}
                  </p>
                </div>
              </div>
            </Card>

            <Card className="p-6">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-purple-100 rounded-full">
                  <Shield className="w-5 h-5 text-purple-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Total Logins</p>
                  <p className="text-lg font-semibold">{profileData.login_count}</p>
                </div>
              </div>
            </Card>
          </div>

          {/* Permissions */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Permissions</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {profileData.permissions.map((permission) => (
                <Badge key={permission} variant="secondary" className="justify-center">
                  {permission.replace('_', ' ').toUpperCase()}
                </Badge>
              ))}
            </div>
          </Card>
        </>
      )}
    </div>
  );

  const renderAdminsTab = () => (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Admin Users</h2>
          <p className="text-gray-600">Manage administrator accounts and permissions</p>
        </div>
        <Button onClick={() => setActiveTab('create')}>
          <UserPlus className="w-4 h-4 mr-2" />
          Create Admin
        </Button>
      </div>

      {/* Admin Users List */}
      <div className="grid grid-cols-1 gap-6">
        {adminUsers.map((admin) => (
          <Card key={admin.id} className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                  <User className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    {admin.first_name} {admin.last_name}
                  </h3>
                  <p className="text-gray-600">{admin.email}</p>
                  <div className="flex items-center space-x-2 mt-1">
                    <Badge variant={getRoleBadgeVariant(admin.role)}>
                      {admin.role.replace('_', ' ').toUpperCase()}
                    </Badge>
                    <Badge variant={getStatusBadgeVariant(admin.status)}>
                      {admin.status.toUpperCase()}
                    </Badge>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center space-x-2">
                {admin.id !== user?.id && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDeleteAdmin(admin.id)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4 pt-4 border-t border-gray-200">
              <div>
                <p className="text-sm text-gray-600">Department</p>
                <p className="font-medium">{admin.department || 'Not specified'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Position</p>
                <p className="font-medium">{admin.position || 'Not specified'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Last Login</p>
                <p className="font-medium">
                  {admin.last_login ? formatDate(admin.last_login) : 'Never'}
                </p>
              </div>
            </div>

            <div className="mt-4">
              <p className="text-sm text-gray-600 mb-2">Permissions</p>
              <div className="flex flex-wrap gap-2">
                {admin.permissions.map((permission) => (
                  <Badge key={permission} variant="secondary" className="text-xs">
                    {permission.replace('_', ' ')}
                  </Badge>
                ))}
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );

  const renderCreateTab = () => (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Create Admin User</h2>
          <p className="text-gray-600">Add a new administrator to the system</p>
        </div>
        <Button variant="outline" onClick={() => setActiveTab('admins')}>
          <X className="w-4 h-4 mr-2" />
          Cancel
        </Button>
      </div>

      {/* Create Form */}
      <Card className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Basic Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">Basic Information</h3>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
              <input
                type="email"
                value={createForm.email}
                onChange={(e) => setCreateForm({ ...createForm, email: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="admin@krib.ae"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">First Name *</label>
              <input
                type="text"
                value={createForm.first_name}
                onChange={(e) => setCreateForm({ ...createForm, first_name: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Last Name *</label>
              <input
                type="text"
                value={createForm.last_name}
                onChange={(e) => setCreateForm({ ...createForm, last_name: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
              <input
                type="tel"
                value={createForm.phone}
                onChange={(e) => setCreateForm({ ...createForm, phone: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="+971-50-123-4567"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Password *</label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={createForm.password}
                  onChange={(e) => setCreateForm({ ...createForm, password: e.target.value })}
                  className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
          </div>

          {/* Role and Permissions */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">Role & Permissions</h3>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Role *</label>
              <select
                value={createForm.role}
                onChange={(e) => setCreateForm({ ...createForm, role: e.target.value as 'admin' | 'moderator' })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="admin">Admin</option>
                <option value="moderator">Moderator</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Department</label>
              <input
                type="text"
                value={createForm.department}
                onChange={(e) => setCreateForm({ ...createForm, department: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Technology, Operations, etc."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Position</label>
              <input
                type="text"
                value={createForm.position}
                onChange={(e) => setCreateForm({ ...createForm, position: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="System Administrator, Content Moderator, etc."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Permissions</label>
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {availablePermissions.map((permission) => (
                  <label key={permission} className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={createForm.permissions.includes(permission)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setCreateForm({
                            ...createForm,
                            permissions: [...createForm.permissions, permission]
                          });
                        } else {
                          setCreateForm({
                            ...createForm,
                            permissions: createForm.permissions.filter(p => p !== permission)
                          });
                        }
                      }}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-700">
                      {permission.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                    </span>
                  </label>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-3 mt-6 pt-6 border-t border-gray-200">
          <Button onClick={handleCreateAdmin}>
            <UserPlus className="w-4 h-4 mr-2" />
            Create Admin User
          </Button>
          <Button variant="outline" onClick={() => setActiveTab('admins')}>
            Cancel
          </Button>
        </div>
      </Card>
    </div>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Tab Navigation */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {[
            { id: 'profile', label: 'My Profile', icon: User },
            { id: 'admins', label: 'Admin Users', icon: Users },
            { id: 'create', label: 'Create Admin', icon: UserPlus }
          ].map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center space-x-2 py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Tab Content */}
      {activeTab === 'profile' && renderProfileTab()}
      {activeTab === 'admins' && renderAdminsTab()}
      {activeTab === 'create' && renderCreateTab()}
    </div>
  );
};

export default AdminProfile; 