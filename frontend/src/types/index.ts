// User Types
export interface User {
  id: string
  email: string
  emailVerified?: Date
  phone?: string
  phoneVerified: boolean
  firstName: string
  lastName: string
  avatar?: string
  dateOfBirth?: Date
  nationality: string
  isHost: boolean
  isGuest: boolean
  isVerified: boolean
  kycStatus: KYCStatus
  creditScore?: number
  emiratesId?: string
  passportNumber?: string
  preferredLanguage: Language
  createdAt: Date
  updatedAt: Date
  profile?: UserProfile
  addresses: Address[]
  documents: Document[]
  paymentMethods: PaymentMethod[]
  hostProfile?: HostProfile
}

export interface UserProfile {
  id: string
  userId: string
  bio?: string
  profession?: string
  languages: string[]
  interests: string[]
  verificationBadges: string[]
  rating?: number
  reviewCount: number
  responseRate?: number
  responseTime?: string
  joinedDate: Date
}

export interface HostProfile {
  id: string
  userId: string
  businessName?: string
  businessLicense?: string
  tradeLicense?: string
  vatNumber?: string
  propertyCount: number
  totalEarnings: number
  averageRating?: number
  totalReviews: number
  superHostStatus: boolean
  autoAcceptBookings: boolean
  instantBookEnabled: boolean
}

export interface Address {
  id: string
  userId: string
  type: AddressType
  country: string
  emirate: string
  city: string
  area: string
  street: string
  buildingNumber: string
  flatNumber?: string
  landmark?: string
  coordinates?: Coordinates
  isDefault: boolean
}

export interface Document {
  id: string
  userId: string
  type: DocumentType
  fileUrl: string
  fileName: string
  status: DocumentStatus
  verifiedAt?: Date
  rejectionReason?: string
  expiryDate?: Date
}

// Property Types
export interface Property {
  id: string
  hostId: string
  host: User
  title: string
  description: string
  slug: string
  type: PropertyType
  rentalType: RentalType
  category: PropertyCategory
  status: PropertyStatus
  
  // Location
  emirate: string
  city: string
  area: string
  address: string
  coordinates: Coordinates
  
  // Basic Info
  bedrooms: number
  bathrooms: number
  maxGuests: number
  areaSize: number // in sq ft
  floor?: number
  totalFloors?: number
  
  // Amenities & Features
  amenities: string[]
  houseRules: string[]
  safetyFeatures: string[]
  accessibility: string[]
  
  // Media
  images: PropertyImage[]
  virtualTourUrl?: string
  
  // Pricing
  pricing: Pricing
  
  // Availability
  availability: Availability[]
  instantBook: boolean
  minStay: number
  maxStay?: number
  checkInTime: string
  checkOutTime: string
  
  // Stats
  rating?: number
  reviewCount: number
  viewCount: number
  favoriteCount: number
  bookingCount: number
  
  // Dates
  createdAt: Date
  updatedAt: Date
  publishedAt?: Date
  
  // Relations
  bookings: Booking[]
  reviews: Review[]
}

export interface PropertyImage {
  id: string
  propertyId: string
  url: string
  caption?: string
  isMain: boolean
  order: number
}

export interface Pricing {
  id: string
  propertyId: string
  basePrice: number
  priceUnit: PriceUnit
  weekendSurcharge?: number
  monthlyDiscount?: number
  securityDeposit?: number
  cleaningFee?: number
  minimumStay?: number
}

export interface Availability {
  id: string
  propertyId: string
  date: Date
  isAvailable: boolean
  price?: number
  minStay?: number
}

// Booking Types
export interface Booking {
  id: string
  guestId: string
  guest: User
  hostId: string
  host: User
  propertyId: string
  property: Property
  rentalType: RentalType
  checkIn: Date
  checkOut: Date
  guests: number
  totalPrice: number
  fees?: BookingFees
  status: BookingStatus
  createdAt: Date
  updatedAt: Date
  payment?: Payment
  review?: Review
  conversation?: Conversation
}

export interface BookingFees {
  basePrice: number
  cleaningFee?: number
  serviceFee: number
  taxes: number
  securityDeposit?: number
  total: number
}

// Payment Types
export interface Payment {
  id: string
  bookingId: string
  amount: number
  currency: string
  status: PaymentStatus
  gateway: string
  gatewayTransactionId?: string
  createdAt: Date
  updatedAt: Date
}

export interface PaymentMethod {
  id: string
  userId: string
  type: string
  brand?: string
  last4?: string
  expMonth?: number
  expYear?: number
  isDefault: boolean
  gatewayToken: string
}

// Communication Types
export interface Conversation {
  id: string
  bookingId?: string
  participants: ConversationParticipant[]
  messages: Message[]
  createdAt: Date
  updatedAt: Date
}

export interface ConversationParticipant {
  id: string
  conversationId: string
  userId: string
  user: User
  lastReadTimestamp?: Date
}

