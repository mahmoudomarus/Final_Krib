const { createClient } = require('@supabase/supabase-js');
const bcrypt = require('bcryptjs');

const supabase = createClient(
  'https://yxtcwqczkbgwpgzvbubq.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl4dGN3cWN6a2Jnd3BnenZidWJxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzQ5NzE5NzQsImV4cCI6MjA1MDU0Nzk3NH0.Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8'
);

async function syncAdminUser() {
  try {
    // Hash a default password for the admin user
    const hashedPassword = await bcrypt.hash('admin123', 10);
    
    // Create admin user in our users table to match the Supabase Auth user
    const { data, error } = await supabase
      .from('users')
      .insert([
        {
          id: '0236e7ac-a0f4-43e5-a6b8-a0e8d8f244a',  // Use the ID from Supabase Auth
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