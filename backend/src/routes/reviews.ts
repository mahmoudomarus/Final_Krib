import { Router, Request, Response } from 'express';
import { supabaseAdmin } from '../lib/supabase';
import { z } from 'zod';

const router: Router = Router();

// Validation schemas
const createReviewSchema = z.object({
  bookingId: z.string(),
  propertyId: z.string(),
  hostId: z.string(),
  overallRating: z.number().min(1).max(5),
  cleanlinessRating: z.number().min(1).max(5).optional(),
  accuracyRating: z.number().min(1).max(5).optional(),
  checkInRating: z.number().min(1).max(5).optional(),
  communicationRating: z.number().min(1).max(5).optional(),
  locationRating: z.number().min(1).max(5).optional(),
  valueRating: z.number().min(1).max(5).optional(),
  comment: z.string().min(10).max(1000),
  title: z.string().max(100).optional(),
  photos: z.array(z.string()).optional(),
});

const hostResponseSchema = z.object({
  response: z.string().min(1).max(500),
});

// GET /api/reviews - Get reviews with filters
router.get('/', async (req: Request, res: Response) => {
  try {
    const {
      propertyId,
      hostId,
      guestId,
      type = 'all', // 'all', 'received', 'written'
      sortBy = 'newest', // 'newest', 'oldest', 'highest', 'lowest'
      rating,
      limit = '10',
      offset = '0'
    } = req.query;

    // Build Supabase query
    let query = supabaseAdmin
      .from('reviews')
      .select(`
        *,
        users!reviews_guest_id_fkey (
          id,
          first_name,
          last_name,
          avatar,
          is_verified,
          kyc_status,
          nationality
        ),
        host:users!reviews_host_id_fkey (
          id,
          first_name,
          last_name,
          avatar
        ),
        properties!reviews_property_id_fkey (
          id,
          title,
          area,
          city,
          emirate,
          images
        ),
        bookings!reviews_booking_id_fkey (
          id,
          check_in,
          check_out,
          guests
        )
      `, { count: 'exact' });

    // Apply filters
    if (propertyId) query = query.eq('property_id', propertyId);
    if (rating) query = query.eq('overall_rating', parseFloat(rating as string));
    
    // Handle review type filtering
    if (type === 'received' && hostId) {
      query = query.eq('host_id', hostId);
    } else if (type === 'written' && guestId) {
      query = query.eq('guest_id', guestId);
    }

    // Sorting
    let orderColumn = 'created_at';
    let ascending = false;
    
    switch (sortBy) {
      case 'newest':
        orderColumn = 'created_at';
        ascending = false;
        break;
      case 'oldest':
        orderColumn = 'created_at';
        ascending = true;
        break;
      case 'highest':
        orderColumn = 'overall_rating';
        ascending = false;
        break;
      case 'lowest':
        orderColumn = 'overall_rating';
        ascending = true;
        break;
      default:
        orderColumn = 'created_at';
        ascending = false;
    }

    const { data: reviews, error, count } = await query
      .range(parseInt(offset as string), parseInt(offset as string) + parseInt(limit as string) - 1)
      .order(orderColumn, { ascending });

    if (error) {
      console.error('Error fetching reviews:', error);
      return res.status(500).json({ error: 'Failed to fetch reviews' });
    }

    // Transform data for frontend
    const transformedReviews = reviews?.map(review => ({
      ...review,
      guest: review.users,
      property: review.properties,
      booking: review.bookings,
      photos: review.photos || [],
      overallRating: review.overall_rating,
      cleanlinessRating: review.cleanliness_rating,
      accuracyRating: review.accuracy_rating,
      checkInRating: review.check_in_rating,
      communicationRating: review.communication_rating,
      locationRating: review.location_rating,
      valueRating: review.value_rating,
      hostResponse: review.host_response,
      hostResponseAt: review.host_response_at,
      createdAt: review.created_at,
    })) || [];

    res.json({
      reviews: transformedReviews,
      total: count || 0,
    });
  } catch (error) {
    console.error('Error fetching reviews:', error);
    res.status(500).json({ error: 'Failed to fetch reviews' });
  }
});

