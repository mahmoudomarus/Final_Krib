require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

// Use the same environment variables as the server
const supabaseUrl = process.env.SUPABASE_URL || 'https://yxtcwqczkbgwpgzvbubq.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

console.log('Supabase URL:', supabaseUrl);
console.log('Service Key exists:', !!supabaseServiceKey);

if (!supabaseServiceKey) {
  console.error('SUPABASE_SERVICE_ROLE_KEY not found in environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function fixAdminAuth() {
  try {
    console.log('🔍 Checking admin user in Supabase Auth...');
    
    // First, try to get the admin user from Supabase Auth
    const { data: authUsers, error: listError } = await supabase.auth.admin.listUsers();
    
    if (listError) {
      console.error('Error listing auth users:', listError);
      return;
    }
    
    console.log('📋 Found', authUsers.users.length, 'auth users');
    
    const adminAuthUser = authUsers.users.find(user => user.email === 'admin@krib.ae');
    
    if (adminAuthUser) {
      console.log('✅ Admin user found in Supabase Auth:', {
        id: adminAuthUser.id,
        email: adminAuthUser.email,
        email_confirmed_at: adminAuthUser.email_confirmed_at,
        created_at: adminAuthUser.created_at
      });
      
      // If email is not confirmed, confirm it
      if (!adminAuthUser.email_confirmed_at) {
        console.log('📧 Confirming admin email...');
        const { error: confirmError } = await supabase.auth.admin.updateUserById(
          adminAuthUser.id,
          { email_confirm: true }
        );
        
        if (confirmError) {
          console.error('Error confirming email:', confirmError);
        } else {
          console.log('✅ Admin email confirmed');
        }
      }
      
      // Update the users table to match the auth user ID
      console.log('🔄 Updating users table...');
      const { error: updateError } = await supabase
        .from('users')
        .update({ id: adminAuthUser.id })
        .eq('email', 'admin@krib.ae');
        
      if (updateError) {
        console.error('Error updating users table:', updateError);
      } else {
        console.log('✅ Users table updated');
      }
      
    } else {
      console.log('❌ Admin user not found in Supabase Auth, creating...');
      
      // Create admin user in Supabase Auth
      const { data: newAuthUser, error: createError } = await supabase.auth.admin.createUser({
        email: 'admin@krib.ae',
        password: 'admin123',
        email_confirm: true // Auto-confirm email
      });
      
      if (createError) {
        console.error('Error creating auth user:', createError);
        return;
      }
      
      console.log('✅ Admin user created in Supabase Auth:', newAuthUser.user.id);
      
      // Update the users table with the new auth user ID
      const { error: updateError } = await supabase
        .from('users')
        .update({ id: newAuthUser.user.id })
        .eq('email', 'admin@krib.ae');
        
      if (updateError) {
        console.error('Error updating users table:', updateError);
      } else {
        console.log('✅ Users table updated with new auth ID');
      }
    }
    
    console.log('🎉 Admin authentication setup complete!');
    console.log('🔑 You can now login with: admin@krib.ae / admin123');
    
  } catch (error) {
    console.error('Error:', error);
  }
}

fixAdminAuth(); 