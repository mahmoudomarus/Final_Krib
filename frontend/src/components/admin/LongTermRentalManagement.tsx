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
  MessageSquare,
  Building,
  UserCheck,
  ClipboardList,
  FileText as Contract,
  CalendarCheck
} from 'lucide-react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { apiService } from '../../services/api';
import { formatDate, formatCurrency } from '../../lib/utils';

interface PropertyViewing {
  id: string;
  property_id: string;
  tenant_id: string;
  agent_id: string;
  viewing_date: string;
  viewing_time: string;
  status: 'scheduled' | 'completed' | 'cancelled' | 'no_show';
  notes?: string;
  created_at: string;
  property?: {
    id: string;
    title: string;
    property_type: string;
    city: string;
    emirate: string;
    area: string;
  };
  tenant?: {
    id: string;
    first_name: string;
    last_name: string;
    email: string;
    phone?: string;
  };
  agent?: {
    id: string;
    first_name: string;
    last_name: string;
    email: string;
    phone?: string;
  };
}

interface RentalApplication {
  id: string;
  property_id: string;
  applicant_id: string;
  agent_id: string;
  status: 'pending' | 'under_review' | 'approved' | 'rejected' | 'contracted';
  monthly_income: number;
  employment_status: string;
  preferred_move_date: string;
  notes?: string;
  rejection_reason?: string;
  created_at: string;
  property?: {
    id: string;
    title: string;
    property_type: string;
    city: string;
    emirate: string;
    area: string;
    monthly_rent: number;
  };
  applicant?: {
    id: string;
    first_name: string;
    last_name: string;
    email: string;
    phone?: string;
  };
  agent?: {
    id: string;
    first_name: string;
    last_name: string;
    email: string;
    phone?: string;
  };
}

interface LeaseContract {
  id: string;
  application_id: string;
  property_id: string;
  tenant_id: string;
  agent_id: string;
  lease_start_date: string;
  lease_end_date: string;
  monthly_rent: number;
  security_deposit: number;
  status: 'pending' | 'active' | 'expired' | 'terminated';
  terms_conditions?: string;
  created_at: string;
  property?: {
    id: string;
    title: string;
    property_type: string;
    city: string;
    emirate: string;
    area: string;
  };
  tenant?: {
    id: string;
    first_name: string;
    last_name: string;
    email: string;
    phone?: string;
  };
  agent?: {
    id: string;
    first_name: string;
    last_name: string;
    email: string;
    phone?: string;
  };
}

