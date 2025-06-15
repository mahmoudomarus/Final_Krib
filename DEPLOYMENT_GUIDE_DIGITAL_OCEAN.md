# KRIB Platform Deployment Guide
## Digital Ocean Spaces + Vercel + Heroku

This guide covers deploying the KRIB platform with:
- **Storage**: Digital Ocean Spaces
- **Frontend**: Vercel
- **Backend**: Heroku

## Prerequisites

1. **Digital Ocean Account** with Spaces enabled
2. **Vercel Account** connected to your GitHub repository
3. **Heroku Account** with CLI installed
4. **Domain** (optional but recommended)

## 1. Digital Ocean Spaces Setup

### 1.1 Create Spaces Bucket
```bash
# Already configured:
# Bucket Name: kribbucket
# Region: Singapore (sgp1)
# Origin Endpoint: https://kribbucket.sgp1.digitaloceanspaces.com
# CDN Endpoint: https://kribbucket.sgp1.cdn.digitaloceanspaces.com
```

### 1.2 Configure CORS
In your Digital Ocean Spaces settings, add CORS configuration:
```json
[
  {
    "AllowedOrigins": ["*"],
    "AllowedMethods": ["GET", "PUT", "POST", "DELETE", "HEAD"],
    "AllowedHeaders": ["*"],
    "MaxAgeSeconds": 3000
  }
]
```

### 1.3 Access Keys (Already Provided)
```
Access Key ID: DO00B8XZ7NXWHKE4M9PM
Secret Access Key: QAmwFUmqYiGGbtc9YhEOyPIoxQjMxzBHAWycT99DDX8
```

## 2. Backend Deployment (Heroku)

### 2.1 Install Heroku CLI
```bash
# macOS
brew tap heroku/brew && brew install heroku

# Ubuntu/Debian
curl https://cli-assets.heroku.com/install.sh | sh
```

### 2.2 Login and Create App
```bash
heroku login
heroku create krib-backend-api
```

### 2.3 Set Environment Variables
```bash
# Database & Auth
heroku config:set NODE_ENV=production
heroku config:set PORT=5001
heroku config:set CLIENT_URL=https://your-frontend-domain.vercel.app

# Supabase
heroku config:set SUPABASE_URL=https://yxtcwqczkbgwpgzvbubq.supabase.co
heroku config:set SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl4dGN3cWN6a2Jnd3BnenZidWJxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDkzNDM2ODgsImV4cCI6MjA2NDkxOTY4OH0.CMO-gh5Z4Nup498jS8wY7f54PpXUJ893mU_SxHhV3dE
heroku config:set SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl4dGN3cWN6a2Jnd3BnenZidWJxIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0OTM0MzY4OCwiZXhwIjoyMDY0OTE5Njg4fQ.TJmBjpftZWxzruESsEb6RqXe0_-tAPsPLsENS5ItIRM

# JWT
heroku config:set JWT_SECRET=2Ha5cnIkk1GY+HNCS/BVX1ALf30OBITzRdZNhyJH2X2VPf1cXtgfDBpfw2I5qhdW5utHdiUMWUBekXQ8OH5oPg==

# Google Services
heroku config:set GOOGLE_CLIENT_ID=your-google-client-id
heroku config:set GOOGLE_CLIENT_SECRET=your-google-client-secret
heroku config:set GOOGLE_MAPS_API_KEY=your-google-maps-api-key

# Mapbox
heroku config:set MAPBOX_ACCESS_TOKEN=pk.eyJ1Ijoia3JpYjEwMTAiLCJhIjoiY21ibnV6ZW9wMXlmdjJpcXhxdHBjZ2ltdSJ9.p86OpiGjI0Ffsp4sSbWmbg

# Email (SendGrid)
heroku config:set SENDGRID_API_KEY=your-sendgrid-api-key
heroku config:set SENDGRID_FROM_EMAIL=noreply@krib.ae
heroku config:set SENDGRID_FROM_NAME=Krib

# SMS (Twilio)
heroku config:set TWILIO_ACCOUNT_SID=your-twilio-account-sid
heroku config:set TWILIO_AUTH_TOKEN=your-twilio-auth-token
heroku config:set TWILIO_PHONE_NUMBER=your-twilio-phone-number

# Analytics
heroku config:set MIXPANEL_TOKEN=226aac3ae30245f406bd2a548b810fe4

# Stripe
heroku config:set STRIPE_SECRET_KEY=your-stripe-secret-key
heroku config:set STRIPE_WEBHOOK_SECRET=your-stripe-webhook-secret
heroku config:set STRIPE_PUBLISHABLE_KEY=your-stripe-publishable-key

# Digital Ocean Spaces
heroku config:set DO_SPACES_ENDPOINT=https://sgp1.digitaloceanspaces.com
heroku config:set DO_SPACES_BUCKET=kribbucket
heroku config:set DO_SPACES_REGION=sgp1
heroku config:set DO_SPACES_ACCESS_KEY_ID=DO00B8XZ7NXWHKE4M9PM
heroku config:set DO_SPACES_SECRET_ACCESS_KEY=QAmwFUmqYiGGbtc9YhEOyPIoxQjMxzBHAWycT99DDX8
heroku config:set DO_SPACES_CDN_ENDPOINT=https://kribbucket.sgp1.cdn.digitaloceanspaces.com
```

### 2.4 Add Redis Add-on
```bash
heroku addons:create heroku-redis:mini
```

### 2.5 Deploy Backend
```bash
# Add Heroku remote
heroku git:remote -a krib-backend-api

# Deploy
git subtree push --prefix=backend heroku main

# Or if you prefer to deploy the entire repo:
git push heroku main
```

