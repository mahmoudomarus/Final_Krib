import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Calendar, 
  MapPin, 
  Clock, 
  DollarSign, 
  Users, 
  Eye, 
  MessageCircle,
  Star,
  Filter,
  RefreshCw,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Home,
  Phone,
  Mail
} from 'lucide-react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { useAuth } from '../contexts/AuthContext';
import { apiService } from '../services/api';
import { formatDate, formatCurrency } from '../lib/utils';

interface Booking {
  id: string;
  checkIn: string;
  checkOut: string;
  guests: number;
  totalAmount: number;
  status: 'PENDING' | 'CONFIRMED' | 'CANCELLED' | 'COMPLETED';
  createdAt: string;
  property: {
    id: string;
    title: string;
    city: string;
    emirate: string;
    images: string[];
    basePrice: number;
    host: {
      id: string;
      firstName: string;
      lastName: string;
      avatar?: string;
      phone?: string;
      email: string;
    };
  };
  guest: {
    id: string;
    firstName: string;
    lastName: string;
    avatar?: string;
    phone?: string;
    email: string;
  };
  payments?: Array<{
    id: string;
    amount: number;
    status: string;
    type: string;
    dueDate?: string;
  }>;
}

const BookingsPage: React.FC = () => {
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'upcoming' | 'past' | 'cancelled'>('all');

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    fetchBookings();
  }, [isAuthenticated, navigate]);

  const fetchBookings = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Use direct fetch like ProfilePage does
      const token = localStorage.getItem('token');
      console.log('BookingsPage - Token from localStorage:', token ? 'Token exists' : 'No token found');
      console.log('BookingsPage - Token length:', token?.length);
      console.log('BookingsPage - Full token:', token);
      
      if (!token) {
        throw new Error('No authentication token found. Please log in again.');
      }
      
      const response = await fetch('/api/bookings', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      console.log('BookingsPage - Response status:', response.status);

      if (response.ok) {
        const result = await response.json();
        console.log('BookingsPage - Success, bookings count:', result.bookings?.length);
        setBookings(result.bookings || []);
      } else {
        const errorText = await response.text();
        console.log('BookingsPage - Error response:', errorText);
        if (response.status === 401) {
          throw new Error('Authentication failed. Please log in again.');
        }
        throw new Error(`HTTP error! status: ${response.status}`);
      }
    } catch (error) {
      console.error('Error fetching bookings:', error);
      setError(error instanceof Error ? error.message : 'Failed to load bookings. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      PENDING: { variant: 'warning' as const, label: 'Pending', icon: Clock },
      CONFIRMED: { variant: 'success' as const, label: 'Confirmed', icon: CheckCircle },
      CANCELLED: { variant: 'error' as const, label: 'Cancelled', icon: XCircle },
      COMPLETED: { variant: 'primary' as const, label: 'Completed', icon: CheckCircle },
    };
    
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.PENDING;
    const Icon = config.icon;
    
    return (
      <Badge variant={config.variant} className="flex items-center gap-1">
        <Icon className="w-3 h-3" />
        {config.label}
      </Badge>
    );
  };

  const getFilteredBookings = () => {
    const now = new Date();
    
    return bookings.filter(booking => {
      if (filter === 'all') return true;
      
      const checkIn = new Date(booking.checkIn);
      const checkOut = new Date(booking.checkOut);
      
      switch (filter) {
        case 'upcoming':
          return checkIn > now && booking.status !== 'CANCELLED';
        case 'past':
          return checkOut < now && booking.status === 'COMPLETED';
        case 'cancelled':
          return booking.status === 'CANCELLED';
        default:
          return true;
      }
    });
  };

  const calculateNights = (checkIn: string, checkOut: string) => {
    const start = new Date(checkIn);
    const end = new Date(checkOut);
    const diffTime = Math.abs(end.getTime() - start.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  if (!isAuthenticated) {
    return null; // Will redirect to login
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="container mx-auto px-4 py-8">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-32 bg-gray-200 rounded"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  const filteredBookings = getFilteredBookings();

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">My Bookings</h1>
            <p className="text-gray-600 mt-2">
              Manage your reservations and travel plans
            </p>
          </div>
          <div className="flex items-center space-x-3">
            <Button 
              variant="outline" 
              onClick={fetchBookings}
              disabled={loading}
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        </div>

        {/* Debug Section - Remove this after fixing */}
        <Card className="p-4 mb-6 bg-yellow-50 border-yellow-200">
          <h3 className="font-medium text-yellow-800 mb-2">Debug Info</h3>
          <div className="text-sm text-yellow-700 space-y-1">
            <p>User authenticated: {isAuthenticated ? 'Yes' : 'No'}</p>
            <p>User email: {user?.email || 'Not available'}</p>
            <p>Token in localStorage: {localStorage.getItem('token') ? 'Yes' : 'No'}</p>
            <p>Token length: {localStorage.getItem('token')?.length || 0}</p>
            <div className="flex space-x-2 mt-2">
              <Button 
                size="sm" 
                variant="outline"
                onClick={() => {
                  localStorage.removeItem('token');
                  window.location.reload();
                }}
              >
                Clear Token & Reload
              </Button>
              <Button 
                size="sm" 
                variant="outline"
                onClick={() => navigate('/login')}
              >
                Go to Login
              </Button>
            </div>
          </div>
        </Card>

        {/* Filter Tabs */}
        <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg mb-6 w-fit">
          {[
            { id: 'all', label: 'All Bookings' },
            { id: 'upcoming', label: 'Upcoming' },
            { id: 'past', label: 'Past' },
            { id: 'cancelled', label: 'Cancelled' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setFilter(tab.id as any)}
              className={`px-4 py-2 rounded-md font-medium transition-colors ${
                filter === tab.id
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Error State */}
        {error && (
          <Card className="p-6 mb-6 border-red-200 bg-red-50">
            <div className="flex items-center text-red-800">
              <AlertTriangle className="w-5 h-5 mr-2" />
              {error}
            </div>
          </Card>
        )}

        {/* Bookings List */}
        {filteredBookings.length === 0 ? (
          <Card className="p-12 text-center">
            <Calendar className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              {filter === 'all' ? 'No bookings yet' : `No ${filter} bookings`}
            </h3>
            <p className="text-gray-600 mb-6">
              {filter === 'all' 
                ? "You haven't made any bookings yet. Start exploring properties!"
                : `You don't have any ${filter} bookings.`
              }
            </p>
            {filter === 'all' && (
              <Button onClick={() => navigate('/search')}>
                Browse Properties
              </Button>
            )}
          </Card>
        ) : (
          <div className="space-y-6">
            {filteredBookings.map((booking) => (
              <Card key={booking.id} className="overflow-hidden">
                <div className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-start space-x-4">
                      {/* Property Image */}
                      <div className="w-24 h-24 bg-gray-200 rounded-lg overflow-hidden flex-shrink-0">
                        {booking.property.images && booking.property.images.length > 0 ? (
                          <img
                            src={booking.property.images[0]}
                            alt={booking.property.title}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Home className="w-8 h-8 text-gray-400" />
                          </div>
                        )}
                      </div>

                      {/* Booking Details */}
                      <div className="flex-1">
                        <div className="flex items-start justify-between">
                          <div>
                            <h3 className="text-lg font-semibold text-gray-900 mb-1">
                              {booking.property.title}
                            </h3>
                            <div className="flex items-center text-gray-600 text-sm mb-2">
                              <MapPin className="w-4 h-4 mr-1" />
                              {booking.property.city}, {booking.property.emirate}
                            </div>
                            <div className="flex items-center text-gray-600 text-sm">
                              <Users className="w-4 h-4 mr-1" />
                              {booking.guests} guest{booking.guests > 1 ? 's' : ''}
                            </div>
                          </div>
                          {getStatusBadge(booking.status)}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Booking Info Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4 p-4 bg-gray-50 rounded-lg">
                    <div>
                      <div className="text-sm text-gray-600 mb-1">Check-in</div>
                      <div className="font-medium">{formatDate(booking.checkIn)}</div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-600 mb-1">Check-out</div>
                      <div className="font-medium">{formatDate(booking.checkOut)}</div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-600 mb-1">Total Amount</div>
                      <div className="font-medium text-lg">
                        {formatCurrency(booking.totalAmount)}
                      </div>
                    </div>
                  </div>

                  {/* Host Info */}
                  <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg mb-4">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-blue-200 rounded-full flex items-center justify-center">
                        {booking.property.host.avatar ? (
                          <img
                            src={booking.property.host.avatar}
                            alt={`${booking.property.host.firstName} ${booking.property.host.lastName}`}
                            className="w-full h-full rounded-full object-cover"
                          />
                        ) : (
                          <Users className="w-5 h-5 text-blue-600" />
                        )}
                      </div>
                      <div>
                        <div className="font-medium text-gray-900">
                          Host: {booking.property.host.firstName} {booking.property.host.lastName}
                        </div>
                        <div className="text-sm text-gray-600">
                          {booking.property.host.email}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      {booking.property.host.phone && (
                        <Button variant="outline" size="sm">
                          <Phone className="w-4 h-4 mr-1" />
                          Call
                        </Button>
                      )}
                      <Button variant="outline" size="sm">
                        <MessageCircle className="w-4 h-4 mr-1" />
                        Message
                      </Button>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex items-center justify-between">
                    <div className="text-sm text-gray-500">
                      Booked on {formatDate(booking.createdAt)} • {calculateNights(booking.checkIn, booking.checkOut)} night{calculateNights(booking.checkIn, booking.checkOut) > 1 ? 's' : ''}
                    </div>
                    <div className="flex items-center space-x-3">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => navigate(`/properties/${booking.property.id}`)}
                      >
                        <Eye className="w-4 h-4 mr-1" />
                        View Property
                      </Button>
                      {booking.status === 'COMPLETED' && (
                        <Button variant="outline" size="sm">
                          <Star className="w-4 h-4 mr-1" />
                          Write Review
                        </Button>
                      )}
                      {booking.status === 'CONFIRMED' && new Date(booking.checkIn) > new Date() && (
                        <Button variant="outline" size="sm">
                          Modify Booking
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default BookingsPage; 