-- UAE Rental Platform - Supabase Migration Script
-- This script creates all tables and relationships for the platform

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create Users table
CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  phone VARCHAR(20) UNIQUE,
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  avatar TEXT,
  date_of_birth TIMESTAMP,
  gender VARCHAR(20),
  nationality VARCHAR(10),
  occupation VARCHAR(100),
  languages TEXT, -- Comma-separated values
  is_host BOOLEAN DEFAULT false,
  is_agent BOOLEAN DEFAULT false,
  is_verified BOOLEAN DEFAULT false,
  verification_level VARCHAR(20) DEFAULT 'UNVERIFIED',
  
  -- Authentication tokens
  verification_token VARCHAR(255),
  reset_token VARCHAR(255),
  reset_token_expiry TIMESTAMP,
  verified_at TIMESTAMP,
  password_changed_at TIMESTAMP,
  accepted_terms_at TIMESTAMP,
  
  -- KYC Information
  emirates_id VARCHAR(50),
  passport_number VARCHAR(50),
  visa_status VARCHAR(50),
  kyc_documents TEXT, -- JSON as string
  kyc_status VARCHAR(20) DEFAULT 'NOT_STARTED',
  kyc_verified_at TIMESTAMP,
  kyc_verified_by VARCHAR(255),
  
  -- Address
  address TEXT,
  city VARCHAR(100),
  emirate VARCHAR(50),
  country VARCHAR(10) DEFAULT 'UAE',
  postal_code VARCHAR(20),
  
  -- Preferences
  currency VARCHAR(5) DEFAULT 'AED',
  language VARCHAR(5) DEFAULT 'en',
  timezone VARCHAR(50) DEFAULT 'Asia/Dubai',
  
  -- Status
  is_active BOOLEAN DEFAULT true,
  is_suspended BOOLEAN DEFAULT false,
  suspension_reason TEXT,
  
  -- Banking Info (for hosts)
  bank_name VARCHAR(100),
  bank_account_number VARCHAR(50),
  iban VARCHAR(50),
  
  -- Timestamps
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  last_login_at TIMESTAMP
);

