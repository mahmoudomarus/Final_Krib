import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { 
  CreditCard, 
  DollarSign, 
  TrendingUp, 
  TrendingDown, 
  Users, 
  FileText, 
  Clock, 
  CheckCircle, 
  AlertTriangle, 
  XCircle, 
  Search, 
  Filter, 
  Download, 
  Upload, 
  Edit, 
  Eye, 
  RefreshCw, 
  Calendar, 
  MapPin, 
  User, 
  Building, 
  Phone, 
  Mail, 
  ExternalLink, 
  Copy, 
  Send, 
  Plus, 
  Settings, 
  BarChart3, 
  PieChart, 
  Activity, 
  Archive, 
  AlertCircle, 
  Shield, 
  Banknote, 
  Receipt, 
  CheckSquare, 
  X, 
  Save, 
  Home
} from 'lucide-react';
import { formatDate } from '@/lib/utils';
import { Booking, Property, User as UserType } from '@/types';

interface PaymentDetails {
  id: string;
  bookingId: string;
  amount: number;
  currency: string;
  status: 'PENDING' | 'PAID' | 'FAILED' | 'REFUNDED' | 'PROCESSING' | 'OVERDUE';
  paymentMethod: 'STRIPE' | 'BANK_TRANSFER' | 'CHECK' | 'CASH';
  stripePaymentId?: string;
  stripePaymentUrl?: string;
  dueDate: Date;
  paidDate?: Date;
  description: string;
  type: 'BOOKING_PAYMENT' | 'SECURITY_DEPOSIT' | 'CLEANING_FEE' | 'ADDITIONAL_CHARGES' | 'REFUND';
  booking: Booking;
  property: Property;
  guest: UserType;
  host: UserType;
  invoiceUrl?: string;
  receiptUrl?: string;
  adminNotes?: string;
  checkDetails?: {
    checkNumber?: string;
    bankName?: string;
    dateReceived?: Date;
    verifiedBy?: string;
  };
}

interface PaymentStats {
  totalRevenue: number;
  monthlyRevenue: number;
  pendingPayments: number;
  overduePayments: number;
  totalTransactions: number;
  successRate: number;
  averageTransactionValue: number;
  stripePayments: number;
  checkPayments: number;
  bankTransfers: number;
  paymentsByStatus: {
    paid: number;
    pending: number;
    overdue: number;
    processing: number;
    failed: number;
    refunded: number;
  };
}

interface CheckPaymentUpdate {
  id: string;
  checkNumber: string;
  bankName: string;
  dateReceived: Date;
  amount: number;
  verifiedBy: string;
  notes?: string;
  status: 'RECEIVED' | 'VERIFIED' | 'DEPOSITED' | 'CLEARED';
}

const AdminPaymentDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const activeTab = searchParams.get('tab') || 'overview';
  
  const [payments, setPayments] = useState<PaymentDetails[]>([]);
  const [stats, setStats] = useState<PaymentStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterMethod, setFilterMethod] = useState<string>('all');
  const [selectedPayments, setSelectedPayments] = useState<string[]>([]);
  const [editingCheck, setEditingCheck] = useState<CheckPaymentUpdate | null>(null);
  const [showCheckModal, setShowCheckModal] = useState(false);

  useEffect(() => {
    fetchPayments();
    fetchStats();
  }, []);

  const fetchPayments = async () => {
    setLoading(true);
    try {
      // Simulate API call - in reality this would fetch all platform payments
      setTimeout(() => {
        const mockPayments: PaymentDetails[] = [
          // ... (include all the mock data from PaymentPage plus more admin-specific data)
          {
            id: 'payment-admin-1',
            bookingId: 'booking-admin-1',
            amount: 3500.00,
            currency: 'AED',
            status: 'PENDING',
            paymentMethod: 'CHECK',
            dueDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 3),
            description: 'Luxury Villa Booking - 7 nights',
            type: 'BOOKING_PAYMENT',
            booking: {
              id: 'booking-admin-1',
              checkIn: new Date('2025-01-20'),
              checkOut: new Date('2025-01-27'),
              guests: 8,
              status: 'CONFIRMED' as any
            } as Booking,
            property: {
              id: 'prop-admin-1',
              title: 'Luxury Palm Villa with Private Beach',
              area: 'Palm Jumeirah',
              city: 'Dubai',
              emirate: 'Dubai',
              images: [{ url: '/villa1.jpg', isMain: true } as any]
            } as Property,
            guest: {
              id: 'guest-admin-1',
              firstName: 'Robert',
              lastName: 'Wilson',
              email: 'robert.wilson@email.com',
              phone: '+44-20-7946-0958'
            } as UserType,
            host: {
              id: 'host-admin-1',
              firstName: 'Khalid',
              lastName: 'Al Rashid',
              email: 'khalid@email.com'
            } as UserType,
            adminNotes: 'High-value customer. Check payment expected via ADCB.',
            checkDetails: {
              checkNumber: 'Pending',
              bankName: 'Abu Dhabi Commercial Bank',
              dateReceived: undefined,
              verifiedBy: undefined
            }
          },
          {
            id: 'payment-admin-2',
            bookingId: 'booking-admin-2',
            amount: 800.00,
            currency: 'AED',
            status: 'OVERDUE',
            paymentMethod: 'STRIPE',
            stripePaymentId: 'pi_overdue_123',
            stripePaymentUrl: 'https://checkout.stripe.com/pay/cs_overdue_123',
            dueDate: new Date(Date.now() - 1000 * 60 * 60 * 24 * 5),
            description: 'Studio Apartment - Security Deposit',
            type: 'SECURITY_DEPOSIT',
            booking: {
              id: 'booking-admin-2',
              checkIn: new Date('2024-12-20'),
              checkOut: new Date('2024-12-25'),
              guests: 2,
              status: 'PENDING_PAYMENT' as any
            } as Booking,
            property: {
              id: 'prop-admin-2',
              title: 'Modern Studio in Business Bay',
              area: 'Business Bay',
              city: 'Dubai',
              emirate: 'Dubai',
              images: [{ url: '/studio1.jpg', isMain: true } as any]
            } as Property,
            guest: {
              id: 'guest-admin-2',
              firstName: 'Lisa',
              lastName: 'Chen',
              email: 'lisa.chen@email.com',
              phone: '+65-9123-4567'
            } as UserType,
            host: {
              id: 'host-admin-2',
              firstName: 'Mariam',
              lastName: 'Al Zahra',
              email: 'mariam@email.com'
            } as UserType,
            adminNotes: 'Customer contacted regarding overdue payment. Expecting payment today.'
          }
          // Add more mock data as needed
        ];

        setPayments(mockPayments);
        setLoading(false);
      }, 1000);
    } catch (error) {
      console.error('Error fetching payments:', error);
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      // Simulate API call for payment statistics
      setTimeout(() => {
        const mockStats: PaymentStats = {
          totalRevenue: 485750.00,
          monthlyRevenue: 125430.00,
          pendingPayments: 45,
          overduePayments: 12,
          totalTransactions: 342,
          successRate: 94.2,
          averageTransactionValue: 1420.35,
          stripePayments: 278,
          checkPayments: 52,
          bankTransfers: 12,
          paymentsByStatus: {
            paid: 280,
            pending: 45,
            overdue: 12,
            processing: 3,
            failed: 2,
            refunded: 0
          }
        };

        setStats(mockStats);
      }, 500);
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const handlePaymentStatusUpdate = async (paymentId: string, newStatus: PaymentDetails['status']) => {
    setPayments(prev => prev.map(payment => 
      payment.id === paymentId 
        ? { ...payment, status: newStatus, paidDate: newStatus === 'PAID' ? new Date() : payment.paidDate }
        : payment
    ));
  };

  const handleCheckPaymentUpdate = async (checkUpdate: CheckPaymentUpdate) => {
    const payment = payments.find(p => p.id === checkUpdate.id);
    if (!payment) return;

    const updatedPayment: PaymentDetails = {
      ...payment,
      status: 'PAID',
      paidDate: checkUpdate.dateReceived,
      checkDetails: {
        checkNumber: checkUpdate.checkNumber,
        bankName: checkUpdate.bankName,
        dateReceived: checkUpdate.dateReceived,
        verifiedBy: checkUpdate.verifiedBy
      },
      adminNotes: checkUpdate.notes || payment.adminNotes
    };

    setPayments(prev => prev.map(p => p.id === checkUpdate.id ? updatedPayment : p));
    setShowCheckModal(false);
    setEditingCheck(null);
  };

  const handleBulkAction = async (action: string) => {
    if (selectedPayments.length === 0) return;

    switch (action) {
      case 'send_reminder':
        // Simulate sending payment reminders
        alert(`Payment reminders sent to ${selectedPayments.length} customers`);
        break;
      case 'mark_overdue':
        setPayments(prev => prev.map(payment => 
          selectedPayments.includes(payment.id) && payment.status === 'PENDING'
            ? { ...payment, status: 'OVERDUE' as const }
            : payment
        ));
        break;
      case 'export':
        // Simulate export functionality
        alert(`Exporting ${selectedPayments.length} payment records`);
        break;
    }
    
    setSelectedPayments([]);
  };

  const getFilteredPayments = () => {
    let filtered = payments;

    // Apply search filter
    if (searchQuery) {
      filtered = filtered.filter(payment =>
        payment.guest.firstName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        payment.guest.lastName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        payment.guest.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        payment.property.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        payment.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (payment.stripePaymentId && payment.stripePaymentId.toLowerCase().includes(searchQuery.toLowerCase()))
      );
    }

    // Apply status filter
    if (filterStatus !== 'all') {
      filtered = filtered.filter(payment => payment.status.toLowerCase() === filterStatus);
    }

    // Apply payment method filter
    if (filterMethod !== 'all') {
      filtered = filtered.filter(payment => payment.paymentMethod.toLowerCase() === filterMethod.toLowerCase());
    }

    return filtered;
  };

  const renderOverviewTab = () => (
    <div className="space-y-8">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <DollarSign className="w-8 h-8 text-green-500" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Revenue</p>
              <p className="text-2xl font-bold text-gray-900">
                {stats?.totalRevenue.toFixed(2)} AED
              </p>
              <p className="text-sm text-green-600 flex items-center mt-1">
                <TrendingUp className="w-3 h-3 mr-1" />
                +12% from last month
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <Activity className="w-8 h-8 text-blue-500" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Monthly Revenue</p>
              <p className="text-2xl font-bold text-gray-900">
                {stats?.monthlyRevenue.toFixed(2)} AED
              </p>
              <p className="text-sm text-blue-600">
                {stats?.totalTransactions} transactions
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <Clock className="w-8 h-8 text-yellow-500" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Pending Payments</p>
              <p className="text-2xl font-bold text-gray-900">
                {stats?.pendingPayments}
              </p>
              <p className="text-sm text-yellow-600">
                {stats?.overduePayments} overdue
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <TrendingUp className="w-8 h-8 text-purple-500" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Success Rate</p>
              <p className="text-2xl font-bold text-gray-900">
                {stats?.successRate}%
              </p>
              <p className="text-sm text-purple-600">
                Avg: {stats?.averageTransactionValue.toFixed(2)} AED
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* Payment Methods Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Payment Methods</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <CreditCard className="w-5 h-5 text-blue-500 mr-3" />
                <span>Stripe Payments</span>
              </div>
              <div className="text-right">
                <p className="font-semibold">{stats?.stripePayments}</p>
                <p className="text-sm text-gray-600">81%</p>
              </div>
            </div>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <FileText className="w-5 h-5 text-green-500 mr-3" />
                <span>Check Payments</span>
              </div>
              <div className="text-right">
                <p className="font-semibold">{stats?.checkPayments}</p>
                <p className="text-sm text-gray-600">15%</p>
              </div>
            </div>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <Building className="w-5 h-5 text-purple-500 mr-3" />
                <span>Bank Transfers</span>
              </div>
              <div className="text-right">
                <p className="font-semibold">{stats?.bankTransfers}</p>
                <p className="text-sm text-gray-600">4%</p>
              </div>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Payment Status</h3>
          <div className="space-y-4">
            {stats && Object.entries(stats.paymentsByStatus).map(([status, count]) => (
              <div key={status} className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className={`w-3 h-3 rounded-full mr-3 ${
                    status === 'paid' ? 'bg-green-500' :
                    status === 'pending' ? 'bg-yellow-500' :
                    status === 'overdue' ? 'bg-red-500' :
                    status === 'processing' ? 'bg-blue-500' :
                    status === 'failed' ? 'bg-red-700' :
                    'bg-gray-500'
                  }`}></div>
                  <span className="capitalize">{status}</span>
                </div>
                <span className="font-semibold">{count}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );

  const renderPaymentsTab = () => (
    <div className="space-y-6">
      {/* Filters and Search */}
      <div className="flex flex-col lg:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input
            type="text"
            placeholder="Search by customer, property, payment ID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#C5A572] focus:border-transparent"
          />
        </div>
        
        <div className="flex flex-wrap gap-3">
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#C5A572] focus:border-transparent"
          >
            <option value="all">All Status</option>
            <option value="pending">Pending</option>
            <option value="paid">Paid</option>
            <option value="overdue">Overdue</option>
            <option value="processing">Processing</option>
            <option value="failed">Failed</option>
          </select>
          
          <select
            value={filterMethod}
            onChange={(e) => setFilterMethod(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#C5A572] focus:border-transparent"
          >
            <option value="all">All Methods</option>
            <option value="stripe">Stripe</option>
            <option value="check">Check</option>
            <option value="bank_transfer">Bank Transfer</option>
            <option value="cash">Cash</option>
          </select>
          
          <Button onClick={fetchPayments} size="sm" variant="outline">
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Bulk Actions */}
      {selectedPayments.length > 0 && (
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-600">
              {selectedPayments.length} payment(s) selected
            </p>
            <div className="flex space-x-2">
              <Button size="sm" onClick={() => handleBulkAction('send_reminder')}>
                <Send className="w-3 h-3 mr-1" />
                Send Reminder
              </Button>
              <Button size="sm" variant="outline" onClick={() => handleBulkAction('mark_overdue')}>
                <AlertTriangle className="w-3 h-3 mr-1" />
                Mark Overdue
              </Button>
              <Button size="sm" variant="outline" onClick={() => handleBulkAction('export')}>
                <Download className="w-3 h-3 mr-1" />
                Export
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* Payments Table */}
      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <input
                    type="checkbox"
                    checked={selectedPayments.length === getFilteredPayments().length && getFilteredPayments().length > 0}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedPayments(getFilteredPayments().map(p => p.id));
                      } else {
                        setSelectedPayments([]);
                      }
                    }}
                    className="rounded border-gray-300 text-[#C5A572] focus:ring-[#C5A572]"
                  />
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Payment
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Customer
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Property
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Amount
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Method
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Due Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {getFilteredPayments().map((payment) => (
                <tr key={payment.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <input
                      type="checkbox"
                      checked={selectedPayments.includes(payment.id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedPayments(prev => [...prev, payment.id]);
                        } else {
                          setSelectedPayments(prev => prev.filter(id => id !== payment.id));
                        }
                      }}
                      className="rounded border-gray-300 text-[#C5A572] focus:ring-[#C5A572]"
                    />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">{payment.description}</div>
                      <div className="text-sm text-gray-500">{payment.id}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">
                        {payment.guest.firstName} {payment.guest.lastName}
                      </div>
                      <div className="text-sm text-gray-500">{payment.guest.email}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{payment.property.title}</div>
                    <div className="text-sm text-gray-500">{payment.property.area}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      {payment.amount.toFixed(2)} {payment.currency}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <Badge className={`px-2 py-1 text-xs font-medium border ${
                      payment.status === 'PAID' ? 'text-green-600 bg-green-50 border-green-200' :
                      payment.status === 'PENDING' ? 'text-yellow-600 bg-yellow-50 border-yellow-200' :
                      payment.status === 'OVERDUE' ? 'text-red-600 bg-red-50 border-red-200' :
                      'text-gray-600 bg-gray-50 border-gray-200'
                    }`}>
                      {payment.status}
                    </Badge>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      {payment.paymentMethod === 'STRIPE' && <CreditCard className="w-4 h-4 mr-2 text-blue-500" />}
                      {payment.paymentMethod === 'CHECK' && <FileText className="w-4 h-4 mr-2 text-green-500" />}
                      {payment.paymentMethod === 'BANK_TRANSFER' && <Building className="w-4 h-4 mr-2 text-purple-500" />}
                      {payment.paymentMethod === 'CASH' && <Banknote className="w-4 h-4 mr-2 text-orange-500" />}
                      <span className="text-sm text-gray-900">
                        {payment.paymentMethod.replace('_', ' ')}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {formatDate(payment.dueDate, 'en-US')}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex space-x-2">
                      <Button size="sm" variant="outline">
                        <Eye className="w-3 h-3 mr-1" />
                        View
                      </Button>
                      
                      {payment.paymentMethod === 'CHECK' && payment.status !== 'PAID' && (
                        <Button 
                          size="sm"
                          onClick={() => {
                            setEditingCheck({
                              id: payment.id,
                              checkNumber: '',
                              bankName: payment.checkDetails?.bankName || '',
                              dateReceived: new Date(),
                              amount: payment.amount,
                              verifiedBy: 'Admin',
                              status: 'RECEIVED'
                            });
                            setShowCheckModal(true);
                          }}
                        >
                          <CheckSquare className="w-3 h-3 mr-1" />
                          Process
                        </Button>
                      )}
                      
                      {payment.status !== 'PAID' && (
                        <select
                          value={payment.status}
                          onChange={(e) => handlePaymentStatusUpdate(payment.id, e.target.value as PaymentDetails['status'])}
                          className="text-xs border border-gray-300 rounded px-2 py-1"
                        >
                          <option value="PENDING">Pending</option>
                          <option value="PAID">Paid</option>
                          <option value="OVERDUE">Overdue</option>
                          <option value="FAILED">Failed</option>
                        </select>
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

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Payment Dashboard</h1>
          <p className="text-gray-600">Manage and monitor all platform payments</p>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200 mb-8">
          <nav className="-mb-px flex space-x-8">
            {[
              { key: 'overview', label: 'Overview', icon: BarChart3 },
              { key: 'payments', label: 'All Payments', icon: CreditCard },
              { key: 'checks', label: 'Check Payments', icon: FileText },
              { key: 'reports', label: 'Reports', icon: PieChart },
              { key: 'settings', label: 'Settings', icon: Settings }
            ].map(tab => (
              <button
                key={tab.key}
                onClick={() => navigate(`?tab=${tab.key}`)}
                className={`py-2 px-1 border-b-2 font-medium text-sm flex items-center ${
                  activeTab === tab.key
                    ? 'border-[#C5A572] text-[#C5A572]'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <tab.icon className="w-4 h-4 mr-2" />
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Tab Content */}
        {activeTab === 'overview' && renderOverviewTab()}
        {activeTab === 'payments' && renderPaymentsTab()}
        {activeTab === 'checks' && (
          <div className="text-center py-12">
            <FileText className="w-12 h-12 mx-auto mb-4 text-gray-300" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Check Payments Management</h3>
            <p className="text-gray-600">Feature coming soon...</p>
          </div>
        )}
        {activeTab === 'reports' && (
          <div className="text-center py-12">
            <PieChart className="w-12 h-12 mx-auto mb-4 text-gray-300" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Payment Reports</h3>
            <p className="text-gray-600">Feature coming soon...</p>
          </div>
        )}
        {activeTab === 'settings' && (
          <div className="text-center py-12">
            <Settings className="w-12 h-12 mx-auto mb-4 text-gray-300" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Payment Settings</h3>
            <p className="text-gray-600">Feature coming soon...</p>
          </div>
        )}

        {/* Check Payment Modal */}
        {showCheckModal && editingCheck && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Process Check Payment</h3>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowCheckModal(false)}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Check Number
                  </label>
                  <input
                    type="text"
                    value={editingCheck.checkNumber}
                    onChange={(e) => setEditingCheck(prev => prev ? { ...prev, checkNumber: e.target.value } : null)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#C5A572] focus:border-transparent"
                    placeholder="Enter check number"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Bank Name
                  </label>
                  <input
                    type="text"
                    value={editingCheck.bankName}
                    onChange={(e) => setEditingCheck(prev => prev ? { ...prev, bankName: e.target.value } : null)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#C5A572] focus:border-transparent"
                    placeholder="Enter bank name"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Date Received
                  </label>
                  <input
                    type="date"
                    value={editingCheck.dateReceived.toISOString().split('T')[0]}
                    onChange={(e) => setEditingCheck(prev => prev ? { ...prev, dateReceived: new Date(e.target.value) } : null)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#C5A572] focus:border-transparent"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Amount
                  </label>
                  <input
                    type="number"
                    value={editingCheck.amount}
                    onChange={(e) => setEditingCheck(prev => prev ? { ...prev, amount: Number(e.target.value) } : null)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#C5A572] focus:border-transparent"
                    placeholder="Enter amount"
                    step="0.01"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Verified By
                  </label>
                  <input
                    type="text"
                    value={editingCheck.verifiedBy}
                    onChange={(e) => setEditingCheck(prev => prev ? { ...prev, verifiedBy: e.target.value } : null)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#C5A572] focus:border-transparent"
                    placeholder="Admin name"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Notes (Optional)
                  </label>
                  <textarea
                    value={editingCheck.notes || ''}
                    onChange={(e) => setEditingCheck(prev => prev ? { ...prev, notes: e.target.value } : null)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#C5A572] focus:border-transparent"
                    rows={3}
                    placeholder="Additional notes..."
                  />
                </div>
              </div>
              
              <div className="flex justify-end space-x-3 mt-6">
                <Button
                  variant="outline"
                  onClick={() => setShowCheckModal(false)}
                >
                  Cancel
                </Button>
                <Button
                  onClick={() => handleCheckPaymentUpdate(editingCheck)}
                  disabled={!editingCheck.checkNumber || !editingCheck.bankName}
                >
                  <Save className="w-4 h-4 mr-2" />
                  Save Payment
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminPaymentDashboard; 