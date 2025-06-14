"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const supabase_1 = require("../lib/supabase");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
router.get('/conversations', auth_1.authMiddleware, async (req, res) => {
    try {
        const userId = req.user?.id;
        if (!userId) {
            return res.status(401).json({ success: false, error: 'User not authenticated' });
        }
        const { data: participation, error: participationError } = await supabase_1.supabaseAdmin
            .from('conversation_participants')
            .select('conversation_id, unread_count, is_muted')
            .eq('user_id', userId);
        if (participationError) {
            console.error('Error fetching user participation:', participationError);
            return res.status(500).json({ success: false, error: 'Failed to fetch conversations' });
        }
        if (!participation || participation.length === 0) {
            return res.json({ success: true, data: [] });
        }
        const conversationIds = participation.map(p => p.conversation_id);
        const { data: conversations, error: conversationsError } = await supabase_1.supabaseAdmin
            .from('conversations')
            .select('id, conversation_type, title, created_at, last_message_at')
            .in('id', conversationIds)
            .eq('is_active', true)
            .order('last_message_at', { ascending: false });
        if (conversationsError) {
            console.error('Error fetching conversations:', conversationsError);
            return res.status(500).json({ success: false, error: 'Failed to fetch conversations' });
        }
        const { data: otherParticipants, error: participantsError } = await supabase_1.supabaseAdmin
            .from('conversation_participants')
            .select(`
        conversation_id,
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
        const { data: lastMessages, error: messagesError } = await supabase_1.supabaseAdmin
            .from('messages')
            .select(`
        conversation_id,
        content,
        created_at,
        sender_id,
        users!messages_sender_id_fkey (
          first_name,
          last_name
        )
      `)
            .in('conversation_id', conversationIds)
            .eq('is_deleted', false)
            .order('created_at', { ascending: false });
        const formattedConversations = conversations?.map(conv => {
            const userParticipation = participation.find(p => p.conversation_id === conv.id);
            const participants = otherParticipants?.filter(p => p.conversation_id === conv.id) || [];
            const lastMessage = lastMessages?.find(m => m.conversation_id === conv.id);
            return {
                id: conv.id,
                type: conv.conversation_type,
                title: conv.title || participants.map(p => `${p.users?.first_name} ${p.users?.last_name}`).join(', ') || 'Conversation',
                participants: participants.map(p => ({
                    id: p.users?.id,
                    name: `${p.users?.first_name} ${p.users?.last_name}`,
                    avatar: p.users?.avatar,
                    is_host: p.users?.is_host,
                    is_agent: p.users?.is_agent
                })),
                last_message: lastMessage ? {
                    content: lastMessage.content,
                    sender_name: lastMessage.sender_id === userId ? 'You' :
                        `${lastMessage.users?.first_name} ${lastMessage.users?.last_name}`,
                    created_at: lastMessage.created_at
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
        res.status(500).json({ success: false, error: 'Internal server error' });
    }
});
router.get('/conversations/:conversationId', auth_1.authMiddleware, async (req, res) => {
    try {
        const userId = req.user?.id;
        const { conversationId } = req.params;
        if (!userId) {
            return res.status(401).json({ success: false, error: 'User not authenticated' });
        }
        const { data: participation, error: accessError } = await supabase_1.supabaseAdmin
            .from('conversation_participants')
            .select('*')
            .eq('conversation_id', conversationId)
            .eq('user_id', userId)
            .single();
        if (accessError || !participation) {
            return res.status(403).json({ success: false, error: 'Access denied' });
        }
        const { data: conversation, error: convError } = await supabase_1.supabaseAdmin
            .from('conversations')
            .select('id, conversation_type, title, created_at')
            .eq('id', conversationId)
            .single();
        if (convError) {
            return res.status(500).json({ success: false, error: 'Failed to fetch conversation' });
        }
        const { data: participants, error: participantsError } = await supabase_1.supabaseAdmin
            .from('conversation_participants')
            .select(`
        users (
          id,
          first_name,
          last_name,
          avatar,
          is_host,
          is_agent
        )
      `)
            .eq('conversation_id', conversationId);
        const { data: messages, error: messagesError } = await supabase_1.supabaseAdmin
            .from('messages')
            .select(`
        id,
        content,
        message_type,
        attachments,
        created_at,
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
            return res.status(500).json({ success: false, error: 'Failed to fetch messages' });
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
            sender: {
                id: msg.sender_id,
                name: msg.sender_id === userId ? 'You' :
                    `${msg.users?.first_name} ${msg.users?.last_name}`,
                avatar: msg.users?.avatar,
                is_current_user: msg.sender_id === userId
            }
        })) || [];
        res.json({
            success: true,
            data: {
                conversation: {
                    id: conversation.id,
                    type: conversation.conversation_type,
                    title: conversation.title,
                    participants: participants?.map(p => ({
                        id: p.users?.id,
                        name: `${p.users?.first_name} ${p.users?.last_name}`,
                        avatar: p.users?.avatar,
                        is_host: p.users?.is_host,
                        is_agent: p.users?.is_agent
                    })) || []
                },
                messages: formattedMessages
            }
        });
    }
    catch (error) {
        console.error('Error fetching messages:', error);
        res.status(500).json({ success: false, error: 'Internal server error' });
    }
});
router.post('/conversations/:conversationId/messages', auth_1.authMiddleware, async (req, res) => {
    try {
        const userId = req.user?.id;
        const { conversationId } = req.params;
        const { content } = req.body;
        if (!userId) {
            return res.status(401).json({ success: false, error: 'User not authenticated' });
        }
        if (!content?.trim()) {
            return res.status(400).json({ success: false, error: 'Content required' });
        }
        const { data: participation, error: accessError } = await supabase_1.supabaseAdmin
            .from('conversation_participants')
            .select('*')
            .eq('conversation_id', conversationId)
            .eq('user_id', userId)
            .single();
        if (accessError || !participation) {
            return res.status(403).json({ success: false, error: 'Access denied' });
        }
        const { data: message, error: messageError } = await supabase_1.supabaseAdmin
            .from('messages')
            .insert({
            conversation_id: conversationId,
            sender_id: userId,
            content: content.trim(),
            message_type: 'TEXT'
        })
            .select('id, content, message_type, created_at, sender_id')
            .single();
        if (messageError) {
            console.error('Error creating message:', messageError);
            return res.status(500).json({ success: false, error: 'Failed to send message' });
        }
        res.json({
            success: true,
            data: {
                id: message.id,
                content: message.content,
                message_type: message.message_type,
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
        console.error('Error sending message:', error);
        res.status(500).json({ success: false, error: 'Internal server error' });
    }
});
router.post('/conversations', auth_1.authMiddleware, async (req, res) => {
    try {
        const userId = req.user?.id;
        const { participant_ids, conversation_type = 'GENERAL', title } = req.body;
        if (!userId) {
            return res.status(401).json({ success: false, error: 'User not authenticated' });
        }
        if (!participant_ids || !Array.isArray(participant_ids) || participant_ids.length === 0) {
            return res.status(400).json({ success: false, error: 'Participant IDs required' });
        }
        const { data: conversation, error: convError } = await supabase_1.supabaseAdmin
            .from('conversations')
            .insert({
            conversation_type,
            title
        })
            .select()
            .single();
        if (convError) {
            console.error('Error creating conversation:', convError);
            return res.status(500).json({ success: false, error: 'Failed to create conversation' });
        }
        const allParticipantIds = [...new Set([userId, ...participant_ids])];
        const participantInserts = allParticipantIds.map(id => ({
            conversation_id: conversation.id,
            user_id: id
        }));
        const { error: participantsError } = await supabase_1.supabaseAdmin
            .from('conversation_participants')
            .insert(participantInserts);
        if (participantsError) {
            console.error('Error adding participants:', participantsError);
            return res.status(500).json({ success: false, error: 'Failed to add participants' });
        }
        res.status(201).json({
            success: true,
            data: { conversation_id: conversation.id }
        });
    }
    catch (error) {
        console.error('Error creating conversation:', error);
        res.status(500).json({ success: false, error: 'Internal server error' });
    }
});
router.get('/users', auth_1.authMiddleware, async (req, res) => {
    try {
        const userId = req.user?.id;
        const { search, type } = req.query;
        if (!userId) {
            return res.status(401).json({ success: false, error: 'User not authenticated' });
        }
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
            return res.status(500).json({ success: false, error: 'Failed to fetch users' });
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
        res.status(500).json({ success: false, error: 'Internal server error' });
    }
});
exports.default = router;
//# sourceMappingURL=messages-working.js.map