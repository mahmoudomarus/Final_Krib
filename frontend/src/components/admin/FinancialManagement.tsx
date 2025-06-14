import React, { useState, useEffect } from 'react';
import { 
  DollarSign, 
  CreditCard, 
  TrendingUp, 
  TrendingDown,
  ArrowUpRight,
  ArrowDownLeft,
  Calendar,
  Filter,
  Download,
  RefreshCw,
  Eye,
  CheckCircle,
  XCircle,
  Clock,
  AlertTriangle,
  Search,
  MoreHorizontal,
  Banknote,
  Receipt,
  Wallet,
  PieChart,
  BarChart3,
  Users,
  Building,
  Shield,
  FileText,
  Send,
  ArrowRight
} from 'lucide-react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { apiService } from '../../services/api';
import { formatDate, formatCurrency } from '../../lib/utils';

interface Transaction {
  id: string;
  type: 'BOOKING_PAYMENT' | 'HOST_PAYOUT' | 'PLATFORM_FEE' | 'REFUND' | 'SECURITY_DEPOSIT' | 'COMMISSION';
  status: 'PENDING' | 'COMPLETED' | 'FAILED' | 'CANCELLED' | 'PROCESSING';
  amount: number;
  currency: string;
  description: string;
  created_at: string;
  processed_at?: string;
  payment_method?: string;
  reference_id?: string;
  booking_id?: string;
  user?: {
    id: string;
    first_name: string;
    last_name: string;
    email: string;
  };
  host?: {
    id: string;
    first_name: string;
    last_name: string;
    email: string;
  };
  property?: {
    id: string;
    title: string;
    city: string;
  };
  fees?: {
    platform_fee: number;
    payment_processing_fee: number;
    tax_amount: number;
  };
}

interface Payout {
  id: string;
  host_id: string;
  amount: number;
  currency: string;
  status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED' | 'CANCELLED';
  payout_method: 'BANK_TRANSFER' | 'PAYPAL' | 'STRIPE' | 'WALLET';
  created_at: string;
  processed_at?: string;
  failure_reason?: string;
  host?: {
    id: string;
    first_name: string;
    last_name: string;
    email: string;
    bank_details?: any;
  };
  transactions: Transaction[];
}

interface FinancialStats {
  totalRevenue: number;
  monthlyRevenue: number;
  totalPayouts: number;
  pendingPayouts: number;
  platformFees: number;
  refundsIssued: number;
  transactionCount: number;
  averageTransactionValue: number;
  revenueGrowth: number;
  payoutGrowth: number;
  topPaymentMethods: { method: string; count: number; amount: number }[];
  monthlyBreakdown: { month: string; revenue: number; payouts: number; fees: number }[];
}

