import { Router, Request, Response } from 'express';
import { AnalyticsService } from '../services/AnalyticsService';
import { requireAdmin, authMiddleware } from '../middleware/auth';

interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string;
    isHost: boolean;
    isAgent: boolean;
    isVerified: boolean;
  };
}

const router: Router = Router();
const analyticsService = new AnalyticsService();

// Get dashboard metrics (admin only)
router.get('/dashboard', requireAdmin, async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    let dateRange;
    if (startDate && endDate) {
      dateRange = {
        startDate: new Date(startDate as string),
        endDate: new Date(endDate as string),
      };
    }

    const metrics = await analyticsService.getDashboardMetrics(dateRange);

    res.json({
      success: true,
      data: metrics,
    });
  } catch (error) {
    console.error('Error fetching dashboard metrics:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// Get revenue metrics
router.get('/revenue', requireAdmin, async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    const dateRange = {
      startDate: startDate ? new Date(startDate as string) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
      endDate: endDate ? new Date(endDate as string) : new Date(),
    };

    const revenueMetrics = await analyticsService.getRevenueMetrics(dateRange);

    res.json({
      success: true,
      data: revenueMetrics,
    });
  } catch (error) {
    console.error('Error fetching revenue metrics:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// Get booking metrics
router.get('/bookings', requireAdmin, async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    const dateRange = {
      startDate: startDate ? new Date(startDate as string) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
      endDate: endDate ? new Date(endDate as string) : new Date(),
    };

    const bookingMetrics = await analyticsService.getBookingMetrics(dateRange);

    res.json({
      success: true,
      data: bookingMetrics,
    });
  } catch (error) {
    console.error('Error fetching booking metrics:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// Get user metrics
router.get('/users', requireAdmin, async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    const dateRange = {
      startDate: startDate ? new Date(startDate as string) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
      endDate: endDate ? new Date(endDate as string) : new Date(),
    };

    const userMetrics = await analyticsService.getUserMetrics(dateRange);

    res.json({
      success: true,
      data: userMetrics,
    });
  } catch (error) {
    console.error('Error fetching user metrics:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// Get property metrics
router.get('/properties', requireAdmin, async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    const dateRange = {
      startDate: startDate ? new Date(startDate as string) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
      endDate: endDate ? new Date(endDate as string) : new Date(),
    };

    const propertyMetrics = await analyticsService.getPropertyMetrics(dateRange);

    res.json({
      success: true,
      data: propertyMetrics,
    });
  } catch (error) {
    console.error('Error fetching property metrics:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// Get payment metrics
router.get('/payments', requireAdmin, async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    const dateRange = {
      startDate: startDate ? new Date(startDate as string) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
      endDate: endDate ? new Date(endDate as string) : new Date(),
    };

    const paymentMetrics = await analyticsService.getPaymentMetrics(dateRange);

    res.json({
      success: true,
      data: paymentMetrics,
    });
  } catch (error) {
    console.error('Error fetching payment metrics:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// Get regional metrics
router.get('/regional', requireAdmin, async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    const dateRange = {
      startDate: startDate ? new Date(startDate as string) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
      endDate: endDate ? new Date(endDate as string) : new Date(),
    };

    const regionalMetrics = await analyticsService.getRegionalMetrics(dateRange);

    res.json({
      success: true,
      data: regionalMetrics,
    });
  } catch (error) {
    console.error('Error fetching regional metrics:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// Get top performing properties
router.get('/top-properties', requireAdmin, async (req, res) => {
  try {
    const { limit = 10, startDate, endDate } = req.query;
    
    let dateRange;
    if (startDate && endDate) {
      dateRange = {
        startDate: new Date(startDate as string),
        endDate: new Date(endDate as string),
      };
    }

    const topProperties = await analyticsService.getTopPerformingProperties(
      Number(limit),
      dateRange
    );

    res.json({
      success: true,
      data: topProperties,
    });
  } catch (error) {
    console.error('Error fetching top properties:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// Get revenue chart data
router.get('/revenue-chart', requireAdmin, async (req, res) => {
  try {
    const { period = 'daily', days = 30 } = req.query;

    const chartData = await analyticsService.getRevenueChartData(
      period as 'daily' | 'weekly' | 'monthly',
      Number(days)
    );

    res.json({
      success: true,
      data: chartData,
    });
  } catch (error) {
    console.error('Error fetching revenue chart data:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// Track event (for analytics)
router.post('/track', async (req: any, res) => {
  try {
    const { eventType, eventData } = req.body;
    const userId = req.user?.id;

    await analyticsService.trackEvent(eventType, eventData, userId);

    res.json({
      success: true,
      message: 'Event tracked successfully',
    });
  } catch (error) {
    console.error('Error tracking event:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// Get host analytics (authenticated host only)
router.get('/host', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
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
  } catch (error) {
    console.error('Error fetching host analytics:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

export default router; 