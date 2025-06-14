import React, { useState, useEffect } from 'react';
import { apiService } from '../services/api';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Calendar, Users, DollarSign, CheckCircle, Clock, AlertCircle } from 'lucide-react';

const TestBookingPage: React.FC = () => {
  const [properties, setProperties] = useState<any[]>([]);
  const [bookings, setBookings] = useState<any[]>([]);
  const [currentUser, setCurrentUser] = useState('test-guest-001'); // Default to guest
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  // Test user accounts
  const testUsers = {
    'test-guest-001': { name: 'Sarah Johnson (Guest)', role: 'guest' },
    'test-host-001': { name: 'Ahmed Al Rashid (Host)', role: 'host' },
    'test-admin-001': { name: 'Mohammad Al Mansouri (Admin)', role: 'admin' }
  };

  useEffect(() => {
    loadProperties();
    loadBookings();
  }, [currentUser]);

  const loadProperties = async () => {
    try {
      const result = await apiService.getProperties() as any;
      setProperties(result.properties || []);
    } catch (error) {
      console.error('Error loading properties:', error);
    }
  };

  const loadBookings = async () => {
    try {
      // Set user ID header for API calls
      const filters: any = {};
      if (testUsers[currentUser as keyof typeof testUsers]?.role === 'host') {
        filters.hostId = 'cmbjvmgth0001on5h4dlvdnqf'; // Ahmed Al Mansoori from seed data
      } else if (testUsers[currentUser as keyof typeof testUsers]?.role === 'guest') {
        filters.guestId = currentUser;
      }

      const result = await apiService.getBookings(filters) as any;
      setBookings(result.bookings || []);
    } catch (error) {
      console.error('Error loading bookings:', error);
    }
  };

  const createTestBooking = async (propertyId: string) => {
    setLoading(true);
    setMessage(null);
    
    try {
      const bookingData = {
        propertyId,
        checkIn: '2025-12-25',
        checkOut: '2025-12-30',
        guests: 2,
        message: `Test booking from ${testUsers[currentUser as keyof typeof testUsers]?.name}`,
        specialRequests: 'This is a test booking to verify the API integration',
        guestInfo: {
          firstName: 'Sarah',
          lastName: 'Johnson',
          email: 'guest@test.com',
          phone: '+971501111111',
          nationality: 'US',
          emergencyContact: {
            name: 'John Johnson',
            phone: '+1234567890',
            relationship: 'Spouse'
          }
        }
      };

      const result = await apiService.createBooking(bookingData) as any;
      setMessage(`✅ Booking created successfully! ID: ${result.id}`);
      
      // Reload bookings to show the new one
      loadBookings();
    } catch (error: any) {
      setMessage(`❌ Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'CONFIRMED': return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'PENDING': return <Clock className="w-4 h-4 text-yellow-500" />;
      case 'CANCELLED': return <AlertCircle className="w-4 h-4 text-red-500" />;
      default: return <Clock className="w-4 h-4 text-gray-500" />;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            🧪 Booking Flow Test Page
          </h1>
          <p className="text-gray-600 mb-6">
            Test the complete booking flow with real API integration
          </p>

          {/* User Switcher */}
          <div className="bg-white p-4 rounded-lg shadow mb-6">
            <h3 className="font-semibold mb-3">👤 Current User:</h3>
            <div className="flex gap-3">
              {Object.entries(testUsers).map(([userId, user]) => (
                <Button
                  key={userId}
                  variant={currentUser === userId ? 'primary' : 'outline'}
                  onClick={() => setCurrentUser(userId)}
                  size="sm"
                >
                  {user.name}
                </Button>
              ))}
            </div>
          </div>

          {/* Status Message */}
          {message && (
            <div className={`p-3 rounded-lg mb-6 ${
              message.includes('✅') ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'
            }`}>
              {message}
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Properties Section - For booking creation */}
          <div>
            <h2 className="text-xl font-bold mb-4">🏠 Available Properties</h2>
            <div className="space-y-4">
              {properties.map((property) => (
                <Card key={property.id} className="p-4">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h3 className="font-semibold">{property.title}</h3>
                      <p className="text-gray-600 text-sm">
                        {property.area}, {property.city}
                      </p>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-lg">
                        AED {property.basePrice}
                      </div>
                      <div className="text-sm text-gray-600">per night</div>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 mb-3 text-sm text-gray-600">
                    <div className="flex items-center gap-1">
                      <Users className="w-4 h-4" />
                      Up to {property.guests} guests
                    </div>
                    <div className="flex items-center gap-1">
                      <Calendar className="w-4 h-4" />
                      Available now
                    </div>
                  </div>

                  {testUsers[currentUser as keyof typeof testUsers]?.role === 'guest' && (
                    <Button
                      onClick={() => createTestBooking(property.id)}
                      disabled={loading}
                      className="w-full"
                    >
                      {loading ? 'Creating Booking...' : 'Book Now (Test)'}
                    </Button>
                  )}
                </Card>
              ))}
            </div>
          </div>

          {/* Bookings Section */}
          <div>
            <h2 className="text-xl font-bold mb-4">
              📋 {testUsers[currentUser as keyof typeof testUsers]?.role === 'host' ? 'Host' : 'My'} Bookings
            </h2>
            <div className="space-y-4">
              {bookings.length === 0 ? (
                <Card className="p-6 text-center text-gray-500">
                  No bookings found for this user
                </Card>
              ) : (
                bookings.map((booking) => (
                  <Card key={booking.id} className="p-4">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h3 className="font-semibold">{booking.property.title}</h3>
                        <p className="text-gray-600 text-sm">
                          {booking.property.area}, {booking.property.city}
                        </p>
                        {testUsers[currentUser as keyof typeof testUsers]?.role === 'host' && (
                          <p className="text-sm text-blue-600">
                            Guest: {booking.guest.firstName} {booking.guest.lastName}
                          </p>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        {getStatusIcon(booking.status)}
                        <span className="text-sm font-medium">{booking.status}</span>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 mb-3 text-sm">
                      <div>
                        <div className="font-medium">Check-in:</div>
                        <div className="text-gray-600">{formatDate(booking.checkIn)}</div>
                      </div>
                      <div>
                        <div className="font-medium">Check-out:</div>
                        <div className="text-gray-600">{formatDate(booking.checkOut)}</div>
                      </div>
                    </div>

                    <div className="flex justify-between items-center pt-3 border-t">
                      <div className="flex items-center gap-4 text-sm text-gray-600">
                        <div className="flex items-center gap-1">
                          <Users className="w-4 h-4" />
                          {booking.guests} guests
                        </div>
                        <div className="flex items-center gap-1">
                          <DollarSign className="w-4 h-4" />
                          AED {booking.totalAmount}
                        </div>
                      </div>
                      <div className="text-xs text-gray-500">
                        {booking.payments?.length || 0} payment(s)
                      </div>
                    </div>

                    {booking.guestNotes && (
                      <div className="mt-3 p-2 bg-gray-50 rounded text-sm">
                        <strong>Guest notes:</strong> {booking.guestNotes}
                      </div>
                    )}
                  </Card>
                ))
              )}
            </div>
          </div>
        </div>

        {/* API Status */}
        <div className="mt-8 bg-white p-4 rounded-lg shadow">
          <h3 className="font-semibold mb-2">🔧 API Status</h3>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <strong>Properties API:</strong> {properties.length} properties loaded
            </div>
            <div>
              <strong>Bookings API:</strong> {bookings.length} bookings loaded
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TestBookingPage; 