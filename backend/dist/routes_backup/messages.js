"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const client_1 = require("@prisma/client");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
const prisma = new client_1.PrismaClient();
router.get('/conversations', auth_1.authMiddleware, async (req, res) => {
    try {
        const userId = req.user?.id;
        if (!userId) {
            return res.status(401).json({ success: false, error: 'User not authenticated' });
        }
        const conversations = await prisma.conversation.findMany({
            where: {
                participants: {
                    some: { id: userId }
                },
                isActive: true
            },
            include: {
                participants: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        avatar: true,
                        isHost: true,
                        isAgent: true
                    }
                },
                messages: {
                    orderBy: { createdAt: 'desc' },
                    take: 1,
                    include: {
                        sender: {
                            select: {
                                id: true,
                                firstName: true,
                                lastName: true
                            }
                        }
                    }
                },
                property: {
                    select: {
                        id: true,
                        title: true,
                        images: true,
                        city: true,
                        emirate: true
                    }
                },
                booking: {
                    select: {
                        id: true,
                        status: true,
                        checkIn: true,
                        checkOut: true
                    }
                }
            },
            orderBy: { lastMessageAt: 'desc' }
        });
        const formattedConversations = conversations.map(conv => {
            const otherParticipant = conv.participants.find(p => p.id !== userId);
            const unreadCount = conv.unreadCount ?
                JSON.parse(conv.unreadCount)[userId] || 0 : 0;
            return {
                id: conv.id,
                guestName: otherParticipant ? `${otherParticipant.firstName} ${otherParticipant.lastName}` : 'Unknown User',
                guestAvatar: otherParticipant?.avatar,
                lastMessage: conv.messages[0]?.content || 'No messages yet',
                lastMessageTime: conv.messages[0]?.createdAt || conv.createdAt,
                unreadCount,
                isOnline: false,
                propertyTitle: conv.property?.title || 'No property',
                propertyImage: conv.property?.images?.split(',')[0],
                bookingId: conv.booking?.id,
                bookingStatus: conv.booking?.status || 'pending',
                participantInfo: otherParticipant,
                type: conv.type
            };
        });
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
        const conversation = await prisma.conversation.findFirst({
            where: {
                id: conversationId,
                participants: {
                    some: { id: userId }
                }
            },
            include: {
                participants: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        avatar: true
                    }
                }
            }
        });
        if (!conversation) {
            return res.status(403).json({ success: false, error: 'Access denied to conversation' });
        }
        const messages = await prisma.message.findMany({
            where: {
                conversationId,
                isDeleted: false
            },
            include: {
                sender: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        avatar: true
                    }
                }
            },
            orderBy: { createdAt: 'asc' }
        });
        await prisma.message.updateMany({
            where: {
                conversationId,
                senderId: { not: userId },
                isRead: false
            },
            data: {
                isRead: true,
                readAt: new Date()
            }
        });
        const currentUnreadCount = conversation.unreadCount ?
            JSON.parse(conversation.unreadCount) : {};
        currentUnreadCount[userId] = 0;
        await prisma.conversation.update({
            where: { id: conversationId },
            data: {
                unreadCount: JSON.stringify(currentUnreadCount)
            }
        });
        res.json({
            success: true,
            data: {
                conversation,
                messages: messages.map(msg => ({
                    id: msg.id,
                    senderId: msg.senderId,
                    senderName: msg.senderId === userId ? 'You' : `${msg.sender.firstName} ${msg.sender.lastName}`,
                    content: msg.content,
                    timestamp: msg.createdAt,
                    isRead: msg.isRead,
                    type: msg.type,
                    attachments: msg.attachments
                }))
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
        const { content, type = 'TEXT', attachments } = req.body;
        if (!userId) {
            return res.status(401).json({ success: false, error: 'User not authenticated' });
        }
        if (!content?.trim()) {
            return res.status(400).json({ success: false, error: 'Message content is required' });
        }
        const conversation = await prisma.conversation.findFirst({
            where: {
                id: conversationId,
                participants: {
                    some: { id: userId }
                }
            },
            include: {
                participants: {
                    select: { id: true }
                }
            }
        });
        if (!conversation) {
            return res.status(403).json({ success: false, error: 'Access denied to conversation' });
        }
        const message = await prisma.message.create({
            data: {
                content: content.trim(),
                type,
                attachments,
                senderId: userId,
                conversationId
            },
            include: {
                sender: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        avatar: true
                    }
                }
            }
        });
        const currentUnreadCount = conversation.unreadCount ?
            JSON.parse(conversation.unreadCount) : {};
        conversation.participants.forEach(participant => {
            if (participant.id !== userId) {
                currentUnreadCount[participant.id] = (currentUnreadCount[participant.id] || 0) + 1;
            }
        });
        await prisma.conversation.update({
            where: { id: conversationId },
            data: {
                lastMessageAt: new Date(),
                unreadCount: JSON.stringify(currentUnreadCount)
            }
        });
        res.json({
            success: true,
            data: {
                id: message.id,
                senderId: message.senderId,
                senderName: 'You',
                content: message.content,
                timestamp: message.createdAt,
                isRead: false,
                type: message.type,
                attachments: message.attachments
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
        const { participantIds, propertyId, bookingId, type = 'GENERAL', initialMessage } = req.body;
        if (!userId) {
            return res.status(401).json({ success: false, error: 'User not authenticated' });
        }
        if (!participantIds || !Array.isArray(participantIds) || participantIds.length === 0) {
            return res.status(400).json({ success: false, error: 'Participant IDs are required' });
        }
        const allParticipantIds = [...new Set([userId, ...participantIds])];
        const existingConversation = await prisma.conversation.findFirst({
            where: {
                type,
                propertyId: propertyId || null,
                bookingId: bookingId || null,
                participants: {
                    every: {
                        id: { in: allParticipantIds }
                    }
                }
            }
        });
        if (existingConversation) {
            return res.json({
                success: true,
                data: { conversationId: existingConversation.id }
            });
        }
        const conversation = await prisma.conversation.create({
            data: {
                type,
                propertyId: propertyId || null,
                bookingId: bookingId || null,
                participants: {
                    connect: allParticipantIds.map(id => ({ id }))
                },
                unreadCount: JSON.stringify({})
            },
            include: {
                participants: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        avatar: true
                    }
                }
            }
        });
        if (initialMessage?.trim()) {
            await prisma.message.create({
                data: {
                    content: initialMessage.trim(),
                    type: 'TEXT',
                    senderId: userId,
                    conversationId: conversation.id
                }
            });
            const unreadCount = {};
            conversation.participants.forEach(participant => {
                unreadCount[participant.id] = participant.id === userId ? 0 : 1;
            });
            await prisma.conversation.update({
                where: { id: conversation.id },
                data: {
                    lastMessageAt: new Date(),
                    unreadCount: JSON.stringify(unreadCount)
                }
            });
        }
        res.json({
            success: true,
            data: { conversationId: conversation.id }
        });
    }
    catch (error) {
        console.error('Error creating conversation:', error);
        res.status(500).json({ success: false, error: 'Internal server error' });
    }
});
router.post('/admin/send-message', auth_1.authMiddleware, async (req, res) => {
    try {
        const user = req.user;
        const isAdmin = user?.email === 'admin@uae-rental.com' || user?.email?.endsWith('@admin.uae-rental.com');
        if (!user || !isAdmin) {
            return res.status(403).json({ success: false, error: 'Admin access required' });
        }
        const { recipientId, content, type = 'TEXT', createConversation = true } = req.body;
        if (!recipientId || !content?.trim()) {
            return res.status(400).json({ success: false, error: 'Recipient ID and content are required' });
        }
        let conversation = await prisma.conversation.findFirst({
            where: {
                type: 'SUPPORT',
                participants: {
                    every: {
                        id: { in: [user.id, recipientId] }
                    }
                }
            }
        });
        if (!conversation && createConversation) {
            conversation = await prisma.conversation.create({
                data: {
                    type: 'SUPPORT',
                    participants: {
                        connect: [{ id: user.id }, { id: recipientId }]
                    },
                    unreadCount: JSON.stringify({})
                }
            });
        }
        if (!conversation) {
            return res.status(404).json({ success: false, error: 'Conversation not found' });
        }
        const message = await prisma.message.create({
            data: {
                content: content.trim(),
                type,
                senderId: user.id,
                conversationId: conversation.id
            },
            include: {
                sender: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        avatar: true
                    }
                }
            }
        });
        const currentUnreadCount = conversation.unreadCount ?
            JSON.parse(conversation.unreadCount) : {};
        currentUnreadCount[recipientId] = (currentUnreadCount[recipientId] || 0) + 1;
        await prisma.conversation.update({
            where: { id: conversation.id },
            data: {
                lastMessageAt: new Date(),
                unreadCount: JSON.stringify(currentUnreadCount)
            }
        });
        res.json({
            success: true,
            data: {
                conversationId: conversation.id,
                message: {
                    id: message.id,
                    content: message.content,
                    timestamp: message.createdAt,
                    sender: message.sender
                }
            }
        });
    }
    catch (error) {
        console.error('Error sending admin message:', error);
        res.status(500).json({ success: false, error: 'Internal server error' });
    }
});
router.get('/admin/users', auth_1.authMiddleware, async (req, res) => {
    try {
        const user = req.user;
        const isAdmin = user?.email === 'admin@uae-rental.com' || user?.email?.endsWith('@admin.uae-rental.com');
        if (!user || !isAdmin) {
            return res.status(403).json({ success: false, error: 'Admin access required' });
        }
        const users = await prisma.user.findMany({
            where: {
                id: { not: user.id },
                isActive: true
            },
            select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
                avatar: true,
                isHost: true,
                isAgent: true
            },
            orderBy: [
                { isHost: 'desc' },
                { firstName: 'asc' }
            ]
        });
        res.json({
            success: true,
            data: users
        });
    }
    catch (error) {
        console.error('Error fetching users:', error);
        res.status(500).json({ success: false, error: 'Internal server error' });
    }
});
exports.default = router;
//# sourceMappingURL=messages.js.map