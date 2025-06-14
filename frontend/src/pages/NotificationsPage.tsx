import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { 
  Bell, 
  Check, 
  CheckCheck, 
  MessageCircle, 
  Home, 
  Star, 
  Calendar, 
  Shield, 
  Settings, 
  Trash2, 
  Mail,
  Search,
  CheckCircle,
  XCircle,
  DollarSign,
  X
} from 'lucide-react';
import { formatDate } from '../lib/utils';
import { Notification, NotificationType } from '../types';
import { apiService } from '../services/api';
import { useAuth } from '../contexts/AuthContext';

interface NotificationGroup {
  date: string;
  notifications: NotificationWithActions[];
}

interface NotificationWithActions extends Notification {
  actions?: NotificationAction[];
}

interface NotificationAction {
  label: string;
  action: () => void;
  variant?: 'primary' | 'secondary' | 'destructive';
}

const NotificationsPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [notifications, setNotifications] = useState<NotificationWithActions[]>([]);
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'unread' | 'read' | NotificationType>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [selectedNotifications, setSelectedNotifications] = useState<string[]>([]);

  const fetchNotifications = useCallback(async () => {
    setLoading(true);
    try {
      const response = await apiService.getNotifications({ limit: 100 }) as any;
      
      if (response && response.data && response.data.notifications) {
        const notificationsWithActions = response.data.notifications.map(addActionsToNotification);
        setNotifications(notificationsWithActions);
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (user) {
      fetchNotifications();
    }
  }, [user, fetchNotifications]);

  const addActionsToNotification = (notification: Notification): NotificationWithActions => {
    const actions: NotificationAction[] = [];

    // Add default mark as read/unread action
    actions.push({
      label: notification.isRead ? 'Mark as Unread' : 'Mark as Read',
      action: () => notification.isRead ? markAsUnread(notification.id) : markAsRead(notification.id),
      variant: 'secondary'
    });

    // Add specific actions based on notification type
    switch (notification.type) {
      case NotificationType.BOOKING_REQUEST:
        actions.unshift(
          {
            label: 'Accept',
            action: () => handleBookingAction(notification.id, 'accept'),
            variant: 'primary'
          },
          {
            label: 'Decline',
            action: () => handleBookingAction(notification.id, 'decline'),
            variant: 'destructive'
          }
        );
        break;
      
      case NotificationType.MESSAGE_RECEIVED:
        actions.unshift({
          label: 'Reply',
          action: () => navigate('/messages'),
          variant: 'primary'
        });
        break;
      
      case NotificationType.BOOKING_CONFIRMED:
      case NotificationType.BOOKING_APPROVED:
        actions.unshift({
          label: 'View Booking',
          action: () => navigate('/bookings'),
          variant: 'primary'
        });
        break;
      
      case NotificationType.PAYMENT_SUCCESS:
      case NotificationType.PAYMENT_RECEIVED:
        actions.unshift({
          label: 'View Receipt',
          action: () => navigate('/payments'),
          variant: 'primary'
        });
        break;
      
      case NotificationType.REVIEW_RECEIVED:
        actions.unshift(
          {
            label: 'View Review',
            action: () => navigate('/reviews'),
            variant: 'primary'
          },
          {
            label: 'Respond',
            action: () => navigate('/reviews'),
            variant: 'secondary'
          }
        );
        break;
      
      case NotificationType.PROPERTY_APPROVED:
      case NotificationType.PROPERTY_REJECTED:
        actions.unshift({
          label: 'View Property',
          action: () => navigate('/host/properties'),
          variant: 'primary'
        });
        break;
    }

    return { ...notification, actions };
  };

  const markAsRead = async (notificationId: string) => {
    try {
      await apiService.markNotificationAsRead(notificationId);
      setNotifications(prev => prev.map(notification => 
        notification.id === notificationId 
          ? { ...notification, isRead: true }
          : notification
      ));
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const markAsUnread = async (notificationId: string) => {
    try {
      // Note: You might need to add this endpoint to the backend
      setNotifications(prev => prev.map(notification => 
        notification.id === notificationId 
          ? { ...notification, isRead: false }
          : notification
      ));
    } catch (error) {
      console.error('Error marking notification as unread:', error);
    }
  };

  const deleteNotification = async (notificationId: string) => {
    try {
      await apiService.deleteNotification(notificationId);
      setNotifications(prev => prev.filter(notification => notification.id !== notificationId));
    } catch (error) {
      console.error('Error deleting notification:', error);
    }
  };

  const handleBookingAction = async (notificationId: string, action: 'accept' | 'decline') => {
    // Simulate API call for booking action
    console.log(`${action} booking for notification:`, notificationId);
    markAsRead(notificationId);
  };

  const markAllAsRead = async () => {
    try {
      await apiService.markAllNotificationsAsRead();
      setNotifications(prev => prev.map(notification => ({ ...notification, isRead: true })));
    } catch (error) {
      console.error('Error marking all as read:', error);
    }
  };

  const handleBulkAction = async (action: 'read' | 'unread' | 'delete') => {
    try {
      switch (action) {
        case 'read':
          const readPromises = selectedNotifications.map(id => apiService.markNotificationAsRead(id));
          await Promise.all(readPromises);
          setNotifications(prev => prev.map(notification => 
            selectedNotifications.includes(notification.id)
              ? { ...notification, isRead: true }
              : notification
          ));
          break;
        case 'unread':
          // Note: Implement unread endpoint
          setNotifications(prev => prev.map(notification => 
            selectedNotifications.includes(notification.id)
              ? { ...notification, isRead: false }
              : notification
          ));
          break;
        case 'delete':
          const deletePromises = selectedNotifications.map(id => apiService.deleteNotification(id));
          await Promise.all(deletePromises);
          setNotifications(prev => prev.filter(notification => 
            !selectedNotifications.includes(notification.id)
          ));
          break;
      }
      setSelectedNotifications([]);
    } catch (error) {
      console.error('Error performing bulk action:', error);
    }
  };

  const toggleNotificationSelection = (notificationId: string) => {
    setSelectedNotifications(prev => 
      prev.includes(notificationId)
        ? prev.filter(id => id !== notificationId)
        : [...prev, notificationId]
    );
  };

  const getFilteredNotifications = () => {
    let filtered = notifications;

    // Apply search filter
    if (searchQuery) {
      filtered = filtered.filter(notification =>
        notification.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        notification.message.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Apply category filter
    switch (selectedFilter) {
      case 'unread':
        filtered = filtered.filter(notification => !notification.isRead);
        break;
      case 'read':
        filtered = filtered.filter(notification => notification.isRead);
        break;
      default:
        if (selectedFilter !== 'all') {
          filtered = filtered.filter(notification => notification.type === selectedFilter);
        }
        break;
    }

    return filtered.sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  };

  const groupNotificationsByDate = (notifications: NotificationWithActions[]): NotificationGroup[] => {
    const groups: Record<string, NotificationWithActions[]> = {};
    
    notifications.forEach(notification => {
      const date = formatDate(notification.createdAt, 'en-US');
      if (!groups[date]) {
        groups[date] = [];
      }
      groups[date].push(notification);
    });

    return Object.entries(groups).map(([date, notifications]) => ({
      date,
      notifications
    }));
  };

  const getNotificationIcon = (type: NotificationType) => {
    switch (type) {
      case NotificationType.MESSAGE_RECEIVED:
        return <MessageCircle className="w-5 h-5 text-blue-500" />;
      case NotificationType.BOOKING_REQUEST:
        return <Calendar className="w-5 h-5 text-orange-500" />;
      case NotificationType.BOOKING_CONFIRMED:
      case NotificationType.BOOKING_APPROVED:
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case NotificationType.BOOKING_CANCELLED:
      case NotificationType.BOOKING_DECLINED:
        return <XCircle className="w-5 h-5 text-red-500" />;
      case NotificationType.PAYMENT_RECEIVED:
      case NotificationType.PAYMENT_SUCCESS:
        return <DollarSign className="w-5 h-5 text-green-600" />;
      case NotificationType.PAYMENT_FAILED:
        return <XCircle className="w-5 h-5 text-red-500" />;
      case NotificationType.REVIEW_RECEIVED:
        return <Star className="w-5 h-5 text-yellow-500" />;
      case NotificationType.PROPERTY_APPROVED:
        return <Home className="w-5 h-5 text-green-500" />;
      case NotificationType.PROPERTY_REJECTED:
        return <Home className="w-5 h-5 text-red-500" />;
      case NotificationType.KYC_VERIFIED:
        return <Shield className="w-5 h-5 text-green-500" />;
      case NotificationType.KYC_REJECTED:
        return <Shield className="w-5 h-5 text-red-500" />;
      default:
        return <Bell className="w-5 h-5 text-gray-500" />;
    }
  };

  const getNotificationTypeLabel = (type: NotificationType) => {
    return type.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase());
  };

  const formatTimeAgo = (date: Date) => {
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours}h ago`;
    
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `${diffInDays}d ago`;
    
    return formatDate(date, 'en-US');
  };

  const unreadCount = notifications.filter(n => !n.isRead).length;

  if (loading && notifications.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-[#C5A572] mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading notifications...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Notifications</h1>
              <p className="text-gray-600 mt-1">
                {unreadCount > 0 ? `You have ${unreadCount} unread notification${unreadCount > 1 ? 's' : ''}` : 'All caught up!'}
              </p>
            </div>
            <div className="flex items-center space-x-3">
              {unreadCount > 0 && (
                <Button onClick={markAllAsRead} variant="outline" size="sm">
                  <CheckCheck className="w-4 h-4 mr-2" />
                  Mark All Read
                </Button>
              )}
              <Button onClick={() => navigate('/profile')} variant="outline" size="sm">
                <Settings className="w-4 h-4 mr-2" />
                Settings
              </Button>
            </div>
          </div>

          {/* Search and Filters */}
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search notifications..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#C5A572] focus:border-transparent"
              />
            </div>
            
            <div className="flex flex-wrap gap-2">
              {[
                { key: 'all', label: 'All', count: notifications.length },
                { key: 'unread', label: 'Unread', count: notifications.filter(n => !n.isRead).length },
                { key: NotificationType.MESSAGE_RECEIVED, label: 'Messages', count: notifications.filter(n => n.type === NotificationType.MESSAGE_RECEIVED).length },
                { key: NotificationType.BOOKING_REQUEST, label: 'Bookings', count: notifications.filter(n => n.type === NotificationType.BOOKING_REQUEST || n.type === NotificationType.BOOKING_CONFIRMED).length },
                { key: NotificationType.PAYMENT_RECEIVED, label: 'Payments', count: notifications.filter(n => n.type === NotificationType.PAYMENT_RECEIVED).length }
              ].map(filter => (
                <button
                  key={filter.key}
                  onClick={() => setSelectedFilter(filter.key as any)}
                  className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                    selectedFilter === filter.key
                      ? 'bg-[#C5A572] text-white'
                      : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  {filter.label} {filter.count > 0 && `(${filter.count})`}
                </button>
              ))}
            </div>
          </div>

          {/* Bulk Actions */}
          {selectedNotifications.length > 0 && (
            <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-center justify-between">
                <span className="text-sm text-blue-800">
                  {selectedNotifications.length} notification{selectedNotifications.length > 1 ? 's' : ''} selected
                </span>
                <div className="flex items-center space-x-2">
                  <Button onClick={() => handleBulkAction('read')} variant="outline" size="sm">
                    <Check className="w-4 h-4 mr-1" />
                    Mark Read
                  </Button>
                  <Button onClick={() => handleBulkAction('unread')} variant="outline" size="sm">
                    <Mail className="w-4 h-4 mr-1" />
                    Mark Unread
                  </Button>
                  <Button onClick={() => handleBulkAction('delete')} variant="outline" size="sm">
                    <Trash2 className="w-4 h-4 mr-1" />
                    Delete
                  </Button>
                  <Button onClick={() => setSelectedNotifications([])} variant="outline" size="sm">
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Notifications */}
        <div className="space-y-6">
          {groupNotificationsByDate(getFilteredNotifications()).map(group => (
            <div key={group.date}>
              <h3 className="text-sm font-medium text-gray-500 mb-3">{group.date}</h3>
              <div className="space-y-3">
                {group.notifications.map(notification => (
                  <Card key={notification.id} className={`p-4 hover:shadow-md transition-shadow ${!notification.isRead ? 'bg-blue-50 border-blue-200' : ''}`}>
                    <div className="flex items-start space-x-4">
                      <input
                        type="checkbox"
                        checked={selectedNotifications.includes(notification.id)}
                        onChange={() => toggleNotificationSelection(notification.id)}
                        className="mt-1 h-4 w-4 text-[#C5A572] focus:ring-[#C5A572] border-gray-300 rounded"
                      />
                      
                      <div className="flex-shrink-0 mt-1">
                        {getNotificationIcon(notification.type)}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center space-x-2 mb-1">
                              <h4 className={`text-sm font-medium ${!notification.isRead ? 'text-gray-900' : 'text-gray-700'}`}>
                                {notification.title}
                              </h4>
                              {!notification.isRead && (
                                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                              )}
                            </div>
                            <p className="text-sm text-gray-600 mb-2">{notification.message}</p>
                            <div className="flex items-center space-x-4 text-xs text-gray-500">
                              <span>{formatTimeAgo(notification.createdAt)}</span>
                              <Badge variant="secondary" className="text-xs">
                                {getNotificationTypeLabel(notification.type)}
                              </Badge>
                            </div>
                          </div>
                          
                          <div className="flex items-center space-x-2 ml-4">
                            <button
                              onClick={() => notification.isRead ? markAsUnread(notification.id) : markAsRead(notification.id)}
                              className="text-gray-400 hover:text-gray-600"
                            >
                              {notification.isRead ? (
                                <Mail className="w-4 h-4" />
                              ) : (
                                <Check className="w-4 h-4" />
                              )}
                            </button>
                            <button
                              onClick={() => deleteNotification(notification.id)}
                              className="text-gray-400 hover:text-red-600"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                        
                        {/* Action Buttons */}
                        {notification.actions && notification.actions.length > 0 && (
                          <div className="mt-3 flex flex-wrap gap-2">
                            {notification.actions.map((action, index) => (
                              <Button
                                key={index}
                                onClick={action.action}
                                variant={action.variant || 'secondary'}
                                size="sm"
                              >
                                {action.label}
                              </Button>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          ))}
          
          {getFilteredNotifications().length === 0 && (
            <Card className="p-8 text-center">
              <Bell className="w-12 h-12 mx-auto mb-4 text-gray-300" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No notifications found</h3>
              <p className="text-gray-600">
                {searchQuery ? 'Try adjusting your search terms.' : 'You\'re all caught up!'}
              </p>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default NotificationsPage; 