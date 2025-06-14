"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const supabase_1 = require("../lib/supabase");
const router = express_1.default.Router();
router.get('/', async (req, res) => {
    try {
        const { page = 1, limit = 20, emirate, city, type, minPrice, maxPrice, bedrooms, bathrooms, maxGuests, instantBook, } = req.query;
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
        const cleanType = safeParseString(type);
        const cleanBedrooms = safeParseInt(bedrooms);
        const cleanBathrooms = safeParseInt(bathrooms);
        const cleanMaxGuests = safeParseInt(maxGuests);
        const cleanMinPrice = safeParseFloat(minPrice);
        const cleanMaxPrice = safeParseFloat(maxPrice);
        if (cleanEmirate)
            query = query.eq('emirate', cleanEmirate);
        if (cleanCity)
            query = query.eq('city', cleanCity);
        if (cleanType)
            query = query.eq('type', cleanType);
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
//# sourceMappingURL=properties-supabase.js.map