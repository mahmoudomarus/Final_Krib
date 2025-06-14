require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const bcrypt = require('bcryptjs');

// Initialize Supabase admin client
const supabaseAdmin = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

async function createFirstAdmin() {
  console.log('👑 Creating first admin user...');
  
  // Replace with your real email and details
  const adminData = {
    email: 'admin@krib.ae', // Replace with your real email
    password: 'Admin123!@#', // Strong password
    firstName: 'Admin',
    lastName: 'Krib'
  };
  
  try {
    console.log('🔧 Creating Supabase Auth user...');
    
    // Create user in Supabase Auth
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: adminData.email,
      password: adminData.password,
      email_confirm: true // Auto-confirm for admin
    });

    if (authError) {
      console.error('❌ Supabase Auth error:', authError.message);
      return;
    }

    console.log('✅ Supabase Auth user created');
    
    // Create user profile in custom users table
    const { data: userProfile, error: profileError } = await supabaseAdmin
      .from('users')
      .insert({
        id: authData.user.id,
        email: adminData.email,
        first_name: adminData.firstName,
        last_name: adminData.lastName,
        is_host: true,
        is_agent: true, // Admin flag
        is_verified: true, // Auto-verify admin
        is_active: true,
        password: 'supabase_auth' // Placeholder since column exists
      })
      .select()
      .single();

    if (profileError) {
      console.error('❌ Profile creation error:', profileError.message);
      // Clean up auth user if profile creation fails
      await supabaseAdmin.auth.admin.deleteUser(authData.user.id);
      return;
    }

    console.log('✅ Admin user created successfully!');
    console.log('📧 Email:', adminData.email);
    console.log('🔐 Password:', adminData.password);
    console.log('🎯 Profile ID:', userProfile.id);
    console.log('👑 Admin Status: Enabled');
    console.log('✅ Email Verified: Yes');
    console.log('');
    console.log('🎉 Admin account is ready to use!');
    
  } catch (error) {
    if (error.message?.includes('duplicate') || error.message?.includes('already exists')) {
      console.log('ℹ️  Admin user already exists with this email.');
    } else {
      console.error('❌ Error creating admin:', error.message);
    }
  }
  
  process.exit(0);
}

// You can also create a regular host user
async function createHostUser() {
  console.log('🏠 Creating host user...');
  
  const hostData = {
    email: 'host@krib.ae', // Replace with real email
    password: 'Host123!@#',
    firstName: 'Host',
    lastName: 'User',
    isHost: true
  };
  
  try {
    // Create user in Supabase Auth
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: hostData.email,
      password: hostData.password,
      email_confirm: false // Require email verification for regular users
    });

    if (authError) {
      console.error('❌ Supabase Auth error:', authError.message);
      return;
    }

    // Create user profile in custom users table
    const { data: userProfile, error: profileError } = await supabaseAdmin
      .from('users')
      .insert({
        id: authData.user.id,
        email: hostData.email,
        first_name: hostData.firstName,
        last_name: hostData.lastName,
        is_host: hostData.isHost,
        is_agent: false,
        is_verified: false,
        is_active: true
      })
      .select()
      .single();

    if (profileError) {
      console.error('❌ Profile creation error:', profileError.message);
      await supabaseAdmin.auth.admin.deleteUser(authData.user.id);
      return;
    }
    
    console.log('✅ Host user created successfully!');
    console.log('📧 Email:', hostData.email);
    console.log('🔐 Password:', hostData.password);
    console.log('');
    console.log('⚠️  IMPORTANT: Check email to verify the account!');
    
  } catch (error) {
    console.error('❌ Error creating host:', error.message);
  }
}

// Run the admin creation
createFirstAdmin()
  .then(() => {
    console.log('🎉 Admin creation completed!');
  })
  .catch(console.error);

async function createAdminUser() {
  try {
    // Hash the password
    const hashedPassword = await bcrypt.hash('admin123', 10);
    
    // Create admin user
    const { data, error } = await supabaseAdmin
      .from('users')
      .insert([
        {
          email: 'admin@krib.ae',
          password: hashedPassword,
          first_name: 'Admin',
          last_name: 'User',
          is_agent: true,
          is_host: false,
          phone: '+971501234567',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
      ])
      .select();

    if (error) {
      console.error('Error creating admin user:', error);
    } else {
      console.log('Admin user created successfully:', data);
    }
  } catch (error) {
    console.error('Error:', error);
  }
}

createAdminUser(); 