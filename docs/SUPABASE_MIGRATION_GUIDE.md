# UAE Rental Platform - Supabase Migration Guide

## 🎯 **MIGRATION STATUS**
✅ **Environment configured** with your Supabase credentials  
✅ **SQL migration script created** (`supabase_migration.sql`)  
✅ **Supabase client libraries installed** (frontend & backend)  
⏳ **Ready to execute migration**

---

## 🚀 **STEP 1: Execute Database Migration**

### **Option A: Using Supabase Dashboard (Recommended)**
1. **Go to your Supabase dashboard**: https://yxtcwqczkbgwpgzvbubq.supabase.co
2. **Navigate to**: SQL Editor → New Query
3. **Copy & paste** the entire content from `supabase_migration.sql`
4. **Click "Run"** to execute the migration
5. **Verify**: Check Tables tab to confirm all tables were created

### **Option B: Using Supabase CLI** (If authentication works)
```bash
# Run this in your project directory
supabase db push --local=false
```

---

## 🔧 **STEP 2: Update Database Connection**

Your current `.env` file needs the database password. You'll need to:

1. **Get your database password** from Supabase Dashboard:
   - Go to Settings → Database
   - Copy the password from the connection string

2. **Update the DATABASE_URL** in `server/.env`:
```env
DATABASE_URL="postgresql://postgres.yxtcwqczkbgwpgzvbubq:YOUR_ACTUAL_PASSWORD@aws-0-me-south-1.pooler.supabase.com:6543/postgres?pgbouncer=true&connection_limit=1"
```

---

## 🧹 **STEP 3: Clean Up Mock Data**

### **3.1 Remove Seed File Mock Data**
```bash
# Navigate to server directory
cd server

# Backup original seed file
mv prisma/seed.ts prisma/seed.ts.backup

# Create new minimal seed file (for production)
```

### **3.2 Create Production Seed File**
Replace `server/prisma/seed.ts` with:
```typescript
import { supabaseAdmin } from '../src/lib/supabase';
import bcrypt from 'bcryptjs';

async function main() {
  console.log('🌱 Production seeding...');
  
  // Only create one admin user for production
  const adminPassword = await bcrypt.hash('ChangeMe2024!', 12);
  
  const { data: admin, error } = await supabaseAdmin
    .from('users')
    .insert({
      email: 'admin@yourdomain.com',
      password: adminPassword,
      first_name: 'Platform',
      last_name: 'Administrator',
      is_agent: true,
      is_verified: true,
      city: 'Dubai',
      emirate: 'Dubai',
      country: 'UAE'
    })
    .select()
    .single();

  if (error) {
    console.error('❌ Error creating admin:', error);
  } else {
    console.log('✅ Admin user created:', admin.email);
  }
}

main()
  .catch((e) => console.error(e))
  .finally(() => process.exit(0));
```

---

## 🔄 **STEP 4: Update Authentication System**

### **4.1 Replace Custom Auth with Supabase Auth**

Create new auth service: `server/src/services/auth.service.ts`
```typescript
import { supabaseAdmin, supabase } from '../lib/supabase';
import { AuthApiError } from '@supabase/supabase-js';

export class AuthService {
  // User registration with Supabase Auth
  static async register(email: string, password: string, userData: any) {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: userData // Additional user metadata
      }
    });
    
    if (error) throw error;
    return data;
  }
  
  // User login
  static async login(email: string, password: string) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });
    
    if (error) throw error;
    return data;
  }
  
  // Get user profile
  static async getProfile(userId: string) {
    const { data, error } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();
      
    if (error) throw error;
    return data;
  }
}
```

### **4.2 Update Frontend Auth**

Create: `src/hooks/useAuth.ts`
```typescript
import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import type { User, Session } from '@supabase/supabase-js';

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const signIn = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });
    return { data, error };
  };

  const signUp = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password
    });
    return { data, error };
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    return { error };
  };

  return {
    user,
    session,
    loading,
    signIn,
    signUp,
    signOut
  };
}
```

---

## 📝 **STEP 5: Replace Mock Data with Real API Calls**

### **5.1 Create Supabase Data Services**

