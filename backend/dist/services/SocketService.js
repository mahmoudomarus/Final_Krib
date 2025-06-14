"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SocketService = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const supabase_1 = require("../lib/supabase");
class SocketService {
    constructor(io) {
        this.connectedUsers = new Map();
        this.io = io;
    }
    handleConnection(socket) {
        socket.on('authenticate', async (token) => {
            try {
                if (!process.env.JWT_SECRET) {
                    socket.emit('auth_error', { error: 'JWT secret not configured' });
                    return;
                }
                const decoded = jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET);
                const { data: user, error } = await supabase_1.supabase
                    .from('users')
                    .select('id, email, is_host, is_active, is_suspended')
                    .eq('id', decoded.id)
                    .single();
                if (error || !user || !user.is_active || user.is_suspended) {
                    socket.emit('auth_error', { error: 'Invalid token or user not active' });
                    return;
                }
                socket.user = {
                    id: user.id,
                    email: user.email,
                    isHost: user.is_host
                };
                this.connectedUsers.set(user.id, socket.id);
                socket.join(`user_${user.id}`);
                await this.joinUserConversations(socket, user.id);
                socket.emit('authenticated', { user: socket.user });
                console.log(`User ${user.id} connected with socket ${socket.id}`);
            }
            catch (error) {
                socket.emit('auth_error', { error: 'Invalid token' });
            }
        });
        socket.on('join_conversation', async (conversationId) => {
            if (!socket.user) {
                socket.emit('error', { error: 'Not authenticated' });
                return;
            }
            try {
                const { data: conversation, error } = await supabase_1.supabase
                    .from('conversations')
                    .select(`
            id,
            conversation_participants!inner(user_id)
          `)
                    .eq('id', conversationId)
                    .eq('conversation_participants.user_id', socket.user.id)
                    .single();
                if (!error && conversation) {
                    socket.join(`conversation_${conversationId}`);
                    socket.emit('joined_conversation', { conversationId });
                }
                else {
                    socket.emit('error', { error: 'Access denied to conversation' });
                }
            }
            catch (error) {
                socket.emit('error', { error: 'Failed to join conversation' });
            }
        });
        socket.on('send_message', async (data) => {
            if (!socket.user) {
                socket.emit('error', { error: 'Not authenticated' });
                return;
            }
            try {
                const { data: conversation, error: conversationError } = await supabase_1.supabase
                    .from('conversations')
                    .select(`
            id,
            conversation_participants(user_id, users(id, first_name, last_name, avatar))
          `)
                    .eq('id', data.conversationId)
                    .eq('conversation_participants.user_id', socket.user.id)
                    .single();
                if (conversationError || !conversation) {
                    socket.emit('error', { error: 'Access denied to conversation' });
                    return;
                }
                const { data: message, error: messageError } = await supabase_1.supabase
                    .from('messages')
                    .insert({
                    content: data.content,
                    type: data.type || 'TEXT',
                    attachments: data.attachments,
                    sender_id: socket.user.id,
                    conversation_id: data.conversationId,
                    created_at: new Date().toISOString(),
                })
                    .select(`
            *,
            users:sender_id(id, first_name, last_name, avatar)
          `)
                    .single();
                if (messageError) {
                    socket.emit('error', { error: 'Failed to create message' });
                    return;
                }
                await supabase_1.supabase
                    .from('conversations')
                    .update({
                    last_message_at: new Date().toISOString(),
                    updated_at: new Date().toISOString(),
                })
                    .eq('id', data.conversationId);
                this.io.to(`conversation_${data.conversationId}`).emit('new_message', {
                    message,
                    conversationId: data.conversationId
                });
                const participants = conversation.conversation_participants || [];
                for (const participant of participants) {
                    if (participant.user_id !== socket.user.id && !this.connectedUsers.has(participant.user_id)) {
                    }
                }
            }
            catch (error) {
                socket.emit('error', { error: 'Failed to send message' });
            }
        });
        socket.on('typing_start', (data) => {
            if (!socket.user)
                return;
            socket.to(`conversation_${data.conversationId}`).emit('user_typing', {
                userId: socket.user.id,
                conversationId: data.conversationId
            });
        });
        socket.on('typing_stop', (data) => {
            if (!socket.user)
                return;
            socket.to(`conversation_${data.conversationId}`).emit('user_stopped_typing', {
                userId: socket.user.id,
                conversationId: data.conversationId
            });
        });
        socket.on('mark_read', async (data) => {
            if (!socket.user)
                return;
            try {
                await supabase_1.supabase
                    .from('messages')
                    .update({
                    is_read: true,
                    read_at: new Date().toISOString(),
                })
                    .eq('id', data.messageId);
                socket.to(`conversation_${data.conversationId}`).emit('message_read', {
                    messageId: data.messageId,
                    readBy: socket.user.id
                });
            }
            catch (error) {
                console.error('Error marking message as read:', error);
            }
        });
        socket.on('disconnect', () => {
            if (socket.user) {
                this.connectedUsers.delete(socket.user.id);
                console.log(`User ${socket.user.id} disconnected`);
            }
        });
    }
    async joinUserConversations(socket, userId) {
        try {
            const { data: conversations, error } = await supabase_1.supabase
                .from('conversation_participants')
                .select('conversation_id')
                .eq('user_id', userId);
            if (error) {
                console.error('Error fetching user conversations:', error);
                return;
            }
            for (const conversation of conversations || []) {
                socket.join(`conversation_${conversation.conversation_id}`);
            }
        }
        catch (error) {
            console.error('Error joining user conversations:', error);
        }
    }
    async sendNotificationToUser(userId, notification) {
        this.io.to(`user_${userId}`).emit('notification', notification);
    }
    async sendPaymentStatusUpdate(userId, paymentData) {
        this.io.to(`user_${userId}`).emit('payment_status_update', paymentData);
    }
    async sendBookingStatusUpdate(userId, bookingData) {
        this.io.to(`user_${userId}`).emit('booking_status_update', bookingData);
    }
    getConnectedUsers() {
        return Array.from(this.connectedUsers.keys());
    }
    isUserOnline(userId) {
        return this.connectedUsers.has(userId);
    }
}
exports.SocketService = SocketService;
//# sourceMappingURL=SocketService.js.map