### 2.6 Verify Deployment
```bash
heroku logs --tail
heroku open
```

## 3. Frontend Deployment (Vercel)

### 3.1 Install Vercel CLI
```bash
npm i -g vercel
```

### 3.2 Login to Vercel
```bash
vercel login
```

### 3.3 Configure Environment Variables in Vercel Dashboard
Go to your Vercel project settings and add:

```bash
# API Configuration
REACT_APP_API_BASE_URL=https://krib-backend-api.herokuapp.com/api

# Google Services
REACT_APP_GOOGLE_CLIENT_ID=your-google-client-id
REACT_APP_GOOGLE_MAPS_API_KEY=your-google-maps-api-key

# Mapbox
REACT_APP_MAPBOX_ACCESS_TOKEN=pk.eyJ1Ijoia3JpYjEwMTAiLCJhIjoiY21ibnV6ZW9wMXlmdjJpcXhxdHBjZ2ltdSJ9.p86OpiGjI0Ffsp4sSbWmbg

# Analytics
REACT_APP_MIXPANEL_TOKEN=226aac3ae30245f406bd2a548b810fe4
```

### 3.4 Deploy Frontend
```bash
# From project root
vercel --prod

# Or connect your GitHub repo for automatic deployments
```

### 3.5 Update Backend CLIENT_URL
After frontend deployment, update the backend:
```bash
heroku config:set CLIENT_URL=https://your-vercel-domain.vercel.app
```

## 4. Domain Configuration (Optional)

### 4.1 Custom Domain for Frontend (Vercel)
1. Go to Vercel Dashboard → Project → Settings → Domains
2. Add your custom domain (e.g., `app.krib.ae`)
3. Configure DNS records as instructed

### 4.2 Custom Domain for Backend (Heroku)
```bash
heroku domains:add api.krib.ae
heroku certs:auto:enable
```

## 5. Post-Deployment Configuration

### 5.1 Update CORS Settings
Ensure your backend CORS configuration includes your production domains:
```typescript
// In backend/src/index.ts
const corsOptions = {
  origin: [
    'https://your-vercel-domain.vercel.app',
    'https://app.krib.ae', // if using custom domain
    'http://localhost:3001' // for development
  ],
  credentials: true
};
```

### 5.2 Stripe Webhook Configuration
1. Go to Stripe Dashboard → Webhooks
2. Add endpoint: `https://krib-backend-api.herokuapp.com/api/payments/webhook`
3. Update `STRIPE_WEBHOOK_SECRET` in Heroku config

### 5.3 Test File Uploads
1. Login to your deployed application
2. Try uploading a profile picture or property image
3. Verify files appear in Digital Ocean Spaces
4. Check CDN URLs are working

## 6. Monitoring & Maintenance

### 6.1 Heroku Monitoring
```bash
# View logs
heroku logs --tail

# Check dyno status
heroku ps

# Scale dynos if needed
heroku ps:scale web=2
```

### 6.2 Vercel Monitoring
- Check deployment status in Vercel Dashboard
- Monitor function execution times
- Review build logs for any issues

### 6.3 Digital Ocean Spaces Monitoring
- Monitor storage usage in DO Dashboard
- Check CDN performance
- Review access logs if needed

## 7. Backup Strategy

### 7.1 Database Backups
- Supabase automatically handles backups
- Consider setting up additional backup schedules

### 7.2 File Storage Backups
- Digital Ocean Spaces has built-in redundancy
- Consider cross-region replication for critical files

## 8. Troubleshooting

### Common Issues:

1. **File Upload Failures**
   - Check Digital Ocean Spaces credentials
   - Verify CORS configuration
   - Check network connectivity

2. **API Connection Issues**
   - Verify `REACT_APP_API_BASE_URL` is correct
   - Check CORS settings
   - Ensure Heroku dyno is running

3. **Build Failures**
   - Check environment variables are set
   - Verify all dependencies are installed
   - Review build logs for specific errors

### Debug Commands:
```bash
# Check Heroku config
heroku config

# View Heroku logs
heroku logs --tail

# Check Vercel deployment logs
vercel logs

# Test API endpoints
curl https://krib-backend-api.herokuapp.com/api/health
```

## 9. Performance Optimization

### 9.1 CDN Configuration
- Digital Ocean Spaces CDN is already configured
- Consider additional caching headers for static assets

### 9.2 Database Optimization
- Monitor Supabase performance
- Optimize queries if needed
- Consider connection pooling

### 9.3 Frontend Optimization
- Enable Vercel's automatic optimizations
- Implement code splitting
- Optimize images and assets

## 10. Security Checklist

- [ ] All environment variables are set correctly
- [ ] HTTPS is enabled on all domains
- [ ] CORS is properly configured
- [ ] File upload validation is working
- [ ] Rate limiting is enabled
- [ ] Security headers are configured
- [ ] Webhook signatures are verified

## Support

For deployment issues:
1. Check the troubleshooting section above
2. Review service-specific documentation:
   - [Heroku Dev Center](https://devcenter.heroku.com/)
   - [Vercel Documentation](https://vercel.com/docs)
   - [Digital Ocean Spaces Docs](https://docs.digitalocean.com/products/spaces/)
3. Contact the development team

---

**Deployment Complete!** 🚀

Your KRIB platform is now running on:
- **Frontend**: Vercel (with CDN)
- **Backend**: Heroku (with Redis)
- **Storage**: Digital Ocean Spaces (with CDN)
- **Database**: Supabase (managed PostgreSQL) 