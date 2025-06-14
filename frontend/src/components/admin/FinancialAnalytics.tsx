import React, { useState, useEffect } from 'react';
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Users,
  Building,
  CreditCard,
  Download,
  RefreshCw,
  Target,
  Activity
} from 'lucide-react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { apiService } from '../../services/api';
import { formatCurrency } from '../../lib/utils';
import Plot from 'react-plotly.js';

interface AnalyticsData {
  revenueAnalytics: {
    totalRevenue: number;
    monthlyGrowth: number;
    yearlyGrowth: number;
    revenueByMonth: { month: string; revenue: number; transactions: number }[];
    revenueByProperty: { property: string; revenue: number; bookings: number }[];
    revenueByHost: { host: string; revenue: number; commission: number }[];
    revenueByLocation: { city: string; emirate: string; revenue: number }[];
  };
  transactionAnalytics: {
    totalTransactions: number;
    averageTransactionValue: number;
    transactionsByType: { type: string; count: number; amount: number }[];
    transactionsByStatus: { status: string; count: number; percentage: number }[];
    paymentMethodBreakdown: { method: string; count: number; amount: number; percentage: number }[];
    failureRate: number;
    processingTime: { average: number; median: number };
  };
  hostAnalytics: {
    totalHosts: number;
    activeHosts: number;
    topPerformingHosts: { host: string; revenue: number; properties: number; rating: number }[];
    hostCommissionBreakdown: { host: string; totalEarnings: number; commission: number; netEarnings: number }[];
    newHostsThisMonth: number;
  };
  propertyAnalytics: {
    totalProperties: number;
    revenuePerProperty: number;
    topPerformingProperties: { property: string; revenue: number; bookings: number; occupancyRate: number }[];
    propertyTypeBreakdown: { type: string; count: number; revenue: number; avgPrice: number }[];
    locationPerformance: { location: string; properties: number; revenue: number; avgBookingValue: number }[];
  };
  customerAnalytics: {
    totalCustomers: number;
    repeatCustomers: number;
    customerLifetimeValue: number;
    customersByLocation: { location: string; count: number; totalSpent: number }[];
    bookingFrequency: { frequency: string; count: number; percentage: number }[];
  };
  stripeAnalytics: {
    stripeRevenue: number;
    stripeTransactions: number;
    stripeFailureRate: number;
    averageProcessingTime: number;
    chargebackRate: number;
    refundRate: number;
  };
}

interface DateRange {
  start: string;
  end: string;
  label: string;
}

