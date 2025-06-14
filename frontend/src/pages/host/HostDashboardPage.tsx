import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { 
  DollarSign, 
  Home, 
  Calendar, 
  Star, 
  BarChart3, 
  Download, 
  Eye, 
  Edit, 
  MessageSquare, 
  FileText, 
  Activity, 
  Check, 
  X, 
  Plus,
  Bell,
  CheckCircle,
  AlertCircle,
  Filter,
  MapPin,
  Trash2,
  TrendingUp,
  Settings,
  Users,
  Bed,
  Bath,
  User,
  Mail,
  Clock,
  Building,
  Phone,
  CreditCard
} from 'lucide-react';
import { Property, Booking, BookingStatus, PropertyStatus, RentalType } from '../../types';
import { formatCurrency, formatDate } from '../../lib/utils';
import { apiService } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import AnalyticsDashboard from '../../components/analytics/AnalyticsDashboard';

interface DashboardStats {
  totalProperties: number;
  totalBookings: number;
  totalEarnings: number;
  occupancyRate: number;
  averageRating: number;
  totalReviews: number;
  monthlyEarnings: number;
  yearlyEarnings: number;
  activeProperties: number;
  pendingBookings: number;
  responseRate: number;
}

const HostDashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');
  const [properties, setProperties] = useState<Property[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [reviews, setReviews] = useState<any[]>([]);
  const [analytics, setAnalytics] = useState<any>(null);
  const [payouts, setPayouts] = useState<any[]>([]);
  const [bankDetails, setBankDetails] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState<'week' | 'month' | 'year'>('month');
  const [payoutData, setPayoutData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-AE', {
      style: 'currency',
      currency: 'AED',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const fetchDashboardData = async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      console.log('Fetching real dashboard data for user:', user.id);
      
      // Fetch real properties for this authenticated host
      const propertiesResponse = await apiService.getProperties({ 
        hostId: user.id,
        limit: 50 
      }) as any;
      
      console.log('Properties response:', propertiesResponse);
      if (propertiesResponse && propertiesResponse.properties) {
        setProperties(propertiesResponse.properties);
      }

      // Fetch real bookings for this host
      try {
        const bookingsResponse = await apiService.getBookings({ 
          hostId: user.id 
        }) as any;
        
        console.log('Bookings response:', bookingsResponse);
        if (bookingsResponse && bookingsResponse.bookings) {
          setBookings(bookingsResponse.bookings);
        }
      } catch (bookingError) {
        console.error('Error fetching bookings:', bookingError);
      }

      // Fetch real reviews for this host
      try {
        const reviewsResponse = await apiService.getReviews({ 
          hostId: user.id,
          type: 'received',
          limit: 20
        }) as any;
        
        console.log('Reviews response:', reviewsResponse);
        if (reviewsResponse && reviewsResponse.reviews) {
          setReviews(reviewsResponse.reviews);
        }
      } catch (reviewError) {
        console.error('Error fetching reviews:', reviewError);
      }

    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchPayoutData = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No authentication token found');
      }

      const response = await fetch('/api/host/payouts', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch payout data');
      }

      const result = await response.json();
      if (result.success) {
        setPayoutData(result.data);
      } else {
        throw new Error(result.error || 'Failed to fetch payout data');
      }
    } catch (error) {
      console.error('Error fetching payout data:', error);
      setError('Failed to load payout information');
    }
  };

  const calculateStats = (): DashboardStats => {
    const totalProperties = properties.length;
    const activeProperties = properties.filter(p => p.status === PropertyStatus.ACTIVE).length;
    const totalBookings = bookings.length;
    const pendingBookings = bookings.filter(b => b.status === BookingStatus.PENDING).length;
    const confirmedBookings = bookings.filter(b => b.status === BookingStatus.CONFIRMED).length;
    
    // Calculate total earnings from confirmed bookings
    const totalEarnings = bookings
      .filter(b => b.status === BookingStatus.CONFIRMED)
      .reduce((sum, booking) => {
        return sum + (booking.totalPrice || 0);
      }, 0);

    // Calculate average rating from reviews
    const averageRating = reviews.length > 0 
      ? reviews.reduce((sum, review) => sum + (review.ratingOverall || 0), 0) / reviews.length 
      : 0;

    // Calculate occupancy rate (simplified)
    const occupancyRate = totalProperties > 0 
      ? Math.round((confirmedBookings / (totalProperties * 30)) * 100) // Rough calculation
      : 0;

    return {
      totalProperties,
      totalBookings,
      totalEarnings,
      occupancyRate: Math.min(occupancyRate, 100), // Cap at 100%
      averageRating: parseFloat(averageRating.toFixed(1)),
      totalReviews: reviews.length,
      monthlyEarnings: totalEarnings, // Simplified
      yearlyEarnings: totalEarnings, // Simplified
      activeProperties,
      pendingBookings,
      responseRate: 95, // Placeholder
    };
  };

  const stats = calculateStats();

  const getStatusBadge = (status: PropertyStatus | BookingStatus | string) => {
    const statusConfig: Record<string, { variant: 'success' | 'secondary' | 'warning' | 'error' | 'primary', label: string }> = {
      'ACTIVE': { variant: 'success', label: 'Active' },
      'INACTIVE': { variant: 'secondary', label: 'Inactive' },
      'PENDING_REVIEW': { variant: 'warning', label: 'Pending Review' },
      'SUSPENDED': { variant: 'error', label: 'Suspended' },
      'DRAFT': { variant: 'secondary', label: 'Draft' },
      'CONFIRMED': { variant: 'success', label: 'Confirmed' },
      'PENDING': { variant: 'warning', label: 'Pending' },
      'CANCELLED_GUEST': { variant: 'secondary', label: 'Cancelled' },
      'CANCELLED_HOST': { variant: 'secondary', label: 'Cancelled by Host' },
      'COMPLETED': { variant: 'primary', label: 'Completed' },
      'REJECTED': { variant: 'error', label: 'Rejected' },
      'active': { variant: 'success', label: 'Active' },
      'inactive': { variant: 'secondary', label: 'Inactive' },
      'pending': { variant: 'warning', label: 'Pending' },
      'confirmed': { variant: 'success', label: 'Confirmed' },
      'cancelled': { variant: 'secondary', label: 'Cancelled' },
      'completed': { variant: 'primary', label: 'Completed' },
      'rejected': { variant: 'error', label: 'Rejected' },
    };

    const statusKey = String(status || '').toUpperCase();
    const config = statusConfig[statusKey] || statusConfig[String(status || '')];
    
    if (!config) {
      console.warn('Unknown status:', status);
      return <Badge variant="secondary">{String(status || 'Unknown')}</Badge>;
    }
    
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  useEffect(() => {
    fetchDashboardData();
    fetchPayoutData();
  }, [user]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  const sidebarItems = [
    { id: 'overview', label: 'Overview', icon: BarChart3 },
    { id: 'properties', label: 'Properties', icon: Home },
    { id: 'bookings', label: 'Bookings', icon: Calendar },
    { id: 'earnings', label: 'Earnings', icon: DollarSign },
    { id: 'reviews', label: 'Reviews', icon: Star },
    { id: 'analytics', label: 'Analytics', icon: TrendingUp },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  const renderOverview = () => (
    <div className="space-y-6">
      {/* Welcome Header */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-xl p-6 text-white">
        <h2 className="text-2xl font-bold mb-2">Welcome back, {user?.first_name}!</h2>
        <p className="text-blue-100">Here's what's happening with your properties today.</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card padding="lg" className="bg-white border border-gray-200 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Properties</p>
              <p className="text-3xl font-bold text-gray-900">{stats.totalProperties}</p>
              <p className="text-sm text-green-600 mt-1">
                <span className="inline-flex items-center">
                  <TrendingUp className="w-4 h-4 mr-1" />
                  {stats.activeProperties} active
                </span>
              </p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <Home className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </Card>

        <Card padding="lg" className="bg-white border border-gray-200 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Bookings</p>
              <p className="text-3xl font-bold text-gray-900">{stats.totalBookings}</p>
              <p className="text-sm text-yellow-600 mt-1">
                <span className="inline-flex items-center">
                  <Clock className="w-4 h-4 mr-1" />
                  {stats.pendingBookings} pending
                </span>
              </p>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <Calendar className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </Card>

        <Card padding="lg" className="bg-white border border-gray-200 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Earnings</p>
              <p className="text-3xl font-bold text-gray-900">{formatCurrency(stats.totalEarnings)}</p>
              <p className="text-sm text-green-600 mt-1">
                <span className="inline-flex items-center">
                  <TrendingUp className="w-4 h-4 mr-1" />
                  +12% this month
                </span>
              </p>
            </div>
            <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
              <DollarSign className="w-6 h-6 text-yellow-600" />
            </div>
          </div>
        </Card>

        <Card padding="lg" className="bg-white border border-gray-200 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Average Rating</p>
              <p className="text-3xl font-bold text-gray-900">{stats.averageRating.toFixed(1)}</p>
              <p className="text-sm text-blue-600 mt-1">
                <span className="inline-flex items-center">
                  <Star className="w-4 h-4 mr-1" />
                  {stats.totalReviews} reviews
                </span>
              </p>
            </div>
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
              <Star className="w-6 h-6 text-purple-600" />
            </div>
          </div>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card padding="lg" className="bg-white border border-gray-200">
        <h3 className="text-lg font-semibold mb-4">Quick Actions</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Button 
            variant="outline" 
            className="h-20 flex-col space-y-2 hover:bg-blue-50 hover:border-blue-200" 
            onClick={() => navigate('/host/properties/new')}
          >
            <Plus className="w-8 h-8 text-blue-600" />
            <span className="font-medium">Add New Property</span>
          </Button>
          <Button 
            variant="outline" 
            className="h-20 flex-col space-y-2 hover:bg-green-50 hover:border-green-200"
            onClick={() => navigate('/host/calendar')}
          >
            <Calendar className="w-8 h-8 text-green-600" />
            <span className="font-medium">Manage Calendar</span>
          </Button>
          <Button 
            variant="outline" 
            className="h-20 flex-col space-y-2 hover:bg-purple-50 hover:border-purple-200"
            onClick={() => navigate('/host/messages')}
          >
            <MessageSquare className="w-8 h-8 text-purple-600" />
            <span className="font-medium">View Messages</span>
          </Button>
        </div>
      </Card>

      {/* Recent Activity */}
      <Card padding="lg" className="bg-white border border-gray-200">
        <h3 className="text-lg font-semibold mb-4">Recent Activity</h3>
        <div className="space-y-4">
          {bookings.slice(0, 3).map((booking) => {
            const property = properties.find(p => p.id === booking.propertyId);
            return (
              <div key={booking.id} className="flex items-center space-x-4 p-4 bg-gray-50 rounded-lg border border-gray-100">
                <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                </div>
                <div className="flex-1">
                  <p className="font-medium text-gray-900">
                    {booking.status === BookingStatus.CONFIRMED ? 'New booking confirmed' : 'Booking request pending'}
                  </p>
                  <p className="text-sm text-gray-600">
                    {property?.title} - {booking.guest?.firstName} {booking.guest?.lastName}
                  </p>
                </div>
                <span className="text-sm text-gray-500">{formatDate(booking.createdAt)}</span>
              </div>
            );
          })}
          {bookings.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              <p>No recent activity</p>
            </div>
          )}
        </div>
      </Card>
    </div>
  );

  const renderProperties = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">My Properties</h2>
        <div className="flex items-center space-x-3">
          <Button variant="outline" leftIcon={<Filter className="w-4 h-4" />}>
            Filter
          </Button>
          <Button variant="primary" leftIcon={<Plus className="w-4 h-4" />} onClick={() => navigate('/host/properties/new')}>
            Add Property
          </Button>
        </div>
      </div>

      {properties.length === 0 ? (
        <Card padding="lg" className="text-center bg-white border border-gray-200">
          <Building className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No properties yet</h3>
          <p className="text-gray-600 mb-6">Start by adding your first property to begin hosting.</p>
          <Button 
            variant="primary" 
            leftIcon={<Plus className="w-4 h-4" />}
            onClick={() => navigate('/host/properties/new')}
          >
            Add Your First Property
          </Button>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {properties.map((property) => (
            <Card key={property.id} padding="none" className="bg-white border border-gray-200 hover:shadow-lg transition-shadow overflow-hidden">
              <div className="aspect-video bg-gray-200 overflow-hidden">
                <img
                  src={property.images?.[0]?.url || '/placeholder-property.jpg'}
                  alt={property.title}
                  className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = '/placeholder-property.jpg';
                  }}
                />
              </div>
              
              <div className="p-6 space-y-4">
                <div className="flex items-start justify-between">
                  <h3 className="font-semibold text-lg text-gray-900 line-clamp-2">{property.title}</h3>
                  {getStatusBadge(property.status)}
                </div>
                
                <div className="flex items-center text-gray-600 text-sm">
                  <MapPin className="w-4 h-4 mr-1" />
                  <span>{property.city}, {property.emirate}</span>
                </div>
                
                <div className="flex items-center space-x-4 text-sm text-gray-600">
                  <span className="flex items-center">
                    <Bed className="w-4 h-4 mr-1" />
                    {property.bedrooms} bed
                  </span>
                  <span className="flex items-center">
                    <Bath className="w-4 h-4 mr-1" />
                    {property.bathrooms} bath
                  </span>
                  <span className="flex items-center">
                    <User className="w-4 h-4 mr-1" />
                    {property.maxGuests} guests
                  </span>
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-1">
                    <Star className="w-4 h-4 text-yellow-500 fill-current" />
                    <span className="text-sm font-medium">
                      {property.rating ? `${property.rating} (${property.reviewCount})` : 'New'}
                    </span>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold text-gray-900">
                      {formatCurrency(property.pricing?.basePrice || 0)}
                    </p>
                    <p className="text-sm text-gray-600">
                      /{property.pricing?.priceUnit === 'NIGHT' ? 'night' : 'month'}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-2 pt-2">
                  <Button
                    size="sm"
                    variant="outline"
                    leftIcon={<Eye className="w-4 h-4" />}
                    onClick={() => navigate(`/property/${property.id}`)}
                    className="flex-1"
                  >
                    View
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    leftIcon={<Edit className="w-4 h-4" />}
                    onClick={() => navigate(`/host/properties/${property.id}/edit`)}
                    className="flex-1"
                  >
                    Edit
                  </Button>
                </div>
                
                <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-100">
                  <div className="text-center">
                    <p className="text-sm text-gray-600">Bookings</p>
                    <p className="font-semibold text-gray-900">{property.bookingCount || 0}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-sm text-gray-600">Revenue</p>
                    <p className="font-semibold text-gray-900">{formatCurrency(property.pricing?.basePrice || 0)}</p>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );

  const renderBookings = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">Bookings</h2>
        <div className="flex items-center space-x-3">
          <Button variant="outline" leftIcon={<Filter className="w-4 h-4" />}>
            Filter
          </Button>
          <Button variant="outline" leftIcon={<Download className="w-4 h-4" />}>
            Export
          </Button>
        </div>
      </div>

      {bookings.length === 0 ? (
        <Card padding="lg" className="text-center bg-white border border-gray-200">
          <Calendar className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No bookings yet</h3>
          <p className="text-gray-600 mb-6">When guests book your properties, their reservations will appear here.</p>
          <Button 
            variant="primary" 
            leftIcon={<Plus className="w-4 h-4" />}
            onClick={() => navigate('/host/properties/new')}
          >
            Add More Properties
          </Button>
        </Card>
      ) : (
        <div className="space-y-4">
          {bookings.map((booking) => {
            const property = properties.find(p => p.id === booking.propertyId);
            return (
              <Card key={booking.id} padding="lg" className="bg-white border border-gray-200 hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="w-16 h-16 bg-gray-200 rounded-lg overflow-hidden">
                      <img
                        src={property?.images?.[0]?.url || '/placeholder-property.jpg'}
                        alt={property?.title}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">{property?.title}</h3>
                      <div className="flex items-center space-x-4 text-sm text-gray-600 mt-1">
                        <span className="flex items-center">
                          <User className="w-4 h-4 mr-1" />
                          {booking.guest?.firstName} {booking.guest?.lastName}
                        </span>
                        <span className="flex items-center">
                          <Mail className="w-4 h-4 mr-1" />
                          {booking.guest?.email}
                        </span>
                        <span className="flex items-center">
                          <Users className="w-4 h-4 mr-1" />
                          {booking.guests} guests
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    {getStatusBadge(booking.status)}
                    <p className="text-lg font-bold text-gray-900 mt-2">
                      {formatCurrency(booking.totalPrice)}
                    </p>
                    <p className="text-sm text-gray-600">
                      {booking.checkIn?.toLocaleDateString()} - {booking.checkOut?.toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );

  const renderEarnings = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">Earnings & Payouts</h2>
        <div className="flex items-center space-x-4">
          <select
            value={selectedPeriod}
            onChange={(e) => setSelectedPeriod(e.target.value as any)}
            className="px-3 py-2 border border-gray-300 rounded-lg"
          >
            <option value="week">This Week</option>
            <option value="month">This Month</option>
            <option value="year">This Year</option>
          </select>
          <Button variant="outline" leftIcon={<Download className="w-4 h-4" />}>
            Export Report
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-2">Loading payout data...</span>
        </div>
      ) : error ? (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-600">{error}</p>
          <Button 
            variant="outline" 
            size="sm" 
            className="mt-2"
            onClick={fetchPayoutData}
          >
            Retry
          </Button>
        </div>
      ) : payoutData ? (
        <>
          {/* Payout Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <Card padding="lg">
              <h3 className="text-lg font-semibold mb-2">Available Balance</h3>
              <p className="text-3xl font-bold text-green-600">{formatCurrency(payoutData.financial_summary.available_balance)}</p>
              <p className="text-sm text-gray-600 mt-1">Ready for payout</p>
            </Card>
            <Card padding="lg">
              <h3 className="text-lg font-semibold mb-2">Pending Payout</h3>
              <p className="text-3xl font-bold text-yellow-600">{formatCurrency(payoutData.financial_summary.pending_payout)}</p>
              <p className="text-sm text-gray-600 mt-1">Processing (3-5 days)</p>
            </Card>
            <Card padding="lg">
              <h3 className="text-lg font-semibold mb-2">Total Paid Out</h3>
              <p className="text-3xl font-bold text-blue-600">{formatCurrency(payoutData.financial_summary.total_paid_out)}</p>
              <p className="text-sm text-gray-600 mt-1">This year</p>
            </Card>
            <Card padding="lg">
              <h3 className="text-lg font-semibold mb-2">Platform Fees</h3>
              <p className="text-3xl font-bold text-gray-600">{formatCurrency(payoutData.financial_summary.platform_fees)}</p>
              <p className="text-sm text-gray-600 mt-1">10% service fee</p>
            </Card>
          </div>

          {/* Bank Details Section */}
          <Card padding="lg">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Bank Details</h3>
              <Button variant="outline" size="sm">
                {payoutData.bank_details ? 'Update' : 'Add'} Bank Account
              </Button>
            </div>
            
            {payoutData.bank_details ? (
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600">Bank Name</p>
                    <p className="font-medium">{payoutData.bank_details.bankName}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Account Number</p>
                    <p className="font-medium">****{payoutData.bank_details.accountNumber?.slice(-4)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">IBAN</p>
                    <p className="font-medium">{payoutData.bank_details.iban}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Account Holder</p>
                    <p className="font-medium">{payoutData.bank_details.accountHolder}</p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-8 bg-gray-50 rounded-lg">
                <DollarSign className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h4 className="text-lg font-medium text-gray-900 mb-2">Add Your Bank Details</h4>
                <p className="text-gray-600 mb-4">Add your bank account to receive payouts from your bookings.</p>
                <Button variant="primary">Add Bank Account</Button>
              </div>
            )}
          </Card>

          {/* Payout History */}
          <Card padding="lg">
            <h3 className="text-lg font-semibold mb-4">Payout History</h3>
            {payoutData.payout_history && payoutData.payout_history.length > 0 ? (
              <div className="space-y-4">
                {payoutData.payout_history.map((payout: any) => (
                  <div key={payout.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-4">
                      <div className={`w-3 h-3 rounded-full ${
                        payout.status === 'COMPLETED' ? 'bg-green-500' : 
                        payout.status === 'PROCESSING' ? 'bg-yellow-500' : 'bg-gray-400'
                      }`}></div>
                      <div>
                        <p className="font-medium">{payout.description}</p>
                        <p className="text-sm text-gray-600">
                          {payout.status === 'COMPLETED' ? 'Paid on' : 'Expected'} {formatDate(payout.processed_at || payout.expected_date)}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold">{formatCurrency(payout.amount)}</p>
                      <p className="text-sm text-gray-600 capitalize">{payout.status.toLowerCase()}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-gray-600">No payout history available</p>
              </div>
            )}
          </Card>

          {/* Tax Information */}
          <Card padding="lg">
            <h3 className="text-lg font-semibold mb-4">Tax Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <p className="text-sm text-gray-600">Total Income (2024)</p>
                <p className="text-2xl font-bold">{formatCurrency(payoutData.financial_summary.total_earnings)}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Platform Fees Paid</p>
                <p className="text-2xl font-bold">{formatCurrency(payoutData.financial_summary.platform_fees)}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Net Earnings</p>
                <p className="text-2xl font-bold">{formatCurrency(payoutData.financial_summary.total_earnings - payoutData.financial_summary.platform_fees)}</p>
              </div>
            </div>
            <div className="mt-4 p-4 bg-blue-50 rounded-lg">
              <p className="text-sm text-blue-800">
                <strong>Tax Reminder:</strong> Please consult with a tax professional regarding your rental income obligations in the UAE.
              </p>
            </div>
          </Card>
        </>
      ) : (
        <div className="text-center py-8">
          <p className="text-gray-600">No payout data available</p>
        </div>
      )}
    </div>
  );

  const renderReviews = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">Reviews</h2>
        <div className="flex items-center space-x-4">
          <Button variant="outline" leftIcon={<Filter className="w-4 h-4" />}>
            Filter
          </Button>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card padding="lg">
          <h3 className="text-lg font-semibold mb-2">Overall Rating</h3>
          <div className="flex items-center space-x-2">
            <span className="text-3xl font-bold">{stats.averageRating > 0 ? stats.averageRating.toFixed(1) : 'N/A'}</span>
            <Star className="w-8 h-8 text-yellow-500" />
          </div>
          <p className="text-sm text-gray-600 mt-1">Based on {reviews.length} reviews</p>
        </Card>
        <Card padding="lg">
          <h3 className="text-lg font-semibold mb-2">Response Rate</h3>
          <p className="text-3xl font-bold text-blue-600">{stats.responseRate}%</p>
          <p className="text-sm text-gray-600 mt-1">Average response time: 2 hours</p>
        </Card>
        <Card padding="lg">
          <h3 className="text-lg font-semibold mb-2">Recent Reviews</h3>
          <p className="text-3xl font-bold text-green-600">{reviews.length}</p>
          <p className="text-sm text-gray-600 mt-1">Total reviews received</p>
        </Card>
      </div>

      <Card padding="lg">
        <h3 className="text-lg font-semibold mb-4">Recent Reviews</h3>
        {loading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto"></div>
            <p className="mt-2 text-gray-600">Loading reviews...</p>
          </div>
        ) : reviews.length === 0 ? (
          <div className="text-center py-8">
            <Star className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h4 className="text-lg font-medium text-gray-900 mb-2">No reviews yet</h4>
            <p className="text-gray-600">Reviews from your guests will appear here after they check out.</p>
          </div>
        ) : (
          <div className="space-y-6">
            {reviews.slice(0, 5).map((review, index) => {
              const property = properties.find(p => p.id === review.propertyId);
              
              return (
                <div key={review.id || index} className="border-b border-gray-200 pb-4 last:border-b-0">
                  <div className="flex items-start space-x-4">
                    <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center">
                      <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                        <Star className="w-4 h-4 text-blue-600" />
                      </div>
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <h4 className="font-semibold">{review.guestName || 'Anonymous Guest'}</h4>
                        <div className="flex items-center space-x-1">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <Star 
                              key={star} 
                              className={`w-4 h-4 ${
                                star <= review.overallRating 
                                  ? 'text-yellow-500 fill-current' 
                                  : 'text-gray-300'
                              }`} 
                            />
                          ))}
                          <span className="ml-1 text-sm font-medium">{review.overallRating}</span>
                        </div>
                      </div>
                      <p className="text-gray-600 mt-2">
                        {review.comment || 'No comment provided.'}
                      </p>
                      <p className="text-sm text-gray-500 mt-2">
                        {property ? property.title : 'Property'} • {formatDate(review.createdAt)}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
            
            {reviews.length > 5 && (
              <div className="text-center pt-4">
                <Button variant="outline">
                  View All {reviews.length} Reviews
                </Button>
              </div>
            )}
          </div>
        )}
      </Card>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <div className="w-64 bg-white border-r border-gray-200 flex flex-col">
        <div className="p-6 border-b border-gray-200">
          <h1 className="text-xl font-bold text-gray-900">Host Dashboard</h1>
          <p className="text-sm text-gray-600 mt-1">Welcome back, {user?.first_name}</p>
        </div>
        
        <nav className="flex-1 p-4">
          <ul className="space-y-2">
            {sidebarItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <li key={item.id}>
                  <button
                    onClick={() => setActiveTab(item.id)}
                    className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-left transition-colors ${
                      isActive
                        ? 'bg-blue-50 text-blue-700 border border-blue-200'
                        : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
                    }`}
                  >
                    <Icon className={`w-5 h-5 ${isActive ? 'text-blue-600' : 'text-gray-500'}`} />
                    <span className="font-medium">{item.label}</span>
                  </button>
                </li>
              );
            })}
          </ul>
        </nav>
        
        <div className="p-4 border-t border-gray-200">
          <Button
            variant="outline"
            leftIcon={<Bell className="w-4 h-4" />}
            onClick={() => navigate('/host/notifications')}
            className="w-full"
          >
            Notifications
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-auto">
        <div className="p-8">
          {activeTab === 'overview' && renderOverview()}
          {activeTab === 'properties' && renderProperties()}
          {activeTab === 'bookings' && renderBookings()}
          {activeTab === 'earnings' && renderEarnings()}
          {activeTab === 'reviews' && renderReviews()}
          {activeTab === 'analytics' && <AnalyticsDashboard />}
          {activeTab === 'settings' && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-gray-900">Settings</h2>
              <Card padding="lg">
                <h3 className="text-lg font-semibold mb-4">Account Settings</h3>
                <p className="text-gray-600">Manage your account preferences and settings.</p>
                <div className="mt-4">
                  <Button variant="outline" onClick={() => navigate('/profile')}>
                    Edit Profile
                  </Button>
                </div>
              </Card>
              <Card padding="lg">
                <h3 className="text-lg font-semibold mb-4">Notification Preferences</h3>
                <p className="text-gray-600">Control how you receive notifications about bookings and messages.</p>
                <div className="mt-4">
                  <Button variant="outline" onClick={() => navigate('/settings/notifications')}>
                    Manage Notifications
                  </Button>
                </div>
              </Card>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default HostDashboardPage; 