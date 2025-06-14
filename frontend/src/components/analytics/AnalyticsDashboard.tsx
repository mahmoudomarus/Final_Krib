import React, { useState, useEffect } from 'react';
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Users, 
  Home, 
  Calendar,
  Star,
  Eye,
  BarChart3,
  Activity,
  Clock,
  Target
} from 'lucide-react';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { formatCurrency, formatDate } from '../../lib/utils';
import { apiService } from '../../services/api';

interface AnalyticsData {
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

interface StatCardProps {
  title: string;
  value: string | number;
  change?: number;
  icon: React.ComponentType<any>;
  color: string;
  bgColor: string;
}

const StatCard: React.FC<StatCardProps> = ({ title, value, change, icon: Icon, color, bgColor }) => {
  return (
    <Card padding="lg" className="relative overflow-hidden">
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-600 mb-1">{title}</p>
          <p className="text-3xl font-bold text-gray-900 mb-2">{value}</p>
          {change !== undefined && (
            <div className="flex items-center">
              {change >= 0 ? (
                <TrendingUp className="w-4 h-4 text-green-600 mr-1" />
              ) : (
                <TrendingDown className="w-4 h-4 text-red-600 mr-1" />
              )}
              <span className={`text-sm font-medium ${change >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {Math.abs(change)}%
              </span>
              <span className="text-sm text-gray-500 ml-1">vs last period</span>
            </div>
          )}
        </div>
        <div className={`w-12 h-12 ${bgColor} rounded-full flex items-center justify-center`}>
          <Icon className={`w-6 h-6 ${color}`} />
        </div>
      </div>
    </Card>
  );
};

interface ChartCardProps {
  title: string;
  data: Array<{ month: string; amount: number }> | Array<{ month: string; count: number; revenue: number }>;
  type: 'revenue' | 'bookings';
}

const SimpleChart: React.FC<ChartCardProps> = ({ title, data, type }) => {
  const maxValue = Math.max(...data.map(d => type === 'revenue' ? (d as any).amount : (d as any).count));
  
  return (
    <Card padding="lg">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
        <BarChart3 className="w-5 h-5 text-gray-400" />
      </div>
      
      <div className="space-y-4">
        {data.map((item, index) => {
          const value = type === 'revenue' ? (item as any).amount : (item as any).count;
          const percentage = (value / maxValue) * 100;
          
          return (
            <div key={index} className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-gray-600">{item.month}</span>
                <span className="text-sm font-bold text-gray-900">
                  {type === 'revenue' ? formatCurrency(value) : value}
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-primary-600 h-2 rounded-full transition-all duration-500" 
                  style={{ width: `${percentage}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
};

const AnalyticsDashboard: React.FC = () => {
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeView, setActiveView] = useState<'overview' | 'revenue' | 'properties' | 'guests'>('overview');

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      const response = await apiService.getHostAnalytics() as any;
      if (response && response.data) {
        setAnalyticsData(response.data);
      }
    } catch (error) {
      console.error('Error fetching analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-8">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-32 bg-gray-200 rounded-lg"></div>
            ))}
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="h-80 bg-gray-200 rounded-lg"></div>
            <div className="h-80 bg-gray-200 rounded-lg"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!analyticsData) {
    return (
      <div className="text-center py-12">
        <BarChart3 className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">No Analytics Data</h3>
        <p className="text-gray-600">Analytics data will appear here once you have properties and bookings.</p>
      </div>
    );
  }

  const { overview, bookings, revenue, properties, guests } = analyticsData;

  const renderOverview = () => (
    <div className="space-y-8">
      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Properties"
          value={overview.totalProperties}
          icon={Home}
          color="text-blue-600"
          bgColor="bg-blue-100"
        />
        <StatCard
          title="Total Bookings"
          value={overview.totalBookings}
          icon={Calendar}
          color="text-green-600"
          bgColor="bg-green-100"
        />
        <StatCard
          title="Total Earnings"
          value={formatCurrency(overview.totalEarnings)}
          change={revenue.growth}
          icon={DollarSign}
          color="text-purple-600"
          bgColor="bg-purple-100"
        />
        <StatCard
          title="Average Rating"
          value={overview.averageRating.toFixed(1)}
          icon={Star}
          color="text-yellow-600"
          bgColor="bg-yellow-100"
        />
      </div>

      {/* Performance Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card padding="lg" className="text-center">
          <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Target className="w-8 h-8 text-emerald-600" />
          </div>
          <h3 className="text-2xl font-bold text-gray-900 mb-2">{overview.occupancyRate}%</h3>
          <p className="text-sm text-gray-600">Occupancy Rate</p>
        </Card>

        <Card padding="lg" className="text-center">
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Clock className="w-8 h-8 text-blue-600" />
          </div>
          <h3 className="text-2xl font-bold text-gray-900 mb-2">{overview.responseRate}%</h3>
          <p className="text-sm text-gray-600">Response Rate</p>
        </Card>

        <Card padding="lg" className="text-center">
          <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Users className="w-8 h-8 text-orange-600" />
          </div>
          <h3 className="text-2xl font-bold text-gray-900 mb-2">{guests.repeatGuests}</h3>
          <p className="text-sm text-gray-600">Repeat Guests</p>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <SimpleChart 
          title="Revenue Trend (6 months)" 
          data={revenue.monthlyChart} 
          type="revenue" 
        />
        <SimpleChart 
          title="Booking Trend (6 months)" 
          data={bookings.monthlyTrend} 
          type="bookings" 
        />
      </div>
    </div>
  );

  const renderRevenue = () => (
    <div className="space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card padding="lg">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">This Month</h3>
          <p className="text-3xl font-bold text-green-600">{formatCurrency(revenue.thisMonth)}</p>
          <p className="text-sm text-gray-600 mt-1">Current month earnings</p>
        </Card>
        
        <Card padding="lg">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Last Month</h3>
          <p className="text-3xl font-bold text-gray-600">{formatCurrency(revenue.lastMonth)}</p>
          <div className="flex items-center mt-1">
            {revenue.growth >= 0 ? (
              <TrendingUp className="w-4 h-4 text-green-600 mr-1" />
            ) : (
              <TrendingDown className="w-4 h-4 text-red-600 mr-1" />
            )}
            <span className={`text-sm ${revenue.growth >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {Math.abs(revenue.growth)}% growth
            </span>
          </div>
        </Card>

        <Card padding="lg">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Avg Booking Value</h3>
          <p className="text-3xl font-bold text-purple-600">{formatCurrency(revenue.averageBookingValue)}</p>
          <p className="text-sm text-gray-600 mt-1">Per booking average</p>
        </Card>
      </div>

      <SimpleChart 
        title="Revenue by Month" 
        data={revenue.monthlyChart} 
        type="revenue" 
      />
    </div>
  );

  const renderProperties = () => (
    <div className="space-y-8">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <Card padding="lg">
          <h3 className="text-lg font-semibold text-gray-900 mb-6">Top Performing Properties</h3>
          <div className="space-y-4">
            {properties.topPerforming.slice(0, 5).map((property, index) => (
              <div key={property.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div className="flex-1">
                  <h4 className="font-medium text-gray-900 truncate">{property.title}</h4>
                  <div className="flex items-center space-x-4 mt-2">
                    <span className="text-sm text-gray-600">{property.bookings} bookings</span>
                    <div className="flex items-center">
                      <Star className="w-4 h-4 text-yellow-500 mr-1" />
                      <span className="text-sm text-gray-600">{property.rating}</span>
                    </div>
                    <span className="text-sm text-gray-600">{property.occupancyRate}% occupancy</span>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-bold text-green-600">{formatCurrency(property.revenue)}</p>
                  <Badge variant="primary">#{index + 1}</Badge>
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card padding="lg">
          <h3 className="text-lg font-semibold text-gray-900 mb-6">Recent Property Views</h3>
          <div className="space-y-4">
            {properties.recentViews.map((view, index) => (
              <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center">
                  <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                    <Eye className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">Property Views</p>
                    <p className="text-sm text-gray-600">{formatDate(view.date)}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-bold text-gray-900">{view.views}</p>
                  <p className="text-sm text-gray-600">views</p>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );

  const renderGuests = () => (
    <div className="space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card padding="lg" className="text-center">
          <h3 className="text-2xl font-bold text-gray-900 mb-2">{guests.totalGuests}</h3>
          <p className="text-sm text-gray-600">Total Guests</p>
        </Card>
        
        <Card padding="lg" className="text-center">
          <h3 className="text-2xl font-bold text-green-600 mb-2">{guests.repeatGuests}</h3>
          <p className="text-sm text-gray-600">Repeat Guests</p>
        </Card>

        <Card padding="lg" className="text-center">
          <h3 className="text-2xl font-bold text-blue-600 mb-2">{guests.averageStayDuration}</h3>
          <p className="text-sm text-gray-600">Avg Stay (days)</p>
        </Card>

        <Card padding="lg" className="text-center">
          <div className="flex items-center justify-center mb-2">
            <Star className="w-6 h-6 text-yellow-500 mr-1" />
            <span className="text-2xl font-bold text-gray-900">{guests.guestSatisfaction}</span>
          </div>
          <p className="text-sm text-gray-600">Guest Satisfaction</p>
        </Card>
      </div>

      <Card padding="lg">
        <h3 className="text-lg font-semibold text-gray-900 mb-6">Recent Reviews</h3>
        <div className="space-y-4">
          {guests.recentReviews.slice(0, 5).map((review) => (
            <div key={review.id} className="border-b border-gray-200 pb-4 last:border-b-0">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <h4 className="font-medium text-gray-900">{review.guestName}</h4>
                  <p className="text-sm text-gray-600">{review.propertyTitle}</p>
                </div>
                <div className="flex items-center">
                  <Star className="w-4 h-4 text-yellow-500 mr-1" />
                  <span className="text-sm font-medium text-gray-900">{review.rating}</span>
                </div>
              </div>
              <p className="text-gray-700 text-sm mb-2">{review.comment}</p>
              <p className="text-xs text-gray-500">{formatDate(review.date)}</p>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-gray-900">Analytics Dashboard</h2>
          <p className="text-gray-600 mt-1">Monitor your property performance and earnings</p>
        </div>
        <Button onClick={fetchAnalytics} leftIcon={<Activity className="w-4 h-4" />}>
          Refresh Data
        </Button>
      </div>

      {/* Navigation Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {[
            { key: 'overview', label: 'Overview', icon: BarChart3 },
            { key: 'revenue', label: 'Revenue', icon: DollarSign },
            { key: 'properties', label: 'Properties', icon: Home },
            { key: 'guests', label: 'Guests', icon: Users },
          ].map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => setActiveView(key as any)}
              className={`flex items-center py-2 px-1 border-b-2 font-medium text-sm ${
                activeView === key
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <Icon className="w-4 h-4 mr-2" />
              {label}
            </button>
          ))}
        </nav>
      </div>

      {/* Content */}
      {activeView === 'overview' && renderOverview()}
      {activeView === 'revenue' && renderRevenue()}
      {activeView === 'properties' && renderProperties()}
      {activeView === 'guests' && renderGuests()}
    </div>
  );
};

export default AnalyticsDashboard; 