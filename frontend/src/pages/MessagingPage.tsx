import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { 
  MessageCircle, 
  Send, 
  Search, 
  Paperclip, 
  Phone, 
  Video, 
  MoreVertical, 
  Check, 
  CheckCheck, 
  File, 
  X, 
  Home, 
  Settings
} from 'lucide-react';
import { User as UserType, Conversation, Message, Booking, Property } from '@/types';
import { formatDate } from '@/lib/utils';

interface MessageInput {
  text: string;
  attachments: File[];
}

interface ConversationPreview {
  id: string;
  participant: UserType;
  lastMessage: Message;
  unreadCount: number;
  booking?: Booking;
  property?: Property;
  isOnline: boolean;
  lastSeenAt?: Date;
}

const MessagingPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const conversationId = searchParams.get('conversation');
  
  const [conversations, setConversations] = useState<ConversationPreview[]>([]);
  const [activeConversation, setActiveConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [messageInput, setMessageInput] = useState<MessageInput>({ text: '', attachments: [] });
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'unread' | 'hosts' | 'guests' | 'archived'>('all');
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const messageInputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    fetchConversations();
  }, []);

  useEffect(() => {
    if (conversationId) {
      loadConversation(conversationId);
    }
  }, [conversationId, conversations]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const fetchConversations = async () => {
    setLoading(true);
    try {
      // Simulate API call
      setTimeout(() => {
        const mockConversations: ConversationPreview[] = [
          {
            id: '1',
            participant: {
              id: 'host-1',
              firstName: 'Ahmed',
              lastName: 'Al Mansoori',
              avatar: '/host-avatar.jpg',
              email: 'ahmed@example.com',
              phoneVerified: true,
              nationality: 'AE',
              isHost: true,
              isGuest: false,
              isVerified: true,
              kycStatus: 'VERIFIED' as any,
              preferredLanguage: 'en' as any,
              createdAt: new Date(),
              updatedAt: new Date(),
              addresses: [],
              documents: [],
              paymentMethods: []
            },
            lastMessage: {
              id: 'msg-1',
              conversationId: '1',
              senderId: 'host-1',
              sender: {} as UserType,
              receiverId: 'current-user',
              receiver: {} as UserType,
              content: 'Thank you for your booking! I look forward to hosting you.',
              timestamp: new Date(Date.now() - 1000 * 60 * 30), // 30 minutes ago
              isRead: false
            },
            unreadCount: 2,
            isOnline: true,
            property: {
              id: 'prop-1',
              title: 'Luxurious Marina View Apartment',
              area: 'Dubai Marina',
              city: 'Dubai',
              emirate: 'Dubai'
            } as Property
          },
          {
            id: '2',
            participant: {
              id: 'guest-1',
              firstName: 'Sarah',
              lastName: 'Johnson',
              avatar: '/guest-avatar.jpg',
              email: 'sarah@example.com',
              phoneVerified: true,
              nationality: 'US',
              isHost: false,
              isGuest: true,
              isVerified: true,
              kycStatus: 'VERIFIED' as any,
              preferredLanguage: 'en' as any,
              createdAt: new Date(),
              updatedAt: new Date(),
              addresses: [],
              documents: [],
              paymentMethods: []
            },
            lastMessage: {
              id: 'msg-2',
              conversationId: '2',
              senderId: 'current-user',
              sender: {} as UserType,
              receiverId: 'guest-1',
              receiver: {} as UserType,
              content: 'The check-in instructions have been sent to your email.',
              timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2), // 2 hours ago
              isRead: true
            },
            unreadCount: 0,
            isOnline: false,
            lastSeenAt: new Date(Date.now() - 1000 * 60 * 45), // 45 minutes ago
            property: {
              id: 'prop-2',
              title: 'Cozy Downtown Studio',
              area: 'Downtown Dubai',
              city: 'Dubai',
              emirate: 'Dubai'
            } as Property
          },
          {
            id: '3',
            participant: {
              id: 'guest-2',
              firstName: 'Mohammad',
              lastName: 'Hassan',
              avatar: '/guest2-avatar.jpg',
              email: 'mohammad@example.com',
              phoneVerified: true,
              nationality: 'AE',
              isHost: false,
              isGuest: true,
              isVerified: true,
              kycStatus: 'VERIFIED' as any,
              preferredLanguage: 'ar' as any,
              createdAt: new Date(),
              updatedAt: new Date(),
              addresses: [],
              documents: [],
              paymentMethods: []
            },
            lastMessage: {
              id: 'msg-3',
              conversationId: '3',
              senderId: 'guest-2',
              sender: {} as UserType,
              receiverId: 'current-user',
              receiver: {} as UserType,
              content: 'هل يمكنني الوصول مبكراً للتسجيل؟', // Can I arrive early for check-in?
              timestamp: new Date(Date.now() - 1000 * 60 * 60 * 4), // 4 hours ago
              isRead: false
            },
            unreadCount: 1,
            isOnline: true
          }
        ];
        
        setConversations(mockConversations);
        setLoading(false);
      }, 1000);
    } catch (error) {
      console.error('Error fetching conversations:', error);
      setLoading(false);
    }
  };

  const loadConversation = async (conversationId: string) => {
    setLoading(true);
    try {
      // Simulate API call
      setTimeout(() => {
        const mockMessages: Message[] = [
          {
            id: 'msg-1',
            conversationId,
            senderId: 'host-1',
            sender: conversations.find(c => c.id === conversationId)?.participant || {} as UserType,
            receiverId: 'current-user',
            receiver: {} as UserType,
            content: 'Hello! Welcome to my property. I\'m excited to host you during your stay in Dubai.',
            timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24), // 1 day ago
            isRead: true
          },
          {
            id: 'msg-2',
            conversationId,
            senderId: 'current-user',
            sender: {} as UserType,
            receiverId: 'host-1',
            receiver: {} as UserType,
            content: 'Thank you! I\'m looking forward to my stay. Could you please share the check-in procedures?',
            timestamp: new Date(Date.now() - 1000 * 60 * 60 * 23), // 23 hours ago
            isRead: true
          },
          {
            id: 'msg-3',
            conversationId,
            senderId: 'host-1',
            sender: conversations.find(c => c.id === conversationId)?.participant || {} as UserType,
            receiverId: 'current-user',
            receiver: {} as UserType,
            content: 'Of course! Check-in is available from 3:00 PM onwards. The building entrance code is 1234, and your apartment key will be in the lockbox by the door (code: 5678).',
            timestamp: new Date(Date.now() - 1000 * 60 * 60 * 22), // 22 hours ago
            isRead: true
          },
          {
            id: 'msg-4',
            conversationId,
            senderId: 'host-1',
            sender: conversations.find(c => c.id === conversationId)?.participant || {} as UserType,
            receiverId: 'current-user',
            receiver: {} as UserType,
            content: 'I\'ve also prepared a welcome guide with local recommendations. You\'ll find it on the coffee table.',
            timestamp: new Date(Date.now() - 1000 * 60 * 60 * 22), // 22 hours ago
            isRead: true
          },
          {
            id: 'msg-5',
            conversationId,
            senderId: 'current-user',
            sender: {} as UserType,
            receiverId: 'host-1',
            receiver: {} as UserType,
            content: 'Perfect! That\'s very helpful. Is there parking available?',
            timestamp: new Date(Date.now() - 1000 * 60 * 60 * 20), // 20 hours ago
            isRead: true
          },
          {
            id: 'msg-6',
            conversationId,
            senderId: 'host-1',
            sender: conversations.find(c => c.id === conversationId)?.participant || {} as UserType,
            receiverId: 'current-user',
            receiver: {} as UserType,
            content: 'Yes, there\'s complimentary parking in the building garage. Parking spot #47 is reserved for you.',
            timestamp: new Date(Date.now() - 1000 * 60 * 60 * 18), // 18 hours ago
            isRead: true
          },
          {
            id: 'msg-7',
            conversationId,
            senderId: 'host-1',
            sender: conversations.find(c => c.id === conversationId)?.participant || {} as UserType,
            receiverId: 'current-user',
            receiver: {} as UserType,
            content: 'Thank you for your booking! I look forward to hosting you.',
            timestamp: new Date(Date.now() - 1000 * 60 * 30), // 30 minutes ago
            isRead: false
          }
        ];

        const conversation = conversations.find(c => c.id === conversationId);
        if (conversation) {
          setActiveConversation({
            id: conversationId,
            participants: [],
            messages: mockMessages,
            bookingId: 'booking-1',
            createdAt: new Date(),
            updatedAt: new Date()
          });
          setMessages(mockMessages);
          
          // Mark messages as read
          markMessagesAsRead(conversationId);
        }
        
        setLoading(false);
      }, 500);
    } catch (error) {
      console.error('Error loading conversation:', error);
      setLoading(false);
    }
  };

  const markMessagesAsRead = (conversationId: string) => {
    setConversations(prev => prev.map(conv => 
      conv.id === conversationId 
        ? { ...conv, unreadCount: 0, lastMessage: { ...conv.lastMessage, isRead: true } }
        : conv
    ));
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSendMessage = async () => {
    if (!messageInput.text.trim() && messageInput.attachments.length === 0) return;
    if (!activeConversation) return;

    const newMessage: Message = {
      id: `msg-${Date.now()}`,
      conversationId: activeConversation.id,
      senderId: 'current-user',
      sender: {} as UserType,
      receiverId: activeConversation.participants[0]?.userId || 'other-user',
      receiver: {} as UserType,
      content: messageInput.text,
      timestamp: new Date(),
      isRead: false
    };

    setMessages(prev => [...prev, newMessage]);
    setMessageInput({ text: '', attachments: [] });

    // Update conversation preview
    setConversations(prev => prev.map(conv => 
      conv.id === activeConversation.id 
        ? { ...conv, lastMessage: newMessage }
        : conv
    ));

    // Simulate sending to server
    setTimeout(() => {
      setMessages(prev => prev.map(msg => 
        msg.id === newMessage.id ? { ...msg, isRead: true } : msg
      ));
    }, 1000);
  };

  const handleFileAttachment = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    setMessageInput(prev => ({
      ...prev,
      attachments: [...prev.attachments, ...files]
    }));
  };

  const removeAttachment = (index: number) => {
    setMessageInput(prev => ({
      ...prev,
      attachments: prev.attachments.filter((_, i) => i !== index)
    }));
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const getFilteredConversations = () => {
    let filtered = conversations;

    // Apply search filter
    if (searchQuery) {
      filtered = filtered.filter(conv => 
        conv.participant.firstName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        conv.participant.lastName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        conv.lastMessage.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
        conv.property?.title.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Apply category filter
    switch (selectedFilter) {
      case 'unread':
        filtered = filtered.filter(conv => conv.unreadCount > 0);
        break;
      case 'hosts':
        filtered = filtered.filter(conv => conv.participant.isHost);
        break;
      case 'guests':
        filtered = filtered.filter(conv => conv.participant.isGuest);
        break;
      case 'archived':
        // Would filter archived conversations
        filtered = [];
        break;
    }

    return filtered.sort((a, b) => 
      new Date(b.lastMessage.timestamp).getTime() - new Date(a.lastMessage.timestamp).getTime()
    );
  };

  const formatMessageTime = (timestamp: Date) => {
    const now = new Date();
    const diffInHours = (now.getTime() - timestamp.getTime()) / (1000 * 60 * 60);
    
    if (diffInHours < 1) {
      const diffInMinutes = Math.floor(diffInHours * 60);
      return `${diffInMinutes}m ago`;
    } else if (diffInHours < 24) {
      return `${Math.floor(diffInHours)}h ago`;
    } else {
      return formatDate(timestamp, 'en-US');
    }
  };

  const getOnlineStatus = (isOnline: boolean, lastSeenAt?: Date) => {
    if (isOnline) return 'Online';
    if (lastSeenAt) {
      return `Last seen ${formatMessageTime(lastSeenAt)}`;
    }
    return 'Offline';
  };

  if (loading && conversations.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-[#C5A572] mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading conversations...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="flex h-screen">
        {/* Conversations Sidebar */}
        <div className="w-80 bg-white border-r border-gray-200 flex flex-col">
          {/* Header */}
          <div className="p-4 border-b border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <h1 className="text-xl font-semibold text-gray-900">Messages</h1>
              <Button variant="outline" size="sm">
                <Settings className="w-4 h-4" />
              </Button>
            </div>
            
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Search conversations..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          {/* Filters */}
          <div className="p-4 border-b border-gray-200">
            <div className="flex flex-wrap gap-2">
              {[
                { key: 'all', label: 'All', count: conversations.length },
                { key: 'unread', label: 'Unread', count: conversations.filter(c => c.unreadCount > 0).length },
                { key: 'hosts', label: 'Hosts', count: conversations.filter(c => c.participant.isHost).length },
                { key: 'guests', label: 'Guests', count: conversations.filter(c => c.participant.isGuest).length }
              ].map(filter => (
                <button
                  key={filter.key}
                  onClick={() => setSelectedFilter(filter.key as any)}
                  className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                    selectedFilter === filter.key
                      ? 'bg-[#C5A572] text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {filter.label} {filter.count > 0 && `(${filter.count})`}
                </button>
              ))}
            </div>
          </div>

          {/* Conversations List */}
          <div className="flex-1 overflow-y-auto">
            {getFilteredConversations().map((conversation) => (
              <div
                key={conversation.id}
                onClick={() => {
                  navigate(`/messages?conversation=${conversation.id}`);
                  loadConversation(conversation.id);
                }}
                className={`p-4 border-b border-gray-100 hover:bg-gray-50 cursor-pointer transition-colors ${
                  activeConversation?.id === conversation.id ? 'bg-blue-50 border-blue-200' : ''
                }`}
              >
                <div className="flex items-start space-x-3">
                  <div className="relative">
                    <img
                      src={conversation.participant.avatar || '/default-avatar.jpg'}
                      alt={`${conversation.participant.firstName} ${conversation.participant.lastName}`}
                      className="w-12 h-12 rounded-full object-cover"
                    />
                    {conversation.isOnline && (
                      <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white rounded-full"></div>
                    )}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <h3 className="font-medium text-gray-900 truncate">
                        {conversation.participant.firstName} {conversation.participant.lastName}
                      </h3>
                      <div className="flex items-center space-x-1">
                        {conversation.participant.isHost && (
                          <Badge variant="gold" className="text-xs">Host</Badge>
                        )}
                        {conversation.unreadCount > 0 && (
                          <Badge variant="primary" className="text-xs">
                            {conversation.unreadCount}
                          </Badge>
                        )}
                      </div>
                    </div>
                    
                    {conversation.property && (
                      <p className="text-xs text-gray-600 mb-1 flex items-center">
                        <Home className="w-3 h-3 mr-1" />
                        {conversation.property.title}
                      </p>
                    )}
                    
                    <p className="text-sm text-gray-600 truncate mb-1">
                      {conversation.lastMessage.content}
                    </p>
                    
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-500">
                        {formatMessageTime(conversation.lastMessage.timestamp)}
                      </span>
                      <div className="flex items-center space-x-1">
                        {conversation.lastMessage.senderId === 'current-user' && (
                          conversation.lastMessage.isRead ? (
                            <CheckCheck className="w-3 h-3 text-blue-500" />
                          ) : (
                            <Check className="w-3 h-3 text-gray-400" />
                          )
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
            
            {getFilteredConversations().length === 0 && (
              <div className="p-8 text-center text-gray-500">
                <MessageCircle className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                <p>No conversations found</p>
              </div>
            )}
          </div>
        </div>

        {/* Chat Area */}
        <div className="flex-1 flex flex-col">
          {activeConversation ? (
            <>
              {/* Chat Header */}
              <div className="bg-white border-b border-gray-200 p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="relative">
                      <img
                        src={conversations.find(c => c.id === activeConversation.id)?.participant.avatar || '/default-avatar.jpg'}
                        alt="Profile"
                        className="w-10 h-10 rounded-full object-cover"
                      />
                      {conversations.find(c => c.id === activeConversation.id)?.isOnline && (
                        <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white rounded-full"></div>
                      )}
                    </div>
                    <div>
                      <h2 className="font-semibold text-gray-900">
                        {conversations.find(c => c.id === activeConversation.id)?.participant.firstName}{' '}
                        {conversations.find(c => c.id === activeConversation.id)?.participant.lastName}
                      </h2>
                      <p className="text-sm text-gray-600">
                        {getOnlineStatus(
                          conversations.find(c => c.id === activeConversation.id)?.isOnline || false,
                          conversations.find(c => c.id === activeConversation.id)?.lastSeenAt
                        )}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Button variant="outline" size="sm">
                      <Phone className="w-4 h-4" />
                    </Button>
                    <Button variant="outline" size="sm">
                      <Video className="w-4 h-4" />
                    </Button>
                    <Button variant="outline" size="sm">
                      <MoreVertical className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
                
                {/* Property Info */}
                {conversations.find(c => c.id === activeConversation.id)?.property && (
                  <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-2">
                      <Home className="w-4 h-4 text-gray-600" />
                      <span className="text-sm font-medium text-gray-900">
                        {conversations.find(c => c.id === activeConversation.id)?.property?.title}
                      </span>
                      <span className="text-sm text-gray-600">
                        • {conversations.find(c => c.id === activeConversation.id)?.property?.area}
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.map((message, index) => {
                  const isCurrentUser = message.senderId === 'current-user';
                  const showAvatar = index === 0 || messages[index - 1].senderId !== message.senderId;
                  
                  return (
                    <div
                      key={message.id}
                      className={`flex ${isCurrentUser ? 'justify-end' : 'justify-start'}`}
                    >
                      <div className={`flex items-end space-x-2 max-w-xs lg:max-w-md ${isCurrentUser ? 'flex-row-reverse space-x-reverse' : ''}`}>
                        {!isCurrentUser && showAvatar && (
                          <img
                            src={message.sender.avatar || '/default-avatar.jpg'}
                            alt="Avatar"
                            className="w-8 h-8 rounded-full object-cover"
                          />
                        )}
                        {!isCurrentUser && !showAvatar && (
                          <div className="w-8" />
                        )}
                        
                        <div
                          className={`px-4 py-2 rounded-lg ${
                            isCurrentUser
                              ? 'bg-[#C5A572] text-white'
                              : 'bg-gray-100 text-gray-900'
                          }`}
                        >
                          <p className="text-sm">{message.content}</p>
                          <div className={`flex items-center justify-between mt-1 space-x-2 ${isCurrentUser ? 'flex-row-reverse' : ''}`}>
                            <span className={`text-xs ${isCurrentUser ? 'text-[#E5D5B7]' : 'text-gray-500'}`}>
                              {formatMessageTime(message.timestamp)}
                            </span>
                            {isCurrentUser && (
                              <div className="flex items-center">
                                {message.isRead ? (
                                  <CheckCheck className="w-3 h-3 text-[#E5D5B7]" />
                                ) : (
                                  <Check className="w-3 h-3 text-[#E5D5B7]" />
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
                
                <div ref={messagesEndRef} />
              </div>

              {/* Message Input */}
              <div className="bg-white border-t border-gray-200 p-4">
                {/* Attachments Preview */}
                {messageInput.attachments.length > 0 && (
                  <div className="mb-3 flex flex-wrap gap-2">
                    {messageInput.attachments.map((file, index) => (
                      <div key={index} className="flex items-center bg-gray-100 rounded-lg p-2 text-sm">
                        <File className="w-4 h-4 mr-2 text-gray-600" />
                        <span className="truncate max-w-32">{file.name}</span>
                        <button
                          onClick={() => removeAttachment(index)}
                          className="ml-2 text-gray-500 hover:text-red-500"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
                
                <div className="flex items-end space-x-2">
                  <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    onChange={handleFileAttachment}
                    className="hidden"
                    accept="image/*,.pdf,.doc,.docx"
                  />
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => fileInputRef.current?.click()}
                    className="flex-shrink-0"
                  >
                    <Paperclip className="w-4 h-4" />
                  </Button>
                  
                  <div className="flex-1">
                    <textarea
                      ref={messageInputRef}
                      value={messageInput.text}
                      onChange={(e) => setMessageInput(prev => ({ ...prev, text: e.target.value }))}
                      onKeyPress={handleKeyPress}
                      placeholder="Type a message..."
                      rows={1}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#C5A572] focus:border-transparent resize-none"
                      style={{ minHeight: '40px', maxHeight: '120px' }}
                    />
                  </div>
                  
                  <Button
                    onClick={handleSendMessage}
                    disabled={!messageInput.text.trim() && messageInput.attachments.length === 0}
                    className="flex-shrink-0"
                  >
                    <Send className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </>
          ) : (
            // No conversation selected
            <div className="flex-1 flex items-center justify-center bg-gray-50">
              <div className="text-center">
                <MessageCircle className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Welcome to Messages</h3>
                <p className="text-gray-600 mb-4">Select a conversation to start messaging</p>
                <div className="space-y-2 text-sm text-gray-500">
                  <p>💬 Chat with your hosts and guests</p>
                  <p>📎 Share files and images</p>
                  <p>🔔 Get real-time notifications</p>
                  <p>🌍 Automatic translation support</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MessagingPage; 