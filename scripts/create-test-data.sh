#!/bin/bash

API_BASE="http://localhost:5001"
AGENT_EMAIL="agent.mahmoud@krib.ae"
AGENT_PASSWORD="password123"

echo "🚀 Starting test data creation..."

# Function to login and get token
login_agent() {
    echo "🔐 Logging in as agent..."
    
    TOKEN=$(curl -s -X POST "${API_BASE}/api/auth/login" \
        -H "Content-Type: application/json" \
        -d "{\"email\":\"${AGENT_EMAIL}\",\"password\":\"${AGENT_PASSWORD}\"}" | \
        grep -o '"token":"[^"]*"' | cut -d'"' -f4)
    
    if [ -z "$TOKEN" ]; then
        echo "❌ Failed to login. Trying to register agent account..."
        
        # Try to register the agent
        curl -s -X POST "${API_BASE}/api/auth/register" \
            -H "Content-Type: application/json" \
            -d "{
                \"email\":\"${AGENT_EMAIL}\",
                \"password\":\"${AGENT_PASSWORD}\",
                \"firstName\":\"Mahmoud\",
                \"lastName\":\"Al-Rashid\",
                \"phone\":\"+971501234567\",
                \"isAgent\":true
            }" > /dev/null
        
        echo "📝 Agent account created. Logging in again..."
        
        TOKEN=$(curl -s -X POST "${API_BASE}/api/auth/login" \
            -H "Content-Type: application/json" \
            -d "{\"email\":\"${AGENT_EMAIL}\",\"password\":\"${AGENT_PASSWORD}\"}" | \
            grep -o '"token":"[^"]*"' | cut -d'"' -f4)
    fi
    
    if [ -z "$TOKEN" ]; then
        echo "❌ Still failed to login. Please check server and try manually."
        exit 1
    fi
    
    echo "✅ Successfully logged in as agent"
    echo "$TOKEN"
}

# Get authentication token
TOKEN=$(login_agent)

echo "🏠 Creating test properties..."

# Property 1: Luxury 2BR Apartment
curl -s -X POST "${API_BASE}/api/agent/listings/add" \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer ${TOKEN}" \
    -d '{
        "title": "Luxury 2BR Apartment in Downtown Dubai",
        "description": "Stunning 2-bedroom apartment with panoramic views of Burj Khalifa and Dubai Fountain. Features modern amenities, premium finishes, and access to world-class facilities.",
        "city": "Dubai",
        "emirate": "Dubai",
        "address": "Downtown Dubai, Burj Khalifa District",
        "basePrice": 8500,
        "bedrooms": 2,
        "bathrooms": 2,
        "area": 1200,
        "type": "apartment",
        "amenities": ["Swimming Pool", "Gym", "Parking", "Security", "Balcony", "City View"],
        "images": [
            "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=800",
            "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800"
        ]
    }' > /dev/null && echo "✅ Created: Luxury 2BR Apartment"

# Property 2: Modern 1BR Marina
curl -s -X POST "${API_BASE}/api/agent/listings/add" \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer ${TOKEN}" \
    -d '{
        "title": "Modern 1BR in Dubai Marina",
        "description": "Contemporary 1-bedroom apartment in the heart of Dubai Marina with marina views.",
        "city": "Dubai",
        "emirate": "Dubai",
        "address": "Dubai Marina, Marina Walk",
        "basePrice": 6500,
        "bedrooms": 1,
        "bathrooms": 1,
        "area": 850,
        "type": "apartment",
        "amenities": ["Swimming Pool", "Gym", "Parking", "Marina View"],
        "images": ["https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800"]
    }' > /dev/null && echo "✅ Created: Modern 1BR Marina"

# Property 3: Villa in Jumeirah
curl -s -X POST "${API_BASE}/api/agent/listings/add" \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer ${TOKEN}" \
    -d '{
        "title": "Spacious 3BR Villa in Jumeirah",
        "description": "Beautiful 3-bedroom villa with private garden and pool. Perfect for families.",
        "city": "Dubai",
        "emirate": "Dubai",
        "address": "Jumeirah 1, Beach Road",
        "basePrice": 15000,
        "bedrooms": 3,
        "bathrooms": 3,
        "area": 2500,
        "type": "villa",
        "amenities": ["Private Pool", "Garden", "Parking", "Beach Access"],
        "images": ["https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=800"]
    }' > /dev/null && echo "✅ Created: Jumeirah Villa"

# Property 4: Business Bay Studio
curl -s -X POST "${API_BASE}/api/agent/listings/add" \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer ${TOKEN}" \
    -d '{
        "title": "Studio Apartment in Business Bay",
        "description": "Compact and efficient studio apartment perfect for professionals.",
        "city": "Dubai",
        "emirate": "Dubai",
        "address": "Business Bay, Executive Towers",
        "basePrice": 4500,
        "bedrooms": 0,
        "bathrooms": 1,
        "area": 500,
        "type": "studio",
        "amenities": ["Gym", "Parking", "Security", "Metro Access"],
        "images": ["https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=800"]
    }' > /dev/null && echo "✅ Created: Business Bay Studio"

# Property 5: Palm Jumeirah Penthouse
curl -s -X POST "${API_BASE}/api/agent/listings/add" \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer ${TOKEN}" \
    -d '{
        "title": "2BR Penthouse in Palm Jumeirah",
        "description": "Exclusive penthouse with private terrace and stunning sea views.",
        "city": "Dubai",
        "emirate": "Dubai",
        "address": "Palm Jumeirah, Atlantis Residences",
        "basePrice": 25000,
        "bedrooms": 2,
        "bathrooms": 2,
        "area": 1800,
        "type": "penthouse",
        "amenities": ["Private Terrace", "Sea View", "Beach Access", "Concierge"],
        "images": ["https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=800"]
    }' > /dev/null && echo "✅ Created: Palm Jumeirah Penthouse"

echo ""
echo "📅 Setting up availability for next 7 days..."

# Set availability for next 7 days
for i in {0..6}; do
    DATE=$(date -d "+${i} days" +%Y-%m-%d)
    curl -s -X POST "${API_BASE}/api/agent/availability" \
        -H "Content-Type: application/json" \
        -H "Authorization: Bearer ${TOKEN}" \
        -d "{
            \"date\": \"${DATE}\",
            \"timeSlots\": [\"09:00\", \"10:00\", \"11:00\", \"14:00\", \"15:00\", \"16:00\", \"17:00\"],
            \"isAvailable\": true
        }" > /dev/null && echo "✅ Set availability for ${DATE}"
done

echo ""
echo "🎉 Test data creation completed!"
echo "📊 Summary:"
echo "   - Created 5 properties with different types"
echo "   - Set availability for next 7 days"
echo "   - All properties have realistic pricing and amenities"
echo ""
echo "🌐 You can now test the agent dashboard at: http://localhost:3001/agent/dashboard"
echo "🔑 Login with: ${AGENT_EMAIL} / ${AGENT_PASSWORD}" 