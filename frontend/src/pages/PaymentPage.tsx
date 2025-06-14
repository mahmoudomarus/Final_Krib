import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  CreditCard, 
  Clock, 
  Check, 
  X, 
  AlertCircle, 
  Filter,
  Search,
  ChevronDown,
  Copy,
  CheckCircle2,
  XCircle,
  Loader2,
  AlertTriangle,
  DollarSign,
  Banknote,
  Wallet,
  Home,
  MapPin,
  CalendarDays,
  User,
  Shield,
  FileText,
  Eye,
  Info
} from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import api from '../lib/api';
import { formatDate } from '../lib/utils';
import { Booking, Property, User as UserType } from '../types';

interface PaymentDetails {
  id: string;
  bookingId: string;
  amount: number;
  currency: string;
  status: 'PENDING' | 'COMPLETED' | 'FAILED' | 'REFUNDED' | 'PROCESSING' | 'CANCELLED';
  method: 'STRIPE' | 'BANK_TRANSFER' | 'CHECK' | 'CASH';
  stripePaymentId?: string;
  stripePaymentUrl?: string;
  dueDate?: string;
  paidAt?: string;
  description?: string;
  type: 'BOOKING_PAYMENT' | 'SECURITY_DEPOSIT' | 'CLEANING_FEE' | 'ADDITIONAL_CHARGES' | 'REFUND';
  booking?: {
    id: string;
    checkIn: string;
    checkOut: string;
    guests: number;
    status: string;
    property: {
      id: string;
      title: string;
      address: string;
      city: string;
      emirate: string;
      images: string[];
    };
  };
  user?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  checkNumber?: string;
  checkBank?: string;
  checkDate?: string;
  checkStatus?: string;
  adminNotes?: string;
  failureReason?: string;
}

interface PaymentSummary {
  totalAmount: number;
  paidAmount: number;
  pendingAmount: number;
  overdueAmount: number;
  totalPayments: number;
}

