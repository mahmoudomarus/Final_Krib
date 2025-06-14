#!/bin/bash

echo "Pushing UAE Rental Platform Frontend to GitHub"
echo "=============================================="

# Check if we're in the right directory
if [ ! -f "package.json" ] || [ ! -d ".git" ]; then
    echo "Error: Please run this script from the project root directory"
    exit 1
fi

# GitHub repository URL
GITHUB_URL="https://github.com/mahmoudomarus/krib_frontend.git"

echo "Target GitHub repository: $GITHUB_URL"
echo ""

# Check current git status
echo "Current git status:"
git status

echo ""
echo "Current remotes:"
git remote -v

# Add GitHub remote if it doesn't exist
if git remote | grep -q "origin"; then
    echo "Origin remote already exists, updating URL..."
    git remote set-url origin "$GITHUB_URL"
else
    echo "Adding GitHub origin remote..."
    git remote add origin "$GITHUB_URL"
fi

# Commit any pending changes
echo ""
echo "Committing any pending changes..."
git add .
git commit -m "Deploy frontend to GitHub - $(date)" || echo "No changes to commit"

# Push to GitHub
echo ""
echo "Pushing to GitHub..."
git push -u origin main 2>&1 || {
    echo "Main branch push failed, trying master branch..."
    git push -u origin master 2>&1
}

echo ""
echo "✅ Frontend code pushed to GitHub successfully!"
echo ""
echo "🚀 Next: Deploy to Render"
echo "========================="
echo ""
echo "1. Go to https://render.com and sign in"
echo "2. Click 'New +' and select 'Static Site'"
echo "3. Connect your GitHub account if not already connected"
echo "4. Select the repository: mahmoudomarus/krib_frontend"
echo "5. Configure the build settings:"
echo "   - Build Command: npm install && npm run build"
echo "   - Publish Directory: build"
echo "   - Environment Variables:"
echo "     REACT_APP_API_URL=https://protected-sierra-25310-6656e0f5a79c.herokuapp.com/api"
echo "     NODE_VERSION=18"
echo "     GENERATE_SOURCEMAP=false"
echo "     CI=false"
echo "6. Click 'Create Static Site'"
echo ""
echo "Your backend is running at:"
echo "https://protected-sierra-25310-6656e0f5a79c.herokuapp.com/"
echo ""
echo "After deployment, update your backend CORS settings to include the new Render frontend URL!" 