"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const client_1 = require("@prisma/client");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
const prisma = new client_1.PrismaClient();
router.get('/property/:propertyId', auth_1.authMiddleware, auth_1.requireHost, async (req, res) => {
    try {
        const userId = req.user?.id;
        const { propertyId } = req.params;
        const { year, month } = req.query;
        if (!userId) {
            return res.status(401).json({ success: false, error: 'User not authenticated' });
        }
        const property = await prisma.property.findFirst({
            where: {
                id: propertyId,
                hostId: userId
            }
        });
        if (!property) {
            return res.status(403).json({ success: false, error: 'Property not found or access denied' });
        }
        const targetYear = year ? parseInt(year) : new Date().getFullYear();
        const targetMonth = month ? parseInt(month) : new Date().getMonth();
        const startDate = new Date(targetYear, targetMonth, 1);
        const endDate = new Date(targetYear, targetMonth + 1, 0);
        const bookings = await prisma.booking.findMany({
            where: {
                propertyId,
                OR: [
                    {
                        checkIn: {
                            gte: startDate,
                            lte: endDate
                        }
                    },
                    {
                        checkOut: {
                            gte: startDate,
                            lte: endDate
                        }
                    },
                    {
                        AND: [
                            { checkIn: { lte: startDate } },
                            { checkOut: { gte: endDate } }
                        ]
                    }
                ],
                status: { in: ['CONFIRMED', 'PENDING', 'COMPLETED'] }
            },
            include: {
                guest: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        avatar: true
                    }
                }
            }
        });
        const unavailableDates = await prisma.unavailableDate.findMany({
            where: {
                propertyId,
                date: {
                    gte: startDate,
                    lte: endDate
                }
            }
        });
        const calendarData = [];
        const currentDate = new Date(startDate);
        const firstDayOfWeek = startDate.getDay();
        const calendarStart = new Date(startDate);
        calendarStart.setDate(startDate.getDate() - firstDayOfWeek);
        for (let i = 0; i < 42; i++) {
            const date = new Date(calendarStart);
            date.setDate(calendarStart.getDate() + i);
            const isCurrentMonth = date.getMonth() === targetMonth;
            const dateString = date.toISOString().split('T')[0];
            const dayBooking = bookings.find(booking => {
                const checkIn = new Date(booking.checkIn);
                const checkOut = new Date(booking.checkOut);
                return date >= checkIn && date < checkOut;
            });
            const isBlocked = unavailableDates.find(ud => ud.date.toISOString().split('T')[0] === dateString);
            calendarData.push({
                date: dateString,
                isCurrentMonth,
                isToday: dateString === new Date().toISOString().split('T')[0],
                isAvailable: !dayBooking && !isBlocked && date >= new Date(),
                price: property.basePrice,
                bookingId: dayBooking?.id,
                guestName: dayBooking ? `${dayBooking.guest.firstName} ${dayBooking.guest.lastName}` : null,
                status: dayBooking?.status?.toLowerCase() || (isBlocked ? 'blocked' : null),
                checkIn: dayBooking && date.toDateString() === new Date(dayBooking.checkIn).toDateString(),
                checkOut: dayBooking && date.toDateString() === new Date(dayBooking.checkOut).toDateString(),
                blockReason: isBlocked?.reason
            });
        }
        res.json({
            success: true,
            data: {
                property: {
                    id: property.id,
                    title: property.title,
                    basePrice: property.basePrice
                },
                calendar: calendarData,
                month: targetMonth,
                year: targetYear
            }
        });
    }
    catch (error) {
        console.error('Error fetching calendar data:', error);
        res.status(500).json({ success: false, error: 'Internal server error' });
    }
});
router.post('/property/:propertyId/block', auth_1.authMiddleware, auth_1.requireHost, async (req, res) => {
    try {
        const userId = req.user?.id;
        const { propertyId } = req.params;
        const { dates, reason = 'Blocked by host', type = 'BLOCKED' } = req.body;
        if (!userId) {
            return res.status(401).json({ success: false, error: 'User not authenticated' });
        }
        if (!dates || !Array.isArray(dates) || dates.length === 0) {
            return res.status(400).json({ success: false, error: 'Dates array is required' });
        }
        const property = await prisma.property.findFirst({
            where: {
                id: propertyId,
                hostId: userId
            }
        });
        if (!property) {
            return res.status(403).json({ success: false, error: 'Property not found or access denied' });
        }
        const blockedDates = [];
        for (const dateString of dates) {
            const date = new Date(dateString);
            const existingBooking = await prisma.booking.findFirst({
                where: {
                    propertyId,
                    checkIn: { lte: date },
                    checkOut: { gt: date },
                    status: { in: ['CONFIRMED', 'PENDING'] }
                }
            });
            if (existingBooking) {
                continue;
            }
            const unavailableDate = await prisma.unavailableDate.upsert({
                where: {
                    propertyId_date: {
                        propertyId,
                        date
                    }
                },
                update: {
                    type,
                    reason
                },
                create: {
                    propertyId,
                    date,
                    type,
                    reason
                }
            });
            blockedDates.push(unavailableDate);
        }
        res.json({
            success: true,
            data: {
                blocked: blockedDates.length,
                skipped: dates.length - blockedDates.length,
                dates: blockedDates
            }
        });
    }
    catch (error) {
        console.error('Error blocking dates:', error);
        res.status(500).json({ success: false, error: 'Internal server error' });
    }
});
router.delete('/property/:propertyId/block', auth_1.authMiddleware, auth_1.requireHost, async (req, res) => {
    try {
        const userId = req.user?.id;
        const { propertyId } = req.params;
        const { dates } = req.body;
        if (!userId) {
            return res.status(401).json({ success: false, error: 'User not authenticated' });
        }
        if (!dates || !Array.isArray(dates) || dates.length === 0) {
            return res.status(400).json({ success: false, error: 'Dates array is required' });
        }
        const property = await prisma.property.findFirst({
            where: {
                id: propertyId,
                hostId: userId
            }
        });
        if (!property) {
            return res.status(403).json({ success: false, error: 'Property not found or access denied' });
        }
        const result = await prisma.unavailableDate.deleteMany({
            where: {
                propertyId,
                date: {
                    in: dates.map(d => new Date(d))
                }
            }
        });
        res.json({
            success: true,
            data: {
                unblocked: result.count
            }
        });
    }
    catch (error) {
        console.error('Error unblocking dates:', error);
        res.status(500).json({ success: false, error: 'Internal server error' });
    }
});
router.post('/property/:propertyId/pricing', auth_1.authMiddleware, auth_1.requireHost, async (req, res) => {
    try {
        const userId = req.user?.id;
        const { propertyId } = req.params;
        const { dates, price } = req.body;
        if (!userId) {
            return res.status(401).json({ success: false, error: 'User not authenticated' });
        }
        if (!dates || !Array.isArray(dates) || dates.length === 0) {
            return res.status(400).json({ success: false, error: 'Dates array is required' });
        }
        if (!price || price <= 0) {
            return res.status(400).json({ success: false, error: 'Valid price is required' });
        }
        const property = await prisma.property.findFirst({
            where: {
                id: propertyId,
                hostId: userId
            }
        });
        if (!property) {
            return res.status(403).json({ success: false, error: 'Property not found or access denied' });
        }
        res.json({
            success: true,
            message: 'Custom pricing feature coming soon',
            data: {
                dates,
                price,
                propertyId
            }
        });
    }
    catch (error) {
        console.error('Error updating pricing:', error);
        res.status(500).json({ success: false, error: 'Internal server error' });
    }
});
router.get('/property/:propertyId/stats', auth_1.authMiddleware, auth_1.requireHost, async (req, res) => {
    try {
        const userId = req.user?.id;
        const { propertyId } = req.params;
        const { year, month } = req.query;
        if (!userId) {
            return res.status(401).json({ success: false, error: 'User not authenticated' });
        }
        const property = await prisma.property.findFirst({
            where: {
                id: propertyId,
                hostId: userId
            }
        });
        if (!property) {
            return res.status(403).json({ success: false, error: 'Property not found or access denied' });
        }
        const targetYear = year ? parseInt(year) : new Date().getFullYear();
        const targetMonth = month ? parseInt(month) : new Date().getMonth();
        const startDate = new Date(targetYear, targetMonth, 1);
        const endDate = new Date(targetYear, targetMonth + 1, 0);
        const bookings = await prisma.booking.findMany({
            where: {
                propertyId,
                checkIn: {
                    gte: startDate,
                    lte: endDate
                },
                status: { in: ['CONFIRMED', 'COMPLETED'] }
            }
        });
        const totalEarnings = bookings.reduce((sum, booking) => sum + booking.totalAmount, 0);
        const totalBookings = bookings.length;
        const daysInMonth = endDate.getDate();
        const bookedDays = bookings.reduce((sum, booking) => {
            const checkIn = new Date(booking.checkIn);
            const checkOut = new Date(booking.checkOut);
            const nights = Math.ceil((checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24));
            return sum + nights;
        }, 0);
        const occupancyRate = Math.round((bookedDays / daysInMonth) * 100);
        res.json({
            success: true,
            data: {
                month: targetMonth,
                year: targetYear,
                totalEarnings,
                totalBookings,
                occupancyRate,
                bookedDays,
                daysInMonth
            }
        });
    }
    catch (error) {
        console.error('Error fetching property stats:', error);
        res.status(500).json({ success: false, error: 'Internal server error' });
    }
});
exports.default = router;
//# sourceMappingURL=calendar.js.map