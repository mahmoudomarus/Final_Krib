const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function createAdminUser() {
  const adminEmail = 'admin@krib.ae';
  const adminPassword = 'admin123';

  try {
    console.log('Creating admin user...');

    // First, try to delete existing admin user if it exists
    try {
      const { data: existingUsers } = await supabase.auth.admin.listUsers();
      const existingAdmin = existingUsers.users.find(user => user.email === adminEmail);
      
      if (existingAdmin) {
        console.log('Deleting existing admin user from auth...');
        await supabase.auth.admin.deleteUser(existingAdmin.id);
      }

      // Also delete from users table
      await supabase
        .from('users')
        .delete()
        .eq('email', adminEmail);
      
      console.log('Cleaned up existing admin user');
    } catch (error) {
      console.log('No existing admin user to clean up');
    }

    // Create admin user in Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: adminEmail,
      password: adminPassword,
      email_confirm: true, // Auto-confirm email for admin
      user_metadata: {
        first_name: 'Admin',
        last_name: 'User'
      }
    });

    if (authError) {
      console.error('Auth creation error:', authError);
      return;
    }

    console.log('Admin user created in auth:', authData.user.id);

    // Create admin user profile in users table
    const { data: userProfile, error: profileError } = await supabase
      .from('users')
      .insert({
        id: authData.user.id,
        email: adminEmail,
        first_name: 'Admin',
        last_name: 'User',
        phone: '+971-4-123-4567',
        nationality: 'AE',
        is_host: false,
        is_agent: true, // Admin is an agent
        is_verified: true, // Admin is pre-verified
        is_active: true,
        is_suspended: false,
        password: 'supabase_auth', // Placeholder
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single();

    if (profileError) {
      console.error('Profile creation error:', profileError);
      // Clean up auth user if profile creation fails
      await supabase.auth.admin.deleteUser(authData.user.id);
      return;
    }

    console.log('Admin user profile created:', userProfile.id);

    // Verify the user can login
    console.log('Testing admin login...');
    const { data: loginData, error: loginError } = await supabase.auth.signInWithPassword({
      email: adminEmail,
      password: adminPassword
    });

    if (loginError) {
      console.error('Login test failed:', loginError);
    } else {
      console.log('✅ Admin login test successful!');
      console.log('Admin user details:');
      console.log('- Email:', adminEmail);
      console.log('- Password:', adminPassword);
      console.log('- ID:', loginData.user.id);
      console.log('- Email confirmed:', loginData.user.email_confirmed_at ? 'Yes' : 'No');
    }

  } catch (error) {
    console.error('Error creating admin user:', error);
  }
}

createAdminUser();