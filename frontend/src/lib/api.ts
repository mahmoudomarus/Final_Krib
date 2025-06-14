const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

class ApiService {
  private baseURL: string;
  private token: string | null = null;

  constructor() {
    this.baseURL = API_BASE_URL;
    this.token = localStorage.getItem('auth_token');
  }

  setToken(token: string) {
    this.token = token;
    localStorage.setItem('auth_token', token);
  }

  clearToken() {
    this.token = null;
    localStorage.removeItem('auth_token');
  }

  private async request(endpoint: string, options: RequestInit = {}) {
    const url = `${this.baseURL}${endpoint}`;
    
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string>),
    };

    if (this.token) {
      headers.Authorization = `Bearer ${this.token}`;
    }

    const response = await fetch(url, {
      ...options,
      headers,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Network error' }));
      throw new Error(error.error || `HTTP ${response.status}`);
    }

    return response.json();
  }

  // Payment API methods
  async getPayments(params?: {
    status?: string;
    type?: string;
    method?: string;
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
    
    return this.request(`/payments?${queryParams.toString()}`);
  }

  async getPayment(id: string) {
    return this.request(`/payments/${id}`);
  }

  async createStripePayment(paymentId: string) {
    return this.request(`/payments/${paymentId}/stripe-payment`, {
      method: 'POST',
    });
  }

  async submitCheckPayment(paymentId: string, data: {
    checkNumber: string;
    bankName: string;
    notes?: string;
  }) {
    return this.request(`/payments/${paymentId}/check-payment`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // Notification API methods
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
    
    return this.request(`/notifications?${queryParams.toString()}`);
  }

  async markNotificationRead(id: string) {
    return this.request(`/notifications/${id}/read`, {
      method: 'PATCH',
    });
  }

  async markAllNotificationsRead() {
    return this.request('/notifications/read-all', {
      method: 'PATCH',
    });
  }

  async deleteNotification(id: string) {
    return this.request(`/notifications/${id}`, {
      method: 'DELETE',
    });
  }

  async getNotificationStats() {
    return this.request('/notifications/stats');
  }

  // Analytics API methods (admin only)
  async getDashboardMetrics(params?: {
    startDate?: string;
    endDate?: string;
  }) {
    const queryParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          queryParams.append(key, value);
        }
      });
    }
    
    return this.request(`/analytics/dashboard?${queryParams.toString()}`);
  }

  async getRevenueMetrics(params?: {
    startDate?: string;
    endDate?: string;
  }) {
    const queryParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          queryParams.append(key, value);
        }
      });
    }
    
    return this.request(`/analytics/revenue?${queryParams.toString()}`);
  }

  async getBookingMetrics(params?: {
    startDate?: string;
    endDate?: string;
  }) {
    const queryParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          queryParams.append(key, value);
        }
      });
    }
    
    return this.request(`/analytics/bookings?${queryParams.toString()}`);
  }

  async getUserMetrics(params?: {
    startDate?: string;
    endDate?: string;
  }) {
    const queryParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          queryParams.append(key, value);
        }
      });
    }
    
    return this.request(`/analytics/users?${queryParams.toString()}`);
  }

  async getPropertyMetrics(params?: {
    startDate?: string;
    endDate?: string;
  }) {
    const queryParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          queryParams.append(key, value);
        }
      });
    }
    
    return this.request(`/analytics/properties?${queryParams.toString()}`);
  }

  async getPaymentMetrics(params?: {
    startDate?: string;
    endDate?: string;
  }) {
    const queryParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          queryParams.append(key, value);
        }
      });
    }
    
    return this.request(`/analytics/payments?${queryParams.toString()}`);
  }

  async getRegionalMetrics(params?: {
    startDate?: string;
    endDate?: string;
  }) {
    const queryParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          queryParams.append(key, value);
        }
      });
    }
    
    return this.request(`/analytics/regional?${queryParams.toString()}`);
  }

  async getTopProperties(params?: {
    limit?: number;
    startDate?: string;
    endDate?: string;
  }) {
    const queryParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          queryParams.append(key, value.toString());
        }
      });
    }
    
    return this.request(`/analytics/top-properties?${queryParams.toString()}`);
  }

  async getRevenueChartData(params?: {
    period?: 'daily' | 'weekly' | 'monthly';
    days?: number;
  }) {
    const queryParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          queryParams.append(key, value.toString());
        }
      });
    }
    
    return this.request(`/analytics/revenue-chart?${queryParams.toString()}`);
  }

  async trackEvent(eventType: string, eventData: any) {
    return this.request('/analytics/track', {
      method: 'POST',
      body: JSON.stringify({ eventType, eventData }),
    });
  }

  // Health check
  async healthCheck() {
    return fetch(`${this.baseURL.replace('/api', '')}/health`).then(res => res.json());
  }
}

export const apiService = new ApiService();
export default apiService; 