Create: `src/services/properties.service.ts`
```typescript
import { supabase } from '../lib/supabase';

export class PropertiesService {
  static async getProperties(filters?: any) {
    let query = supabase
      .from('properties')
      .select('*, host:users(*)')
      .eq('is_active', true);
    
    if (filters?.emirate) {
      query = query.eq('emirate', filters.emirate);
    }
    
    if (filters?.type) {
      query = query.eq('type', filters.type);
    }
    
    const { data, error } = await query;
    if (error) throw error;
    return data;
  }
  
  static async getProperty(id: string) {
    const { data, error } = await supabase
      .from('properties')
      .select('*, host:users(*), reviews(*)')
      .eq('id', id)
      .single();
      
    if (error) throw error;
    return data;
  }
  
  static async createProperty(propertyData: any) {
    const { data, error } = await supabase
      .from('properties')
      .insert(propertyData)
      .select()
      .single();
      
    if (error) throw error;
    return data;
  }
}
```

### **5.2 Update Frontend Components**

Replace mock data in components like:
- `src/pages/SearchPage.tsx`
- `src/pages/PropertyDetailPage.tsx`
- `src/pages/host/HostDashboardPage.tsx`

Example for SearchPage:
```typescript
// Replace the mock data with:
const [properties, setProperties] = useState([]);
const [loading, setLoading] = useState(true);

useEffect(() => {
  const fetchProperties = async () => {
    try {
      const data = await PropertiesService.getProperties(filters);
      setProperties(data);
    } catch (error) {
      console.error('Error fetching properties:', error);
    } finally {
      setLoading(false);
    }
  };
  
  fetchProperties();
}, [filters]);
```

---

## 🔐 **STEP 6: Implement File Storage**

### **6.1 Enable Supabase Storage**
1. Go to Storage in Supabase Dashboard
2. Create bucket: `property-images`
3. Set bucket to public for property images

### **6.2 Create Upload Service**
```typescript
// src/services/upload.service.ts
import { supabase } from '../lib/supabase';

export class UploadService {
  static async uploadPropertyImage(file: File, propertyId: string) {
    const fileExt = file.name.split('.').pop();
    const fileName = `${propertyId}/${Date.now()}.${fileExt}`;
    
    const { data, error } = await supabase.storage
      .from('property-images')
      .upload(fileName, file);
      
    if (error) throw error;
    
    const { data: { publicUrl } } = supabase.storage
      .from('property-images')
      .getPublicUrl(fileName);
      
    return publicUrl;
  }
}
```

---

## 🧪 **STEP 7: Test the Migration**

### **7.1 Test Database Connection**
```bash
cd server
npm run dev
```

### **7.2 Test Frontend**
```bash
npm start
```

### **7.3 Test User Registration**
- Go to signup page
- Create a new account
- Verify in Supabase Dashboard → Authentication → Users

### **7.4 Test Property Creation**
- Login as host
- Try creating a property
- Verify in Supabase Dashboard → Table Editor → properties

---

## 🚨 **TROUBLESHOOTING**

### **Common Issues:**

1. **Database Connection Error**
   - Verify DATABASE_URL has correct password
   - Check Supabase project status

2. **Authentication Error**
   - Verify SUPABASE_ANON_KEY is correct
   - Check Supabase Auth settings

3. **RLS Policy Error**
   - Temporarily disable RLS for testing:
   ```sql
   ALTER TABLE public.properties DISABLE ROW LEVEL SECURITY;
   ```

### **Database Password Reset:**
If you can't find your database password:
1. Go to Supabase Dashboard → Settings → Database
2. Click "Reset database password"
3. Update your `.env` file with new password

---

## ✅ **NEXT STEPS AFTER MIGRATION**

1. **🔒 Security Hardening**
   - Review RLS policies
   - Set up proper CORS
   - Configure rate limiting

2. **🎨 UI Updates**
   - Replace all mock data calls
   - Update error handling
   - Add loading states

3. **💳 Payment Integration**
   - Set up Stripe/PayPal
   - Implement real payment flow

4. **📧 Email Service**
   - Configure SendGrid
   - Set up email templates

5. **📱 Real-time Features**
   - Implement Supabase realtime for messaging
   - Live booking updates

---

**🎯 Ready to start? Begin with Step 1 - Execute the database migration!** 