#!/bin/bash

API_BASE="http://localhost:5001"

echo "🚀 Creating test data for Agent Dashboard"
echo "========================================="
echo ""

# Prompt for agent credentials
read -p "Enter your agent email: " AGENT_EMAIL
read -s -p "Enter your agent password: " AGENT_PASSWORD
echo ""
echo ""

echo "🔐 Logging in as agent..."

# Login and get token
TOKEN=$(curl -s -X POST "${API_BASE}/api/auth/login" \
    -H "Content-Type: application/json" \
    -d "{\"email\":\"${AGENT_EMAIL}\",\"password\":\"${AGENT_PASSWORD}\"}" | \
    grep -o '"token":"[^"]*"' | cut -d'"' -f4)

if [ -z "$TOKEN" ]; then
    echo "❌ Failed to login. Please check your credentials."
    exit 1
fi

echo "✅ Successfully logged in!"
echo ""

echo "🏠 Creating 5 sample properties..."

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
    }' > /dev/null && echo "✅ Created: Luxury 2BR Apartment in Downtown Dubai"

# Property 2: Modern 1BR Marina
curl -s -X POST "${API_BASE}/api/agent/listings/add" \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer ${TOKEN}" \
    -d '{
        "title": "Modern 1BR in Dubai Marina",
        "description": "Contemporary 1-bedroom apartment in the heart of Dubai Marina with marina views. Walking distance to restaurants, shopping, and metro station.",
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
    }' > /dev/null && echo "✅ Created: Modern 1BR in Dubai Marina"

# Property 3: Villa in Jumeirah
curl -s -X POST "${API_BASE}/api/agent/listings/add" \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer ${TOKEN}" \
    -d '{
        "title": "Spacious 3BR Villa in Jumeirah",
        "description": "Beautiful 3-bedroom villa with private garden and pool. Perfect for families, located in prestigious Jumeirah area with easy access to beaches.",
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
    }' > /dev/null && echo "✅ Created: Spacious 3BR Villa in Jumeirah"

# Property 4: Business Bay Studio
curl -s -X POST "${API_BASE}/api/agent/listings/add" \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer ${TOKEN}" \
    -d '{
        "title": "Studio Apartment in Business Bay",
        "description": "Compact and efficient studio apartment perfect for professionals. Located in Business Bay with easy access to metro and business districts.",
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
    }' > /dev/null && echo "✅ Created: Studio Apartment in Business Bay"

# Property 5: Palm Jumeirah Penthouse
curl -s -X POST "${API_BASE}/api/agent/listings/add" \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer ${TOKEN}" \
    -d '{
        "title": "2BR Penthouse in Palm Jumeirah",
        "description": "Exclusive penthouse with private terrace and stunning sea views. Located on the prestigious Palm Jumeirah with access to private beach.",
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
    }' > /dev/null && echo "✅ Created: 2BR Penthouse in Palm Jumeirah"

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
echo "📅 Scheduling sample viewings..."

# Get tomorrow's date
TOMORROW=$(date -d "+1 day" +%Y-%m-%d)
DAY_AFTER=$(date -d "+2 days" +%Y-%m-%d)
THREE_DAYS=$(date -d "+3 days" +%Y-%m-%d)

# Schedule viewing 1
curl -s -X POST "${API_BASE}/api/agent/viewings/schedule" \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer ${TOKEN}" \
    -d "{
        \"propertyId\": \"property_sample_1\",
        \"clientName\": \"Ahmed Hassan\",
        \"clientPhone\": \"+971509876543\",
        \"clientEmail\": \"ahmed.hassan@example.com\",
        \"scheduledDate\": \"${TOMORROW}\",
        \"scheduledTime\": \"10:00\",
        \"duration\": 60,
        \"viewingType\": \"physical\",
        \"notes\": \"Client interested in long-term rental\"
    }" > /dev/null && echo "✅ Scheduled viewing for Ahmed Hassan (${TOMORROW} 10:00)"

# Schedule viewing 2
curl -s -X POST "${API_BASE}/api/agent/viewings/schedule" \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer ${TOKEN}" \
    -d "{
        \"propertyId\": \"property_sample_2\",
        \"clientName\": \"Fatima Al-Zahra\",
        \"clientPhone\": \"+971508765432\",
        \"clientEmail\": \"fatima.alzahra@example.com\",
        \"scheduledDate\": \"${DAY_AFTER}\",
        \"scheduledTime\": \"14:00\",
        \"duration\": 45,
        \"viewingType\": \"physical\",
        \"notes\": \"First-time buyer, needs detailed explanation\"
    }" > /dev/null && echo "✅ Scheduled viewing for Fatima Al-Zahra (${DAY_AFTER} 14:00)"

# Schedule viewing 3
curl -s -X POST "${API_BASE}/api/agent/viewings/schedule" \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer ${TOKEN}" \
    -d "{
        \"propertyId\": \"property_sample_3\",
        \"clientName\": \"Omar Khalil\",
        \"clientPhone\": \"+971507890123\",
        \"clientEmail\": \"omar.khalil@example.com\",
        \"scheduledDate\": \"${THREE_DAYS}\",
        \"scheduledTime\": \"16:00\",
        \"duration\": 90,
        \"viewingType\": \"physical\",
        \"notes\": \"Family viewing, interested in villa features\"
    }" > /dev/null && echo "✅ Scheduled viewing for Omar Khalil (${THREE_DAYS} 16:00)"

echo ""
echo "🎉 Test data creation completed!"
echo "========================================="
echo "📊 Summary:"
echo "   ✅ Created 5 properties with realistic data"
echo "   ✅ Set availability for next 7 days"
echo "   ✅ Scheduled 3 upcoming viewings"
echo ""
echo "🔄 Please refresh your agent dashboard to see the new data!"
echo "🌐 Dashboard URL: http://localhost:3001/agent/dashboard"
echo ""
echo "💡 You can now test all the features:"
echo "   - View property listings and analytics"
echo "   - Manage scheduled viewings"
echo "   - Use quick action buttons (Confirm/Cancel/Complete)"
echo "   - Schedule new viewings"
echo "   - Set availability and block time" 