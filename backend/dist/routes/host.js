"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const supabase_1 = require("../lib/supabase");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
router.get('/payouts', auth_1.authMiddleware, async (req, res) => {
    try {
        const hostId = req.user?.id;
        if (!hostId) {
            return res.status(401).json({ error: 'Unauthorized' });
        }
        const { data: properties, error: propertiesError } = await supabase_1.supabaseAdmin
            .from('properties')
            .select('id, title, city')
            .eq('host_id', hostId);
        if (propertiesError) {
            console.error('Error fetching host properties:', propertiesError);
            return res.status(500).json({ error: 'Failed to fetch properties' });
        }
        if (!properties || properties.length === 0) {
            const response = {
                financial_summary: {
                    available_balance: 0,
                    pending_payout: 0,
                    total_paid_out: 0,
                    platform_fees: 0,
                    total_earnings: 0,
                    total_bookings: 0,
                    confirmed_bookings: 0,
                    completed_bookings: 0
                },
                payout_history: [],
                bank_details: null
            };
            return res.json({ success: true, data: response });
        }
        const propertyIds = properties.map(p => p.id);
        const { data: bookings, error: bookingsError } = await supabase_1.supabaseAdmin
            .from('bookings')
            .select(`
        id,
        total_amount,
        status,
        created_at,
        check_in,
        check_out,
        guests,
        property_id
      `)
            .in('property_id', propertyIds)
            .order('created_at', { ascending: false });
        if (bookingsError) {
            console.error('Error fetching bookings:', bookingsError);
            return res.status(500).json({ error: 'Failed to fetch bookings' });
        }
        const confirmedBookings = bookings?.filter(b => b.status === 'CONFIRMED') || [];
        const completedBookings = bookings?.filter(b => b.status === 'COMPLETED') || [];
        const totalRevenue = confirmedBookings.reduce((sum, b) => sum + (b.total_amount || 0), 0);
        const completedRevenue = completedBookings.reduce((sum, b) => sum + (b.total_amount || 0), 0);
        const platformFeeRate = 0.1;
        const platformFees = totalRevenue * platformFeeRate;
        const hostEarnings = totalRevenue - platformFees;
        const completedEarnings = completedRevenue - (completedRevenue * platformFeeRate);
        const availableBalance = completedEarnings;
        const pendingPayout = confirmedBookings
            .filter(b => b.status === 'CONFIRMED')
            .reduce((sum, b) => sum + ((b.total_amount || 0) * (1 - platformFeeRate)), 0);
        const payoutHistory = completedBookings.map(booking => {
            const property = properties.find(p => p.id === booking.property_id);
            return {
                id: `payout-${booking.id}`,
                amount: (booking.total_amount || 0) * (1 - platformFeeRate),
                currency: 'AED',
                status: 'COMPLETED',
                payout_method: 'BANK_TRANSFER',
                created_at: booking.created_at,
                processed_at: booking.created_at,
                booking_reference: booking.id,
                property_title: property?.title || 'Property',
                description: `Payout for ${property?.title || 'booking'} (${booking.check_in} to ${booking.check_out})`
            };
        });
        const pendingPayouts = confirmedBookings
            .filter(b => b.status === 'CONFIRMED')
            .map(booking => {
            const property = properties.find(p => p.id === booking.property_id);
            return {
                id: `pending-${booking.id}`,
                amount: (booking.total_amount || 0) * (1 - platformFeeRate),
                currency: 'AED',
                status: 'PROCESSING',
                payout_method: 'BANK_TRANSFER',
                created_at: booking.created_at,
                expected_date: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
                booking_reference: booking.id,
                property_title: property?.title || 'Property',
                description: `Pending payout for ${property?.title || 'booking'} (${booking.check_in} to ${booking.check_out})`
            };
        });
        const response = {
            financial_summary: {
                available_balance: availableBalance,
                pending_payout: pendingPayout,
                total_paid_out: completedEarnings,
                platform_fees: platformFees,
                total_earnings: hostEarnings + completedEarnings,
                total_bookings: bookings?.length || 0,
                confirmed_bookings: confirmedBookings.length,
                completed_bookings: completedBookings.length
            },
            payout_history: [...payoutHistory, ...pendingPayouts].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()),
            bank_details: null
        };
        res.json({ success: true, data: response });
    }
    catch (error) {
        console.error('Error fetching host payouts:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
exports.default = router;
//# sourceMappingURL=host.js.map