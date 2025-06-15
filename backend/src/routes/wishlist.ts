import { Router, Response } from 'express';
import { supabaseAdmin } from '../lib/supabase';
import { authMiddleware } from '../middleware/auth';
import { z } from 'zod';

const router: Router = Router();

// Validation schemas
const addToWishlistSchema = z.object({
  property_id: z.string().uuid(),
  property_title: z.string().min(1).max(255),
  property_image: z.string().url().optional(),
  property_price: z.number().positive().optional(),
  property_location: z.string().max(255).optional(),
  property_type: z.string().max(100).optional(),
  notes: z.string().optional()
});

const addRecentlyViewedSchema = z.object({
  property_id: z.string().uuid(),
  property_title: z.string().min(1).max(255),
  property_image: z.string().url().optional(),
  property_price: z.number().positive().optional(),
  property_location: z.string().max(255).optional(),
  property_type: z.string().max(100).optional()
});

// GET /api/wishlist - Get user's wishlist
router.get('/', authMiddleware, async (req: any, res: Response) => {
  try {
    const { data: wishlist, error } = await supabaseAdmin
      .from('user_wishlists')
      .select('*')
      .eq('user_id', req.user.id)
      .order('added_at', { ascending: false });

    if (error) {
      console.error('Get wishlist error:', error);
      return res.status(500).json({
        success: false,
        error: 'Failed to fetch wishlist'
      });
    }

    res.json({
      success: true,
      data: wishlist || [],
      count: wishlist?.length || 0
    });
  } catch (error) {
    console.error('Get wishlist error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch wishlist'
    });
  }
});

// POST /api/wishlist - Add property to wishlist
router.post('/', authMiddleware, async (req: any, res: Response) => {
  try {
    const validatedData = addToWishlistSchema.parse(req.body);

    // Check if property already in wishlist
    const { data: existing } = await supabaseAdmin
      .from('user_wishlists')
      .select('id')
      .eq('user_id', req.user.id)
      .eq('property_id', validatedData.property_id)
      .single();

    if (existing) {
      return res.status(409).json({
        success: false,
        error: 'Property already in wishlist'
      });
    }

    // Add to wishlist
    const { data: wishlistItem, error } = await supabaseAdmin
      .from('user_wishlists')
      .insert({
        user_id: req.user.id,
        ...validatedData
      })
      .select()
      .single();

    if (error) {
      console.error('Add to wishlist error:', error);
      return res.status(500).json({
        success: false,
        error: 'Failed to add to wishlist'
      });
    }

    res.status(201).json({
      success: true,
      data: wishlistItem,
      message: 'Property added to wishlist successfully'
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: error.errors
      });
    }

    console.error('Add to wishlist error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to add to wishlist'
    });
  }
});

// DELETE /api/wishlist/:propertyId - Remove property from wishlist
router.delete('/:propertyId', authMiddleware, async (req: any, res: Response) => {
  try {
    const propertyId = req.params.propertyId;

    if (!propertyId) {
      return res.status(400).json({
        success: false,
        error: 'Property ID is required'
      });
    }

    const { error } = await supabaseAdmin
      .from('user_wishlists')
      .delete()
      .eq('user_id', req.user.id)
      .eq('property_id', propertyId);

    if (error) {
      console.error('Remove from wishlist error:', error);
      return res.status(500).json({
        success: false,
        error: 'Failed to remove from wishlist'
      });
    }

    res.json({
      success: true,
      message: 'Property removed from wishlist successfully'
    });
  } catch (error) {
    console.error('Remove from wishlist error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to remove from wishlist'
    });
  }
});

