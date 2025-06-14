"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const prisma_1 = require("../lib/prisma");
const zod_1 = require("zod");
const router = (0, express_1.Router)();
const createReviewSchema = zod_1.z.object({
    bookingId: zod_1.z.string(),
    propertyId: zod_1.z.string(),
    hostId: zod_1.z.string(),
    overallRating: zod_1.z.number().min(1).max(5),
    cleanlinessRating: zod_1.z.number().min(1).max(5).optional(),
    accuracyRating: zod_1.z.number().min(1).max(5).optional(),
    checkInRating: zod_1.z.number().min(1).max(5).optional(),
    communicationRating: zod_1.z.number().min(1).max(5).optional(),
    locationRating: zod_1.z.number().min(1).max(5).optional(),
    valueRating: zod_1.z.number().min(1).max(5).optional(),
    comment: zod_1.z.string().min(10).max(1000),
    title: zod_1.z.string().max(100).optional(),
    photos: zod_1.z.array(zod_1.z.string()).optional(),
});
const hostResponseSchema = zod_1.z.object({
    response: zod_1.z.string().min(1).max(500),
});
router.get('/', async (req, res) => {
    try {
        const { propertyId, hostId, guestId, type = 'all', sortBy = 'newest', rating, limit = '10', offset = '0' } = req.query;
        let whereClause = {};
        if (propertyId)
            whereClause.propertyId = propertyId;
        if (rating)
            whereClause.overallRating = parseFloat(rating);
        if (type === 'received' && hostId) {
            whereClause.hostId = hostId;
        }
        else if (type === 'written' && guestId) {
            whereClause.guestId = guestId;
        }
        let orderBy = {};
        switch (sortBy) {
            case 'newest':
                orderBy = { createdAt: 'desc' };
                break;
            case 'oldest':
                orderBy = { createdAt: 'asc' };
                break;
            case 'highest':
                orderBy = { overallRating: 'desc' };
                break;
            case 'lowest':
                orderBy = { overallRating: 'asc' };
                break;
            default:
                orderBy = { createdAt: 'desc' };
        }
        const reviews = await prisma_1.prisma.review.findMany({
            where: whereClause,
            orderBy,
            take: parseInt(limit),
            skip: parseInt(offset),
            include: {
                guest: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        avatar: true,
                        isVerified: true,
                        kycStatus: true,
                        nationality: true,
                    }
                },
                host: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        avatar: true,
                    }
                },
                property: {
                    select: {
                        id: true,
                        title: true,
                        area: true,
                        city: true,
                        emirate: true,
                        images: true,
                    }
                },
                booking: {
                    select: {
                        id: true,
                        checkIn: true,
                        checkOut: true,
                        guests: true,
                    }
                }
            }
        });
        const transformedReviews = reviews.map(review => ({
            ...review,
            photos: review.photos ? review.photos.split(',').filter(Boolean) : [],
            property: {
                ...review.property,
                images: review.property.images ? review.property.images.split(',').filter(Boolean) : [],
            }
        }));
        res.json({
            reviews: transformedReviews,
            total: await prisma_1.prisma.review.count({ where: whereClause }),
        });
    }
    catch (error) {
        console.error('Error fetching reviews:', error);
        res.status(500).json({ error: 'Failed to fetch reviews' });
    }
});
router.get('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const review = await prisma_1.prisma.review.findUnique({
            where: { id },
            include: {
                guest: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        avatar: true,
                        isVerified: true,
                        kycStatus: true,
                        nationality: true,
                    }
                },
                host: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        avatar: true,
                    }
                },
                property: {
                    select: {
                        id: true,
                        title: true,
                        area: true,
                        city: true,
                        emirate: true,
                        images: true,
                    }
                },
                booking: {
                    select: {
                        id: true,
                        checkIn: true,
                        checkOut: true,
                        guests: true,
                    }
                }
            }
        });
        if (!review) {
            return res.status(404).json({ error: 'Review not found' });
        }
        const transformedReview = {
            ...review,
            photos: review.photos ? review.photos.split(',').filter(Boolean) : [],
            property: {
                ...review.property,
                images: review.property.images ? review.property.images.split(',').filter(Boolean) : [],
            }
        };
        res.json(transformedReview);
    }
    catch (error) {
        console.error('Error fetching review:', error);
        res.status(500).json({ error: 'Failed to fetch review' });
    }
});
router.post('/', async (req, res) => {
    try {
        const validatedData = createReviewSchema.parse(req.body);
        const guestId = req.headers['x-user-id'] || 'test-user-1';
        const existingReview = await prisma_1.prisma.review.findUnique({
            where: { bookingId: validatedData.bookingId }
        });
        if (existingReview) {
            return res.status(400).json({ error: 'Review already exists for this booking' });
        }
        const booking = await prisma_1.prisma.booking.findFirst({
            where: {
                id: validatedData.bookingId,
                guestId: guestId,
                status: 'COMPLETED'
            }
        });
        if (!booking) {
            return res.status(400).json({ error: 'Valid completed booking not found' });
        }
        const review = await prisma_1.prisma.review.create({
            data: {
                bookingId: validatedData.bookingId,
                propertyId: validatedData.propertyId,
                hostId: validatedData.hostId,
                guestId,
                overallRating: validatedData.overallRating,
                cleanlinessRating: validatedData.cleanlinessRating,
                accuracyRating: validatedData.accuracyRating,
                checkInRating: validatedData.checkInRating,
                communicationRating: validatedData.communicationRating,
                locationRating: validatedData.locationRating,
                valueRating: validatedData.valueRating,
                comment: validatedData.comment,
                title: validatedData.title,
                photos: validatedData.photos ? validatedData.photos.join(',') : null,
            },
            include: {
                guest: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        avatar: true,
                        isVerified: true,
                        nationality: true,
                    }
                },
                property: {
                    select: {
                        id: true,
                        title: true,
                        area: true,
                        city: true,
                    }
                }
            }
        });
        const propertyReviews = await prisma_1.prisma.review.findMany({
            where: { propertyId: validatedData.propertyId },
            select: { overallRating: true }
        });
        const averageRating = propertyReviews.reduce((sum, r) => sum + r.overallRating, 0) / propertyReviews.length;
        console.log(`Property ${validatedData.propertyId} new average rating: ${averageRating} (${propertyReviews.length} reviews)`);
        res.status(201).json({
            ...review,
            photos: review.photos ? review.photos.split(',').filter(Boolean) : [],
        });
    }
    catch (error) {
        if (error instanceof zod_1.z.ZodError) {
            return res.status(400).json({ error: 'Invalid data', details: error.errors });
        }
        console.error('Error creating review:', error);
        res.status(500).json({ error: 'Failed to create review' });
    }
});
router.post('/:id/response', async (req, res) => {
    try {
        const { id } = req.params;
        const validatedData = hostResponseSchema.parse(req.body);
        const hostId = req.headers['x-user-id'] || 'test-host-1';
        const review = await prisma_1.prisma.review.findFirst({
            where: {
                id,
                hostId: hostId
            }
        });
        if (!review) {
            return res.status(404).json({ error: 'Review not found or unauthorized' });
        }
        if (review.hostResponse) {
            return res.status(400).json({ error: 'Host response already exists' });
        }
        const updatedReview = await prisma_1.prisma.review.update({
            where: { id },
            data: {
                hostResponse: validatedData.response,
                hostResponseAt: new Date(),
            },
            include: {
                guest: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        avatar: true,
                    }
                },
                property: {
                    select: {
                        id: true,
                        title: true,
                    }
                }
            }
        });
        res.json(updatedReview);
    }
    catch (error) {
        if (error instanceof zod_1.z.ZodError) {
            return res.status(400).json({ error: 'Invalid data', details: error.errors });
        }
        console.error('Error adding host response:', error);
        res.status(500).json({ error: 'Failed to add host response' });
    }
});
router.get('/stats/:hostId', async (req, res) => {
    try {
        const { hostId } = req.params;
        const stats = await prisma_1.prisma.review.aggregate({
            where: { hostId },
            _avg: {
                overallRating: true,
                cleanlinessRating: true,
                accuracyRating: true,
                checkInRating: true,
                communicationRating: true,
                locationRating: true,
                valueRating: true,
            },
            _count: {
                id: true,
            }
        });
        const ratingDistribution = await prisma_1.prisma.review.groupBy({
            by: ['overallRating'],
            where: { hostId },
            _count: {
                overallRating: true,
            }
        });
        const totalReviews = await prisma_1.prisma.review.count({
            where: { hostId }
        });
        const reviewsWithResponse = await prisma_1.prisma.review.count({
            where: {
                hostId,
                hostResponse: { not: null }
            }
        });
        const responseRate = totalReviews > 0 ? (reviewsWithResponse / totalReviews) * 100 : 0;
        res.json({
            averageRating: stats._avg.overallRating || 0,
            totalReviews: stats._count.id,
            responseRate: Math.round(responseRate),
            categoryAverages: {
                cleanliness: stats._avg.cleanlinessRating || 0,
                accuracy: stats._avg.accuracyRating || 0,
                checkIn: stats._avg.checkInRating || 0,
                communication: stats._avg.communicationRating || 0,
                location: stats._avg.locationRating || 0,
                value: stats._avg.valueRating || 0,
            },
            ratingDistribution: ratingDistribution.reduce((acc, item) => {
                acc[item.overallRating] = item._count.overallRating;
                return acc;
            }, {}),
        });
    }
    catch (error) {
        console.error('Error fetching review stats:', error);
        res.status(500).json({ error: 'Failed to fetch review statistics' });
    }
});
exports.default = router;
//# sourceMappingURL=reviews.js.map