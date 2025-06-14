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
        let whereClause = {
            isActive: true,
        };
        const cleanEmirate = safeParseString(emirate);
        const cleanCity = safeParseString(city);
        const cleanArea = safeParseString(area);
        if (cleanEmirate)
            whereClause.emirate = cleanEmirate;
        if (cleanCity)
            whereClause.city = cleanCity;
        if (cleanArea)
            whereClause.area = cleanArea;
        const cleanPropertyType = safeParseString(propertyType);
        if (cleanPropertyType) {
            whereClause.type = { in: Array.isArray(cleanPropertyType) ? cleanPropertyType : [cleanPropertyType] };
        }
        const cleanRentalType = safeParseString(rentalType);
        if (cleanRentalType)
            whereClause.rentalType = cleanRentalType;
        const cleanBedrooms = safeParseInt(bedrooms);
        const cleanBathrooms = safeParseInt(bathrooms);
        const cleanMaxGuests = safeParseInt(maxGuests);
        if (cleanBedrooms !== undefined && cleanBedrooms >= 0) {
            whereClause.bedrooms = { gte: cleanBedrooms };
        }
        if (cleanBathrooms !== undefined && cleanBathrooms >= 0) {
            whereClause.bathrooms = { gte: cleanBathrooms };
        }
        if (cleanMaxGuests !== undefined && cleanMaxGuests > 0) {
            whereClause.guests = { gte: cleanMaxGuests };
        }
        const cleanMinPrice = safeParseFloat(minPrice);
        const cleanMaxPrice = safeParseFloat(maxPrice);
        if (cleanMinPrice !== undefined && cleanMinPrice > 0) {
            whereClause.basePrice = { gte: cleanMinPrice };
        }
        if (cleanMaxPrice !== undefined && cleanMaxPrice > 0) {
            whereClause.basePrice = {
                ...whereClause.basePrice,
                lte: cleanMaxPrice,
            };
        }
        const cleanRating = safeParseFloat(rating);
        if (cleanRating !== undefined && cleanRating > 0) {
            whereClause.averageRating = { gte: cleanRating };
        }
        if (instantBook === 'true') {
            whereClause.isInstantBook = true;
        }
        const cleanAmenities = safeParseString(amenities);
        if (cleanAmenities) {
            whereClause.amenities = {
                contains: cleanAmenities
            };
        }
        if (bounds && typeof bounds === 'string') {
            const boundsArray = bounds.split(',').map(parseFloat);
            if (boundsArray.length === 4 && boundsArray.every(val => !isNaN(val))) {
                const [sw_lat, sw_lng, ne_lat, ne_lng] = boundsArray;
                whereClause.latitude = { gte: sw_lat, lte: ne_lat };
                whereClause.longitude = { gte: sw_lng, lte: ne_lng };
            }
        }
        if (center && radius && typeof center === 'string' && typeof radius === 'string') {
            const centerArray = center.split(',').map(parseFloat);
            const radiusKm = parseFloat(radius);
            if (centerArray.length === 2 && centerArray.every(val => !isNaN(val)) && !isNaN(radiusKm)) {
                const [lat, lng] = centerArray;
                const latDelta = radiusKm / 111;
                const lngDelta = radiusKm / (111 * Math.cos(lat * Math.PI / 180));
                whereClause.latitude = { gte: lat - latDelta, lte: lat + latDelta };
                whereClause.longitude = { gte: lng - lngDelta, lte: lng + lngDelta };
            }
        }
        const skip = (parseInt(page) - 1) * parseInt(limit);
        const take = parseInt(limit);
        console.log('Properties query whereClause:', JSON.stringify(whereClause, null, 2));
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
      `)
            .eq('is_active', true);
        if (cleanEmirate)
            query = query.eq('emirate', cleanEmirate);
        if (cleanCity)
            query = query.eq('city', cleanCity);
        if (cleanPropertyType)
            query = query.eq('type', cleanPropertyType);
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
        const { data: properties, error: propertiesError, count } = await query
            .range(skip, skip + take - 1)
            .order('created_at', { ascending: false });
        if (propertiesError) {
            throw propertiesError;
        }
        const totalCount = count || 0;
        const transformedProperties = properties?.map((property) => {
            return {
                ...property,
                host: property.users,
                averageRating: null,
                reviewCount: 0,
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
        let whereClause = {
            isActive: true,
        };
        if (q) {
            whereClause.OR = [
                { title: { contains: q, mode: 'insensitive' } },
                { description: { contains: q, mode: 'insensitive' } },
                { area: { contains: q, mode: 'insensitive' } },
                { city: { contains: q, mode: 'insensitive' } },
                { emirate: { contains: q, mode: 'insensitive' } },
            ];
        }
        let orderBy = { createdAt: 'desc' };
        switch (sortBy) {
            case 'price_low':
                orderBy = { basePrice: 'asc' };
                break;
            case 'price_high':
                orderBy = { basePrice: 'desc' };
                break;
            case 'rating':
                orderBy = { rating: 'desc' };
                break;
            case 'newest':
                orderBy = { createdAt: 'desc' };
                break;
            default:
                orderBy = { createdAt: 'desc' };
        }
        const skip = (parseInt(page) - 1) * parseInt(limit);
        const take = parseInt(limit);
        const [properties, totalCount] = await Promise.all([
            prisma.property.findMany({
                where: whereClause,
                include: {
                    host: {
                        select: {
                            id: true,
                            firstName: true,
                            lastName: true,
                            avatar: true,
                            isVerified: true,
                        },
                    },
                },
                skip,
                take,
                orderBy,
            }),
            prisma.property.count({ where: whereClause }),
        ]);
        res.json({
            success: true,
            data: {
                properties,
                totalCount,
                query: q,
                currentPage: parseInt(page),
                totalPages: Math.ceil(totalCount / take),
            },
        });
    }
    catch (error) {
        console.error('Error searching properties:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to search properties',
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
        const properties = await prisma.property.findMany({
            where: {
                isActive: true,
                latitude: { gte: latitude - latDelta, lte: latitude + latDelta },
                longitude: { gte: longitude - lngDelta, lte: longitude + lngDelta },
            },
            include: {
                host: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        avatar: true,
                        isVerified: true,
                    },
                },
            },
            take: parseInt(limit),
        });
        const propertiesWithDistance = properties.map((property) => ({
            ...property,
            distance: calculateDistance(latitude, longitude, property.latitude, property.longitude),
        })).sort((a, b) => a.distance - b.distance);
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
router.get('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const property = await prisma.property.findUnique({
            where: { id },
            include: {
                host: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        avatar: true,
                        isVerified: true,
                        isHost: true,
                        createdAt: true,
                    },
                },
                reviews: {
                    include: {
                        guest: {
                            select: {
                                id: true,
                                firstName: true,
                                lastName: true,
                                avatar: true,
                            },
                        },
                    },
                    orderBy: { createdAt: 'desc' },
                    take: 10,
                },
            },
        });
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
        console.error('Error fetching property:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch property',
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
    return R * c;
}
router.post('/', async (req, res) => {
    try {
        const { hostId, ...propertyData } = req.body;
        if (!hostId) {
            return res.status(400).json({
                success: false,
                error: 'Host ID is required',
            });
        }
        const validatedData = createPropertySchema.parse(propertyData);
        const host = await prisma.user.findUnique({
            where: { id: hostId },
        });
        if (!host) {
            return res.status(404).json({
                success: false,
                error: 'Host not found',
            });
        }
        if (!host.isHost) {
            return res.status(403).json({
                success: false,
                error: 'User is not registered as a host',
            });
        }
        const propertyId = `${validatedData.city.toLowerCase().replace(/\s+/g, '-')}-${Date.now()}`;
        const newProperty = await prisma.property.create({
            data: {
                id: propertyId,
                hostId,
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
                basePrice: validatedData.basePrice || 0,
                securityDeposit: validatedData.securityDeposit || 0,
                cleaningFee: validatedData.cleaningFee || 0,
                images: validatedData.images.join(','),
                amenities: validatedData.amenities.join(','),
                houseRules: validatedData.houseRules?.join(',') || '',
                isInstantBook: validatedData.isInstantBook,
                minStay: validatedData.minStay,
                maxStay: validatedData.maxStay,
                checkInTime: validatedData.checkInTime,
                checkOutTime: validatedData.checkOutTime,
                isActive: true,
                verificationStatus: 'PENDING',
            },
            include: {
                host: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        avatar: true,
                        isVerified: true,
                    },
                },
            },
        });
        res.status(201).json({
            success: true,
            data: newProperty,
            message: 'Property created successfully',
        });
    }
    catch (error) {
        console.error('Error creating property:', error);
        if (error instanceof zod_1.z.ZodError) {
            return res.status(400).json({
                success: false,
                error: 'Validation failed',
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
        const { hostId, ...updateData } = req.body;
        const existingProperty = await prisma.property.findUnique({
            where: { id },
        });
        if (!existingProperty) {
            return res.status(404).json({
                success: false,
                error: 'Property not found',
            });
        }
        if (existingProperty.hostId !== hostId) {
            return res.status(403).json({
                success: false,
                error: 'You can only update your own properties',
            });
        }
        const updateSchema = basePropertySchema.partial();
        const validatedData = updateSchema.parse(updateData);
        const updatePayload = { ...validatedData };
        if (validatedData.images) {
            updatePayload.images = validatedData.images.join(',');
        }
        if (validatedData.amenities) {
            updatePayload.amenities = validatedData.amenities.join(',');
        }
        if (validatedData.houseRules) {
            updatePayload.houseRules = validatedData.houseRules.join(',');
        }
        const updatedProperty = await prisma.property.update({
            where: { id },
            data: updatePayload,
            include: {
                host: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        avatar: true,
                        isVerified: true,
                    },
                },
            },
        });
        res.json({
            success: true,
            data: updatedProperty,
            message: 'Property updated successfully',
        });
    }
    catch (error) {
        console.error('Error updating property:', error);
        if (error instanceof zod_1.z.ZodError) {
            return res.status(400).json({
                success: false,
                error: 'Validation failed',
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
        const { hostId } = req.body;
        const existingProperty = await prisma.property.findUnique({
            where: { id },
        });
        if (!existingProperty) {
            return res.status(404).json({
                success: false,
                error: 'Property not found',
            });
        }
        if (existingProperty.hostId !== hostId) {
            return res.status(403).json({
                success: false,
                error: 'You can only delete your own properties',
            });
        }
        await prisma.property.update({
            where: { id },
            data: { isActive: false },
        });
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
exports.default = router;
//# sourceMappingURL=properties.js.map