import React, { useState, useEffect } from 'react';
import { 
  Calendar, 
  MapPin, 
  Clock, 
  DollarSign, 
  Users, 
  Eye, 
  Edit, 
  CheckCircle, 
  XCircle, 
  AlertTriangle, 
  Filter, 
  RefreshCw, 
  Plus, 
  MoreHorizontal,
  Star,
  TrendingUp,
  Home,
  Phone,
  Mail,
  Search,
  Download,
  Upload,
  Shield,
  FileText,
  CreditCard,
  MessageSquare
} from 'lucide-react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { apiService } from '../../services/api';
import { formatDate, formatCurrency } from '../../lib/utils';

interface Booking {
  id: string;
  confirmation_code: string;
  status: 'PENDING' | 'CONFIRMED' | 'CANCELLED' | 'COMPLETED' | 'DISPUTED';
  booking_type: 'SHORT_TERM' | 'LONG_TERM';
  check_in_date: string;
  check_out_date: string;
  total_amount: number;
  guest_count: number;
  special_requests?: string;
  created_at: string;
  updated_at: string;
  duration?: number;
  status_info?: {
    color: string;
    label: string;
  };
  guest?: {
    id: string;
    first_name: string;
    last_name: string;
    email: string;
    phone?: string;
  };
  host?: {
    id: string;
    first_name: string;
    last_name: string;
    email: string;
    phone?: string;
  };
  property?: {
    id: string;
    title: string;
    property_type: string;
    city: string;
    emirate: string;
    area: string;
  };
  emergency_status?: string;
  dispute_resolved?: boolean;
  refund_amount?: number;
}

interface BookingStats {
  total: number;
  confirmed: number;
  pending: number;
  cancelled: number;
  completed: number;
  disputed: number;
  todayBookings: number;
  monthlyRevenue: number;
  shortTerm: number;
  longTerm: number;
}

