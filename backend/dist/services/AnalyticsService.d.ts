interface DateRange {
    startDate: Date;
    endDate: Date;
}
interface RevenueMetrics {
    totalRevenue: number;
    monthlyRevenue: number;
    revenueGrowth: number;
    averageBookingValue: number;
    platformFee: number;
}
interface BookingMetrics {
    totalBookings: number;
    completedBookings: number;
    cancelledBookings: number;
    pendingBookings: number;
    bookingGrowth: number;
    conversionRate: number;
    averageStayDuration: number;
}
interface UserMetrics {
    totalUsers: number;
    activeUsers: number;
    newUsers: number;
    userGrowth: number;
    hostCount: number;
    guestCount: number;
    userRetentionRate: number;
}
interface PropertyMetrics {
    totalProperties: number;
    activeListings: number;
    verifiedProperties: number;
    averageRating: number;
    occupancyRate: number;
    propertyGrowth: number;
}
interface PaymentMetrics {
    totalProcessed: number;
    successfulPayments: number;
    failedPayments: number;
    pendingPayments: number;
    refundAmount: number;
    successRate: number;
    averageProcessingTime: number;
    paymentMethodBreakdown: Array<{
        method: string;
        count: number;
        amount: number;
        percentage: number;
    }>;
}
interface RegionalMetrics {
    emirate: string;
    bookings: number;
    revenue: number;
    properties: number;
    users: number;
    averageRating: number;
    occupancyRate: number;
    growth: number;
}
interface HostAnalytics {
    overview: {
        totalProperties: number;
        activeProperties: number;
        totalBookings: number;
        totalEarnings: number;
        averageRating: number;
        responseRate: number;
        occupancyRate: number;
    };
    bookings: {
        confirmed: number;
        pending: number;
        completed: number;
        cancelled: number;
        monthlyTrend: Array<{
            month: string;
            count: number;
            revenue: number;
        }>;
    };
    revenue: {
        thisMonth: number;
        lastMonth: number;
        growth: number;
        totalEarnings: number;
        averageBookingValue: number;
        monthlyChart: Array<{
            month: string;
            amount: number;
        }>;
    };
    properties: {
        topPerforming: Array<{
            id: string;
            title: string;
            bookings: number;
            revenue: number;
            rating: number;
            occupancyRate: number;
        }>;
        recentViews: Array<{
            propertyId: string;
            views: number;
            date: string;
        }>;
    };
    guests: {
        totalGuests: number;
        repeatGuests: number;
        averageStayDuration: number;
        guestSatisfaction: number;
        recentReviews: Array<{
            id: string;
            guestName: string;
            rating: number;
            comment: string;
            propertyTitle: string;
            date: string;
        }>;
    };
}
export declare class AnalyticsService {
    getDashboardMetrics(dateRange?: DateRange): Promise<{
        revenue: RevenueMetrics;
        bookings: BookingMetrics;
        users: UserMetrics;
        properties: PropertyMetrics;
        payments: PaymentMetrics;
        regional: RegionalMetrics[];
    }>;
    getRevenueMetrics(dateRange: DateRange): Promise<RevenueMetrics>;
    getBookingMetrics(dateRange: DateRange): Promise<BookingMetrics>;
    getUserMetrics(dateRange: DateRange): Promise<UserMetrics>;
    getPropertyMetrics(dateRange: DateRange): Promise<PropertyMetrics>;
    getPaymentMetrics(dateRange: DateRange): Promise<PaymentMetrics>;
    getRegionalMetrics(dateRange: DateRange): Promise<RegionalMetrics[]>;
    getTopPerformingProperties(limit?: number, dateRange?: DateRange): Promise<any[]>;
    getRevenueChartData(period?: 'daily' | 'weekly' | 'monthly', days?: number): Promise<any[]>;
    private getDefaultDateRange;
    trackEvent(eventType: string, eventData: any, userId?: string): Promise<void>;
    getHostAnalytics(hostId: string): Promise<HostAnalytics>;
    private calculateMonthlyTrend;
    private calculateMonthlyRevenue;
    private getCurrentMonthRevenue;
    private getLastMonthRevenue;
}
export {};
//# sourceMappingURL=AnalyticsService.d.ts.map