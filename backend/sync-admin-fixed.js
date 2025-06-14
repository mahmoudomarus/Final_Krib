require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const bcrypt = require('bcryptjs');

// Use the same environment variables as the server
const supabaseUrl = process.env.SUPABASE_URL || 'https://yxtcwqczkbgwpgzvbubq.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

console.log('Supabase URL:', supabaseUrl);
console.log('Service Key exists:', !!supabaseServiceKey);

if (!supabaseServiceKey) {
  console.error('SUPABASE_SERVICE_ROLE_KEY not found in environment variables');
  console.log('Available env vars:', Object.keys(process.env).filter(key => key.includes('SUPABASE')));
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function syncAdminUser() {
  try {
    // First check if admin user already exists
    const { data: existingUser } = await supabase
      .from('users')
      .select('*')
      .eq('email', 'admin@krib.ae')
      .single();

    if (existingUser) {
      console.log('Admin user already exists:', existingUser);
      return;
    }

    // Hash a default password for the admin user
    const hashedPassword = await bcrypt.hash('admin123', 10);
    
    // Create admin user in our users table
    const { data, error } = await supabase
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
      console.log('Admin user synced successfully:', data);
    }
  } catch (error) {
    console.error('Error:', error);
  }
}

syncAdminUser(); 