interface BookingsResponse {
  bookings: Booking[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  stats: BookingStats;
}

const BookingsManagement: React.FC = () => {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [stats, setStats] = useState<BookingStats | null>(null);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0
  });
  const [loading, setLoading] = useState(true);
  const [selectedBookings, setSelectedBookings] = useState<string[]>([]);
  const [filters, setFilters] = useState({
    status: '',
    type: '',
    search: '',
    sortBy: 'created_at',
    sortOrder: 'desc'
  });
  const [showFilters, setShowFilters] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [showDisputeModal, setShowDisputeModal] = useState(false);
  const [showEmergencyModal, setShowEmergencyModal] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    fetchBookings();
  }, [pagination.page, filters]);

  const fetchBookings = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
        ...(filters.status && { status: filters.status }),
        ...(filters.type && { type: filters.type }),
        ...(filters.search && { search: filters.search }),
        sortBy: filters.sortBy,
        sortOrder: filters.sortOrder
      });

      const response = await apiService.get(`/super-admin/bookings?${params}`) as { data: BookingsResponse };
      const data: BookingsResponse = response.data;
      
      setBookings(data.bookings);
      setStats(data.stats);
      setPagination(data.pagination);
    } catch (error) {
      console.error('Error fetching bookings:', error);
      // Set empty state for graceful handling
      setBookings([]);
      setStats({
        total: 0,
        confirmed: 0,
        pending: 0,
        cancelled: 0,
        completed: 0,
        disputed: 0,
        todayBookings: 0,
        monthlyRevenue: 0,
        shortTerm: 0,
        longTerm: 0
      });
    } finally {
      setLoading(false);
    }
  };

  const handleBookingAction = async (action: string, bookingId: string, data?: any) => {
    try {
      setActionLoading(true);
      let endpoint = '';
      let method = 'POST';
      
      switch (action) {
        case 'confirm':
          endpoint = `/super-admin/bookings/${bookingId}/status`;
          method = 'PUT';
          data = { status: 'CONFIRMED', reason: 'Booking confirmed by admin' };
          break;
        case 'cancel':
          endpoint = `/super-admin/bookings/${bookingId}/status`;
          method = 'PUT';
          data = { status: 'CANCELLED', reason: data?.reason || 'Booking cancelled by admin', refund_amount: data?.refund_amount };
          break;
        case 'complete':
          endpoint = `/super-admin/bookings/${bookingId}/status`;
          method = 'PUT';
          data = { status: 'COMPLETED', reason: 'Booking completed by admin' };
          break;
        case 'dispute':
          endpoint = `/super-admin/bookings/${bookingId}/dispute`;
          method = 'POST';
          break;
        case 'emergency':
          endpoint = `/super-admin/bookings/${bookingId}/emergency`;
          method = 'POST';
          break;
      }
      
      if (method === 'PUT') {
        await apiService.put(endpoint, data);
      } else {
        await apiService.post(endpoint, data);
      }
      
      await fetchBookings(); // Refresh the list
      setShowStatusModal(false);
      setShowDisputeModal(false);
      setShowEmergencyModal(false);
      setSelectedBooking(null);
    } catch (error) {
      console.error(`Error performing ${action}:`, error);
    } finally {
      setActionLoading(false);
    }
  };

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'CONFIRMED': return 'success';
      case 'PENDING': return 'warning';
      case 'CANCELLED': return 'error';
      case 'COMPLETED': return 'success';
      case 'DISPUTED': return 'error';
      default: return 'gray';
    }
  };

  const getBookingTypeBadge = (type: string) => {
    return type === 'SHORT_TERM' 
      ? { label: 'Short Term', color: 'blue' }
      : { label: 'Long Term', color: 'green' };
  };

  const formatGuestName = (booking: Booking) => {
    if (!booking.guest) return 'Unknown Guest';
    return `${booking.guest.first_name} ${booking.guest.last_name}`.trim() || booking.guest.email.split('@')[0];
  };

  const formatHostName = (booking: Booking) => {
    if (!booking.host) return 'Unknown Host';
    return `${booking.host.first_name} ${booking.host.last_name}`.trim() || booking.host.email.split('@')[0];
  };

  const formatPropertyLocation = (booking: Booking) => {
    if (!booking.property) return 'Unknown Location';
    return `${booking.property.area}, ${booking.property.city}`;
  };

  const formatDuration = (booking: Booking) => {
    if (!booking.duration) return 'N/A';
    return booking.duration === 1 ? '1 day' : `${booking.duration} days`;
  };

  const handleBulkAction = async (action: string) => {
    if (selectedBookings.length === 0) return;
    
    try {
      setActionLoading(true);
      
      // Perform bulk action for all selected bookings
      const promises = selectedBookings.map(bookingId => 
        handleBookingAction(action, bookingId)
      );
      
      await Promise.all(promises);
      setSelectedBookings([]);
    } catch (error) {
      console.error('Error performing bulk action:', error);
    } finally {
      setActionLoading(false);
    }
  };

  if (loading && bookings.length === 0) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-16 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Booking Management</h2>
          <p className="text-gray-600">Manage bookings, resolve disputes, and handle emergencies</p>
        </div>
        <div className="flex items-center space-x-3">
          <Button onClick={() => setShowFilters(!showFilters)} variant="outline">
            <Filter className="w-4 h-4 mr-2" />
            Filters
          </Button>
          <Button onClick={fetchBookings} variant="outline">
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button variant="outline">
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 xl:grid-cols-10 gap-4">
          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Bookings</p>
                <p className="text-2xl font-bold">{stats.total}</p>
              </div>
              <Calendar className="w-8 h-8 text-blue-500" />
            </div>
          </Card>
          
          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Confirmed</p>
                <p className="text-2xl font-bold text-green-600">{stats.confirmed}</p>
              </div>
              <CheckCircle className="w-8 h-8 text-green-500" />
            </div>
          </Card>
          
          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Pending</p>
                <p className="text-2xl font-bold text-yellow-600">{stats.pending}</p>
              </div>
              <Clock className="w-8 h-8 text-yellow-500" />
            </div>
          </Card>
          
          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Cancelled</p>
                <p className="text-2xl font-bold text-red-600">{stats.cancelled}</p>
              </div>
              <XCircle className="w-8 h-8 text-red-500" />
            </div>
          </Card>
          
          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Completed</p>
                <p className="text-2xl font-bold text-blue-600">{stats.completed}</p>
              </div>
              <CheckCircle className="w-8 h-8 text-blue-500" />
            </div>
          </Card>
          
          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Disputed</p>
                <p className="text-2xl font-bold text-red-600">{stats.disputed}</p>
              </div>
              <AlertTriangle className="w-8 h-8 text-red-500" />
            </div>
          </Card>
          
          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Today</p>
                <p className="text-2xl font-bold">{stats.todayBookings}</p>
              </div>
              <Calendar className="w-8 h-8 text-purple-500" />
            </div>
          </Card>
          
          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Revenue</p>
                <p className="text-2xl font-bold">{formatCurrency(stats.monthlyRevenue)}</p>
              </div>
              <DollarSign className="w-8 h-8 text-green-500" />
            </div>
          </Card>
          
          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Short Term</p>
                <p className="text-2xl font-bold">{stats.shortTerm}</p>
              </div>
              <Clock className="w-8 h-8 text-blue-500" />
            </div>
          </Card>
          
          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Long Term</p>
                <p className="text-2xl font-bold">{stats.longTerm}</p>
              </div>
              <Home className="w-8 h-8 text-green-500" />
            </div>
          </Card>
        </div>
      )}

      {/* Empty State */}
      {!loading && bookings.length === 0 && (
        <Card className="p-12">
          <div className="text-center">
            <Calendar className="w-16 h-16 mx-auto mb-4 text-gray-300" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Bookings Found</h3>
            <p className="text-gray-600 mb-6">There are no bookings in the system yet.</p>
            <div className="flex items-center justify-center space-x-4">
              <Button variant="outline">
                <Shield className="w-4 h-4 mr-2" />
                View Disputes
              </Button>
              <Button variant="outline">
                <AlertTriangle className="w-4 h-4 mr-2" />
                Emergency Center
              </Button>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Add Test Booking
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* Bookings exist - show filters and table */}
      {bookings.length > 0 && (
        <>
          {/* Filters */}
          {showFilters && (
            <Card className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                  <select
                    value={filters.status}
                    onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">All Statuses</option>
                    <option value="PENDING">Pending</option>
                    <option value="CONFIRMED">Confirmed</option>
                    <option value="CANCELLED">Cancelled</option>
                    <option value="COMPLETED">Completed</option>
                    <option value="DISPUTED">Disputed</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Booking Type</label>
                  <select
                    value={filters.type}
                    onChange={(e) => setFilters({ ...filters, type: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">All Types</option>
                    <option value="SHORT_TERM">Short Term</option>
                    <option value="LONG_TERM">Long Term</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Sort By</label>
                  <select
                    value={filters.sortBy}
                    onChange={(e) => setFilters({ ...filters, sortBy: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="created_at">Created Date</option>
                    <option value="check_in_date">Check-in Date</option>
                    <option value="total_amount">Amount</option>
                    <option value="status">Status</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Search</label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <input
                      type="text"
                      value={filters.search}
                      onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                      placeholder="Search confirmation code..."
                      className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>
              </div>
            </Card>
          )}

          {/* Bulk Actions */}
          {selectedBookings.length > 0 && (
            <Card className="p-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">
                  {selectedBookings.length} booking(s) selected
                </span>
                <div className="flex items-center space-x-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleBulkAction('confirm')}
                    disabled={actionLoading}
                  >
                    <CheckCircle className="w-4 h-4 mr-1" />
                    Confirm All
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleBulkAction('cancel')}
                    disabled={actionLoading}
                  >
                    <XCircle className="w-4 h-4 mr-1" />
                    Cancel All
                  </Button>
                </div>
              </div>
            </Card>
          )}

          {/* Bookings Table */}
          <Card className="overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium text-gray-900">
                  Bookings ({pagination.total})
                </h3>
              </div>
            </div>
            
            <div className="text-center py-12">
              <Calendar className="w-16 h-16 mx-auto mb-4 text-gray-300" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Bookings System Ready</h3>
              <p className="text-gray-600 mb-6">The booking management system is set up and ready for bookings to be added.</p>
              <div className="flex items-center justify-center space-x-4">
                <Button variant="outline">
                  <Shield className="w-4 h-4 mr-2" />
                  View Disputes
                </Button>
                <Button variant="outline">
                  <AlertTriangle className="w-4 h-4 mr-2" />
                  Emergency Center
                </Button>
              </div>
            </div>
          </Card>
        </>
      )}

      {/* Status Change Modal */}
      {showStatusModal && selectedBooking && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              Update Booking Status: {selectedBooking.confirmation_code}
            </h3>
            <form onSubmit={(e) => {
              e.preventDefault();
              const formData = new FormData(e.currentTarget);
              handleBookingAction('cancel', selectedBooking.id, {
                reason: formData.get('reason'),
                refund_amount: formData.get('refund_amount')
              });
            }}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Reason for status change
                  </label>
                  <textarea
                    name="reason"
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    rows={3}
                    placeholder="Enter reason..."
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Refund Amount (if applicable)
                  </label>
                  <input
                    type="number"
                    name="refund_amount"
                    step="0.01"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="0.00"
                  />
                </div>
              </div>
              <div className="mt-6 flex items-center justify-end space-x-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setShowStatusModal(false);
                    setSelectedBooking(null);
                  }}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="destructive"
                  disabled={actionLoading}
                >
                  {actionLoading ? 'Updating...' : 'Update Status'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default BookingsManagement; 