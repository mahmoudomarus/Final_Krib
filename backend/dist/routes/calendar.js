"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const supabase_1 = require("../lib/supabase");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
router.get('/property/:propertyId', auth_1.authMiddleware, auth_1.requireHost, async (req, res) => {
    try {
        const userId = req.user?.id;
        const { propertyId } = req.params;
        const { year, month } = req.query;
        if (!userId) {
            return res.status(401).json({ success: false, error: 'User not authenticated' });
        }
        const { data: property, error: propertyError } = await supabase_1.supabaseAdmin
            .from('properties')
            .select('id, title, base_price')
            .eq('id', propertyId)
            .eq('host_id', userId)
            .single();
        if (propertyError || !property) {
            return res.status(403).json({ success: false, error: 'Property not found or access denied' });
        }
        const targetYear = year ? parseInt(year) : new Date().getFullYear();
        const targetMonth = month ? parseInt(month) : new Date().getMonth();
        const startDate = new Date(targetYear, targetMonth, 1);
        const endDate = new Date(targetYear, targetMonth + 1, 0);
        const { data: bookings, error: bookingsError } = await supabase_1.supabaseAdmin
            .from('bookings')
            .select(`
        id,
        check_in,
        check_out,
        status,
        users!bookings_guest_id_fkey (
          id,
          first_name,
          last_name,
          avatar
        )
      `)
            .eq('property_id', propertyId)
            .in('status', ['CONFIRMED', 'PENDING', 'COMPLETED'])
            .or(`check_in.gte.${startDate.toISOString()},check_out.lte.${endDate.toISOString()},and(check_in.lte.${startDate.toISOString()},check_out.gte.${endDate.toISOString()})`);
        if (bookingsError) {
            console.error('Error fetching bookings:', bookingsError);
        }
        const unavailableDates = [];
        const calendarData = [];
        const firstDayOfWeek = startDate.getDay();
        const calendarStart = new Date(startDate);
        calendarStart.setDate(startDate.getDate() - firstDayOfWeek);
        for (let i = 0; i < 42; i++) {
            const date = new Date(calendarStart);
            date.setDate(calendarStart.getDate() + i);
            const isCurrentMonth = date.getMonth() === targetMonth;
            const dateString = date.toISOString().split('T')[0];
            const dayBooking = bookings?.find(booking => {
                const checkIn = new Date(booking.check_in);
                const checkOut = new Date(booking.check_out);
                return date >= checkIn && date < checkOut;
            });
            const isBlocked = unavailableDates.find(ud => new Date(ud.date).toISOString().split('T')[0] === dateString);
            calendarData.push({
                date: dateString,
                isCurrentMonth,
                isToday: dateString === new Date().toISOString().split('T')[0],
                isAvailable: !dayBooking && !isBlocked && date >= new Date(),
                price: property.base_price,
                bookingId: dayBooking?.id,
                guestName: dayBooking ? `${dayBooking.users?.[0]?.first_name} ${dayBooking.users?.[0]?.last_name}` : null,
                status: dayBooking?.status?.toLowerCase() || (isBlocked ? 'blocked' : null),
                checkIn: dayBooking && date.toDateString() === new Date(dayBooking.check_in).toDateString(),
                checkOut: dayBooking && date.toDateString() === new Date(dayBooking.check_out).toDateString(),
                blockReason: isBlocked?.reason
            });
        }
        res.json({
            success: true,
            data: {
                property: {
                    id: property.id,
                    title: property.title,
                    basePrice: property.base_price
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
        const { data: property, error: propertyError } = await supabase_1.supabaseAdmin
            .from('properties')
            .select('id')
            .eq('id', propertyId)
            .eq('host_id', userId)
            .single();
        if (propertyError || !property) {
            return res.status(403).json({ success: false, error: 'Property not found or access denied' });
        }
        res.json({
            success: true,
            message: 'Date blocking feature will be implemented when unavailable_dates table is created',
            data: {
                blocked: 0,
                skipped: dates.length,
                dates: []
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
        const { data: property, error: propertyError } = await supabase_1.supabaseAdmin
            .from('properties')
            .select('id')
            .eq('id', propertyId)
            .eq('host_id', userId)
            .single();
        if (propertyError || !property) {
            return res.status(403).json({ success: false, error: 'Property not found or access denied' });
        }
        res.json({
            success: true,
            message: 'Date unblocking feature will be implemented when unavailable_dates table is created',
            data: {
                unblocked: 0
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
        const { data: property, error: propertyError } = await supabase_1.supabaseAdmin
            .from('properties')
            .select('id')
            .eq('id', propertyId)
            .eq('host_id', userId)
            .single();
        if (propertyError || !property) {
            return res.status(403).json({ success: false, error: 'Property not found or access denied' });
        }
        res.json({
            success: true,
            message: 'Custom pricing feature will be implemented when pricing_rules table is created',
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
        const { data: property, error: propertyError } = await supabase_1.supabaseAdmin
            .from('properties')
            .select('id')
            .eq('id', propertyId)
            .eq('host_id', userId)
            .single();
        if (propertyError || !property) {
            return res.status(403).json({ success: false, error: 'Property not found or access denied' });
        }
        const targetYear = year ? parseInt(year) : new Date().getFullYear();
        const targetMonth = month ? parseInt(month) : new Date().getMonth();
        const startDate = new Date(targetYear, targetMonth, 1);
        const endDate = new Date(targetYear, targetMonth + 1, 0);
        const { data: bookings, error: bookingsError } = await supabase_1.supabaseAdmin
            .from('bookings')
            .select('check_in, check_out, total_amount')
            .eq('property_id', propertyId)
            .gte('check_in', startDate.toISOString())
            .lte('check_in', endDate.toISOString())
            .in('status', ['CONFIRMED', 'COMPLETED']);
        if (bookingsError) {
            console.error('Error fetching bookings for stats:', bookingsError);
            return res.status(500).json({ success: false, error: 'Failed to fetch booking statistics' });
        }
        const totalEarnings = bookings?.reduce((sum, booking) => sum + (booking.total_amount || 0), 0) || 0;
        const totalBookings = bookings?.length || 0;
        const daysInMonth = endDate.getDate();
        const bookedDays = bookings?.reduce((sum, booking) => {
            const checkIn = new Date(booking.check_in);
            const checkOut = new Date(booking.check_out);
            const nights = Math.ceil((checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24));
            return sum + nights;
        }, 0) || 0;
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