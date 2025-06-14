#!/bin/bash

echo "Setting up GitHub repository for UAE Rental Platform Frontend"
echo "============================================================"

# Check if we're in the right directory
if [ ! -f "package.json" ] || [ ! -d ".git" ]; then
    echo "Error: Please run this script from the project root directory"
    exit 1
fi

# Check current git status
echo "Current git status:"
git status

echo ""
echo "Current remotes:"
git remote -v

# Ask for GitHub repository URL
echo ""
echo "Please provide your GitHub repository URL (e.g., https://github.com/username/uae-rental-platform.git):"
read github_url

if [ -z "$github_url" ]; then
    echo "Error: GitHub URL is required"
    exit 1
fi

# Add GitHub remote if it doesn't exist
if git remote | grep -q "origin"; then
    echo "Origin remote already exists, updating URL..."
    git remote set-url origin "$github_url"
else
    echo "Adding GitHub origin remote..."
    git remote add origin "$github_url"
fi

# Commit any pending changes
echo ""
echo "Committing any pending changes..."
git add .
git commit -m "Prepare frontend for GitHub deployment - $(date)" || echo "No changes to commit"

# Push to GitHub
echo ""
echo "Pushing to GitHub..."
git push -u origin main || git push -u origin master

echo ""
echo "✅ Frontend code pushed to GitHub successfully!"
echo ""
echo "Next steps for Render deployment:"
echo "1. Go to https://render.com and sign in"
echo "2. Click 'New +' and select 'Static Site'"
echo "3. Connect your GitHub repository: $github_url"
echo "4. Configure build settings:"
echo "   - Build Command: npm run build"
echo "   - Publish Directory: build"
echo "   - Environment Variables:"
echo "     - REACT_APP_API_URL=https://protected-sierra-25310-6656e0f5a79c.herokuapp.com/api"
echo "     - NODE_VERSION=18"
echo "5. Click 'Create Static Site'"
echo ""
echo "Your Heroku backend is already running at:"
echo "https://protected-sierra-25310-6656e0f5a79c.herokuapp.com/" 