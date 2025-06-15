import React, { useState, useEffect } from 'react';
import { 
  Building, 
  MapPin, 
  Calendar, 
  DollarSign, 
  Users, 
  Eye, 
  Edit, 
  CheckCircle, 
  XCircle, 
  Clock, 
  Filter, 
  RefreshCw, 
  Plus, 
  MoreHorizontal,
  Star,
  TrendingUp,
  Home,
  AlertTriangle,
  Search,
  Download,
  Upload,
  Ban
} from 'lucide-react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { apiService } from '../../services/api';
import { formatDate, formatCurrency } from '../../lib/utils';

interface Property {
  id: string;
  title: string;
  description: string;
  property_type: 'APARTMENT' | 'VILLA' | 'STUDIO' | 'TOWNHOUSE';
  listing_type: 'SHORT_TERM' | 'LONG_TERM';
  verification_status: 'PENDING' | 'VERIFIED' | 'REJECTED' | 'SUSPENDED';
  price_per_night?: number;
  price_per_month?: number;
  bedrooms: number;
  bathrooms: number;
  area: string;
  city: string;
  emirate: string;
  country: string;
  latitude?: number;
  longitude?: number;
  amenities: string[];
  images: string[];
  host_id: string;
  created_at: string;
  updated_at: string;
  status_reason?: string;
  is_featured: boolean;
  owner?: {
    id: string;
    first_name: string;
    last_name: string;
    email: string;
    is_host: boolean;
    is_agent: boolean;
  };
  bookings?: { count: number }[];
  reviews?: { count: number }[];
}

interface PropertyStats {
  total: number;
  active: number;
  pending: number;
  rejected: number;
  suspended: number;
  shortTerm: number;
  longTerm: number;
  apartments: number;
  villas: number;
  studios: number;
}

