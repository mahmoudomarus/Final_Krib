import React, { useState } from 'react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { 
  Calendar, 
  Clock, 
  Users, 
  Building, 
  DollarSign,
  FileText,
  Eye,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Search,
  Filter,
  MoreHorizontal
} from 'lucide-react';
import LongTermRentalManagement from './LongTermRentalManagement';

import BookingsManagement from './BookingsManagement';

interface CombinedBookingManagementProps {}

const CombinedBookingManagement: React.FC<CombinedBookingManagementProps> = () => {
  const [activeTab, setActiveTab] = useState<'short-term' | 'long-term'>('short-term');

  const renderShortTermBookings = () => (
    <BookingsManagement />
  );

  return (
    <div className="space-y-6">
      {/* Tab Navigation */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('short-term')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'short-term'
                ? 'border-primary-500 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <div className="flex items-center">
              <Calendar className="w-4 h-4 mr-2" />
              Short-Term Bookings
            </div>
          </button>
          <button
            onClick={() => setActiveTab('long-term')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'long-term'
                ? 'border-primary-500 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <div className="flex items-center">
              <Building className="w-4 h-4 mr-2" />
              Long-Term Rentals
            </div>
          </button>
        </nav>
      </div>

      {/* Tab Content */}
      {activeTab === 'short-term' && renderShortTermBookings()}
      {activeTab === 'long-term' && <LongTermRentalManagement />}
    </div>
  );
};

export default CombinedBookingManagement; 