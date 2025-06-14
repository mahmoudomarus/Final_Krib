# 🚀 UAE Rental Platform - Deployment Guide

## Overview
This guide covers deploying the UAE Rental Platform to multiple cloud platforms including Heroku, Render, and Netlify.

## 🏗️ Architecture
- **Frontend**: React.js (TypeScript) - Deployed to Netlify/Vercel/Render
- **Backend**: Node.js + Express (TypeScript) - Deployed to Heroku/Render
- **Database**: PostgreSQL - Managed by hosting provider
- **File Storage**: AWS S3 (optional)

## 📋 Prerequisites
- Node.js 18.x
- Git installed
- GitHub account
- Heroku CLI installed
- Render CLI installed (optional)

## 🔧 Environment Variables

### Backend Environment Variables (.env)
```bash
# Database
DATABASE_URL="postgresql://username:password@host:5432/database"

# JWT
JWT_SECRET="your-super-secret-jwt-key-here"
JWT_EXPIRES_IN="7d"

# Application
NODE_ENV="production"
PORT="5000"
CLIENT_URL="https://your-frontend-url.netlify.app"

# Email Service (SendGrid)
SENDGRID_API_KEY="your-sendgrid-api-key"
SENDGRID_FROM_EMAIL="noreply@uae-rental.com"
SENDGRID_FROM_NAME="UAE Rental Platform"

# SMS Service (Twilio) - Optional
TWILIO_ACCOUNT_SID="your-twilio-account-sid"
TWILIO_AUTH_TOKEN="your-twilio-auth-token"
TWILIO_PHONE_NUMBER="+1234567890"

# Stripe Payment - Optional
STRIPE_SECRET_KEY="sk_test_your-stripe-secret-key"
STRIPE_PUBLISHABLE_KEY="pk_test_your-stripe-publishable-key"
STRIPE_WEBHOOK_SECRET="whsec_your-webhook-secret"

# File Upload (AWS S3) - Optional
AWS_ACCESS_KEY_ID="your-aws-access-key"
AWS_SECRET_ACCESS_KEY="your-aws-secret-key"
AWS_REGION="us-east-1"
AWS_S3_BUCKET="uae-rental-uploads"

# Redis (for caching) - Optional
REDIS_URL="redis://localhost:6379"
```

### Frontend Environment Variables
```bash
REACT_APP_API_URL="https://your-backend-url.herokuapp.com/api"
GENERATE_SOURCEMAP="false"
```

## 🚀 Deployment Steps

### 1. Initialize Git Repository
```bash
cd uae-rental-platform
git init
git add .
git commit -m "Initial commit - UAE Rental Platform"
```

### 2. Push to GitHub
```bash
# Create a new repository on GitHub first, then:
git remote add origin https://github.com/YOUR_USERNAME/uae-rental-platform.git
git branch -M main
git push -u origin main
```

### 3. Deploy Backend to Heroku

#### Install Heroku CLI
```bash
# Ubuntu/Debian
curl https://cli-assets.heroku.com/install.sh | sh

# macOS
brew tap heroku/brew && brew install heroku
```

#### Deploy to Heroku
```bash
# Login to Heroku
heroku login

# Create Heroku app
heroku create your-app-name-backend

# Add PostgreSQL addon
heroku addons:create heroku-postgresql:hobby-dev --app your-app-name-backend

# Set environment variables
heroku config:set NODE_ENV=production --app your-app-name-backend
heroku config:set JWT_SECRET=$(openssl rand -base64 32) --app your-app-name-backend
heroku config:set CLIENT_URL=https://your-frontend-url.netlify.app --app your-app-name-backend

# Deploy
git subtree push --prefix server heroku main

# Run database migrations
heroku run npm run db:migrate:deploy --app your-app-name-backend
heroku run npm run db:seed --app your-app-name-backend
```

### 4. Deploy Backend to Render

#### Using Render.yaml (Recommended)
1. Connect your GitHub repository to Render
2. The `render.yaml` file will automatically configure:
   - Backend service
   - PostgreSQL database
   - Environment variables

