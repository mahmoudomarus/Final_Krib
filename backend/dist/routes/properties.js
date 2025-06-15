"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const zod_1 = require("zod");
const supabase_1 = require("../lib/supabase");
const router = express_1.default.Router();
const basePropertySchema = zod_1.z.object({
    rentalType: zod_1.z.enum(['SHORT_TERM', 'LONG_TERM', 'BOTH']).default('SHORT_TERM'),
    title: zod_1.z.string().min(3, 'Title must be at least 3 characters'),
    description: zod_1.z.string().min(10, 'Description must be at least 10 characters'),
    type: zod_1.z.enum(['APARTMENT', 'VILLA', 'STUDIO', 'PENTHOUSE', 'TOWNHOUSE']),
    category: zod_1.z.enum(['ENTIRE_PLACE', 'PRIVATE_ROOM', 'SHARED_ROOM']).default('ENTIRE_PLACE'),
    emirate: zod_1.z.string().min(1, 'Emirate is required'),
    city: zod_1.z.string().min(1, 'City is required'),
    address: zod_1.z.string().min(5, 'Address must be at least 5 characters'),
    latitude: zod_1.z.number().min(-90).max(90, 'Invalid latitude'),
    longitude: zod_1.z.number().min(-180).max(180, 'Invalid longitude'),
    bedrooms: zod_1.z.number().int().min(0, 'Bedrooms must be 0 or more'),
    bathrooms: zod_1.z.number().int().min(1, 'At least 1 bathroom required'),
    guests: zod_1.z.number().int().min(1, 'At least 1 guest capacity required'),
    area: zod_1.z.number().positive('Area must be positive'),
    basePrice: zod_1.z.number().positive('Base price must be positive').optional(),
    cleaningFee: zod_1.z.number().min(0, 'Cleaning fee cannot be negative').optional(),
    yearlyPrice: zod_1.z.number().positive('Yearly price must be positive').optional(),
    monthlyPrice: zod_1.z.number().positive('Monthly price must be positive').optional(),
    utilitiesIncluded: zod_1.z.boolean().default(false),
    maintenanceIncluded: zod_1.z.boolean().default(false),
    contractMinDuration: zod_1.z.number().int().min(1, 'Minimum contract duration must be at least 1 month').optional(),
    contractMaxDuration: zod_1.z.number().int().min(1, 'Maximum contract duration must be at least 1 month').optional(),
    securityDeposit: zod_1.z.number().min(0, 'Security deposit cannot be negative').optional(),
    serviceFee: zod_1.z.number().min(0, 'Service fee cannot be negative').optional(),
    images: zod_1.z.array(zod_1.z.string().url('Invalid image URL')).min(1, 'At least 1 image required'),
    amenities: zod_1.z.array(zod_1.z.string()).min(1, 'At least 1 amenity required'),
    houseRules: zod_1.z.array(zod_1.z.string()).optional(),
    isInstantBook: zod_1.z.boolean().default(false),
    minStay: zod_1.z.number().int().min(1, 'Minimum stay must be at least 1 day').default(1),
    maxStay: zod_1.z.number().int().min(1, 'Maximum stay must be at least 1 day').default(365),
    checkInTime: zod_1.z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid check-in time format (HH:MM)').default('15:00'),
    checkOutTime: zod_1.z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid check-out time format (HH:MM)').default('11:00'),
});
const createPropertySchema = basePropertySchema.refine((data) => {
    if (data.rentalType === 'SHORT_TERM' || data.rentalType === 'BOTH') {
        return data.basePrice && data.basePrice > 0;
    }
    return true;
}, {
    message: 'Base price is required for short-term rentals',
    path: ['basePrice']
}).refine((data) => {
    if (data.rentalType === 'LONG_TERM' || data.rentalType === 'BOTH') {
        return data.monthlyPrice && data.monthlyPrice > 0 && data.yearlyPrice && data.yearlyPrice > 0;
    }
    return true;
}, {
    message: 'Monthly and yearly prices are required for long-term rentals',
    path: ['monthlyPrice']
}).refine((data) => {
    if (data.rentalType === 'LONG_TERM' || data.rentalType === 'BOTH') {
        return data.contractMinDuration && data.contractMaxDuration &&
            data.contractMaxDuration > data.contractMinDuration;
    }
    return true;
}, {
    message: 'Contract max duration must be greater than min duration for long-term rentals',
    path: ['contractMaxDuration']
});
router.get('/', async (req, res) => {
    try {
        const { page = 1, limit = 20, emirate, city, area, propertyType, rentalType, minPrice, maxPrice, bedrooms, bathrooms, maxGuests, amenities, instantBook, rating, bounds, center, radius, } = req.query;
        const safeParseInt = (value) => {
            if (!value || value === 'null' || value === 'undefined' || value === '')
                return undefined;
            const parsed = parseInt(value);
            return isNaN(parsed) ? undefined : parsed;
        };
        const safeParseFloat = (value) => {
            if (!value || value === 'null' || value === 'undefined' || value === '')
                return undefined;
            const parsed = parseFloat(value);
            return isNaN(parsed) ? undefined : parsed;
        };
        const safeParseString = (value) => {
            if (!value || value === 'null' || value === 'undefined' || value === '')
                return undefined;
            return String(value).trim();
        };
        const skip = (parseInt(page) - 1) * parseInt(limit);
        const take = parseInt(limit);
        let query = supabase_1.supabaseAdmin
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
        if (cleanEmirate)
            query = query.eq('emirate', cleanEmirate);
        if (cleanCity)
            query = query.eq('city', cleanCity);
        if (cleanArea)
            query = query.eq('area', cleanArea);
        if (cleanPropertyType)
            query = query.eq('type', cleanPropertyType);
        if (cleanRentalType)
            query = query.eq('rental_type', cleanRentalType);
        if (cleanBedrooms !== undefined)
            query = query.gte('bedrooms', cleanBedrooms);
        if (cleanBathrooms !== undefined)
            query = query.gte('bathrooms', cleanBathrooms);
        if (cleanMaxGuests !== undefined)
            query = query.gte('guests', cleanMaxGuests);
        if (cleanMinPrice !== undefined)
            query = query.gte('base_price', cleanMinPrice);
        if (cleanMaxPrice !== undefined)
            query = query.lte('base_price', cleanMaxPrice);
        if (instantBook === 'true')
            query = query.eq('is_instant_book', true);
        if (cleanAmenities)
            query = query.contains('amenities', [cleanAmenities]);
        if (bounds && typeof bounds === 'string') {
            const boundsArray = bounds.split(',').map(parseFloat);
            if (boundsArray.length === 4 && boundsArray.every(val => !isNaN(val))) {
                const [sw_lat, sw_lng, ne_lat, ne_lng] = boundsArray;
                query = query.gte('latitude', sw_lat).lte('latitude', ne_lat)
                    .gte('longitude', sw_lng).lte('longitude', ne_lng);
            }
        }
        if (center && radius && typeof center === 'string' && typeof radius === 'string') {
            const centerArray = center.split(',').map(parseFloat);
            const radiusKm = parseFloat(radius);
            if (centerArray.length === 2 && centerArray.every(val => !isNaN(val)) && !isNaN(radiusKm)) {
                const [lat, lng] = centerArray;
                const latDelta = radiusKm / 111;
                const lngDelta = radiusKm / (111 * Math.cos(lat * Math.PI / 180));
                query = query.gte('latitude', lat - latDelta).lte('latitude', lat + latDelta)
                    .gte('longitude', lng - lngDelta).lte('longitude', lng + lngDelta);
            }
        }
        const { data: properties, error: propertiesError, count } = await query
            .range(skip, skip + take - 1)
            .order('created_at', { ascending: false });
        if (propertiesError) {
            throw propertiesError;
        }
        const totalCount = count || 0;
        const transformedProperties = properties?.map((property) => {
            const imageUrls = property.images ? property.images.split(',').map((url) => url.trim()).filter((url) => url) : [];
            const imageObjects = imageUrls.map((url, index) => ({
                id: `${property.id}-img-${index}`,
                url: url,
                caption: '',
                order: index
            }));
            let status = 'INACTIVE';
            if (property.is_active) {
                if (property.verification_status === 'VERIFIED') {
                    status = 'ACTIVE';
                }
                else if (property.verification_status === 'PENDING') {
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
            currentPage: parseInt(page),
            totalPages: Math.ceil(totalCount / take),
            hasNext: skip + take < totalCount,
            hasPrev: parseInt(page) > 1,
        });
    }
    catch (error) {
        console.error('Error fetching properties:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch properties',
            details: process.env.NODE_ENV === 'development' ? error : undefined,
        });
    }
});
router.get('/search', async (req, res) => {
    try {
        const { q, page = 1, limit = 20, sortBy = 'relevance', ...filters } = req.query;
        const skip = (parseInt(page) - 1) * parseInt(limit);
        const take = parseInt(limit);
        let query = supabase_1.supabaseAdmin
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
        if (q) {
            const searchTerm = q.toString().trim();
            query = query.or(`title.ilike.%${searchTerm}%,description.ilike.%${searchTerm}%,city.ilike.%${searchTerm}%,emirate.ilike.%${searchTerm}%,type.ilike.%${searchTerm}%`);
        }
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
            query = query.gte('base_price', parseInt(filters.minPrice));
        }
        if (filters.maxPrice) {
            query = query.lte('base_price', parseInt(filters.maxPrice));
        }
        if (filters.bedrooms) {
            query = query.eq('bedrooms', parseInt(filters.bedrooms));
        }
        if (filters.bathrooms) {
            query = query.gte('bathrooms', parseInt(filters.bathrooms));
        }
        if (filters.maxGuests) {
            query = query.gte('guests', parseInt(filters.maxGuests));
        }
        if (filters.instantBook === 'true') {
            query = query.eq('is_instant_book', true);
        }
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
        const { data: properties, error: propertiesError, count } = await query
            .range(skip, skip + take - 1)
            .order(orderColumn, { ascending });
        if (propertiesError) {
            throw propertiesError;
        }
        const totalCount = count || 0;
        const transformedProperties = properties?.map((property) => {
            const imageUrls = property.images ? property.images.split(',').map((url) => url.trim()).filter((url) => url) : [];
            const imageObjects = imageUrls.map((url, index) => ({
                id: `${property.id}-img-${index}`,
                url: url,
                caption: '',
                order: index
            }));
            let status = 'INACTIVE';
            if (property.is_active) {
                if (property.verification_status === 'VERIFIED') {
                    status = 'ACTIVE';
                }
                else if (property.verification_status === 'PENDING') {
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
                currentPage: parseInt(page),
                totalPages: Math.ceil(totalCount / take),
            },
        });
    }
    catch (error) {
        console.error('Error searching properties:', error);
        console.error('Full error details:', JSON.stringify(error, null, 2));
        res.status(500).json({
            success: false,
            error: 'Failed to search properties',
            details: process.env.NODE_ENV === 'development' ? error : undefined,
        });
    }
});
router.get('/autocomplete', async (req, res) => {
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
        const { data: locationSuggestions } = await supabase_1.supabaseAdmin
            .from('properties')
            .select('emirate, city, area')
            .eq('is_active', true)
            .or(`emirate.ilike.%${searchTerm}%,city.ilike.%${searchTerm}%,area.ilike.%${searchTerm}%`)
            .limit(parseInt(limit));
        const { data: typeSuggestions } = await supabase_1.supabaseAdmin
            .from('properties')
            .select('type')
            .eq('is_active', true)
            .ilike('type', `%${searchTerm}%`)
            .limit(5);
        const { data: titleSuggestions } = await supabase_1.supabaseAdmin
            .from('properties')
            .select('id, title, city, emirate')
            .eq('is_active', true)
            .ilike('title', `%${searchTerm}%`)
            .limit(5);
        const suggestions = [];
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
                suggestions: suggestions.slice(0, parseInt(limit))
            }
        });
    }
    catch (error) {
        console.error('Error getting autocomplete suggestions:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to get suggestions'
        });
    }
});
router.get('/nearby', async (req, res) => {
    try {
        const { lat, lng, radius = 5, limit = 50 } = req.query;
        if (!lat || !lng) {
            return res.status(400).json({
                success: false,
                error: 'Latitude and longitude are required',
            });
        }
        const latitude = parseFloat(lat);
        const longitude = parseFloat(lng);
        const radiusKm = parseFloat(radius);
        const latDelta = radiusKm / 111;
        const lngDelta = radiusKm / (111 * Math.cos(latitude * Math.PI / 180));
        const { data: properties, error } = await supabase_1.supabaseAdmin
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
            .limit(parseInt(limit));
        if (error) {
            throw error;
        }
        const propertiesWithDistance = properties?.map((property) => ({
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
            distance: calculateDistance(latitude, longitude, property.latitude, property.longitude),
        })).sort((a, b) => a.distance - b.distance) || [];
        res.json({
            success: true,
            data: propertiesWithDistance,
        });
    }
    catch (error) {
        console.error('Error fetching nearby properties:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch nearby properties',
        });
    }
});
router.post('/search-analytics', async (req, res) => {
    try {
        const { query, filters, resultCount, timestamp } = req.body;
        const { error } = await supabase_1.supabaseAdmin
            .from('analytics_events')
            .insert({
            event_type: 'SEARCH',
            event_data: {
                query,
                filters,
                resultCount,
                timestamp
            },
            user_id: req.user?.id || null,
            created_at: new Date().toISOString()
        });
        if (error) {
            console.error('Error storing search analytics:', error);
        }
        res.json({
            success: true,
            message: 'Search analytics recorded'
        });
    }
    catch (error) {
        console.error('Error tracking search analytics:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to track search analytics'
        });
    }
});
router.get('/popular-searches', async (req, res) => {
    try {
        const { data: popularLocations } = await supabase_1.supabaseAdmin
            .from('properties')
            .select('emirate, city, area')
            .eq('is_active', true);
        const locationCounts = {};
        popularLocations?.forEach(prop => {
            if (prop.emirate)
                locationCounts[prop.emirate] = (locationCounts[prop.emirate] || 0) + 1;
            if (prop.city)
                locationCounts[prop.city] = (locationCounts[prop.city] || 0) + 1;
            if (prop.area)
                locationCounts[prop.area] = (locationCounts[prop.area] || 0) + 1;
        });
        const sortedLocations = Object.entries(locationCounts)
            .sort(([, a], [, b]) => b - a)
            .slice(0, 10)
            .map(([location, count]) => ({ location, count }));
        const { data: propertyTypes } = await supabase_1.supabaseAdmin
            .from('properties')
            .select('type')
            .eq('is_active', true);
        const typeCounts = {};
        propertyTypes?.forEach(prop => {
            if (prop.type) {
                typeCounts[prop.type] = (typeCounts[prop.type] || 0) + 1;
            }
        });
        const sortedTypes = Object.entries(typeCounts)
            .sort(([, a], [, b]) => b - a)
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
    }
    catch (error) {
        console.error('Error getting popular searches:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to get popular searches'
        });
    }
});
router.get('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { data: property, error } = await supabase_1.supabaseAdmin
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
        const imageUrls = property.images ? property.images.split(',').map((url) => url.trim()).filter((url) => url) : [];
        const imageObjects = imageUrls.map((url, index) => ({
            id: `${property.id}-img-${index}`,
            url: url,
            caption: '',
            order: index
        }));
        let status = 'INACTIVE';
        if (property.is_active) {
            if (property.verification_status === 'VERIFIED') {
                status = 'ACTIVE';
            }
            else if (property.verification_status === 'PENDING') {
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
            reviews: [],
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
    }
    catch (error) {
        console.error('Error fetching property:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch property',
        });
    }
});
router.post('/', async (req, res) => {
    try {
        const validatedData = createPropertySchema.parse(req.body);
        const hostId = req.body.hostId;
        if (!hostId) {
            return res.status(401).json({
                success: false,
                error: 'Host ID is required',
            });
        }
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
        const { data: property, error } = await supabase_1.supabaseAdmin
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
    }
    catch (error) {
        console.error('Error creating property:', error);
        if (error instanceof zod_1.z.ZodError) {
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
router.put('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const validatedData = basePropertySchema.partial().parse(req.body);
        const updateData = {};
        if (validatedData.rentalType)
            updateData.rental_type = validatedData.rentalType;
        if (validatedData.title)
            updateData.title = validatedData.title;
        if (validatedData.description)
            updateData.description = validatedData.description;
        if (validatedData.type)
            updateData.type = validatedData.type;
        if (validatedData.category)
            updateData.category = validatedData.category;
        if (validatedData.emirate)
            updateData.emirate = validatedData.emirate;
        if (validatedData.city)
            updateData.city = validatedData.city;
        if (validatedData.address)
            updateData.address = validatedData.address;
        if (validatedData.latitude)
            updateData.latitude = validatedData.latitude;
        if (validatedData.longitude)
            updateData.longitude = validatedData.longitude;
        if (validatedData.bedrooms !== undefined)
            updateData.bedrooms = validatedData.bedrooms;
        if (validatedData.bathrooms !== undefined)
            updateData.bathrooms = validatedData.bathrooms;
        if (validatedData.guests !== undefined)
            updateData.guests = validatedData.guests;
        if (validatedData.area)
            updateData.area = validatedData.area;
        if (validatedData.basePrice)
            updateData.base_price = validatedData.basePrice;
        if (validatedData.cleaningFee !== undefined)
            updateData.cleaning_fee = validatedData.cleaningFee;
        if (validatedData.yearlyPrice)
            updateData.yearly_price = validatedData.yearlyPrice;
        if (validatedData.monthlyPrice)
            updateData.monthly_price = validatedData.monthlyPrice;
        if (validatedData.utilitiesIncluded !== undefined)
            updateData.utilities_included = validatedData.utilitiesIncluded;
        if (validatedData.maintenanceIncluded !== undefined)
            updateData.maintenance_included = validatedData.maintenanceIncluded;
        if (validatedData.contractMinDuration)
            updateData.contract_min_duration = validatedData.contractMinDuration;
        if (validatedData.contractMaxDuration)
            updateData.contract_max_duration = validatedData.contractMaxDuration;
        if (validatedData.securityDeposit !== undefined)
            updateData.security_deposit = validatedData.securityDeposit;
        if (validatedData.serviceFee !== undefined)
            updateData.service_fee = validatedData.serviceFee;
        if (validatedData.images)
            updateData.images = validatedData.images;
        if (validatedData.amenities)
            updateData.amenities = validatedData.amenities;
        if (validatedData.houseRules)
            updateData.house_rules = validatedData.houseRules;
        if (validatedData.isInstantBook !== undefined)
            updateData.is_instant_book = validatedData.isInstantBook;
        if (validatedData.minStay)
            updateData.min_stay = validatedData.minStay;
        if (validatedData.maxStay)
            updateData.max_stay = validatedData.maxStay;
        if (validatedData.checkInTime)
            updateData.check_in_time = validatedData.checkInTime;
        if (validatedData.checkOutTime)
            updateData.check_out_time = validatedData.checkOutTime;
        updateData.updated_at = new Date().toISOString();
        const { data: property, error } = await supabase_1.supabaseAdmin
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
    }
    catch (error) {
        console.error('Error updating property:', error);
        if (error instanceof zod_1.z.ZodError) {
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
router.delete('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { data: property, error } = await supabase_1.supabaseAdmin
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
    }
    catch (error) {
        console.error('Error deleting property:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to delete property',
        });
    }
});
function calculateDistance(lat1, lng1, lat2, lng2) {
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLng / 2) * Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c;
    return distance;
}
exports.default = router;
//# sourceMappingURL=properties.js.map