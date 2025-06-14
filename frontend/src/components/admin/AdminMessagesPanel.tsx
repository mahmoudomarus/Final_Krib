import React, { useState, useEffect } from 'react';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { 
  MessageSquare,
  Send,
  Search,
  User,
  Crown,
  Home,
  Users
} from 'lucide-react';
import { apiService } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';

interface AdminUser {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  avatar?: string;
  isHost: boolean;
  isAgent: boolean;
}

const AdminMessagesPanel: React.FC = () => {
  const { user } = useAuth();
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null);
  const [message, setMessage] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [sentMessages, setSentMessages] = useState<string[]>([]);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await apiService.getAllUsers() as any;
      
      if (response && response.data && Array.isArray(response.data)) {
        setUsers(response.data);
      } else if (response && Array.isArray(response)) {
        setUsers(response);
      }
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setLoading(false);
    }
  };

  const sendMessage = async () => {
    if (!selectedUser || !message.trim()) return;

    try {
      setSending(true);
      const response = await apiService.sendAdminMessage(
        selectedUser.id, 
        message.trim(), 
        'TEXT', 
        true
      ) as any;

      if (response && response.success) {
        setSentMessages(prev => [...prev, selectedUser.id]);
        setMessage('');
        alert('Message sent successfully!');
      }
    } catch (error) {
      console.error('Error sending message:', error);
      alert('Failed to send message. Please try again.');
    } finally {
      setSending(false);
    }
  };

  const getFilteredUsers = () => {
    return users.filter(u => 
      u.firstName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.lastName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.email.toLowerCase().includes(searchQuery.toLowerCase())
    );
  };

  const getUserRole = (user: AdminUser) => {
    if (user.isAgent && user.isHost) return 'Agent & Host';
    if (user.isAgent) return 'Agent';
    if (user.isHost) return 'Host';
    return 'Guest';
  };

  const getRoleIcon = (user: AdminUser) => {
    if (user.isAgent) return <Crown className="w-4 h-4 text-purple-600" />;
    if (user.isHost) return <Home className="w-4 h-4 text-blue-600" />;
    return <User className="w-4 h-4 text-gray-600" />;
  };

  const getRoleBadgeVariant = (user: AdminUser): "default" | "secondary" | "success" | "warning" | "error" => {
    if (user.isAgent) return 'warning';
    if (user.isHost) return 'success';
    return 'secondary';
  };

  if (!user || (user.email !== 'admin@uae-rental.com' && !user.email?.endsWith('@admin.uae-rental.com'))) {
    return (
      <Card className="p-8 text-center">
        <MessageSquare className="w-16 h-16 mx-auto mb-4 text-gray-300" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">Access Denied</h3>
        <p className="text-gray-600">You need admin privileges to access this panel.</p>
      </Card>
    );
  }

  if (loading) {
    return (
      <Card className="p-8 text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
        <p className="text-gray-600">Loading users...</p>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 flex items-center">
            <Crown className="w-6 h-6 mr-3 text-yellow-600" />
            Admin Messages Panel
          </h2>
          <p className="text-gray-600 mt-1">Send messages to any user in the system</p>
        </div>
        <Badge variant="warning" className="flex items-center">
          <Users className="w-4 h-4 mr-1" />
          {users.length} Users
        </Badge>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Users List */}
        <Card>
          <div className="p-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold mb-4">Select User</h3>
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search users..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>
          </div>

          <div className="max-h-96 overflow-y-auto">
            {getFilteredUsers().length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                <Users className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                <p>No users found</p>
              </div>
            ) : (
              getFilteredUsers().map((u) => (
                <div
                  key={u.id}
                  onClick={() => setSelectedUser(u)}
                  className={`p-4 border-b border-gray-100 cursor-pointer hover:bg-gray-50 transition-colors ${
                    selectedUser?.id === u.id ? 'bg-primary-50 border-primary-200' : ''
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                      {getRoleIcon(u)}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <h4 className="font-medium text-gray-900 truncate">
                          {u.firstName} {u.lastName}
                        </h4>
                        {sentMessages.includes(u.id) && (
                          <Badge variant="success" className="text-xs">Sent</Badge>
                        )}
                      </div>
                      
                      <p className="text-sm text-gray-600 mb-1 truncate">{u.email}</p>
                      
                      <Badge 
                        variant={getRoleBadgeVariant(u)}
                        className="text-xs"
                      >
                        {getUserRole(u)}
                      </Badge>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </Card>

        {/* Message Composer */}
        <Card>
          <div className="p-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold">Compose Message</h3>
            {selectedUser && (
              <div className="mt-2 flex items-center space-x-2">
                <span className="text-sm text-gray-600">To:</span>
                <Badge variant="secondary" className="flex items-center">
                  {getRoleIcon(selectedUser)}
                  <span className="ml-1">{selectedUser.firstName} {selectedUser.lastName}</span>
                </Badge>
              </div>
            )}
          </div>

          {selectedUser ? (
            <div className="p-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Message
                </label>
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Type your message here..."
                  rows={6}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="text-sm text-gray-500">
                  {message.length}/500 characters
                </div>
                <Button
                  onClick={sendMessage}
                  disabled={!message.trim() || sending}
                  leftIcon={<Send className="w-4 h-4" />}
                  loading={sending}
                >
                  {sending ? 'Sending...' : 'Send Message'}
                </Button>
              </div>

              {/* Quick Message Templates */}
              <div className="border-t pt-4">
                <p className="text-sm font-medium text-gray-700 mb-2">Quick Templates:</p>
                <div className="space-y-2">
                  {[
                    'Welcome to UAE Rental Platform! We\'re excited to have you as part of our community.',
                    'Thank you for using our platform. If you have any questions, feel free to reach out.',
                    'We noticed some activity on your account. Please review and contact us if you have concerns.',
                    'Your account has been verified successfully. You can now access all features.'
                  ].map((template, index) => (
                    <button
                      key={index}
                      onClick={() => setMessage(template)}
                      className="w-full text-left p-2 text-sm bg-gray-50 hover:bg-gray-100 rounded border text-gray-700 transition-colors"
                    >
                      {template}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="p-8 text-center text-gray-500">
              <MessageSquare className="w-12 h-12 mx-auto mb-4 text-gray-300" />
              <h4 className="font-medium text-gray-900 mb-2">Select a User</h4>
              <p className="text-sm">Choose a user from the list to start composing a message</p>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
};

export default AdminMessagesPanel; 