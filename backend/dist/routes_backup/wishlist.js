"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const supabase_1 = require("../lib/supabase");
const auth_1 = require("../middleware/auth");
const zod_1 = require("zod");
const router = (0, express_1.Router)();
const addToWishlistSchema = zod_1.z.object({
    property_id: zod_1.z.string().uuid(),
    property_title: zod_1.z.string().min(1).max(255),
    property_image: zod_1.z.string().url().optional(),
    property_price: zod_1.z.number().positive().optional(),
    property_location: zod_1.z.string().max(255).optional(),
    property_type: zod_1.z.string().max(100).optional(),
    notes: zod_1.z.string().optional()
});
const addRecentlyViewedSchema = zod_1.z.object({
    property_id: zod_1.z.string().uuid(),
    property_title: zod_1.z.string().min(1).max(255),
    property_image: zod_1.z.string().url().optional(),
    property_price: zod_1.z.number().positive().optional(),
    property_location: zod_1.z.string().max(255).optional(),
    property_type: zod_1.z.string().max(100).optional()
});
router.get('/', auth_1.authMiddleware, async (req, res) => {
    try {
        const { data: wishlist, error } = await supabase_1.supabaseAdmin
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
    }
    catch (error) {
        console.error('Get wishlist error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch wishlist'
        });
    }
});
router.post('/', auth_1.authMiddleware, async (req, res) => {
    try {
        const validatedData = addToWishlistSchema.parse(req.body);
        const { data: existing } = await supabase_1.supabaseAdmin
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
        const { data: wishlistItem, error } = await supabase_1.supabaseAdmin
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
    }
    catch (error) {
        if (error instanceof zod_1.z.ZodError) {
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
router.delete('/:propertyId', auth_1.authMiddleware, async (req, res) => {
    try {
        const propertyId = req.params.propertyId;
        if (!propertyId) {
            return res.status(400).json({
                success: false,
                error: 'Property ID is required'
            });
        }
        const { error } = await supabase_1.supabaseAdmin
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
    }
    catch (error) {
        console.error('Remove from wishlist error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to remove from wishlist'
        });
    }
});
router.put('/:propertyId/notes', auth_1.authMiddleware, async (req, res) => {
    try {
        const propertyId = req.params.propertyId;
        const { notes } = req.body;
        if (!propertyId) {
            return res.status(400).json({
                success: false,
                error: 'Property ID is required'
            });
        }
        const { data: updatedItem, error } = await supabase_1.supabaseAdmin
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
    }
    catch (error) {
        console.error('Update wishlist notes error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to update notes'
        });
    }
});
router.get('/recently-viewed', auth_1.authMiddleware, async (req, res) => {
    try {
        const limit = parseInt(req.query.limit) || 10;
        const { data: recentlyViewed, error } = await supabase_1.supabaseAdmin
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
    }
    catch (error) {
        console.error('Get recently viewed error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch recently viewed properties'
        });
    }
});
router.post('/recently-viewed', auth_1.authMiddleware, async (req, res) => {
    try {
        const validatedData = addRecentlyViewedSchema.parse(req.body);
        const { data: existing } = await supabase_1.supabaseAdmin
            .from('recently_viewed_properties')
            .select('id, view_count')
            .eq('user_id', req.user.id)
            .eq('property_id', validatedData.property_id)
            .single();
        if (existing) {
            const { data: updated, error } = await supabase_1.supabaseAdmin
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
        const { data: newEntry, error } = await supabase_1.supabaseAdmin
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
    }
    catch (error) {
        if (error instanceof zod_1.z.ZodError) {
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
router.delete('/recently-viewed/:propertyId', auth_1.authMiddleware, async (req, res) => {
    try {
        const propertyId = req.params.propertyId;
        if (!propertyId) {
            return res.status(400).json({
                success: false,
                error: 'Property ID is required'
            });
        }
        const { error } = await supabase_1.supabaseAdmin
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
    }
    catch (error) {
        console.error('Remove recently viewed error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to remove from recently viewed'
        });
    }
});
exports.default = router;
//# sourceMappingURL=wishlist.js.map