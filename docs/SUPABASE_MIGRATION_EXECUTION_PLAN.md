# UAE Krib Platform - Supabase Migration Execution Plan

## 🎯 **MIGRATION OVERVIEW**

**Current State**: Prisma + Local PostgreSQL  
**Target State**: Supabase (PostgreSQL + Auth + Storage)  
**Priority**: User Authentication & Management → End-to-End Testing → Full Migration

---

## 📋 **PRE-MIGRATION CHECKLIST**

### ✅ **Step 1: Environment Setup**
1. **Copy environment variables** from `env-configuration.md`:
   - Frontend: Copy to `.env.local` 
   - Backend: Copy to `server/.env`

2. **Verify Supabase access**:
   ```bash
   # Test Supabase connection
   curl -H "apikey: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl4dGN3cWN6a2Jnd3BnenZidWJxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDkzNDM2ODgsImV4cCI6MjA2NDkxOTY4OH0.CMO-gh5Z4Nup498jS8wY7f54PpXUJ893mU_SxHhV3dE" \
        https://yxtcwqczkbgwpgzvbubq.supabase.co/rest/v1/
   ```

---

## 🚀 **PHASE 1: DATABASE MIGRATION**

### **Step 1: Execute Schema Migration**
1. **Go to Supabase Dashboard**: https://yxtcwqczkbgwpgzvbubq.supabase.co
2. **Navigate to**: SQL Editor → New Query
3. **Execute**: Copy content from `supabase_migration.sql` and run it
4. **Verify**: Check Tables tab - should see all tables created

### **Step 2: Install Supabase Dependencies**
```bash
# Frontend dependencies
npm install @supabase/supabase-js

# Backend dependencies  
cd server
npm install @supabase/supabase-js
```

### **Step 3: Create Supabase Client**
```typescript
// server/src/lib/supabase.ts
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY!

export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)
export const supabase = createClient(supabaseUrl, supabaseAnonKey)
```

```typescript
// src/lib/supabase.ts (frontend)
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
```

---

## 👤 **PHASE 2: USER AUTHENTICATION & MANAGEMENT**

### **Step 1: Update Authentication Service**

**Backend**: Replace `server/src/services/auth.service.ts`:
```typescript
import { supabaseAdmin } from '../lib/supabase';
import bcrypt from 'bcryptjs';

export class AuthService {
  // Register with Supabase Auth + Custom User Table
  static async register(userData: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    phone?: string;
    isHost?: boolean;
  }) {
    // 1. Create user in Supabase Auth
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: userData.email,
      password: userData.password,
      email_confirm: true // Auto-confirm for now
    });

    if (authError) throw authError;

    // 2. Create user profile in custom users table
    const { data: userProfile, error: profileError } = await supabaseAdmin
      .from('users')
      .insert({
        id: authData.user.id, // Use Supabase Auth UUID
        email: userData.email,
        firstName: userData.firstName,
        lastName: userData.lastName,
        phone: userData.phone,
        isHost: userData.isHost || false,
        isVerified: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      })
      .select()
      .single();

    if (profileError) throw profileError;

    return { authData, userProfile };
  }

  // Login with Supabase Auth
  static async login(email: string, password: string) {
    const { data, error } = await supabaseAdmin.auth.signInWithPassword({
      email,
      password
    });

    if (error) throw error;

    // Get user profile
    const profile = await this.getProfile(data.user.id);
    
    return { ...data, profile };
  }

  // Get user profile from custom table
  static async getProfile(userId: string) {
    const { data, error } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();

    if (error) throw error;
    return data;
  }

  // Update user profile
  static async updateProfile(userId: string, updates: any) {
    const { data, error } = await supabaseAdmin
      .from('users')
      .update({
        ...updates,
        updatedAt: new Date().toISOString()
      })
      .eq('id', userId)
      .select()
      .single();

    if (error) throw error;
    return data;
  }
}
```

### **Step 2: Create Test Users**

**Backend**: Create `server/src/scripts/create-test-users.ts`:
```typescript
import { AuthService } from '../services/auth.service';

async function createTestUsers() {
  console.log('🌱 Creating test users...');

  const testUsers = [
    {
      email: 'guest@test.com',
      password: 'password123',
      firstName: 'Test',
      lastName: 'Guest',
      phone: '+971501234567',
      isHost: false
    },
    {
      email: 'host@test.com',
      password: 'password123',
      firstName: 'Test',
      lastName: 'Host', 
      phone: '+971501234568',
      isHost: true
    },
    {
      email: 'admin@test.com',
      password: 'password123',
      firstName: 'Test',
      lastName: 'Admin',
      phone: '+971501234569',
      isHost: true,
      isAgent: true
    },
    {
      email: 'superadmin@test.com',
      password: 'password123',
      firstName: 'Super',
      lastName: 'Admin',
      phone: '+971501234570',
      isHost: true,
      isAgent: true
    }
  ];

  for (const userData of testUsers) {
    try {
      const result = await AuthService.register(userData);
      console.log(`✅ Created user: ${userData.email}`);
      
      // Update admin flags for admin users
      if (userData.email.includes('admin')) {
        await AuthService.updateProfile(result.userProfile.id, {
          isAgent: true,
          isVerified: true
        });
        console.log(`✅ Updated admin flags for: ${userData.email}`);
      }
    } catch (error) {
      console.error(`❌ Error creating ${userData.email}:`, error);
    }
  }
}

createTestUsers().then(() => {
  console.log('🎉 Test users creation completed!');
  process.exit(0);
});
```

