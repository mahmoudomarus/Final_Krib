import express from 'express';
import { Request, Response } from 'express';
import { z } from 'zod';
import { supabaseAdmin } from '../lib/supabase';

const router: express.Router = express.Router();

// Base validation schema for property fields
const basePropertySchema = z.object({
  // Rental type selection
  rentalType: z.enum(['SHORT_TERM', 'LONG_TERM', 'BOTH']).default('SHORT_TERM'),
  
  title: z.string().min(3, 'Title must be at least 3 characters'),
  description: z.string().min(10, 'Description must be at least 10 characters'),
  type: z.enum(['APARTMENT', 'VILLA', 'STUDIO', 'PENTHOUSE', 'TOWNHOUSE']),
  category: z.enum(['ENTIRE_PLACE', 'PRIVATE_ROOM', 'SHARED_ROOM']).default('ENTIRE_PLACE'),
  emirate: z.string().min(1, 'Emirate is required'),
  city: z.string().min(1, 'City is required'),
  address: z.string().min(5, 'Address must be at least 5 characters'),
  latitude: z.number().min(-90).max(90, 'Invalid latitude'),
  longitude: z.number().min(-180).max(180, 'Invalid longitude'),
  bedrooms: z.number().int().min(0, 'Bedrooms must be 0 or more'),
  bathrooms: z.number().int().min(1, 'At least 1 bathroom required'),
  guests: z.number().int().min(1, 'At least 1 guest capacity required'),
  area: z.number().positive('Area must be positive'),
  
  // Short-term pricing
  basePrice: z.number().positive('Base price must be positive').optional(),
  cleaningFee: z.number().min(0, 'Cleaning fee cannot be negative').optional(),
  
  // Long-term pricing
  yearlyPrice: z.number().positive('Yearly price must be positive').optional(),
  monthlyPrice: z.number().positive('Monthly price must be positive').optional(),
  utilitiesIncluded: z.boolean().default(false),
  maintenanceIncluded: z.boolean().default(false),
  contractMinDuration: z.number().int().min(1, 'Minimum contract duration must be at least 1 month').optional(),
  contractMaxDuration: z.number().int().min(1, 'Maximum contract duration must be at least 1 month').optional(),
  
  // Common fields
  securityDeposit: z.number().min(0, 'Security deposit cannot be negative').optional(),
  serviceFee: z.number().min(0, 'Service fee cannot be negative').optional(),
  images: z.array(z.string().url('Invalid image URL')).min(1, 'At least 1 image required'),
  amenities: z.array(z.string()).min(1, 'At least 1 amenity required'),
  houseRules: z.array(z.string()).optional(),
  isInstantBook: z.boolean().default(false),
  minStay: z.number().int().min(1, 'Minimum stay must be at least 1 day').default(1),
  maxStay: z.number().int().min(1, 'Maximum stay must be at least 1 day').default(365),
  checkInTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid check-in time format (HH:MM)').default('15:00'),
  checkOutTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid check-out time format (HH:MM)').default('11:00'),
});

// Validation schema for property creation with refinements
const createPropertySchema = basePropertySchema.refine((data) => {
  // Ensure required pricing fields based on rental type
  if (data.rentalType === 'SHORT_TERM' || data.rentalType === 'BOTH') {
    return data.basePrice && data.basePrice > 0;
  }
  return true;
}, {
  message: 'Base price is required for short-term rentals',
  path: ['basePrice']
}).refine((data) => {
  // Ensure required long-term pricing fields
  if (data.rentalType === 'LONG_TERM' || data.rentalType === 'BOTH') {
    return data.monthlyPrice && data.monthlyPrice > 0 && data.yearlyPrice && data.yearlyPrice > 0;
  }
  return true;
}, {
  message: 'Monthly and yearly prices are required for long-term rentals',
  path: ['monthlyPrice']
}).refine((data) => {
  // Ensure contract duration logic for long-term rentals
  if (data.rentalType === 'LONG_TERM' || data.rentalType === 'BOTH') {
    return data.contractMinDuration && data.contractMaxDuration && 
           data.contractMaxDuration > data.contractMinDuration;
  }
  return true;
}, {
  message: 'Contract max duration must be greater than min duration for long-term rentals',
  path: ['contractMaxDuration']
});

