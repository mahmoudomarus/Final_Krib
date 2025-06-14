import { supabase } from '../lib/supabase';

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
    monthlyTrend: Array<{ month: string; count: number; revenue: number }>;
  };
  revenue: {
    thisMonth: number;
    lastMonth: number;
    growth: number;
    totalEarnings: number;
    averageBookingValue: number;
    monthlyChart: Array<{ month: string; amount: number }>;
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

export class AnalyticsService {
  
  async getDashboardMetrics(dateRange?: DateRange): Promise<{
    revenue: RevenueMetrics;
    bookings: BookingMetrics;
    users: UserMetrics;
    properties: PropertyMetrics;
    payments: PaymentMetrics;
    regional: RegionalMetrics[];
  }> {
    const range = dateRange || this.getDefaultDateRange();
    
    const [revenue, bookings, users, properties, payments, regional] = await Promise.all([
      this.getRevenueMetrics(range),
      this.getBookingMetrics(range),
      this.getUserMetrics(range),
      this.getPropertyMetrics(range),
      this.getPaymentMetrics(range),
      this.getRegionalMetrics(range),
    ]);

    return {
      revenue,
      bookings,
      users,
      properties,
      payments,
      regional,
    };
  }

  async getRevenueMetrics(dateRange: DateRange): Promise<RevenueMetrics> {
    // Current period revenue
    const { data: currentPayments, error: currentError } = await supabase
      .from('payments')
      .select('amount, platform_fee')
      .eq('status', 'COMPLETED')
      .gte('paid_at', dateRange.startDate.toISOString())
      .lte('paid_at', dateRange.endDate.toISOString());

    if (currentError) throw currentError;

    const totalRevenue = currentPayments?.reduce((sum, payment) => sum + (payment.amount || 0), 0) || 0;
    const platformFee = currentPayments?.reduce((sum, payment) => sum + (payment.platform_fee || 0), 0) || 0;

    // Previous period for growth calculation
    const periodLength = dateRange.endDate.getTime() - dateRange.startDate.getTime();
    const previousStartDate = new Date(dateRange.startDate.getTime() - periodLength);
    const previousEndDate = dateRange.startDate;

    const { data: previousPayments, error: previousError } = await supabase
      .from('payments')
      .select('amount')
      .eq('status', 'COMPLETED')
      .gte('paid_at', previousStartDate.toISOString())
      .lte('paid_at', previousEndDate.toISOString());

    if (previousError) throw previousError;

    const previousTotal = previousPayments?.reduce((sum, payment) => sum + (payment.amount || 0), 0) || 0;

    // Monthly revenue (current month)
    const monthStart = new Date();
    monthStart.setDate(1);
    monthStart.setHours(0, 0, 0, 0);

    const { data: monthlyPayments, error: monthlyError } = await supabase
      .from('payments')
      .select('amount')
      .eq('status', 'COMPLETED')
      .gte('paid_at', monthStart.toISOString());

    if (monthlyError) throw monthlyError;

    const monthlyRevenue = monthlyPayments?.reduce((sum, payment) => sum + (payment.amount || 0), 0) || 0;

    // Average booking value
    const { data: completedBookings, error: bookingError } = await supabase
      .from('bookings')
      .select('total_amount')
      .eq('status', 'COMPLETED')
      .gte('created_at', dateRange.startDate.toISOString())
      .lte('created_at', dateRange.endDate.toISOString());

    if (bookingError) throw bookingError;

    const averageBookingValue = completedBookings?.length > 0 
      ? completedBookings.reduce((sum, booking) => sum + (booking.total_amount || 0), 0) / completedBookings.length
      : 0;

    const revenueGrowth = previousTotal > 0 ? ((totalRevenue - previousTotal) / previousTotal) * 100 : 0;

    return {
      totalRevenue,
      monthlyRevenue,
      revenueGrowth,
      averageBookingValue,
      platformFee,
    };
  }

  async getBookingMetrics(dateRange: DateRange): Promise<BookingMetrics> {
    const { data: bookings, error } = await supabase
      .from('bookings')
      .select('id, status, created_at, check_in, check_out')
      .gte('created_at', dateRange.startDate.toISOString())
      .lte('created_at', dateRange.endDate.toISOString());

    if (error) throw error;

    const totalBookings = bookings?.length || 0;
    const completedBookings = bookings?.filter(b => b.status === 'COMPLETED').length || 0;
    const cancelledBookings = bookings?.filter(b => b.status === 'CANCELLED').length || 0;
    const pendingBookings = bookings?.filter(b => b.status === 'PENDING').length || 0;

    // Previous period for growth
    const periodLength = dateRange.endDate.getTime() - dateRange.startDate.getTime();
    const previousStartDate = new Date(dateRange.startDate.getTime() - periodLength);

    const { data: previousBookings, error: previousError } = await supabase
      .from('bookings')
      .select('id')
      .gte('created_at', previousStartDate.toISOString())
      .lte('created_at', dateRange.startDate.toISOString());

    if (previousError) throw previousError;

    const previousBookingCount = previousBookings?.length || 0;
    const bookingGrowth = previousBookingCount > 0 ? ((totalBookings - previousBookingCount) / previousBookingCount) * 100 : 0;

    // Conversion rate (booking inquiries to confirmed bookings)
    const conversionRate = totalBookings > 0 ? (completedBookings / totalBookings) * 100 : 0;

    // Average stay duration
    const completedWithDates = bookings?.filter(b => 
      b.status === 'COMPLETED' && b.check_in && b.check_out
    ) || [];
    
    const averageStayDuration = completedWithDates.length > 0
      ? completedWithDates.reduce((sum, booking) => {
          const checkIn = new Date(booking.check_in);
          const checkOut = new Date(booking.check_out);
          const nights = Math.ceil((checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24));
          return sum + nights;
        }, 0) / completedWithDates.length
      : 3.5;

    return {
      totalBookings,
      completedBookings,
      cancelledBookings,
      pendingBookings,
      bookingGrowth,
      conversionRate,
      averageStayDuration,
    };
  }

  async getUserMetrics(dateRange: DateRange): Promise<UserMetrics> {
    const { data: allUsers, error: usersError } = await supabase
      .from('users')
      .select('id, created_at, is_host, is_active')
      .eq('is_active', true);

    if (usersError) throw usersError;

    const totalUsers = allUsers?.length || 0;
    const hostCount = allUsers?.filter(user => user.is_host).length || 0;
    const guestCount = totalUsers - hostCount;

    const newUsers = allUsers?.filter(user => {
      const createdAt = new Date(user.created_at);
      return createdAt >= dateRange.startDate && createdAt <= dateRange.endDate;
    }).length || 0;

    // Active users (users with activity in the period)
    const { data: activeBookings, error: activeError } = await supabase
      .from('bookings')
      .select('guest_id, property_id, properties(host_id)')
      .gte('created_at', dateRange.startDate.toISOString())
      .lte('created_at', dateRange.endDate.toISOString());

    if (activeError) throw activeError;

    const activeUserIds = new Set();
    activeBookings?.forEach(booking => {
      if (booking.guest_id) activeUserIds.add(booking.guest_id);
      // Handle properties relation - could be array or object depending on query
      const properties = booking.properties as any;
      if (properties?.host_id) {
        activeUserIds.add(properties.host_id);
      }
    });

    const activeUsers = activeUserIds.size;

    // Previous period for growth
    const periodLength = dateRange.endDate.getTime() - dateRange.startDate.getTime();
    const previousStartDate = new Date(dateRange.startDate.getTime() - periodLength);

    const previousUsers = allUsers?.filter(user => {
      const createdAt = new Date(user.created_at);
      return createdAt >= previousStartDate && createdAt <= dateRange.startDate;
    }).length || 0;

    const userGrowth = previousUsers > 0 ? ((newUsers - previousUsers) / previousUsers) * 100 : 0;

    return {
      totalUsers,
      activeUsers,
      newUsers,
      userGrowth,
      hostCount,
      guestCount,
      userRetentionRate: 85.5, // Placeholder - would calculate based on repeat bookings
    };
  }

  async getPropertyMetrics(dateRange: DateRange): Promise<PropertyMetrics> {
    const { data: properties, error: propertiesError } = await supabase
      .from('properties')
      .select('id, created_at, is_active, verification_status')
      .eq('is_active', true);

    if (propertiesError) throw propertiesError;

    const totalProperties = properties?.length || 0;
    const activeListings = properties?.filter(p => p.verification_status === 'VERIFIED').length || 0;
    const verifiedProperties = properties?.filter(p => p.verification_status === 'VERIFIED').length || 0;

    // Average rating
    const { data: reviews, error: reviewsError } = await supabase
      .from('reviews')
      .select('overall_rating');

    if (reviewsError) throw reviewsError;

    const averageRating = reviews?.length > 0
      ? reviews.reduce((sum, review) => sum + (review.overall_rating || 0), 0) / reviews.length
      : 0;

    // New properties in period
    const newProperties = properties?.filter(property => {
      const createdAt = new Date(property.created_at);
      return createdAt >= dateRange.startDate && createdAt <= dateRange.endDate;
    }).length || 0;

    // Previous period for growth
    const periodLength = dateRange.endDate.getTime() - dateRange.startDate.getTime();
    const previousStartDate = new Date(dateRange.startDate.getTime() - periodLength);

    const previousProperties = properties?.filter(property => {
      const createdAt = new Date(property.created_at);
      return createdAt >= previousStartDate && createdAt <= dateRange.startDate;
    }).length || 0;

    const propertyGrowth = previousProperties > 0 ? ((newProperties - previousProperties) / previousProperties) * 100 : 0;

    return {
      totalProperties,
      activeListings,
      verifiedProperties,
      averageRating,
      occupancyRate: 73.5, // Placeholder - would calculate based on booking vs available dates
      propertyGrowth,
    };
  }

  async getPaymentMetrics(dateRange: DateRange): Promise<PaymentMetrics> {
    const { data: payments, error } = await supabase
      .from('payments')
      .select('id, status, method, amount, refund_amount, created_at')
      .gte('created_at', dateRange.startDate.toISOString())
      .lte('created_at', dateRange.endDate.toISOString());

    if (error) throw error;

    const totalProcessed = payments?.reduce((sum, payment) => sum + (payment.amount || 0), 0) || 0;
    const successfulPayments = payments?.filter(p => p.status === 'COMPLETED').length || 0;
    const failedPayments = payments?.filter(p => p.status === 'FAILED').length || 0;
    const pendingPayments = payments?.filter(p => p.status === 'PENDING').length || 0;

    const totalTransactions = payments?.length || 0;
    const successRate = totalTransactions > 0 ? (successfulPayments / totalTransactions) * 100 : 0;

    // Refund amount
    const refundAmount = payments?.reduce((sum, payment) => sum + (payment.refund_amount || 0), 0) || 0;

    // Payment method breakdown
    const methodBreakdown: Array<{
      method: string;
      count: number;
      amount: number;
      percentage: number;
    }> = [];

    const methodStats = payments?.reduce((acc, payment) => {
      const method = payment.method || 'unknown';
      if (!acc[method]) {
        acc[method] = { count: 0, amount: 0 };
      }
      acc[method].count++;
      acc[method].amount += payment.amount || 0;
      return acc;
    }, {} as Record<string, { count: number; amount: number }>) || {};

    Object.entries(methodStats).forEach(([method, stats]) => {
      methodBreakdown.push({
        method,
        count: stats.count,
        amount: stats.amount,
        percentage: totalTransactions > 0 ? (stats.count / totalTransactions) * 100 : 0,
      });
    });

    return {
      totalProcessed,
      successfulPayments,
      failedPayments,
      pendingPayments,
      refundAmount,
      successRate,
      averageProcessingTime: 2.5, // Placeholder
      paymentMethodBreakdown: methodBreakdown,
    };
  }

  async getRegionalMetrics(dateRange: DateRange): Promise<RegionalMetrics[]> {
    // Get properties with their locations and associated bookings
    const { data: properties, error: propertiesError } = await supabase
      .from('properties')
      .select(`
        id,
        emirate,
        bookings!inner(
          id,
          status,
          total_amount,
          created_at
        ),
        reviews(overall_rating)
      `)
      .gte('bookings.created_at', dateRange.startDate.toISOString())
      .lte('bookings.created_at', dateRange.endDate.toISOString());

    if (propertiesError) throw propertiesError;

    // Get users by emirate (assuming users have emirate field)
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('emirate')
      .not('emirate', 'is', null);

    if (usersError) throw usersError;

    const emirateStats: Record<string, {
      bookings: number;
      revenue: number;
      properties: Set<string>;
      users: number;
      ratings: number[];
    }> = {};

    // Process properties and bookings
    properties?.forEach(property => {
      const emirate = property.emirate || 'Unknown';
      
      if (!emirateStats[emirate]) {
        emirateStats[emirate] = {
          bookings: 0,
          revenue: 0,
          properties: new Set(),
          users: 0,
          ratings: [],
        };
      }

      emirateStats[emirate].properties.add(property.id);
      
      property.bookings?.forEach(booking => {
        if (booking.status === 'COMPLETED') {
          emirateStats[emirate].bookings++;
          emirateStats[emirate].revenue += booking.total_amount || 0;
        }
      });

      property.reviews?.forEach(review => {
        if (review.overall_rating) {
          emirateStats[emirate].ratings.push(review.overall_rating);
        }
      });
    });

    // Process users by emirate
    users?.forEach(user => {
      const emirate = user.emirate || 'Unknown';
      if (emirateStats[emirate]) {
        emirateStats[emirate].users++;
      }
    });

    return Object.entries(emirateStats).map(([emirate, stats]) => ({
      emirate,
      bookings: stats.bookings,
      revenue: stats.revenue,
      properties: stats.properties.size,
      users: stats.users,
      averageRating: stats.ratings.length > 0 
        ? stats.ratings.reduce((sum, rating) => sum + rating, 0) / stats.ratings.length 
        : 0,
      occupancyRate: 75.0, // Placeholder
      growth: 12.5, // Placeholder
    }));
  }

  async getTopPerformingProperties(limit: number = 10, dateRange?: DateRange): Promise<any[]> {
    const range = dateRange || this.getDefaultDateRange();
    
    const { data: properties, error } = await supabase
      .from('properties')
      .select(`
        id,
        title,
        bookings!inner(
          id,
          status,
          total_amount,
          created_at
        ),
        reviews(overall_rating)
      `)
      .gte('bookings.created_at', range.startDate.toISOString())
      .lte('bookings.created_at', range.endDate.toISOString())
      .limit(limit);

    if (error) throw error;

    return properties?.map(property => {
      const completedBookings = property.bookings?.filter(b => b.status === 'COMPLETED') || [];
      const revenue = completedBookings.reduce((sum, booking) => sum + (booking.total_amount || 0), 0);
      const averageRating = property.reviews?.length > 0
        ? property.reviews.reduce((sum, review) => sum + (review.overall_rating || 0), 0) / property.reviews.length
        : 0;

      return {
        id: property.id,
        title: property.title,
        bookings: completedBookings.length,
        revenue,
        rating: averageRating,
        occupancyRate: 80.0, // Placeholder
      };
    }).sort((a, b) => b.revenue - a.revenue) || [];
  }

  async getRevenueChartData(period: 'daily' | 'weekly' | 'monthly' = 'daily', days: number = 30): Promise<any[]> {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(endDate.getDate() - days);

    const { data: payments, error } = await supabase
      .from('payments')
      .select('amount, paid_at')
      .eq('status', 'COMPLETED')
      .gte('paid_at', startDate.toISOString())
      .lte('paid_at', endDate.toISOString())
      .order('paid_at', { ascending: true });

    if (error) throw error;

    const chartData: Record<string, number> = {};

    payments?.forEach(payment => {
      const date = new Date(payment.paid_at);
      let key: string;

      switch (period) {
        case 'daily':
          key = date.toISOString().split('T')[0];
          break;
        case 'weekly':
          const weekStart = new Date(date);
          weekStart.setDate(date.getDate() - date.getDay());
          key = weekStart.toISOString().split('T')[0];
          break;
        case 'monthly':
          key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
          break;
        default:
          key = date.toISOString().split('T')[0];
      }

      chartData[key] = (chartData[key] || 0) + (payment.amount || 0);
    });

    return Object.entries(chartData).map(([date, amount]) => ({
      date,
      amount,
    }));
  }

  private getDefaultDateRange(): DateRange {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(endDate.getDate() - 30);
    
    return { startDate, endDate };
  }

  async trackEvent(eventType: string, eventData: any, userId?: string): Promise<void> {
    const { error } = await supabase
      .from('analytics_events')
      .insert({
        event_type: eventType,
        event_data: eventData,
        user_id: userId,
        created_at: new Date().toISOString(),
      });

    if (error) {
      console.error('Failed to track event:', error);
    }
  }

  async getHostAnalytics(hostId: string): Promise<HostAnalytics> {
    // Get host properties
    const { data: properties, error: propertiesError } = await supabase
      .from('properties')
      .select(`
        id,
        title,
        is_active,
        bookings(
          id,
          status,
          total_amount,
          guest_id,
          created_at,
          check_in,
          check_out
        ),
        reviews(
          id,
          overall_rating,
          comment,
          guest_id,
          created_at,
          users(first_name, last_name)
        )
      `)
      .eq('host_id', hostId);

    if (propertiesError) throw propertiesError;

    const totalProperties = properties?.length || 0;
    const activeProperties = properties?.filter(p => p.is_active).length || 0;

    // Calculate booking metrics
    const allBookings = properties?.flatMap(p => p.bookings || []) || [];
    const totalBookings = allBookings.length;
    const confirmedBookings = allBookings.filter(b => b.status === 'CONFIRMED').length;
    const pendingBookings = allBookings.filter(b => b.status === 'PENDING').length;
    const completedBookings = allBookings.filter(b => b.status === 'COMPLETED').length;
    const cancelledBookings = allBookings.filter(b => b.status === 'CANCELLED').length;

    // Calculate revenue metrics
    const completedBookingAmounts = allBookings
      .filter(b => b.status === 'COMPLETED')
      .map(b => b.total_amount || 0);
    
    const totalEarnings = completedBookingAmounts.reduce((sum, amount) => sum + amount, 0);
    const averageBookingValue = completedBookingAmounts.length > 0
      ? totalEarnings / completedBookingAmounts.length
      : 0;

    // Calculate ratings
    const allReviews = properties?.flatMap(p => p.reviews || []) || [];
    const averageRating = allReviews.length > 0
      ? allReviews.reduce((sum, review) => sum + (review.overall_rating || 0), 0) / allReviews.length
      : 0;

    // Monthly trends (last 12 months)
    const monthlyTrend = this.calculateMonthlyTrend(allBookings);
    const monthlyChart = this.calculateMonthlyRevenue(allBookings);

    // Top performing properties
    const topPerforming = properties?.map(property => {
      const propertyBookings = property.bookings?.filter(b => b.status === 'COMPLETED') || [];
      const propertyRevenue = propertyBookings.reduce((sum, b) => sum + (b.total_amount || 0), 0);
      const propertyReviews = property.reviews || [];
      const propertyRating = propertyReviews.length > 0
        ? propertyReviews.reduce((sum, r) => sum + (r.overall_rating || 0), 0) / propertyReviews.length
        : 0;

      return {
        id: property.id,
        title: property.title,
        bookings: propertyBookings.length,
        revenue: propertyRevenue,
        rating: propertyRating,
        occupancyRate: 75.0, // Placeholder
      };
    }).sort((a, b) => b.revenue - a.revenue).slice(0, 5) || [];

    // Guest metrics
    const uniqueGuests = new Set(allBookings.map(b => b.guest_id)).size;
    const guestBookingCounts = allBookings.reduce((acc, booking) => {
      const guestId = booking.guest_id;
      if (guestId) {
        acc[guestId] = (acc[guestId] || 0) + 1;
      }
      return acc;
    }, {} as Record<string, number>);
    
    const repeatGuests = Object.values(guestBookingCounts).filter(count => count > 1).length;

    // Recent reviews - handle users relation properly
    const recentReviews = allReviews
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, 5)
      .map(review => {
        // Handle users relation - could be array or object
        const users = review.users as any;
        const guestName = users?.first_name && users?.last_name 
          ? `${users.first_name} ${users.last_name}` 
          : 'Anonymous';
        
        return {
          id: review.id,
          guestName,
          rating: review.overall_rating || 0,
          comment: review.comment || '',
          propertyTitle: properties?.find(p => p.reviews?.some(r => r.id === review.id))?.title || '',
          date: review.created_at,
        };
      });

    return {
      overview: {
        totalProperties,
        activeProperties,
        totalBookings,
        totalEarnings,
        averageRating,
        responseRate: 95.0, // Placeholder
        occupancyRate: 73.5, // Placeholder
      },
      bookings: {
        confirmed: confirmedBookings,
        pending: pendingBookings,
        completed: completedBookings,
        cancelled: cancelledBookings,
        monthlyTrend,
      },
      revenue: {
        thisMonth: this.getCurrentMonthRevenue(allBookings),
        lastMonth: this.getLastMonthRevenue(allBookings),
        growth: 15.5, // Placeholder
        totalEarnings,
        averageBookingValue,
        monthlyChart,
      },
      properties: {
        topPerforming,
        recentViews: [], // Placeholder
      },
      guests: {
        totalGuests: uniqueGuests,
        repeatGuests,
        averageStayDuration: 3.5, // Placeholder
        guestSatisfaction: averageRating,
        recentReviews,
      },
    };
  }

  private calculateMonthlyTrend(bookings: any[]): Array<{ month: string; count: number; revenue: number }> {
    const monthlyData: Record<string, { count: number; revenue: number }> = {};

    bookings.forEach(booking => {
      const date = new Date(booking.created_at);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      
      if (!monthlyData[monthKey]) {
        monthlyData[monthKey] = { count: 0, revenue: 0 };
      }
      
      monthlyData[monthKey].count++;
      if (booking.status === 'COMPLETED') {
        monthlyData[monthKey].revenue += booking.total_amount || 0;
      }
    });

    return Object.entries(monthlyData).map(([month, data]) => ({
      month,
      count: data.count,
      revenue: data.revenue,
    }));
  }

  private calculateMonthlyRevenue(bookings: any[]): Array<{ month: string; amount: number }> {
    const monthlyRevenue: Record<string, number> = {};

    bookings
      .filter(booking => booking.status === 'COMPLETED')
      .forEach(booking => {
        const date = new Date(booking.created_at);
        const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        
        monthlyRevenue[monthKey] = (monthlyRevenue[monthKey] || 0) + (booking.total_amount || 0);
      });

    return Object.entries(monthlyRevenue).map(([month, amount]) => ({
      month,
      amount,
    }));
  }

  private getCurrentMonthRevenue(bookings: any[]): number {
    const now = new Date();
    const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    
    return bookings
      .filter(booking => {
        const bookingDate = new Date(booking.created_at);
        const bookingMonth = `${bookingDate.getFullYear()}-${String(bookingDate.getMonth() + 1).padStart(2, '0')}`;
        return bookingMonth === currentMonth && booking.status === 'COMPLETED';
      })
      .reduce((sum, booking) => sum + (booking.total_amount || 0), 0);
  }

  private getLastMonthRevenue(bookings: any[]): number {
    const now = new Date();
    const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const lastMonthKey = `${lastMonth.getFullYear()}-${String(lastMonth.getMonth() + 1).padStart(2, '0')}`;
    
    return bookings
      .filter(booking => {
        const bookingDate = new Date(booking.created_at);
        const bookingMonth = `${bookingDate.getFullYear()}-${String(bookingDate.getMonth() + 1).padStart(2, '0')}`;
        return bookingMonth === lastMonthKey && booking.status === 'COMPLETED';
      })
      .reduce((sum, booking) => sum + (booking.total_amount || 0), 0);
  }
} 