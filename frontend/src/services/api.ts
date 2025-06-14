import { API_CONFIG } from '../config/api';

class ApiService {
  private baseURL: string;

  constructor() {
    this.baseURL = API_CONFIG.BASE_URL;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseURL}${endpoint}`;
    
    // Get JWT token from localStorage
    const token = localStorage.getItem('token');
    
    const config: RequestInit = {
      headers: {
        ...API_CONFIG.HEADERS,
        ...(token && { Authorization: `Bearer ${token}` }), // Add JWT token if available
        ...options.headers,
      },
      ...options,
    };

    try {
      const response = await fetch(url, config);
      
      if (!response.ok) {
        // Try to get error message from response body
        try {
          const errorData = await response.json();
          throw new Error(errorData.error || errorData.message || `HTTP error! status: ${response.status}`);
        } catch (parseError) {
          // If response is not JSON, use status text
        throw new Error(`HTTP error! status: ${response.status}`);
        }
      }
      
      const data = await response.json();
      
      if (data.success === false) {
        throw new Error(data.error || 'API request failed');
      }
      
      return data.data || data;
    } catch (error) {
      console.error('API request failed:', error);
      throw error;
    }
  }

  // Properties
  async getProperties(params: any = {}) {
    // Clean parameters before sending to API - remove null, undefined, empty values
    const cleanParams: any = {};
    
    Object.entries(params).forEach(([key, value]) => {
      if (value !== null && value !== undefined && value !== '' && value !== 'null' && value !== 'undefined') {
        // Convert to string for URLSearchParams
        cleanParams[key] = String(value);
      }
    });

    const queryString = new URLSearchParams(cleanParams).toString();
    const endpoint = `${API_CONFIG.ENDPOINTS.PROPERTIES}${queryString ? `?${queryString}` : ''}`;
    console.log('API call:', endpoint);
    return this.request(endpoint);
  }

  async getProperty(id: string) {
    return this.request(`${API_CONFIG.ENDPOINTS.PROPERTY_DETAIL}/${id}`);
  }

  async createProperty(propertyData: any) {
    return this.request(API_CONFIG.ENDPOINTS.PROPERTIES, {
      method: 'POST',
      body: JSON.stringify(propertyData),
    });
  }

  async updateProperty(id: string, propertyData: any) {
    return this.request(`${API_CONFIG.ENDPOINTS.PROPERTIES}/${id}`, {
      method: 'PUT',
      body: JSON.stringify(propertyData),
    });
  }

  async deleteProperty(id: string, hostId: string) {
    return this.request(`${API_CONFIG.ENDPOINTS.PROPERTIES}/${id}`, {
      method: 'DELETE',
      body: JSON.stringify({ hostId }),
    });
  }

  async searchProperties(query: string, filters: any = {}) {
    const params = { q: query, ...filters };
    const queryString = new URLSearchParams(params).toString();
    return this.request(`${API_CONFIG.ENDPOINTS.PROPERTY_SEARCH}?${queryString}`);
  }

  async getNearbyProperties(lat: number, lng: number, radius: number = 5) {
    const params = { lat: lat.toString(), lng: lng.toString(), radius: radius.toString() };
    const queryString = new URLSearchParams(params).toString();
    return this.request(`${API_CONFIG.ENDPOINTS.NEARBY_PROPERTIES}?${queryString}`);
  }

  // Auth
  async login(email: string, password: string) {
    return this.request(API_CONFIG.ENDPOINTS.LOGIN, {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  }

  async register(userData: any) {
    return this.request(API_CONFIG.ENDPOINTS.REGISTER, {
      method: 'POST',
      body: JSON.stringify(userData),
    });
  }

  async logout() {
    return this.request(API_CONFIG.ENDPOINTS.LOGOUT, {
      method: 'POST',
    });
  }

  // Bookings
  async getBookings(filters?: { guestId?: string; hostId?: string; propertyId?: string; status?: string }) {
    const params = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value) params.append(key, value);
      });
    }
    
    // Add user context - use the authenticated user's ID
    const headers: any = {};
    if (filters?.guestId) {
      headers['x-user-id'] = filters.guestId;
    } else if (filters?.hostId) {
      headers['x-user-id'] = filters.hostId;
    } else {
      // If no specific user ID provided, the backend will use the JWT token to identify the user
      // No need to set x-user-id header as the backend will extract user ID from the JWT token
    }
    
    return this.request(`${API_CONFIG.ENDPOINTS.BOOKINGS}?${params.toString()}`, { headers });
  }

  async getBooking(id: string) {
    return this.request(`${API_CONFIG.ENDPOINTS.BOOKINGS}/${id}`);
  }

  async createBooking(bookingData: any) {
    return this.request(API_CONFIG.ENDPOINTS.CREATE_BOOKING, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-user-id': 'test-guest-001' // Use test guest for booking creation
      },
      body: JSON.stringify(bookingData)
    });
  }

  async updateBooking(id: string, updates: any) {
    return this.request(`${API_CONFIG.ENDPOINTS.BOOKINGS}/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(updates)
    });
  }

  async cancelBooking(id: string, reason?: string) {
    return this.request(`${API_CONFIG.ENDPOINTS.BOOKINGS}/${id}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ reason })
    });
  }

  async getPropertyAvailability(propertyId: string, checkIn: string, checkOut: string) {
    return this.request(`${API_CONFIG.ENDPOINTS.BOOKINGS}/availability/${propertyId}?checkIn=${checkIn}&checkOut=${checkOut}`);
  }

  // Reviews
  async getReviews(filters?: {
    propertyId?: string;
    hostId?: string;
    guestId?: string;
    type?: 'all' | 'received' | 'written';
    sortBy?: 'newest' | 'oldest' | 'highest' | 'lowest';
    rating?: number;
    limit?: number;
    offset?: number;
  }) {
    const params = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined) {
          params.append(key, value.toString());
        }
      });
    }
    const url = `${API_CONFIG.ENDPOINTS.REVIEWS}${params.toString() ? '?' + params.toString() : ''}`;
    return this.request(url);
  }

  async getReview(id: string) {
    return this.request(`${API_CONFIG.ENDPOINTS.REVIEWS}/${id}`);
  }

  async createReview(reviewData: {
    bookingId: string;
    propertyId: string;
    hostId: string;
    overallRating: number;
    cleanlinessRating?: number;
    accuracyRating?: number;
    checkInRating?: number;
    communicationRating?: number;
    locationRating?: number;
    valueRating?: number;
    comment: string;
    title?: string;
    photos?: string[];
  }) {
    return this.request(API_CONFIG.ENDPOINTS.CREATE_REVIEW, {
      method: 'POST',
      body: JSON.stringify(reviewData),
    });
  }

  async addHostResponse(reviewId: string, response: string) {
    return this.request(`${API_CONFIG.ENDPOINTS.REVIEWS}/${reviewId}/response`, {
      method: 'POST',
      body: JSON.stringify({ response }),
    });
  }

  async getReviewStats(hostId: string) {
    return this.request(`${API_CONFIG.ENDPOINTS.REVIEWS}/stats/${hostId}`);
  }

  // User Profile
  async getProfile() {
    return this.request(API_CONFIG.ENDPOINTS.PROFILE);
  }

  async updateProfile(profileData: any) {
    return this.request(API_CONFIG.ENDPOINTS.UPDATE_PROFILE, {
      method: 'PUT',
      body: JSON.stringify(profileData),
    });
  }

  // Host
  async getHostProperties() {
    return this.request(API_CONFIG.ENDPOINTS.HOST_PROPERTIES);
  }

  async getHostBookings() {
    return this.request(API_CONFIG.ENDPOINTS.HOST_BOOKINGS);
  }

  async getHostAnalytics() {
    return this.request('/analytics/host');
  }

  // Messages
  async getConversations() {
    return this.request('/messages/conversations');
  }

  async getConversation(conversationId: string) {
    return this.request(`/messages/conversations/${conversationId}`);
  }

  async sendMessage(conversationId: string, content: string, type: string = 'TEXT', attachments?: any) {
    return this.request(`/messages/conversations/${conversationId}/messages`, {
      method: 'POST',
      body: JSON.stringify({ content, type, attachments }),
    });
  }

  async createConversation(participantIds: string[], propertyId?: string, bookingId?: string, type: string = 'GENERAL', initialMessage?: string) {
    return this.request('/messages/conversations', {
      method: 'POST',
      body: JSON.stringify({ participantIds, propertyId, bookingId, type, initialMessage }),
    });
  }

  // Admin messages
  async sendAdminMessage(recipientId: string, content: string, type: string = 'TEXT', createConversation: boolean = true) {
    return this.request('/messages/admin/send-message', {
      method: 'POST',
      body: JSON.stringify({ recipientId, content, type, createConversation }),
    });
  }

  async getAllUsers() {
    return this.request('/messages/admin/users');
  }

  // Calendar
  async getCalendar(propertyId: string, year?: number, month?: number) {
    const params = new URLSearchParams();
    if (year) params.append('year', year.toString());
    if (month) params.append('month', month.toString());
    const queryString = params.toString();
    return this.request(`/calendar/property/${propertyId}${queryString ? `?${queryString}` : ''}`);
  }

  async blockDates(propertyId: string, dates: string[], reason?: string, type: string = 'BLOCKED') {
    return this.request(`/calendar/property/${propertyId}/block`, {
      method: 'POST',
      body: JSON.stringify({ dates, reason, type }),
    });
  }

  async unblockDates(propertyId: string, dates: string[]) {
    return this.request(`/calendar/property/${propertyId}/block`, {
      method: 'DELETE',
      body: JSON.stringify({ dates }),
    });
  }

  async updatePricing(propertyId: string, dates: string[], price: number) {
    return this.request(`/calendar/property/${propertyId}/pricing`, {
      method: 'POST',
      body: JSON.stringify({ dates, price }),
    });
  }

  async getPropertyStats(propertyId: string, year?: number, month?: number) {
    const params = new URLSearchParams();
    if (year) params.append('year', year.toString());
    if (month) params.append('month', month.toString());
    const queryString = params.toString();
    return this.request(`/calendar/property/${propertyId}/stats${queryString ? `?${queryString}` : ''}`);
  }

  // Notifications
  async getNotifications(params?: {
    type?: string;
    read?: boolean;
    page?: number;
    limit?: number;
  }) {
    const queryParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          queryParams.append(key, value.toString());
        }
      });
    }
    return this.request(`/notifications${queryParams.toString() ? '?' + queryParams.toString() : ''}`);
  }

  async markNotificationAsRead(notificationId: string) {
    return this.request(`/notifications/${notificationId}/read`, {
      method: 'PATCH',
    });
  }

  async markAllNotificationsAsRead() {
    return this.request('/notifications/read-all', {
      method: 'PATCH',
    });
  }

  async deleteNotification(notificationId: string) {
    return this.request(`/notifications/${notificationId}`, {
      method: 'DELETE',
    });
  }

  async getNotificationStats() {
    return this.request('/notifications/stats');
  }

  async getUnreadCount() {
    return this.request('/notifications?read=false&limit=1');
  }

  // Admin notification methods
  async sendAdminNotification(userId: string, title: string, message: string, type: string = 'ADMIN', data?: any) {
    return this.request('/notifications/admin/send', {
      method: 'POST',
      body: JSON.stringify({ userId, title, message, type, data }),
    });
  }

  async sendBulkNotification(userIds: string[], title: string, message: string, type: string = 'SYSTEM', data?: any) {
    return this.request('/notifications/admin/bulk', {
      method: 'POST',
      body: JSON.stringify({ userIds, title, message, type, data }),
    });
  }

  async getAdminNotifications(params?: {
    type?: string;
    read?: boolean;
    page?: number;
    limit?: number;
    userId?: string;
  }) {
    const queryParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          queryParams.append(key, value.toString());
        }
      });
    }
    return this.request(`/notifications/admin/all${queryParams.toString() ? '?' + queryParams.toString() : ''}`);
  }

  async getAdminNotificationStats() {
    return this.request('/notifications/admin/stats');
  }

  async sendTestNotification(recipientEmail: string, type: string = 'TEST') {
    return this.request('/notifications/admin/test', {
      method: 'POST',
      body: JSON.stringify({ recipientEmail, type }),
    });
  }

  // Generic HTTP methods for admin endpoints
  async get(endpoint: string) {
    return this.request(endpoint);
  }

  async post(endpoint: string, data?: any) {
    return this.request(endpoint, {
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async put(endpoint: string, data?: any) {
    return this.request(endpoint, {
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async delete(endpoint: string, data?: any) {
    return this.request(endpoint, {
      method: 'DELETE',
      body: data ? JSON.stringify(data) : undefined,
    });
  }
}

export const apiService = new ApiService(); 