// PUT /api/wishlist/:propertyId/notes - Update wishlist item notes
router.put('/:propertyId/notes', authMiddleware, async (req: any, res: Response) => {
  try {
    const propertyId = req.params.propertyId;
    const { notes } = req.body;

    if (!propertyId) {
      return res.status(400).json({
        success: false,
        error: 'Property ID is required'
      });
    }

    const { data: updatedItem, error } = await supabaseAdmin
      .from('user_wishlists')
      .update({ notes })
      .eq('user_id', req.user.id)
      .eq('property_id', propertyId)
      .select()
      .single();

    if (error) {
      console.error('Update wishlist notes error:', error);
      return res.status(500).json({
        success: false,
        error: 'Failed to update notes'
      });
    }

    res.json({
      success: true,
      data: updatedItem,
      message: 'Notes updated successfully'
    });
  } catch (error) {
    console.error('Update wishlist notes error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update notes'
    });
  }
});

// GET /api/wishlist/recently-viewed - Get recently viewed properties
router.get('/recently-viewed', authMiddleware, async (req: any, res: Response) => {
  try {
    const limit = parseInt(req.query.limit as string) || 10;

    const { data: recentlyViewed, error } = await supabaseAdmin
      .from('recently_viewed_properties')
      .select('*')
      .eq('user_id', req.user.id)
      .order('viewed_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Get recently viewed error:', error);
      return res.status(500).json({
        success: false,
        error: 'Failed to fetch recently viewed properties'
      });
    }

    res.json({
      success: true,
      data: recentlyViewed || [],
      count: recentlyViewed?.length || 0
    });
  } catch (error) {
    console.error('Get recently viewed error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch recently viewed properties'
    });
  }
});

// POST /api/wishlist/recently-viewed - Add property to recently viewed
router.post('/recently-viewed', authMiddleware, async (req: any, res: Response) => {
  try {
    const validatedData = addRecentlyViewedSchema.parse(req.body);

    // Check if property already exists in recently viewed
    const { data: existing } = await supabaseAdmin
      .from('recently_viewed_properties')
      .select('id, view_count')
      .eq('user_id', req.user.id)
      .eq('property_id', validatedData.property_id)
      .single();

    if (existing) {
      // Update view count and timestamp
      const { data: updated, error } = await supabaseAdmin
        .from('recently_viewed_properties')
        .update({
          view_count: existing.view_count + 1,
          viewed_at: new Date().toISOString()
        })
        .eq('id', existing.id)
        .select()
        .single();

      if (error) {
        console.error('Update recently viewed error:', error);
        return res.status(500).json({
          success: false,
          error: 'Failed to update recently viewed'
        });
      }

      return res.json({
        success: true,
        data: updated,
        message: 'Recently viewed updated successfully'
      });
    }

    // Add new entry
    const { data: newEntry, error } = await supabaseAdmin
      .from('recently_viewed_properties')
      .insert({
        user_id: req.user.id,
        ...validatedData
      })
      .select()
      .single();

    if (error) {
      console.error('Add recently viewed error:', error);
      return res.status(500).json({
        success: false,
        error: 'Failed to add to recently viewed'
      });
    }

    res.status(201).json({
      success: true,
      data: newEntry,
      message: 'Property added to recently viewed successfully'
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: error.errors
      });
    }

    console.error('Add recently viewed error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to add to recently viewed'
    });
  }
});

// DELETE /api/wishlist/recently-viewed/:propertyId - Remove from recently viewed
router.delete('/recently-viewed/:propertyId', authMiddleware, async (req: any, res: Response) => {
  try {
    const propertyId = req.params.propertyId;

    if (!propertyId) {
      return res.status(400).json({
        success: false,
        error: 'Property ID is required'
      });
    }

    const { error } = await supabaseAdmin
      .from('recently_viewed_properties')
      .delete()
      .eq('user_id', req.user.id)
      .eq('property_id', propertyId);

    if (error) {
      console.error('Remove recently viewed error:', error);
      return res.status(500).json({
        success: false,
        error: 'Failed to remove from recently viewed'
      });
    }

    res.json({
      success: true,
      message: 'Property removed from recently viewed successfully'
    });
  } catch (error) {
    console.error('Remove recently viewed error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to remove from recently viewed'
    });
  }
});

export default router; 