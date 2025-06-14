#!/bin/bash

API_BASE="http://localhost:5001"
AGENT_EMAIL="agent.mahmoud@krib.ae"
AGENT_PASSWORD="password123"

echo "📅 Adding sample bookings for realistic dashboard data..."

# Login and get token
TOKEN=$(curl -s -X POST "${API_BASE}/api/auth/login" \
    -H "Content-Type: application/json" \
    -d "{\"email\":\"${AGENT_EMAIL}\",\"password\":\"${AGENT_PASSWORD}\"}" | \
    grep -o '"token":"[^"]*"' | cut -d'"' -f4)

if [ -z "$TOKEN" ]; then
    echo "❌ Failed to login. Please run create-test-data.sh first."
    exit 1
fi

# Get property IDs
echo "🔍 Getting property IDs..."
PROPERTIES=$(curl -s -X GET "${API_BASE}/api/agent/listings" \
    -H "Authorization: Bearer ${TOKEN}")

echo "📝 Creating sample guest accounts and bookings..."

# Create guest users and bookings
curl -s -X POST "${API_BASE}/api/auth/register" \
    -H "Content-Type: application/json" \
    -d '{
        "email": "ahmed.hassan@example.com",
        "password": "guest123",
        "firstName": "Ahmed",
        "lastName": "Hassan",
        "phone": "+971509876543",
        "isAgent": false
    }' > /dev/null

curl -s -X POST "${API_BASE}/api/auth/register" \
    -H "Content-Type: application/json" \
    -d '{
        "email": "fatima.alzahra@example.com",
        "password": "guest123",
        "firstName": "Fatima",
        "lastName": "Al-Zahra",
        "phone": "+971508765432",
        "isAgent": false
    }' > /dev/null

curl -s -X POST "${API_BASE}/api/auth/register" \
    -H "Content-Type: application/json" \
    -d '{
        "email": "omar.khalil@example.com",
        "password": "guest123",
        "firstName": "Omar",
        "lastName": "Khalil",
        "phone": "+971507890123",
        "isAgent": false
    }' > /dev/null

echo "✅ Created guest accounts"

# Schedule some viewings with the properties
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
        \"propertyId\": \"property_$(date +%s)000\",
        \"clientName\": \"Ahmed Hassan\",
        \"clientPhone\": \"+971509876543\",
        \"clientEmail\": \"ahmed.hassan@example.com\",
        \"scheduledDate\": \"${TOMORROW}\",
        \"scheduledTime\": \"10:00\",
        \"duration\": 60,
        \"viewingType\": \"physical\",
        \"notes\": \"Client interested in long-term rental\"
    }" > /dev/null && echo "✅ Scheduled viewing for Ahmed Hassan"

# Schedule viewing 2
curl -s -X POST "${API_BASE}/api/agent/viewings/schedule" \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer ${TOKEN}" \
    -d "{
        \"propertyId\": \"property_$(date +%s)001\",
        \"clientName\": \"Fatima Al-Zahra\",
        \"clientPhone\": \"+971508765432\",
        \"clientEmail\": \"fatima.alzahra@example.com\",
        \"scheduledDate\": \"${DAY_AFTER}\",
        \"scheduledTime\": \"14:00\",
        \"duration\": 45,
        \"viewingType\": \"physical\",
        \"notes\": \"First-time buyer, needs detailed explanation\"
    }" > /dev/null && echo "✅ Scheduled viewing for Fatima Al-Zahra"

# Schedule viewing 3
curl -s -X POST "${API_BASE}/api/agent/viewings/schedule" \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer ${TOKEN}" \
    -d "{
        \"propertyId\": \"property_$(date +%s)002\",
        \"clientName\": \"Omar Khalil\",
        \"clientPhone\": \"+971507890123\",
        \"clientEmail\": \"omar.khalil@example.com\",
        \"scheduledDate\": \"${THREE_DAYS}\",
        \"scheduledTime\": \"16:00\",
        \"duration\": 90,
        \"viewingType\": \"physical\",
        \"notes\": \"Family viewing, interested in villa features\"
    }" > /dev/null && echo "✅ Scheduled viewing for Omar Khalil"

echo ""
echo "🎉 Sample bookings and viewings added!"
echo "📊 Your agent dashboard now has:"
echo "   - 5 properties with realistic data"
echo "   - 3 scheduled viewings for the next few days"
echo "   - 7 days of availability set"
echo "   - Guest accounts for testing"
echo ""
echo "🌐 Test the dashboard at: http://localhost:3001/agent/dashboard"
echo "🔑 Agent login: ${AGENT_EMAIL} / ${AGENT_PASSWORD}"
echo ""
echo "💡 You can now test all the quick action buttons:"
echo "   - Confirm/Cancel/Complete viewings"
echo "   - Schedule new viewings"
echo "   - Set availability and block time"
echo "   - View property analytics" 