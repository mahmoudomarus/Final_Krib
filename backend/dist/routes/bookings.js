"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const supabase_1 = require("../lib/supabase");
const zod_1 = require("zod");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
const createBookingSchema = zod_1.z.object({
    propertyId: zod_1.z.string(),
    checkIn: zod_1.z.string().refine((date) => !isNaN(Date.parse(date)), 'Invalid check-in date'),
    checkOut: zod_1.z.string().refine((date) => !isNaN(Date.parse(date)), 'Invalid check-out date'),
    guests: zod_1.z.number().min(1).max(20),
    message: zod_1.z.string().optional(),
    specialRequests: zod_1.z.string().optional(),
    guestInfo: zod_1.z.object({
        firstName: zod_1.z.string(),
        lastName: zod_1.z.string(),
        email: zod_1.z.string().email(),
        phone: zod_1.z.string(),
        nationality: zod_1.z.string(),
        emiratesId: zod_1.z.string().optional(),
        emergencyContact: zod_1.z.object({
            name: zod_1.z.string(),
            phone: zod_1.z.string(),
            relationship: zod_1.z.string(),
        }).optional(),
    }),
});
const updateBookingSchema = zod_1.z.object({
    status: zod_1.z.enum(['PENDING', 'CONFIRMED', 'CANCELLED', 'COMPLETED']).optional(),
    checkIn: zod_1.z.string().refine((date) => !isNaN(Date.parse(date)), 'Invalid date').optional(),
    checkOut: zod_1.z.string().refine((date) => !isNaN(Date.parse(date)), 'Invalid date').optional(),
    guests: zod_1.z.number().min(1).max(20).optional(),
    specialRequests: zod_1.z.string().optional(),
});
router.get('/', auth_1.authMiddleware, async (req, res) => {
    try {
        const { status, propertyId, hostId, guestId, startDate, endDate, limit = '20', offset = '0' } = req.query;
        const userId = req.user.id;
        let query = supabase_1.supabaseAdmin
            .from('bookings')
            .select(`
        id,
        check_in,
        check_out,
        guests,
        base_amount,
        cleaning_fee,
        service_fee,
        total_amount,
        status,
        special_requests,
        guest_notes,
        created_at,
        updated_at,
        properties (
          id,
          title,
          city,
          emirate,
          images,
          base_price,
          users!properties_host_id_fkey (
            id,
            first_name,
            last_name,
            avatar,
            phone,
            email
          )
        ),
        users!bookings_guest_id_fkey (
          id,
          first_name,
          last_name,
          avatar,
          phone,
          email
        )
      `)
            .range(parseInt(offset), parseInt(offset) + parseInt(limit) - 1)
            .order('created_at', { ascending: false });
        if (hostId) {
            query = query.eq('properties.host_id', hostId);
        }
        else if (guestId) {
            query = query.eq('guest_id', guestId);
        }
        else {
            query = query.eq('guest_id', userId);
        }
        if (status) {
            query = query.eq('status', status);
        }
        if (propertyId) {
            query = query.eq('property_id', propertyId);
        }
        if (startDate) {
            query = query.gte('created_at', startDate);
        }
        if (endDate) {
            query = query.lte('created_at', endDate);
        }
        const { data: bookings, error, count } = await query;
        if (error) {
            console.error('Error fetching bookings:', error);
            return res.status(500).json({ error: 'Failed to fetch bookings' });
        }
        const transformedBookings = (bookings || []).map((booking) => ({
            id: booking.id,
            checkIn: booking.check_in,
            checkOut: booking.check_out,
            guests: booking.guests,
            baseAmount: booking.base_amount,
            cleaningFee: booking.cleaning_fee,
            serviceFee: booking.service_fee,
            totalAmount: booking.total_amount,
            status: booking.status,
            specialRequests: booking.special_requests,
            guestNotes: booking.guest_notes,
            createdAt: booking.created_at,
            updatedAt: booking.updated_at,
            property: booking.properties ? {
                id: booking.properties.id,
                title: booking.properties.title,
                city: booking.properties.city,
                emirate: booking.properties.emirate,
                images: booking.properties.images ? booking.properties.images.split(',').filter(Boolean) : [],
                basePrice: booking.properties.base_price,
                host: booking.properties.users ? {
                    id: booking.properties.users.id,
                    firstName: booking.properties.users.first_name,
                    lastName: booking.properties.users.last_name,
                    avatar: booking.properties.users.avatar,
                    phone: booking.properties.users.phone,
                    email: booking.properties.users.email,
                } : null
            } : null,
            guest: booking.users ? {
                id: booking.users.id,
                firstName: booking.users.first_name,
                lastName: booking.users.last_name,
                avatar: booking.users.avatar,
                phone: booking.users.phone,
                email: booking.users.email,
            } : null
        }));
        res.json({
            bookings: transformedBookings,
            total: count || transformedBookings.length,
        });
    }
    catch (error) {
        console.error('Error fetching bookings:', error);
        res.status(500).json({ error: 'Failed to fetch bookings' });
    }
});
router.get('/:id', auth_1.authMiddleware, async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.id;
        const { data: booking, error } = await supabase_1.supabaseAdmin
            .from('bookings')
            .select(`
        *,
        properties (
          *,
          users!properties_host_id_fkey (*)
        ),
        users!bookings_guest_id_fkey (*)
      `)
            .eq('id', id)
            .or(`guest_id.eq.${userId},properties.host_id.eq.${userId}`)
            .single();
        if (error || !booking) {
            return res.status(404).json({ error: 'Booking not found' });
        }
        const transformedBooking = {
            id: booking.id,
            checkIn: booking.check_in,
            checkOut: booking.check_out,
            guests: booking.guests,
            baseAmount: booking.base_amount,
            cleaningFee: booking.cleaning_fee,
            serviceFee: booking.service_fee,
            totalAmount: booking.total_amount,
            status: booking.status,
            specialRequests: booking.special_requests,
            guestNotes: booking.guest_notes,
            createdAt: booking.created_at,
            updatedAt: booking.updated_at,
            property: booking.properties ? {
                ...booking.properties,
                images: booking.properties.images ? booking.properties.images.split(',').filter(Boolean) : [],
                host: booking.properties.users
            } : null,
            guest: booking.users
        };
        res.json(transformedBooking);
    }
    catch (error) {
        console.error('Error fetching booking:', error);
        res.status(500).json({ error: 'Failed to fetch booking' });
    }
});
router.post('/', auth_1.authMiddleware, async (req, res) => {
    try {
        const validatedData = createBookingSchema.parse(req.body);
        const guestId = req.user.id;
        const checkIn = new Date(validatedData.checkIn);
        const checkOut = new Date(validatedData.checkOut);
        if (checkIn >= checkOut) {
            return res.status(400).json({ error: 'Check-out date must be after check-in date' });
        }
        if (checkIn <= new Date()) {
            return res.status(400).json({ error: 'Check-in date must be in the future' });
        }
        const { data: property, error: propertyError } = await supabase_1.supabaseAdmin
            .from('properties')
            .select('*')
            .eq('id', validatedData.propertyId)
            .single();
        if (propertyError || !property) {
            return res.status(404).json({ error: 'Property not found' });
        }
        if (!property.is_active) {
            return res.status(400).json({ error: 'Property is not available for booking' });
        }
        if (validatedData.guests > property.guests) {
            return res.status(400).json({ error: 'Number of guests exceeds property limit' });
        }
        const { data: conflictingBooking } = await supabase_1.supabaseAdmin
            .from('bookings')
            .select('*')
            .eq('property_id', validatedData.propertyId)
            .eq('status', 'PENDING')
            .or(`check_out.gt.${checkIn.toISOString()},check_in.lt.${checkOut.toISOString()}`)
            .single();
        if (conflictingBooking) {
            return res.status(400).json({ error: 'Property is not available for the selected dates' });
        }
        const nights = Math.ceil((checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24));
        const baseAmount = nights * property.base_price;
        const cleaningFee = property.cleaning_fee || 0;
        const serviceFee = Math.round(baseAmount * 0.15);
        const totalAmount = baseAmount + cleaningFee + serviceFee;
        const { data: bookingData, error: bookingError } = await supabase_1.supabaseAdmin
            .from('bookings')
            .insert({
            property_id: validatedData.propertyId,
            guest_id: guestId,
            check_in: checkIn,
            check_out: checkOut,
            guests: validatedData.guests,
            base_amount: baseAmount,
            cleaning_fee: cleaningFee,
            service_fee: serviceFee,
            total_amount: totalAmount,
            status: property.is_instant_book ? 'CONFIRMED' : 'PENDING',
            special_requests: validatedData.specialRequests,
            guest_notes: validatedData.message,
        })
            .select('*')
            .single();
        if (bookingError) {
            console.error('Error creating booking:', bookingError);
            return res.status(500).json({ error: 'Failed to create booking' });
        }
        await supabase_1.supabaseAdmin
            .from('payments')
            .insert({
            user_id: guestId,
            property_id: validatedData.propertyId,
            booking_id: bookingData.id,
            amount: totalAmount,
            currency: 'AED',
            type: 'BOOKING_PAYMENT',
            method: 'STRIPE',
            status: 'PENDING',
            due_date: new Date(Date.now() + 1000 * 60 * 60 * 24),
            description: `Booking payment for ${property.title}`,
        })
            .select('*');
        if (property.security_deposit && property.security_deposit > 0) {
            await supabase_1.supabaseAdmin
                .from('payments')
                .insert({
                user_id: guestId,
                property_id: validatedData.propertyId,
                booking_id: bookingData.id,
                amount: property.security_deposit,
                currency: 'AED',
                type: 'SECURITY_DEPOSIT',
                method: 'STRIPE',
                status: 'PENDING',
                due_date: checkIn,
                description: `Security deposit for ${property.title}`,
            })
                .select('*');
        }
        res.status(201).json({
            ...bookingData,
            property: {
                ...property,
                images: property.images ? property.images.split(',').filter(Boolean) : [],
            }
        });
    }
    catch (error) {
        if (error instanceof zod_1.z.ZodError) {
            return res.status(400).json({ error: 'Invalid data', details: error.errors });
        }
        console.error('Error creating booking:', error);
        res.status(500).json({ error: 'Failed to create booking' });
    }
});
router.put('/:id', auth_1.authMiddleware, async (req, res) => {
    try {
        const { id } = req.params;
        const validatedData = updateBookingSchema.parse(req.body);
        const userId = req.user.id;
        const { data: booking, error } = await supabase_1.supabaseAdmin
            .from('bookings')
            .select('*')
            .eq('id', id)
            .eq('guest_id', userId)
            .or(`properties.host_id.eq.${userId}`)
            .single();
        if (error || !booking) {
            return res.status(404).json({ error: 'Booking not found or unauthorized' });
        }
        const updateData = {};
        if (validatedData.status) {
            updateData.status = validatedData.status;
        }
        if (validatedData.checkIn || validatedData.checkOut) {
            const checkIn = validatedData.checkIn ? new Date(validatedData.checkIn) : booking.check_in;
            const checkOut = validatedData.checkOut ? new Date(validatedData.checkOut) : booking.check_out;
            if (checkIn >= checkOut) {
                return res.status(400).json({ error: 'Check-out date must be after check-in date' });
            }
            const nights = Math.ceil((checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24));
            const baseAmount = nights * booking.base_amount;
            const cleaningFee = booking.cleaning_fee || 0;
            const serviceFee = Math.round(baseAmount * 0.15);
            const totalAmount = baseAmount + cleaningFee + serviceFee;
            updateData.check_in = checkIn;
            updateData.check_out = checkOut;
            updateData.base_amount = baseAmount;
            updateData.total_amount = totalAmount;
        }
        if (validatedData.guests) {
            if (validatedData.guests > booking.guests) {
                return res.status(400).json({ error: 'Number of guests exceeds property limit' });
            }
            updateData.guests = validatedData.guests;
        }
        if (validatedData.specialRequests !== undefined) {
            updateData.special_requests = validatedData.specialRequests;
        }
        const { data: updatedBooking, error: updateError } = await supabase_1.supabaseAdmin
            .from('bookings')
            .update(updateData)
            .eq('id', id)
            .select('*')
            .single();
        if (updateError) {
            console.error('Error updating booking:', updateError);
            return res.status(500).json({ error: 'Failed to update booking' });
        }
        res.json({
            ...updatedBooking,
            property: {
                ...booking.properties,
                images: booking.properties ? booking.properties.images ? booking.properties.images.split(',').filter(Boolean) : [] : null,
            }
        });
    }
    catch (error) {
        if (error instanceof zod_1.z.ZodError) {
            return res.status(400).json({ error: 'Invalid data', details: error.errors });
        }
        console.error('Error updating booking:', error);
        res.status(500).json({ error: 'Failed to update booking' });
    }
});
router.delete('/:id', auth_1.authMiddleware, async (req, res) => {
    try {
        const { id } = req.params;
        const { reason = 'Cancelled by user' } = req.body;
        const userId = req.user.id;
        const { data: booking, error } = await supabase_1.supabaseAdmin
            .from('bookings')
            .select('*')
            .eq('id', id)
            .eq('guest_id', userId)
            .or(`properties.host_id.eq.${userId}`)
            .single();
        if (error || !booking) {
            return res.status(404).json({ error: 'Booking not found or unauthorized' });
        }
        if (booking.status === 'CANCELLED' || booking.status === 'COMPLETED') {
            return res.status(400).json({ error: 'Booking cannot be cancelled' });
        }
        const { data: updatedBooking, error: updateError } = await supabase_1.supabaseAdmin
            .from('bookings')
            .update({
            status: 'CANCELLED',
            cancellation_reason: reason,
            cancelled_at: new Date(),
            cancelled_by: userId,
        })
            .eq('id', id)
            .select('*')
            .single();
        if (updateError) {
            console.error('Error cancelling booking:', updateError);
            return res.status(500).json({ error: 'Failed to cancel booking' });
        }
        await supabase_1.supabaseAdmin
            .from('payments')
            .update({
            status: 'CANCELLED'
        })
            .eq('booking_id', id)
            .eq('status', 'PENDING');
        res.json({ message: 'Booking cancelled successfully', booking: updatedBooking });
    }
    catch (error) {
        console.error('Error cancelling booking:', error);
        res.status(500).json({ error: 'Failed to cancel booking' });
    }
});
router.get('/availability/:propertyId', async (req, res) => {
    try {
        const { propertyId } = req.params;
        const { startDate, endDate } = req.query;
        let query = supabase_1.supabaseAdmin
            .from('bookings')
            .select('*')
            .eq('property_id', propertyId)
            .eq('status', 'PENDING')
            .or(`check_out.gt.${startDate},check_in.lt.${endDate}`);
        const { data: conflictingBookings, error } = await query;
        if (error) {
            console.error('Error checking availability:', error);
            return res.status(500).json({ error: 'Failed to check availability' });
        }
        const isAvailable = conflictingBookings.length === 0;
        res.json({
            available: isAvailable,
            conflictingBookings: conflictingBookings.map(booking => ({
                checkIn: booking.check_in,
                checkOut: booking.check_out,
                status: booking.status,
            }))
        });
    }
    catch (error) {
        console.error('Error checking availability:', error);
        res.status(500).json({ error: 'Failed to check availability' });
    }
});
exports.default = router;
//# sourceMappingURL=bookings.js.map