const { createClient } = require('@supabase/supabase-js');
const bcrypt = require('bcryptjs');
const dotenv = require('dotenv');

// Load environment variables from .env file
dotenv.config();

// Initialize Supabase client using environment variables
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing required environment variables:');
  console.error('   SUPABASE_URL:', supabaseUrl ? '✅ Set' : '❌ Missing');
  console.error('   SUPABASE_SERVICE_ROLE_KEY:', supabaseKey ? '✅ Set' : '❌ Missing');
  process.exit(1);
}

console.log('🔧 Using Supabase configuration:');
console.log('   URL:', supabaseUrl);
console.log('   Service Key:', supabaseKey ? '✅ Loaded' : '❌ Missing');
console.log('');

const supabase = createClient(supabaseUrl, supabaseKey);

const testAccounts = [
  {
    type: 'guest',
    email: 'guest.test@example.com',
    password: 'TestGuest123!',
    firstName: 'Test',
    lastName: 'Guest',
    phone: '+971501234567',
    nationality: 'AE',
    isHost: false,
    isAgent: false
  },
  {
    type: 'host',
    email: 'host.test@example.com',
    password: 'TestHost123!',
    firstName: 'Test',
    lastName: 'Host',
    phone: '+971501234568',
    nationality: 'AE',
    isHost: true,
    isAgent: false
  },
  {
    type: 'agent',
    email: 'agent.test@example.com',
    password: 'TestAgent123!',
    firstName: 'Test',
    lastName: 'Agent',
    phone: '+971501234569',
    nationality: 'AE',
    isHost: false,
    isAgent: true,
    companyName: 'Test Real Estate LLC'
  },
  {
    type: 'super_admin',
    email: 'admin.test@example.com',
    password: 'TestAdmin123!',
    firstName: 'Test',
    lastName: 'Admin',
    phone: '+971501234570',
    nationality: 'AE',
    isHost: false,
    isAgent: true // Super admin is marked as agent with admin email
  }
];

async function createTestAccounts() {
  console.log('🚀 Creating test accounts for authentication testing...\n');

  for (const account of testAccounts) {
    try {
      console.log(`📝 Creating ${account.type} account: ${account.email}`);

      // Check if user already exists
      const { data: existingUser } = await supabase
        .from('users')
        .select('id, email')
        .eq('email', account.email)
        .single();

      if (existingUser) {
        console.log(`   ⚠️  User already exists - skipping`);
        continue;
      }

      // Create user in Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email: account.email,
        password: account.password,
        email_confirm: true, // Auto-confirm for testing
        user_metadata: {
          full_name: `${account.firstName} ${account.lastName}`,
          role: account.type
        }
      });

      if (authError || !authData.user) {
        console.error(`   ❌ Auth creation failed:`, authError);
        continue;
      }

      // Create user profile in custom users table
      const userInsertData = {
        id: authData.user.id,
        email: account.email,
        first_name: account.firstName,
        last_name: account.lastName,
        phone: account.phone,
        nationality: account.nationality,
        is_host: account.isHost,
        is_agent: account.isAgent,
        is_verified: true, // Auto-verify for testing
        is_active: true,
        password: 'supabase_auth', // Placeholder
        company_name: account.companyName || null,
        country: 'UAE',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      const { data: userProfile, error: profileError } = await supabase
        .from('users')
        .insert(userInsertData)
        .select()
        .single();

      if (profileError) {
        console.error(`   ❌ Profile creation failed:`, profileError);
        // Clean up auth user
        await supabase.auth.admin.deleteUser(authData.user.id);
        continue;
      }

      console.log(`   ✅ Created successfully`);
      console.log(`      - Auth ID: ${authData.user.id}`);
      console.log(`      - Email: ${account.email}`);
      console.log(`      - Password: ${account.password}`);
      console.log(`      - Role: ${account.type}`);
      console.log(`      - Dashboard: ${getDashboardUrl(account.type)}`);
      console.log('');

    } catch (error) {
      console.error(`   ❌ Unexpected error creating ${account.type}:`, error);
    }
  }

  console.log('✨ Test account creation complete!\n');
  console.log('📋 ACCOUNT SUMMARY:');
  console.log('==================');
  
  for (const account of testAccounts) {
    console.log(`${account.type.toUpperCase()}:`);
    console.log(`  Email: ${account.email}`);
    console.log(`  Password: ${account.password}`);
    console.log(`  Login URL: http://localhost:3001${getLoginUrl(account.type)}`);
    console.log(`  Dashboard: http://localhost:3001${getDashboardUrl(account.type)}`);
    console.log('');
  }

  console.log('🔐 AUTHENTICATION TESTING GUIDE:');
  console.log('=================================');
  console.log('1. GUEST ACCOUNT:');
  console.log('   - Can access main site and search properties');
  console.log('   - Can make bookings');
  console.log('   - Redirects to home page after login');
  console.log('');
  console.log('2. HOST ACCOUNT:');
  console.log('   - Can list properties for short-term rentals');
  console.log('   - Access to host dashboard');
  console.log('   - Google authentication available');
  console.log('');
  console.log('3. AGENT ACCOUNT:');
  console.log('   - Company account for long-term rentals');
  console.log('   - Access to isolated /listers dashboard (no main site header/footer)');
  console.log('   - NO Google authentication (compliance requirement)');
  console.log('   - Email and phone verification required');
  console.log('');
  console.log('4. SUPER ADMIN:');
  console.log('   - Full system access');
  console.log('   - Access to admin dashboard');
  console.log('   - Can create other admin accounts');
  console.log('');
  console.log('🚨 IMPORTANT TESTING NOTES:');
  console.log('===========================');
  console.log('- All accounts are pre-verified for testing');
  console.log('- Use different browsers/incognito for testing multiple roles');
  console.log('- Agent dashboard (/listers) should have NO main site header/footer');
  console.log('- Google OAuth should NOT be available for agent registration');
  console.log('- Each role should redirect to its appropriate dashboard after login');
}

function getLoginUrl(type) {
  switch (type) {
    case 'agent':
      return '/listers/login';
    case 'super_admin':
      return '/admin/login';
    default:
      return '/login';
  }
}

function getDashboardUrl(type) {
  switch (type) {
    case 'guest':
      return '/';
    case 'host':
      return '/host/dashboard';
    case 'agent':
      return '/listers';
    case 'super_admin':
      return '/admin/dashboard';
    default:
      return '/';
  }
}

// Run the script
if (require.main === module) {
  createTestAccounts().catch(console.error);
}

module.exports = { createTestAccounts }; 