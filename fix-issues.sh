#!/bin/bash

echo "🔧 Fixing KRIB Platform Issues..."

# Set environment variables for the current session
export REACT_APP_GOOGLE_MAPS_API_KEY=AIzaSyAFgap4cNkxHDHapTBAexmy2u0eHY-xC90
export REACT_APP_API_URL=https://final-krib-backend-db83584596bb.herokuapp.com

echo "✅ Environment variables set"

# Kill any existing npm processes
echo "🛑 Stopping existing development servers..."
pkill -f "npm start" || true
sleep 2

# Start the frontend with proper environment variables
echo "🚀 Starting frontend with fixed environment..."
cd frontend
REACT_APP_GOOGLE_MAPS_API_KEY=AIzaSyAFgap4cNkxHDHapTBAexmy2u0eHY-xC90 REACT_APP_API_URL=https://final-krib-backend-db83584596bb.herokuapp.com npm start &

echo "✅ Frontend started with Google Maps API key"
echo "🌐 Google Maps API Key: AIzaSyAFgap4cNkxHDHapTBAexmy2u0eHY-xC90"
echo "🔗 API URL: https://final-krib-backend-db83584596bb.herokuapp.com"
echo ""
echo "🎯 Issues being addressed:"
echo "   ✅ Calendar cursor fixed (cursor-pointer instead of cursor-not-allowed)"
echo "   ✅ Google Maps API key configured"
echo "   ✅ API URL properly set"
echo "   ✅ Button functionality should work"
echo "   ✅ Design consistency maintained"
echo ""
echo "📱 Open http://localhost:3000 to test the fixes" 