const FinancialAnalytics: React.FC = () => {
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedDateRange, setSelectedDateRange] = useState<DateRange>({
    start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    end: new Date().toISOString().split('T')[0],
    label: 'Last 30 Days'
  });
  const [activeView, setActiveView] = useState<'overview' | 'revenue' | 'transactions' | 'hosts' | 'properties' | 'customers'>('overview');

  const dateRanges: DateRange[] = [
    {
      start: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      end: new Date().toISOString().split('T')[0],
      label: 'Last 7 Days'
    },
    {
      start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      end: new Date().toISOString().split('T')[0],
      label: 'Last 30 Days'
    },
    {
      start: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      end: new Date().toISOString().split('T')[0],
      label: 'Last 90 Days'
    },
    {
      start: new Date(new Date().getFullYear(), 0, 1).toISOString().split('T')[0],
      end: new Date().toISOString().split('T')[0],
      label: 'This Year'
    }
  ];

  useEffect(() => {
    fetchAnalyticsData();
  }, [selectedDateRange]);

  const fetchAnalyticsData = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        startDate: selectedDateRange.start,
        endDate: selectedDateRange.end
      });

      const response = await apiService.get(`/super-admin/analytics/financial?${params}`) as { data: AnalyticsData };
      setAnalyticsData(response.data);
    } catch (error) {
      console.error('Error fetching analytics data:', error);
      // Set realistic mock data for development
      setAnalyticsData({
        revenueAnalytics: {
          totalRevenue: 125000,
          monthlyGrowth: 15.2,
          yearlyGrowth: 45.8,
          revenueByMonth: [
            { month: 'Jan', revenue: 8500, transactions: 45 },
            { month: 'Feb', revenue: 12000, transactions: 62 },
            { month: 'Mar', revenue: 15500, transactions: 78 },
            { month: 'Apr', revenue: 18200, transactions: 89 },
            { month: 'May', revenue: 22000, transactions: 105 },
            { month: 'Jun', revenue: 25500, transactions: 125 }
          ],
          revenueByProperty: [
            { property: 'Marina Heights Apartment', revenue: 15000, bookings: 25 },
            { property: 'Downtown Villa', revenue: 12500, bookings: 18 },
            { property: 'JBR Beach Studio', revenue: 10200, bookings: 32 }
          ],
          revenueByHost: [
            { host: 'Ahmed Al-Rashid', revenue: 25000, commission: 3750 },
            { host: 'Sarah Johnson', revenue: 18500, commission: 2775 },
            { host: 'Mohammed Hassan', revenue: 15200, commission: 2280 }
          ],
          revenueByLocation: [
            { city: 'Dubai', emirate: 'Dubai', revenue: 85000 },
            { city: 'Abu Dhabi', emirate: 'Abu Dhabi', revenue: 25000 },
            { city: 'Sharjah', emirate: 'Sharjah', revenue: 15000 }
          ]
        },
        transactionAnalytics: {
          totalTransactions: 1250,
          averageTransactionValue: 850,
          transactionsByType: [
            { type: 'Booking Payment', count: 450, amount: 380000 },
            { type: 'Host Payout', count: 320, amount: 285000 },
            { type: 'Platform Fee', count: 450, amount: 57000 },
            { type: 'Refund', count: 30, amount: 25000 }
          ],
          transactionsByStatus: [
            { status: 'Completed', count: 1100, percentage: 88 },
            { status: 'Pending', count: 85, percentage: 6.8 },
            { status: 'Failed', count: 45, percentage: 3.6 },
            { status: 'Cancelled', count: 20, percentage: 1.6 }
          ],
          paymentMethodBreakdown: [
            { method: 'Credit Card', count: 750, amount: 650000, percentage: 60 },
            { method: 'Bank Transfer', count: 300, amount: 280000, percentage: 24 },
            { method: 'Digital Wallet', count: 150, amount: 125000, percentage: 12 },
            { method: 'Cash', count: 50, amount: 45000, percentage: 4 }
          ],
          failureRate: 3.6,
          processingTime: { average: 2.5, median: 1.8 }
        },
        hostAnalytics: {
          totalHosts: 85,
          activeHosts: 72,
          topPerformingHosts: [
            { host: 'Ahmed Al-Rashid', revenue: 25000, properties: 3, rating: 4.9 },
            { host: 'Sarah Johnson', revenue: 18500, properties: 2, rating: 4.8 },
            { host: 'Mohammed Hassan', revenue: 15200, properties: 4, rating: 4.7 }
          ],
          hostCommissionBreakdown: [
            { host: 'Ahmed Al-Rashid', totalEarnings: 25000, commission: 3750, netEarnings: 21250 },
            { host: 'Sarah Johnson', totalEarnings: 18500, commission: 2775, netEarnings: 15725 }
          ],
          newHostsThisMonth: 8
        },
        propertyAnalytics: {
          totalProperties: 156,
          revenuePerProperty: 1850,
          topPerformingProperties: [
            { property: 'Marina Heights Apartment', revenue: 15000, bookings: 25, occupancyRate: 85 },
            { property: 'Downtown Villa', revenue: 12500, bookings: 18, occupancyRate: 78 },
            { property: 'JBR Beach Studio', revenue: 10200, bookings: 32, occupancyRate: 92 }
          ],
          propertyTypeBreakdown: [
            { type: 'Apartment', count: 85, revenue: 450000, avgPrice: 850 },
            { type: 'Villa', count: 35, revenue: 380000, avgPrice: 1200 },
            { type: 'Studio', count: 25, revenue: 180000, avgPrice: 650 },
            { type: 'Townhouse', count: 11, revenue: 125000, avgPrice: 950 }
          ],
          locationPerformance: [
            { location: 'Dubai Marina', properties: 45, revenue: 385000, avgBookingValue: 950 },
            { location: 'Downtown Dubai', properties: 28, revenue: 285000, avgBookingValue: 1100 },
            { location: 'JBR', properties: 22, revenue: 195000, avgBookingValue: 750 }
          ]
        },
        customerAnalytics: {
          totalCustomers: 2850,
          repeatCustomers: 1250,
          customerLifetimeValue: 1850,
          customersByLocation: [
            { location: 'UAE', count: 1200, totalSpent: 850000 },
            { location: 'Saudi Arabia', count: 450, totalSpent: 385000 },
            { location: 'UK', count: 350, totalSpent: 295000 },
            { location: 'India', count: 280, totalSpent: 185000 }
          ],
          bookingFrequency: [
            { frequency: 'First Time', count: 1600, percentage: 56.1 },
            { frequency: '2-3 Times', count: 850, percentage: 29.8 },
            { frequency: '4-6 Times', count: 280, percentage: 9.8 },
            { frequency: '7+ Times', count: 120, percentage: 4.2 }
          ]
        },
        stripeAnalytics: {
          stripeRevenue: 750000,
          stripeTransactions: 890,
          stripeFailureRate: 2.1,
          averageProcessingTime: 1.2,
          chargebackRate: 0.3,
          refundRate: 1.8
        }
      });
    } finally {
      setLoading(false);
    }
  };

  const renderOverviewTab = () => (
    <div className="space-y-6">
      {/* Key Metrics Cards */}
      {analyticsData && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Revenue</p>
                <p className="text-3xl font-bold">{formatCurrency(analyticsData.revenueAnalytics.totalRevenue)}</p>
                <div className={`flex items-center mt-2 ${analyticsData.revenueAnalytics.monthlyGrowth >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {analyticsData.revenueAnalytics.monthlyGrowth >= 0 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                  <span className="text-sm ml-1">{Math.abs(analyticsData.revenueAnalytics.monthlyGrowth).toFixed(1)}% vs last period</span>
                </div>
              </div>
              <div className="p-3 bg-green-100 rounded-full">
                <DollarSign className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Transactions</p>
                <p className="text-3xl font-bold">{analyticsData.transactionAnalytics.totalTransactions.toLocaleString()}</p>
                <div className="flex items-center mt-2 text-blue-600">
                  <Activity className="w-4 h-4" />
                  <span className="text-sm ml-1">Avg: {formatCurrency(analyticsData.transactionAnalytics.averageTransactionValue)}</span>
                </div>
              </div>
              <div className="p-3 bg-blue-100 rounded-full">
                <CreditCard className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Active Hosts</p>
                <p className="text-3xl font-bold">{analyticsData.hostAnalytics.activeHosts}</p>
                <div className="flex items-center mt-2 text-purple-600">
                  <Users className="w-4 h-4" />
                  <span className="text-sm ml-1">+{analyticsData.hostAnalytics.newHostsThisMonth} this month</span>
                </div>
              </div>
              <div className="p-3 bg-purple-100 rounded-full">
                <Users className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Properties</p>
                <p className="text-3xl font-bold">{analyticsData.propertyAnalytics.totalProperties}</p>
                <div className="flex items-center mt-2 text-orange-600">
                  <Building className="w-4 h-4" />
                  <span className="text-sm ml-1">Avg: {formatCurrency(analyticsData.propertyAnalytics.revenuePerProperty)}/property</span>
                </div>
              </div>
              <div className="p-3 bg-orange-100 rounded-full">
                <Building className="w-6 h-6 text-orange-600" />
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Revenue Trend Chart */}
      {analyticsData && (
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Revenue Trend</h3>
          <Plot
            data={[
              {
                x: analyticsData.revenueAnalytics.revenueByMonth.map(item => item.month),
                y: analyticsData.revenueAnalytics.revenueByMonth.map(item => item.revenue),
                type: 'scatter' as const,
                mode: 'lines+markers' as const,
                name: 'Revenue (AED)',
                line: { color: '#3B82F6', width: 3 },
                marker: { size: 8, color: '#3B82F6' },
                hovertemplate: '<b>%{x}</b><br>Revenue: AED %{y:,.0f}<extra></extra>'
              },
              {
                x: analyticsData.revenueAnalytics.revenueByMonth.map(item => item.month),
                y: analyticsData.revenueAnalytics.revenueByMonth.map(item => item.transactions),
                type: 'scatter' as const,
                mode: 'lines+markers' as const,
                name: 'Transactions',
                yaxis: 'y2',
                line: { color: '#10B981', width: 2 },
                marker: { size: 6, color: '#10B981' },
                hovertemplate: '<b>%{x}</b><br>Transactions: %{y}<extra></extra>'
              }
            ] as any}
            layout={{
              xaxis: { 
                title: { text: 'Month' },
                showgrid: true,
                gridcolor: '#f3f4f6'
              },
              yaxis: { 
                title: { text: 'Revenue (AED)' }, 
                side: 'left',
                showgrid: true,
                gridcolor: '#f3f4f6',
                tickformat: ',.0f'
              },
              yaxis2: { 
                title: { text: 'Transactions' }, 
                side: 'right', 
                overlaying: 'y',
                showgrid: false
              },
              showlegend: true,
              height: 400,
              margin: { t: 20, r: 80, b: 60, l: 80 },
              plot_bgcolor: 'rgba(0,0,0,0)',
              paper_bgcolor: 'rgba(0,0,0,0)',
              font: { family: 'Inter, sans-serif', size: 12 }
            } as any}
            config={{ 
              displayModeBar: true,
              modeBarButtonsToRemove: ['pan2d', 'lasso2d', 'select2d'],
              displaylogo: false
            }}
            style={{ width: '100%' }}
          />
        </Card>
      )}

      {/* Payment Methods & Transaction Status - Interactive Plotly Charts */}
      {analyticsData && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Payment Methods Distribution</h3>
            <Plot
              data={[
                {
                  values: analyticsData.transactionAnalytics.paymentMethodBreakdown.map(method => method.percentage),
                  labels: analyticsData.transactionAnalytics.paymentMethodBreakdown.map(method => method.method),
                  type: 'pie' as const,
                  hole: 0.4,
                  marker: {
                    colors: ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6']
                  },
                  textinfo: 'label+percent',
                  textposition: 'auto',
                  hovertemplate: '<b>%{label}</b><br>Amount: AED %{customdata:,.0f}<br>Percentage: %{percent}<extra></extra>',
                  customdata: analyticsData.transactionAnalytics.paymentMethodBreakdown.map(method => method.amount)
                }
              ]}
              layout={{
                showlegend: false,
                height: 350,
                margin: { t: 20, r: 20, b: 20, l: 20 },
                plot_bgcolor: 'rgba(0,0,0,0)',
                paper_bgcolor: 'rgba(0,0,0,0)',
                font: { family: 'Inter, sans-serif', size: 12 }
              }}
              config={{ 
                displayModeBar: false,
                displaylogo: false
              }}
              style={{ width: '100%' }}
            />
          </Card>

          <Card className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Transaction Status Breakdown</h3>
            <Plot
              data={[
                {
                  x: analyticsData.transactionAnalytics.transactionsByStatus.map(status => status.status),
                  y: analyticsData.transactionAnalytics.transactionsByStatus.map(status => status.count),
                  type: 'bar' as const,
                  marker: {
                    color: analyticsData.transactionAnalytics.transactionsByStatus.map((_, index) => 
                      ['#10B981', '#F59E0B', '#EF4444', '#6B7280'][index] || '#6B7280'
                    )
                  },
                  hovertemplate: '<b>%{x}</b><br>Count: %{y}<br>Percentage: %{customdata}%<extra></extra>',
                  customdata: analyticsData.transactionAnalytics.transactionsByStatus.map(status => status.percentage)
                }
              ]}
              layout={{
                xaxis: { 
                  title: { text: 'Status' },
                  showgrid: false
                },
                yaxis: { 
                  title: { text: 'Transaction Count' },
                  showgrid: true,
                  gridcolor: '#f3f4f6'
                },
                showlegend: false,
                height: 350,
                margin: { t: 20, r: 20, b: 60, l: 60 },
                plot_bgcolor: 'rgba(0,0,0,0)',
                paper_bgcolor: 'rgba(0,0,0,0)',
                font: { family: 'Inter, sans-serif', size: 12 }
              }}
              config={{ 
                displayModeBar: false,
                displaylogo: false
              }}
              style={{ width: '100%' }}
            />
          </Card>
        </div>
      )}

      {/* Top Performers */}
      {analyticsData && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Top Performing Hosts</h3>
            <div className="space-y-4">
              {analyticsData.hostAnalytics.topPerformingHosts.map((host, index) => (
                <div key={index} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                      <span className="text-sm font-medium text-blue-600">{index + 1}</span>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">{host.host}</p>
                      <p className="text-xs text-gray-500">{host.properties} properties • ⭐ {host.rating}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium">{formatCurrency(host.revenue)}</p>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          <Card className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Top Performing Properties</h3>
            <div className="space-y-4">
              {analyticsData.propertyAnalytics.topPerformingProperties.map((property, index) => (
                <div key={index} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                      <span className="text-sm font-medium text-green-600">{index + 1}</span>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">{property.property}</p>
                      <p className="text-xs text-gray-500">{property.bookings} bookings • {property.occupancyRate}% occupancy</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium">{formatCurrency(property.revenue)}</p>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}
    </div>
  );

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-32 bg-gray-200 rounded"></div>
            ))}
          </div>
          <div className="h-64 bg-gray-200 rounded mb-6"></div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="h-64 bg-gray-200 rounded"></div>
            <div className="h-64 bg-gray-200 rounded"></div>
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
          <h2 className="text-2xl font-bold text-gray-900">Financial Analytics</h2>
          <p className="text-gray-600">Comprehensive financial insights and performance metrics</p>
        </div>
        <div className="flex items-center space-x-3">
          <select
            value={selectedDateRange.label}
            onChange={(e) => {
              const range = dateRanges.find(r => r.label === e.target.value);
              if (range) setSelectedDateRange(range);
            }}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            {dateRanges.map((range) => (
              <option key={range.label} value={range.label}>
                {range.label}
              </option>
            ))}
          </select>
          <Button onClick={fetchAnalyticsData} variant="outline">
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
            { id: 'overview', label: 'Overview', icon: BarChart3 },
            { id: 'revenue', label: 'Revenue', icon: DollarSign },
            { id: 'transactions', label: 'Transactions', icon: CreditCard },
            { id: 'hosts', label: 'Hosts', icon: Users },
            { id: 'properties', label: 'Properties', icon: Building },
            { id: 'customers', label: 'Customers', icon: Target }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveView(tab.id as any)}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeView === tab.id
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
      {activeView === 'overview' && renderOverviewTab()}
      {/* Additional tabs would be implemented here */}
    </div>
  );
};

export default FinancialAnalytics; 