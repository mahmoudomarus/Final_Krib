import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { 
  Building, 
  Plus, 
  TrendingUp, 
  Users, 
  Calendar, 
  Eye,
  MapPin,
  DollarSign,
  BarChart3,
  Settings,
  Search,
  Filter,
  Grid,
  List,
  Upload,
  Camera,
  X,
  Check,
  Clock,
  AlertCircle,
  ChevronDown,
  ExternalLink,
  Home,
  Bed,
  Bath,
  Square,
  FileText,
  Wallet,
  CreditCard,
  Star,
  Target,
  Activity,
  UserCheck,
  CheckCircle,
  XCircle,
  RefreshCw,
  Edit,
  Trash2,
  MoreVertical
} from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';

interface Property {
  id: string;
  title: string;
  description: string;
  address: string;
  city: string;
  emirate: string;
  property_type: string;
  bedrooms: number;
  bathrooms: number;
  area: number;
  base_price: number;
  images: string[];
  is_active: boolean;
  created_at: string;
  agent_id: string;
  is_long_term: boolean;
  lease_duration_months: number;
  available_from: string;
  amenities: string[];
  views_count: number;
  inquiries_count: number;
}

interface Application {
  id: string;
  propertyId: string;
  guestId: string;
  status: string;
  amount: number;
  checkIn: string;
  checkOut: string;
  appliedAt: string;
  updatedAt: string;
  property: {
    id: string;
    title: string;
    address: string;
    price: number;
    images: string[];
  };
  applicant: {
    id: string;
    name: string;
    email: string;
    phone: string;
  };
  duration: number;
}

interface DashboardStats {
  totalListings: number;
  activeListings: number;
  totalInquiries: number;
  monthlyRevenue: number;
  viewings: number;
  conversionRate: number;
  totalClients: number;
  monthlyCommission: number;
  totalCommission: number;
  leads: number;
  pendingApplications: number;
  completedApplications: number;
}

interface ViewingEvent {
  id: string;
  title: string;
  date: string;
  time: string;
  duration: number;
  type: string;
  status: string;
  property: {
    id: string;
    title: string;
    address: string;
  };
  client: {
    id: string;
    name: string;
    email: string;
    phone: string;
  };
  canEdit: boolean;
  canCancel: boolean;
}

interface WalletData {
  wallet: {
    balance: number;
    total_spent: number;
    total_earned: number;
    currency: string;
  };
  transactions: Array<{
    id: string;
    type: string;
    amount: number;
    description: string;
    created_at: string;
    balance_after: number;
  }>;
}

// Add new interfaces for detailed analytics
interface PropertyAnalytics {
  id: string;
  title: string;
  views: number;
  uniqueViewers: number;
  applications: number;
  bookings: number;
  revenue: number;
  conversionRate: number;
  avgViewDuration: number;
  contactFormOpens: number;
  phoneReveals: number;
  recentViewers: Array<{
    id: string;
    name: string;
    email: string;
    viewedAt: string;
    duration: number;
  }>;
  recentApplications: Array<{
    id: string;
    applicantName: string;
    appliedAt: string;
    status: string;
    amount: number;
  }>;
}

interface AvailabilityForm {
  propertyId: string;
  availableDates: Array<{
    date: string;
    timeSlots: Array<{
      startTime: string;
      endTime: string;
      isAvailable: boolean;
    }>;
  }>;
  recurringPattern: 'none' | 'weekly' | 'monthly';
  notes: string;
}

interface ViewingRequest {
  id: string;
  propertyId: string;
  propertyTitle: string;
  guestName: string;
  guestEmail: string;
  guestPhone: string;
  requestedDate: string;
  requestedTime: string;
  status: 'pending' | 'confirmed' | 'rejected';
  message: string;
  createdAt: string;
}

