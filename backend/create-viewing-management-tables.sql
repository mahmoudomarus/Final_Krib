-- Enhanced Viewing Management Database Schema
-- Run this in Supabase SQL Editor

-- 1. Property Views Tracking Table
CREATE TABLE IF NOT EXISTS property_views (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    property_id UUID REFERENCES properties(id) ON DELETE CASCADE,
    viewer_id UUID REFERENCES users(id) ON DELETE SET NULL,
    agent_id UUID REFERENCES users(id) ON DELETE SET NULL,
    view_type VARCHAR(20) DEFAULT 'online' CHECK (view_type IN ('online', 'scheduled_viewing', 'walk_in', 'virtual_tour')),
    view_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    duration_seconds INTEGER DEFAULT 0,
    device_info JSONB DEFAULT '{}',
    referrer_source VARCHAR(255),
    ip_address INET,
    page_views INTEGER DEFAULT 1,
    images_viewed INTEGER DEFAULT 0,
    contact_form_opened BOOLEAN DEFAULT FALSE,
    phone_number_revealed BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Property Viewings (Scheduled Appointments)
CREATE TABLE IF NOT EXISTS property_viewings (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    property_id UUID REFERENCES properties(id) ON DELETE CASCADE,
    agent_id UUID REFERENCES users(id) ON DELETE CASCADE,
    client_id UUID REFERENCES users(id) ON DELETE CASCADE,
    scheduled_date DATE NOT NULL,
    scheduled_time TIME NOT NULL,
    duration_minutes INTEGER DEFAULT 60,
    status VARCHAR(20) DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'confirmed', 'in_progress', 'completed', 'cancelled', 'no_show', 'rescheduled')),
    viewing_type VARCHAR(20) DEFAULT 'physical' CHECK (viewing_type IN ('physical', 'virtual', 'video_call')),
    client_name VARCHAR(255),
    client_phone VARCHAR(20),
    client_email VARCHAR(255),
    notes TEXT,
    special_requirements TEXT,
    reminder_sent BOOLEAN DEFAULT FALSE,
    confirmation_sent BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Viewing Feedback and Follow-ups
