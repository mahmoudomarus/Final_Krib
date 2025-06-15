import { Router, Request, Response } from 'express';
import { supabaseAdmin } from '../lib/supabase';
import { z } from 'zod';
import { authMiddleware, AuthenticatedRequest } from '../middleware/auth';

const router: Router = Router();

// Validation schemas
const createBookingSchema = z.object({
  propertyId: z.string(),
  checkIn: z.string().refine((date) => !isNaN(Date.parse(date)), 'Invalid check-in date'),
  checkOut: z.string().refine((date) => !isNaN(Date.parse(date)), 'Invalid check-out date'),
  guests: z.number().min(1).max(20),
  message: z.string().optional(),
  specialRequests: z.string().optional(),
  guestInfo: z.object({
    firstName: z.string(),
    lastName: z.string(),
    email: z.string().email(),
    phone: z.string(),
    nationality: z.string(),
    emiratesId: z.string().optional(),
    emergencyContact: z.object({
      name: z.string(),
      phone: z.string(),
      relationship: z.string(),
    }).optional(),
  }),
});

const updateBookingSchema = z.object({
  status: z.enum(['PENDING', 'CONFIRMED', 'CANCELLED', 'COMPLETED']).optional(),
  checkIn: z.string().refine((date) => !isNaN(Date.parse(date)), 'Invalid date').optional(),
  checkOut: z.string().refine((date) => !isNaN(Date.parse(date)), 'Invalid date').optional(),
  guests: z.number().min(1).max(20).optional(),
  specialRequests: z.string().optional(),
});

// GET /api/bookings - Get bookings for current user
router.get('/', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const {
      status,
      propertyId,
      hostId,
      guestId,
      startDate,
      endDate,
      limit = '20',
      offset = '0'
    } = req.query;

    // Use authenticated user's ID
    const userId = req.user!.id;

    let query = supabaseAdmin
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
      .range(parseInt(offset as string), parseInt(offset as string) + parseInt(limit as string) - 1)
      .order('created_at', { ascending: false });

    // Apply filters
    if (hostId) {
      // For host bookings, join with properties table
      query = query.eq('properties.host_id', hostId);
    } else if (guestId) {
      query = query.eq('guest_id', guestId);
    } else {
      // Default: show bookings where user is the guest
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

    // Transform data for frontend (convert snake_case to camelCase)
    const transformedBookings = (bookings || []).map((booking: any) => ({
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
  } catch (error) {
    console.error('Error fetching bookings:', error);
    res.status(500).json({ error: 'Failed to fetch bookings' });
  }
});

// GET /api/bookings/:id - Get single booking
router.get('/:id', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user!.id;

    const { data: booking, error } = await supabaseAdmin
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

    // Transform data for frontend
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
  } catch (error) {
    console.error('Error fetching booking:', error);
    res.status(500).json({ error: 'Failed to fetch booking' });
  }
});

// POST /api/bookings - Create new booking
router.post('/', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const validatedData = createBookingSchema.parse(req.body);
    const guestId = req.user!.id; // Use authenticated user's ID

    const checkIn = new Date(validatedData.checkIn);
    const checkOut = new Date(validatedData.checkOut);

    // Validate dates
    if (checkIn >= checkOut) {
      return res.status(400).json({ error: 'Check-out date must be after check-in date' });
    }

    if (checkIn <= new Date()) {
      return res.status(400).json({ error: 'Check-in date must be in the future' });
    }

    // Get property details
    const { data: property, error: propertyError } = await supabaseAdmin
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

    // Check for conflicting bookings
    const { data: conflictingBooking } = await supabaseAdmin
      .from('bookings')
      .select('*')
      .eq('property_id', validatedData.propertyId)
      .eq('status', 'PENDING')
      .or(`check_out.gt.${checkIn.toISOString()},check_in.lt.${checkOut.toISOString()}`)
      .single();

    if (conflictingBooking) {
      return res.status(400).json({ error: 'Property is not available for the selected dates' });
    }

    // Calculate pricing
    const nights = Math.ceil((checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24));
    const baseAmount = nights * property.base_price;
    const cleaningFee = property.cleaning_fee || 0;
    const serviceFee = Math.round(baseAmount * 0.15); // 15% service fee
    const totalAmount = baseAmount + cleaningFee + serviceFee;

    // Create booking
    const { data: bookingData, error: bookingError } = await supabaseAdmin
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

    // Create payment entries
    await supabaseAdmin
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
        due_date: new Date(Date.now() + 1000 * 60 * 60 * 24), // Due in 24 hours
        description: `Booking payment for ${property.title}`,
      })
      .select('*');

    // If there's a security deposit, create a separate payment entry
    if (property.security_deposit && property.security_deposit > 0) {
      await supabaseAdmin
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
          due_date: checkIn, // Due by check-in
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
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Invalid data', details: error.errors });
    }
    console.error('Error creating booking:', error);
    res.status(500).json({ error: 'Failed to create booking' });
  }
});

// PUT /api/bookings/:id - Update booking
router.put('/:id', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const validatedData = updateBookingSchema.parse(req.body);
    const userId = req.user!.id;

    // Find booking and verify user can update it
    const { data: booking, error } = await supabaseAdmin
      .from('bookings')
      .select('*')
      .eq('id', id)
      .eq('guest_id', userId)
      .or(`properties.host_id.eq.${userId}`)
      .single();

    if (error || !booking) {
      return res.status(404).json({ error: 'Booking not found or unauthorized' });
    }

    // Prepare update data
    const updateData: any = {};
    
    if (validatedData.status) {
      updateData.status = validatedData.status;
    }

    if (validatedData.checkIn || validatedData.checkOut) {
      const checkIn = validatedData.checkIn ? new Date(validatedData.checkIn) : booking.check_in;
      const checkOut = validatedData.checkOut ? new Date(validatedData.checkOut) : booking.check_out;

      if (checkIn >= checkOut) {
        return res.status(400).json({ error: 'Check-out date must be after check-in date' });
      }

      // Recalculate pricing if dates changed
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

    // Update booking
    const { data: updatedBooking, error: updateError } = await supabaseAdmin
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
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Invalid data', details: error.errors });
    }
    console.error('Error updating booking:', error);
    res.status(500).json({ error: 'Failed to update booking' });
  }
});

// DELETE /api/bookings/:id - Cancel booking
router.delete('/:id', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { reason = 'Cancelled by user' } = req.body;
    const userId = req.user!.id;

    // Find booking and verify user can cancel it
    const { data: booking, error } = await supabaseAdmin
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

    // Update booking status
    const { data: updatedBooking, error: updateError } = await supabaseAdmin
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

    // Update related payments
    await supabaseAdmin
      .from('payments')
      .update({
        status: 'CANCELLED'
      })
      .eq('booking_id', id)
      .eq('status', 'PENDING');

    res.json({ message: 'Booking cancelled successfully', booking: updatedBooking });
  } catch (error) {
    console.error('Error cancelling booking:', error);
    res.status(500).json({ error: 'Failed to cancel booking' });
  }
});

// GET /api/bookings/availability/:propertyId - Check property availability
router.get('/availability/:propertyId', async (req: Request, res: Response) => {
  try {
    const { propertyId } = req.params;
    const { startDate, endDate } = req.query;

    let query = supabaseAdmin
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
  } catch (error) {
    console.error('Error checking availability:', error);
    res.status(500).json({ error: 'Failed to check availability' });
  }
});

export default router; 