const LongTermRentalManagement: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'viewings' | 'applications' | 'contracts'>('viewings');
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  
  // Viewings State
  const [viewings, setViewings] = useState<PropertyViewing[]>([]);
  const [viewingStats, setViewingStats] = useState({
    total: 0,
    scheduled: 0,
    completed: 0,
    cancelled: 0,
    noShow: 0
  });
  
  // Applications State
  const [applications, setApplications] = useState<RentalApplication[]>([]);
  const [applicationStats, setApplicationStats] = useState({
    total: 0,
    pending: 0,
    approved: 0,
    rejected: 0,
    underReview: 0
  });
  
  // Contracts State
  const [contracts, setContracts] = useState<LeaseContract[]>([]);
  const [contractStats, setContractStats] = useState({
    total: 0,
    active: 0,
    expired: 0,
    terminated: 0,
    pending: 0
  });
  
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0
  });
  
  const [filters, setFilters] = useState({
    status: '',
    agent_id: '',
    property_id: '',
    search: '',
    date_from: '',
    date_to: ''
  });
  
  const [showFilters, setShowFilters] = useState(false);
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [showContractModal, setShowContractModal] = useState(false);

  useEffect(() => {
    fetchData();
  }, [activeTab, pagination.page, filters]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
        ...(filters.status && { status: filters.status }),
        ...(filters.agent_id && { agent_id: filters.agent_id }),
        ...(filters.property_id && { property_id: filters.property_id }),
        ...(filters.date_from && { date_from: filters.date_from }),
        ...(filters.date_to && { date_to: filters.date_to })
      });

      let endpoint = '';
      switch (activeTab) {
        case 'viewings':
          endpoint = `/super-admin/viewings?${params}`;
          break;
        case 'applications':
          endpoint = `/super-admin/applications?${params}`;
          break;
        case 'contracts':
          endpoint = `/super-admin/contracts?${params}`;
          break;
      }

      const response = await apiService.get(endpoint) as { data: any };
      const data = response.data;
      
      if (activeTab === 'viewings') {
        setViewings(data.viewings || []);
        setViewingStats(data.stats || { total: 0, scheduled: 0, completed: 0, cancelled: 0, noShow: 0 });
      } else if (activeTab === 'applications') {
        setApplications(data.applications || []);
        setApplicationStats(data.stats || { total: 0, pending: 0, approved: 0, rejected: 0, underReview: 0 });
      } else if (activeTab === 'contracts') {
        setContracts(data.contracts || []);
        setContractStats(data.stats || { total: 0, active: 0, expired: 0, terminated: 0, pending: 0 });
      }
      
      setPagination(data.pagination || { page: 1, limit: 20, total: 0, totalPages: 0 });
    } catch (error) {
      console.error('Error fetching data:', error);
      // Set empty states for graceful handling
      if (activeTab === 'viewings') {
        setViewings([]);
        setViewingStats({ total: 0, scheduled: 0, completed: 0, cancelled: 0, noShow: 0 });
      } else if (activeTab === 'applications') {
        setApplications([]);
        setApplicationStats({ total: 0, pending: 0, approved: 0, rejected: 0, underReview: 0 });
      } else if (activeTab === 'contracts') {
        setContracts([]);
        setContractStats({ total: 0, active: 0, expired: 0, terminated: 0, pending: 0 });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (id: string, status: string, notes?: string) => {
    try {
      setActionLoading(true);
      let endpoint = '';
      
      switch (activeTab) {
        case 'viewings':
          endpoint = `/super-admin/viewings/${id}/status`;
          break;
        case 'applications':
          endpoint = `/super-admin/applications/${id}/status`;
          break;
        case 'contracts':
          endpoint = `/super-admin/contracts/${id}/status`;
          break;
      }
      
      await apiService.put(endpoint, { status, notes });
      await fetchData(); // Refresh the list
      setShowStatusModal(false);
      setSelectedItem(null);
    } catch (error) {
      console.error('Error updating status:', error);
    } finally {
      setActionLoading(false);
    }
  };

  const handleCreateContract = async (applicationId: string, contractData: any) => {
    try {
      setActionLoading(true);
      await apiService.post(`/super-admin/applications/${applicationId}/create-contract`, contractData);
      await fetchData(); // Refresh the list
      setShowContractModal(false);
      setSelectedItem(null);
    } catch (error) {
      console.error('Error creating contract:', error);
    } finally {
      setActionLoading(false);
    }
  };

  const getStatusBadgeColor = (status: string, type: string) => {
    if (type === 'viewings') {
      switch (status) {
        case 'scheduled': return 'warning';
        case 'completed': return 'success';
        case 'cancelled': return 'error';
        case 'no_show': return 'error';
        default: return 'gray';
      }
    } else if (type === 'applications') {
      switch (status) {
        case 'pending': return 'warning';
        case 'under_review': return 'blue';
        case 'approved': return 'success';
        case 'rejected': return 'error';
        case 'contracted': return 'success';
        default: return 'gray';
      }
    } else if (type === 'contracts') {
      switch (status) {
        case 'pending': return 'warning';
        case 'active': return 'success';
        case 'expired': return 'gray';
        case 'terminated': return 'error';
        default: return 'gray';
      }
    }
    return 'gray';
  };

  const formatPersonName = (person: any) => {
    if (!person) return 'Unknown';
    return `${person.first_name} ${person.last_name}`.trim() || person.email?.split('@')[0] || 'Unknown';
  };

  const formatPropertyTitle = (property: any) => {
    if (!property) return 'Unknown Property';
    return `${property.title} - ${property.area}, ${property.city}`;
  };

  const renderStatsCards = () => {
    let stats: any = {};
    let icons: any = {};
    
    if (activeTab === 'viewings') {
      stats = viewingStats;
      icons = {
        total: Calendar,
        scheduled: Clock,
        completed: CheckCircle,
        cancelled: XCircle,
        noShow: AlertTriangle
      };
    } else if (activeTab === 'applications') {
      stats = applicationStats;
      icons = {
        total: ClipboardList,
        pending: Clock,
        approved: CheckCircle,
        rejected: XCircle,
        underReview: Eye
      };
    } else if (activeTab === 'contracts') {
      stats = contractStats;
      icons = {
        total: Contract,
        active: CheckCircle,
        expired: Clock,
        terminated: XCircle,
        pending: AlertTriangle
      };
    }

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        {Object.entries(stats).map(([key, value]) => {
          const Icon = icons[key] || Calendar;
          const colors = {
            total: 'blue',
            scheduled: 'yellow', pending: 'yellow',
            completed: 'green', approved: 'green', active: 'green',
            cancelled: 'red', rejected: 'red', terminated: 'red',
            noShow: 'red', expired: 'gray',
            underReview: 'blue'
          };
          
          return (
            <Card key={key} className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 capitalize">{key.replace(/([A-Z])/g, ' $1')}</p>
                  <p className={`text-2xl font-bold text-${colors[key as keyof typeof colors]}-600`}>
                    {value as number}
                  </p>
                </div>
                <Icon className={`w-8 h-8 text-${colors[key as keyof typeof colors]}-500`} />
              </div>
            </Card>
          );
        })}
      </div>
    );
  };

  const renderEmptyState = () => {
    const emptyStates = {
      viewings: {
        icon: CalendarCheck,
        title: 'No Property Viewings',
        description: 'No property viewings have been scheduled yet.',
        action: 'Schedule Viewing'
      },
      applications: {
        icon: ClipboardList,
        title: 'No Rental Applications',
        description: 'No rental applications have been submitted yet.',
        action: 'View Applications'
      },
      contracts: {
        icon: Contract,
        title: 'No Lease Contracts',
        description: 'No lease contracts have been created yet.',
        action: 'Create Contract'
      }
    };

    const state = emptyStates[activeTab];
    const Icon = state.icon;

    return (
      <Card className="p-12">
        <div className="text-center">
          <Icon className="w-16 h-16 mx-auto mb-4 text-gray-300" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">{state.title}</h3>
          <p className="text-gray-600 mb-6">{state.description}</p>
          <div className="flex items-center justify-center space-x-4">
            <Button variant="outline">
              <Eye className="w-4 h-4 mr-2" />
              View All Properties
            </Button>
            <Button variant="outline">
              <Users className="w-4 h-4 mr-2" />
              Manage Agents
            </Button>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              {state.action}
            </Button>
          </div>
        </div>
      </Card>
    );
  };

  if (loading && (viewings.length === 0 && applications.length === 0 && contracts.length === 0)) {
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
          <h2 className="text-2xl font-bold text-gray-900">Long-Term Rental Management</h2>
          <p className="text-gray-600">Manage property viewings, rental applications, and lease contracts</p>
        </div>
        <div className="flex items-center space-x-3">
          <Button onClick={() => setShowFilters(!showFilters)} variant="outline">
            <Filter className="w-4 h-4 mr-2" />
            Filters
          </Button>
          <Button onClick={fetchData} variant="outline">
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button variant="outline">
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {[
            { key: 'viewings', label: 'Property Viewings', icon: CalendarCheck },
            { key: 'applications', label: 'Rental Applications', icon: ClipboardList },
            { key: 'contracts', label: 'Lease Contracts', icon: Contract }
          ].map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => setActiveTab(key as any)}
              className={`flex items-center space-x-2 py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === key
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{label}</span>
            </button>
          ))}
        </nav>
      </div>

      {/* Stats Cards */}
      {renderStatsCards()}

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
                {activeTab === 'viewings' && (
                  <>
                    <option value="scheduled">Scheduled</option>
                    <option value="completed">Completed</option>
                    <option value="cancelled">Cancelled</option>
                    <option value="no_show">No Show</option>
                  </>
                )}
                {activeTab === 'applications' && (
                  <>
                    <option value="pending">Pending</option>
                    <option value="under_review">Under Review</option>
                    <option value="approved">Approved</option>
                    <option value="rejected">Rejected</option>
                    <option value="contracted">Contracted</option>
                  </>
                )}
                {activeTab === 'contracts' && (
                  <>
                    <option value="pending">Pending</option>
                    <option value="active">Active</option>
                    <option value="expired">Expired</option>
                    <option value="terminated">Terminated</option>
                  </>
                )}
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Agent</label>
              <select
                value={filters.agent_id}
                onChange={(e) => setFilters({ ...filters, agent_id: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">All Agents</option>
                {/* Add agent options here */}
              </select>
            </div>
            
            {activeTab === 'viewings' && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Date From</label>
                  <input
                    type="date"
                    value={filters.date_from}
                    onChange={(e) => setFilters({ ...filters, date_from: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Date To</label>
                  <input
                    type="date"
                    value={filters.date_to}
                    onChange={(e) => setFilters({ ...filters, date_to: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </>
            )}
          </div>
        </Card>
      )}

      {/* Content */}
      {!loading && (
        (activeTab === 'viewings' && viewings.length === 0) ||
        (activeTab === 'applications' && applications.length === 0) ||
        (activeTab === 'contracts' && contracts.length === 0)
      ) ? (
        renderEmptyState()
      ) : (
        <Card className="overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium text-gray-900">
                {activeTab === 'viewings' && `Property Viewings (${pagination.total})`}
                {activeTab === 'applications' && `Rental Applications (${pagination.total})`}
                {activeTab === 'contracts' && `Lease Contracts (${pagination.total})`}
              </h3>
            </div>
          </div>
          
          <div className="text-center py-12">
            <Building className="w-16 h-16 mx-auto mb-4 text-gray-300" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {activeTab === 'viewings' && 'Property Viewings System Ready'}
              {activeTab === 'applications' && 'Rental Applications System Ready'}
              {activeTab === 'contracts' && 'Lease Contracts System Ready'}
            </h3>
            <p className="text-gray-600 mb-6">
              The long-term rental management system is set up and ready for real estate operations.
            </p>
            <div className="flex items-center justify-center space-x-4">
              <Button variant="outline">
                <Users className="w-4 h-4 mr-2" />
                Manage Agents
              </Button>
              <Button variant="outline">
                <Building className="w-4 h-4 mr-2" />
                View Properties
              </Button>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Add New
              </Button>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
};

export default LongTermRentalManagement; 