// GET /api/reviews/:id - Get single review
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const { data: review, error } = await supabaseAdmin
      .from('reviews')
      .select(`
        *,
        users!reviews_guest_id_fkey (
          id,
          first_name,
          last_name,
          avatar,
          is_verified,
          kyc_status,
          nationality
        ),
        host:users!reviews_host_id_fkey (
          id,
          first_name,
          last_name,
          avatar
        ),
        properties!reviews_property_id_fkey (
          id,
          title,
          area,
          city,
          emirate,
          images
        ),
        bookings!reviews_booking_id_fkey (
          id,
          check_in,
          check_out,
          guests
        )
      `)
      .eq('id', id)
      .single();

    if (error || !review) {
      return res.status(404).json({ error: 'Review not found' });
    }

    // Transform data
    const transformedReview = {
      ...review,
      guest: review.users,
      property: review.properties,
      booking: review.bookings,
      photos: review.photos || [],
      overallRating: review.overall_rating,
      cleanlinessRating: review.cleanliness_rating,
      accuracyRating: review.accuracy_rating,
      checkInRating: review.check_in_rating,
      communicationRating: review.communication_rating,
      locationRating: review.location_rating,
      valueRating: review.value_rating,
      hostResponse: review.host_response,
      hostResponseAt: review.host_response_at,
      createdAt: review.created_at,
    };

    res.json(transformedReview);
  } catch (error) {
    console.error('Error fetching review:', error);
    res.status(500).json({ error: 'Failed to fetch review' });
  }
});

// POST /api/reviews - Create new review
router.post('/', async (req: Request, res: Response) => {
  try {
    const validatedData = createReviewSchema.parse(req.body);
    const guestId = req.headers['x-user-id'] as string || 'test-user-1'; // TODO: Get from auth middleware

    // Check if review already exists for this booking
    const { data: existingReview, error: existingError } = await supabaseAdmin
      .from('reviews')
      .select('id')
      .eq('booking_id', validatedData.bookingId)
      .single();

    if (existingReview) {
      return res.status(400).json({ error: 'Review already exists for this booking' });
    }

    // Verify booking exists and belongs to the user
    const { data: booking, error: bookingError } = await supabaseAdmin
      .from('bookings')
      .select('id')
      .eq('id', validatedData.bookingId)
      .eq('guest_id', guestId)
      .eq('status', 'COMPLETED')
      .single();

    if (bookingError || !booking) {
      return res.status(400).json({ error: 'Valid completed booking not found' });
    }

    // Create review
    const reviewData = {
      booking_id: validatedData.bookingId,
      property_id: validatedData.propertyId,
      host_id: validatedData.hostId,
      guest_id: guestId,
      overall_rating: validatedData.overallRating,
      cleanliness_rating: validatedData.cleanlinessRating,
      accuracy_rating: validatedData.accuracyRating,
      check_in_rating: validatedData.checkInRating,
      communication_rating: validatedData.communicationRating,
      location_rating: validatedData.locationRating,
      value_rating: validatedData.valueRating,
      comment: validatedData.comment,
      title: validatedData.title,
      photos: validatedData.photos || [],
      created_at: new Date().toISOString(),
    };

    const { data: review, error: reviewError } = await supabaseAdmin
      .from('reviews')
      .insert([reviewData])
      .select(`
        *,
        users!reviews_guest_id_fkey (
          id,
          first_name,
          last_name,
          avatar,
          is_verified,
          nationality
        ),
        properties!reviews_property_id_fkey (
          id,
          title,
          area,
          city
        )
      `)
      .single();

    if (reviewError) {
      console.error('Error creating review:', reviewError);
      return res.status(500).json({ error: 'Failed to create review' });
    }

    // Calculate new average rating for property
    const { data: propertyReviews, error: ratingsError } = await supabaseAdmin
      .from('reviews')
      .select('overall_rating')
      .eq('property_id', validatedData.propertyId);

    if (!ratingsError && propertyReviews) {
      const averageRating = propertyReviews.reduce((sum, r) => sum + r.overall_rating, 0) / propertyReviews.length;
      console.log(`Property ${validatedData.propertyId} new average rating: ${averageRating} (${propertyReviews.length} reviews)`);
      
      // TODO: Update property average rating when property rating fields are added
    }

    // Transform response
    const transformedReview = {
      ...review,
      guest: review.users,
      property: review.properties,
      photos: review.photos || [],
      overallRating: review.overall_rating,
      cleanlinessRating: review.cleanliness_rating,
      accuracyRating: review.accuracy_rating,
      checkInRating: review.check_in_rating,
      communicationRating: review.communication_rating,
      locationRating: review.location_rating,
      valueRating: review.value_rating,
      createdAt: review.created_at,
    };

    res.status(201).json(transformedReview);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Invalid data', details: error.errors });
    }
    console.error('Error creating review:', error);
    res.status(500).json({ error: 'Failed to create review' });
  }
});

