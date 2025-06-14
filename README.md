# 🏠 UAE Rental Platform

A comprehensive Airbnb-style rental platform specifically designed for the UAE market, featuring property listings, booking management, agent dashboards, and advanced analytics.

## 📁 Project Structure

```
UAE_krib_clean/
├── frontend/          # React.js frontend application
├── backend/           # Node.js/Express backend API
├── database/          # Database schemas, migrations & scripts
├── docs/              # Documentation and guides
├── scripts/           # Deployment and utility scripts
├── .github/           # GitHub Actions workflows
└── README.md          # This file
```

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ 
- npm 8+
- PostgreSQL (for production) or SQLite (for development)
- Supabase account (recommended)

### Installation

1. **Clone and install dependencies:**
```bash
git clone <repository-url>
cd UAE_krib_clean
npm run install:all
```

2. **Set up environment variables:**
```bash
# Copy environment template
cp .env.example .env

# Edit .env with your configuration
# - Database URLs
# - API keys (Stripe, Supabase, etc.)
# - JWT secrets
```

3. **Set up the database:**
```bash
# Generate Prisma client
npm run db:generate

# Run migrations
npm run db:migrate

# Seed with sample data (optional)
npm run db:seed
```

4. **Start development servers:**
```bash
# Start both frontend and backend
npm run dev

# Or start individually:
npm run dev:frontend  # Frontend on http://localhost:3000
npm run dev:backend   # Backend on http://localhost:5001
```

## 🏗️ Architecture

### Frontend (`/frontend`)
- **Framework:** React 18 with TypeScript
- **Styling:** Tailwind CSS
- **State Management:** Context API + Custom hooks
- **Routing:** React Router v6
- **Build Tool:** Create React App with Craco

### Backend (`/backend`)
- **Framework:** Node.js + Express + TypeScript
- **Database:** Prisma ORM with PostgreSQL/Supabase
- **Authentication:** JWT + Supabase Auth
- **File Storage:** AWS S3 (configured)
- **Payment:** Stripe integration

### Database (`/database`)
- **ORM:** Prisma
- **Database:** PostgreSQL (Supabase)
- **Migrations:** Prisma migrations
- **Schemas:** Complete UAE rental platform schema

## 🎯 Key Features

### ✅ **Working Features:**
- **Agent Dashboard** - Complete property management, calendar, analytics
- **Authentication System** - JWT + Supabase integration
- **Database Schema** - Full Prisma setup with all tables
- **Property Management** - CRUD operations for properties
- **Booking Calendar** - Real-time availability management
- **User Management** - Host, Guest, Agent, Admin roles

### ⚠️ **Needs Real Data Integration:**
- **Search Page** - Currently uses mock property data
- **Property Details** - Hardcoded property information
- **Booking Flow** - Simulated booking process
- **Reviews System** - Mock review data
- **Payment Processing** - Stripe setup but not fully integrated
- **Messaging** - Mock conversation data

## 🛠️ Development Commands

```bash
# Development
npm run dev                 # Start both frontend & backend
npm run dev:frontend        # Frontend only
npm run dev:backend         # Backend only

# Building
npm run build              # Build both applications
npm run build:frontend     # Build frontend only
npm run build:backend      # Build backend only

# Testing
npm run test               # Run all tests
npm run test:frontend      # Frontend tests
npm run test:backend       # Backend tests

# Database
npm run db:migrate         # Run Prisma migrations
npm run db:generate        # Generate Prisma client
npm run db:studio          # Open Prisma Studio
npm run db:seed            # Seed database

# Utilities
npm run clean              # Clean node_modules
npm run install:all        # Install all dependencies
```

## 🔧 Configuration

### Environment Variables

Create `.env` file in the root directory:

```env
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/uae_rental"
SUPABASE_URL="your-supabase-url"
SUPABASE_ANON_KEY="your-supabase-anon-key"

# Authentication
JWT_SECRET="your-jwt-secret"
JWT_EXPIRES_IN="7d"

# Payment
STRIPE_SECRET_KEY="sk_test_..."
STRIPE_PUBLISHABLE_KEY="pk_test_..."

# File Storage
AWS_ACCESS_KEY_ID="your-aws-access-key"
AWS_SECRET_ACCESS_KEY="your-aws-secret-key"
AWS_S3_BUCKET="your-s3-bucket"
AWS_REGION="us-east-1"

# Email
SENDGRID_API_KEY="your-sendgrid-key"

# External APIs
GOOGLE_MAPS_API_KEY="your-google-maps-key"
```

## 📊 Current Status

### ✅ Production Ready:
- Agent dashboard with real data
- Authentication system
- Database schema and migrations
- Backend API structure
- Deployment configuration

### 🔄 Needs Integration:
- Frontend mock data → Real API calls
- Payment processing completion
- File upload implementation
- Real-time messaging
- Email notifications

### 📈 Next Steps:
1. Replace frontend mock data with real API calls
2. Complete Stripe payment integration
3. Implement file upload for property images
4. Add real-time messaging system
5. Set up email notifications
6. Deploy to production

## 🚀 Deployment

### Frontend (Netlify/Vercel)
```bash
cd frontend
npm run build
# Deploy dist/ folder
```

### Backend (Railway/Render)
```bash
cd backend
npm run build
# Deploy with environment variables
```

### Database (Supabase)
- Already configured for Supabase
- Run migrations in production
- Set up RLS policies

## 📚 Documentation

Detailed documentation available in `/docs`:
- API Integration Plan
- Database Schema Guide
- Deployment Guide
- Production Roadmap

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run tests
5. Submit a pull request

## 📄 License

MIT License - see LICENSE file for details.

---

**Note:** This is a clean, production-ready structure. All test files, mock data scripts, and duplicate configurations have been removed. The project is now properly organized for development and deployment. 