export interface Message {
  id: string
  conversationId: string
  senderId: string
  sender: User
  receiverId: string
  receiver: User
  content: string
  timestamp: Date
  isRead: boolean
}

// Review Types
export interface Review {
  id: string
  bookingId: string
  guestId: string
  guest: User
  hostId: string
  host: User
  propertyId: string
  property: Property
  
  ratingOverall: number
  ratingCleanliness?: number
  ratingAccuracy?: number
  ratingCommunication?: number
  ratingLocation?: number
  ratingCheckIn?: number
  ratingValue?: number
  
  publicComment: string
  privateComment?: string
  hostResponse?: string
  
  createdAt: Date
}

// Search & Filter Types
export interface SearchFilters {
  location?: string
  emirate?: string
  checkIn?: Date
  checkOut?: Date
  guests?: number
  rentalType?: RentalType
  propertyType?: PropertyType[]
  priceRange?: [number, number]
  bedrooms?: number
  bathrooms?: number
  amenities?: string[]
  instantBook?: boolean
  rating?: number
  coordinates?: Coordinates
  radius?: number
}

export interface SearchResult {
  properties: Property[]
  totalCount: number
  filters: SearchFilters
  pagination: {
    page: number
    limit: number
    totalPages: number
  }
}

// Geographic Types
export interface Coordinates {
  latitude: number
  longitude: number
}

export interface Location {
  country: string
  emirate: string
  city: string
  area: string
  coordinates: Coordinates
}

// Notification Types
export interface Notification {
  id: string
  userId: string
  type: NotificationType
  title: string
  message: string
  data?: Record<string, any>
  isRead: boolean
  createdAt: Date
}

// API Response Types
export interface ApiResponse<T> {
  success: boolean
  data?: T
  error?: string
  message?: string
  statusCode: number
}

export interface PaginationInfo {
  page: number
  limit: number
  totalPages: number
  totalCount: number
  hasNext: boolean
  hasPrev: boolean
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination: PaginationInfo
}

// Enums
export enum Language {
  ENGLISH = 'en',
  ARABIC = 'ar'
}

export enum KYCStatus {
  PENDING = 'PENDING',
  IN_REVIEW = 'IN_REVIEW',
  VERIFIED = 'VERIFIED',
  REJECTED = 'REJECTED'
}

export enum AddressType {
  HOME = 'HOME',
  WORK = 'WORK',
  OTHER = 'OTHER'
}

export enum DocumentType {
  EMIRATES_ID = 'EMIRATES_ID',
  PASSPORT = 'PASSPORT',
  VISA = 'VISA',
  DRIVING_LICENSE = 'DRIVING_LICENSE',
  UTILITY_BILL = 'UTILITY_BILL',
  BANK_STATEMENT = 'BANK_STATEMENT',
  SALARY_CERTIFICATE = 'SALARY_CERTIFICATE',
  TRADE_LICENSE = 'TRADE_LICENSE',
  BUSINESS_LICENSE = 'BUSINESS_LICENSE'
}

export enum DocumentStatus {
  PENDING = 'PENDING',
  VERIFIED = 'VERIFIED',
  REJECTED = 'REJECTED'
}

export enum PropertyType {
  APARTMENT = 'APARTMENT',
  VILLA = 'VILLA',
  TOWNHOUSE = 'TOWNHOUSE',
  PENTHOUSE = 'PENTHOUSE',
  STUDIO = 'STUDIO',
  ROOM = 'ROOM',
  OFFICE = 'OFFICE',
  RETAIL = 'RETAIL',
  WAREHOUSE = 'WAREHOUSE'
}

export enum PropertyCategory {
  RESIDENTIAL = 'RESIDENTIAL',
  COMMERCIAL = 'COMMERCIAL'
}

export enum PropertyStatus {
  DRAFT = 'DRAFT',
  PENDING_REVIEW = 'PENDING_REVIEW',
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  SUSPENDED = 'SUSPENDED'
}

export enum RentalType {
  SHORT_TERM = 'SHORT_TERM',
  LONG_TERM = 'LONG_TERM'
}

export enum PriceUnit {
  NIGHT = 'NIGHT',
  MONTH = 'MONTH'
}

export enum BookingStatus {
  PENDING = 'PENDING',
  CONFIRMED = 'CONFIRMED',
  CANCELLED_GUEST = 'CANCELLED_GUEST',
  CANCELLED_HOST = 'CANCELLED_HOST',
  COMPLETED = 'COMPLETED',
  REJECTED = 'REJECTED'
}

export enum PaymentStatus {
  PENDING = 'PENDING',
  SUCCEEDED = 'SUCCEEDED',
  FAILED = 'FAILED',
  REFUNDED = 'REFUNDED'
}