// Get all properties with optional filters and map bounds
router.get('/', async (req: Request, res: Response) => {
  try {
    const {
      page = 1,
      limit = 20,
      emirate,
      city,
      area,
      propertyType,
      rentalType,
      minPrice,
      maxPrice,
      bedrooms,
      bathrooms,
      maxGuests,
      amenities,
      instantBook,
      rating,
      // Map bounds for geographic filtering
      bounds, // format: "sw_lat,sw_lng,ne_lat,ne_lng"
      center, // format: "lat,lng"
      radius, // in kilometers
    } = req.query;

    // Helper function to safely parse numbers
    const safeParseInt = (value: any): number | undefined => {
      if (!value || value === 'null' || value === 'undefined' || value === '') return undefined;
      const parsed = parseInt(value as string);
      return isNaN(parsed) ? undefined : parsed;
    };

    const safeParseFloat = (value: any): number | undefined => {
      if (!value || value === 'null' || value === 'undefined' || value === '') return undefined;
      const parsed = parseFloat(value as string);
      return isNaN(parsed) ? undefined : parsed;
    };

    // Helper function to safely parse strings
    const safeParseString = (value: any): string | undefined => {
      if (!value || value === 'null' || value === 'undefined' || value === '') return undefined;
      return String(value).trim();
    };

    const skip = (parseInt(page as string) - 1) * parseInt(limit as string);
    const take = parseInt(limit as string);

    // Build Supabase query
    let query = supabaseAdmin
      .from('properties')
      .select(`
        *,
        users!properties_host_id_fkey (
          id,
          first_name,
          last_name,
          avatar,
          is_verified
        )
      `, { count: 'exact' })
      .eq('is_active', true);

    // Apply filters to Supabase query
    const cleanEmirate = safeParseString(emirate);
    const cleanCity = safeParseString(city);
    const cleanArea = safeParseString(area);
    const cleanPropertyType = safeParseString(propertyType);
    const cleanRentalType = safeParseString(rentalType);
    const cleanBedrooms = safeParseInt(bedrooms);
    const cleanBathrooms = safeParseInt(bathrooms);
    const cleanMaxGuests = safeParseInt(maxGuests);
    const cleanMinPrice = safeParseFloat(minPrice);
    const cleanMaxPrice = safeParseFloat(maxPrice);
    const cleanRating = safeParseFloat(rating);
    const cleanAmenities = safeParseString(amenities);

    if (cleanEmirate) query = query.eq('emirate', cleanEmirate);
    if (cleanCity) query = query.eq('city', cleanCity);
    if (cleanArea) query = query.eq('area', cleanArea);
    if (cleanPropertyType) query = query.eq('type', cleanPropertyType);
    if (cleanRentalType) query = query.eq('rental_type', cleanRentalType);
    if (cleanBedrooms !== undefined) query = query.gte('bedrooms', cleanBedrooms);
    if (cleanBathrooms !== undefined) query = query.gte('bathrooms', cleanBathrooms);
    if (cleanMaxGuests !== undefined) query = query.gte('guests', cleanMaxGuests);
    if (cleanMinPrice !== undefined) query = query.gte('base_price', cleanMinPrice);
    if (cleanMaxPrice !== undefined) query = query.lte('base_price', cleanMaxPrice);
    if (instantBook === 'true') query = query.eq('is_instant_book', true);
    if (cleanAmenities) query = query.contains('amenities', [cleanAmenities]);

    // Geographic bounds filtering
    if (bounds && typeof bounds === 'string') {
      const boundsArray = bounds.split(',').map(parseFloat);
      if (boundsArray.length === 4 && boundsArray.every(val => !isNaN(val))) {
        const [sw_lat, sw_lng, ne_lat, ne_lng] = boundsArray;
        query = query.gte('latitude', sw_lat).lte('latitude', ne_lat)
                     .gte('longitude', sw_lng).lte('longitude', ne_lng);
      }
    }

    // Radius-based filtering (if center and radius provided)
    if (center && radius && typeof center === 'string' && typeof radius === 'string') {
      const centerArray = center.split(',').map(parseFloat);
      const radiusKm = parseFloat(radius);
      
      if (centerArray.length === 2 && centerArray.every(val => !isNaN(val)) && !isNaN(radiusKm)) {
        const [lat, lng] = centerArray;
        
        // Rough approximation: 1 degree ≈ 111 km
        const latDelta = radiusKm / 111;
        const lngDelta = radiusKm / (111 * Math.cos(lat * Math.PI / 180));
        
        query = query.gte('latitude', lat - latDelta).lte('latitude', lat + latDelta)
                     .gte('longitude', lng - lngDelta).lte('longitude', lng + lngDelta);
      }
    }

    // Add pagination and ordering
    const { data: properties, error: propertiesError, count } = await query
      .range(skip, skip + take - 1)
      .order('created_at', { ascending: false });

    if (propertiesError) {
      throw propertiesError;
    }

    const totalCount = count || 0;

    // Transform properties to match expected format
    const transformedProperties = properties?.map((property) => {
      // Convert comma-separated image string to array of objects
      const imageUrls = property.images ? property.images.split(',').map((url: string) => url.trim()).filter((url: string) => url) : [];
      const imageObjects = imageUrls.map((url: string, index: number) => ({
        id: `${property.id}-img-${index}`,
        url: url,
        caption: '',
        order: index
      }));

      // Determine status based on is_active and verification_status
      let status = 'INACTIVE';
      if (property.is_active) {
        if (property.verification_status === 'VERIFIED') {
          status = 'ACTIVE';
        } else if (property.verification_status === 'PENDING') {
          status = 'PENDING_REVIEW';
        }
      }

      return {
        ...property,
        host: property.users,
        hostId: property.host_id,
        basePrice: property.base_price,
        cleaningFee: property.cleaning_fee || 0,
        securityDeposit: property.security_deposit || 0,
        isActive: property.is_active,
        isInstantBook: property.is_instant_book,
        minStay: property.min_stay,
        maxStay: property.max_stay,
        checkInTime: property.check_in_time,
        checkOutTime: property.check_out_time,
        createdAt: property.created_at,
        updatedAt: property.updated_at,
        images: imageObjects,
        status: status,
        rating: 0,
        bookingCount: 0,
        reviewCount: 0,
        pricing: {
          basePrice: property.base_price || 0,
          monthlyRate: property.monthly_price || 0,
          priceUnit: property.rental_type === 'LONG_TERM' ? 'MONTH' : 'NIGHT'
        },
        location: {
          address: property.address,
          city: property.city,
          emirate: property.emirate,
          country: property.country || 'UAE'
        },
        maxGuests: property.guests
      };
    }) || [];

    res.json({
      success: true,
      properties: transformedProperties,
      totalCount,
      currentPage: parseInt(page as string),
      totalPages: Math.ceil(totalCount / take),
      hasNext: skip + take < totalCount,
      hasPrev: parseInt(page as string) > 1,
    });
  } catch (error) {
    console.error('Error fetching properties:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch properties',
      details: process.env.NODE_ENV === 'development' ? error : undefined,
    });
  }
});

