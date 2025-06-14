const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

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

async function auditSupabaseDatabase() {
  console.log('🔍 COMPREHENSIVE SUPABASE DATABASE AUDIT');
  console.log('=' .repeat(80));
  console.log(`📡 Connected to: ${process.env.SUPABASE_URL}`);
  console.log('=' .repeat(80));

  try {
    // Check common tables individually since we can't rely on system tables
    const commonTables = [
      'users', 'properties', 'bookings', 'payments', 'reviews',
      'conversations', 'messages', 'notifications', 'analytics_events',
      'agent_wallets', 'wallet_transactions', 'payment_methods',
      'property_viewings', 'rental_applications', 'lease_contracts',
      'agent_assignments', 'admin_actions', 'property_views',
      'wishlists', 'unavailable_dates', 'system_logs',
      'conversation_participants'
    ];

    console.log('\n📋 CHECKING ALL TABLES:');
    console.log('-' .repeat(50));

    const tableInfo = [];
    for (const tableName of commonTables) {
      try {
        const { data, error, count } = await supabase
          .from(tableName)
          .select('*', { count: 'exact', head: true });

        if (!error) {
          tableInfo.push({
            table_name: tableName,
            row_count: count || 0,
            status: 'EXISTS'
          });
          console.log(`✅ ${tableName}: ${count || 0} records`);
        } else {
          console.log(`❌ ${tableName}: ${error.message}`);
        }
      } catch (e) {
        console.log(`❌ ${tableName}: Table doesn't exist or access denied`);
      }
    }

    // Detailed analysis of critical tables
    console.log('\n' + '=' .repeat(80));
    console.log('🔍 DETAILED TABLE ANALYSIS:');
    console.log('=' .repeat(80));

    await analyzeUsersTable();
    await analyzePropertiesTable();
    await analyzeBookingsTable();
    await analyzePaymentsTable();
    await analyzeMessagingTables();
    await analyzeAnalyticsTables();
    await analyzeAgentTables();

    // Check for missing tables that services expect
    console.log('\n' + '=' .repeat(80));
    console.log('🚨 MISSING TABLES FOR SERVICES:');
    console.log('=' .repeat(80));
    await checkMissingTablesForServices();

    console.log('\n' + '=' .repeat(80));
    console.log('✅ DATABASE AUDIT COMPLETE');
    console.log('=' .repeat(80));

  } catch (error) {
    console.error('❌ Audit failed:', error);
  }
}

async function analyzeUsersTable() {
  console.log('\n👥 USERS TABLE ANALYSIS:');
  console.log('-' .repeat(30));

  try {
    const { data: users, error } = await supabase
      .from('users')
      .select('id, email, first_name, last_name, is_host, is_agent, is_verified, created_at')
      .limit(5);

    if (error) {
      console.log('❌ Users table error:', error.message);
      return;
    }

    console.log(`✅ Users table exists`);
    
    // Check for required fields
    const { data: userCount } = await supabase
      .from('users')
      .select('*', { count: 'exact', head: true });

    console.log(`📊 Total users: ${userCount || 0}`);

    // Check user types
    const { data: hosts } = await supabase
      .from('users')
      .select('*', { count: 'exact', head: true })
      .eq('is_host', true);

    const { data: agents } = await supabase
      .from('users')
      .select('*', { count: 'exact', head: true })
      .eq('is_agent', true);

    console.log(`🏠 Hosts: ${hosts || 0}`);
    console.log(`🏢 Agents: ${agents || 0}`);

    // Sample user data
    if (users && users.length > 0) {
      console.log('📋 Sample users:');
      users.forEach(user => {
        console.log(`   - ${user.first_name} ${user.last_name} (${user.email})`);
      });
    }

  } catch (error) {
    console.log('❌ Users analysis failed:', error.message);
  }
}

async function analyzePropertiesTable() {
  console.log('\n🏠 PROPERTIES TABLE ANALYSIS:');
  console.log('-' .repeat(30));

  try {
    const { data: properties, error } = await supabase
      .from('properties')
      .select('id, title, type, emirate, verification_status, created_at')
      .limit(5);

    if (error) {
      console.log('❌ Properties table error:', error.message);
      return;
    }

    console.log(`✅ Properties table exists`);
    
    const { data: propCount } = await supabase
      .from('properties')
      .select('*', { count: 'exact', head: true });

    console.log(`📊 Total properties: ${propCount || 0}`);

    // Check verification status
    const { data: verified } = await supabase
      .from('properties')
      .select('*', { count: 'exact', head: true })
      .eq('verification_status', 'VERIFIED');

    console.log(`✅ Verified properties: ${verified || 0}`);

    // Sample properties
    if (properties && properties.length > 0) {
      console.log('📋 Sample properties:');
      properties.forEach(prop => {
        console.log(`   - ${prop.title} (${prop.type}, ${prop.emirate})`);
      });
    }

  } catch (error) {
    console.log('❌ Properties analysis failed:', error.message);
  }
}