export enum NotificationType {
  BOOKING_REQUEST = 'BOOKING_REQUEST',
  BOOKING_CONFIRMED = 'BOOKING_CONFIRMED',
  BOOKING_CANCELLED = 'BOOKING_CANCELLED',
  BOOKING_APPROVED = 'BOOKING_APPROVED',
  BOOKING_DECLINED = 'BOOKING_DECLINED',
  CHECK_IN_REMINDER = 'CHECK_IN_REMINDER',
  CHECK_OUT_REMINDER = 'CHECK_OUT_REMINDER',
  
  PAYMENT_RECEIVED = 'PAYMENT_RECEIVED',
  PAYMENT_SUCCESS = 'PAYMENT_SUCCESS',
  PAYMENT_FAILED = 'PAYMENT_FAILED',
  
  REVIEW_RECEIVED = 'REVIEW_RECEIVED',
  REVIEW_RESPONSE = 'REVIEW_RESPONSE',
  
  MESSAGE_RECEIVED = 'MESSAGE_RECEIVED',
  
  PROPERTY_APPROVED = 'PROPERTY_APPROVED',
  PROPERTY_REJECTED = 'PROPERTY_REJECTED',
  PROPERTY_SUBMITTED = 'PROPERTY_SUBMITTED',
  
  KYC_VERIFIED = 'KYC_VERIFIED',
  KYC_REJECTED = 'KYC_REJECTED',
  
  ADMIN_ALERT = 'ADMIN_ALERT',
  SYSTEM_ALERT = 'SYSTEM_ALERT',
  HOST_REMINDER = 'HOST_REMINDER',
  
  PROMOTION_OFFER = 'PROMOTION_OFFER',
  WELCOME_BONUS = 'WELCOME_BONUS',
  
  NEW_USER_REGISTRATION = 'NEW_USER_REGISTRATION',
  PAYMENT_DISPUTE = 'PAYMENT_DISPUTE'
}

export enum DurationType {
  DAILY = 'DAILY',
  WEEKLY = 'WEEKLY',
  MONTHLY = 'MONTHLY',
  YEARLY = 'YEARLY'
}

// Enhanced search parameters for advanced search functionality
export interface EnhancedSearchParams {
  location: string
  checkIn?: Date
  checkOut?: Date
  guests: {
    adults: number
    children: number
    pets: number
  }
  rentalType: RentalType
  duration: DurationType
  propertyTypes: PropertyType[]
  priceRange?: [number, number]
  amenities?: string[]
}

// Form Types
export interface LoginForm {
  email: string
  password: string
  rememberMe?: boolean
}

export interface RegisterForm {
  email: string
  password: string
  confirmPassword: string
  firstName: string
  lastName: string
  phone: string
  nationality: string
  acceptTerms: boolean
}

export interface PropertyForm {
  title: string
  description: string
  type: PropertyType
  category: PropertyCategory
  rentalType: RentalType
  emirate: string
  city: string
  area: string
  address: string
  bedrooms: number
  bathrooms: number
  maxGuests: number
  areaSize: number
  floor?: number
  totalFloors?: number
  amenities: string[]
  houseRules: string[]
  safetyFeatures: string[]
  basePrice: number
  priceUnit: PriceUnit
  securityDeposit?: number
  cleaningFee?: number
  minimumStay: number
  checkInTime: string
  checkOutTime: string
  instantBook: boolean
  images: File[]
}

export interface BookingForm {
  propertyId: string
  checkIn: Date
  checkOut: Date
  guests: number
  message?: string
}

// Store Types (Zustand)
export interface AuthState {
  user: User | null
  isLoading: boolean
  isAuthenticated: boolean
  login: (credentials: LoginForm) => Promise<void>
  register: (data: RegisterForm) => Promise<void>
  logout: () => void
  updateProfile: (data: Partial<User>) => Promise<void>
}

export interface PropertyState {
  properties: Property[]
  currentProperty: Property | null
  searchResults: SearchResult | null
  filters: SearchFilters
  isLoading: boolean
  fetchProperties: () => Promise<void>
  fetchProperty: (id: string) => Promise<void>
  searchProperties: (filters: SearchFilters) => Promise<void>
  createProperty: (data: PropertyForm) => Promise<void>
  updateProperty: (id: string, data: Partial<PropertyForm>) => Promise<void>
  deleteProperty: (id: string) => Promise<void>
}

export interface BookingState {
  bookings: Booking[]
  currentBooking: Booking | null
  isLoading: boolean
  fetchBookings: () => Promise<void>
  fetchBooking: (id: string) => Promise<void>
  createBooking: (data: BookingForm) => Promise<void>
  updateBooking: (id: string, data: Partial<Booking>) => Promise<void>
  cancelBooking: (id: string, reason: string) => Promise<void>
}

export interface UIState {
  sidebarOpen: boolean
  theme: 'light' | 'dark'
  language: Language
  notifications: Notification[]
  setSidebarOpen: (open: boolean) => void
  setTheme: (theme: 'light' | 'dark') => void
  setLanguage: (language: Language) => void
  addNotification: (notification: Omit<Notification, 'id' | 'createdAt'>) => void
  markNotificationAsRead: (id: string) => void
} 