// Search properties with text search
router.get('/search', async (req: Request, res: Response) => {
  try {
    const {
      q, // search query
      page = 1,
      limit = 20,
      sortBy = 'relevance', // relevance, price_low, price_high, rating, distance
      ...filters
    } = req.query;

    const skip = (parseInt(page as string) - 1) * parseInt(limit as string);
    const take = parseInt(limit as string);

    // Build Supabase query with text search
    let query = supabaseAdmin
      .from('properties')
      .select(`
        *,
        users!properties_host_id_fkey (
          id,
          first_name,
          last_name,
          avatar,
          is_verified
        )
      `, { count: 'exact' })
      .eq('is_active', true);

    // Enhanced text search with better relevance scoring
    if (q) {
      const searchTerm = q.toString().trim();
      
      // Use full-text search for better performance and relevance (only on text columns)
      query = query.or(`title.ilike.%${searchTerm}%,description.ilike.%${searchTerm}%,city.ilike.%${searchTerm}%,emirate.ilike.%${searchTerm}%,type.ilike.%${searchTerm}%`);
    }
    
    // Apply additional filters
    if (filters.emirate) {
      query = query.eq('emirate', filters.emirate);
    }
    
    if (filters.city) {
      query = query.eq('city', filters.city);
    }
    
    if (filters.propertyType) {
      query = query.eq('type', filters.propertyType);
    }
    
    if (filters.minPrice) {
      query = query.gte('base_price', parseInt(filters.minPrice as string));
    }
    
    if (filters.maxPrice) {
      query = query.lte('base_price', parseInt(filters.maxPrice as string));
    }
    
    if (filters.bedrooms) {
      query = query.eq('bedrooms', parseInt(filters.bedrooms as string));
    }
    
    if (filters.bathrooms) {
      query = query.gte('bathrooms', parseInt(filters.bathrooms as string));
    }
    
    if (filters.maxGuests) {
      query = query.gte('guests', parseInt(filters.maxGuests as string));
    }
    
    if (filters.instantBook === 'true') {
      query = query.eq('is_instant_book', true);
    }

    // Sorting
    let orderColumn = 'created_at';
    let ascending = false;
    
    switch (sortBy) {
      case 'price_low':
        orderColumn = 'base_price';
        ascending = true;
        break;
      case 'price_high':
        orderColumn = 'base_price';
        ascending = false;
        break;
      case 'newest':
        orderColumn = 'created_at';
        ascending = false;
        break;
      default:
        orderColumn = 'created_at';
        ascending = false;
    }

    // Execute query with pagination and ordering
    const { data: properties, error: propertiesError, count } = await query
      .range(skip, skip + take - 1)
      .order(orderColumn, { ascending });

    if (propertiesError) {
      throw propertiesError;
    }

    const totalCount = count || 0;

    // Transform properties
    const transformedProperties = properties?.map((property) => {
      // Convert comma-separated image string to array of objects
      const imageUrls = property.images ? property.images.split(',').map((url: string) => url.trim()).filter((url: string) => url) : [];
      const imageObjects = imageUrls.map((url: string, index: number) => ({
        id: `${property.id}-img-${index}`,
        url: url,
        caption: '',
        order: index
      }));

      // Determine status based on is_active and verification_status
      let status = 'INACTIVE';
      if (property.is_active) {
        if (property.verification_status === 'VERIFIED') {
          status = 'ACTIVE';
        } else if (property.verification_status === 'PENDING') {
          status = 'PENDING_REVIEW';
        }
      }

      return {
        ...property,
        host: property.users,
        hostId: property.host_id,
        basePrice: property.base_price,
        cleaningFee: property.cleaning_fee || 0,
        securityDeposit: property.security_deposit || 0,
        isActive: property.is_active,
        isInstantBook: property.is_instant_book,
        minStay: property.min_stay,
        maxStay: property.max_stay,
        checkInTime: property.check_in_time,
        checkOutTime: property.check_out_time,
        createdAt: property.created_at,
        updatedAt: property.updated_at,
        images: imageObjects,
        status: status,
        rating: 0,
        bookingCount: 0,
        reviewCount: 0,
        pricing: {
          basePrice: property.base_price || 0,
          monthlyRate: property.monthly_price || 0,
          priceUnit: property.rental_type === 'LONG_TERM' ? 'MONTH' : 'NIGHT'
        },
        location: {
          address: property.address,
          city: property.city,
          emirate: property.emirate,
          country: property.country || 'UAE'
        },
        maxGuests: property.guests
      };
    }) || [];

    res.json({
      success: true,
      data: {
        properties: transformedProperties,
        totalCount,
        query: q,
        currentPage: parseInt(page as string),
        totalPages: Math.ceil(totalCount / take),
      },
    });
  } catch (error) {
    console.error('Error searching properties:', error);
    console.error('Full error details:', JSON.stringify(error, null, 2));
    res.status(500).json({
      success: false,
      error: 'Failed to search properties',
      details: process.env.NODE_ENV === 'development' ? error : undefined,
    });
  }
});

