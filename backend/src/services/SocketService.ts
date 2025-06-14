import { Server, Socket } from 'socket.io';
import jwt from 'jsonwebtoken';
import { supabase } from '../lib/supabase';

interface AuthenticatedSocket extends Socket {
  user?: {
    id: string;
    email: string;
    isHost: boolean;
  };
}

export class SocketService {
  private io: Server;
  private connectedUsers: Map<string, string> = new Map(); // userId -> socketId

  constructor(io: Server) {
    this.io = io;
  }

  handleConnection(socket: AuthenticatedSocket): void {
    // Authenticate socket connection
    socket.on('authenticate', async (token: string) => {
      try {
        if (!process.env.JWT_SECRET) {
          socket.emit('auth_error', { error: 'JWT secret not configured' });
          return;
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET) as any;
        const { data: user, error } = await supabase
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
        
        // Join user to their personal room
        socket.join(`user_${user.id}`);
        
        // Join user to their conversation rooms
        await this.joinUserConversations(socket, user.id);
        
        socket.emit('authenticated', { user: socket.user });
        
        console.log(`User ${user.id} connected with socket ${socket.id}`);
      } catch (error) {
        socket.emit('auth_error', { error: 'Invalid token' });
      }
    });

    // Handle joining conversation
    socket.on('join_conversation', async (conversationId: string) => {
      if (!socket.user) {
        socket.emit('error', { error: 'Not authenticated' });
        return;
      }

      try {
        // Verify user has access to this conversation
        const { data: conversation, error } = await supabase
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
        } else {
          socket.emit('error', { error: 'Access denied to conversation' });
        }
      } catch (error) {
        socket.emit('error', { error: 'Failed to join conversation' });
      }
    });

    // Handle sending messages
    socket.on('send_message', async (data: {
      conversationId: string;
      content: string;
      type?: string;
      attachments?: any;
    }) => {
      if (!socket.user) {
        socket.emit('error', { error: 'Not authenticated' });
        return;
      }

      try {
        // Verify user has access to this conversation
        const { data: conversation, error: conversationError } = await supabase
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

        // Create message
        const { data: message, error: messageError } = await supabase
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

        // Update conversation
        await supabase
          .from('conversations')
          .update({
            last_message_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })
          .eq('id', data.conversationId);

        // Emit message to all conversation participants
        this.io.to(`conversation_${data.conversationId}`).emit('new_message', {
          message,
          conversationId: data.conversationId
        });

        // Send push notifications to offline users
        const participants = conversation.conversation_participants || [];
        for (const participant of participants) {
          if (participant.user_id !== socket.user.id && !this.connectedUsers.has(participant.user_id)) {
            // User is offline, send push notification
            // TODO: Implement push notification
          }
        }

      } catch (error) {
        socket.emit('error', { error: 'Failed to send message' });
      }
    });

    // Handle typing indicators
    socket.on('typing_start', (data: { conversationId: string }) => {
      if (!socket.user) return;
      
      socket.to(`conversation_${data.conversationId}`).emit('user_typing', {
        userId: socket.user.id,
        conversationId: data.conversationId
      });
    });

    socket.on('typing_stop', (data: { conversationId: string }) => {
      if (!socket.user) return;
      
      socket.to(`conversation_${data.conversationId}`).emit('user_stopped_typing', {
        userId: socket.user.id,
        conversationId: data.conversationId
      });
    });

    // Handle message read receipts
    socket.on('mark_read', async (data: { conversationId: string, messageId: string }) => {
      if (!socket.user) return;

      try {
        await supabase
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
      } catch (error) {
        console.error('Error marking message as read:', error);
      }
    });

    // Handle disconnect
    socket.on('disconnect', () => {
      if (socket.user) {
        this.connectedUsers.delete(socket.user.id);
        console.log(`User ${socket.user.id} disconnected`);
      }
    });
  }

  private async joinUserConversations(socket: AuthenticatedSocket, userId: string): Promise<void> {
    try {
      const { data: conversations, error } = await supabase
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
    } catch (error) {
      console.error('Error joining user conversations:', error);
    }
  }

  // Public methods to send notifications
  async sendNotificationToUser(userId: string, notification: any): Promise<void> {
    this.io.to(`user_${userId}`).emit('notification', notification);
  }

  async sendPaymentStatusUpdate(userId: string, paymentData: any): Promise<void> {
    this.io.to(`user_${userId}`).emit('payment_status_update', paymentData);
  }

  async sendBookingStatusUpdate(userId: string, bookingData: any): Promise<void> {
    this.io.to(`user_${userId}`).emit('booking_status_update', bookingData);
  }

  getConnectedUsers(): string[] {
    return Array.from(this.connectedUsers.keys());
  }

  isUserOnline(userId: string): boolean {
    return this.connectedUsers.has(userId);
  }
} 