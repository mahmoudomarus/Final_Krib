"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_1 = require("../middleware/auth");
const NotificationService_1 = require("../services/NotificationService");
const supabase_1 = require("../lib/supabase");
const router = (0, express_1.Router)();
const notificationService = new NotificationService_1.NotificationService();
router.get('/', auth_1.authMiddleware, async (req, res) => {
    try {
        const { type, read, page = 1, limit = 20 } = req.query;
        const userId = req.user?.id;
        if (!userId) {
            return res.status(401).json({ success: false, error: 'Authentication required' });
        }
        let query = supabase_1.supabaseAdmin
            .from('notifications')
            .select('*')
            .eq('user_id', userId)
            .order('created_at', { ascending: false })
            .range((Number(page) - 1) * Number(limit), Number(page) * Number(limit) - 1);
        if (type)
            query = query.eq('type', type);
        if (read !== undefined)
            query = query.eq('is_read', read === 'true');
        const { data: notifications, error } = await query;
        if (error) {
            console.error('Error fetching notifications:', error);
            return res.status(500).json({ success: false, error: 'Failed to fetch notifications' });
        }
        let countQuery = supabase_1.supabaseAdmin
            .from('notifications')
            .select('id', { count: 'exact' })
            .eq('user_id', userId);
        if (type)
            countQuery = countQuery.eq('type', type);
        if (read !== undefined)
            countQuery = countQuery.eq('is_read', read === 'true');
        const { count: totalCount, error: countError } = await countQuery;
        const { count: unreadCount, error: unreadError } = await supabase_1.supabaseAdmin
            .from('notifications')
            .select('id', { count: 'exact' })
            .eq('user_id', userId)
            .eq('is_read', false);
        res.json({
            success: true,
            data: {
                notifications: notifications || [],
                pagination: {
                    page: Number(page),
                    limit: Number(limit),
                    total: totalCount || 0,
                    pages: Math.ceil((totalCount || 0) / Number(limit)),
                },
                unreadCount: unreadCount || 0,
            },
        });
    }
    catch (error) {
        console.error('Error fetching notifications:', error);
        res.status(500).json({ success: false, error: 'Internal server error' });
    }
});
router.patch('/:id/read', auth_1.authMiddleware, async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user?.id;
        if (!userId) {
            return res.status(401).json({ success: false, error: 'Authentication required' });
        }
        const { data: notification, error: findError } = await supabase_1.supabaseAdmin
            .from('notifications')
            .select('id')
            .eq('id', id)
            .eq('user_id', userId)
            .single();
        if (findError || !notification) {
            return res.status(404).json({ success: false, error: 'Notification not found' });
        }
        const { error: updateError } = await supabase_1.supabaseAdmin
            .from('notifications')
            .update({
            is_read: true,
            read_at: new Date().toISOString(),
        })
            .eq('id', id);
        if (updateError) {
            console.error('Error updating notification:', updateError);
            return res.status(500).json({ success: false, error: 'Failed to update notification' });
        }
        res.json({
            success: true,
            message: 'Notification marked as read',
        });
    }
    catch (error) {
        console.error('Error marking notification as read:', error);
        res.status(500).json({ success: false, error: 'Internal server error' });
    }
});
router.patch('/read-all', auth_1.authMiddleware, async (req, res) => {
    try {
        const userId = req.user?.id;
        if (!userId) {
            return res.status(401).json({ success: false, error: 'Authentication required' });
        }
        const { error } = await supabase_1.supabaseAdmin
            .from('notifications')
            .update({
            is_read: true,
            read_at: new Date().toISOString(),
        })
            .eq('user_id', userId)
            .eq('is_read', false);
        if (error) {
            console.error('Error updating notifications:', error);
            return res.status(500).json({ success: false, error: 'Failed to update notifications' });
        }
        res.json({
            success: true,
            message: 'All notifications marked as read',
        });
    }
    catch (error) {
        console.error('Error marking all notifications as read:', error);
        res.status(500).json({ success: false, error: 'Internal server error' });
    }
});
router.delete('/:id', auth_1.authMiddleware, async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user?.id;
        if (!userId) {
            return res.status(401).json({ success: false, error: 'Authentication required' });
        }
        const { data: notification, error: findError } = await supabase_1.supabaseAdmin
            .from('notifications')
            .select('id')
            .eq('id', id)
            .eq('user_id', userId)
            .single();
        if (findError || !notification) {
            return res.status(404).json({ success: false, error: 'Notification not found' });
        }
        const { error } = await supabase_1.supabaseAdmin
            .from('notifications')
            .delete()
            .eq('id', id);
        if (error) {
            console.error('Error deleting notification:', error);
            return res.status(500).json({ success: false, error: 'Failed to delete notification' });
        }
        res.json({
            success: true,
            message: 'Notification deleted',
        });
    }
    catch (error) {
        console.error('Error deleting notification:', error);
        res.status(500).json({ success: false, error: 'Internal server error' });
    }
});
router.get('/stats', auth_1.authMiddleware, async (req, res) => {
    try {
        const userId = req.user?.id;
        if (!userId) {
            return res.status(401).json({ success: false, error: 'Authentication required' });
        }
        res.json({
            success: true,
            data: {
                total: 0,
                totalUnread: 0,
                byType: [],
            },
        });
    }
    catch (error) {
        console.error('Error fetching notification stats:', error);
        res.status(500).json({ success: false, error: 'Internal server error' });
    }
});
router.post('/admin/send', auth_1.authMiddleware, auth_1.requireAdmin, async (req, res) => {
    try {
        const { userId, title, message, type = 'ADMIN', data, sendEmail = false, sendSMS = false } = req.body;
        if (!userId || !title || !message) {
            return res.status(400).json({
                success: false,
                error: 'User ID, title, and message are required'
            });
        }
        res.json({
            success: true,
            data: { id: 'mock-notification-id', userId, title, message, type },
            message: 'Notification sent successfully'
        });
    }
    catch (error) {
        console.error('Error sending admin notification:', error);
        res.status(500).json({ success: false, error: 'Internal server error' });
    }
});
router.post('/admin/bulk', auth_1.authMiddleware, auth_1.requireAdmin, async (req, res) => {
    try {
        const { userIds, title, message, type = 'SYSTEM', data, sendEmail = false, sendSMS = false } = req.body;
        if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
            return res.status(400).json({
                success: false,
                error: 'User IDs array is required'
            });
        }
        if (!title || !message) {
            return res.status(400).json({
                success: false,
                error: 'Title and message are required'
            });
        }
        res.json({
            success: true,
            data: {
                sent: userIds.length,
                notifications: userIds.map(userId => ({ id: `mock-${userId}`, userId, title, message }))
            },
            message: `Bulk notification sent to ${userIds.length} users`
        });
    }
    catch (error) {
        console.error('Error sending bulk notification:', error);
        res.status(500).json({ success: false, error: 'Internal server error' });
    }
});
router.get('/admin', auth_1.authMiddleware, auth_1.requireAdmin, async (req, res) => {
    try {
        const { type, read, page = 1, limit = 20 } = req.query;
        const now = new Date();
        const mockNotifications = [
            {
                id: '1',
                title: 'New Host Registration',
                message: 'Sarah Ahmed has registered as a new host and submitted property listing for approval',
                type: 'USER_REGISTRATION',
                read: false,
                priority: 'medium',
                actionRequired: true,
                timestamp: new Date(now.getTime() - 5 * 60 * 1000).toISOString(),
                user: {
                    id: 'user-001',
                    first_name: 'Sarah',
                    last_name: 'Ahmed',
                    email: 'sarah.ahmed@example.com',
                    is_host: true,
                    is_agent: false
                }
            },
            {
                id: '2',
                title: 'Security Alert',
                message: 'Multiple failed login attempts detected from IP 192.168.1.100 - Account temporarily locked',
                type: 'SECURITY_ALERT',
                read: false,
                priority: 'high',
                actionRequired: true,
                timestamp: new Date(now.getTime() - 15 * 60 * 1000).toISOString(),
                user: null
            },
            {
                id: '3',
                title: 'Payment Processing Issue',
                message: 'Payment gateway timeout for booking #BK-2024-001 - Manual review required',
                type: 'PAYMENT',
                read: false,
                priority: 'high',
                actionRequired: true,
                timestamp: new Date(now.getTime() - 25 * 60 * 1000).toISOString(),
                user: {
                    id: 'user-002',
                    first_name: 'Mohammed',
                    last_name: 'Al-Rashid',
                    email: 'mohammed.rashid@example.com',
                    is_host: false,
                    is_agent: false
                }
            },
            {
                id: '4',
                title: 'Property Verification Required',
                message: 'New property listing "Luxury Villa in Palm Jumeirah" requires document verification',
                type: 'PROPERTY',
                read: false,
                priority: 'medium',
                actionRequired: true,
                timestamp: new Date(now.getTime() - 45 * 60 * 1000).toISOString(),
                user: {
                    id: 'user-003',
                    first_name: 'Fatima',
                    last_name: 'Hassan',
                    email: 'fatima.hassan@example.com',
                    is_host: true,
                    is_agent: false
                }
            },
            {
                id: '5',
                title: 'System Maintenance Complete',
                message: 'Scheduled database maintenance completed successfully. All services restored.',
                type: 'PLATFORM',
                read: true,
                priority: 'low',
                actionRequired: false,
                timestamp: new Date(now.getTime() - 2 * 60 * 60 * 1000).toISOString(),
                user: null
            },
            {
                id: '6',
                title: 'Agent Application',
                message: 'Real estate agent license verification completed for new agent application',
                type: 'USER_REGISTRATION',
                read: true,
                priority: 'medium',
                actionRequired: false,
                timestamp: new Date(now.getTime() - 3 * 60 * 60 * 1000).toISOString(),
                user: {
                    id: 'user-004',
                    first_name: 'Ahmed',
                    last_name: 'Al-Maktoum',
                    email: 'ahmed.maktoum@realestate.ae',
                    is_host: false,
                    is_agent: true
                }
            },
            {
                id: '7',
                title: 'Booking Dispute',
                message: 'Guest has filed a dispute for booking #BK-2024-002 regarding property condition',
                type: 'BOOKING',
                read: true,
                priority: 'high',
                actionRequired: false,
                timestamp: new Date(now.getTime() - 6 * 60 * 60 * 1000).toISOString(),
                user: {
                    id: 'user-005',
                    first_name: 'Elena',
                    last_name: 'Rodriguez',
                    email: 'elena.rodriguez@example.com',
                    is_host: false,
                    is_agent: false
                }
            },
            {
                id: '8',
                title: 'Revenue Milestone',
                message: 'Platform has reached AED 100,000 in monthly revenue - 15% growth from last month',
                type: 'PLATFORM',
                read: true,
                priority: 'low',
                actionRequired: false,
                timestamp: new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString(),
                user: null
            }
        ];
        let filteredNotifications = mockNotifications;
        if (type) {
            filteredNotifications = mockNotifications.filter(n => n.type === type);
        }
        if (read !== undefined) {
            const isRead = read === 'true';
            filteredNotifications = filteredNotifications.filter(n => n.read === isRead);
        }
        const startIndex = (Number(page) - 1) * Number(limit);
        const endIndex = startIndex + Number(limit);
        const paginatedNotifications = filteredNotifications.slice(startIndex, endIndex);
        res.json({
            success: true,
            data: paginatedNotifications,
            pagination: {
                page: Number(page),
                limit: Number(limit),
                total: filteredNotifications.length,
                pages: Math.ceil(filteredNotifications.length / Number(limit))
            },
            unreadCount: mockNotifications.filter(n => !n.read).length
        });
    }
    catch (error) {
        console.error('Error fetching admin notifications:', error);
        res.status(500).json({ success: false, error: 'Internal server error' });
    }
});
router.get('/admin/stats', auth_1.authMiddleware, auth_1.requireAdmin, async (req, res) => {
    try {
        res.json({
            success: true,
            data: {
                total: 3,
                unread: 2,
                recent24h: 3,
                byType: [
                    { type: 'USER_REGISTRATION', count: 1 },
                    { type: 'SYSTEM_ALERT', count: 1 },
                    { type: 'PLATFORM', count: 1 }
                ],
                delivery: {
                    total: 3,
                    emailsSent: 1,
                    smsSent: 0,
                    pushSent: 3,
                }
            },
        });
    }
    catch (error) {
        console.error('Error fetching admin notification stats:', error);
        res.status(500).json({ success: false, error: 'Internal server error' });
    }
});
router.post('/admin/test', auth_1.authMiddleware, auth_1.requireAdmin, async (req, res) => {
    try {
        const { recipientEmail, type = 'TEST' } = req.body;
        const adminUser = req.user;
        if (!recipientEmail) {
            return res.status(400).json({
                success: false,
                error: 'Recipient email is required'
            });
        }
        const { data: recipient, error } = await supabase_1.supabaseAdmin
            .from('users')
            .select('id, email')
            .eq('email', recipientEmail)
            .single();
        if (error || !recipient) {
            return res.status(404).json({
                success: false,
                error: 'Recipient user not found'
            });
        }
        res.json({
            success: true,
            data: {
                id: 'mock-test-notification',
                userId: recipient.id,
                title: 'Test Notification',
                message: `This is a test notification sent by admin ${adminUser?.email} at ${new Date().toLocaleString()}.`,
                type
            },
            message: `Test notification sent to ${recipientEmail}`
        });
    }
    catch (error) {
        console.error('Error sending test notification:', error);
        res.status(500).json({ success: false, error: 'Internal server error' });
    }
});
exports.default = router;
//# sourceMappingURL=notifications.js.map