CREATE TABLE IF NOT EXISTS viewing_feedback (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    viewing_id UUID REFERENCES property_viewings(id) ON DELETE CASCADE,
    client_rating INTEGER CHECK (client_rating >= 1 AND client_rating <= 5),
    client_feedback TEXT,
    client_interest_level VARCHAR(20) CHECK (client_interest_level IN ('very_high', 'high', 'medium', 'low', 'not_interested')),
    agent_notes TEXT,
    property_condition_notes TEXT,
    follow_up_required BOOLEAN DEFAULT FALSE,
    follow_up_date DATE,
    next_action VARCHAR(100),
    booking_likelihood VARCHAR(20) CHECK (booking_likelihood IN ('very_likely', 'likely', 'maybe', 'unlikely', 'no_chance')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Agent Availability Slots (Enhanced)
CREATE TABLE IF NOT EXISTS agent_availability_slots (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    agent_id UUID REFERENCES users(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    is_available BOOLEAN DEFAULT TRUE,
    is_booked BOOLEAN DEFAULT FALSE,
    booking_id UUID REFERENCES property_viewings(id) ON DELETE SET NULL,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(agent_id, date, start_time)
);

-- 5. Property Analytics Summary (for faster queries)
CREATE TABLE IF NOT EXISTS property_analytics (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    property_id UUID REFERENCES properties(id) ON DELETE CASCADE,
    agent_id UUID REFERENCES users(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    total_views INTEGER DEFAULT 0,
    unique_viewers INTEGER DEFAULT 0,
    avg_view_duration INTEGER DEFAULT 0,
    total_inquiries INTEGER DEFAULT 0,
    scheduled_viewings INTEGER DEFAULT 0,
    completed_viewings INTEGER DEFAULT 0,
    conversion_rate DECIMAL(5,2) DEFAULT 0.00,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(property_id, date)
);

-- 6. Client Interactions Log
CREATE TABLE IF NOT EXISTS client_interactions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    agent_id UUID REFERENCES users(id) ON DELETE CASCADE,
    client_id UUID REFERENCES users(id) ON DELETE CASCADE,
    property_id UUID REFERENCES properties(id) ON DELETE SET NULL,
    interaction_type VARCHAR(30) CHECK (interaction_type IN ('call', 'whatsapp', 'email', 'sms', 'meeting', 'viewing', 'follow_up')),
    interaction_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    duration_minutes INTEGER,
    notes TEXT,
    outcome VARCHAR(50),
    follow_up_required BOOLEAN DEFAULT FALSE,
    follow_up_date DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 7. Booking Calendar Events (for confirmed bookings)
CREATE TABLE IF NOT EXISTS booking_calendar_events (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    booking_id UUID REFERENCES bookings(id) ON DELETE CASCADE,
    property_id UUID REFERENCES properties(id) ON DELETE CASCADE,
    agent_id UUID REFERENCES users(id) ON DELETE SET NULL,
    guest_id UUID REFERENCES users(id) ON DELETE CASCADE,
    event_type VARCHAR(30) DEFAULT 'booking' CHECK (event_type IN ('booking', 'check_in', 'check_out', 'maintenance', 'inspection')),
    event_date DATE NOT NULL,
    event_time TIME,
    title VARCHAR(255),
    description TEXT,
    status VARCHAR(20) DEFAULT 'confirmed' CHECK (status IN ('confirmed', 'pending', 'cancelled', 'completed')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create Indexes for Performance
CREATE INDEX IF NOT EXISTS idx_property_views_property_date ON property_views(property_id, view_date);
CREATE INDEX IF NOT EXISTS idx_property_views_agent ON property_views(agent_id);
CREATE INDEX IF NOT EXISTS idx_property_viewings_agent_date ON property_viewings(agent_id, scheduled_date);
CREATE INDEX IF NOT EXISTS idx_property_viewings_status ON property_viewings(status);
CREATE INDEX IF NOT EXISTS idx_agent_availability_agent_date ON agent_availability_slots(agent_id, date);
CREATE INDEX IF NOT EXISTS idx_property_analytics_property_date ON property_analytics(property_id, date);
CREATE INDEX IF NOT EXISTS idx_client_interactions_agent_date ON client_interactions(agent_id, interaction_date);
CREATE INDEX IF NOT EXISTS idx_booking_calendar_agent_date ON booking_calendar_events(agent_id, event_date);

-- Create Functions for Analytics
CREATE OR REPLACE FUNCTION update_property_analytics()
RETURNS TRIGGER AS $$
BEGIN
    -- Update daily analytics when new view is recorded
    INSERT INTO property_analytics (property_id, agent_id, date, total_views, unique_viewers)
    VALUES (NEW.property_id, NEW.agent_id, DATE(NEW.view_date), 1, 1)
    ON CONFLICT (property_id, date)
    DO UPDATE SET
        total_views = property_analytics.total_views + 1,
        updated_at = NOW();
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create Trigger
DROP TRIGGER IF EXISTS trigger_update_property_analytics ON property_views;
CREATE TRIGGER trigger_update_property_analytics
    AFTER INSERT ON property_views
    FOR EACH ROW
    EXECUTE FUNCTION update_property_analytics();

-- Create Function to Get Agent Calendar Events
CREATE OR REPLACE FUNCTION get_agent_calendar_events(
    agent_uuid UUID,
    start_date DATE,
    end_date DATE
)
RETURNS TABLE (
    id UUID,
    title TEXT,
    event_date DATE,
    event_time TIME,
    event_type TEXT,
    status TEXT,
    property_title TEXT,
    client_name TEXT,
    client_phone TEXT,
    duration_minutes INTEGER,
    notes TEXT
) AS $$
BEGIN
    RETURN QUERY
    -- Scheduled Viewings
    SELECT 
        pv.id,
        CONCAT('Property Viewing - ', p.title) as title,
        pv.scheduled_date as event_date,
        pv.scheduled_time as event_time,
        'viewing'::TEXT as event_type,
        pv.status::TEXT,
        p.title as property_title,
        COALESCE(pv.client_name, CONCAT(u.first_name, ' ', u.last_name)) as client_name,
        pv.client_phone,
        pv.duration_minutes,
        pv.notes
    FROM property_viewings pv
    JOIN properties p ON pv.property_id = p.id
    LEFT JOIN users u ON pv.client_id = u.id
    WHERE pv.agent_id = agent_uuid
    AND pv.scheduled_date BETWEEN start_date AND end_date
    
    UNION ALL
    
    -- Booking Events
    SELECT 
        bce.id,
        CONCAT(bce.event_type, ' - ', p.title) as title,
        bce.event_date,
        bce.event_time,
        bce.event_type::TEXT,
        bce.status::TEXT,
        p.title as property_title,
        CONCAT(u.first_name, ' ', u.last_name) as client_name,
        u.phone as client_phone,
        60 as duration_minutes, -- Default duration
        bce.description as notes
    FROM booking_calendar_events bce
    JOIN properties p ON bce.property_id = p.id
    JOIN users u ON bce.guest_id = u.id
    WHERE bce.agent_id = agent_uuid
    AND bce.event_date BETWEEN start_date AND end_date
    
    ORDER BY event_date, event_time;
END;
$$ LANGUAGE plpgsql;

-- Insert some sample data for testing
INSERT INTO agent_availability_slots (agent_id, date, start_time, end_time, is_available) 
SELECT 
    (SELECT id FROM users WHERE is_agent = true LIMIT 1),
    CURRENT_DATE + interval '1 day' * generate_series(0, 6),
    time '09:00',
    time '17:00',
    true
WHERE EXISTS (SELECT 1 FROM users WHERE is_agent = true);

COMMENT ON TABLE property_views IS 'Tracks all property page views and user interactions';
COMMENT ON TABLE property_viewings IS 'Scheduled property viewing appointments';
COMMENT ON TABLE viewing_feedback IS 'Feedback and follow-up data from completed viewings';
COMMENT ON TABLE agent_availability_slots IS 'Agent availability slots for scheduling';
COMMENT ON TABLE property_analytics IS 'Daily aggregated analytics for properties';
COMMENT ON TABLE client_interactions IS 'Log of all client communications and interactions';
COMMENT ON TABLE booking_calendar_events IS 'Calendar events for confirmed bookings and related activities'; 