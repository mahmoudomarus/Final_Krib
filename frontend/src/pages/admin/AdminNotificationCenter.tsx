import React, { useState, useEffect } from 'react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { 
  Send, 
  Mail, 
  Download, 
  Edit, 
  Copy, 
  Plus, 
  X, 
  BarChart3, 
  TrendingUp, 
  Clock,
  Search,
  Bell,
  Smartphone,
  Activity,
  RefreshCw,
  BookOpen
} from 'lucide-react';
import { formatDate } from '../../lib/utils';
import { NotificationType } from '../../types';
import { apiService } from '../../services/api';

// Remove the duplicate User interface - use the imported one from types
interface UserProfile {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  isHost: boolean;
  isAgent: boolean;
  createdAt: string;
  lastLogin?: string;
}

interface NotificationTemplate {
  id: string;
  name: string;
  title: string;
  message: string;
  type: NotificationType;
  variables: string[];
  category: 'booking' | 'payment' | 'property' | 'system' | 'marketing';
}

interface AdminNotification {
  id: string;
  title: string;
  message: string;
  type: NotificationType;
  recipientCount: number;
  sentAt: string;
  deliveryStats: {
    sent: number;
    delivered: number;
    read: number;
    failed: number;
  };
}

const AdminNotificationCenter: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'send' | 'templates' | 'history' | 'users' | 'analytics'>('send');
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [templates, setTemplates] = useState<NotificationTemplate[]>([]);
  const [notificationHistory, setNotificationHistory] = useState<AdminNotification[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [userFilter, setUserFilter] = useState<'all' | 'guests' | 'hosts' | 'agents'>('all');
  
  // Notification form state
  const [notificationForm, setNotificationForm] = useState({
    title: '',
    message: '',
    type: NotificationType.SYSTEM_ALERT,
    sendEmail: false,
    sendSMS: false,
    selectedTemplate: '',
  });

  // Template form state
  const [templateForm, setTemplateForm] = useState({
    name: '',
    title: '',
    message: '',
    type: NotificationType.SYSTEM_ALERT,
    category: 'system' as 'booking' | 'payment' | 'property' | 'system' | 'marketing',
    variables: [] as string[],
  });

  const [showTemplateForm, setShowTemplateForm] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<NotificationTemplate | null>(null);
  const [stats, setStats] = useState<any>({});

  useEffect(() => {
    fetchUsers();
    fetchTemplates();
    fetchNotificationHistory();
    fetchStats();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      // Mock API call - replace with real API
      const mockUsers: UserProfile[] = [
        {
          id: '1',
          firstName: 'Ahmed',
          lastName: 'Al Mansoori',
          email: 'ahmed@example.com',
          isHost: true,
          isAgent: false,
          createdAt: '2024-01-15',
          lastLogin: '2024-01-20'
        },
        {
          id: '2',
          firstName: 'Sarah',
          lastName: 'Johnson',
          email: 'sarah@example.com',
          isHost: false,
          isAgent: false,
          createdAt: '2024-01-10',
          lastLogin: '2024-01-19'
        },
        {
          id: '3',
          firstName: 'Mohammad',
          lastName: 'Hassan',
          email: 'mohammad@example.com',
          isHost: false,
          isAgent: true,
          createdAt: '2024-01-05',
          lastLogin: '2024-01-18'
        }
      ];
      setUsers(mockUsers);
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchTemplates = async () => {
    try {
      const mockTemplates: NotificationTemplate[] = [
        {
          id: '1',
          name: 'Booking Confirmation',
          title: 'Your booking is confirmed!',
          message: 'Dear {firstName}, your booking for {propertyName} from {checkIn} to {checkOut} has been confirmed.',
          type: NotificationType.BOOKING_CONFIRMED,
          variables: ['firstName', 'propertyName', 'checkIn', 'checkOut'],
          category: 'booking'
        },
        {
          id: '2',
          name: 'Payment Reminder',
          title: 'Payment due reminder',
          message: 'Hi {firstName}, your payment of {amount} AED is due on {dueDate}.',
          type: NotificationType.PAYMENT_FAILED,
          variables: ['firstName', 'amount', 'dueDate'],
          category: 'payment'
        },
        {
          id: '3',
          name: 'Welcome New Host',
          title: 'Welcome to our host community!',
          message: 'Congratulations {firstName}! Your property {propertyName} has been approved and is now live.',
          type: NotificationType.PROPERTY_APPROVED,
          variables: ['firstName', 'propertyName'],
          category: 'property'
        }
      ];
      setTemplates(mockTemplates);
    } catch (error) {
      console.error('Error fetching templates:', error);
    }
  };

  const fetchNotificationHistory = async () => {
    try {
      const mockHistory: AdminNotification[] = [
        {
          id: '1',
          title: 'System Maintenance Notice',
          message: 'Platform will be under maintenance tonight from 2-4 AM.',
          type: NotificationType.SYSTEM_ALERT,
          recipientCount: 1250,
          sentAt: '2024-01-20T10:00:00Z',
          deliveryStats: {
            sent: 1250,
            delivered: 1248,
            read: 892,
            failed: 2
          }
        },
        {
          id: '2',
          title: 'New Feature: Calendar Sync',
          message: 'Exciting news! You can now sync your calendar with external platforms.',
          type: NotificationType.SYSTEM_ALERT,
          recipientCount: 380,
          sentAt: '2024-01-19T14:30:00Z',
          deliveryStats: {
            sent: 380,
            delivered: 378,
            read: 256,
            failed: 2
          }
        }
      ];
      setNotificationHistory(mockHistory);
    } catch (error) {
      console.error('Error fetching notification history:', error);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await apiService.getAdminNotificationStats() as any;
      if (response && response.data) {
        setStats(response.data);
      }
    } catch (error) {
      console.error('Error fetching notification stats:', error);
      // Mock stats if API fails
      setStats({
        total: 15420,
        unread: 3240,
        recent24h: 89,
        byType: [
          { type: 'BOOKING_REQUEST', count: 4520 },
          { type: 'PAYMENT_SUCCESS', count: 3840 },
          { type: 'MESSAGE_RECEIVED', count: 2890 },
          { type: 'SYSTEM_ALERT', count: 1560 }
        ],
        delivery: {
          total: 15420,
          emailsSent: 12680,
          smsSent: 890,
          pushSent: 14920
        }
      });
    }
  };

  const sendBulkNotification = async () => {
    if (!notificationForm.title || !notificationForm.message || selectedUsers.length === 0) {
      alert('Please fill all fields and select recipients');
      return;
    }

    try {
      setLoading(true);
      await apiService.sendBulkNotification(
        selectedUsers,
        notificationForm.title,
        notificationForm.message,
        notificationForm.type,
        { sendEmail: notificationForm.sendEmail, sendSMS: notificationForm.sendSMS }
      );
      
      alert(`Notification sent to ${selectedUsers.length} users successfully!`);
      setNotificationForm({
        title: '',
        message: '',
        type: NotificationType.SYSTEM_ALERT,
        sendEmail: false,
        sendSMS: false,
        selectedTemplate: '',
      });
      setSelectedUsers([]);
      fetchNotificationHistory();
    } catch (error) {
      console.error('Error sending notification:', error);
      alert('Failed to send notification');
    } finally {
      setLoading(false);
    }
  };

  const applyTemplate = (template: NotificationTemplate) => {
    setNotificationForm(prev => ({
      ...prev,
      title: template.title,
      message: template.message,
      type: template.type,
      selectedTemplate: template.id,
    }));
  };

  const saveTemplate = async () => {
    if (!templateForm.name || !templateForm.title || !templateForm.message) {
      alert('Please fill all required fields');
      return;
    }

    try {
      setLoading(true);
      // Mock API call - replace with real API
      const newTemplate: NotificationTemplate = {
        id: Date.now().toString(),
        ...templateForm,
      };
      
      if (editingTemplate) {
        setTemplates(prev => prev.map(t => t.id === editingTemplate.id ? { ...newTemplate, id: editingTemplate.id } : t));
      } else {
        setTemplates(prev => [...prev, newTemplate]);
      }
      
      setTemplateForm({
        name: '',
        title: '',
        message: '',
        type: NotificationType.SYSTEM_ALERT,
        category: 'system',
        variables: [],
      });
      setShowTemplateForm(false);
      setEditingTemplate(null);
      alert('Template saved successfully!');
    } catch (error) {
      console.error('Error saving template:', error);
      alert('Failed to save template');
    } finally {
      setLoading(false);
    }
  };

  const getFilteredUsers = () => {
    let filtered = users;

    if (searchQuery) {
      filtered = filtered.filter(user =>
        user.firstName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.lastName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.email.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    switch (userFilter) {
      case 'hosts':
        filtered = filtered.filter(user => user.isHost);
        break;
      case 'agents':
        filtered = filtered.filter(user => user.isAgent);
        break;
      case 'guests':
        filtered = filtered.filter(user => !user.isHost && !user.isAgent);
        break;
    }

    return filtered;
  };

  const toggleUserSelection = (userId: string) => {
    setSelectedUsers(prev =>
      prev.includes(userId)
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
  };

  const selectAllUsers = () => {
    const filteredUsers = getFilteredUsers();
    setSelectedUsers(filteredUsers.map(user => user.id));
  };

  const clearSelection = () => {
    setSelectedUsers([]);
  };

  const getUserRole = (user: UserProfile) => {
    if (user.isAgent) return 'Agent';
    if (user.isHost) return 'Host';
    return 'Guest';
  };

  const renderSendTab = () => (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      {/* Notification Form */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-6">Create Notification</h3>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select Template (Optional)
            </label>
            <select
              value={notificationForm.selectedTemplate}
              onChange={(e) => {
                const template = templates.find(t => t.id === e.target.value);
                if (template) applyTemplate(template);
                else setNotificationForm(prev => ({ ...prev, selectedTemplate: e.target.value }));
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#C5A572] focus:border-transparent"
            >
              <option value="">Custom Message</option>
              {templates.map(template => (
                <option key={template.id} value={template.id}>
                  {template.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Notification Type
            </label>
            <select
              value={notificationForm.type}
              onChange={(e) => setNotificationForm(prev => ({ ...prev, type: e.target.value as NotificationType }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#C5A572] focus:border-transparent"
            >
              <option value={NotificationType.SYSTEM_ALERT}>System Alert</option>
              <option value={NotificationType.ADMIN_ALERT}>Admin Alert</option>
              <option value={NotificationType.PROMOTION_OFFER}>Promotion</option>
              <option value={NotificationType.HOST_REMINDER}>Host Reminder</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Title
            </label>
            <input
              type="text"
              value={notificationForm.title}
              onChange={(e) => setNotificationForm(prev => ({ ...prev, title: e.target.value }))}
              placeholder="Enter notification title"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#C5A572] focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Message
            </label>
            <textarea
              value={notificationForm.message}
              onChange={(e) => setNotificationForm(prev => ({ ...prev, message: e.target.value }))}
              placeholder="Enter notification message"
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#C5A572] focus:border-transparent"
            />
          </div>

          <div className="flex items-center space-x-4">
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={notificationForm.sendEmail}
                onChange={(e) => setNotificationForm(prev => ({ ...prev, sendEmail: e.target.checked }))}
                className="h-4 w-4 text-[#C5A572] focus:ring-[#C5A572] border-gray-300 rounded"
              />
              <span className="ml-2 text-sm text-gray-700">Send Email</span>
            </label>
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={notificationForm.sendSMS}
                onChange={(e) => setNotificationForm(prev => ({ ...prev, sendSMS: e.target.checked }))}
                className="h-4 w-4 text-[#C5A572] focus:ring-[#C5A572] border-gray-300 rounded"
              />
              <span className="ml-2 text-sm text-gray-700">Send SMS</span>
            </label>
          </div>

          <Button
            onClick={sendBulkNotification}
            disabled={loading || selectedUsers.length === 0}
            className="w-full"
          >
            <Send className="w-4 h-4 mr-2" />
            Send to {selectedUsers.length} Recipients
          </Button>
        </div>
      </Card>

      {/* User Selection */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-900">Select Recipients</h3>
          <div className="flex items-center space-x-2">
            <Button size="sm" variant="outline" onClick={selectAllUsers}>
              Select All
            </Button>
            <Button size="sm" variant="outline" onClick={clearSelection}>
              Clear
            </Button>
          </div>
        </div>

        {/* Search and Filter */}
        <div className="space-y-4 mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search users..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#C5A572] focus:border-transparent"
            />
          </div>

          <div className="flex space-x-2">
            {['all', 'guests', 'hosts', 'agents'].map(filter => (
              <button
                key={filter}
                onClick={() => setUserFilter(filter as any)}
                className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                  userFilter === filter
                    ? 'bg-[#C5A572] text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {filter.charAt(0).toUpperCase() + filter.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* User List */}
        <div className="max-h-96 overflow-y-auto space-y-2">
          {getFilteredUsers().map(user => (
            <div
              key={user.id}
              onClick={() => toggleUserSelection(user.id)}
              className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                selectedUsers.includes(user.id)
                  ? 'bg-[#C5A572]/10 border-[#C5A572]'
                  : 'bg-white border-gray-200 hover:bg-gray-50'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    checked={selectedUsers.includes(user.id)}
                    readOnly
                    className="h-4 w-4 text-[#C5A572] focus:ring-[#C5A572] border-gray-300 rounded"
                  />
                  <div>
                    <div className="font-medium text-gray-900">
                      {user.firstName} {user.lastName}
                    </div>
                    <div className="text-sm text-gray-600">{user.email}</div>
                  </div>
                </div>
                <Badge variant="secondary" className="text-xs">
                  {getUserRole(user)}
                </Badge>
              </div>
            </div>
          ))}
        </div>

        {getFilteredUsers().length === 0 && (
          <div className="text-center py-8 text-gray-500">
            No users found matching your criteria
          </div>
        )}
      </Card>
    </div>
  );

  const renderTemplatesTab = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900">Notification Templates</h3>
        <Button onClick={() => setShowTemplateForm(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Create Template
        </Button>
      </div>

      {/* Template List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {templates.map(template => (
          <Card key={template.id} className="p-6">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h4 className="font-semibold text-gray-900">{template.name}</h4>
                <Badge variant="secondary" className="mt-1 text-xs">
                  {template.category}
                </Badge>
              </div>
              <div className="flex items-center space-x-2">
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => {
                    setEditingTemplate(template);
                    setTemplateForm({
                      name: template.name,
                      title: template.title,
                      message: template.message,
                      type: template.type,
                      category: template.category,
                      variables: template.variables,
                    });
                    setShowTemplateForm(true);
                  }}
                >
                  <Edit className="w-4 h-4" />
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => applyTemplate(template)}
                >
                  <Copy className="w-4 h-4" />
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <div>
                <div className="text-sm font-medium text-gray-700">Title:</div>
                <div className="text-sm text-gray-600">{template.title}</div>
              </div>
              <div>
                <div className="text-sm font-medium text-gray-700">Message:</div>
                <div className="text-sm text-gray-600 line-clamp-3">{template.message}</div>
              </div>
              {template.variables.length > 0 && (
                <div>
                  <div className="text-sm font-medium text-gray-700">Variables:</div>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {template.variables.map(variable => (
                      <Badge key={variable} variant="outline" className="text-xs">
                        {variable}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </Card>
        ))}
      </div>

      {/* Template Form Modal */}
      {showTemplateForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card className="p-6 max-w-2xl w-full m-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-900">
                {editingTemplate ? 'Edit Template' : 'Create Template'}
              </h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setShowTemplateForm(false);
                  setEditingTemplate(null);
                  setTemplateForm({
                    name: '',
                    title: '',
                    message: '',
                    type: NotificationType.SYSTEM_ALERT,
                    category: 'system',
                    variables: [],
                  });
                }}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Template Name
                </label>
                <input
                  type="text"
                  value={templateForm.name}
                  onChange={(e) => setTemplateForm(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Enter template name"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#C5A572] focus:border-transparent"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Category
                  </label>
                  <select
                    value={templateForm.category}
                    onChange={(e) => setTemplateForm(prev => ({ ...prev, category: e.target.value as any }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#C5A572] focus:border-transparent"
                  >
                    <option value="booking">Booking</option>
                    <option value="payment">Payment</option>
                    <option value="property">Property</option>
                    <option value="system">System</option>
                    <option value="marketing">Marketing</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Type
                  </label>
                  <select
                    value={templateForm.type}
                    onChange={(e) => setTemplateForm(prev => ({ ...prev, type: e.target.value as NotificationType }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#C5A572] focus:border-transparent"
                  >
                    <option value={NotificationType.SYSTEM_ALERT}>System Alert</option>
                    <option value={NotificationType.BOOKING_CONFIRMED}>Booking Confirmed</option>
                    <option value={NotificationType.PAYMENT_SUCCESS}>Payment Success</option>
                    <option value={NotificationType.PROPERTY_APPROVED}>Property Approved</option>
                    <option value={NotificationType.PROMOTION_OFFER}>Promotion</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Title
                </label>
                <input
                  type="text"
                  value={templateForm.title}
                  onChange={(e) => setTemplateForm(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="Enter notification title"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#C5A572] focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Message
                </label>
                <textarea
                  value={templateForm.message}
                  onChange={(e) => setTemplateForm(prev => ({ ...prev, message: e.target.value }))}
                  placeholder="Enter notification message (use {variableName} for variables)"
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#C5A572] focus:border-transparent"
                />
                <div className="text-xs text-gray-500 mt-1">
                  Use curly braces for variables: {'{firstName}'}, {'{propertyName}'}, {'{amount}'}
                </div>
              </div>

              <div className="flex space-x-4">
                <Button onClick={saveTemplate} disabled={loading}>
                  {editingTemplate ? 'Update Template' : 'Create Template'}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowTemplateForm(false);
                    setEditingTemplate(null);
                  }}
                >
                  Cancel
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  );

  const renderHistoryTab = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900">Notification History</h3>
        <Button variant="outline">
          <Download className="w-4 h-4 mr-2" />
          Export
        </Button>
      </div>

      <div className="space-y-4">
        {notificationHistory.map(notification => (
          <Card key={notification.id} className="p-6">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center space-x-3 mb-2">
                  <h4 className="font-semibold text-gray-900">{notification.title}</h4>
                  <Badge variant="secondary">{notification.type}</Badge>
                </div>
                <p className="text-gray-600 mb-3">{notification.message}</p>
                
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <div className="text-gray-500">Sent</div>
                    <div className="font-medium">{notification.deliveryStats.sent}</div>
                  </div>
                  <div>
                    <div className="text-gray-500">Delivered</div>
                    <div className="font-medium text-green-600">{notification.deliveryStats.delivered}</div>
                  </div>
                  <div>
                    <div className="text-gray-500">Read</div>
                    <div className="font-medium text-blue-600">{notification.deliveryStats.read}</div>
                  </div>
                  <div>
                    <div className="text-gray-500">Failed</div>
                    <div className="font-medium text-red-600">{notification.deliveryStats.failed}</div>
                  </div>
                </div>
              </div>

              <div className="text-right text-sm text-gray-500">
                {formatDate(notification.sentAt)}
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );

  const renderAnalyticsTab = () => (
    <div className="space-y-8">
      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="p-6">
          <div className="flex items-center">
            <Bell className="w-8 h-8 text-blue-500" />
            <div className="ml-4">
              <div className="text-2xl font-bold text-gray-900">{stats.total?.toLocaleString()}</div>
              <div className="text-sm text-gray-600">Total Notifications</div>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center">
            <Mail className="w-8 h-8 text-green-500" />
            <div className="ml-4">
              <div className="text-2xl font-bold text-gray-900">{stats.delivery?.emailsSent?.toLocaleString()}</div>
              <div className="text-sm text-gray-600">Emails Sent</div>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center">
            <Smartphone className="w-8 h-8 text-purple-500" />
            <div className="ml-4">
              <div className="text-2xl font-bold text-gray-900">{stats.delivery?.smsSent?.toLocaleString()}</div>
              <div className="text-sm text-gray-600">SMS Sent</div>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center">
            <Activity className="w-8 h-8 text-orange-500" />
            <div className="ml-4">
              <div className="text-2xl font-bold text-gray-900">{stats.recent24h}</div>
              <div className="text-sm text-gray-600">Last 24 Hours</div>
            </div>
          </div>
        </Card>
      </div>

      {/* Notification Types Breakdown */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-6">Notifications by Type</h3>
        <div className="space-y-4">
          {stats.byType?.map((item: any) => (
            <div key={item.type} className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-4 h-4 bg-blue-500 rounded"></div>
                <span className="font-medium">{item.type.replace(/_/g, ' ')}</span>
              </div>
              <div className="text-right">
                <div className="font-semibold">{item.count.toLocaleString()}</div>
                <div className="text-sm text-gray-600">
                  {((item.count / stats.total) * 100).toFixed(1)}%
                </div>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Notification Center</h1>
              <p className="text-gray-600 mt-1">Manage and send notifications to platform users</p>
            </div>
            <div className="flex items-center space-x-4">
              <Button variant="outline" onClick={fetchStats}>
                <RefreshCw className="w-4 h-4 mr-2" />
                Refresh
              </Button>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200 mb-8">
          <nav className="-mb-px flex space-x-8">
            {[
              { key: 'send', label: 'Send Notification', icon: Send },
              { key: 'templates', label: 'Templates', icon: BookOpen },
              { key: 'history', label: 'History', icon: Clock },
              { key: 'analytics', label: 'Analytics', icon: BarChart3 },
            ].map(tab => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key as any)}
                className={`py-2 px-1 border-b-2 font-medium text-sm flex items-center ${
                  activeTab === tab.key
                    ? 'border-[#C5A572] text-[#C5A572]'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <tab.icon className="w-4 h-4 mr-2" />
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Tab Content */}
        {activeTab === 'send' && renderSendTab()}
        {activeTab === 'templates' && renderTemplatesTab()}
        {activeTab === 'history' && renderHistoryTab()}
        {activeTab === 'analytics' && renderAnalyticsTab()}
      </div>
    </div>
  );
};

export default AdminNotificationCenter; 