### **Step 3: Update Frontend Authentication**

**Frontend**: Create `src/hooks/useAuth.ts`:
```typescript
import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import type { User, Session } from '@supabase/supabase-js';

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      
      if (session?.user) {
        fetchUserProfile(session.user.id);
      } else {
        setLoading(false);
      }
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        
        if (session?.user) {
          await fetchUserProfile(session.user.id);
        } else {
          setUserProfile(null);
          setLoading(false);
        }
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const fetchUserProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) throw error;
      setUserProfile(data);
    } catch (error) {
      console.error('Error fetching user profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const signIn = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });
    return { data, error };
  };

  const signUp = async (email: string, password: string, userData: any) => {
    // First create auth user
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password
    });

    if (authError) return { data: null, error: authError };

    // Then create profile (handled by backend trigger or API call)
    const response = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...userData, email, authUserId: authData.user?.id })
    });

    const profileData = await response.json();
    
    return { data: { ...authData, profile: profileData }, error: null };
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (!error) {
      setUserProfile(null);
    }
    return { error };
  };

  return {
    user,
    session,
    userProfile,
    loading,
    signIn,
    signUp,
    signOut,
    isGuest: userProfile && !userProfile.isHost,
    isHost: userProfile?.isHost,
    isAdmin: userProfile?.isAgent,
    isSuperAdmin: userProfile?.isAgent && userProfile?.email?.includes('superadmin')
  };
}
```

---

## 🧪 **PHASE 3: END-TO-END TESTING PLAN**

### **Test Scenario 1: Guest User Flow**
```bash
# 1. Register as guest
POST /api/auth/register
{
  "email": "newguest@test.com",
  "password": "password123",
  "firstName": "New",
  "lastName": "Guest",
  "isHost": false
}

# 2. Login as guest
POST /api/auth/login
{
  "email": "guest@test.com", 
  "password": "password123"
}

# 3. Search properties
GET /api/properties?emirate=Dubai&type=APARTMENT

# 4. View property details
GET /api/properties/:id

# 5. Create booking (short-term)
POST /api/bookings
{
  "propertyId": "xxx",
  "checkIn": "2024-02-01",
  "checkOut": "2024-02-05",
  "guests": 2
}
```

### **Test Scenario 2: Host User Flow**
```bash
# 1. Login as host
POST /api/auth/login
{
  "email": "host@test.com",
  "password": "password123"
}

# 2. Create property (short-term)
POST /api/properties
{
  "title": "Luxury Apartment in Dubai Marina",
  "rentalType": "SHORT_TERM",
  "type": "APARTMENT",
  "basePrice": 500,
  "bedrooms": 2,
  "bathrooms": 2
}

# 3. Create property (long-term)
POST /api/properties
{
  "title": "Annual Villa Rental",
  "rentalType": "LONG_TERM", 
  "yearlyPrice": 120000,
  "monthlyPrice": 10000,
  "contractMinDuration": 12,
  "permitNumber": "RERA-12345"
}

# 4. View host dashboard
GET /api/host/dashboard

# 5. Manage bookings
GET /api/host/bookings
```

### **Test Scenario 3: Admin User Flow**
```bash
# 1. Login as admin
POST /api/auth/login
{
  "email": "admin@test.com",
  "password": "password123"
}

# 2. View all users
GET /api/admin/users

# 3. Verify property
PUT /api/admin/properties/:id/verify
{
  "verificationStatus": "VERIFIED"
}

# 4. View analytics
GET /api/admin/analytics

# 5. Manage payments
GET /api/admin/payments
```

### **Test Scenario 4: Super Admin Flow**
```bash
# 1. Login as super admin
POST /api/auth/login
{
  "email": "superadmin@test.com",
  "password": "password123"
}

# 2. System health check
GET /api/superadmin/health

# 3. User management
POST /api/superadmin/users/:id/suspend
DELETE /api/superadmin/users/:id

# 4. Financial reports
GET /api/superadmin/reports/financial

# 5. System logs
GET /api/superadmin/logs
```

---

## ⚡ **PHASE 4: EXECUTION STEPS**

### **Step 1: Setup Environment (Today)**
1. Create `.env.local` and `server/.env` with provided configurations
2. Install Supabase dependencies
3. Execute database migration in Supabase Dashboard

### **Step 2: Authentication Migration (Day 1)**
1. Create Supabase client libraries
2. Update authentication service
3. Run test user creation script
4. Update frontend auth hooks

### **Step 3: API Migration (Day 2-3)**
1. Replace Prisma calls with Supabase calls in:
   - User management endpoints
   - Property CRUD operations
   - Booking system
   - Payment handling

### **Step 4: Frontend Integration (Day 4)**
1. Update React components to use Supabase auth
2. Replace mock data with real API calls
3. Update routing and protection

### **Step 5: End-to-End Testing (Day 5)**
1. Test all user role scenarios
2. Verify rental type flows (short-term vs long-term)
3. Test UAE-specific features (permit numbers, etc.)
4. Performance and security testing

---

## 🎯 **SUCCESS CRITERIA**

✅ **Authentication Working**:
- All 4 test users can login/logout
- Role-based access control functioning
- User profiles properly synced

✅ **Core Features Working**:
- Property creation (both rental types)
- Booking system operational  
- Payment processing functional
- Admin/host dashboards working

✅ **UAE-Specific Features**:
- Long-term rental flows
- Permit number validation
- Emirates/city filtering

**Ready to start? Let's begin with Step 1 - Environment Setup!** 