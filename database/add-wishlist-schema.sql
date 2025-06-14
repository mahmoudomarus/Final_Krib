-- Create user_wishlists table for storing guest property wishlists
CREATE TABLE IF NOT EXISTS user_wishlists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  property_id UUID NOT NULL, -- Will reference properties table when it exists
  property_title VARCHAR(255),
  property_image VARCHAR(500),
  property_price DECIMAL(10,2),
  property_location VARCHAR(255),
  property_type VARCHAR(100),
  added_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  notes TEXT, -- User can add personal notes about the property
  
  -- Ensure user can't wishlist same property twice
  UNIQUE(user_id, property_id)
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_user_wishlists_user_id ON user_wishlists(user_id);
CREATE INDEX IF NOT EXISTS idx_user_wishlists_added_at ON user_wishlists(added_at DESC);

-- Add RLS (Row Level Security)
ALTER TABLE user_wishlists ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only see their own wishlist
CREATE POLICY "Users can view own wishlist" ON user_wishlists
  FOR SELECT USING (auth.uid() = user_id);

-- Policy: Users can only add to their own wishlist
CREATE POLICY "Users can add to own wishlist" ON user_wishlists
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Policy: Users can only update their own wishlist
CREATE POLICY "Users can update own wishlist" ON user_wishlists
  FOR UPDATE USING (auth.uid() = user_id);

-- Policy: Users can only delete from their own wishlist
CREATE POLICY "Users can delete from own wishlist" ON user_wishlists
  FOR DELETE USING (auth.uid() = user_id);

-- Add recently_viewed_properties table for tracking viewed properties
CREATE TABLE IF NOT EXISTS recently_viewed_properties (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  property_id UUID NOT NULL,
  property_title VARCHAR(255),
  property_image VARCHAR(500),
  property_price DECIMAL(10,2),
  property_location VARCHAR(255),
  property_type VARCHAR(100),
  viewed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  view_count INTEGER DEFAULT 1,
  
  -- Ensure user can't have duplicate entries for same property
  UNIQUE(user_id, property_id)
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_recently_viewed_user_id ON recently_viewed_properties(user_id);
CREATE INDEX IF NOT EXISTS idx_recently_viewed_viewed_at ON recently_viewed_properties(viewed_at DESC);

-- Add RLS for recently viewed
ALTER TABLE recently_viewed_properties ENABLE ROW LEVEL SECURITY;

-- Policies for recently viewed
CREATE POLICY "Users can view own recently viewed" ON recently_viewed_properties
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can add to own recently viewed" ON recently_viewed_properties
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own recently viewed" ON recently_viewed_properties
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own recently viewed" ON recently_viewed_properties
  FOR DELETE USING (auth.uid() = user_id);

-- Add comments for documentation
COMMENT ON TABLE user_wishlists IS 'Stores user wishlist of favorite properties';
COMMENT ON TABLE recently_viewed_properties IS 'Tracks properties viewed by users for showing viewing history';
COMMENT ON COLUMN user_wishlists.notes IS 'Personal notes user can add about wishlisted property';
COMMENT ON COLUMN recently_viewed_properties.view_count IS 'Number of times user viewed this property'; 