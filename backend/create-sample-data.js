const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.SUPABASE_URL || 'https://your-project.supabase.co',
  process.env.SUPABASE_ANON_KEY || 'your-anon-key'
);

async function createSampleData() {
  try {
    console.log('🚀 Starting sample data creation...');

    // 1. Create sample users (agents and guests)
    console.log('📝 Creating sample users...');
    
    const sampleUsers = [
      {
        id: '550e8400-e29b-41d4-a716-446655440001',
        email: 'agent.mahmoud@krib.ae',
        first_name: 'Mahmoud',
        last_name: 'Al-Rashid',
        phone: '+971501234567',
        is_agent: true,
        is_host: true,
        created_at: new Date().toISOString()
      },
      {
        id: '550e8400-e29b-41d4-a716-446655440002',
        email: 'sarah.agent@krib.ae',
        first_name: 'Sarah',
        last_name: 'Ahmed',
        phone: '+971507654321',
        is_agent: true,
        is_host: true,
        created_at: new Date().toISOString()
      },
      {
        id: '550e8400-e29b-41d4-a716-446655440003',
        email: 'client1@example.com',
        first_name: 'Ahmed',
        last_name: 'Hassan',
        phone: '+971509876543',
        is_agent: false,
        is_host: false,
        created_at: new Date().toISOString()
      },
      {
        id: '550e8400-e29b-41d4-a716-446655440004',
        email: 'client2@example.com',
        first_name: 'Fatima',
        last_name: 'Al-Zahra',
        phone: '+971508765432',
        is_agent: false,
        is_host: false,
        created_at: new Date().toISOString()
      },
      {
        id: '550e8400-e29b-41d4-a716-446655440005',
        email: 'client3@example.com',
        first_name: 'Omar',
        last_name: 'Khalil',
        phone: '+971507890123',
        is_agent: false,
        is_host: false,
        created_at: new Date().toISOString()
      }
    ];

    // Insert users
    for (const user of sampleUsers) {
      const { error } = await supabase
        .from('users')
        .upsert(user, { onConflict: 'email' });
      
      if (error && !error.message.includes('duplicate')) {
        console.error('Error creating user:', error);
      }
    }

    // 2. Create sample properties
    console.log('🏠 Creating sample properties...');
    
    const sampleProperties = [
      {
        id: '660e8400-e29b-41d4-a716-446655440001',
        title: 'Luxury 2BR Apartment in Downtown Dubai',
        description: 'Stunning 2-bedroom apartment with panoramic views of Burj Khalifa and Dubai Fountain. Features modern amenities, premium finishes, and access to world-class facilities.',
        city: 'Dubai',
        emirate: 'Dubai',
        address: 'Downtown Dubai, Burj Khalifa District',
        base_price: 8500,
        bedrooms: 2,
        bathrooms: 2,
        area: 1200,
        type: 'apartment',
        is_active: true,
        host_id: '550e8400-e29b-41d4-a716-446655440001',
        amenities: ['Swimming Pool', 'Gym', 'Parking', 'Security', 'Balcony', 'City View'],
        images: [
          'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=800',
          'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800',
          'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800'
        ],
        created_at: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
      },
      {
        id: '660e8400-e29b-41d4-a716-446655440002',
        title: 'Modern 1BR in Dubai Marina',
        description: 'Contemporary 1-bedroom apartment in the heart of Dubai Marina with marina views. Walking distance to restaurants, shopping, and metro station.',
        city: 'Dubai',
        emirate: 'Dubai',
        address: 'Dubai Marina, Marina Walk',
        base_price: 6500,
        bedrooms: 1,
        bathrooms: 1,
        area: 850,
        type: 'apartment',
        is_active: true,
        host_id: '550e8400-e29b-41d4-a716-446655440001',
        amenities: ['Swimming Pool', 'Gym', 'Parking', 'Marina View', 'Balcony'],
        images: [
          'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800',
          'https://images.unsplash.com/photo-1484154218962-a197022b5858?w=800'
        ],
        created_at: new Date(Date.now() - 25 * 24 * 60 * 60 * 1000).toISOString()
      },
      {
        id: '660e8400-e29b-41d4-a716-446655440003',
        title: 'Spacious 3BR Villa in Jumeirah',
        description: 'Beautiful 3-bedroom villa with private garden and pool. Perfect for families, located in prestigious Jumeirah area with easy access to beaches.',
        city: 'Dubai',
        emirate: 'Dubai',
        address: 'Jumeirah 1, Beach Road',
        base_price: 15000,
        bedrooms: 3,
        bathrooms: 3,
        area: 2500,
        type: 'villa',
        is_active: true,
        host_id: '550e8400-e29b-41d4-a716-446655440001',
        amenities: ['Private Pool', 'Garden', 'Parking', 'Maid Room', 'Beach Access'],
        images: [
          'https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=800',
          'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800'
        ],
        created_at: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString()
      },
      {
        id: '660e8400-e29b-41d4-a716-446655440004',
        title: 'Studio Apartment in Business Bay',
        description: 'Compact and efficient studio apartment perfect for professionals. Located in Business Bay with easy access to metro and business districts.',
        city: 'Dubai',
        emirate: 'Dubai',
        address: 'Business Bay, Executive Towers',
        base_price: 4500,
        bedrooms: 0,
        bathrooms: 1,
        area: 500,
        type: 'studio',
        is_active: true,
        host_id: '550e8400-e29b-41d4-a716-446655440002',
        amenities: ['Gym', 'Parking', 'Security', 'Metro Access'],
        images: [
          'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=800'
        ],
        created_at: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString()
      },
      {
        id: '660e8400-e29b-41d4-a716-446655440005',
        title: '2BR Penthouse in Palm Jumeirah',
        description: 'Exclusive penthouse with private terrace and stunning sea views. Located on the prestigious Palm Jumeirah with access to private beach.',
        city: 'Dubai',
        emirate: 'Dubai',
        address: 'Palm Jumeirah, Atlantis Residences',
        base_price: 25000,
        bedrooms: 2,
        bathrooms: 2,
        area: 1800,
        type: 'penthouse',
        is_active: true,
        host_id: '550e8400-e29b-41d4-a716-446655440001',
        amenities: ['Private Terrace', 'Sea View', 'Beach Access', 'Concierge', 'Valet Parking'],
        images: [
          'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=800',
          'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=800'
        ],
        created_at: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString()
      }
    ];

    // Insert properties
    for (const property of sampleProperties) {
      const { error } = await supabase
        .from('properties')
        .upsert(property, { onConflict: 'id' });
      
      if (error) {
        console.error('Error creating property:', error);
      }
    }

    // 3. Create sample bookings
    console.log('📅 Creating sample bookings...');
    
    const sampleBookings = [
      {
        id: '770e8400-e29b-41d4-a716-446655440001',
        property_id: '660e8400-e29b-41d4-a716-446655440001',
        guest_id: '550e8400-e29b-41d4-a716-446655440003',
        check_in: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        check_out: new Date(Date.now() + 35 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        total_amount: 8500,
        status: 'CONFIRMED',
        created_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString()
      },
      {
        id: '770e8400-e29b-41d4-a716-446655440002',
        property_id: '660e8400-e29b-41d4-a716-446655440002',
        guest_id: '550e8400-e29b-41d4-a716-446655440004',
        check_in: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        check_out: new Date(Date.now() + 40 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        total_amount: 6500,
        status: 'PENDING',
        created_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString()
      },
      {
        id: '770e8400-e29b-41d4-a716-446655440003',
        property_id: '660e8400-e29b-41d4-a716-446655440003',
        guest_id: '550e8400-e29b-41d4-a716-446655440005',
        check_in: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        check_out: new Date(Date.now() + 20 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        total_amount: 15000,
        status: 'COMPLETED',
        created_at: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString()
      },
      {
        id: '770e8400-e29b-41d4-a716-446655440004',
        property_id: '660e8400-e29b-41d4-a716-446655440004',
        guest_id: '550e8400-e29b-41d4-a716-446655440003',
        check_in: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        check_out: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        total_amount: 4500,
        status: 'CONFIRMED',
        created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString()
      }
    ];

    // Insert bookings
    for (const booking of sampleBookings) {
      const { error } = await supabase
        .from('bookings')
        .upsert(booking, { onConflict: 'id' });
      
      if (error) {
        console.error('Error creating booking:', error);
      }
    }

    // 4. Create agent wallets
    console.log('💳 Creating agent wallets...');
    
    const agentWallets = [
      {
        id: '880e8400-e29b-41d4-a716-446655440001',
        agent_id: '550e8400-e29b-41d4-a716-446655440001',
        balance: 2500.00,
        total_earned: 5000.00,
        total_spent: 2500.00,
        currency: 'AED',
        created_at: new Date().toISOString()
      },
      {
        id: '880e8400-e29b-41d4-a716-446655440002',
        agent_id: '550e8400-e29b-41d4-a716-446655440002',
        balance: 1200.00,
        total_earned: 2000.00,
        total_spent: 800.00,
        currency: 'AED',
        created_at: new Date().toISOString()
      }
    ];

    // Try to create wallets (table might not exist)
    try {
      for (const wallet of agentWallets) {
        const { error } = await supabase
          .from('agent_wallets')
          .upsert(wallet, { onConflict: 'agent_id' });
        
        if (error && !error.message.includes('does not exist')) {
          console.error('Error creating wallet:', error);
        }
      }
    } catch (error) {
      console.log('⚠️ Agent wallets table does not exist, skipping...');
    }

    // 5. Create wallet transactions
    console.log('💰 Creating wallet transactions...');
    
    const transactions = [
      {
        id: '990e8400-e29b-41d4-a716-446655440001',
        wallet_id: '880e8400-e29b-41d4-a716-446655440001',
        type: 'credit',
        amount: 1000.00,
        description: 'Commission from booking #770e8400-e29b-41d4-a716-446655440001',
        balance_after: 2500.00,
        created_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString()
      },
      {
        id: '990e8400-e29b-41d4-a716-446655440002',
        wallet_id: '880e8400-e29b-41d4-a716-446655440001',
        type: 'debit',
        amount: 150.00,
        description: 'Property promotion - Premium package',
        balance_after: 2350.00,
        created_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString()
      }
    ];

    // Try to create transactions (table might not exist)
    try {
      for (const transaction of transactions) {
        const { error } = await supabase
          .from('wallet_transactions')
          .upsert(transaction, { onConflict: 'id' });
        
        if (error && !error.message.includes('does not exist')) {
          console.error('Error creating transaction:', error);
        }
      }
    } catch (error) {
      console.log('⚠️ Wallet transactions table does not exist, skipping...');
    }

    console.log('✅ Sample data creation completed successfully!');
    console.log('📊 Created:');
    console.log(`   - ${sampleUsers.length} users (2 agents, 3 clients)`);
    console.log(`   - ${sampleProperties.length} properties`);
    console.log(`   - ${sampleBookings.length} bookings`);
    console.log(`   - ${agentWallets.length} agent wallets`);
    console.log(`   - ${transactions.length} wallet transactions`);

  } catch (error) {
    console.error('❌ Error creating sample data:', error);
  }
}

// Run the script
if (require.main === module) {
  createSampleData().then(() => {
    console.log('🎉 Sample data script completed!');
    process.exit(0);
  }).catch((error) => {
    console.error('💥 Script failed:', error);
    process.exit(1);
  });
}

module.exports = { createSampleData }; 