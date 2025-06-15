# UAE Rental Platform - Configuration Guide

## 🚀 **QUICK SETUP CHECKLIST**

### ✅ **CRITICAL CONFIGURATIONS**

#### **1. Database (Supabase) - REQUIRED**
```bash
SUPABASE_URL="https://yxtcwqczkbgwpgzvbubq.supabase.co"
SUPABASE_SERVICE_ROLE_KEY="your-service-role-key"
```

#### **2. Authentication - REQUIRED**
```bash
JWT_SECRET="your-super-secret-jwt-key-here"
```

#### **3. Email Notifications (SendGrid) - REQUIRED**
```bash
SENDGRID_API_KEY="SG.your-sendgrid-api-key"
SENDGRID_FROM_EMAIL="noreply@uae-rental.com"
SENDGRID_FROM_NAME="UAE Rental Platform"
```

#### **4. SMS Notifications (Twilio) - WORKING**
```bash
# Your current configuration (API Key format)
TWILIO_ACCOUNT_SID="your-twilio-account-sid"
TWILIO_AUTH_TOKEN="your-twilio-auth-token"
TWILIO_PHONE_NUMBER="your-twilio-phone-number"
```

#### **5. Payments (Stripe) - REQUIRED**
```bash
STRIPE_SECRET_KEY="sk_test_your-stripe-secret-key"
STRIPE_PUBLISHABLE_KEY="pk_test_your-stripe-publishable-key"
STRIPE_WEBHOOK_SECRET="whsec_your-webhook-secret"
```

### ⚠️ **OPTIONAL CONFIGURATIONS**

#### **6. File Upload (Cloudinary) - OPTIONAL**
```bash
# If not configured, will use mock uploads
CLOUDINARY_CLOUD_NAME="your-cloud-name"
CLOUDINARY_API_KEY="your-api-key"
CLOUDINARY_API_SECRET="your-api-secret"
```

#### **7. Analytics (Mixpanel) - OPTIONAL**
```bash
MIXPANEL_TOKEN="your-mixpanel-token"
```

#### **8. Google Services - OPTIONAL**
```bash
GOOGLE_MAPS_API_KEY="your-google-maps-api-key"
GOOGLE_PLACES_API_KEY="your-google-places-api-key"
```

## 🔧 **CURRENT STATUS**

### ✅ **WORKING SERVICES**
- ✅ **Database**: Supabase connected, all tables exist
- ✅ **Authentication**: JWT working
- ✅ **Email**: SendGrid configured
- ✅ **SMS**: Twilio API Key working
- ✅ **Search**: Real data from Supabase
- ✅ **Chat**: Role-based messaging
- ✅ **Notifications**: Database + Email working
- ✅ **File Upload**: Mock system working

### ⚠️ **NEEDS CONFIGURATION**
- ⚠️ **Payments**: Need Stripe keys
- ⚠️ **File Upload**: Need Cloudinary for production
- ⚠️ **Maps**: Need Google Maps API for location features

## 📋 **SETUP INSTRUCTIONS**

### **1. Copy Environment File**
```bash
cp .env.example .env
```

### **2. Update Critical Variables**
Edit `.env` file with your actual values:

```bash
# Database - ALREADY CONFIGURED
SUPABASE_URL="https://yxtcwqczkbgwpgzvbubq.supabase.co"
SUPABASE_SERVICE_ROLE_KEY="your-actual-service-role-key"

# JWT - GENERATE A STRONG SECRET
JWT_SECRET="$(openssl rand -base64 32)"

# Email - GET FROM SENDGRID
SENDGRID_API_KEY="SG.your-actual-api-key"

# SMS - ALREADY WORKING
TWILIO_ACCOUNT_SID="your-twilio-account-sid"
TWILIO_AUTH_TOKEN="your-twilio-auth-token"
TWILIO_PHONE_NUMBER="your-twilio-phone-number"

# Payments - GET FROM STRIPE
STRIPE_SECRET_KEY="sk_test_your-stripe-key"
```

### **3. Test Configuration**
```bash
npm run dev
```

Check console for service initialization messages:
- ✅ SendGrid email service initialized
- ✅ Twilio SMS service initialized with API Key
- ✅ File upload service initialized
- ✅ Database connected

## 🚨 **PRODUCTION READINESS**

### **SECURITY CHECKLIST**
- [ ] Strong JWT secret (32+ characters)
- [ ] Environment variables secured
- [ ] HTTPS enabled
- [ ] CORS properly configured
- [ ] Rate limiting enabled
- [ ] Input validation on all endpoints

### **PERFORMANCE CHECKLIST**
- [ ] Database indexes optimized
- [ ] File uploads to cloud storage
- [ ] CDN for static assets
- [ ] Caching implemented
- [ ] Database connection pooling

### **MONITORING CHECKLIST**
- [ ] Error tracking (Sentry)
- [ ] Performance monitoring
- [ ] Log aggregation
- [ ] Health checks
- [ ] Backup strategy

## 🔗 **SERVICE PROVIDERS**

### **Required Services**
1. **Supabase** (Database) - ✅ Already configured
2. **SendGrid** (Email) - Get API key from sendgrid.com
3. **Stripe** (Payments) - Get keys from stripe.com

### **Optional Services**
1. **Cloudinary** (File Upload) - Get from cloudinary.com
2. **Google Cloud** (Maps) - Get API keys from console.cloud.google.com
3. **Mixpanel** (Analytics) - Get token from mixpanel.com

## 🆘 **TROUBLESHOOTING**

### **Common Issues**

#### **SMS Not Working**
- ✅ Your Twilio config is correct (API Key format)
- Check phone number format: +971XXXXXXXXX
- Verify Twilio account has credits

#### **Email Not Working**
- Verify SendGrid API key is active
- Check sender email is verified in SendGrid
- Review SendGrid activity logs

#### **File Upload Issues**
- Without Cloudinary: Uses mock URLs (development OK)
- For production: Configure Cloudinary credentials
- Check file size limits (10MB documents, 5MB images)

#### **Database Connection Issues**
- Verify Supabase URL and service role key
- Check network connectivity
- Review Supabase project status

## 📞 **SUPPORT**

If you encounter issues:
1. Check console logs for error messages
2. Verify environment variables are set
3. Test individual services separately
4. Review service provider documentation

## 🎯 **NEXT STEPS**

1. **Immediate**: Configure Stripe for payments
2. **Short-term**: Set up Cloudinary for file uploads
3. **Long-term**: Add monitoring and analytics 