-- Create Properties table
CREATE TABLE IF NOT EXISTS public.properties (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  type VARCHAR(50) NOT NULL, -- APARTMENT, VILLA, TOWNHOUSE, STUDIO
  category VARCHAR(50) NOT NULL, -- ENTIRE_PLACE, PRIVATE_ROOM, SHARED_ROOM
  rental_type VARCHAR(20) DEFAULT 'SHORT_TERM', -- SHORT_TERM, LONG_TERM
  
  -- Location
  address TEXT NOT NULL,
  city VARCHAR(100) NOT NULL,
  emirate VARCHAR(50) NOT NULL,
  country VARCHAR(10) DEFAULT 'UAE',
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  postal_code VARCHAR(20),
  
  -- Property Details
  bedrooms INTEGER NOT NULL,
  bathrooms INTEGER NOT NULL,
  guests INTEGER DEFAULT 1,
  area DECIMAL(10, 2), -- in square meters
  floor INTEGER,
  total_floors INTEGER,
  
  -- Pricing
  base_price DECIMAL(10, 2) NOT NULL,
  cleaning_fee DECIMAL(10, 2) DEFAULT 0,
  security_deposit DECIMAL(10, 2) DEFAULT 0,
  currency VARCHAR(5) DEFAULT 'AED',
  
  -- Long-term rental specific
  yearly_price DECIMAL(12, 2),
  monthly_price DECIMAL(10, 2),
  utilities_included BOOLEAN DEFAULT false,
  maintenance_included BOOLEAN DEFAULT false,
  contract_min_duration INTEGER, -- months
  contract_max_duration INTEGER, -- months
  uae_permit_number VARCHAR(100),
  
  -- Amenities & Features
  amenities TEXT, -- Comma-separated values
  house_rules TEXT, -- Comma-separated values
  smoking_allowed BOOLEAN DEFAULT false,
  pets_allowed BOOLEAN DEFAULT false,
  parties_allowed BOOLEAN DEFAULT false,
  
  -- Media
  images TEXT, -- Comma-separated URLs
  videos TEXT, -- Comma-separated URLs
  virtual_tour_url TEXT,
  
  -- Availability
  is_active BOOLEAN DEFAULT true,
  is_instant_book BOOLEAN DEFAULT false,
  min_stay INTEGER DEFAULT 1,
  max_stay INTEGER DEFAULT 365,
  
  -- Calendar & Booking
  check_in_time VARCHAR(10) DEFAULT '15:00',
  check_out_time VARCHAR(10) DEFAULT '11:00',
  advance_notice INTEGER DEFAULT 1, -- days
  
  -- Status
  verification_status VARCHAR(20) DEFAULT 'PENDING', -- PENDING, VERIFIED, REJECTED
  license_number VARCHAR(100),
  dtcm_permit VARCHAR(100),
  
  -- Relations
  host_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  
  -- Timestamps
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Create Bookings table
CREATE TABLE IF NOT EXISTS public.bookings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  check_in TIMESTAMP NOT NULL,
  check_out TIMESTAMP NOT NULL,
  guests INTEGER NOT NULL,
  
  -- Pricing
  base_amount DECIMAL(10, 2) NOT NULL,
  cleaning_fee DECIMAL(10, 2) DEFAULT 0,
  security_deposit DECIMAL(10, 2) DEFAULT 0,
  service_fee DECIMAL(10, 2) DEFAULT 0,
  taxes DECIMAL(10, 2) DEFAULT 0,
  total_amount DECIMAL(10, 2) NOT NULL,
  currency VARCHAR(5) DEFAULT 'AED',
  
  -- Status
  status VARCHAR(20) DEFAULT 'PENDING', -- PENDING, CONFIRMED, CANCELLED, COMPLETED
  cancellation_reason TEXT,
  cancelled_by VARCHAR(20),
  cancelled_at TIMESTAMP,
  
  -- Payment
  payment_status VARCHAR(20) DEFAULT 'PENDING', -- PENDING, PAID, PARTIALLY_PAID, REFUNDED, FAILED
  paid_amount DECIMAL(10, 2) DEFAULT 0,
  
  -- Special Requests
  special_requests TEXT,
  guest_notes TEXT,
  host_notes TEXT,
  
  -- Check-in/out
  check_in_code VARCHAR(20),
  check_in_time TIMESTAMP,
  check_out_time TIMESTAMP,
  
  -- Relations
  guest_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  property_id UUID NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
  
  -- Timestamps
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Create Payments table
CREATE TABLE IF NOT EXISTS public.payments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  amount DECIMAL(10, 2) NOT NULL,
  currency VARCHAR(5) DEFAULT 'AED',
  status VARCHAR(20) NOT NULL, -- PENDING, COMPLETED, FAILED, REFUNDED
  type VARCHAR(30) NOT NULL, -- BOOKING_PAYMENT, SECURITY_DEPOSIT, CLEANING_FEE, etc.
  method VARCHAR(20), -- STRIPE, PAYPAL, BANK_TRANSFER, CASH, CHECK
  description TEXT,
  
  -- Payment processor details
  stripe_payment_id VARCHAR(255),
  paypal_payment_id VARCHAR(255),
  
  -- Timing
  due_date TIMESTAMP,
  paid_at TIMESTAMP,
  
  -- Administrative
  admin_notes TEXT,
  
  -- Relations
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  property_id UUID REFERENCES public.properties(id) ON DELETE SET NULL,
  booking_id UUID REFERENCES public.bookings(id) ON DELETE SET NULL,
  
  -- Timestamps
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Create Reviews table
CREATE TABLE IF NOT EXISTS public.reviews (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- Ratings (1-5 scale)
  overall_rating DECIMAL(2, 1) NOT NULL,
  cleanliness_rating DECIMAL(2, 1),
  accuracy_rating DECIMAL(2, 1),
  check_in_rating DECIMAL(2, 1),
  communication_rating DECIMAL(2, 1),
  location_rating DECIMAL(2, 1),
  value_rating DECIMAL(2, 1),
  
  -- Review content
  title VARCHAR(255),
  comment TEXT,
  photos TEXT, -- Comma-separated URLs
  
  -- Status
  is_public BOOLEAN DEFAULT true,
  is_verified BOOLEAN DEFAULT false,
  
  -- Host response
  host_response TEXT,
  host_response_at TIMESTAMP,
  
  -- Relations
  guest_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  host_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  property_id UUID NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
  booking_id UUID NOT NULL REFERENCES public.bookings(id) ON DELETE CASCADE,
  
  -- Timestamps
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Create Conversations table
CREATE TABLE IF NOT EXISTS public.conversations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- Relations
  guest_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  host_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  property_id UUID REFERENCES public.properties(id) ON DELETE SET NULL,
  booking_id UUID REFERENCES public.bookings(id) ON DELETE SET NULL,
  
  -- Status
  is_active BOOLEAN DEFAULT true,
  last_message_at TIMESTAMP,
  
  -- Timestamps
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Create Messages table
CREATE TABLE IF NOT EXISTS public.messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  content TEXT NOT NULL,
  message_type VARCHAR(20) DEFAULT 'TEXT', -- TEXT, IMAGE, FILE, SYSTEM
  
  -- Media
  attachment_url TEXT,
  attachment_type VARCHAR(20),
  
  -- Status
  is_read BOOLEAN DEFAULT false,
  read_at TIMESTAMP,
  is_system_message BOOLEAN DEFAULT false,
  
  -- Relations
  conversation_id UUID NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  
  -- Timestamps
  created_at TIMESTAMP DEFAULT NOW()
);

-- Create Notifications table
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  type VARCHAR(30) NOT NULL, -- BOOKING, PAYMENT, REVIEW, SYSTEM, etc.
  
  -- Status
  is_read BOOLEAN DEFAULT false,
  read_at TIMESTAMP,
  
  -- Action
  action_url TEXT,
  action_label VARCHAR(100),
  
  -- Relations
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  
  -- Timestamps
  created_at TIMESTAMP DEFAULT NOW()
);

