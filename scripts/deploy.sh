#!/bin/bash

# UAE Rental Platform - Master Deployment Script
echo "🚀 UAE Rental Platform - Complete Deployment Setup"
echo "=================================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
NC='\033[0m' # No Color

# Function to show menu
show_menu() {
    echo ""
    echo -e "${PURPLE}🎯 What would you like to deploy?${NC}"
    echo "1. 📦 Setup GitHub Repository (First time)"
    echo "2. 🚀 Deploy Backend to Heroku"
    echo "3. 🌐 Deploy Frontend to Netlify"
    echo "4. 🔄 Deploy Both Frontend & Backend"
    echo "5. 📊 Deploy to Render (Full Stack)"
    echo "6. ✅ Verify Deployments"
    echo "7. 🔧 Setup GitHub Actions CI/CD"
    echo "8. 📖 View Deployment Guide"
    echo "9. ❌ Exit"
    echo ""
}

# Function to setup GitHub
setup_github() {
    echo -e "${BLUE}📦 Setting up GitHub repository...${NC}"
    if [ -f "scripts/setup-github.sh" ]; then
        ./scripts/setup-github.sh
    else
        echo -e "${RED}❌ GitHub setup script not found${NC}"
    fi
}

# Function to deploy to Heroku
deploy_heroku() {
    echo -e "${BLUE}🚀 Deploying backend to Heroku...${NC}"
    if [ -f "scripts/deploy-heroku.sh" ]; then
        ./scripts/deploy-heroku.sh
    else
        echo -e "${RED}❌ Heroku deployment script not found${NC}"
    fi
}

# Function to deploy to Netlify
deploy_netlify() {
    echo -e "${BLUE}🌐 Deploying frontend to Netlify...${NC}"
    if [ -f "scripts/deploy-netlify.sh" ]; then
        ./scripts/deploy-netlify.sh
    else
        echo -e "${RED}❌ Netlify deployment script not found${NC}"
    fi
}

# Function to deploy both
deploy_both() {
    echo -e "${BLUE}🔄 Deploying both frontend and backend...${NC}"
    echo -e "${YELLOW}Step 1: Deploying Backend to Heroku${NC}"
    deploy_heroku
    echo ""
    echo -e "${YELLOW}Step 2: Deploying Frontend to Netlify${NC}"
    deploy_netlify
}

# Function to deploy to Render
deploy_render() {
    echo -e "${BLUE}📊 Deploying to Render (Full Stack)...${NC}"
    echo -e "${YELLOW}Using render.yaml configuration...${NC}"
    
    # Check if Render CLI is installed
    if ! command -v render &> /dev/null; then
        echo -e "${YELLOW}📦 Installing Render CLI...${NC}"
        npm install -g @render/cli
    fi
    
    echo -e "${YELLOW}🔑 Please login to Render...${NC}"
    render auth login
    
    echo -e "${YELLOW}🚀 Deploying via render.yaml...${NC}"
    render deploy
    
    echo -e "${GREEN}✅ Render deployment initiated!${NC}"
    echo "Check your Render dashboard for deployment status."
}

# Function to verify deployments
verify_deployments() {
    echo -e "${BLUE}✅ Verifying deployments...${NC}"
    echo ""
    
    # Check if we can get the URLs from git remotes or config
    if git remote get-url heroku &> /dev/null; then
        HEROKU_URL=$(heroku info --app $(git remote get-url heroku | sed 's/.*\/\(.*\)\.git/\1/') | grep "Web URL" | awk '{print $3}')
        echo -e "${YELLOW}🚀 Testing Backend (Heroku):${NC} $HEROKU_URL"
        curl -s -o /dev/null -w "%{http_code}" $HEROKU_URL && echo -e "${GREEN} ✅ Backend is responding${NC}" || echo -e "${RED} ❌ Backend not responding${NC}"
    fi
    
    # Test frontend
    echo -e "${YELLOW}📝 Please provide your frontend URL to test:${NC}"
    read -p "Frontend URL: " FRONTEND_URL
    if [ ! -z "$FRONTEND_URL" ]; then
        echo -e "${YELLOW}🌐 Testing Frontend:${NC} $FRONTEND_URL"
        curl -s -o /dev/null -w "%{http_code}" $FRONTEND_URL && echo -e "${GREEN} ✅ Frontend is responding${NC}" || echo -e "${RED} ❌ Frontend not responding${NC}"
    fi
}

# Function to setup GitHub Actions
setup_github_actions() {
    echo -e "${BLUE}🔧 Setting up GitHub Actions CI/CD...${NC}"
    echo ""
    echo -e "${YELLOW}📋 GitHub Secrets to configure:${NC}"
    echo "1. HEROKU_API_KEY - Your Heroku API key"
    echo "2. HEROKU_APP_NAME - Your Heroku app name"
    echo "3. HEROKU_EMAIL - Your Heroku email"
    echo "4. NETLIFY_AUTH_TOKEN - Your Netlify personal access token"
    echo "5. NETLIFY_SITE_ID - Your Netlify site ID"
    echo "6. REACT_APP_API_URL - Your backend API URL"
    echo ""
    echo -e "${YELLOW}🔗 Configure these at: https://github.com/YOUR_USERNAME/YOUR_REPO/settings/secrets/actions${NC}"
    echo ""
    echo -e "${GREEN}✅ GitHub Actions workflow already created at .github/workflows/deploy.yml${NC}"
}

# Function to show deployment guide
show_guide() {
    echo -e "${BLUE}📖 Opening Deployment Guide...${NC}"
    if [ -f "DEPLOYMENT_GUIDE.md" ]; then
        if command -v code &> /dev/null; then
            code DEPLOYMENT_GUIDE.md
        elif command -v nano &> /dev/null; then
            nano DEPLOYMENT_GUIDE.md
        else
            cat DEPLOYMENT_GUIDE.md
        fi
    else
        echo -e "${RED}❌ Deployment guide not found${NC}"
    fi
}

# Main menu loop
while true; do
    show_menu
    read -p "Enter your choice (1-9): " choice
    case $choice in
        1)
            setup_github
            ;;
        2)
            deploy_heroku
            ;;
        3)
            deploy_netlify
            ;;
        4)
            deploy_both
            ;;
        5)
            deploy_render
            ;;
        6)
            verify_deployments
            ;;
        7)
            setup_github_actions
            ;;
        8)
            show_guide
            ;;
        9)
            echo -e "${GREEN}👋 Thanks for using UAE Rental Platform deployment!${NC}"
            exit 0
            ;;
        *)
            echo -e "${RED}❌ Invalid option. Please try again.${NC}"
            ;;
    esac
    
    echo ""
    read -p "Press Enter to continue..."
done 