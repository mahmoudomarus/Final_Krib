import express from 'express';
import { authMiddleware, AuthenticatedRequest, requireAgent } from '../middleware/auth';
import { supabase } from '../lib/supabase';

const router: express.Router = express.Router();

// Get agent's properties/listings
router.get('/properties', authMiddleware, requireAgent, async (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.user?.id;
    
    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    console.log('🔍 Fetching properties for agent:', userId);

    // Get all properties where the agent is the host and rental_type is LONG_TERM
    const { data: properties, error: propertiesError } = await supabase
      .from('properties')
      .select(`
        id,
        title,
        description,
        address,
        city,
        emirate,
        type,
        bedrooms,
        bathrooms,
        area,
        base_price,
        monthly_price,
        yearly_price,
        images,
        is_active,
        created_at,
        host_id,
        rental_type,
        contract_min_duration,
        contract_max_duration,
        amenities
      `)
      .eq('host_id', userId)
      .eq('rental_type', 'LONG_TERM')
      .order('created_at', { ascending: false });

    if (propertiesError) {
      console.error('❌ Error fetching agent properties:', propertiesError);
      return res.status(500).json({ 
        success: false, 
        error: 'Failed to fetch properties',
        details: propertiesError.message 
      });
    }

    // Format properties data
    const formattedProperties = (properties || []).map(property => ({
      id: property.id,
      title: property.title || 'Untitled Property',
      description: property.description || '',
      address: property.address || '',
      city: property.city || '',
      emirate: property.emirate || 'Dubai',
      property_type: property.type?.toLowerCase() || 'apartment',
      bedrooms: property.bedrooms || 0,
      bathrooms: property.bathrooms || 0,
      area: property.area || 0,
      base_price: property.yearly_price || property.base_price || 0,
      images: property.images || [],
      is_active: property.is_active === true,
      created_at: property.created_at,
      agent_id: userId,
      is_long_term: true,
      lease_duration_months: property.contract_min_duration || 12,
      available_from: new Date().toISOString().split('T')[0],
      amenities: property.amenities || [],
      views_count: 0,
      inquiries_count: 0
    }));

    console.log('✅ Agent properties fetched:', formattedProperties.length);

    res.json({ 
      success: true, 
      data: formattedProperties,
      count: formattedProperties.length
    });

  } catch (error) {
    console.error('❌ Error in /properties GET:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Add new long-term property listing
router.post('/properties', authMiddleware, requireAgent, async (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.user?.id;
    
    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    console.log('📝 Adding new long-term property for agent:', userId);
    console.log('📋 Request body:', req.body);

    const {
      title,
      description,
      address,
      city,
      emirate,
      property_type,
      bedrooms,
      bathrooms,
      area,
      base_price,
      lease_duration_months,
      available_from,
      amenities
    } = req.body;

    // Validate required fields
    if (!title || !description || !address || !base_price || base_price <= 0) {
      return res.status(400).json({ 
        success: false,
        error: 'Missing required fields: title, description, address, base_price' 
      });
    }

    // Parse amenities if it's a string
    let parsedAmenities = [];
    try {
      parsedAmenities = typeof amenities === 'string' ? JSON.parse(amenities) : (amenities || []);
    } catch (e) {
      console.warn('Failed to parse amenities:', amenities);
      parsedAmenities = [];
    }

    // Map property type to correct format
    const typeMapping: Record<string, string> = {
      'apartment': 'APARTMENT',
      'villa': 'VILLA',
      'studio': 'STUDIO',
      'townhouse': 'TOWNHOUSE',
      'penthouse': 'PENTHOUSE',
      'duplex': 'APARTMENT'
    };

    // Create property data using correct schema fields
    const propertyData = {
      title: title.trim(),
      description: description.trim(),
      address: address.trim(),
      city: city?.trim() || 'Dubai',
      emirate: emirate || 'Dubai',
      type: typeMapping[property_type] || 'APARTMENT',
      category: 'ENTIRE_PLACE',
      rental_type: 'LONG_TERM',
      bedrooms: parseInt(bedrooms) || 1,
      bathrooms: parseInt(bathrooms) || 1,
      guests: Math.max(parseInt(bedrooms) || 1, 2),
      area: parseInt(area) || 0,
      base_price: parseInt(base_price),
      monthly_price: Math.round(parseInt(base_price) / 12),
      yearly_price: parseInt(base_price),
      contract_min_duration: parseInt(lease_duration_months) || 12,
      contract_max_duration: Math.max((parseInt(lease_duration_months) || 12) * 2, 24),
      utilities_included: false,
      maintenance_included: false,
      security_deposit: Math.round(parseInt(base_price) * 0.1), // 10% of yearly rent
      host_id: userId,
      amenities: parsedAmenities,
      images: ['https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800&q=80'],
      is_active: true,
      is_verified: true,
      is_instant_book: false,
      min_stay: Math.max((parseInt(lease_duration_months) || 12) * 30, 365),
      max_stay: (parseInt(lease_duration_months) || 12) * 60,
      check_in_time: '15:00',
      check_out_time: '11:00',
      latitude: 25.2048,
      longitude: 55.2708,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    console.log('🏗️ Creating property with corrected data:', propertyData);

    // Insert into database
    const { data: newProperty, error: insertError } = await supabase
      .from('properties')
      .insert([propertyData])
      .select()
      .single();

    if (insertError) {
      console.error('❌ Error inserting property:', insertError);
      return res.status(500).json({ 
        success: false,
        error: 'Failed to create property',
        details: insertError.message 
      });
    }

    console.log('✅ Long-term property created successfully:', newProperty.id);

    // Return the created property
    res.json({ 
      success: true, 
      data: {
        id: newProperty.id,
        title: newProperty.title,
        description: newProperty.description,
        address: newProperty.address,
        city: newProperty.city,
        emirate: newProperty.emirate,
        property_type: newProperty.type?.toLowerCase() || 'apartment',
        bedrooms: newProperty.bedrooms,
        bathrooms: newProperty.bathrooms,
        area: newProperty.area,
        base_price: newProperty.yearly_price || newProperty.base_price,
        images: newProperty.images || [],
        is_active: newProperty.is_active,
        created_at: newProperty.created_at,
        agent_id: userId,
        is_long_term: true,
        lease_duration_months: newProperty.contract_min_duration,
        available_from: available_from || new Date().toISOString().split('T')[0],
        amenities: newProperty.amenities || [],
        views_count: 0,
        inquiries_count: 0
      },
      message: 'Long-term listing created successfully! It will now appear in property searches for guests.'
    });

  } catch (error) {
    console.error('❌ Error in /properties POST:', error);
    res.status(500).json({ 
      success: false,
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router; 