// Autocomplete search suggestions
router.get('/autocomplete', async (req: Request, res: Response) => {
  try {
    const { q, limit = 10 } = req.query;
    
    if (!q || typeof q !== 'string' || q.trim().length < 2) {
      return res.json({
        success: true,
        data: {
          suggestions: []
        }
      });
    }
    
    const searchTerm = q.toString().trim();
    
    // Get location suggestions
    const { data: locationSuggestions } = await supabaseAdmin
      .from('properties')
      .select('emirate, city, area')
      .eq('is_active', true)
      .or(`emirate.ilike.%${searchTerm}%,city.ilike.%${searchTerm}%,area.ilike.%${searchTerm}%`)
      .limit(parseInt(limit as string));
    
    // Get property type suggestions
    const { data: typeSuggestions } = await supabaseAdmin
      .from('properties')
      .select('type')
      .eq('is_active', true)
      .ilike('type', `%${searchTerm}%`)
      .limit(5);
    
    // Get property title suggestions
    const { data: titleSuggestions } = await supabaseAdmin
      .from('properties')
      .select('id, title, city, emirate')
      .eq('is_active', true)
      .ilike('title', `%${searchTerm}%`)
      .limit(5);
    
    // Combine and format suggestions
    const suggestions: any[] = [];
    
    // Add unique locations
    const uniqueLocations = new Set();
    locationSuggestions?.forEach(prop => {
      if (prop.emirate && !uniqueLocations.has(prop.emirate)) {
        uniqueLocations.add(prop.emirate);
        suggestions.push({
          type: 'location',
          value: prop.emirate,
          label: prop.emirate,
          category: 'Emirate'
        });
      }
      if (prop.city && !uniqueLocations.has(prop.city)) {
        uniqueLocations.add(prop.city);
        suggestions.push({
          type: 'location',
          value: prop.city,
          label: `${prop.city}, ${prop.emirate}`,
          category: 'City'
        });
      }
      if (prop.area && !uniqueLocations.has(prop.area)) {
        uniqueLocations.add(prop.area);
        suggestions.push({
          type: 'location',
          value: prop.area,
          label: `${prop.area}, ${prop.city}`,
          category: 'Area'
        });
      }
    });
    
    // Add property types
    const uniqueTypes = new Set();
    typeSuggestions?.forEach(prop => {
      if (prop.type && !uniqueTypes.has(prop.type)) {
        uniqueTypes.add(prop.type);
        suggestions.push({
          type: 'property_type',
          value: prop.type,
          label: prop.type,
          category: 'Property Type'
        });
      }
    });
    
    // Add property titles
    titleSuggestions?.forEach(prop => {
      suggestions.push({
        type: 'property',
        value: prop.id,
        label: prop.title,
        sublabel: `${prop.city}, ${prop.emirate}`,
        category: 'Property'
      });
    });
    
    res.json({
      success: true,
      data: {
        suggestions: suggestions.slice(0, parseInt(limit as string))
      }
    });
    
  } catch (error) {
    console.error('Error getting autocomplete suggestions:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get suggestions'
    });
  }
});