// POST /api/reviews/:id/response - Add host response
router.post('/:id/response', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const validatedData = hostResponseSchema.parse(req.body);
    const hostId = req.headers['x-user-id'] as string || 'test-host-1'; // TODO: Get from auth middleware

    // Verify review exists and host owns the property
    const { data: review, error: reviewError } = await supabaseAdmin
      .from('reviews')
      .select('id, host_response')
      .eq('id', id)
      .eq('host_id', hostId)
      .single();

    if (reviewError || !review) {
      return res.status(404).json({ error: 'Review not found or unauthorized' });
    }

    if (review.host_response) {
      return res.status(400).json({ error: 'Host response already exists' });
    }

    // Update review with host response
    const { data: updatedReview, error: updateError } = await supabaseAdmin
      .from('reviews')
      .update({
        host_response: validatedData.response,
        host_response_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select(`
        *,
        users!reviews_guest_id_fkey (
          id,
          first_name,
          last_name,
          avatar
        ),
        properties!reviews_property_id_fkey (
          id,
          title
        )
      `)
      .single();

    if (updateError) {
      console.error('Error adding host response:', updateError);
      return res.status(500).json({ error: 'Failed to add host response' });
    }

    // Transform response
    const transformedReview = {
      ...updatedReview,
      guest: updatedReview.users,
      property: updatedReview.properties,
      hostResponse: updatedReview.host_response,
      hostResponseAt: updatedReview.host_response_at,
    };

    res.json(transformedReview);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Invalid data', details: error.errors });
    }
    console.error('Error adding host response:', error);
    res.status(500).json({ error: 'Failed to add host response' });
  }
});

// GET /api/reviews/stats/:hostId - Get review statistics for host
router.get('/stats/:hostId', async (req: Request, res: Response) => {
  try {
    const { hostId } = req.params;

    // Get all reviews for the host
    const { data: reviews, error } = await supabaseAdmin
      .from('reviews')
      .select('overall_rating, cleanliness_rating, accuracy_rating, check_in_rating, communication_rating, location_rating, value_rating, host_response')
      .eq('host_id', hostId);

    if (error) {
      console.error('Error fetching review stats:', error);
      return res.status(500).json({ error: 'Failed to fetch review statistics' });
    }

    if (!reviews || reviews.length === 0) {
      return res.json({
        averageRating: 0,
        totalReviews: 0,
        responseRate: 0,
        categoryAverages: {
          cleanliness: 0,
          accuracy: 0,
          checkIn: 0,
          communication: 0,
          location: 0,
          value: 0,
        },
        ratingDistribution: {},
      });
    }

    // Calculate averages
    const totalReviews = reviews.length;
    const averageRating = reviews.reduce((sum, r) => sum + r.overall_rating, 0) / totalReviews;
    
    const categoryAverages = {
      cleanliness: reviews.reduce((sum, r) => sum + (r.cleanliness_rating || 0), 0) / totalReviews,
      accuracy: reviews.reduce((sum, r) => sum + (r.accuracy_rating || 0), 0) / totalReviews,
      checkIn: reviews.reduce((sum, r) => sum + (r.check_in_rating || 0), 0) / totalReviews,
      communication: reviews.reduce((sum, r) => sum + (r.communication_rating || 0), 0) / totalReviews,
      location: reviews.reduce((sum, r) => sum + (r.location_rating || 0), 0) / totalReviews,
      value: reviews.reduce((sum, r) => sum + (r.value_rating || 0), 0) / totalReviews,
    };

    // Calculate response rate
    const reviewsWithResponse = reviews.filter(r => r.host_response).length;
    const responseRate = totalReviews > 0 ? (reviewsWithResponse / totalReviews) * 100 : 0;

    // Calculate rating distribution
    const ratingDistribution = reviews.reduce((acc, review) => {
      const rating = review.overall_rating;
      acc[rating] = (acc[rating] || 0) + 1;
      return acc;
    }, {} as Record<number, number>);

    res.json({
      averageRating: Math.round(averageRating * 10) / 10,
      totalReviews,
      responseRate: Math.round(responseRate),
      categoryAverages: {
        cleanliness: Math.round(categoryAverages.cleanliness * 10) / 10,
        accuracy: Math.round(categoryAverages.accuracy * 10) / 10,
        checkIn: Math.round(categoryAverages.checkIn * 10) / 10,
        communication: Math.round(categoryAverages.communication * 10) / 10,
        location: Math.round(categoryAverages.location * 10) / 10,
        value: Math.round(categoryAverages.value * 10) / 10,
      },
      ratingDistribution,
    });
  } catch (error) {
    console.error('Error fetching review stats:', error);
    res.status(500).json({ error: 'Failed to fetch review statistics' });
  }
});

export default router; 