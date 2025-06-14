import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Dialog } from '../../components/ui/Dialog';
import { CalendarSettings } from '../../components/calendar/CalendarSettings';
import { BlockDates } from '../../components/calendar/BlockDates';
import { 
  Calendar,
  ChevronLeft,
  ChevronRight,
  Plus,
  Settings,
  Eye,
  EyeOff,
  Clock,
  DollarSign,
  Users,
  Home,
  ArrowLeft
} from 'lucide-react';
import { formatCurrency } from '../../lib/utils';
import { apiService } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';

interface CalendarDay {
  date: Date;
  isCurrentMonth: boolean;
  isToday: boolean;
  isAvailable: boolean;
  price?: number;
  bookingId?: string;
  guestName?: string;
  status?: 'confirmed' | 'pending' | 'blocked';
  checkIn?: boolean;
  checkOut?: boolean;
  blockReason?: string;
}

const CalendarManagementPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedProperty, setSelectedProperty] = useState<any>(null);
  const [properties, setProperties] = useState<any[]>([]);
  const [calendarData, setCalendarData] = useState<CalendarDay[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [showPricing, setShowPricing] = useState(true);
  const [loading, setLoading] = useState(true);
  const [bookings, setBookings] = useState<any[]>([]);
  const [earnings, setEarnings] = useState(0);
  const [occupancyRate, setOccupancyRate] = useState(0);
  const [showSettingsDialog, setShowSettingsDialog] = useState(false);
  const [showBlockDatesDialog, setShowBlockDatesDialog] = useState(false);
  const [calendarSettings, setCalendarSettings] = useState({
    showPricing: true,
    defaultPrice: 0,
    minimumStay: 1,
    maximumStay: 30,
    advanceBooking: 365,
    checkInTime: '15:00',
    checkOutTime: '11:00',
    instantBooking: false
  });
  const [blockedDates, setBlockedDates] = useState<string[]>([]);

  useEffect(() => {
    fetchProperties();
  }, []);

  useEffect(() => {
    if (selectedProperty) {
      generateCalendar();
      fetchBookings();
      updateStats();
      // Initialize calendar settings from property data
      if (selectedProperty.basePrice) {
        setCalendarSettings(prev => ({
          ...prev,
          defaultPrice: selectedProperty.basePrice
        }));
      }
    }
  }, [currentDate, selectedProperty]);

  const updateStats = async () => {
    const monthEarnings = await getEarningsForMonth();
    const monthOccupancy = await getOccupancyRate();
    setEarnings(monthEarnings);
    setOccupancyRate(monthOccupancy);
  };

  const fetchProperties = async () => {
    try {
      setLoading(true);
      const response = await apiService.getHostProperties() as any;
      
      if (response && Array.isArray(response) && response.length > 0) {
        setProperties(response);
        setSelectedProperty(response[0]);
      } else if (response && response.properties && Array.isArray(response.properties)) {
        setProperties(response.properties);
        if (response.properties.length > 0) {
          setSelectedProperty(response.properties[0]);
        }
      }
    } catch (error) {
      console.error('Error fetching properties:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchBookings = async () => {
    if (!selectedProperty) return;
    
    try {
      const response = await apiService.getBookings({ 
        hostId: user?.id,
        propertyId: selectedProperty?.id 
      }) as any;
      
      if (response && response.bookings && Array.isArray(response.bookings)) {
        setBookings(response.bookings);
      } else if (response && Array.isArray(response)) {
        setBookings(response);
      }
    } catch (error) {
      console.error('Error fetching bookings:', error);
    }
  };

  const generateCalendar = async () => {
    if (!selectedProperty) return;

    try {
      const year = currentDate.getFullYear();
      const month = currentDate.getMonth();
      
      const response = await apiService.getCalendar(selectedProperty.id, year, month) as any;
      
      if (response && response.calendar && Array.isArray(response.calendar)) {
        // Convert the backend calendar data to frontend format
        const calendarDays = response.calendar.map((day: any) => ({
          date: new Date(day.date),
          isCurrentMonth: day.isCurrentMonth,
          isToday: day.isToday,
          isAvailable: day.isAvailable,
          price: day.price,
          bookingId: day.bookingId,
          guestName: day.guestName,
          status: day.status,
          checkIn: day.checkIn,
          checkOut: day.checkOut,
          blockReason: day.blockReason
        }));
        
        setCalendarData(calendarDays);
        
        // Extract blocked dates for the BlockDates component
        const blocked = response.calendar
          .filter((day: any) => day.status === 'blocked')
          .map((day: any) => day.date);
        setBlockedDates(blocked);
      } else {
        // Fallback to client-side generation if API response is unexpected
        generateCalendarFallback();
      }
    } catch (error) {
      console.error('Error generating calendar:', error);
      // Fallback to client-side generation if API fails
      generateCalendarFallback();
    }
  };

  const generateCalendarFallback = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    
    // Get first day of the month
    const firstDay = new Date(year, month, 1);
    
    // Get first day of the calendar (including previous month days)
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - firstDay.getDay());
    
    // Generate 42 days (6 weeks)
    const days: CalendarDay[] = [];
    const today = new Date();
    
    for (let i = 0; i < 42; i++) {
      const date = new Date(startDate);
      date.setDate(startDate.getDate() + i);
      
      const isCurrentMonth = date.getMonth() === month;
      const isToday = date.toDateString() === today.toDateString();
      
      // Check if date has bookings
      const dayBooking = bookings.find(booking => {
        const checkIn = new Date(booking.checkIn || booking.checkInDate);
        const checkOut = new Date(booking.checkOut || booking.checkOutDate);
        return date >= checkIn && date < checkOut;
      });
      
      days.push({
        date,
        isCurrentMonth,
        isToday,
        isAvailable: !dayBooking && date >= today,
        price: selectedProperty?.basePrice || 0,
        bookingId: dayBooking?.id,
        guestName: dayBooking?.guestName || (dayBooking?.guest ? `${dayBooking.guest.firstName} ${dayBooking.guest.lastName}` : null),
        status: dayBooking?.status?.toLowerCase() || (date < today ? 'blocked' : undefined),
        checkIn: dayBooking && date.toDateString() === new Date(dayBooking.checkIn || dayBooking.checkInDate).toDateString(),
        checkOut: dayBooking && date.toDateString() === new Date(dayBooking.checkOut || dayBooking.checkOutDate).toDateString(),
      });
    }
    
    setCalendarData(days);
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    const newDate = new Date(currentDate);
    newDate.setMonth(currentDate.getMonth() + (direction === 'next' ? 1 : -1));
    setCurrentDate(newDate);
  };

  const getMonthYear = () => {
    return currentDate.toLocaleDateString('en-US', { 
      month: 'long', 
      year: 'numeric' 
    });
  };

  const getDayStatusColor = (day: CalendarDay) => {
    if (!day.isCurrentMonth) return 'text-gray-300';
    if (day.isToday) return 'bg-blue-500 text-white';
    if (day.bookingId) {
      if (day.status === 'confirmed') return 'bg-green-500 text-white';
      if (day.status === 'pending') return 'bg-yellow-500 text-white';
    }
    if (!day.isAvailable) return 'bg-gray-200 text-gray-500';
    return 'hover:bg-gray-100';
  };

  const handleDateClick = (day: CalendarDay) => {
    if (!day.isCurrentMonth) return;
    
      setSelectedDate(day.date);
    
    // Handle right-click or ctrl+click for quick block/unblock
    // Note: For mobile, we'll use a long press later
  };

  const handleDateRightClick = (e: React.MouseEvent, day: CalendarDay) => {
    e.preventDefault();
    if (!day.isCurrentMonth || !selectedProperty) return;
    
    handleDateBlockToggle(day);
  };

  const getEarningsForMonth = async (): Promise<number> => {
    if (!selectedProperty) return 0;
    
    try {
      const response = await apiService.getPropertyStats(
        selectedProperty.id, 
        currentDate.getFullYear(), 
        currentDate.getMonth()
      ) as any;
      
      return response?.totalEarnings || 0;
    } catch (error) {
      console.error('Error fetching earnings:', error);
      // Fallback calculation
      const monthBookings = bookings.filter(booking => {
        const checkIn = new Date(booking.checkIn || booking.checkInDate);
        return checkIn.getMonth() === currentDate.getMonth() && 
               checkIn.getFullYear() === currentDate.getFullYear() &&
               (booking.status === 'CONFIRMED' || booking.status === 'COMPLETED');
      });
      
      return monthBookings.reduce((sum, booking) => sum + (booking.totalAmount || 0), 0);
    }
  };

  const getOccupancyRate = async (): Promise<number> => {
    if (!selectedProperty) return 0;
    
    try {
      const response = await apiService.getPropertyStats(
        selectedProperty.id, 
        currentDate.getFullYear(), 
        currentDate.getMonth()
      ) as any;
      
      return response?.occupancyRate || 0;
    } catch (error) {
      console.error('Error fetching occupancy rate:', error);
      // Fallback calculation
      const daysInMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate();
      const bookedDays = bookings.filter(booking => {
        const checkIn = new Date(booking.checkIn || booking.checkInDate);
        const checkOut = new Date(booking.checkOut || booking.checkOutDate);
        return checkIn.getMonth() === currentDate.getMonth() && 
               checkIn.getFullYear() === currentDate.getFullYear();
      }).reduce((sum, booking) => {
        const checkIn = new Date(booking.checkIn || booking.checkInDate);
        const checkOut = new Date(booking.checkOut || booking.checkOutDate);
        const nights = Math.ceil((checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24));
        return sum + nights;
      }, 0);
      
      return Math.round((bookedDays / daysInMonth) * 100);
    }
  };

  const handleBlockDates = async (dates: string[], reason?: string) => {
    if (!selectedProperty) return;
    
    try {
      await apiService.blockDates(selectedProperty.id, dates, reason);
      // Refresh calendar
      generateCalendar();
    } catch (error) {
      console.error('Error blocking dates:', error);
    }
  };

  const handleUnblockDates = async (dates: string[]) => {
    if (!selectedProperty) return;
    
    try {
      await apiService.unblockDates(selectedProperty.id, dates);
      // Refresh calendar
      generateCalendar();
    } catch (error) {
      console.error('Error unblocking dates:', error);
    }
  };

  const handleSaveSettings = async (newSettings: any) => {
    try {
      // Update local state
      setCalendarSettings(newSettings);
      setShowPricing(newSettings.showPricing);
      
      // TODO: Implement API call to save calendar settings to backend
      // await apiService.updatePropertySettings(selectedProperty.id, newSettings);
      
      setShowSettingsDialog(false);
      
      // Show success message
      alert('Calendar settings saved successfully!');
    } catch (error) {
      console.error('Error saving calendar settings:', error);
      alert('Error saving settings. Please try again.');
    }
  };

  const handleBlockDatesSubmit = async (dates: string[], reason: string) => {
    try {
      await handleBlockDates(dates, reason);
      setShowBlockDatesDialog(false);
      
      // Show success message
      alert(`Successfully blocked ${dates.length} date${dates.length !== 1 ? 's' : ''}!`);
    } catch (error) {
      console.error('Error blocking dates:', error);
      throw error; // Re-throw to be handled by BlockDates component
    }
  };

  const handleDateBlockToggle = async (day: any) => {
    if (!selectedProperty || !day.isCurrentMonth) return;
    
    const dateString = day.date.toISOString().split('T')[0];
    
    if (day.status === 'blocked') {
      // Unblock the date
      await handleUnblockDates([dateString]);
    } else if (day.isAvailable) {
      // Block the date
      const reason = prompt('Please provide a reason for blocking this date:');
      if (reason) {
        await handleBlockDates([dateString], reason);
      }
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary-600"></div>
          <p className="mt-4 text-gray-600">Loading calendar...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button
                variant="ghost"
                onClick={() => navigate('/host')}
                leftIcon={<ArrowLeft className="w-4 h-4" />}
              >
                Back to Dashboard
              </Button>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Calendar Management</h1>
                <p className="text-gray-600 mt-1">Manage availability and pricing for your properties</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <Button 
                variant="outline" 
                leftIcon={<Settings className="w-4 h-4" />}
                onClick={() => setShowSettingsDialog(true)}
              >
                Settings
              </Button>
              <Button 
                variant="outline" 
                leftIcon={<Plus className="w-4 h-4" />}
                onClick={() => setShowBlockDatesDialog(true)}
              >
                Block Dates
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Property Selector */}
          <div className="lg:col-span-1">
            <Card padding="lg">
              <h3 className="text-lg font-semibold mb-4">Select Property</h3>
              <div className="space-y-3">
                {properties.map((property) => (
                  <div
                    key={property.id}
                    onClick={() => setSelectedProperty(property)}
                    className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                      selectedProperty?.id === property.id
                        ? 'border-primary-500 bg-primary-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="font-medium text-gray-900 truncate">{property.title}</div>
                    <div className="text-sm text-gray-600 flex items-center mt-1">
                      <Home className="w-4 h-4 mr-1" />
                      {property.city}, {property.emirate}
                    </div>
                    <div className="text-sm text-primary-600 mt-1">
                      {formatCurrency(property.basePrice)}/night
                    </div>
                  </div>
                ))}
              </div>

              {/* Month Stats */}
              {selectedProperty && (
                <div className="mt-6 space-y-4">
                  <h4 className="font-semibold text-gray-900">This Month</h4>
                  
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-gray-600">Total Earnings</span>
                      <DollarSign className="w-4 h-4 text-green-600" />
                    </div>
                    <div className="text-xl font-bold text-gray-900">
                      {formatCurrency(earnings)}
                    </div>
                  </div>

                  <div className="bg-gray-50 p-3 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-gray-600">Occupancy Rate</span>
                      <Calendar className="w-4 h-4 text-blue-600" />
                    </div>
                    <div className="text-xl font-bold text-gray-900">
                      {occupancyRate}%
                    </div>
                  </div>

                  <div className="bg-gray-50 p-3 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-gray-600">Bookings</span>
                      <Users className="w-4 h-4 text-purple-600" />
                    </div>
                    <div className="text-xl font-bold text-gray-900">
                      {bookings.filter(b => {
                        const checkIn = new Date(b.checkInDate);
                        return checkIn.getMonth() === currentDate.getMonth() && 
                               checkIn.getFullYear() === currentDate.getFullYear();
                      }).length}
                    </div>
                  </div>
                </div>
              )}
            </Card>
          </div>

          {/* Calendar */}
          <div className="lg:col-span-3">
            <Card padding="lg">
              {/* Calendar Header */}
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center space-x-4">
                  <h2 className="text-2xl font-bold text-gray-900">{getMonthYear()}</h2>
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => navigateMonth('prev')}
                      leftIcon={<ChevronLeft className="w-4 h-4" />}
                    />
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => navigateMonth('next')}
                      leftIcon={<ChevronRight className="w-4 h-4" />}
                    />
                  </div>
                </div>
                
                <div className="flex items-center space-x-4">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowPricing(!showPricing)}
                    leftIcon={showPricing ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  >
                    {showPricing ? 'Hide' : 'Show'} Pricing
                  </Button>
                </div>
              </div>

              {/* Legend */}
              <div className="mb-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-6 text-sm">
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 bg-green-500 rounded"></div>
                  <span>Booked</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 bg-yellow-500 rounded"></div>
                  <span>Pending</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 bg-gray-200 rounded"></div>
                  <span>Blocked</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 border-2 border-gray-300 rounded"></div>
                  <span>Available</span>
                    </div>
                  </div>
                  
                  <div className="text-xs text-gray-500 bg-gray-50 px-3 py-2 rounded-lg">
                    💡 Right-click on any date to quickly block/unblock it
                  </div>
                </div>
              </div>

              {/* Calendar Grid */}
              <div className="grid grid-cols-7 gap-1">
                {/* Day Headers */}
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
                  <div key={day} className="p-2 text-center text-sm font-semibold text-gray-600">
                    {day}
                  </div>
                ))}

                {/* Calendar Days */}
                {calendarData.map((day, index) => (
                  <div
                    key={index}
                    onClick={() => handleDateClick(day)}
                    onContextMenu={(e) => handleDateRightClick(e, day)}
                    className={`
                      p-2 min-h-[80px] border border-gray-200 cursor-pointer transition-colors
                      ${getDayStatusColor(day)}
                      ${selectedDate?.toDateString() === day.date.toDateString() ? 'ring-2 ring-primary-500' : ''}
                    `}
                    title={
                      day.isCurrentMonth 
                        ? day.status === 'blocked' 
                          ? `Blocked: ${day.blockReason || 'No reason provided'}`
                          : day.bookingId 
                            ? `Booked by ${day.guestName}`
                            : 'Right-click to block/unblock'
                        : ''
                    }
                  >
                    <div className="text-sm font-medium">
                      {day.date.getDate()}
                    </div>
                    
                    {day.isCurrentMonth && (
                      <div className="mt-1 space-y-1">
                        {day.checkIn && (
                          <Badge variant="success" className="text-xs">Check-in</Badge>
                        )}
                        {day.checkOut && (
                          <Badge variant="secondary" className="text-xs">Check-out</Badge>
                        )}
                        {day.guestName && (
                          <div className="text-xs text-gray-600 truncate">
                            {day.guestName}
                          </div>
                        )}
                        {showPricing && day.isAvailable && day.price && (
                          <div className="text-xs font-medium text-primary-600">
                            AED {day.price}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* Selected Date Info */}
              {selectedDate && (
                <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                  <h4 className="font-semibold text-gray-900 mb-2">
                    {selectedDate.toLocaleDateString('en-US', { 
                      weekday: 'long', 
                      year: 'numeric', 
                      month: 'long', 
                      day: 'numeric' 
                    })}
                  </h4>
                  
                  <div className="flex items-center space-x-4">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => {
                        const dateString = selectedDate.toISOString().split('T')[0];
                        const reason = prompt('Please provide a reason for blocking this date:');
                        if (reason) {
                          handleBlockDates([dateString], reason);
                        }
                      }}
                    >
                      <Clock className="w-4 h-4 mr-2" />
                      Block Date
                    </Button>
                    <Button variant="outline" size="sm">
                      <DollarSign className="w-4 h-4 mr-2" />
                      Set Custom Price
                    </Button>
                  </div>
                </div>
              )}
            </Card>
          </div>
        </div>
      </div>

      {/* Calendar Settings Dialog */}
      <Dialog
        isOpen={showSettingsDialog}
        onClose={() => setShowSettingsDialog(false)}
        title="Calendar Settings"
        maxWidth="2xl"
      >
        <CalendarSettings
          settings={calendarSettings}
          onSave={handleSaveSettings}
          onCancel={() => setShowSettingsDialog(false)}
        />
      </Dialog>

      {/* Block Dates Dialog */}
      <Dialog
        isOpen={showBlockDatesDialog}
        onClose={() => setShowBlockDatesDialog(false)}
        title="Block Dates"
        maxWidth="2xl"
      >
        <BlockDates
          propertyId={selectedProperty?.id || ''}
          onBlockDates={handleBlockDatesSubmit}
          onCancel={() => setShowBlockDatesDialog(false)}
          existingBlockedDates={blockedDates}
        />
      </Dialog>
    </div>
  );
};

export default CalendarManagementPage; 