interface PropertiesResponse {
  properties: Property[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  stats: PropertyStats;
}

const PropertiesManagement: React.FC = () => {
  const [properties, setProperties] = useState<Property[]>([]);
  const [stats, setStats] = useState<PropertyStats | null>(null);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0
  });
  const [loading, setLoading] = useState(true);
  const [selectedProperties, setSelectedProperties] = useState<string[]>([]);
  const [filters, setFilters] = useState({
    status: '',
    type: '',
    listingType: '',
    location: '',
    search: '',
    sortBy: 'created_at',
    sortOrder: 'desc'
  });
  const [showFilters, setShowFilters] = useState(false);
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showAddPropertyModal, setShowAddPropertyModal] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [hosts, setHosts] = useState<Array<{id: string, first_name: string, last_name: string, email: string}>>([]);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);

  useEffect(() => {
    fetchProperties();
    fetchHosts();
  }, [pagination.page, filters]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (openDropdown) {
        setOpenDropdown(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [openDropdown]);

  const fetchHosts = async () => {
    try {
      const response = await apiService.get('/super-admin/users?role=host&status=active') as { users: Array<{id: string, first_name: string, last_name: string, email: string}> };
      setHosts(response.users || []);
    } catch (error) {
      console.error('Error fetching hosts:', error);
    }
  };

  const fetchProperties = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
        ...(filters.status && { status: filters.status }),
        ...(filters.type && { type: filters.type }),
        ...(filters.listingType && { listing_type: filters.listingType }),
        ...(filters.location && { location: filters.location }),
        ...(filters.search && { search: filters.search }),
        sortBy: filters.sortBy,
        sortOrder: filters.sortOrder
      });

      const response = await apiService.get(`/super-admin/properties?${params}`) as any;
      
      // Handle different response structures
      let propertiesData;
      if (response.data && response.data.properties) {
        // Structure: { data: { properties: [...], stats: {...}, pagination: {...} } }
        propertiesData = response.data;
      } else if (response.properties) {
        // Structure: { properties: [...], stats: {...}, pagination: {...} }
        propertiesData = response;
      } else if (response.data && Array.isArray(response.data)) {
        // Structure: { data: [...] } (array of properties)
        propertiesData = {
          properties: response.data,
          stats: { total: response.data.length, active: 0, pending: 0, rejected: 0, suspended: 0, shortTerm: 0, longTerm: 0, apartments: 0, villas: 0, studios: 0 },
          pagination: { page: 1, limit: 20, total: response.data.length, totalPages: 1 }
        };
      } else {
        console.error('Unexpected response structure:', response);
        propertiesData = {
          properties: [],
          stats: { total: 0, active: 0, pending: 0, rejected: 0, suspended: 0, shortTerm: 0, longTerm: 0, apartments: 0, villas: 0, studios: 0 },
          pagination: { page: 1, limit: 20, total: 0, totalPages: 0 }
        };
      }
      

      
      setProperties(propertiesData.properties || []);
      setStats(propertiesData.stats || null);
      setPagination(propertiesData.pagination || { page: 1, limit: 20, total: 0, totalPages: 0 });
    } catch (error) {
      console.error('Error fetching properties:', error);
      // Set empty state on error
      setProperties([]);
      setStats({ total: 0, active: 0, pending: 0, rejected: 0, suspended: 0, shortTerm: 0, longTerm: 0, apartments: 0, villas: 0, studios: 0 });
      setPagination({ page: 1, limit: 20, total: 0, totalPages: 0 });
    } finally {
      setLoading(false);
    }
  };

  const handlePropertyAction = async (action: string, propertyId: string, data?: any) => {
    try {
      setActionLoading(true);
      let endpoint = '';
      let method = 'POST';
      
      switch (action) {
        case 'approve':
          endpoint = `/super-admin/properties/${propertyId}/approve`;
          break;
        case 'reject':
          endpoint = `/super-admin/properties/${propertyId}/reject`;
          break;
        case 'suspend':
          endpoint = `/super-admin/properties/${propertyId}/suspend`;
          break;
        case 'activate':
          endpoint = `/super-admin/properties/${propertyId}/activate`;
          break;
        case 'delete':
          endpoint = `/super-admin/properties/${propertyId}`;
          method = 'DELETE';
          break;
        case 'edit':
          // Open edit modal instead of API call
          setSelectedProperty(properties.find(p => p.id === propertyId) || null);
          setShowEditModal(true);
          return;
        case 'view':
          // Open view modal instead of API call
          setSelectedProperty(properties.find(p => p.id === propertyId) || null);
          setShowViewModal(true);
          return;
      }
      
      if (method === 'DELETE') {
        await apiService.delete(endpoint, data);
      } else {
        await apiService.post(endpoint, data);
      }
      
      await fetchProperties(); // Refresh the list
      setShowStatusModal(false);
      setShowDeleteModal(false);
      setSelectedProperty(null);
    } catch (error) {
      console.error(`Error performing ${action}:`, error);
    } finally {
      setActionLoading(false);
    }
  };

  const handleCreateProperty = async (propertyData: any) => {
    try {
      setActionLoading(true);
      await apiService.post('/super-admin/properties', propertyData);
      await fetchProperties(); // Refresh the list
      setShowAddPropertyModal(false);
    } catch (error) {
      console.error('Error creating property:', error);
      alert('Failed to create property. Please try again.');
    } finally {
      setActionLoading(false);
    }
  };

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'VERIFIED': return 'success';
      case 'PENDING': return 'warning';
      case 'REJECTED': return 'error';
      default: return 'gray';
    }
  };

  const getPropertyTypeBadge = (type: string) => {
    const typeMap = {
      'APARTMENT': { label: 'Apartment', color: 'blue' },
      'VILLA': { label: 'Villa', color: 'green' },
      'STUDIO': { label: 'Studio', color: 'purple' },
      'TOWNHOUSE': { label: 'Townhouse', color: 'orange' }
    };
    return typeMap[type as keyof typeof typeMap] || { label: type, color: 'gray' };
  };

  const getListingTypeBadge = (type: string) => {
    return type === 'SHORT_TERM' 
      ? { label: 'Short Term', color: 'blue' }
      : { label: 'Long Term', color: 'green' };
  };

  const formatPropertyOwner = (property: Property) => {
    if (!property.owner) return 'Unknown Owner';
    return `${property.owner.first_name} ${property.owner.last_name}`.trim() || property.owner.email.split('@')[0];
  };

  const getBookingCount = (property: Property) => {
    return property.bookings?.[0]?.count || 0;
  };

  const getReviewCount = (property: Property) => {
    return property.reviews?.[0]?.count || 0;
  };

  const formatPrice = (property: Property) => {
    if (property.listing_type === 'SHORT_TERM' && property.price_per_night) {
      return `${formatCurrency(property.price_per_night)}/night`;
    }
    if (property.listing_type === 'LONG_TERM' && property.price_per_month) {
      return `${formatCurrency(property.price_per_month)}/month`;
    }
    return 'Price not set';
  };

  const handleBulkAction = async (action: string) => {
    if (selectedProperties.length === 0) return;
    
    try {
      setActionLoading(true);
      
      // Perform bulk action for all selected properties
      const promises = selectedProperties.map(propertyId => 
        handlePropertyAction(action, propertyId)
      );
      
      await Promise.all(promises);
      setSelectedProperties([]);
    } catch (error) {
      console.error('Error performing bulk action:', error);
    } finally {
      setActionLoading(false);
    }
  };

  if (loading && properties.length === 0) {
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
          <h2 className="text-2xl font-bold text-gray-900">Property Management</h2>
          <p className="text-gray-600">Manage property listings, approvals, and analytics</p>
        </div>
        <div className="flex items-center space-x-3">
          <Button onClick={() => setShowFilters(!showFilters)} variant="outline">
            <Filter className="w-4 h-4 mr-2" />
            Filters
          </Button>
          <Button onClick={fetchProperties} variant="outline">
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button variant="outline">
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
          <Button onClick={() => setShowAddPropertyModal(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Add Property
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 xl:grid-cols-9 gap-4">
          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Properties</p>
                <p className="text-2xl font-bold">{stats.total}</p>
              </div>
              <Building className="w-8 h-8 text-blue-500" />
            </div>
          </Card>
          
          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Active</p>
                <p className="text-2xl font-bold text-green-600">{stats.active}</p>
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
                <p className="text-sm text-gray-600">Rejected</p>
                <p className="text-2xl font-bold text-red-600">{stats.suspended}</p>
              </div>
              <XCircle className="w-8 h-8 text-red-500" />
            </div>
          </Card>
          
          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Short Term</p>
                <p className="text-2xl font-bold">{stats.shortTerm}</p>
              </div>
              <Calendar className="w-8 h-8 text-blue-500" />
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
          
          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Apartments</p>
                <p className="text-2xl font-bold">{stats.apartments}</p>
              </div>
              <Building className="w-8 h-8 text-purple-500" />
            </div>
          </Card>
          
          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Villas</p>
                <p className="text-2xl font-bold">{stats.villas}</p>
              </div>
              <Home className="w-8 h-8 text-orange-500" />
            </div>
          </Card>
          
          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Studios</p>
                <p className="text-2xl font-bold">{stats.studios}</p>
              </div>
              <Building className="w-8 h-8 text-indigo-500" />
            </div>
          </Card>
        </div>
      )}

      {/* Empty State */}
      {!loading && properties.length === 0 && (
        <Card className="p-12">
          <div className="text-center">
            <Building className="w-16 h-16 mx-auto mb-4 text-gray-300" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Properties Found</h3>
            <p className="text-gray-600 mb-6">There are no properties in the system yet.</p>
            <Button onClick={() => setShowAddPropertyModal(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Add Property
            </Button>
          </div>
        </Card>
      )}

      {/* Properties exist - show filters and table */}
      {properties.length > 0 && (
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
                    <option value="VERIFIED">Verified</option>
                    <option value="REJECTED">Rejected</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Property Type</label>
                  <select
                    value={filters.type}
                    onChange={(e) => setFilters({ ...filters, type: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">All Types</option>
                    <option value="APARTMENT">Apartment</option>
                    <option value="VILLA">Villa</option>
                    <option value="STUDIO">Studio</option>
                    <option value="TOWNHOUSE">Townhouse</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Listing Type</label>
                  <select
                    value={filters.listingType}
                    onChange={(e) => setFilters({ ...filters, listingType: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">All Listings</option>
                    <option value="SHORT_TERM">Short Term</option>
                    <option value="LONG_TERM">Long Term</option>
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
                      placeholder="Search properties..."
                      className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>
              </div>
            </Card>
          )}

          {/* Bulk Actions */}
          {selectedProperties.length > 0 && (
            <Card className="p-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">
                  {selectedProperties.length} property(ies) selected
                </span>
                <div className="flex items-center space-x-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleBulkAction('approve')}
                    disabled={actionLoading}
                  >
                    <CheckCircle className="w-4 h-4 mr-1" />
                    Approve All
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleBulkAction('reject')}
                    disabled={actionLoading}
                  >
                    <XCircle className="w-4 h-4 mr-1" />
                    Reject All
                  </Button>
                </div>
              </div>
            </Card>
          )}

          {/* Properties Table */}
          <Card className="overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium text-gray-900">
                  Properties ({pagination.total})
                </h3>
              </div>
            </div>
            
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      <input
                        type="checkbox"
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedProperties(properties.map(p => p.id));
                          } else {
                            setSelectedProperties([]);
                          }
                        }}
                      />
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Property
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Type
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Owner
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Price
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Location
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {properties.map((property) => {
                    const propertyType = getPropertyTypeBadge(property.property_type);
                    const listingType = getListingTypeBadge(property.listing_type);
                    const bookingCount = getBookingCount(property);
                    const reviewCount = getReviewCount(property);
                    
                    return (
                      <tr key={property.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <input
                            type="checkbox"
                            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                            checked={selectedProperties.includes(property.id)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedProperties([...selectedProperties, property.id]);
                              } else {
                                setSelectedProperties(selectedProperties.filter(id => id !== property.id));
                              }
                            }}
                          />
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="flex-shrink-0 h-12 w-12">
                              {property.images && property.images.length > 0 ? (
                                <img className="h-12 w-12 rounded-lg object-cover" src={property.images[0]} alt="" />
                              ) : (
                                <div className="h-12 w-12 rounded-lg bg-gray-300 flex items-center justify-center">
                                  <Building className="w-6 h-6 text-gray-500" />
                                </div>
                              )}
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-gray-900">
                                {property.title}
                              </div>
                              <div className="text-sm text-gray-500">
                                {property.bedrooms} bed • {property.bathrooms} bath
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="space-y-1">
                            <Badge variant={propertyType.color as any}>{propertyType.label}</Badge>
                            <Badge variant={listingType.color as any} className="block">{listingType.label}</Badge>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <Badge variant={getStatusBadgeColor(property.verification_status) as any}>
                            {property.verification_status}
                          </Badge>
                          {property.status_reason && (
                            <div className="text-xs text-gray-500 mt-1">
                              {property.status_reason}
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          <div>
                            <div className="font-medium">{formatPropertyOwner(property)}</div>
                            {property.owner && (
                              <div className="text-gray-500">{property.owner.email}</div>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          <div className="font-medium">{formatPrice(property)}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          <div>
                            <div>{property.city}, {property.emirate}</div>
                            {property.area && <div className="text-xs">{property.area}</div>}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <div className="flex items-center justify-end space-x-2">
                            {/* View and Edit buttons always visible */}
                            <Button
                              size="sm"
                              variant="ghost"
                              title="View Details"
                              onClick={() => handlePropertyAction('view', property.id)}
                            >
                              <Eye className="w-4 h-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              title="Edit Property"
                              onClick={() => handlePropertyAction('edit', property.id)}
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                            
                            {/* Dropdown Menu */}
                            <div className="relative">
                              <Button
                                size="sm"
                                variant="ghost"
                                title="More Actions"
                                onClick={() => setOpenDropdown(openDropdown === property.id ? null : property.id)}
                              >
                                <MoreHorizontal className="w-4 h-4" />
                              </Button>
                              
                              {openDropdown === property.id && (
                                <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg z-50 border border-gray-200">
                                  <div className="py-1">
                                    {/* Status-based Actions */}
                                    {property.verification_status === 'PENDING' && (
                                      <>
                                        <button
                                          className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                                          onClick={() => {
                                            handlePropertyAction('approve', property.id);
                                            setOpenDropdown(null);
                                          }}
                                          disabled={actionLoading}
                                        >
                                          <CheckCircle className="w-4 h-4 mr-2 text-green-600" />
                                          Approve Property
                                        </button>
                                        <button
                                          className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                                          onClick={() => {
                                            setSelectedProperty(property);
                                            setShowStatusModal(true);
                                            setOpenDropdown(null);
                                          }}
                                          disabled={actionLoading}
                                        >
                                          <XCircle className="w-4 h-4 mr-2 text-red-600" />
                                          Reject Property
                                        </button>
                                      </>
                                    )}
                                    
                                    {property.verification_status === 'VERIFIED' && (
                                      <button
                                        className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                                        onClick={() => {
                                          handlePropertyAction('suspend', property.id);
                                          setOpenDropdown(null);
                                        }}
                                        disabled={actionLoading}
                                      >
                                        <Ban className="w-4 h-4 mr-2 text-yellow-600" />
                                        Suspend Property
                                      </button>
                                    )}
                                    
                                    {property.verification_status === 'SUSPENDED' && (
                                      <button
                                        className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                                        onClick={() => {
                                          handlePropertyAction('activate', property.id);
                                          setOpenDropdown(null);
                                        }}
                                        disabled={actionLoading}
                                      >
                                        <CheckCircle className="w-4 h-4 mr-2 text-green-600" />
                                        Activate Property
                                      </button>
                                    )}
                                    
                                    {property.verification_status === 'REJECTED' && (
                                      <button
                                        className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                                        onClick={() => {
                                          handlePropertyAction('approve', property.id);
                                          setOpenDropdown(null);
                                        }}
                                        disabled={actionLoading}
                                      >
                                        <CheckCircle className="w-4 h-4 mr-2 text-green-600" />
                                        Approve Property
                                      </button>
                                    )}
                                    
                                    {/* Divider */}
                                    <div className="border-t border-gray-100 my-1"></div>
                                    
                                    {/* Delete Action */}
                                    <button
                                      className="flex items-center w-full px-4 py-2 text-sm text-red-700 hover:bg-red-50"
                                      onClick={() => {
                                        setSelectedProperty(property);
                                        setShowDeleteModal(true);
                                        setOpenDropdown(null);
                                      }}
                                      disabled={actionLoading}
                                    >
                                      <AlertTriangle className="w-4 h-4 mr-2 text-red-600" />
                                      Delete Property
                                    </button>
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            
            {/* Pagination */}
            {pagination.totalPages > 1 && (
              <div className="px-6 py-4 border-t border-gray-200">
                <div className="flex items-center justify-between">
                  <div className="text-sm text-gray-700">
                    Showing {((pagination.page - 1) * pagination.limit) + 1} to {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} properties
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={pagination.page <= 1}
                      onClick={() => setPagination({ ...pagination, page: pagination.page - 1 })}
                    >
                      Previous
                    </Button>
                    <span className="text-sm text-gray-700">
                      Page {pagination.page} of {pagination.totalPages}
                    </span>
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={pagination.page >= pagination.totalPages}
                      onClick={() => setPagination({ ...pagination, page: pagination.page + 1 })}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </Card>
        </>
      )}

      {/* Property Status Modal */}
      {showStatusModal && selectedProperty && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              Update Property Status: {selectedProperty.title}
            </h3>
            <form onSubmit={(e) => {
              e.preventDefault();
              const formData = new FormData(e.currentTarget);
              const action = formData.get('action') as string;
              const reason = formData.get('reason') as string;
              handlePropertyAction(action, selectedProperty.id, { reason });
            }}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Action
                  </label>
                  <select
                    name="action"
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Select Action</option>
                    <option value="approve">Approve Property</option>
                    <option value="reject">Reject Property</option>
                    <option value="pending">Mark as Pending Review</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Reason/Comments
                  </label>
                  <textarea
                    name="reason"
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    rows={3}
                    placeholder="Enter reason for this action..."
                  />
                </div>
              </div>
              
              <div className="mt-6 flex items-center justify-end space-x-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setShowStatusModal(false);
                    setSelectedProperty(null);
                  }}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={actionLoading}
                >
                  {actionLoading ? 'Updating...' : 'Update Status'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Property Modal */}
      {showDeleteModal && selectedProperty && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              Delete Property: {selectedProperty.title}
            </h3>
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex">
                <AlertTriangle className="w-5 h-5 text-red-400 mr-2 mt-0.5" />
                <div>
                  <p className="text-sm text-red-800 font-medium">Warning: This action cannot be undone</p>
                  <p className="text-sm text-red-700 mt-1">
                    The property will be permanently marked as deleted and will no longer be available for booking.
                  </p>
                </div>
              </div>
            </div>
            <form onSubmit={(e) => {
              e.preventDefault();
              const formData = new FormData(e.currentTarget);
              handlePropertyAction('delete', selectedProperty.id, {
                reason: formData.get('reason')
              });
            }}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Reason for deletion *
                  </label>
                  <textarea
                    name="reason"
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                    rows={3}
                    placeholder="Enter reason for deleting this property..."
                  />
                </div>
              </div>
              <div className="mt-6 flex items-center justify-end space-x-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setShowDeleteModal(false);
                    setSelectedProperty(null);
                  }}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="destructive"
                  disabled={actionLoading}
                >
                  {actionLoading ? 'Deleting...' : 'Delete Property'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Property Modal */}
      {showAddPropertyModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              Add New Property
            </h3>
            <form onSubmit={(e) => {
              e.preventDefault();
              const formData = new FormData(e.currentTarget);
              
              // Parse amenities from comma-separated string
              const amenitiesString = formData.get('amenities') as string;
              const amenities = amenitiesString ? amenitiesString.split(',').map(a => a.trim()).filter(a => a) : [];
              
              // Parse images from comma-separated URLs
              const imagesString = formData.get('images') as string;
              const images = imagesString ? imagesString.split(',').map(i => i.trim()).filter(i => i) : [];
              
              const propertyData = {
                title: formData.get('title'),
                description: formData.get('description'),
                property_type: formData.get('property_type'),
                listing_type: formData.get('listing_type'),
                price_per_night: formData.get('listing_type') === 'SHORT_TERM' ? Number(formData.get('price_per_night')) : null,
                price_per_month: formData.get('listing_type') === 'LONG_TERM' ? Number(formData.get('price_per_month')) : null,
                bedrooms: Number(formData.get('bedrooms')),
                bathrooms: Number(formData.get('bathrooms')),
                area: formData.get('area'),
                city: formData.get('city'),
                emirate: formData.get('emirate'),
                country: formData.get('country'),
                latitude: formData.get('latitude') ? Number(formData.get('latitude')) : null,
                longitude: formData.get('longitude') ? Number(formData.get('longitude')) : null,
                amenities,
                images,
                host_id: formData.get('host_id'),
                is_featured: formData.get('is_featured') === 'on'
              };
              
              handleCreateProperty(propertyData);
            }}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Basic Information */}
                <div className="space-y-4">
                  <h4 className="font-medium text-gray-900">Basic Information</h4>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Property Title *</label>
                    <input
                      type="text"
                      name="title"
                      required
                      placeholder="e.g., Luxury 2BR Apartment in Dubai Marina"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Description *</label>
                    <textarea
                      name="description"
                      required
                      rows={4}
                      placeholder="Detailed description of the property..."
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Property Type *</label>
                      <select
                        name="property_type"
                        required
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="">Select Type</option>
                        <option value="APARTMENT">Apartment</option>
                        <option value="VILLA">Villa</option>
                        <option value="STUDIO">Studio</option>
                        <option value="TOWNHOUSE">Townhouse</option>
                      </select>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Listing Type *</label>
                      <select
                        name="listing_type"
                        required
                        onChange={(e) => {
                          const shortTermPrice = document.getElementById('price_per_night') as HTMLInputElement;
                          const longTermPrice = document.getElementById('price_per_month') as HTMLInputElement;
                          if (e.target.value === 'SHORT_TERM') {
                            shortTermPrice.style.display = 'block';
                            longTermPrice.style.display = 'none';
                            shortTermPrice.required = true;
                            longTermPrice.required = false;
                          } else {
                            shortTermPrice.style.display = 'none';
                            longTermPrice.style.display = 'block';
                            shortTermPrice.required = false;
                            longTermPrice.required = true;
                          }
                        }}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="">Select Listing Type</option>
                        <option value="SHORT_TERM">Short Term (Vacation Rental)</option>
                        <option value="LONG_TERM">Long Term (Monthly Rental)</option>
                      </select>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Price per Night (AED)</label>
                      <input
                        type="number"
                        id="price_per_night"
                        name="price_per_night"
                        min="0"
                        step="0.01"
                        placeholder="0.00"
                        style={{ display: 'none' }}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Price per Month (AED)</label>
                      <input
                        type="number"
                        id="price_per_month"
                        name="price_per_month"
                        min="0"
                        step="0.01"
                        placeholder="0.00"
                        style={{ display: 'none' }}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Bedrooms</label>
                      <input
                        type="number"
                        name="bedrooms"
                        min="0"
                        defaultValue="1"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Bathrooms</label>
                      <input
                        type="number"
                        name="bathrooms"
                        min="0"
                        step="0.5"
                        defaultValue="1"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                  </div>
                </div>

                {/* Location & Details */}
                <div className="space-y-4">
                  <h4 className="font-medium text-gray-900">Location & Details</h4>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Host *</label>
                    <select
                      name="host_id"
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="">Select Host</option>
                      {hosts.map(host => (
                        <option key={host.id} value={host.id}>
                          {host.first_name} {host.last_name} ({host.email})
                        </option>
                      ))}
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Area/Neighborhood</label>
                    <input
                      type="text"
                      name="area"
                      placeholder="e.g., Dubai Marina, JBR, Downtown"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">City *</label>
                      <input
                        type="text"
                        name="city"
                        required
                        placeholder="e.g., Dubai"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Emirate *</label>
                      <select
                        name="emirate"
                        required
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="">Select Emirate</option>
                        <option value="Dubai">Dubai</option>
                        <option value="Abu Dhabi">Abu Dhabi</option>
                        <option value="Sharjah">Sharjah</option>
                        <option value="Ajman">Ajman</option>
                        <option value="Ras Al Khaimah">Ras Al Khaimah</option>
                        <option value="Fujairah">Fujairah</option>
                        <option value="Umm Al Quwain">Umm Al Quwain</option>
                      </select>
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Country *</label>
                    <input
                      type="text"
                      name="country"
                      required
                      defaultValue="United Arab Emirates"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Latitude</label>
                      <input
                        type="number"
                        name="latitude"
                        step="any"
                        placeholder="25.2048"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Longitude</label>
                      <input
                        type="number"
                        name="longitude"
                        step="any"
                        placeholder="55.2708"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Amenities</label>
                    <input
                      type="text"
                      name="amenities"
                      placeholder="WiFi, Pool, Gym, Parking (comma-separated)"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                    <p className="text-xs text-gray-500 mt-1">Separate amenities with commas</p>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Image URLs</label>
                    <input
                      type="text"
                      name="images"
                      placeholder="https://example.com/image1.jpg, https://example.com/image2.jpg"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                    <p className="text-xs text-gray-500 mt-1">Separate image URLs with commas</p>
                  </div>
                  
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      name="is_featured"
                      id="is_featured"
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <label htmlFor="is_featured" className="ml-2 block text-sm text-gray-700">
                      Featured Property
                    </label>
                  </div>
                </div>
              </div>
              
              <div className="flex justify-end space-x-3 mt-6 pt-6 border-t border-gray-200">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowAddPropertyModal(false)}
                  disabled={actionLoading}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={actionLoading}
                >
                  {actionLoading ? 'Creating...' : 'Create Property'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default PropertiesManagement; 