const AgentDashboard: React.FC = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [properties, setProperties] = useState<Property[]>([]);
  const [applications, setApplications] = useState<Application[]>([]);
  const [calendarEvents, setCalendarEvents] = useState<ViewingEvent[]>([]);
  const [walletData, setWalletData] = useState<WalletData | null>(null);
  const [propertyAnalytics, setPropertyAnalytics] = useState<PropertyAnalytics[]>([]);
  const [viewingRequests, setViewingRequests] = useState<ViewingRequest[]>([]);
  
  // Modal states
  const [showAddListing, setShowAddListing] = useState(false);
  const [showAvailabilityManager, setShowAvailabilityManager] = useState(false);
  const [showPropertyAnalytics, setShowPropertyAnalytics] = useState(false);
  const [selectedPropertyForAnalytics, setSelectedPropertyForAnalytics] = useState<string>('');
  
  // Form states
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [applicationFilter, setApplicationFilter] = useState('all');
  const [notification, setNotification] = useState<{type: 'success' | 'error' | 'info', message: string} | null>(null);
  const [creditAmount, setCreditAmount] = useState(100);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  
  // Add listing form
  const [addListingForm, setAddListingForm] = useState({
    title: '',
    description: '',
    address: '',
    city: 'Dubai',
    emirate: 'Dubai',
    property_type: 'apartment',
    bedrooms: 1,
    bathrooms: 1,
    area: 0,
    base_price: 0,
    lease_duration_months: 12,
    available_from: new Date().toISOString().split('T')[0],
    amenities: [] as string[],
    images: [] as File[]
  });
  
  // Availability management form
  const [availabilityForm, setAvailabilityForm] = useState<AvailabilityForm>({
    propertyId: '',
    availableDates: [],
    recurringPattern: 'none',
    notes: ''
  });

  const emirates = ['Dubai', 'Abu Dhabi', 'Sharjah', 'Ajman', 'Ras Al Khaimah', 'Fujairah', 'Umm Al Quwain'];
  const propertyTypes = ['apartment', 'villa', 'townhouse', 'studio', 'penthouse', 'duplex'];
  const availableAmenities = [
    'Swimming Pool', 'Gym', 'Parking', 'Balcony', 'Garden', 'Security', 'Elevator', 
    'Central AC', 'Built-in Wardrobes', 'Maid Room', 'Study Room', 'Laundry Room',
    'Kitchen Appliances', 'Furnished', 'Pet Friendly', 'Beach Access', 'Kids Play Area'
  ];

  useEffect(() => {
    fetchDashboardData();
  }, []);

  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => setNotification(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [notification]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      // Fetch all data in parallel
      const [statsRes, propertiesRes, applicationsRes, calendarRes, walletRes] = await Promise.all([
        fetch('/api/agent/stats', { headers: { 'Authorization': `Bearer ${token}` }}),
        fetch('/api/agent/properties', { headers: { 'Authorization': `Bearer ${token}` }}),
        fetch('/api/agent/applications', { headers: { 'Authorization': `Bearer ${token}` }}),
        fetch('/api/agent/calendar', { headers: { 'Authorization': `Bearer ${token}` }}),
        fetch('/api/agent/wallet', { headers: { 'Authorization': `Bearer ${token}` }})
      ]);

      if (statsRes.ok) {
        const statsResult = await statsRes.json();
        setStats(statsResult.data);
      }

      if (propertiesRes.ok) {
        const propertiesResult = await propertiesRes.json();
        setProperties(propertiesResult.data || []);
      }

      if (applicationsRes.ok) {
        const applicationsResult = await applicationsRes.json();
        setApplications(applicationsResult.data || []);
      }

      if (calendarRes.ok) {
        const calendarResult = await calendarRes.json();
        setCalendarEvents(calendarResult.data?.events || []);
      }

      if (walletRes.ok) {
        const walletResult = await walletRes.json();
        setWalletData(walletResult.data);
      }

      // Fetch analytics if we have properties
      if (propertiesRes.ok) {
        const propertiesResult = await propertiesRes.json();
        if (propertiesResult.data && propertiesResult.data.length > 0) {
          // Fetch analytics for the properties
          setTimeout(() => {
            fetchPropertyAnalytics();
          }, 1000);
        }
      }

    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      setNotification({ type: 'error', message: 'Failed to load dashboard data' });
    } finally {
      setLoading(false);
    }
  };

  const fetchPropertyAnalytics = async () => {
    try {
      const token = localStorage.getItem('token');
      const analyticsPromises = properties.slice(0, 10).map(async (property) => {
        const response = await fetch(`/api/viewing-management/analytics/${property.id}?period=30`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (response.ok) {
          const result = await response.json();
          return {
            id: property.id,
            title: property.title,
            views: result.data?.totalViews || 0,
            uniqueViewers: result.data?.uniqueViewers || 0,
            applications: result.data?.applications || 0,
            bookings: result.data?.bookings || 0,
            revenue: result.data?.revenue || 0,
            conversionRate: result.data?.conversionRate || 0,
            avgViewDuration: result.data?.avgDuration || 0,
            contactFormOpens: result.data?.contactFormOpens || 0,
            phoneReveals: result.data?.phoneReveals || 0,
            recentViewers: result.data?.recentViewers || [],
            recentApplications: result.data?.recentApplications || []
          };
        }
        return null;
      });

      const analyticsResults = await Promise.all(analyticsPromises);
      const validAnalytics = analyticsResults.filter(Boolean) as PropertyAnalytics[];
      setPropertyAnalytics(validAnalytics);
    } catch (error) {
      console.error('Error fetching property analytics:', error);
    }
  };

  const fetchViewingRequests = async () => {
    try {
      const token = localStorage.getItem('token');
      const userId = user?.id;
      
      if (!userId) return;
      
      const response = await fetch(`/api/viewing-management/viewing-requests/${userId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (response.ok) {
        const result = await response.json();
        setViewingRequests(result.data || []);
      }
    } catch (error) {
      console.error('Error fetching viewing requests:', error);
    }
  };

  const handleAvailabilityUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/agent/availability', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(availabilityForm)
      });
      
      if (response.ok) {
        setNotification({ type: 'success', message: 'Availability updated successfully!' });
        setShowAvailabilityManager(false);
        setAvailabilityForm({
          propertyId: '',
          availableDates: [],
          recurringPattern: 'none',
          notes: ''
        });
        fetchDashboardData();
      } else {
        const errorResult = await response.json();
        setNotification({ type: 'error', message: errorResult.message || 'Failed to update availability' });
      }
    } catch (error) {
      console.error('Error updating availability:', error);
      setNotification({ type: 'error', message: 'Failed to update availability' });
    }
  };

  const openAvailabilityManager = (propertyId?: string) => {
    if (propertyId) {
      setAvailabilityForm(prev => ({ ...prev, propertyId }));
    }
    setShowAvailabilityManager(true);
  };

  const handleViewingRequestResponse = async (requestId: string, status: 'confirmed' | 'rejected') => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/viewing-management/viewing-requests/${requestId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ status })
      });
      
      if (response.ok) {
        setNotification({ type: 'success', message: `Viewing request ${status} successfully!` });
        fetchViewingRequests();
        fetchDashboardData();
      } else {
        throw new Error('Failed to update viewing request');
      }
    } catch (error) {
      setNotification({ type: 'error', message: 'Failed to update viewing request' });
    }
  };

  const openPropertyAnalytics = (propertyId: string) => {
    setSelectedPropertyForAnalytics(propertyId);
    setShowPropertyAnalytics(true);
  };

  const handleUpdateApplicationStatus = async (applicationId: string, status: string) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/agent/applications/${applicationId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ status })
      });

      if (response.ok) {
        setNotification({ type: 'success', message: `Application ${status} successfully!` });
        fetchDashboardData(); // Refresh data
      } else {
        throw new Error('Failed to update application status');
      }
    } catch (error) {
      setNotification({ type: 'error', message: 'Failed to update application' });
    }
  };

  const handleAddCredits = async () => {
    try {
      setIsProcessingPayment(true);
      const token = localStorage.getItem('token');
      
      if (creditAmount < 50) {
        setNotification({ type: 'error', message: 'Minimum amount is 50 AED' });
        return;
      }

      const response = await fetch('/api/agent/wallet/add-credits', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          amount: creditAmount,
          description: `Credits added via dashboard`,
          transaction_type: 'credit'
        })
      });

      if (response.ok) {
        const result = await response.json();
        setNotification({ type: 'success', message: `Successfully added ${creditAmount} AED credits!` });
        setCreditAmount(100); // Reset form
        fetchDashboardData(); // Refresh wallet data
      } else {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to add credits');
      }
    } catch (error: any) {
      setNotification({ type: 'error', message: error.message || 'Failed to add credits' });
    } finally {
      setIsProcessingPayment(false);
    }
  };

  const handleImageUpload = (files: FileList | null) => {
    if (files) {
      const newImages = Array.from(files).slice(0, 10 - addListingForm.images.length);
      setAddListingForm(prev => ({
        ...prev,
        images: [...prev.images, ...newImages]
      }));
    }
  };

  const removeImage = (index: number) => {
    setAddListingForm(prev => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index)
    }));
  };

  const toggleAmenity = (amenity: string) => {
    setAddListingForm(prev => ({
      ...prev,
      amenities: prev.amenities.includes(amenity)
        ? prev.amenities.filter(a => a !== amenity)
        : [...prev.amenities, amenity]
    }));
  };

  const handleSubmitListing = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!addListingForm.title || !addListingForm.description || !addListingForm.address || addListingForm.base_price <= 0) {
      setNotification({ type: 'error', message: 'Please fill in all required fields' });
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const formData = new FormData();

      Object.entries(addListingForm).forEach(([key, value]) => {
        if (key === 'images' && Array.isArray(value)) {
          (value as File[]).forEach((file: File) => formData.append('images', file));
        } else if (key === 'amenities') {
          formData.append('amenities', JSON.stringify(value));
        } else {
          formData.append(key, value.toString());
        }
      });

      formData.append('is_long_term', 'true');
      formData.append('listing_type', 'long_term');

      const response = await fetch('/api/agent/properties', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData
      });

      const result = await response.json();

      if (response.ok && result.success) {
        setNotification({ type: 'success', message: 'Long-term listing added successfully!' });
        setShowAddListing(false);
        setAddListingForm({
          title: '',
          description: '',
          address: '',
          city: 'Dubai',
          emirate: 'Dubai',
          property_type: 'apartment',
          bedrooms: 1,
          bathrooms: 1,
          area: 0,
          base_price: 0,
          lease_duration_months: 12,
          available_from: new Date().toISOString().split('T')[0],
          amenities: [],
          images: []
        });
        fetchDashboardData();
      } else {
        throw new Error(result.error || 'Failed to add listing');
      }
    } catch (error: any) {
      setNotification({ type: 'error', message: error.message || 'Failed to add listing' });
    }
  };

  const filteredProperties = properties.filter(property => {
    const matchesSearch = property.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         property.address.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterStatus === 'all' || 
                         (filterStatus === 'active' && property.is_active) ||
                         (filterStatus === 'inactive' && !property.is_active);
    return matchesSearch && matchesFilter;
  });

  const filteredApplications = applications.filter(app => {
    if (applicationFilter === 'all') return true;
    if (applicationFilter === 'pending') return app.status === 'pending' || app.status === 'reviewing';
    if (applicationFilter === 'completed') return app.status === 'confirmed' || app.status === 'completed';
    return app.status === applicationFilter;
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-blue-800 bg-clip-text text-transparent">
                Krib Listers
              </h1>
              <p className="text-gray-600 mt-1">Welcome back, {user?.first_name || 'Agent'}</p>
            </div>
            <div className="flex space-x-3">
              <Button
                onClick={() => setShowAddListing(true)}
                className="bg-blue-600 hover:bg-blue-700 text-white flex items-center space-x-2"
              >
                <Plus className="w-4 h-4" />
                <span>Add Long-Term Listing</span>
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Notification */}
      {notification && (
        <div className={`fixed top-4 right-4 z-50 p-4 rounded-lg shadow-lg flex items-center space-x-2 ${
          notification.type === 'success' ? 'bg-green-500 text-white' :
          notification.type === 'error' ? 'bg-red-500 text-white' :
          'bg-blue-500 text-white'
        }`}>
          {notification.type === 'success' && <CheckCircle className="w-5 h-5" />}
          {notification.type === 'error' && <XCircle className="w-5 h-5" />}
          {notification.type === 'info' && <AlertCircle className="w-5 h-5" />}
          <span>{notification.message}</span>
          <button onClick={() => setNotification(null)}>
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Navigation Tabs */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex space-x-8">
            {[
              { id: 'overview', label: 'Overview', icon: Home },
              { id: 'listings', label: 'My Listings', icon: Building },
              { id: 'applications', label: 'Applications', icon: FileText },
              { id: 'calendar', label: 'Calendar', icon: Calendar },
              { id: 'analytics', label: 'Analytics', icon: BarChart3 },
              { id: 'wallet', label: 'Wallet', icon: Wallet },
              { id: 'settings', label: 'Settings', icon: Settings }
            ].map(tab => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card className="p-6 bg-gradient-to-br from-blue-500 to-blue-600 text-white">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-blue-100">Total Listings</p>
                    <p className="text-3xl font-bold">{stats?.totalListings || 0}</p>
                  </div>
                  <Building className="w-8 h-8 text-blue-200" />
                </div>
              </Card>
              
              <Card className="p-6 bg-gradient-to-br from-green-500 to-green-600 text-white">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-green-100">Monthly Revenue</p>
                    <p className="text-3xl font-bold">{stats?.monthlyRevenue ? `${stats.monthlyRevenue.toLocaleString()} AED` : '0 AED'}</p>
                  </div>
                  <TrendingUp className="w-8 h-8 text-green-200" />
                </div>
              </Card>
              
              <Card className="p-6 bg-gradient-to-br from-purple-500 to-purple-600 text-white">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-purple-100">Total Clients</p>
                    <p className="text-3xl font-bold">{stats?.totalClients || 0}</p>
                  </div>
                  <Users className="w-8 h-8 text-purple-200" />
                </div>
              </Card>
              
              <Card className="p-6 bg-gradient-to-br from-orange-500 to-orange-600 text-white">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-orange-100">Property Views</p>
                    <p className="text-3xl font-bold">{stats?.viewings || 0}</p>
                  </div>
                  <Eye className="w-8 h-8 text-orange-200" />
                </div>
              </Card>
            </div>

            {/* Recent Activity & Quick Actions */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="p-6">
                <h3 className="text-lg font-semibold mb-4">Recent Applications</h3>
                <div className="space-y-3">
                  {applications.slice(0, 3).map(app => (
                    <div key={app.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div>
                        <p className="font-medium">{app.property.title}</p>
                        <p className="text-sm text-gray-600">{app.applicant.name}</p>
                      </div>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        app.status === 'confirmed' ? 'bg-green-100 text-green-800' :
                        app.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {app.status}
                      </span>
                    </div>
                  ))}
                </div>
                <Button 
                  variant="outline" 
                  className="w-full mt-4"
                  onClick={() => setActiveTab('applications')}
                >
                  View All Applications
                </Button>
              </Card>

              <Card className="p-6">
                <h3 className="text-lg font-semibold mb-4">Quick Actions</h3>
                <div className="space-y-3">
                  <Button 
                    onClick={() => setShowAddListing(true)}
                    className="w-full justify-start bg-blue-50 text-blue-700 hover:bg-blue-100"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Add New Long-Term Listing
                  </Button>
                  <Button 
                    onClick={() => openAvailabilityManager()}
                    className="w-full justify-start bg-green-50 text-green-700 hover:bg-green-100"
                  >
                    <Calendar className="w-4 h-4 mr-2" />
                    Manage Viewing Availability
                  </Button>
                  <Button 
                    onClick={() => setActiveTab('analytics')}
                    className="w-full justify-start bg-purple-50 text-purple-700 hover:bg-purple-100"
                  >
                    <BarChart3 className="w-4 h-4 mr-2" />
                    View Performance Analytics
                  </Button>
                  <Button 
                    onClick={() => setActiveTab('wallet')}
                    className="w-full justify-start bg-orange-50 text-orange-700 hover:bg-orange-100"
                  >
                    <Wallet className="w-4 h-4 mr-2" />
                    Manage Wallet & Credits
                  </Button>
                </div>
              </Card>
            </div>
          </div>
        )}

        {activeTab === 'listings' && (
          <div className="space-y-6">
            {/* Search and Filters */}
            <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
              <div className="flex gap-4 items-center">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <input
                    type="text"
                    placeholder="Search properties..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">All Status</option>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-2 rounded ${viewMode === 'grid' ? 'bg-blue-100 text-blue-600' : 'text-gray-600'}`}
                >
                  <Grid className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-2 rounded ${viewMode === 'list' ? 'bg-blue-100 text-blue-600' : 'text-gray-600'}`}
                >
                  <List className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Properties Grid/List */}
            {filteredProperties.length === 0 ? (
              <Card className="p-12 text-center">
                <Building className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-600 mb-2">No Properties Found</h3>
                <p className="text-gray-500 mb-4">
                  {searchTerm || filterStatus !== 'all' ? 'Try adjusting your search or filters' : 'Start by adding your first long-term listing'}
                </p>
                <Button onClick={() => setShowAddListing(true)} className="bg-blue-600 hover:bg-blue-700 text-white">
                  <Plus className="w-4 h-4 mr-2" />
                  Add Long-Term Listing
                </Button>
              </Card>
            ) : (
              <div className={viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6' : 'space-y-4'}>
                {filteredProperties.map(property => (
                  <Card key={property.id} className={`${viewMode === 'list' ? 'flex' : ''} overflow-hidden hover:shadow-lg transition-shadow`}>
                    <div className={`${viewMode === 'list' ? 'w-48 flex-shrink-0' : 'aspect-video'} relative`}>
                      {property.images && property.images.length > 0 ? (
                        <img 
                          src={property.images[0]} 
                          alt={property.title}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                          <Camera className="w-8 h-8 text-gray-400" />
                        </div>
                      )}
                      <div className="absolute top-2 right-2">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          property.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                        }`}>
                          {property.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </div>
                    </div>
                    <div className="p-4 flex-1">
                      <h3 className="font-semibold text-lg mb-2 line-clamp-2">{property.title}</h3>
                      <div className="flex items-center text-gray-600 mb-2">
                        <MapPin className="w-4 h-4 mr-1" />
                        <span className="text-sm line-clamp-1">{property.address}, {property.city}</span>
                      </div>
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex space-x-4 text-sm text-gray-600">
                          <div className="flex items-center">
                            <Bed className="w-4 h-4 mr-1" />
                            <span>{property.bedrooms}</span>
                          </div>
                          <div className="flex items-center">
                            <Bath className="w-4 h-4 mr-1" />
                            <span>{property.bathrooms}</span>
                          </div>
                          <div className="flex items-center">
                            <Square className="w-4 h-4 mr-1" />
                            <span>{property.area} sqft</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <div>
                          <span className="text-2xl font-bold text-blue-600">
                            {property.base_price?.toLocaleString()} AED
                          </span>
                          <span className="text-gray-500 text-sm">/year</span>
                        </div>
                        <div className="flex space-x-2">
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => openAvailabilityManager(property.id)}
                            className="text-green-600 border-green-300 hover:bg-green-50"
                            title="Manage Viewing Availability"
                          >
                            <Calendar className="w-4 h-4" />
                          </Button>
                          <Button size="sm" variant="outline">
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button size="sm" variant="outline">
                            <MoreVertical className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                      <div className="mt-3 flex justify-between text-sm text-gray-600">
                        <span>Views: {property.views_count || 0}</span>
                        <span>Inquiries: {property.inquiries_count || 0}</span>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'applications' && (
          <div className="space-y-6">
            {/* Applications Header */}
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Applications Management</h2>
                <p className="text-gray-600">Review and manage rental applications</p>
              </div>
              <div className="flex items-center space-x-2">
                <select
                  value={applicationFilter}
                  onChange={(e) => setApplicationFilter(e.target.value)}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">All Applications</option>
                  <option value="pending">Pending Review</option>
                  <option value="confirmed">Confirmed</option>
                  <option value="rejected">Rejected</option>
                </select>
                <Button onClick={fetchDashboardData} variant="outline">
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Refresh
                </Button>
              </div>
            </div>

            {/* Applications Grid */}
            {filteredApplications.length === 0 ? (
              <Card className="p-12 text-center">
                <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-600 mb-2">No Applications Found</h3>
                <p className="text-gray-500">
                  {applicationFilter !== 'all' ? 'No applications match your current filter' : 'No rental applications received yet'}
                </p>
              </Card>
            ) : (
              <div className="grid grid-cols-1 gap-6">
                {filteredApplications.map(application => (
                  <Card key={application.id} className="p-6 hover:shadow-lg transition-shadow">
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-start justify-between mb-4">
                          <div>
                            <h3 className="text-lg font-semibold text-gray-900">{application.property.title}</h3>
                            <p className="text-sm text-gray-600 flex items-center mt-1">
                              <MapPin className="w-4 h-4 mr-1" />
                              {application.property.address}
                            </p>
                          </div>
                          <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                            application.status === 'confirmed' ? 'bg-green-100 text-green-800' :
                            application.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                            application.status === 'rejected' ? 'bg-red-100 text-red-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {application.status.charAt(0).toUpperCase() + application.status.slice(1)}
                          </span>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                          <div>
                            <p className="text-sm text-gray-500">Applicant</p>
                            <p className="font-medium">{application.applicant.name}</p>
                            <p className="text-sm text-gray-600">{application.applicant.email}</p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-500">Duration</p>
                            <p className="font-medium">{application.duration} days</p>
                            <p className="text-sm text-gray-600">
                              {new Date(application.checkIn).toLocaleDateString()} - {new Date(application.checkOut).toLocaleDateString()}
                            </p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-500">Amount</p>
                            <p className="font-medium text-green-600">{application.amount.toLocaleString()} AED</p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-500">Applied</p>
                            <p className="font-medium">{new Date(application.appliedAt).toLocaleDateString()}</p>
                          </div>
                        </div>

                        {application.status === 'pending' && (
                          <div className="flex space-x-3">
                            <Button
                              onClick={() => handleUpdateApplicationStatus(application.id, 'confirmed')}
                              className="bg-green-600 hover:bg-green-700 text-white"
                            >
                              <CheckCircle className="w-4 h-4 mr-2" />
                              Approve
                            </Button>
                            <Button
                              onClick={() => handleUpdateApplicationStatus(application.id, 'rejected')}
                              variant="outline"
                              className="border-red-300 text-red-600 hover:bg-red-50"
                            >
                              <XCircle className="w-4 h-4 mr-2" />
                              Reject
                            </Button>
                            <Button
                              variant="outline"
                              onClick={() => window.open(`tel:${application.applicant.phone}`, '_self')}
                            >
                              <Users className="w-4 h-4 mr-2" />
                              Contact
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'calendar' && (
          <div className="space-y-6">
            {/* Calendar Header */}
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Calendar & Viewing Requests</h2>
                <p className="text-gray-600">Manage your availability and respond to viewing requests</p>
              </div>
              <Button
                className="bg-green-600 hover:bg-green-700 text-white"
                onClick={() => openAvailabilityManager()}
              >
                <Plus className="w-4 h-4 mr-2" />
                Manage Availability
              </Button>
            </div>

            {/* Viewing Requests */}
            <Card className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold">Incoming Viewing Requests</h3>
                <Button onClick={fetchViewingRequests} variant="outline" size="sm">
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Refresh
                </Button>
              </div>
              
              {viewingRequests.length === 0 ? (
                <div className="text-center py-8">
                  <Calendar className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                  <h4 className="text-lg font-medium text-gray-600 mb-2">No Viewing Requests</h4>
                  <p className="text-gray-500 mb-4">When guests request to view your properties, they'll appear here</p>
                  <Button 
                    className="bg-green-600 hover:bg-green-700 text-white"
                    onClick={() => openAvailabilityManager()}
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Set Your Availability
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {viewingRequests.map(request => (
                    <div key={request.id} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-3">
                        <div>
                          <h4 className="font-semibold text-gray-900">{request.propertyTitle}</h4>
                          <p className="text-sm text-gray-600">Requested by {request.guestName}</p>
                        </div>
                        <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                          request.status === 'confirmed' ? 'bg-green-100 text-green-800' :
                          request.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
                        </span>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                        <div>
                          <p className="text-sm text-gray-500">Requested Date & Time</p>
                          <p className="font-medium">{new Date(request.requestedDate).toLocaleDateString()} at {request.requestedTime}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">Contact</p>
                          <p className="font-medium">{request.guestEmail}</p>
                          <p className="text-sm text-gray-600">{request.guestPhone}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">Requested</p>
                          <p className="font-medium">{new Date(request.createdAt).toLocaleDateString()}</p>
                        </div>
                      </div>
                      
                      {request.message && (
                        <div className="mb-4">
                          <p className="text-sm text-gray-500">Message</p>
                          <p className="text-gray-700">{request.message}</p>
                        </div>
                      )}
                      
                      {request.status === 'pending' && (
                        <div className="flex space-x-3">
                          <Button
                            onClick={() => handleViewingRequestResponse(request.id, 'confirmed')}
                            className="bg-green-600 hover:bg-green-700 text-white"
                            size="sm"
                          >
                            <CheckCircle className="w-4 h-4 mr-2" />
                            Confirm
                          </Button>
                          <Button
                            onClick={() => handleViewingRequestResponse(request.id, 'rejected')}
                            variant="outline"
                            className="border-red-300 text-red-600 hover:bg-red-50"
                            size="sm"
                          >
                            <XCircle className="w-4 h-4 mr-2" />
                            Decline
                          </Button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </Card>

            {/* Calendar Events */}
            {calendarEvents.length > 0 && (
              <Card className="p-6">
                <h3 className="text-lg font-semibold mb-4">Confirmed Viewings</h3>
                <div className="grid grid-cols-1 gap-6">
                  {calendarEvents.slice(0, 10).map(event => (
                    <div key={event.id} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-3 mb-2">
                            <div className={`w-3 h-3 rounded-full ${
                              event.status === 'confirmed' ? 'bg-green-500' :
                              event.status === 'scheduled' ? 'bg-blue-500' :
                              event.status === 'completed' ? 'bg-gray-500' :
                              'bg-yellow-500'
                            }`}></div>
                            <h3 className="text-lg font-semibold">{event.title}</h3>
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                              event.type === 'viewing' ? 'bg-blue-100 text-blue-800' :
                              'bg-green-100 text-green-800'
                            }`}>
                              {event.type}
                            </span>
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600">
                            <div>
                              <Clock className="w-4 h-4 inline mr-1" />
                              {event.date} at {event.time} ({event.duration} min)
                            </div>
                            <div>
                              <MapPin className="w-4 h-4 inline mr-1" />
                              {event.property.address}
                            </div>
                            <div>
                              <Users className="w-4 h-4 inline mr-1" />
                              {event.client.name}
                            </div>
                          </div>
                        </div>
                        <div className="flex space-x-2">
                          {event.canEdit && (
                            <Button size="sm" variant="outline">
                              <Edit className="w-4 h-4" />
                            </Button>
                          )}
                          {event.canCancel && (
                            <Button size="sm" variant="outline" className="text-red-600 border-red-300">
                              <X className="w-4 h-4" />
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            )}
          </div>
        )}

        {activeTab === 'analytics' && (
          <div className="space-y-6">
            {/* Analytics Header */}
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Performance Analytics</h2>
                <p className="text-gray-600">Track your property performance and detailed user interactions</p>
              </div>
              <Button
                onClick={fetchPropertyAnalytics}
                variant="outline"
                className="flex items-center space-x-2"
              >
                <RefreshCw className="w-4 h-4" />
                <span>Refresh Analytics</span>
              </Button>
            </div>

            {/* Key Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <Card className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500">Conversion Rate</p>
                    <p className="text-2xl font-bold text-green-600">{stats?.conversionRate || 0}%</p>
                    <p className="text-xs text-gray-500">Views to bookings</p>
                  </div>
                  <Target className="w-8 h-8 text-green-500" />
                </div>
              </Card>

              <Card className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500">Total Commission</p>
                    <p className="text-2xl font-bold text-blue-600">{stats?.totalCommission?.toLocaleString() || 0} AED</p>
                    <p className="text-xs text-gray-500">All time earnings</p>
                  </div>
                  <DollarSign className="w-8 h-8 text-blue-500" />
                </div>
              </Card>

              <Card className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500">Total Views</p>
                    <p className="text-2xl font-bold text-purple-600">{propertyAnalytics.reduce((sum, p) => sum + p.views, 0)}</p>
                    <p className="text-xs text-gray-500">All properties</p>
                  </div>
                  <Eye className="w-8 h-8 text-purple-500" />
                </div>
              </Card>

              <Card className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500">Total Applications</p>
                    <p className="text-2xl font-bold text-orange-600">{applications.length}</p>
                    <p className="text-xs text-gray-500">All time</p>
                  </div>
                  <FileText className="w-8 h-8 text-orange-500" />
                </div>
              </Card>
            </div>

            {/* Detailed Property Analytics */}
            <Card className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold">Detailed Property Performance</h3>
                <p className="text-sm text-gray-500">Last 30 days</p>
              </div>
              
              {propertyAnalytics.length === 0 ? (
                <div className="text-center py-8">
                  <BarChart3 className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500">Loading detailed analytics...</p>
                  <Button onClick={fetchPropertyAnalytics} className="mt-4">
                    Load Analytics
                  </Button>
                </div>
              ) : (
                <div className="space-y-6">
                  {propertyAnalytics.map((property) => (
                    <div key={property.id} className="border border-gray-200 rounded-lg p-6">
                      <div className="flex items-center justify-between mb-4">
                        <div>
                          <h4 className="text-lg font-semibold text-gray-900">{property.title}</h4>
                          <p className="text-sm text-gray-600">Property ID: {property.id}</p>
                        </div>
                        <Button
                          onClick={() => openPropertyAnalytics(property.id)}
                          variant="outline"
                          size="sm"
                        >
                          <Eye className="w-4 h-4 mr-2" />
                          View Details
                        </Button>
                      </div>

                      {/* Property Metrics Grid */}
                      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 mb-6">
                        <div className="bg-blue-50 p-3 rounded-lg text-center">
                          <p className="text-2xl font-bold text-blue-600">{property.views}</p>
                          <p className="text-xs text-blue-600">Total Views</p>
                        </div>
                        <div className="bg-green-50 p-3 rounded-lg text-center">
                          <p className="text-2xl font-bold text-green-600">{property.uniqueViewers}</p>
                          <p className="text-xs text-green-600">Unique Viewers</p>
                        </div>
                        <div className="bg-purple-50 p-3 rounded-lg text-center">
                          <p className="text-2xl font-bold text-purple-600">{property.applications}</p>
                          <p className="text-xs text-purple-600">Applications</p>
                        </div>
                        <div className="bg-orange-50 p-3 rounded-lg text-center">
                          <p className="text-2xl font-bold text-orange-600">{property.contactFormOpens}</p>
                          <p className="text-xs text-orange-600">Contact Opens</p>
                        </div>
                        <div className="bg-red-50 p-3 rounded-lg text-center">
                          <p className="text-2xl font-bold text-red-600">{property.phoneReveals}</p>
                          <p className="text-xs text-red-600">Phone Reveals</p>
                        </div>
                        <div className="bg-indigo-50 p-3 rounded-lg text-center">
                          <p className="text-2xl font-bold text-indigo-600">{property.avgViewDuration}s</p>
                          <p className="text-xs text-indigo-600">Avg Duration</p>
                        </div>
                      </div>

                      {/* Recent Activity */}
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Recent Viewers */}
                        <div>
                          <h5 className="font-medium text-gray-900 mb-3">Recent Viewers</h5>
                          {property.recentViewers.length === 0 ? (
                            <p className="text-sm text-gray-500">No recent viewers</p>
                          ) : (
                            <div className="space-y-2">
                              {property.recentViewers.slice(0, 3).map((viewer, index) => (
                                <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                                  <div>
                                    <p className="text-sm font-medium">{viewer.name || 'Anonymous'}</p>
                                    <p className="text-xs text-gray-600">{new Date(viewer.viewedAt).toLocaleDateString()}</p>
                                  </div>
                                  <div className="text-right">
                                    <p className="text-sm text-gray-600">{viewer.duration}s</p>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>

                        {/* Recent Applications */}
                        <div>
                          <h5 className="font-medium text-gray-900 mb-3">Recent Applications</h5>
                          {property.recentApplications.length === 0 ? (
                            <p className="text-sm text-gray-500">No recent applications</p>
                          ) : (
                            <div className="space-y-2">
                              {property.recentApplications.slice(0, 3).map((application, index) => (
                                <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                                  <div>
                                    <p className="text-sm font-medium">{application.applicantName}</p>
                                    <p className="text-xs text-gray-600">{new Date(application.appliedAt).toLocaleDateString()}</p>
                                  </div>
                                  <div className="text-right">
                                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                      application.status === 'confirmed' ? 'bg-green-100 text-green-800' :
                                      application.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                                      'bg-gray-100 text-gray-800'
                                    }`}>
                                      {application.status}
                                    </span>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>

            {/* User Engagement Summary */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="p-6">
                <h3 className="text-lg font-semibold mb-4">User Engagement Summary</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Total Unique Viewers</span>
                    <span className="font-semibold">{propertyAnalytics.reduce((sum, p) => sum + p.uniqueViewers, 0)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Contact Form Opens</span>
                    <span className="font-semibold">{propertyAnalytics.reduce((sum, p) => sum + p.contactFormOpens, 0)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Phone Number Reveals</span>
                    <span className="font-semibold">{propertyAnalytics.reduce((sum, p) => sum + p.phoneReveals, 0)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Average View Duration</span>
                    <span className="font-semibold">
                      {propertyAnalytics.length > 0 
                        ? Math.round(propertyAnalytics.reduce((sum, p) => sum + p.avgViewDuration, 0) / propertyAnalytics.length)
                        : 0}s
                    </span>
                  </div>
                </div>
              </Card>

              <Card className="p-6">
                <h3 className="text-lg font-semibold mb-4">Application Status Breakdown</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Pending Applications</span>
                    <span className="font-semibold text-yellow-600">
                      {applications.filter(app => app.status === 'pending').length}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Confirmed Applications</span>
                    <span className="font-semibold text-green-600">
                      {applications.filter(app => app.status === 'confirmed').length}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Rejected Applications</span>
                    <span className="font-semibold text-red-600">
                      {applications.filter(app => app.status === 'rejected').length}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Total Revenue</span>
                    <span className="font-semibold text-blue-600">
                      {applications
                        .filter(app => app.status === 'confirmed')
                        .reduce((sum, app) => sum + app.amount, 0)
                        .toLocaleString()} AED
                    </span>
                  </div>
                </div>
              </Card>
            </div>
          </div>
        )}

        {activeTab === 'wallet' && (
          <div className="space-y-6">
            {/* Wallet Header */}
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Wallet Management</h2>
              <p className="text-gray-600">Manage your credits and view transaction history</p>
            </div>

            {/* Wallet Balance */}
            <Card className="p-6 bg-gradient-to-r from-green-500 to-green-600 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-green-100">Current Balance</p>
                  <p className="text-4xl font-bold">{walletData?.wallet?.balance?.toLocaleString() || 0} AED</p>
                  <div className="flex space-x-6 mt-2 text-green-100">
                    <span>Earned: {walletData?.wallet?.total_earned?.toLocaleString() || 0} AED</span>
                    <span>Spent: {walletData?.wallet?.total_spent?.toLocaleString() || 0} AED</span>
                  </div>
                </div>
                <Wallet className="w-12 h-12 text-green-200" />
              </div>
            </Card>

            {/* Add Credits */}
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4">Add Credits</h3>
              <div className="flex items-center space-x-4">
                <div className="flex-1">
                  <input
                    type="number"
                    value={creditAmount}
                    onChange={(e) => setCreditAmount(Number(e.target.value))}
                    min="50"
                    max="10000"
                    step="50"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter amount in AED"
                  />
                </div>
                <Button
                  onClick={handleAddCredits}
                  disabled={isProcessingPayment || creditAmount < 50}
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                >
                  {isProcessingPayment ? (
                    <>
                      <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <CreditCard className="w-4 h-4 mr-2" />
                      Add Credits
                    </>
                  )}
                </Button>
              </div>
              <p className="text-sm text-gray-500 mt-2">Minimum amount: 50 AED</p>
            </Card>

            {/* Transaction History */}
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4">Recent Transactions</h3>
              {walletData?.transactions && walletData.transactions.length > 0 ? (
                <div className="space-y-3">
                  {walletData.transactions.slice(0, 10).map(transaction => (
                    <div key={transaction.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                          transaction.type === 'credit' ? 'bg-green-100' :
                          transaction.type === 'debit' ? 'bg-red-100' :
                          'bg-blue-100'
                        }`}>
                          {transaction.type === 'credit' ? (
                            <TrendingUp className="w-4 h-4 text-green-600" />
                          ) : transaction.type === 'debit' ? (
                            <TrendingUp className="w-4 h-4 text-red-600 rotate-180" />
                          ) : (
                            <CreditCard className="w-4 h-4 text-blue-600" />
                          )}
                        </div>
                        <div>
                          <p className="font-medium">{transaction.description}</p>
                          <p className="text-sm text-gray-600">{new Date(transaction.created_at).toLocaleDateString()}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className={`font-medium ${
                          transaction.type === 'credit' ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {transaction.type === 'credit' ? '+' : '-'}{transaction.amount.toLocaleString()} AED
                        </p>
                        <p className="text-sm text-gray-500">Balance: {transaction.balance_after.toLocaleString()} AED</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <CreditCard className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500">No transactions yet</p>
                </div>
              )}
            </Card>
          </div>
        )}

        {activeTab === 'settings' && (
          <div className="space-y-6">
            {/* Settings Header */}
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Account Settings</h2>
              <p className="text-gray-600">Manage your account preferences and business settings</p>
            </div>

            {/* Profile Settings */}
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4">Profile Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    First Name
                  </label>
                  <input
                    type="text"
                    value={user?.first_name || ''}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="First Name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Last Name
                  </label>
                  <input
                    type="text"
                    value={user?.last_name || ''}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Last Name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email
                  </label>
                  <input
                    type="email"
                    value={user?.email || ''}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 bg-gray-50"
                    disabled
                  />
                  <p className="text-xs text-gray-500 mt-1">Email cannot be changed</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    defaultValue="+971 50 123 4567"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="+971 50 123 4567"
                  />
                </div>
              </div>
              <div className="mt-4">
                <Button className="bg-blue-600 hover:bg-blue-700 text-white">
                  Update Profile
                </Button>
              </div>
            </Card>

            {/* Business Settings */}
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4">Business Settings</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Business Name
                  </label>
                  <input
                    type="text"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Your Real Estate Business"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    License Number
                  </label>
                  <input
                    type="text"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="RERA License Number"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Commission Rate (%)
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="10"
                    step="0.5"
                    defaultValue="5"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <p className="text-xs text-gray-500 mt-1">Your commission rate for successful rentals</p>
                </div>
              </div>
              <div className="mt-4">
                <Button className="bg-blue-600 hover:bg-blue-700 text-white">
                  Update Business Info
                </Button>
              </div>
            </Card>

            {/* Notification Settings */}
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4">Notification Preferences</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium">New Viewing Requests</h4>
                    <p className="text-sm text-gray-600">Get notified when guests request property viewings</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" defaultChecked className="sr-only peer" />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium">New Applications</h4>
                    <p className="text-sm text-gray-600">Get notified when tenants apply for your properties</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" defaultChecked className="sr-only peer" />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium">Payment Notifications</h4>
                    <p className="text-sm text-gray-600">Get notified about commission payments and wallet updates</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" defaultChecked className="sr-only peer" />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium">Marketing Updates</h4>
                    <p className="text-sm text-gray-600">Receive tips and updates about property marketing</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" className="sr-only peer" />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>
              </div>
              <div className="mt-4">
                <Button className="bg-blue-600 hover:bg-blue-700 text-white">
                  Save Preferences
                </Button>
              </div>
            </Card>

            {/* Security Settings */}
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4">Security & Privacy</h3>
              <div className="space-y-4">
                <div>
                  <h4 className="font-medium mb-2">Change Password</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Current Password
                      </label>
                      <input
                        type="password"
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Enter current password"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        New Password
                      </label>
                      <input
                        type="password"
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Enter new password"
                      />
                    </div>
                  </div>
                  <Button className="bg-blue-600 hover:bg-blue-700 text-white mt-3">
                    Update Password
                  </Button>
                </div>
                
                <div className="border-t pt-4">
                  <h4 className="font-medium mb-2">Two-Factor Authentication</h4>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">Add an extra layer of security to your account</p>
                    </div>
                    <Button variant="outline" className="border-green-300 text-green-600 hover:bg-green-50">
                      Enable 2FA
                    </Button>
                  </div>
                </div>
              </div>
            </Card>

            {/* Account Actions */}
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4">Account Actions</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium">Export Data</h4>
                    <p className="text-sm text-gray-600">Download your property and transaction data</p>
                  </div>
                  <Button variant="outline">
                    Export Data
                  </Button>
                </div>
                <div className="flex items-center justify-between border-t pt-4">
                  <div>
                    <h4 className="font-medium text-red-600">Delete Account</h4>
                    <p className="text-sm text-gray-600">Permanently delete your account and all data</p>
                  </div>
                  <Button variant="outline" className="border-red-300 text-red-600 hover:bg-red-50">
                    Delete Account
                  </Button>
                </div>
              </div>
            </Card>
          </div>
        )}
      </div>

      {/* Add Listing Modal */}
      {showAddListing && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 p-6 flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900">Add New Long-term Listing</h2>
              <button
                onClick={() => setShowAddListing(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleSubmitListing} className="p-6 space-y-6">
              {/* Basic Information */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Basic Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Property Title *
                    </label>
                    <input
                      type="text"
                      value={addListingForm.title}
                      onChange={(e) => setAddListingForm(prev => ({ ...prev, title: e.target.value }))}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="e.g., Modern 2BR Apartment in Downtown"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Property Type *
                    </label>
                    <select
                      value={addListingForm.property_type}
                      onChange={(e) => setAddListingForm(prev => ({ ...prev, property_type: e.target.value }))}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    >
                      {propertyTypes.map(type => (
                        <option key={type} value={type}>
                          {type.charAt(0).toUpperCase() + type.slice(1)}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Description *
                    </label>
                    <textarea
                      value={addListingForm.description}
                      onChange={(e) => setAddListingForm(prev => ({ ...prev, description: e.target.value }))}
                      rows={4}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Describe the property features, location advantages, and what makes it special..."
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Location */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Location</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Address *
                    </label>
                    <input
                      type="text"
                      value={addListingForm.address}
                      onChange={(e) => setAddListingForm(prev => ({ ...prev, address: e.target.value }))}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="e.g., Building Name, Street Name"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      City
                    </label>
                    <input
                      type="text"
                      value={addListingForm.city}
                      onChange={(e) => setAddListingForm(prev => ({ ...prev, city: e.target.value }))}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="City"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Emirate *
                    </label>
                    <select
                      value={addListingForm.emirate}
                      onChange={(e) => setAddListingForm(prev => ({ ...prev, emirate: e.target.value }))}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    >
                      {emirates.map(emirate => (
                        <option key={emirate} value={emirate}>{emirate}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Property Details */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Property Details</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Bedrooms *
                    </label>
                    <input
                      type="number"
                      min="0"
                      max="10"
                      value={addListingForm.bedrooms}
                      onChange={(e) => setAddListingForm(prev => ({ ...prev, bedrooms: parseInt(e.target.value) || 0 }))}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Bathrooms *
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="10"
                      value={addListingForm.bathrooms}
                      onChange={(e) => setAddListingForm(prev => ({ ...prev, bathrooms: parseInt(e.target.value) || 1 }))}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Area (sqft) *
                    </label>
                    <input
                      type="number"
                      min="100"
                      value={addListingForm.area}
                      onChange={(e) => setAddListingForm(prev => ({ ...prev, area: parseInt(e.target.value) || 0 }))}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="1200"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Annual Rent (AED) *
                    </label>
                    <input
                      type="number"
                      min="10000"
                      value={addListingForm.base_price}
                      onChange={(e) => setAddListingForm(prev => ({ ...prev, base_price: parseInt(e.target.value) || 0 }))}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="120000"
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Lease Information */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Lease Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Lease Duration (months)
                    </label>
                    <select
                      value={addListingForm.lease_duration_months}
                      onChange={(e) => setAddListingForm(prev => ({ ...prev, lease_duration_months: parseInt(e.target.value) }))}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value={6}>6 months</option>
                      <option value={12}>12 months</option>
                      <option value={24}>24 months</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Available From
                    </label>
                    <input
                      type="date"
                      value={addListingForm.available_from}
                      onChange={(e) => setAddListingForm(prev => ({ ...prev, available_from: e.target.value }))}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>
              </div>

              {/* Amenities */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Amenities</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                  {availableAmenities.map(amenity => (
                    <label key={amenity} className="flex items-center space-x-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={addListingForm.amenities.includes(amenity)}
                        onChange={() => toggleAmenity(amenity)}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="text-sm text-gray-700">{amenity}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Images */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Property Images</h3>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6">
                  <div className="text-center">
                    <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                    <label className="cursor-pointer">
                      <span className="text-blue-600 font-medium hover:text-blue-700">
                        Upload images
                      </span>
                      <span className="text-gray-600"> or drag and drop</span>
                      <input
                        type="file"
                        multiple
                        accept="image/*"
                        onChange={(e) => handleImageUpload(e.target.files)}
                        className="hidden"
                      />
                    </label>
                    <p className="text-xs text-gray-500 mt-1">PNG, JPG up to 10MB each (max 10 images)</p>
                  </div>

                  {addListingForm.images.length > 0 && (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
                      {addListingForm.images.map((file, index) => (
                        <div key={index} className="relative group">
                          <img
                            src={URL.createObjectURL(file)}
                            alt={`Upload ${index + 1}`}
                            className="w-full h-24 object-cover rounded-lg"
                          />
                          <button
                            type="button"
                            onClick={() => removeImage(index)}
                            className="absolute top-2 right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Form Actions */}
              <div className="flex items-center justify-end space-x-4 pt-6 border-t border-gray-200">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowAddListing(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                >
                  Add Long-term Listing
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Availability Manager Modal */}
      {showAvailabilityManager && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 p-6 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-gray-900">Manage Viewing Availability</h2>
                {availabilityForm.propertyId && (
                  <p className="text-sm text-gray-600 mt-1">
                    For: {properties.find(p => p.id === availabilityForm.propertyId)?.title || 'Selected Property'}
                  </p>
                )}
              </div>
              <button
                onClick={() => setShowAvailabilityManager(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleAvailabilityUpdate} className="p-6 space-y-6">
              {/* Property Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select Property *
                </label>
                <select
                  value={availabilityForm.propertyId}
                  onChange={(e) => setAvailabilityForm(prev => ({ ...prev, propertyId: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                >
                  <option value="">Choose a property...</option>
                  {properties.map(property => (
                    <option key={property.id} value={property.id}>
                      {property.title} - {property.city}, {property.emirate}
                    </option>
                  ))}
                </select>
              </div>

              {/* Availability Settings */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Availability Settings</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Recurring Pattern
                    </label>
                    <select
                      value={availabilityForm.recurringPattern}
                      onChange={(e) => setAvailabilityForm(prev => ({ ...prev, recurringPattern: e.target.value as 'none' | 'weekly' | 'monthly' }))}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="none">No recurring pattern</option>
                      <option value="weekly">Weekly</option>
                      <option value="monthly">Monthly</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Notes for Guests
                    </label>
                    <textarea
                      value={availabilityForm.notes}
                      onChange={(e) => setAvailabilityForm(prev => ({ ...prev, notes: e.target.value }))}
                      rows={3}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Any special instructions for guests booking viewings..."
                    />
                  </div>
                </div>
              </div>

              {/* Quick Availability Setup */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Setup</h3>
                <div className="bg-blue-50 p-4 rounded-lg">
                  <p className="text-sm text-blue-700 mb-3">
                    Set your general availability for property viewings. Guests will be able to request viewings during these times.
                  </p>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map(day => (
                      <label key={day} className="flex items-center space-x-2 text-sm">
                        <input
                          type="checkbox"
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                        <span>{day}</span>
                      </label>
                    ))}
                  </div>
                  <div className="grid grid-cols-2 gap-4 mt-4">
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Start Time</label>
                      <input
                        type="time"
                        defaultValue="09:00"
                        className="w-full border border-gray-300 rounded px-2 py-1 text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">End Time</label>
                      <input
                        type="time"
                        defaultValue="18:00"
                        className="w-full border border-gray-300 rounded px-2 py-1 text-sm"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Form Actions */}
              <div className="flex items-center justify-end space-x-4 pt-6 border-t border-gray-200">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowAvailabilityManager(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  className="bg-green-600 hover:bg-green-700 text-white"
                >
                  <Calendar className="w-4 h-4 mr-2" />
                  Save Availability
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AgentDashboard;
