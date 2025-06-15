#!/bin/bash

# UAE Krib Frontend Startup Script
echo "🚀 Starting UAE Krib Frontend..."

# Set environment variables
export REACT_APP_API_URL=https://final-krib-backend-db83584596bb.herokuapp.com/api
export REACT_APP_GOOGLE_MAPS_API_KEY=AIzaSyAFgap4cNkxHDHapTBAexmy2u0eHY-xC90
export REACT_APP_GOOGLE_CLIENT_ID=574961035006-g7oebfp5st5lt5mtksaq5ane3d197re9.apps.googleusercontent.com

echo "📡 Backend API: $REACT_APP_API_URL"
echo "🗺️  Google Maps API Key: ${REACT_APP_GOOGLE_MAPS_API_KEY:0:20}..."
echo "🔐 Google Client ID: ${REACT_APP_GOOGLE_CLIENT_ID:0:20}..."

# Navigate to frontend directory
cd frontend

# Install dependencies if needed
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
fi

# Start the development server
echo "🌐 Starting development server..."
npm start 