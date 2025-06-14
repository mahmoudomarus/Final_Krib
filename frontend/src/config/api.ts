export const API_CONFIG = {
  BASE_URL: process.env.REACT_APP_API_URL || (process.env.NODE_ENV === 'production' 
    ? 'https://api.uae-rental.com/api' 
    : 'http://localhost:5001/api'),
  ENDPOINTS: {
    // Auth
    LOGIN: '/auth/login',
    REGISTER: '/auth/register',
    LOGOUT: '/auth/logout',
    REFRESH: '/auth/refresh',
    
    // Properties
    PROPERTIES: '/properties',
    PROPERTY_DETAIL: '/properties',
    PROPERTY_SEARCH: '/properties/search',
    NEARBY_PROPERTIES: '/properties/nearby',
    
    // Bookings
    BOOKINGS: '/bookings',
    CREATE_BOOKING: '/bookings',
    
    // Users
    PROFILE: '/users/profile',
    UPDATE_PROFILE: '/users/profile',
    
    // Reviews
    REVIEWS: '/reviews',
    CREATE_REVIEW: '/reviews',
    
    // Payments
    PAYMENTS: '/payments',
    CREATE_PAYMENT: '/payments',
    
    // Host
    HOST_PROPERTIES: '/host/properties',
    HOST_BOOKINGS: '/host/bookings',
    HOST_ANALYTICS: '/host/analytics',
  },
  TIMEOUT: 10000,
  HEADERS: {
    'Content-Type': 'application/json',
  },
}; 