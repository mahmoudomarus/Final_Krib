"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const supabase_1 = require("../lib/supabase");
const auth_1 = require("../middleware/auth");
const zod_1 = require("zod");
const router = (0, express_1.Router)();
const createConversationSchema = zod_1.z.object({
    participant_ids: zod_1.z.array(zod_1.z.string().uuid()).min(1),
    type: zod_1.z.enum(['GENERAL', 'BOOKING', 'SUPPORT', 'PROPERTY_INQUIRY']).default('GENERAL'),
    property_id: zod_1.z.string().uuid().optional(),
    booking_id: zod_1.z.string().uuid().optional(),
    title: zod_1.z.string().max(255).optional(),
    initial_message: zod_1.z.string().optional()
});
const sendMessageSchema = zod_1.z.object({
    content: zod_1.z.string().min(1).max(5000),
    message_type: zod_1.z.enum(['TEXT', 'IMAGE', 'FILE', 'SYSTEM']).default('TEXT'),
    attachments: zod_1.z.array(zod_1.z.object({
        url: zod_1.z.string().url(),
        filename: zod_1.z.string(),
        size: zod_1.z.number(),
        type: zod_1.z.string()
    })).optional()
});
router.get('/conversations', auth_1.authMiddleware, async (req, res) => {
    try {
        const userId = req.user.id;
        const { data: conversations, error } = await supabase_1.supabaseAdmin
            .from('conversations')
            .select(`
        id,
        type,
        title,
        property_id,
        booking_id,
        created_at,
        last_message_at,
        conversation_participants!inner (
          user_id,
          unread_count,
          last_read_at,
          is_muted
        ),
        messages (
          id,
          content,
          message_type,
          created_at,
          sender_id,
          users!messages_sender_id_fkey (
            first_name,
            last_name,
            avatar
          )
        )
      `)
            .eq('conversation_participants.user_id', userId)
            .eq('is_active', true)
            .order('last_message_at', { ascending: false });
        if (error) {
            console.error('Error fetching conversations:', error);
            return res.status(500).json({
                success: false,
                error: 'Failed to fetch conversations'
            });
        }
        const conversationIds = conversations?.map(c => c.id) || [];
        const { data: allParticipants, error: participantsError } = await supabase_1.supabaseAdmin
            .from('conversation_participants')
            .select(`
        conversation_id,
        user_id,
        users (
          id,
          first_name,
          last_name,
          avatar,
          is_host,
          is_agent
        )
      `)
            .in('conversation_id', conversationIds)
            .neq('user_id', userId);
        if (participantsError) {
            console.error('Error fetching participants:', participantsError);
        }
        const formattedConversations = conversations?.map(conv => {
            const userParticipation = conv.conversation_participants.find(p => p.user_id === userId);
            const otherParticipants = allParticipants?.filter(p => p.conversation_id === conv.id) || [];
            const lastMessage = conv.messages?.[0];
            return {
                id: conv.id,
                type: conv.type,
                title: conv.title,
                property_id: conv.property_id,
                booking_id: conv.booking_id,
                participants: otherParticipants.map(p => ({
                    id: p.users?.[0]?.id,
                    name: `${p.users?.[0]?.first_name} ${p.users?.[0]?.last_name}`,
                    avatar: p.users?.[0]?.avatar,
                    is_host: p.users?.[0]?.is_host,
                    is_agent: p.users?.[0]?.is_agent
                })),
                last_message: lastMessage ? {
                    content: lastMessage.content,
                    sender_name: lastMessage.sender_id === userId ? 'You' :
                        `${lastMessage.users?.[0]?.first_name} ${lastMessage.users?.[0]?.last_name}`,
                    created_at: lastMessage.created_at,
                    message_type: lastMessage.message_type
                } : null,
                unread_count: userParticipation?.unread_count || 0,
                is_muted: userParticipation?.is_muted || false,
                last_message_at: conv.last_message_at,
                created_at: conv.created_at
            };
        }) || [];
        res.json({
            success: true,
            data: formattedConversations
        });
    }
    catch (error) {
        console.error('Error fetching conversations:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch conversations'
        });
    }
});
router.get('/conversations/:conversationId', auth_1.authMiddleware, async (req, res) => {
    try {
        const userId = req.user.id;
        const { conversationId } = req.params;
        const { data: participation, error: accessError } = await supabase_1.supabaseAdmin
            .from('conversation_participants')
            .select('*')
            .eq('conversation_id', conversationId)
            .eq('user_id', userId)
            .single();
        if (accessError || !participation) {
            return res.status(403).json({
                success: false,
                error: 'Access denied to conversation'
            });
        }
        const { data: conversation, error: convError } = await supabase_1.supabaseAdmin
            .from('conversations')
            .select(`
        id,
        type,
        title,
        property_id,
        booking_id,
        created_at,
        conversation_participants (
          user_id,
          users (
            id,
            first_name,
            last_name,
            avatar,
            is_host,
            is_agent
          )
        )
      `)
            .eq('id', conversationId)
            .single();
        if (convError) {
            console.error('Error fetching conversation:', convError);
            return res.status(500).json({
                success: false,
                error: 'Failed to fetch conversation'
            });
        }
        const { data: messages, error: messagesError } = await supabase_1.supabaseAdmin
            .from('messages')
            .select(`
        id,
        content,
        message_type,
        attachments,
        created_at,
        is_edited,
        sender_id,
        users!messages_sender_id_fkey (
          first_name,
          last_name,
          avatar
        )
      `)
            .eq('conversation_id', conversationId)
            .eq('is_deleted', false)
            .order('created_at', { ascending: true });
        if (messagesError) {
            console.error('Error fetching messages:', messagesError);
            return res.status(500).json({
                success: false,
                error: 'Failed to fetch messages'
            });
        }
        await supabase_1.supabaseAdmin
            .from('conversation_participants')
            .update({
            unread_count: 0,
            last_read_at: new Date().toISOString()
        })
            .eq('conversation_id', conversationId)
            .eq('user_id', userId);
        const formattedMessages = messages?.map(msg => ({
            id: msg.id,
            content: msg.content,
            message_type: msg.message_type,
            attachments: msg.attachments,
            created_at: msg.created_at,
            is_edited: msg.is_edited,
            sender: {
                id: msg.sender_id,
                name: msg.sender_id === userId ? 'You' :
                    `${msg.users?.[0]?.first_name} ${msg.users?.[0]?.last_name}`,
                avatar: msg.users?.[0]?.avatar,
                is_current_user: msg.sender_id === userId
            }
        })) || [];
        res.json({
            success: true,
            data: {
                conversation: {
                    id: conversation.id,
                    type: conversation.type,
                    title: conversation.title,
                    property_id: conversation.property_id,
                    booking_id: conversation.booking_id,
                    participants: conversation.conversation_participants.map(p => ({
                        id: p.users?.[0]?.id,
                        name: `${p.users?.[0]?.first_name} ${p.users?.[0]?.last_name}`,
                        avatar: p.users?.[0]?.avatar,
                        is_host: p.users?.[0]?.is_host,
                        is_agent: p.users?.[0]?.is_agent
                    }))
                },
                messages: formattedMessages
            }
        });
    }
    catch (error) {
        console.error('Error fetching conversation messages:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch messages'
        });
    }
});
router.post('/conversations', auth_1.authMiddleware, async (req, res) => {
    try {
        const userId = req.user.id;
        const validatedData = createConversationSchema.parse(req.body);
        const allParticipantIds = [...new Set([userId, ...validatedData.participant_ids])];
        if (validatedData.type !== 'GENERAL') {
            const { data: existingConv } = await supabase_1.supabaseAdmin
                .from('conversations')
                .select(`
          id,
          conversation_participants (user_id)
        `)
                .eq('type', validatedData.type)
                .eq('property_id', validatedData.property_id || null)
                .eq('booking_id', validatedData.booking_id || null);
            const matchingConv = existingConv?.find(conv => {
                const participantIds = conv.conversation_participants.map(p => p.user_id).sort();
                return JSON.stringify(participantIds) === JSON.stringify(allParticipantIds.sort());
            });
            if (matchingConv) {
                return res.json({
                    success: true,
                    data: { conversation_id: matchingConv.id }
                });
            }
        }
        const { data: conversation, error: convError } = await supabase_1.supabaseAdmin
            .from('conversations')
            .insert({
            type: validatedData.type,
            property_id: validatedData.property_id,
            booking_id: validatedData.booking_id,
            title: validatedData.title
        })
            .select()
            .single();
        if (convError) {
            console.error('Error creating conversation:', convError);
            return res.status(500).json({
                success: false,
                error: 'Failed to create conversation'
            });
        }
        const participantInserts = allParticipantIds.map(participantId => ({
            conversation_id: conversation.id,
            user_id: participantId
        }));
        const { error: participantsError } = await supabase_1.supabaseAdmin
            .from('conversation_participants')
            .insert(participantInserts);
        if (participantsError) {
            console.error('Error adding participants:', participantsError);
            await supabase_1.supabaseAdmin
                .from('conversations')
                .delete()
                .eq('id', conversation.id);
            return res.status(500).json({
                success: false,
                error: 'Failed to add participants'
            });
        }
        if (validatedData.initial_message?.trim()) {
            const { error: messageError } = await supabase_1.supabaseAdmin
                .from('messages')
                .insert({
                conversation_id: conversation.id,
                sender_id: userId,
                content: validatedData.initial_message.trim(),
                message_type: 'TEXT'
            });
            if (messageError) {
                console.error('Error sending initial message:', messageError);
            }
        }
        res.status(201).json({
            success: true,
            data: { conversation_id: conversation.id }
        });
    }
    catch (error) {
        if (error instanceof zod_1.z.ZodError) {
            return res.status(400).json({
                success: false,
                error: 'Validation failed',
                details: error.errors
            });
        }
        console.error('Error creating conversation:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to create conversation'
        });
    }
});
router.post('/conversations/:conversationId/messages', auth_1.authMiddleware, async (req, res) => {
    try {
        const userId = req.user.id;
        const { conversationId } = req.params;
        const validatedData = sendMessageSchema.parse(req.body);
        const { data: participation, error: accessError } = await supabase_1.supabaseAdmin
            .from('conversation_participants')
            .select('*')
            .eq('conversation_id', conversationId)
            .eq('user_id', userId)
            .single();
        if (accessError || !participation) {
            return res.status(403).json({
                success: false,
                error: 'Access denied to conversation'
            });
        }
        const { data: message, error: messageError } = await supabase_1.supabaseAdmin
            .from('messages')
            .insert({
            conversation_id: conversationId,
            sender_id: userId,
            content: validatedData.content,
            message_type: validatedData.message_type,
            attachments: validatedData.attachments
        })
            .select(`
        id,
        content,
        message_type,
        attachments,
        created_at,
        sender_id
      `)
            .single();
        if (messageError) {
            console.error('Error sending message:', messageError);
            return res.status(500).json({
                success: false,
                error: 'Failed to send message'
            });
        }
        res.status(201).json({
            success: true,
            data: {
                id: message.id,
                content: message.content,
                message_type: message.message_type,
                attachments: message.attachments,
                created_at: message.created_at,
                sender: {
                    id: message.sender_id,
                    name: 'You',
                    is_current_user: true
                }
            }
        });
    }
    catch (error) {
        if (error instanceof zod_1.z.ZodError) {
            return res.status(400).json({
                success: false,
                error: 'Validation failed',
                details: error.errors
            });
        }
        console.error('Error sending message:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to send message'
        });
    }
});
router.get('/users', auth_1.authMiddleware, async (req, res) => {
    try {
        const userId = req.user.id;
        const { search, type } = req.query;
        let query = supabase_1.supabaseAdmin
            .from('users')
            .select('id, first_name, last_name, avatar, is_host, is_agent, is_active')
            .eq('is_active', true)
            .neq('id', userId);
        if (type === 'hosts') {
            query = query.eq('is_host', true);
        }
        else if (type === 'agents') {
            query = query.eq('is_agent', true);
        }
        else if (type === 'guests') {
            query = query.eq('is_host', false).eq('is_agent', false);
        }
        if (search && typeof search === 'string') {
            const searchTerm = `%${search.toLowerCase()}%`;
            query = query.or(`first_name.ilike.${searchTerm},last_name.ilike.${searchTerm}`);
        }
        const { data: users, error } = await query.limit(20);
        if (error) {
            console.error('Error fetching users:', error);
            return res.status(500).json({
                success: false,
                error: 'Failed to fetch users'
            });
        }
        const formattedUsers = users?.map(user => ({
            id: user.id,
            name: `${user.first_name} ${user.last_name}`,
            avatar: user.avatar,
            is_host: user.is_host,
            is_agent: user.is_agent,
            user_type: user.is_agent ? 'Agent' : user.is_host ? 'Host' : 'Guest'
        })) || [];
        res.json({
            success: true,
            data: formattedUsers
        });
    }
    catch (error) {
        console.error('Error fetching users:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch users'
        });
    }
});
router.put('/conversations/:conversationId/mute', auth_1.authMiddleware, async (req, res) => {
    try {
        const userId = req.user.id;
        const { conversationId } = req.params;
        const { is_muted } = req.body;
        const { error } = await supabase_1.supabaseAdmin
            .from('conversation_participants')
            .update({ is_muted: Boolean(is_muted) })
            .eq('conversation_id', conversationId)
            .eq('user_id', userId);
        if (error) {
            console.error('Error updating mute status:', error);
            return res.status(500).json({
                success: false,
                error: 'Failed to update mute status'
            });
        }
        res.json({
            success: true,
            message: is_muted ? 'Conversation muted' : 'Conversation unmuted'
        });
    }
    catch (error) {
        console.error('Error updating mute status:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to update mute status'
        });
    }
});
exports.default = router;
//# sourceMappingURL=messages.js.map