#### Manual Render Deployment
1. Go to [Render Dashboard](https://dashboard.render.com)
2. Create New → Web Service
3. Connect GitHub repository
4. Configure:
   - **Root Directory**: `server`
   - **Build Command**: `npm install && npm run build && npx prisma generate`
   - **Start Command**: `npm start`
   - **Environment**: Add variables from above list

### 5. Deploy Frontend to Netlify

#### Automatic Deployment
1. Go to [Netlify](https://netlify.com)
2. New site from Git
3. Choose your GitHub repository
4. Configure:
   - **Build command**: `npm run build`
   - **Publish directory**: `build`
   - **Environment variables**: Add REACT_APP_API_URL

#### Using Netlify CLI
```bash
npm install -g netlify-cli
netlify login
netlify init
netlify deploy --prod
```

### 6. Deploy Frontend to Vercel
```bash
npm install -g vercel
vercel --prod
```

### 7. Deploy Full Stack to Render
Use the included `render.yaml` file for automatic deployment of both frontend and backend.

## 🔄 Continuous Deployment

### GitHub Actions (Optional)
Create `.github/workflows/deploy.yml`:
```yaml
name: Deploy to Production

on:
  push:
    branches: [ main ]

jobs:
  deploy-backend:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Deploy to Heroku
        uses: akhileshns/heroku-deploy@v3.12.12
        with:
          heroku_api_key: ${{secrets.HEROKU_API_KEY}}
          heroku_app_name: "your-app-name-backend"
          heroku_email: "your-email@example.com"
          appdir: "server"

  deploy-frontend:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Deploy to Netlify
        run: |
          npm install
          npm run build
          npx netlify-cli deploy --prod --dir=build --site=${{secrets.NETLIFY_SITE_ID}} --auth=${{secrets.NETLIFY_AUTH_TOKEN}}
```

## 🗃️ Database Setup

### Heroku PostgreSQL
Automatically configured with `heroku addons:create heroku-postgresql:hobby-dev`

### Render PostgreSQL
Automatically configured with `render.yaml` or manually add PostgreSQL service

### Manual Database Setup
```bash
# After deployment, run migrations
heroku run npm run db:migrate:deploy --app your-app-name-backend

# Seed the database
heroku run npm run db:seed --app your-app-name-backend
```

## 🔒 Security Checklist
- [ ] JWT_SECRET is properly set and secure
- [ ] DATABASE_URL is using SSL in production
- [ ] CORS is configured for production domains
- [ ] Environment variables are not exposed in frontend
- [ ] Rate limiting is enabled
- [ ] HTTPS is enforced

## 📊 Monitoring & Logging
- Use Heroku logs: `heroku logs --tail --app your-app-name-backend`
- Consider adding services like LogRocket, Sentry, or DataDog
- Monitor database performance and scaling needs

## 🔧 Troubleshooting

### Common Issues
1. **Build failures**: Check Node.js version compatibility
2. **Database connection**: Verify DATABASE_URL format
3. **CORS errors**: Update CLIENT_URL environment variable
4. **Missing dependencies**: Ensure all packages are in dependencies, not devDependencies

### Debug Commands
```bash
# Check Heroku logs
heroku logs --tail --app your-app-name-backend

# Connect to Heroku database
heroku pg:psql --app your-app-name-backend

# Run commands on Heroku
heroku run bash --app your-app-name-backend
```

## 🚀 Quick Deploy Commands

### One-click Heroku Deploy
Click this button: [![Deploy](https://www.herokucdn.com/deploy/button.svg)](https://heroku.com/deploy?template=https://github.com/YOUR_USERNAME/uae-rental-platform)

### Render Deploy
Use the `render.yaml` file for automatic infrastructure setup.

## 📈 Scaling Considerations
- **Database**: Upgrade PostgreSQL plan as needed
- **Server**: Scale dynos on Heroku or upgrade Render plan
- **CDN**: Consider Cloudflare for static assets
- **File Storage**: Implement AWS S3 for user uploads
- **Caching**: Add Redis for session management and caching

## 📞 Support
For deployment issues, check the logs and ensure all environment variables are properly configured. 