// Get nearby properties (for map view)
router.get('/nearby', async (req: Request, res: Response) => {
  try {
    const { lat, lng, radius = 5, limit = 50 } = req.query;

    if (!lat || !lng) {
      return res.status(400).json({
        success: false,
        error: 'Latitude and longitude are required',
      });
    }

    const latitude = parseFloat(lat as string);
    const longitude = parseFloat(lng as string);
    const radiusKm = parseFloat(radius as string);

    // Calculate bounding box
    const latDelta = radiusKm / 111;
    const lngDelta = radiusKm / (111 * Math.cos(latitude * Math.PI / 180));

    const { data: properties, error } = await supabaseAdmin
      .from('properties')
      .select(`
        *,
        users!properties_host_id_fkey (
          id,
          first_name,
          last_name,
          avatar,
          is_verified
        )
      `)
      .eq('is_active', true)
      .gte('latitude', latitude - latDelta)
      .lte('latitude', latitude + latDelta)
      .gte('longitude', longitude - lngDelta)
      .lte('longitude', longitude + lngDelta)
      .limit(parseInt(limit as string));

    if (error) {
      throw error;
    }

    // Calculate actual distances and sort by distance
    const propertiesWithDistance = properties?.map((property: any) => ({
      ...property,
      host: property.users,
      hostId: property.host_id,
      basePrice: property.base_price,
      cleaningFee: property.cleaning_fee || 0,
      securityDeposit: property.security_deposit || 0,
      isActive: property.is_active,
      isInstantBook: property.is_instant_book,
      minStay: property.min_stay,
      maxStay: property.max_stay,
      checkInTime: property.check_in_time,
      checkOutTime: property.check_out_time,
      createdAt: property.created_at,
      updatedAt: property.updated_at,
      distance: calculateDistance(
        latitude,
        longitude,
        property.latitude,
        property.longitude
      ),
    })).sort((a: any, b: any) => a.distance - b.distance) || [];

    res.json({
      success: true,
      data: propertiesWithDistance,
    });
  } catch (error) {
    console.error('Error fetching nearby properties:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch nearby properties',
    });
  }
});