interface FinancialResponse {
  transactions: Transaction[];
  payouts: Payout[];
  stats: FinancialStats;
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

const FinancialManagement: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'overview' | 'transactions' | 'payouts' | 'analytics'>('overview');
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [payouts, setPayouts] = useState<Payout[]>([]);
  const [stats, setStats] = useState<FinancialStats | null>(null);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0
  });
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    type: '',
    status: '',
    dateRange: '30d',
    search: '',
    sortBy: 'created_at',
    sortOrder: 'desc'
  });
  const [showFilters, setShowFilters] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  const [selectedPayout, setSelectedPayout] = useState<Payout | null>(null);
  const [showTransactionModal, setShowTransactionModal] = useState(false);
  const [showPayoutModal, setShowPayoutModal] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    fetchFinancialData();
  }, [pagination.page, filters, activeTab]);

  const fetchFinancialData = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
        ...(filters.type && { type: filters.type }),
        ...(filters.status && { status: filters.status }),
        ...(filters.search && { search: filters.search }),
        dateRange: filters.dateRange,
        sortBy: filters.sortBy,
        sortOrder: filters.sortOrder
      });

      const response = await apiService.get(`/super-admin/financial?${params}`) as { data: FinancialResponse };
      const data: FinancialResponse = response.data;
      
      setTransactions(data.transactions);
      setPayouts(data.payouts);
      setStats(data.stats);
      setPagination(data.pagination);
    } catch (error) {
      console.error('Error fetching financial data:', error);
      // Set empty state for graceful handling - no hardcoded data
      setTransactions([]);
      setPayouts([]);
      setStats({
        totalRevenue: 0,
        monthlyRevenue: 0,
        totalPayouts: 0,
        pendingPayouts: 0,
        platformFees: 0,
        refundsIssued: 0,
        transactionCount: 0,
        averageTransactionValue: 0,
        revenueGrowth: 0,
        payoutGrowth: 0,
        topPaymentMethods: [],
        monthlyBreakdown: []
      });
    } finally {
      setLoading(false);
    }
  };

  const handleTransactionAction = async (action: string, transactionId: string, data?: any) => {
    try {
      setActionLoading(true);
      let endpoint = '';
      
      switch (action) {
        case 'approve':
          endpoint = `/super-admin/transactions/${transactionId}/approve`;
          break;
        case 'reject':
          endpoint = `/super-admin/transactions/${transactionId}/reject`;
          break;
        case 'refund':
          endpoint = `/super-admin/transactions/${transactionId}/refund`;
          break;
      }
      
      await apiService.post(endpoint, data);
      await fetchFinancialData();
      setShowTransactionModal(false);
      setSelectedTransaction(null);
    } catch (error) {
      console.error(`Error performing ${action}:`, error);
    } finally {
      setActionLoading(false);
    }
  };

  const handlePayoutAction = async (action: string, payoutId: string, data?: any) => {
    try {
      setActionLoading(true);
      let endpoint = '';
      
      switch (action) {
        case 'process':
          endpoint = `/super-admin/payouts/${payoutId}/process`;
          break;
        case 'cancel':
          endpoint = `/super-admin/payouts/${payoutId}/cancel`;
          break;
        case 'retry':
          endpoint = `/super-admin/payouts/${payoutId}/retry`;
          break;
      }
      
      await apiService.post(endpoint, data);
      await fetchFinancialData();
      setShowPayoutModal(false);
      setSelectedPayout(null);
    } catch (error) {
      console.error(`Error performing ${action}:`, error);
    } finally {
      setActionLoading(false);
    }
  };

  const getTransactionTypeIcon = (type: string) => {
    switch (type) {
      case 'BOOKING_PAYMENT': return <CreditCard className="w-4 h-4" />;
      case 'HOST_PAYOUT': return <ArrowUpRight className="w-4 h-4" />;
      case 'PLATFORM_FEE': return <Receipt className="w-4 h-4" />;
      case 'REFUND': return <ArrowDownLeft className="w-4 h-4" />;
      case 'SECURITY_DEPOSIT': return <Shield className="w-4 h-4" />;
      case 'COMMISSION': return <Banknote className="w-4 h-4" />;
      default: return <DollarSign className="w-4 h-4" />;
    }
  };

  const getTransactionTypeColor = (type: string) => {
    switch (type) {
      case 'BOOKING_PAYMENT': return 'text-green-600';
      case 'HOST_PAYOUT': return 'text-blue-600';
      case 'PLATFORM_FEE': return 'text-purple-600';
      case 'REFUND': return 'text-red-600';
      case 'SECURITY_DEPOSIT': return 'text-yellow-600';
      case 'COMMISSION': return 'text-indigo-600';
      default: return 'text-gray-600';
    }
  };

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'COMPLETED': return 'success';
      case 'PENDING': return 'warning';
      case 'PROCESSING': return 'primary';
      case 'FAILED': return 'error';
      case 'CANCELLED': return 'secondary';
      default: return 'secondary';
    }
  };

  const formatTransactionType = (type: string) => {
    return type.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase());
  };

  const formatUserName = (user: any) => {
    if (!user) return 'Unknown User';
    return `${user.first_name} ${user.last_name}`.trim() || user.email.split('@')[0];
  };

  const renderOverviewTab = () => (
    <div className="space-y-6">
      {/* Financial Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
          <Card className="p-4 md:p-6">
            <div className="flex items-center justify-between">
              <div className="min-w-0 flex-1">
                <p className="text-xs md:text-sm text-gray-600 truncate">Total Revenue</p>
                <p className="text-lg md:text-2xl lg:text-3xl font-bold truncate">{formatCurrency(stats.totalRevenue)}</p>
                <div className={`flex items-center mt-1 md:mt-2 ${stats.revenueGrowth >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {stats.revenueGrowth >= 0 ? <TrendingUp className="w-3 h-3 md:w-4 md:h-4" /> : <TrendingDown className="w-3 h-3 md:w-4 md:h-4" />}
                  <span className="text-xs md:text-sm ml-1">{Math.abs(stats.revenueGrowth).toFixed(1)}%</span>
                </div>
              </div>
              <div className="p-2 md:p-3 bg-green-100 rounded-full flex-shrink-0">
                <DollarSign className="w-4 h-4 md:w-6 md:h-6 text-green-600" />
              </div>
            </div>
          </Card>

          <Card className="p-4 md:p-6">
            <div className="flex items-center justify-between">
              <div className="min-w-0 flex-1">
                <p className="text-xs md:text-sm text-gray-600 truncate">Monthly Revenue</p>
                <p className="text-lg md:text-2xl lg:text-3xl font-bold truncate">{formatCurrency(stats.monthlyRevenue)}</p>
                <div className="flex items-center mt-1 md:mt-2 text-blue-600">
                  <Calendar className="w-3 h-3 md:w-4 md:h-4" />
                  <span className="text-xs md:text-sm ml-1">This month</span>
                </div>
              </div>
              <div className="p-2 md:p-3 bg-blue-100 rounded-full flex-shrink-0">
                <TrendingUp className="w-4 h-4 md:w-6 md:h-6 text-blue-600" />
              </div>
            </div>
          </Card>

          <Card className="p-4 md:p-6">
            <div className="flex items-center justify-between">
              <div className="min-w-0 flex-1">
                <p className="text-xs md:text-sm text-gray-600 truncate">Pending Payouts</p>
                <p className="text-lg md:text-2xl lg:text-3xl font-bold truncate">{formatCurrency(stats.pendingPayouts)}</p>
                <div className="flex items-center mt-1 md:mt-2 text-yellow-600">
                  <Clock className="w-3 h-3 md:w-4 md:h-4" />
                  <span className="text-xs md:text-sm ml-1">Awaiting processing</span>
                </div>
              </div>
              <div className="p-2 md:p-3 bg-yellow-100 rounded-full flex-shrink-0">
                <Wallet className="w-4 h-4 md:w-6 md:h-6 text-yellow-600" />
              </div>
            </div>
          </Card>

          <Card className="p-4 md:p-6">
            <div className="flex items-center justify-between">
              <div className="min-w-0 flex-1">
                <p className="text-xs md:text-sm text-gray-600 truncate">Platform Fees</p>
                <p className="text-lg md:text-2xl lg:text-3xl font-bold truncate">{formatCurrency(stats.platformFees)}</p>
                <div className="flex items-center mt-1 md:mt-2 text-purple-600">
                  <Receipt className="w-3 h-3 md:w-4 md:h-4" />
                  <span className="text-xs md:text-sm ml-1">Commission earned</span>
                </div>
              </div>
              <div className="p-2 md:p-3 bg-purple-100 rounded-full flex-shrink-0">
                <Receipt className="w-4 h-4 md:w-6 md:h-6 text-purple-600" />
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Additional Stats */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
          <Card className="p-4 md:p-6">
            <div className="flex items-center justify-between">
              <div className="min-w-0 flex-1">
                <p className="text-xs md:text-sm text-gray-600 truncate">Total Transactions</p>
                <p className="text-lg md:text-xl lg:text-2xl font-bold">{stats.transactionCount.toLocaleString()}</p>
              </div>
              <CreditCard className="w-6 h-6 md:w-8 md:h-8 text-gray-400 flex-shrink-0" />
            </div>
          </Card>

          <Card className="p-4 md:p-6">
            <div className="flex items-center justify-between">
              <div className="min-w-0 flex-1">
                <p className="text-xs md:text-sm text-gray-600 truncate">Avg Transaction</p>
                <p className="text-lg md:text-xl lg:text-2xl font-bold truncate">{formatCurrency(stats.averageTransactionValue)}</p>
              </div>
              <BarChart3 className="w-6 h-6 md:w-8 md:h-8 text-gray-400 flex-shrink-0" />
            </div>
          </Card>

          <Card className="p-4 md:p-6">
            <div className="flex items-center justify-between">
              <div className="min-w-0 flex-1">
                <p className="text-xs md:text-sm text-gray-600 truncate">Total Payouts</p>
                <p className="text-lg md:text-xl lg:text-2xl font-bold truncate">{formatCurrency(stats.totalPayouts)}</p>
              </div>
              <ArrowUpRight className="w-6 h-6 md:w-8 md:h-8 text-gray-400 flex-shrink-0" />
            </div>
          </Card>

          <Card className="p-4 md:p-6">
            <div className="flex items-center justify-between">
              <div className="min-w-0 flex-1">
                <p className="text-xs md:text-sm text-gray-600 truncate">Refunds Issued</p>
                <p className="text-lg md:text-xl lg:text-2xl font-bold truncate">{formatCurrency(stats.refundsIssued)}</p>
              </div>
              <ArrowDownLeft className="w-6 h-6 md:w-8 md:h-8 text-gray-400 flex-shrink-0" />
            </div>
          </Card>
        </div>
      )}

      {/* Payment Methods Breakdown */}
      {stats && stats.topPaymentMethods.length > 0 && (
        <Card className="p-4 md:p-6">
          <h3 className="text-base md:text-lg font-semibold text-gray-900 mb-4 md:mb-6">Payment Methods</h3>
          <div className="space-y-3 md:space-y-4">
            {stats.topPaymentMethods.map((method, index) => (
              <div key={index} className="flex items-center justify-between">
                <div className="flex items-center min-w-0 flex-1">
                  <div className="w-3 h-3 rounded-full bg-blue-500 mr-3 flex-shrink-0" style={{ 
                    backgroundColor: `hsl(${index * 60}, 70%, 50%)` 
                  }}></div>
                  <span className="text-xs md:text-sm text-gray-600 truncate">{method.method}</span>
                </div>
                <div className="text-right flex-shrink-0 ml-2">
                  <div className="text-xs md:text-sm font-medium">{method.count} transactions</div>
                  <div className="text-xs text-gray-500">{formatCurrency(method.amount)}</div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Recent Transactions */}
      <Card className="p-4 md:p-6">
        <div className="flex items-center justify-between mb-4 md:mb-6">
          <h3 className="text-base md:text-lg font-semibold text-gray-900">Recent Transactions</h3>
          <Button variant="outline" size="sm" onClick={() => setActiveTab('transactions')} className="text-xs md:text-sm">
            View All
            <ArrowRight className="w-3 h-3 md:w-4 md:h-4 ml-1 md:ml-2" />
          </Button>
        </div>
        <div className="space-y-3 md:space-y-4">
          {transactions.slice(0, 5).map((transaction) => (
            <div key={transaction.id} className="flex items-center justify-between p-3 md:p-4 border border-gray-200 rounded-lg">
              <div className="flex items-center space-x-2 md:space-x-3 min-w-0 flex-1">
                <div className={`p-1.5 md:p-2 rounded-full bg-gray-100 ${getTransactionTypeColor(transaction.type)} flex-shrink-0`}>
                  {getTransactionTypeIcon(transaction.type)}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs md:text-sm font-medium text-gray-900 truncate">{formatTransactionType(transaction.type)}</p>
                  <p className="text-xs text-gray-500 truncate">{formatDate(transaction.created_at)}</p>
                </div>
              </div>
              <div className="text-right flex-shrink-0 ml-2">
                <p className="text-xs md:text-sm font-medium">{formatCurrency(transaction.amount)}</p>
                <Badge variant={getStatusBadgeColor(transaction.status)} className="text-xs">
                  {transaction.status}
                </Badge>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );

  const renderTransactionsTab = () => (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Transaction Management</h2>
          <p className="text-gray-600">Monitor and manage all financial transactions</p>
        </div>
        <div className="flex items-center space-x-3">
          <Button onClick={() => setShowFilters(!showFilters)} variant="outline">
            <Filter className="w-4 h-4 mr-2" />
            Filters
          </Button>
          <Button onClick={fetchFinancialData} variant="outline">
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button variant="outline">
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Filters */}
      {showFilters && (
        <Card className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Transaction Type</label>
              <select
                value={filters.type}
                onChange={(e) => setFilters({ ...filters, type: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">All Types</option>
                <option value="BOOKING_PAYMENT">Booking Payment</option>
                <option value="HOST_PAYOUT">Host Payout</option>
                <option value="PLATFORM_FEE">Platform Fee</option>
                <option value="REFUND">Refund</option>
                <option value="SECURITY_DEPOSIT">Security Deposit</option>
                <option value="COMMISSION">Commission</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
              <select
                value={filters.status}
                onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">All Statuses</option>
                <option value="PENDING">Pending</option>
                <option value="PROCESSING">Processing</option>
                <option value="COMPLETED">Completed</option>
                <option value="FAILED">Failed</option>
                <option value="CANCELLED">Cancelled</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Date Range</label>
              <select
                value={filters.dateRange}
                onChange={(e) => setFilters({ ...filters, dateRange: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="7d">Last 7 days</option>
                <option value="30d">Last 30 days</option>
                <option value="90d">Last 90 days</option>
                <option value="1y">Last year</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Search</label>
              <input
                type="text"
                value={filters.search}
                onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                placeholder="Search transactions..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
        </Card>
      )}

      {/* Transactions Table */}
      <Card className="p-6">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-4 font-medium text-gray-900">Transaction</th>
                <th className="text-left py-3 px-4 font-medium text-gray-900">User</th>
                <th className="text-left py-3 px-4 font-medium text-gray-900">Amount</th>
                <th className="text-left py-3 px-4 font-medium text-gray-900">Status</th>
                <th className="text-left py-3 px-4 font-medium text-gray-900">Date</th>
                <th className="text-left py-3 px-4 font-medium text-gray-900">Actions</th>
              </tr>
            </thead>
            <tbody>
              {transactions.map((transaction) => (
                <tr key={transaction.id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="py-4 px-4">
                    <div className="flex items-center space-x-3">
                      <div className={`p-2 rounded-full bg-gray-100 ${getTransactionTypeColor(transaction.type)}`}>
                        {getTransactionTypeIcon(transaction.type)}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">{formatTransactionType(transaction.type)}</p>
                        <p className="text-xs text-gray-500">{transaction.reference_id}</p>
                      </div>
                    </div>
                  </td>
                  <td className="py-4 px-4">
                    <div>
                      <p className="text-sm font-medium text-gray-900">{formatUserName(transaction.user)}</p>
                      <p className="text-xs text-gray-500">{transaction.user?.email}</p>
                    </div>
                  </td>
                  <td className="py-4 px-4">
                    <p className="text-sm font-medium text-gray-900">{formatCurrency(transaction.amount)}</p>
                    <p className="text-xs text-gray-500">{transaction.currency}</p>
                  </td>
                  <td className="py-4 px-4">
                    <Badge variant={getStatusBadgeColor(transaction.status)}>
                      {transaction.status}
                    </Badge>
                  </td>
                  <td className="py-4 px-4">
                    <p className="text-sm text-gray-900">{formatDate(transaction.created_at)}</p>
                  </td>
                  <td className="py-4 px-4">
                    <div className="flex items-center space-x-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setSelectedTransaction(transaction);
                          setShowTransactionModal(true);
                        }}
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                      <Button size="sm" variant="ghost">
                        <MoreHorizontal className="w-4 h-4" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );

  const renderPayoutsTab = () => (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Payout Management</h2>
          <p className="text-gray-600">Process and manage host payouts</p>
        </div>
        <div className="flex items-center space-x-3">
          <Button variant="outline">
            <Send className="w-4 h-4 mr-2" />
            Process Pending
          </Button>
          <Button onClick={fetchFinancialData} variant="outline">
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Payouts Table */}
      <Card className="p-6">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-4 font-medium text-gray-900">Host</th>
                <th className="text-left py-3 px-4 font-medium text-gray-900">Amount</th>
                <th className="text-left py-3 px-4 font-medium text-gray-900">Method</th>
                <th className="text-left py-3 px-4 font-medium text-gray-900">Status</th>
                <th className="text-left py-3 px-4 font-medium text-gray-900">Created</th>
                <th className="text-left py-3 px-4 font-medium text-gray-900">Actions</th>
              </tr>
            </thead>
            <tbody>
              {payouts.map((payout) => (
                <tr key={payout.id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="py-4 px-4">
                    <div>
                      <p className="text-sm font-medium text-gray-900">{formatUserName(payout.host)}</p>
                      <p className="text-xs text-gray-500">{payout.host?.email}</p>
                    </div>
                  </td>
                  <td className="py-4 px-4">
                    <p className="text-sm font-medium text-gray-900">{formatCurrency(payout.amount)}</p>
                    <p className="text-xs text-gray-500">{payout.currency}</p>
                  </td>
                  <td className="py-4 px-4">
                    <p className="text-sm text-gray-900">{payout.payout_method.replace(/_/g, ' ')}</p>
                  </td>
                  <td className="py-4 px-4">
                    <Badge variant={getStatusBadgeColor(payout.status)}>
                      {payout.status}
                    </Badge>
                  </td>
                  <td className="py-4 px-4">
                    <p className="text-sm text-gray-900">{formatDate(payout.created_at)}</p>
                  </td>
                  <td className="py-4 px-4">
                    <div className="flex items-center space-x-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setSelectedPayout(payout);
                          setShowPayoutModal(true);
                        }}
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                      {payout.status === 'PENDING' && (
                        <Button
                          size="sm"
                          onClick={() => handlePayoutAction('process', payout.id)}
                          disabled={actionLoading}
                        >
                          Process
                        </Button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );

  const renderAnalyticsTab = () => {
    // Import the FinancialAnalytics component dynamically
    const FinancialAnalytics = React.lazy(() => import('./FinancialAnalytics'));
    
    return (
      <React.Suspense fallback={
    <div className="space-y-6">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-32 bg-gray-200 rounded"></div>
              ))}
            </div>
            <div className="h-64 bg-gray-200 rounded"></div>
      </div>
    </div>
      }>
        <FinancialAnalytics />
      </React.Suspense>
  );
  };

  if (loading && !stats) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-32 bg-gray-200 rounded"></div>
            ))}
          </div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Tab Navigation */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {[
            { id: 'overview', label: 'Overview', icon: DollarSign },
            { id: 'transactions', label: 'Transactions', icon: CreditCard },
            { id: 'payouts', label: 'Payouts', icon: ArrowUpRight },
            { id: 'analytics', label: 'Analytics', icon: BarChart3 }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === tab.id
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center">
                <tab.icon className="w-4 h-4 mr-2" />
                {tab.label}
              </div>
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && renderOverviewTab()}
      {activeTab === 'transactions' && renderTransactionsTab()}
      {activeTab === 'payouts' && renderPayoutsTab()}
      {activeTab === 'analytics' && renderAnalyticsTab()}
    </div>
  );
};

export default FinancialManagement; 