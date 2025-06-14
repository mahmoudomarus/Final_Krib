require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL || 'https://yxtcwqczkbgwpgzvbubq.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function resetAdminPassword() {
  try {
    console.log('🔍 Finding admin user...');
    
    // Get the admin user from Supabase Auth
    const { data: authUsers, error: listError } = await supabase.auth.admin.listUsers();
    
    if (listError) {
      console.error('Error listing auth users:', listError);
      return;
    }
    
    const adminAuthUser = authUsers.users.find(user => user.email === 'admin@krib.ae');
    
    if (!adminAuthUser) {
      console.error('❌ Admin user not found in Supabase Auth');
      return;
    }
    
    console.log('✅ Found admin user:', adminAuthUser.id);
    
    // Reset password
    console.log('🔑 Resetting password to "admin123"...');
    const { error: updateError } = await supabase.auth.admin.updateUserById(
      adminAuthUser.id,
      { 
        password: 'admin123',
        email_confirm: true
      }
    );
    
    if (updateError) {
      console.error('❌ Error updating password:', updateError);
      return;
    }
    
    console.log('✅ Password reset successfully!');
    console.log('🔑 You can now login with: admin@krib.ae / admin123');
    
    // Test the login
    console.log('🧪 Testing login...');
    const { data: loginData, error: loginError } = await supabase.auth.signInWithPassword({
      email: 'admin@krib.ae',
      password: 'admin123'
    });
    
    if (loginError) {
      console.error('❌ Login test failed:', loginError);
    } else {
      console.log('✅ Login test successful!');
      console.log('User ID:', loginData.user.id);
    }
    
  } catch (error) {
    console.error('Error:', error);
  }
}

resetAdminPassword(); 