// Track search analytics
router.post('/search-analytics', async (req: Request, res: Response) => {
  try {
    const { query, filters, resultCount, timestamp } = req.body;
    
    // Store search analytics in database
    const { error } = await supabaseAdmin
      .from('analytics_events')
      .insert({
        event_type: 'SEARCH',
        event_data: {
          query,
          filters,
          resultCount,
          timestamp
        },
        user_id: (req as any).user?.id || null,
        created_at: new Date().toISOString()
      });

    if (error) {
      console.error('Error storing search analytics:', error);
      // Don't fail the request if analytics storage fails
    }

    res.json({
      success: true,
      message: 'Search analytics recorded'
    });

  } catch (error) {
    console.error('Error tracking search analytics:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to track search analytics'
    });
  }
});

// Get popular search terms and locations
router.get('/popular-searches', async (req: Request, res: Response) => {
  try {
    // Get popular locations from actual property data
    const { data: popularLocations } = await supabaseAdmin
      .from('properties')
      .select('emirate, city, area')
      .eq('is_active', true);
    
    // Count occurrences
    const locationCounts: { [key: string]: number } = {};
    popularLocations?.forEach(prop => {
      if (prop.emirate) locationCounts[prop.emirate] = (locationCounts[prop.emirate] || 0) + 1;
      if (prop.city) locationCounts[prop.city] = (locationCounts[prop.city] || 0) + 1;
      if (prop.area) locationCounts[prop.area] = (locationCounts[prop.area] || 0) + 1;
    });
    
    // Sort by popularity
    const sortedLocations = Object.entries(locationCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 10)
      .map(([location, count]) => ({ location, count }));
    
    // Get popular property types
    const { data: propertyTypes } = await supabaseAdmin
      .from('properties')
      .select('type')
      .eq('is_active', true);
    
    const typeCounts: { [key: string]: number } = {};
    propertyTypes?.forEach(prop => {
      if (prop.type) {
        typeCounts[prop.type] = (typeCounts[prop.type] || 0) + 1;
      }
    });
    
    const sortedTypes = Object.entries(typeCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
      .map(([type, count]) => ({ type, count }));
    
    res.json({
      success: true,
      data: {
        popularLocations: sortedLocations,
        popularTypes: sortedTypes,
        trendingSearches: [
          'Dubai Marina',
          'Downtown Dubai',
          'Business Bay',
          'JBR',
          'Palm Jumeirah'
        ]
      }
    });
    
  } catch (error) {
    console.error('Error getting popular searches:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get popular searches'
    });
  }
});