async function analyzeBookingsTable() {
  console.log('\n📅 BOOKINGS TABLE ANALYSIS:');
  console.log('-' .repeat(30));

  try {
    const { data: bookings, error } = await supabase
      .from('bookings')
      .select('id, status, total_amount, created_at')
      .limit(5);

    if (error) {
      console.log('❌ Bookings table error:', error.message);
      return;
    }

    console.log(`✅ Bookings table exists`);
    
    const { data: bookingCount } = await supabase
      .from('bookings')
      .select('*', { count: 'exact', head: true });

    console.log(`📊 Total bookings: ${bookingCount || 0}`);

  } catch (error) {
    console.log('❌ Bookings analysis failed:', error.message);
  }
}

async function analyzePaymentsTable() {
  console.log('\n💳 PAYMENTS TABLE ANALYSIS:');
  console.log('-' .repeat(30));

  try {
    const { data: payments, error } = await supabase
      .from('payments')
      .select('id, status, amount, method, created_at')
      .limit(5);

    if (error) {
      console.log('❌ Payments table error:', error.message);
      return;
    }

    console.log(`✅ Payments table exists`);
    
    const { data: paymentCount } = await supabase
      .from('payments')
      .select('*', { count: 'exact', head: true });

    console.log(`📊 Total payments: ${paymentCount || 0}`);

  } catch (error) {
    console.log('❌ Payments analysis failed:', error.message);
  }
}

async function analyzeMessagingTables() {
  console.log('\n💬 MESSAGING TABLES ANALYSIS:');
  console.log('-' .repeat(30));

  // Check conversations table
  try {
    const { data: conversations, error } = await supabase
      .from('conversations')
      .select('*', { count: 'exact', head: true });

    if (error) {
      console.log('❌ Conversations table missing or error:', error.message);
    } else {
      console.log(`✅ Conversations table: ${conversations || 0} records`);
    }
  } catch (error) {
    console.log('❌ Conversations table check failed');
  }

  // Check messages table
  try {
    const { data: messages, error } = await supabase
      .from('messages')
      .select('*', { count: 'exact', head: true });

    if (error) {
      console.log('❌ Messages table missing or error:', error.message);
    } else {
      console.log(`✅ Messages table: ${messages || 0} records`);
    }
  } catch (error) {
    console.log('❌ Messages table check failed');
  }

  // Check conversation_participants table
  try {
    const { data: participants, error } = await supabase
      .from('conversation_participants')
      .select('*', { count: 'exact', head: true });

    if (error) {
      console.log('❌ Conversation_participants table missing or error:', error.message);
    } else {
      console.log(`✅ Conversation_participants table: ${participants || 0} records`);
    }
  } catch (error) {
    console.log('❌ Conversation_participants table check failed');
  }
}

async function analyzeAnalyticsTables() {
  console.log('\n📊 ANALYTICS TABLES ANALYSIS:');
  console.log('-' .repeat(30));

  try {
    const { data: events, error } = await supabase
      .from('analytics_events')
      .select('*', { count: 'exact', head: true });

    if (error) {
      console.log('❌ Analytics_events table missing or error:', error.message);
    } else {
      console.log(`✅ Analytics_events table: ${events || 0} records`);
    }
  } catch (error) {
    console.log('❌ Analytics_events table check failed');
  }
}

async function analyzeAgentTables() {
  console.log('\n🏢 AGENT TABLES ANALYSIS:');
  console.log('-' .repeat(30));

  // Check agent_wallets
  try {
    const { data: wallets, error } = await supabase
      .from('agent_wallets')
      .select('*', { count: 'exact', head: true });

    if (error) {
      console.log('❌ Agent_wallets table missing or error:', error.message);
    } else {
      console.log(`✅ Agent_wallets table: ${wallets || 0} records`);
    }
  } catch (error) {
    console.log('❌ Agent_wallets table check failed');
  }

  // Check wallet_transactions
  try {
    const { data: transactions, error } = await supabase
      .from('wallet_transactions')
      .select('*', { count: 'exact', head: true });

    if (error) {
      console.log('❌ Wallet_transactions table missing or error:', error.message);
    } else {
      console.log(`✅ Wallet_transactions table: ${transactions || 0} records`);
    }
  } catch (error) {
    console.log('❌ Wallet_transactions table check failed');
  }
}

async function checkMissingTablesForServices() {
  console.log('🔍 Checking tables required by restored services...');
  
  const serviceRequirements = {
    'AnalyticsService': [
      'payments', 'bookings', 'users', 'properties', 'reviews', 'analytics_events'
    ],
    'NotificationService': [
      'notifications', 'users'
    ],
    'SocketService': [
      'conversations', 'messages', 'conversation_participants', 'users'
    ]
  };

  for (const [serviceName, requiredTables] of Object.entries(serviceRequirements)) {
    console.log(`\n🔧 ${serviceName} requirements:`);
    
    for (const tableName of requiredTables) {
      try {
        const { error } = await supabase
          .from(tableName)
          .select('*', { count: 'exact', head: true });

        if (error && error.message.includes('does not exist')) {
          console.log(`   ❌ Missing: ${tableName}`);
        } else if (error) {
          console.log(`   ⚠️  Issue with: ${tableName} - ${error.message}`);
        } else {
          console.log(`   ✅ Found: ${tableName}`);
        }
      } catch (error) {
        console.log(`   ❌ Missing: ${tableName}`);
      }
    }
  }
}

// Run the audit
auditSupabaseDatabase()
  .then(() => {
    console.log('\n🎉 Audit completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Audit failed:', error);
    process.exit(1);
  }); 