const PaymentPage: React.FC = () => {
  const navigate = useNavigate();
  const { bookingId } = useParams<{ bookingId?: string }>();
  
  const [payments, setPayments] = useState<PaymentDetails[]>([]);
  const [selectedPayment, setSelectedPayment] = useState<PaymentDetails | null>(null);
  const [paymentSummary, setPaymentSummary] = useState<PaymentSummary | null>(null);
  const [loading, setLoading] = useState(false);
  const [processingPayment, setProcessingPayment] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchPayments();
  }, [bookingId]);

  useEffect(() => {
    if (bookingId && payments.length > 0) {
      const payment = payments.find(p => p.bookingId === bookingId);
      if (payment) {
        setSelectedPayment(payment);
      }
    }
  }, [bookingId, payments]);

  const fetchPayments = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.getPayments({
        ...(bookingId && { bookingId }),
        page: 1,
        limit: 50
      });

      if (response.success) {
        setPayments(response.data.payments);
        setPaymentSummary(response.data.summary);
      } else {
        setError('Failed to fetch payments');
      }
    } catch (err: any) {
      console.error('Error fetching payments:', err);
      setError(err.message || 'Failed to fetch payments');
    } finally {
      setLoading(false);
    }
  };

  const handleStripePayment = async (payment: PaymentDetails) => {
    setProcessingPayment(payment.id);
    try {
      const response = await api.createStripePayment(payment.id);
      
      if (response.success && response.data.paymentUrl) {
        // Redirect to Stripe payment page
        window.location.href = response.data.paymentUrl;
      } else {
        setError('Failed to create payment link');
      }
    } catch (err: any) {
      console.error('Error creating Stripe payment:', err);
      setError(err.message || 'Failed to create payment link');
    } finally {
      setProcessingPayment(null);
    }
  };

  const handleCheckPayment = async (payment: PaymentDetails, checkData: {
    checkNumber: string;
    bankName: string;
    notes?: string;
  }) => {
    setProcessingPayment(payment.id);
    try {
      const response = await api.submitCheckPayment(payment.id, checkData);
      
      if (response.success) {
        // Refresh payments to show updated status
        await fetchPayments();
        setError(null);
      } else {
        setError('Failed to submit check payment');
      }
    } catch (err: any) {
      console.error('Error submitting check payment:', err);
      setError(err.message || 'Failed to submit check payment');
    } finally {
      setProcessingPayment(null);
    }
  };

  const getStatusColor = (status: PaymentDetails['status']) => {
    switch (status) {
      case 'COMPLETED': return 'bg-green-100 text-green-800';
      case 'PENDING': return 'bg-yellow-100 text-yellow-800';
      case 'PROCESSING': return 'bg-blue-100 text-blue-800';
      case 'FAILED': return 'bg-red-100 text-red-800';
      case 'REFUNDED': return 'bg-gray-100 text-gray-800';
      case 'CANCELLED': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: PaymentDetails['status']) => {
    switch (status) {
      case 'COMPLETED': return <CheckCircle2 className="w-4 h-4" />;
      case 'PENDING': return <Clock className="w-4 h-4" />;
      case 'PROCESSING': return <Loader2 className="w-4 h-4" />;
      case 'FAILED': return <XCircle className="w-4 h-4" />;
      case 'REFUNDED': return <XCircle className="w-4 h-4" />;
      case 'CANCELLED': return <XCircle className="w-4 h-4" />;
      default: return <Clock className="w-4 h-4" />;
    }
  };

  const getPaymentMethodIcon = (method: PaymentDetails['method']) => {
    switch (method) {
      case 'STRIPE': return <CreditCard className="w-4 h-4" />;
      case 'CHECK': return <Check className="w-4 h-4" />;
      case 'BANK_TRANSFER': return <Wallet className="w-4 h-4" />;
      case 'CASH': return <Banknote className="w-4 h-4" />;
      default: return <CreditCard className="w-4 h-4" />;
    }
  };

  const getFilteredPayments = () => {
    if (filterStatus === 'all') return payments;
    return payments.filter(payment => payment.status.toLowerCase() === filterStatus.toLowerCase());
  };

  const copyPaymentLink = (payment: PaymentDetails) => {
    const link = `${window.location.origin}/payments?payment=${payment.id}`;
    navigator.clipboard.writeText(link);
    // You could add a toast notification here
  };

  if (loading && payments.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-center h-64">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
            <span className="ml-2 text-lg text-gray-600">Loading payments...</span>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Error Loading Payments</h3>
              <p className="text-gray-600 mb-4">{error}</p>
              <Button onClick={fetchPayments} className="bg-blue-600 hover:bg-blue-700">
                <Loader2 className="w-4 h-4 mr-2" />
                Try Again
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          {bookingId && (
            <Button
              variant="ghost"
              onClick={() => navigate(`/booking/${bookingId}`)}
              className="mb-4"
            >
              <ChevronDown className="w-4 h-4 mr-2" />
              Back to Booking
            </Button>
          )}
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            {bookingId ? 'Booking Payments' : 'Payment Management'}
          </h1>
          <p className="text-gray-600">
            {bookingId 
              ? 'Manage payments for your booking' 
              : 'View and manage all your payments'
            }
          </p>
        </div>

        {/* Payment Summary */}
        {paymentSummary && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <Card className="p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <DollarSign className="w-8 h-8 text-[#C5A572]" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total Amount</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {paymentSummary.totalAmount.toFixed(2)} AED
                  </p>
                </div>
              </div>
            </Card>
            
            <Card className="p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <CheckCircle2 className="w-8 h-8 text-green-500" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Paid</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {paymentSummary.paidAmount.toFixed(2)} AED
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
                  <p className="text-sm font-medium text-gray-600">Pending</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {paymentSummary.pendingAmount.toFixed(2)} AED
                  </p>
                </div>
              </div>
            </Card>
            
            <Card className="p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <AlertTriangle className="w-8 h-8 text-red-500" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Overdue</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {paymentSummary.overdueAmount.toFixed(2)} AED
                  </p>
                </div>
              </div>
            </Card>
          </div>
        )}

        {/* Filters */}
        <div className="flex flex-col lg:flex-row gap-4 mb-6">
          <div className="flex flex-wrap gap-3">
            {[
              { key: 'all', label: 'All Payments' },
              { key: 'pending', label: 'Pending' },
              { key: 'paid', label: 'Paid' },
              { key: 'overdue', label: 'Overdue' },
              { key: 'processing', label: 'Processing' }
            ].map(filter => (
              <Button
                key={filter.key}
                variant={filterStatus === filter.key ? 'primary' : 'outline'}
                onClick={() => setFilterStatus(filter.key)}
                size="sm"
              >
                {filter.label}
              </Button>
            ))}
          </div>
          
          <div className="lg:ml-auto">
            <Button onClick={fetchPayments} size="sm" variant="outline">
              <Loader2 className="w-4 h-4 mr-2" />
              Refresh
            </Button>
          </div>
        </div>

        {/* Payments List */}
        <div className="space-y-6">
          {getFilteredPayments().map((payment) => (
            <Card key={payment.id} className="p-6 hover:shadow-lg transition-shadow">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-start space-x-4">
                  <div className="flex-shrink-0">
                    <img
                      src={payment.booking?.property.images[0] || '/default-property.jpg'}
                      alt={payment.booking?.property.title || 'Property'}
                      className="w-16 h-16 object-cover rounded-lg"
                    />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-2">
                      <h3 className="text-lg font-semibold text-gray-900">
                        {payment.description}
                      </h3>
                      <Badge className={`px-2 py-1 text-xs font-medium border ${getStatusColor(payment.status)}`}>
                        <div className="flex items-center space-x-1">
                          {getStatusIcon(payment.status)}
                          <span>{payment.status}</span>
                        </div>
                      </Badge>
                    </div>
                    
                    <div className="space-y-1 text-sm text-gray-600">
                      <div className="flex items-center space-x-4">
                        <div className="flex items-center">
                          <Home className="w-4 h-4 mr-1" />
                          <span>{payment.booking?.property.title}</span>
                        </div>
                        <div className="flex items-center">
                          <MapPin className="w-4 h-4 mr-1" />
                          <span>{payment.booking?.property.address}, {payment.booking?.property.city}</span>
                        </div>
                      </div>
                      
                      {payment.booking && (
                        <div className="flex items-center space-x-4">
                          <div className="flex items-center">
                            <CalendarDays className="w-4 h-4 mr-1" />
                            <span>
                              {formatDate(payment.booking.checkIn, 'en-US')} - {formatDate(payment.booking.checkOut, 'en-US')}
                            </span>
                          </div>
                          <div className="flex items-center">
                            <User className="w-4 h-4 mr-1" />
                            <span>{payment.booking.guests} guests</span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                
                <div className="text-right">
                  <p className="text-2xl font-bold text-gray-900 mb-1">
                    {payment.amount.toFixed(2)} {payment.currency}
                  </p>
                  {payment.dueDate && (
                    <p className="text-sm text-gray-600">
                      Due: {formatDate(payment.dueDate, 'en-US')}
                    </p>
                  )}
                  {payment.paidAt && (
                    <p className="text-sm text-green-600">
                      Paid: {formatDate(payment.paidAt, 'en-US')}
                    </p>
                  )}
                </div>
              </div>

              {/* Payment Method and Actions */}
              <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                <div className="flex items-center space-x-4">
                  <div className="flex items-center space-x-2">
                    {getPaymentMethodIcon(payment.method)}
                    <span className="text-sm font-medium text-gray-700">
                      {payment.method.replace('_', ' ')}
                    </span>
                  </div>
                  
                  {payment.stripePaymentId && (
                    <div className="flex items-center space-x-2 text-sm text-gray-600">
                      <Shield className="w-4 h-4" />
                      <span>Stripe ID: {payment.stripePaymentId}</span>
                    </div>
                  )}
                </div>
                
                <div className="flex items-center space-x-2">
                  {/* Payment Actions */}
                  {payment.status === 'PENDING' ? (
                    <div className="flex space-x-2">
                      {payment.method === 'STRIPE' && (
                        <>
                          <Button
                            onClick={() => handleStripePayment(payment)}
                            disabled={processingPayment === payment.id}
                            size="sm"
                          >
                            {processingPayment === payment.id ? (
                              <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                            ) : (
                              <CreditCard className="w-3 h-3 mr-1" />
                            )}
                            Pay Now
                          </Button>
                          
                          <Button
                            onClick={() => copyPaymentLink(payment)}
                            size="sm"
                            variant="outline"
                          >
                            <Copy className="w-3 h-3 mr-1" />
                            Copy Link
                          </Button>
                        </>
                      )}
                      
                      {payment.method === 'CHECK' && (
                        <Button
                          onClick={() => {
                            // Show check payment form
                            const checkNumber = prompt('Enter check number:');
                            const bankName = prompt('Enter bank name:');
                            if (checkNumber && bankName) {
                              handleCheckPayment(payment, { checkNumber, bankName });
                            }
                          }}
                          size="sm"
                        >
                          <FileText className="w-3 h-3 mr-1" />
                          Submit Check
                        </Button>
                      )}
                    </div>
                  ) : (
                    <Button size="sm" variant="outline">
                      <Eye className="w-3 h-3 mr-1" />
                      View Details
                    </Button>
                  )}
                </div>
              </div>

              {/* Admin Notes or Check Details */}
              {(payment.adminNotes || payment.checkNumber) && (
                <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="flex items-start">
                    <Info className="w-4 h-4 text-blue-500 mt-0.5 mr-2 flex-shrink-0" />
                    <div className="text-sm text-blue-700">
                      {payment.adminNotes && (
                        <p className="mb-2">{payment.adminNotes}</p>
                      )}
                      
                      {payment.checkNumber && (
                        <div className="space-y-1">
                          <p><strong>Bank:</strong> {payment.checkBank}</p>
                          <p><strong>Check Number:</strong> {payment.checkNumber}</p>
                          {payment.checkDate && (
                            <p><strong>Date Received:</strong> {formatDate(payment.checkDate, 'en-US')}</p>
                          )}
                          <p><strong>Status:</strong> {payment.checkStatus}</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </Card>
          ))}
          
          {getFilteredPayments().length === 0 && (
            <Card className="p-8 text-center">
              <CreditCard className="w-12 h-12 mx-auto mb-4 text-gray-300" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No payments found</h3>
              <p className="text-gray-600">
                {filterStatus === 'all' 
                  ? 'No payments available for this selection.' 
                  : `No ${filterStatus} payments found.`
                }
              </p>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default PaymentPage; 