// Get property by ID
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const { data: property, error } = await supabaseAdmin
      .from('properties')
      .select(`
        *,
        users!properties_host_id_fkey (
          id,
          first_name,
          last_name,
          avatar,
          is_verified,
          is_host,
          created_at
        )
      `)
      .eq('id', id)
      .single();

    if (error || !property) {
      return res.status(404).json({
        success: false,
        error: 'Property not found',
      });
    }

    // TODO: Fetch reviews from reviews table
    // const { data: reviews } = await supabaseAdmin
    //   .from('reviews')
    //   .select(`
    //     *,
    //     users!reviews_guest_id_fkey (
    //       id,
    //       first_name,
    //       last_name,
    //       avatar
    //     )
    //   `)
    //   .eq('property_id', id)
    //   .order('created_at', { ascending: false })
    //   .limit(10);

    // Transform property to match expected format
    // Convert comma-separated image string to array of objects
    const imageUrls = property.images ? property.images.split(',').map((url: string) => url.trim()).filter((url: string) => url) : [];
    const imageObjects = imageUrls.map((url: string, index: number) => ({
      id: `${property.id}-img-${index}`,
      url: url,
      caption: '',
      order: index
    }));

    // Determine status based on is_active and verification_status
    let status = 'INACTIVE';
    if (property.is_active) {
      if (property.verification_status === 'VERIFIED') {
        status = 'ACTIVE';
      } else if (property.verification_status === 'PENDING') {
        status = 'PENDING_REVIEW';
      }
    }
    
    const transformedProperty = {
      ...property,
      host: property.users,
      hostId: property.host_id,
      basePrice: property.base_price,
      cleaningFee: property.cleaning_fee || 0,
      securityDeposit: property.security_deposit || 0,
      isActive: property.is_active,
      isInstantBook: property.is_instant_book,
      minStay: property.min_stay,
      maxStay: property.max_stay,
      checkInTime: property.check_in_time,
      checkOutTime: property.check_out_time,
      createdAt: property.created_at,
      updatedAt: property.updated_at,
      reviews: [], // TODO: Add reviews when reviews table is ready
      images: imageObjects,
      status: status,
      rating: 0,
      bookingCount: 0,
      reviewCount: 0,
      pricing: {
        basePrice: property.base_price || 0,
        monthlyRate: property.monthly_price || 0,
        priceUnit: property.rental_type === 'LONG_TERM' ? 'MONTH' : 'NIGHT'
      },
      location: {
        address: property.address,
        city: property.city,
        emirate: property.emirate,
        country: property.country || 'UAE'
      },
      maxGuests: property.guests
    };

    res.json({
      success: true,
      data: transformedProperty,
    });
  } catch (error) {
    console.error('Error fetching property:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch property',
    });
  }
});

// Create new property
router.post('/', async (req: Request, res: Response) => {
  try {
    const validatedData = createPropertySchema.parse(req.body);
    const hostId = req.body.hostId;

    if (!hostId) {
      return res.status(401).json({
        success: false,
        error: 'Host ID is required',
      });
    }

    // Transform data to match database schema
    const propertyData = {
      host_id: hostId,
      rental_type: validatedData.rentalType,
      title: validatedData.title,
      description: validatedData.description,
      type: validatedData.type,
      category: validatedData.category,
      emirate: validatedData.emirate,
      city: validatedData.city,
      address: validatedData.address,
      latitude: validatedData.latitude,
      longitude: validatedData.longitude,
      bedrooms: validatedData.bedrooms,
      bathrooms: validatedData.bathrooms,
      guests: validatedData.guests,
      area: validatedData.area,
      base_price: validatedData.basePrice,
      cleaning_fee: validatedData.cleaningFee,
      yearly_price: validatedData.yearlyPrice,
      monthly_price: validatedData.monthlyPrice,
      utilities_included: validatedData.utilitiesIncluded,
      maintenance_included: validatedData.maintenanceIncluded,
      contract_min_duration: validatedData.contractMinDuration,
      contract_max_duration: validatedData.contractMaxDuration,
      security_deposit: validatedData.securityDeposit,
      service_fee: validatedData.serviceFee,
      images: validatedData.images,
      amenities: validatedData.amenities,
      house_rules: validatedData.houseRules,
      is_instant_book: validatedData.isInstantBook,
      min_stay: validatedData.minStay,
      max_stay: validatedData.maxStay,
      check_in_time: validatedData.checkInTime,
      check_out_time: validatedData.checkOutTime,
      is_active: true,
    };

    const { data: property, error } = await supabaseAdmin
      .from('properties')
      .insert([propertyData])
      .select()
      .single();

    if (error) {
      throw error;
    }

    res.status(201).json({
      success: true,
      data: property,
    });
  } catch (error) {
    console.error('Error creating property:', error);
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: 'Validation error',
        details: error.errors,
      });
    }
    res.status(500).json({
      success: false,
      error: 'Failed to create property',
    });
  }
});

