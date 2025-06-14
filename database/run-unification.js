const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: '../backend/.env' });

// Create Supabase client with service role key for full access
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

async function runUnification() {
  console.log('🔧 RUNNING SUPABASE SCHEMA UNIFICATION');
  console.log('=' .repeat(80));
  console.log(`📡 Connected to: ${process.env.SUPABASE_URL}`);
  console.log('=' .repeat(80));

  try {
    // Read the unification SQL script
    const sqlScript = fs.readFileSync(path.join(__dirname, 'unify-supabase-schema.sql'), 'utf8');
    
    console.log('\n📋 Executing unification script...');
    console.log('⏳ This may take a few moments...\n');

    // For Supabase, we'll execute the script in smaller chunks
    // since we can't use rpc('exec_sql') without creating it first
    
    console.log('✅ Schema unification script prepared');
    console.log('📝 Please run this script manually in your Supabase SQL Editor:');
    console.log('   1. Go to your Supabase Dashboard');
    console.log('   2. Navigate to SQL Editor');
    console.log('   3. Copy and paste the contents of unify-supabase-schema.sql');
    console.log('   4. Execute the script');
    
    // Verify current state
    console.log('\n' + '=' .repeat(80));
    console.log('🔍 CURRENT DATABASE STATE:');
    console.log('=' .repeat(80));
    
    await verifyCurrentState();

    console.log('\n📋 RECOMMENDED NEXT STEPS:');
    console.log('1. Run the unify-supabase-schema.sql script in Supabase SQL Editor');
    console.log('2. Run this verification script again to confirm changes');
    console.log('3. Test your backend services');

  } catch (error) {
    console.error('💥 Verification failed:', error);
    process.exit(1);
  }
}

async function verifyCurrentState() {
  const criticalTables = [
    'users', 'properties', 'bookings', 'payments', 'reviews',
    'conversations', 'messages', 'notifications', 'analytics_events',
    'agent_wallets', 'wallet_transactions', 'payment_methods'
  ];

  console.log('🔍 Checking current table state...');

  for (const tableName of criticalTables) {
    try {
      const { data, error, count } = await supabase
        .from(tableName)
        .select('*', { count: 'exact', head: true });

      if (error) {
        console.log(`❌ ${tableName}: ${error.message}`);
      } else {
        console.log(`✅ ${tableName}: ${count || 0} records`);
      }
    } catch (error) {
      console.log(`❌ ${tableName}: Table check failed`);
    }
  }

  // Check for specific fields that services need
  console.log('\n🔍 Checking critical fields...');
  
  try {
    // Check users table for required fields
    const { data: userSample } = await supabase
      .from('users')
      .select('id, email, first_name, is_host, is_agent, created_at')
      .limit(1);
    
    if (userSample && userSample.length > 0) {
      const user = userSample[0];
      console.log('✅ Users table has required fields:', Object.keys(user).join(', '));
    }
  } catch (error) {
    console.log('⚠️  Could not verify user fields');
  }

  try {
    // Check properties table for required fields
    const { data: propSample } = await supabase
      .from('properties')
      .select('id, title, host_id, verification_status, created_at')
      .limit(1);
    
    if (propSample && propSample.length > 0) {
      const prop = propSample[0];
      console.log('✅ Properties table has required fields:', Object.keys(prop).join(', '));
    }
  } catch (error) {
    console.log('⚠️  Could not verify property fields');
  }
}

// Run the verification
runUnification()
  .then(() => {
    console.log('\n🎉 Verification completed!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Verification failed:', error);
    process.exit(1);
  }); 