-- Create UnavailableDates table
CREATE TABLE IF NOT EXISTS public.unavailable_dates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  reason VARCHAR(100),
  
  -- Relations
  property_id UUID NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
  
  -- Timestamps
  created_at TIMESTAMP DEFAULT NOW()
);

-- Create AnalyticsEvents table
CREATE TABLE IF NOT EXISTS public.analytics_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_type VARCHAR(50) NOT NULL,
  event_data JSONB,
  
  -- Location
  city VARCHAR(100),
  country VARCHAR(10),
  ip_address INET,
  
  -- Device
  user_agent TEXT,
  device_type VARCHAR(20),
  
  -- Relations
  user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  property_id UUID REFERENCES public.properties(id) ON DELETE SET NULL,
  
  -- Timestamps
  created_at TIMESTAMP DEFAULT NOW()
);

-- Create SystemLogs table
CREATE TABLE IF NOT EXISTS public.system_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  level VARCHAR(10) NOT NULL, -- INFO, WARN, ERROR, DEBUG
  message TEXT NOT NULL,
  context JSONB,
  
  -- Relations
  user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  
  -- Timestamps
  created_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_users_email ON public.users(email);
CREATE INDEX IF NOT EXISTS idx_users_phone ON public.users(phone);
CREATE INDEX IF NOT EXISTS idx_properties_host_id ON public.properties(host_id);
CREATE INDEX IF NOT EXISTS idx_properties_location ON public.properties(emirate, city);
CREATE INDEX IF NOT EXISTS idx_properties_type ON public.properties(type, category);
CREATE INDEX IF NOT EXISTS idx_bookings_guest_id ON public.bookings(guest_id);
CREATE INDEX IF NOT EXISTS idx_bookings_property_id ON public.bookings(property_id);
CREATE INDEX IF NOT EXISTS idx_bookings_dates ON public.bookings(check_in, check_out);
CREATE INDEX IF NOT EXISTS idx_payments_user_id ON public.payments(user_id);
CREATE INDEX IF NOT EXISTS idx_reviews_property_id ON public.reviews(property_id);
CREATE INDEX IF NOT EXISTS idx_messages_conversation_id ON public.messages(conversation_id);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Add updated_at triggers
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON public.users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_properties_updated_at BEFORE UPDATE ON public.properties FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_bookings_updated_at BEFORE UPDATE ON public.bookings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_payments_updated_at BEFORE UPDATE ON public.payments FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_reviews_updated_at BEFORE UPDATE ON public.reviews FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_conversations_updated_at BEFORE UPDATE ON public.conversations FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security (RLS)
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.properties ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Basic RLS policies (can be expanded later)
-- Users can read their own data
CREATE POLICY "Users can read own data" ON public.users FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own data" ON public.users FOR UPDATE USING (auth.uid() = id);

-- Properties are readable by everyone, editable by owners
CREATE POLICY "Properties are publicly readable" ON public.properties FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can manage own properties" ON public.properties FOR ALL USING (auth.uid() = host_id);

-- Bookings are visible to guests and hosts
CREATE POLICY "Users can see own bookings" ON public.bookings FOR SELECT USING (
  auth.uid() = guest_id OR 
  auth.uid() = (SELECT host_id FROM public.properties WHERE id = property_id)
);

-- Reviews are publicly readable
CREATE POLICY "Reviews are publicly readable" ON public.reviews FOR SELECT TO authenticated USING (is_public = true);

-- Notifications are private
CREATE POLICY "Users can see own notifications" ON public.notifications FOR SELECT USING (auth.uid() = user_id);

-- Complete the migration
INSERT INTO public.system_logs (level, message, context) 
VALUES ('INFO', 'Database schema migrated to Supabase', '{"migration_date": "' || NOW() || '", "version": "1.0.0"}'); 