// Update property
router.put('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const validatedData = basePropertySchema.partial().parse(req.body);

    // Transform data to match database schema
    const updateData: any = {};
    if (validatedData.rentalType) updateData.rental_type = validatedData.rentalType;
    if (validatedData.title) updateData.title = validatedData.title;
    if (validatedData.description) updateData.description = validatedData.description;
    if (validatedData.type) updateData.type = validatedData.type;
    if (validatedData.category) updateData.category = validatedData.category;
    if (validatedData.emirate) updateData.emirate = validatedData.emirate;
    if (validatedData.city) updateData.city = validatedData.city;
    if (validatedData.address) updateData.address = validatedData.address;
    if (validatedData.latitude) updateData.latitude = validatedData.latitude;
    if (validatedData.longitude) updateData.longitude = validatedData.longitude;
    if (validatedData.bedrooms !== undefined) updateData.bedrooms = validatedData.bedrooms;
    if (validatedData.bathrooms !== undefined) updateData.bathrooms = validatedData.bathrooms;
    if (validatedData.guests !== undefined) updateData.guests = validatedData.guests;
    if (validatedData.area) updateData.area = validatedData.area;
    if (validatedData.basePrice) updateData.base_price = validatedData.basePrice;
    if (validatedData.cleaningFee !== undefined) updateData.cleaning_fee = validatedData.cleaningFee;
    if (validatedData.yearlyPrice) updateData.yearly_price = validatedData.yearlyPrice;
    if (validatedData.monthlyPrice) updateData.monthly_price = validatedData.monthlyPrice;
    if (validatedData.utilitiesIncluded !== undefined) updateData.utilities_included = validatedData.utilitiesIncluded;
    if (validatedData.maintenanceIncluded !== undefined) updateData.maintenance_included = validatedData.maintenanceIncluded;
    if (validatedData.contractMinDuration) updateData.contract_min_duration = validatedData.contractMinDuration;
    if (validatedData.contractMaxDuration) updateData.contract_max_duration = validatedData.contractMaxDuration;
    if (validatedData.securityDeposit !== undefined) updateData.security_deposit = validatedData.securityDeposit;
    if (validatedData.serviceFee !== undefined) updateData.service_fee = validatedData.serviceFee;
    if (validatedData.images) updateData.images = validatedData.images;
    if (validatedData.amenities) updateData.amenities = validatedData.amenities;
    if (validatedData.houseRules) updateData.house_rules = validatedData.houseRules;
    if (validatedData.isInstantBook !== undefined) updateData.is_instant_book = validatedData.isInstantBook;
    if (validatedData.minStay) updateData.min_stay = validatedData.minStay;
    if (validatedData.maxStay) updateData.max_stay = validatedData.maxStay;
    if (validatedData.checkInTime) updateData.check_in_time = validatedData.checkInTime;
    if (validatedData.checkOutTime) updateData.check_out_time = validatedData.checkOutTime;

    updateData.updated_at = new Date().toISOString();

    const { data: property, error } = await supabaseAdmin
      .from('properties')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw error;
    }

    if (!property) {
      return res.status(404).json({
        success: false,
        error: 'Property not found',
      });
    }

    res.json({
      success: true,
      data: property,
    });
  } catch (error) {
    console.error('Error updating property:', error);
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: 'Validation error',
        details: error.errors,
      });
    }
    res.status(500).json({
      success: false,
      error: 'Failed to update property',
    });
  }
});

// Delete property (soft delete)
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const { data: property, error } = await supabaseAdmin
      .from('properties')
      .update({ 
        is_active: false,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw error;
    }

    if (!property) {
      return res.status(404).json({
        success: false,
        error: 'Property not found',
      });
    }

    res.json({
      success: true,
      message: 'Property deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting property:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete property',
    });
  }
});

// Helper function to calculate distance between two points
function calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371; // Radius of the Earth in kilometers
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLng/2) * Math.sin(dLng/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  const distance = R * c; // Distance in kilometers
  return distance;
}

export default router; 