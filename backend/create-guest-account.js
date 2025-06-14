const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function createGuestAccount() {
  try {
    console.log('📝 Creating guest account with unique phone...');
    
    const authResult = await supabase.auth.admin.createUser({
      email: 'guest.test@example.com',
      password: 'TestGuest123!',
      email_confirm: true,
      user_metadata: { full_name: 'Test Guest', role: 'guest' }
    });

    if (authResult.error) {
      console.error('❌ Auth error:', authResult.error);
      return;
    }

    const userResult = await supabase.from('users').insert({
      id: authResult.data.user.id,
      email: 'guest.test@example.com',
      first_name: 'Test',
      last_name: 'Guest',
      phone: '+971501234599',
      nationality: 'AE',
      is_host: false,
      is_agent: false,
      is_verified: true,
      is_active: true,
      password: 'supabase_auth',
      country: 'UAE',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }).select().single();

    if (userResult.error) {
      console.error('❌ Profile error:', userResult.error);
      await supabase.auth.admin.deleteUser(authResult.data.user.id);
      return;
    }

    console.log('✅ Guest account created successfully!');
    console.log('   Email: guest.test@example.com');
    console.log('   Password: TestGuest123!');
    console.log('   Phone: +971501234599');
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

createGuestAccount(); 