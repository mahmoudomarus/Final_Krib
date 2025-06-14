"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const AnalyticsService_1 = require("../services/AnalyticsService");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
const analyticsService = new AnalyticsService_1.AnalyticsService();
router.get('/dashboard', auth_1.requireAdmin, async (req, res) => {
    try {
        const { startDate, endDate } = req.query;
        let dateRange;
        if (startDate && endDate) {
            dateRange = {
                startDate: new Date(startDate),
                endDate: new Date(endDate),
            };
        }
        const metrics = await analyticsService.getDashboardMetrics(dateRange);
        res.json({
            success: true,
            data: metrics,
        });
    }
    catch (error) {
        console.error('Error fetching dashboard metrics:', error);
        res.status(500).json({ success: false, error: 'Internal server error' });
    }
});
router.get('/revenue', auth_1.requireAdmin, async (req, res) => {
    try {
        const { startDate, endDate } = req.query;
        const dateRange = {
            startDate: startDate ? new Date(startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
            endDate: endDate ? new Date(endDate) : new Date(),
        };
        const revenueMetrics = await analyticsService.getRevenueMetrics(dateRange);
        res.json({
            success: true,
            data: revenueMetrics,
        });
    }
    catch (error) {
        console.error('Error fetching revenue metrics:', error);
        res.status(500).json({ success: false, error: 'Internal server error' });
    }
});
router.get('/bookings', auth_1.requireAdmin, async (req, res) => {
    try {
        const { startDate, endDate } = req.query;
        const dateRange = {
            startDate: startDate ? new Date(startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
            endDate: endDate ? new Date(endDate) : new Date(),
        };
        const bookingMetrics = await analyticsService.getBookingMetrics(dateRange);
        res.json({
            success: true,
            data: bookingMetrics,
        });
    }
    catch (error) {
        console.error('Error fetching booking metrics:', error);
        res.status(500).json({ success: false, error: 'Internal server error' });
    }
});
router.get('/users', auth_1.requireAdmin, async (req, res) => {
    try {
        const { startDate, endDate } = req.query;
        const dateRange = {
            startDate: startDate ? new Date(startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
            endDate: endDate ? new Date(endDate) : new Date(),
        };
        const userMetrics = await analyticsService.getUserMetrics(dateRange);
        res.json({
            success: true,
            data: userMetrics,
        });
    }
    catch (error) {
        console.error('Error fetching user metrics:', error);
        res.status(500).json({ success: false, error: 'Internal server error' });
    }
});
router.get('/properties', auth_1.requireAdmin, async (req, res) => {
    try {
        const { startDate, endDate } = req.query;
        const dateRange = {
            startDate: startDate ? new Date(startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
            endDate: endDate ? new Date(endDate) : new Date(),
        };
        const propertyMetrics = await analyticsService.getPropertyMetrics(dateRange);
        res.json({
            success: true,
            data: propertyMetrics,
        });
    }
    catch (error) {
        console.error('Error fetching property metrics:', error);
        res.status(500).json({ success: false, error: 'Internal server error' });
    }
});
router.get('/payments', auth_1.requireAdmin, async (req, res) => {
    try {
        const { startDate, endDate } = req.query;
        const dateRange = {
            startDate: startDate ? new Date(startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
            endDate: endDate ? new Date(endDate) : new Date(),
        };
        const paymentMetrics = await analyticsService.getPaymentMetrics(dateRange);
        res.json({
            success: true,
            data: paymentMetrics,
        });
    }
    catch (error) {
        console.error('Error fetching payment metrics:', error);
        res.status(500).json({ success: false, error: 'Internal server error' });
    }
});
router.get('/regional', auth_1.requireAdmin, async (req, res) => {
    try {
        const { startDate, endDate } = req.query;
        const dateRange = {
            startDate: startDate ? new Date(startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
            endDate: endDate ? new Date(endDate) : new Date(),
        };
        const regionalMetrics = await analyticsService.getRegionalMetrics(dateRange);
        res.json({
            success: true,
            data: regionalMetrics,
        });
    }
    catch (error) {
        console.error('Error fetching regional metrics:', error);
        res.status(500).json({ success: false, error: 'Internal server error' });
    }
});
router.get('/top-properties', auth_1.requireAdmin, async (req, res) => {
    try {
        const { limit = 10, startDate, endDate } = req.query;
        let dateRange;
        if (startDate && endDate) {
            dateRange = {
                startDate: new Date(startDate),
                endDate: new Date(endDate),
            };
        }
        const topProperties = await analyticsService.getTopPerformingProperties(Number(limit), dateRange);
        res.json({
            success: true,
            data: topProperties,
        });
    }
    catch (error) {
        console.error('Error fetching top properties:', error);
        res.status(500).json({ success: false, error: 'Internal server error' });
    }
});
router.get('/revenue-chart', auth_1.requireAdmin, async (req, res) => {
    try {
        const { period = 'daily', days = 30 } = req.query;
        const chartData = await analyticsService.getRevenueChartData(period, Number(days));
        res.json({
            success: true,
            data: chartData,
        });
    }
    catch (error) {
        console.error('Error fetching revenue chart data:', error);
        res.status(500).json({ success: false, error: 'Internal server error' });
    }
});
router.post('/track', async (req, res) => {
    try {
        const { eventType, eventData } = req.body;
        const userId = req.user?.id;
        await analyticsService.trackEvent(eventType, eventData, userId);
        res.json({
            success: true,
            message: 'Event tracked successfully',
        });
    }
    catch (error) {
        console.error('Error tracking event:', error);
        res.status(500).json({ success: false, error: 'Internal server error' });
    }
});
router.get('/host', auth_1.authMiddleware, async (req, res) => {
    try {
        const userId = req.user?.id;
        if (!userId) {
            return res.status(401).json({ success: false, error: 'User not authenticated' });
        }
        const hostAnalytics = await analyticsService.getHostAnalytics(userId);
        res.json({
            success: true,
            data: hostAnalytics,
        });
    }
    catch (error) {
        console.error('Error fetching host analytics:', error);
        res.status(500).json({ success: false, error: 'Internal server error' });
    }
});
exports.default = router;
//# sourceMappingURL=analytics.js.map