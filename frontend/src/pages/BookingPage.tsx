import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { 
  CalendarIcon, 
  Star, 
  CheckCircle, 
  AlertCircle, 
  ChevronLeft, 
  ChevronRight,
  CreditCard,
  Banknote,
  Smartphone,
  Shield,
  MapPin,
  Loader2,
  Wifi,
  Car,
  ArrowLeft,
  Check,
  Info
} from 'lucide-react';
import { Property, BookingForm, RentalType, PropertyType, PropertyCategory, PropertyStatus, PriceUnit, Language, KYCStatus } from '../types';
import { formatCurrency, formatDate, validateUAEPhone, validateEmiratesId } from '../lib/utils';

interface GuestForm {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  emiratesId?: string;
  nationality: string;
  specialRequests?: string;
  emergencyContact: {
    name: string;
    phone: string;
    relationship: string;
  };
  agreeToTerms: boolean;
}

const BookingPage: React.FC = () => {
  const { propertyId } = useParams<{ propertyId: string }>();
  const navigate = useNavigate();
  
  const [property, setProperty] = useState<Property | null>(null);
  const [loading, setLoading] = useState(true);
  const [bookingStep, setBookingStep] = useState<'details' | 'guest-info' | 'payment' | 'confirmation'>('details');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [bookingForm, setBookingForm] = useState<BookingForm>({
    propertyId: propertyId || '',
    checkIn: new Date(),
    checkOut: new Date(Date.now() + 86400000), // Tomorrow
    guests: 1,
    message: '',
  });

  const [guestForm, setGuestForm] = useState<GuestForm>({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    emiratesId: '',
    nationality: 'AE',
    specialRequests: '',
    emergencyContact: {
      name: '',
      phone: '',
      relationship: 'Spouse',
    },
    agreeToTerms: false,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  // Mock property data - replace with actual API call
  useEffect(() => {
    const fetchProperty = async () => {
      if (!propertyId) return;
      
      setLoading(true);
      // Simulate API call
      setTimeout(() => {
        const mockProperty: Property = {
          id: propertyId || '1',
          hostId: 'host-1',
          title: 'Luxurious Marina View Apartment',
          description: 'Beautiful 2BR apartment in Dubai Marina with stunning views',
          slug: 'luxurious-marina-view-apartment',
          type: PropertyType.APARTMENT,
          rentalType: RentalType.SHORT_TERM,
          category: PropertyCategory.RESIDENTIAL,
          status: PropertyStatus.ACTIVE,
          emirate: 'Dubai',
          city: 'Dubai',
          area: 'Dubai Marina',
          address: 'Marina Walk, Dubai Marina, Dubai',
          coordinates: { latitude: 25.0772, longitude: 55.1406 },
          bedrooms: 2,
          bathrooms: 2,
          maxGuests: 4,
          areaSize: 1200,
          floor: 15,
          totalFloors: 30,
          amenities: ['wifi', 'parking', 'pool', 'gym', 'balcony', 'kitchen'],
          houseRules: [
            'No smoking inside the apartment',
            'No pets allowed',
            'No parties or events',
            'Check-in after 3:00 PM',
            'Check-out before 11:00 AM',
          ],
          safetyFeatures: ['smoke_detector', 'fire_extinguisher', 'first_aid_kit'],
          accessibility: [],
          images: [
            { id: '1', propertyId: propertyId || '1', url: '/property-1.jpg', isMain: true, order: 1 }
          ],
          pricing: {
            id: 'pricing-1',
            propertyId: propertyId || '1',
            basePrice: 450,
            priceUnit: PriceUnit.NIGHT,
            cleaningFee: 75,
            securityDeposit: 500,
          },
          availability: [],
          instantBook: true,
          minStay: 1,
          checkInTime: '15:00',
          checkOutTime: '11:00',
          rating: 4.8,
          reviewCount: 127,
          viewCount: 1250,
          favoriteCount: 89,
          bookingCount: 156,
          createdAt: new Date('2024-01-01'),
          updatedAt: new Date('2024-01-15'),
          publishedAt: new Date('2024-01-05'),
          host: {
            id: 'host-1',
            email: 'ahmed@example.com',
            phoneVerified: true,
            firstName: 'Ahmed',
            lastName: 'Al Mansoori',
            avatar: '/host-avatar.jpg',
            nationality: 'AE',
            isHost: true,
            isGuest: false,
            isVerified: true,
            kycStatus: KYCStatus.VERIFIED,
            preferredLanguage: Language.ENGLISH,
            createdAt: new Date('2023-06-01'),
            updatedAt: new Date('2024-01-01'),
            addresses: [],
            documents: [],
            paymentMethods: [],
            profile: {
              id: 'profile-1',
              userId: 'host-1',
              rating: 4.9,
              reviewCount: 156,
              responseRate: 98,
              responseTime: 'within an hour',
              joinedDate: new Date('2023-06-01'),
              languages: ['English', 'Arabic'],
              interests: ['travel', 'hospitality'],
              verificationBadges: ['id_verified', 'email_verified', 'phone_verified']
            },
            hostProfile: {
              id: 'host-profile-1',
              userId: 'host-1',
              propertyCount: 5,
              totalEarnings: 125000,
              averageRating: 4.9,
              totalReviews: 156,
              superHostStatus: true,
              autoAcceptBookings: false,
              instantBookEnabled: true
            }
          },
          bookings: [],
          reviews: []
        };
        
        setProperty(mockProperty);
        setLoading(false);
      }, 1000);
    };

    fetchProperty();
  }, [propertyId]);

  // Calculate booking details
  const calculateBookingDetails = () => {
    if (!property) return null;

    const nights = Math.ceil((bookingForm.checkOut.getTime() - bookingForm.checkIn.getTime()) / (1000 * 60 * 60 * 24));
    const baseTotal = property.pricing.basePrice * nights;
    const cleaningFee = property.pricing.cleaningFee || 0;
    const serviceFee = Math.round(baseTotal * 0.12); // 12% service fee
    const taxes = Math.round(baseTotal * 0.05); // 5% VAT
    const total = baseTotal + cleaningFee + serviceFee + taxes;

    return {
      nights,
      baseTotal,
      cleaningFee,
      serviceFee,
      taxes,
      total,
      securityDeposit: property.pricing.securityDeposit || 0,
    };
  };

  const bookingDetails = calculateBookingDetails();

  const handleBookingFormChange = (field: keyof BookingForm, value: any) => {
    setBookingForm(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const handleGuestFormChange = (field: string, value: string | boolean) => {
    if (field.startsWith('emergencyContact.')) {
      const contactField = field.split('.')[1];
      setGuestForm(prev => ({
        ...prev,
        emergencyContact: { ...prev.emergencyContact, [contactField]: value }
      }));
    } else {
      setGuestForm(prev => ({ ...prev, [field]: value }));
    }
    
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const validateBookingForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (bookingForm.checkIn <= new Date()) {
      newErrors.checkIn = 'Check-in date must be in the future';
    }
    if (bookingForm.checkOut <= bookingForm.checkIn) {
      newErrors.checkOut = 'Check-out date must be after check-in date';
    }
    if (bookingForm.guests < 1 || bookingForm.guests > (property?.maxGuests || 1)) {
      newErrors.guests = `Number of guests must be between 1 and ${property?.maxGuests}`;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateGuestForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!guestForm.firstName.trim()) newErrors.firstName = 'First name is required';
    if (!guestForm.lastName.trim()) newErrors.lastName = 'Last name is required';
    if (!guestForm.email.trim()) newErrors.email = 'Email is required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(guestForm.email)) {
      newErrors.email = 'Please enter a valid email address';
    }
    if (!guestForm.phone.trim()) newErrors.phone = 'Phone number is required';
    else if (!validateUAEPhone(guestForm.phone)) {
      newErrors.phone = 'Please enter a valid UAE phone number';
    }
    if (guestForm.emiratesId && !validateEmiratesId(guestForm.emiratesId)) {
      newErrors.emiratesId = 'Please enter a valid Emirates ID';
    }
    if (!guestForm.emergencyContact.name.trim()) {
      newErrors['emergencyContact.name'] = 'Emergency contact name is required';
    }
    if (!guestForm.emergencyContact.phone.trim()) {
      newErrors['emergencyContact.phone'] = 'Emergency contact phone is required';
    }
    if (!guestForm.agreeToTerms) {
      newErrors.agreeToTerms = 'You must agree to the terms and conditions';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNextStep = () => {
    switch (bookingStep) {
      case 'details':
        if (validateBookingForm()) {
          setBookingStep('guest-info');
        }
        break;
      case 'guest-info':
        if (validateGuestForm()) {
          setBookingStep('payment');
        }
        break;
      case 'payment':
        handleSubmitBooking();
        break;
    }
  };

  const handleSubmitBooking = async () => {
    setIsSubmitting(true);
    
    try {
      // Simulate payment processing
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      console.log('Booking submitted:', { bookingForm, guestForm });
      setBookingStep('confirmation');
    } catch (error) {
      console.error('Booking failed:', error);
      alert('Booking failed. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary-600"></div>
          <p className="mt-4 text-gray-600">Loading booking details...</p>
        </div>
      </div>
    );
  }

  if (!property || !bookingDetails) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card padding="lg" className="max-w-md text-center">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold mb-2">Property Not Found</h2>
          <p className="text-gray-600 mb-4">The property you're trying to book could not be found.</p>
          <Button onClick={() => navigate('/')}>Return Home</Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center space-x-4">
            <Button variant="ghost" onClick={() => navigate(-1)} leftIcon={<ArrowLeft className="w-4 h-4" />}>
              Back
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Complete Your Booking</h1>
              <p className="text-gray-600">{property.title}</p>
            </div>
          </div>

          {/* Progress Steps */}
          <div className="mt-8">
            <div className="flex items-center space-x-4">
              {[
                { id: 'details', label: 'Booking Details' },
                { id: 'guest-info', label: 'Guest Information' },
                { id: 'payment', label: 'Payment' },
                { id: 'confirmation', label: 'Confirmation' },
              ].map((step, index) => (
                <div key={step.id} className="flex items-center">
                  <div className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium ${
                    bookingStep === step.id
                      ? 'bg-primary-600 text-white'
                      : index < ['details', 'guest-info', 'payment', 'confirmation'].indexOf(bookingStep)
                      ? 'bg-green-600 text-white'
                      : 'bg-gray-200 text-gray-600'
                  }`}>
                    {index < ['details', 'guest-info', 'payment', 'confirmation'].indexOf(bookingStep) ? (
                      <Check className="w-4 h-4" />
                    ) : (
                      index + 1
                    )}
                  </div>
                  <span className={`ml-2 text-sm ${
                    bookingStep === step.id ? 'font-medium text-gray-900' : 'text-gray-500'
                  }`}>
                    {step.label}
                  </span>
                  {index < 3 && <div className="w-8 h-px bg-gray-300 mx-4" />}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2">
            {/* Booking Details Step */}
            {bookingStep === 'details' && (
              <Card padding="lg">
                <h2 className="text-xl font-bold mb-6">Booking Details</h2>
                
                <div className="space-y-6">
                  {/* Dates */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Check-in Date *
                      </label>
                      <input
                        type="date"
                        value={bookingForm.checkIn.toISOString().split('T')[0]}
                        onChange={(e) => handleBookingFormChange('checkIn', new Date(e.target.value))}
                        className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent ${
                          errors.checkIn ? 'border-red-500' : 'border-gray-300'
                        }`}
                        min={new Date().toISOString().split('T')[0]}
                      />
                      {errors.checkIn && (
                        <p className="mt-1 text-sm text-red-600">{errors.checkIn}</p>
                      )}
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Check-out Date *
                      </label>
                      <input
                        type="date"
                        value={bookingForm.checkOut.toISOString().split('T')[0]}
                        onChange={(e) => handleBookingFormChange('checkOut', new Date(e.target.value))}
                        className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent ${
                          errors.checkOut ? 'border-red-500' : 'border-gray-300'
                        }`}
                        min={new Date(bookingForm.checkIn.getTime() + 86400000).toISOString().split('T')[0]}
                      />
                      {errors.checkOut && (
                        <p className="mt-1 text-sm text-red-600">{errors.checkOut}</p>
                      )}
                    </div>
                  </div>

                  {/* Guests */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Number of Guests *
                    </label>
                    <select
                      value={bookingForm.guests}
                      onChange={(e) => handleBookingFormChange('guests', parseInt(e.target.value))}
                      className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent ${
                        errors.guests ? 'border-red-500' : 'border-gray-300'
                      }`}
                    >
                      {Array.from({ length: property.maxGuests }, (_, i) => (
                        <option key={i + 1} value={i + 1}>
                          {i + 1} Guest{i > 0 ? 's' : ''}
                        </option>
                      ))}
                    </select>
                    {errors.guests && (
                      <p className="mt-1 text-sm text-red-600">{errors.guests}</p>
                    )}
                  </div>

                  {/* Message to Host */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Message to Host (Optional)
                    </label>
                    <textarea
                      value={bookingForm.message}
                      onChange={(e) => handleBookingFormChange('message', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      rows={4}
                      placeholder="Let the host know the purpose of your trip, any special requests, or questions..."
                    />
                  </div>

                  {/* House Rules */}
                  <div>
                    <h3 className="text-lg font-semibold mb-3">House Rules</h3>
                    <div className="space-y-2">
                      {property.houseRules.map((rule, index) => (
                        <div key={index} className="flex items-start space-x-2">
                          <Check className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                          <span className="text-sm text-gray-700">{rule}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </Card>
            )}

            {/* Guest Information Step */}
            {bookingStep === 'guest-info' && (
              <Card padding="lg">
                <h2 className="text-xl font-bold mb-6">Guest Information</h2>
                
                <div className="space-y-6">
                  {/* Primary Guest */}
                  <div>
                    <h3 className="text-lg font-semibold mb-4">Primary Guest</h3>
                    
                    <div className="grid grid-cols-2 gap-4 mb-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          First Name *
                        </label>
                        <input
                          type="text"
                          value={guestForm.firstName}
                          onChange={(e) => handleGuestFormChange('firstName', e.target.value)}
                          className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent ${
                            errors.firstName ? 'border-red-500' : 'border-gray-300'
                          }`}
                          placeholder="First name"
                        />
                        {errors.firstName && (
                          <p className="mt-1 text-sm text-red-600">{errors.firstName}</p>
                        )}
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Last Name *
                        </label>
                        <input
                          type="text"
                          value={guestForm.lastName}
                          onChange={(e) => handleGuestFormChange('lastName', e.target.value)}
                          className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent ${
                            errors.lastName ? 'border-red-500' : 'border-gray-300'
                          }`}
                          placeholder="Last name"
                        />
                        {errors.lastName && (
                          <p className="mt-1 text-sm text-red-600">{errors.lastName}</p>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 mb-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Email Address *
                        </label>
                        <input
                          type="email"
                          value={guestForm.email}
                          onChange={(e) => handleGuestFormChange('email', e.target.value)}
                          className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent ${
                            errors.email ? 'border-red-500' : 'border-gray-300'
                          }`}
                          placeholder="your.email@example.com"
                        />
                        {errors.email && (
                          <p className="mt-1 text-sm text-red-600">{errors.email}</p>
                        )}
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Phone Number *
                        </label>
                        <input
                          type="tel"
                          value={guestForm.phone}
                          onChange={(e) => handleGuestFormChange('phone', e.target.value)}
                          className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent ${
                            errors.phone ? 'border-red-500' : 'border-gray-300'
                          }`}
                          placeholder="+971 50 123 4567"
                        />
                        {errors.phone && (
                          <p className="mt-1 text-sm text-red-600">{errors.phone}</p>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 mb-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Emirates ID (Optional)
                        </label>
                        <input
                          type="text"
                          value={guestForm.emiratesId}
                          onChange={(e) => handleGuestFormChange('emiratesId', e.target.value)}
                          className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent ${
                            errors.emiratesId ? 'border-red-500' : 'border-gray-300'
                          }`}
                          placeholder="784-YYYY-XXXXXXX-X"
                          maxLength={18}
                        />
                        {errors.emiratesId && (
                          <p className="mt-1 text-sm text-red-600">{errors.emiratesId}</p>
                        )}
                        <p className="mt-1 text-xs text-gray-500">
                          Providing Emirates ID helps with faster check-in
                        </p>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Nationality *
                        </label>
                        <select
                          value={guestForm.nationality}
                          onChange={(e) => handleGuestFormChange('nationality', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                        >
                          <option value="AE">United Arab Emirates</option>
                          <option value="SA">Saudi Arabia</option>
                          <option value="EG">Egypt</option>
                          <option value="IN">India</option>
                          <option value="PK">Pakistan</option>
                          <option value="BD">Bangladesh</option>
                          <option value="PH">Philippines</option>
                          <option value="GB">United Kingdom</option>
                          <option value="US">United States</option>
                          <option value="OTHER">Other</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* Emergency Contact */}
                  <div>
                    <h3 className="text-lg font-semibold mb-4">Emergency Contact</h3>
                    
                    <div className="grid grid-cols-2 gap-4 mb-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Contact Name *
                        </label>
                        <input
                          type="text"
                          value={guestForm.emergencyContact.name}
                          onChange={(e) => handleGuestFormChange('emergencyContact.name', e.target.value)}
                          className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent ${
                            errors['emergencyContact.name'] ? 'border-red-500' : 'border-gray-300'
                          }`}
                          placeholder="Emergency contact name"
                        />
                        {errors['emergencyContact.name'] && (
                          <p className="mt-1 text-sm text-red-600">{errors['emergencyContact.name']}</p>
                        )}
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Contact Phone *
                        </label>
                        <input
                          type="tel"
                          value={guestForm.emergencyContact.phone}
                          onChange={(e) => handleGuestFormChange('emergencyContact.phone', e.target.value)}
                          className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent ${
                            errors['emergencyContact.phone'] ? 'border-red-500' : 'border-gray-300'
                          }`}
                          placeholder="+971 50 123 4567"
                        />
                        {errors['emergencyContact.phone'] && (
                          <p className="mt-1 text-sm text-red-600">{errors['emergencyContact.phone']}</p>
                        )}
                      </div>
                    </div>

                    <div className="mb-4">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Relationship *
                      </label>
                      <select
                        value={guestForm.emergencyContact.relationship}
                        onChange={(e) => handleGuestFormChange('emergencyContact.relationship', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      >
                        <option value="Spouse">Spouse</option>
                        <option value="Parent">Parent</option>
                        <option value="Sibling">Sibling</option>
                        <option value="Child">Child</option>
                        <option value="Friend">Friend</option>
                        <option value="Colleague">Colleague</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>
                  </div>

                  {/* Special Requests */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Special Requests (Optional)
                    </label>
                    <textarea
                      value={guestForm.specialRequests}
                      onChange={(e) => handleGuestFormChange('specialRequests', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      rows={3}
                      placeholder="Any special accommodations or requests..."
                    />
                  </div>

                  {/* Terms Agreement */}
                  <div>
                    <label className="flex items-start space-x-3">
                      <input
                        type="checkbox"
                        checked={guestForm.agreeToTerms}
                        onChange={(e) => handleGuestFormChange('agreeToTerms', e.target.checked)}
                        className={`mt-1 rounded border-gray-300 text-primary-600 focus:ring-primary-500 ${
                          errors.agreeToTerms ? 'border-red-500' : ''
                        }`}
                      />
                      <span className="text-sm text-gray-700">
                        I agree to the{' '}
                        <a href="/terms" className="text-primary-600 hover:text-primary-700 underline">
                          Terms of Service
                        </a>{' '}
                        and{' '}
                        <a href="/privacy" className="text-primary-600 hover:text-primary-700 underline">
                          Privacy Policy
                        </a>
                      </span>
                    </label>
                    {errors.agreeToTerms && (
                      <p className="mt-1 text-sm text-red-600">{errors.agreeToTerms}</p>
                    )}
                  </div>
                </div>
              </Card>
            )}

            {/* Payment Step */}
            {bookingStep === 'payment' && (
              <Card padding="lg">
                <h2 className="text-xl font-bold mb-6">Payment Information</h2>
                
                <div className="space-y-6">
                  {/* Payment Methods */}
                  <div>
                    <h3 className="text-lg font-semibold mb-4">Choose Payment Method</h3>
                    <div className="space-y-3">
                      <label className="flex items-center p-4 border border-gray-300 rounded-lg cursor-pointer hover:border-primary-500">
                        <input type="radio" name="payment" value="card" defaultChecked className="mr-3" />
                        <CreditCard className="w-5 h-5 mr-2" />
                        <span>Credit/Debit Card</span>
                      </label>
                      <label className="flex items-center p-4 border border-gray-300 rounded-lg cursor-pointer hover:border-primary-500">
                        <input type="radio" name="payment" value="bank" className="mr-3" />
                        <span className="mr-2">🏦</span>
                        <span>Bank Transfer</span>
                      </label>
                      <label className="flex items-center p-4 border border-gray-300 rounded-lg cursor-pointer hover:border-primary-500">
                        <input type="radio" name="payment" value="wallet" className="mr-3" />
                        <span className="mr-2">📱</span>
                        <span>Digital Wallet</span>
                      </label>
                    </div>
                  </div>

                  {/* Security Notice */}
                  <Card padding="md" className="bg-blue-50 border-blue-200">
                    <div className="flex items-start space-x-3">
                      <Shield className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                      <div className="text-sm text-blue-800">
                        <p className="font-medium mb-1">Secure Payment</p>
                        <p>
                          Your payment information is encrypted and secure. We use industry-standard 
                          security measures to protect your data.
                        </p>
                      </div>
                    </div>
                  </Card>

                  {/* Cancellation Policy */}
                  <div>
                    <h3 className="text-lg font-semibold mb-3">Cancellation Policy</h3>
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <ul className="space-y-2 text-sm text-gray-700">
                        <li className="flex items-start space-x-2">
                          <Check className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                          <span>Free cancellation up to 24 hours before check-in</span>
                        </li>
                        <li className="flex items-start space-x-2">
                          <Check className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                          <span>50% refund for cancellations within 24 hours</span>
                        </li>
                        <li className="flex items-start space-x-2">
                          <AlertCircle className="w-4 h-4 text-yellow-600 mt-0.5 flex-shrink-0" />
                          <span>No refund for no-shows</span>
                        </li>
                      </ul>
                    </div>
                  </div>
                </div>
              </Card>
            )}

            {/* Confirmation Step */}
            {bookingStep === 'confirmation' && (
              <Card padding="lg" className="text-center">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Check className="w-8 h-8 text-green-600" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Booking Confirmed!</h2>
                <p className="text-gray-600 mb-6">
                  Your booking has been confirmed. You will receive a confirmation email shortly.
                </p>
                
                <div className="bg-gray-50 p-4 rounded-lg mb-6 text-left">
                  <h3 className="font-semibold mb-2">Booking Details</h3>
                  <div className="space-y-1 text-sm text-gray-600">
                    <p><strong>Booking ID:</strong> URB-{Date.now().toString().slice(-6)}</p>
                    <p><strong>Check-in:</strong> {formatDate(bookingForm.checkIn)} at {property.checkInTime}</p>
                    <p><strong>Check-out:</strong> {formatDate(bookingForm.checkOut)} at {property.checkOutTime}</p>
                    <p><strong>Guests:</strong> {bookingForm.guests}</p>
                    <p><strong>Total Paid:</strong> {formatCurrency(bookingDetails.total)}</p>
                  </div>
                </div>

                <div className="space-y-3">
                  <Button size="lg" className="w-full">
                    View Booking Details
                  </Button>
                  <Button variant="outline" onClick={() => navigate('/')}>
                    Return to Home
                  </Button>
                </div>
              </Card>
            )}

            {/* Action Buttons */}
            {bookingStep !== 'confirmation' && (
              <div className="flex items-center justify-between mt-8">
                <Button
                  variant="outline"
                  onClick={() => {
                    const steps = ['details', 'guest-info', 'payment', 'confirmation'];
                    const currentIndex = steps.indexOf(bookingStep);
                    if (currentIndex > 0) {
                      setBookingStep(steps[currentIndex - 1] as any);
                    }
                  }}
                  disabled={bookingStep === 'details'}
                >
                  Back
                </Button>
                <Button
                  onClick={handleNextStep}
                  disabled={isSubmitting}
                  leftIcon={isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : undefined}
                >
                  {isSubmitting
                    ? 'Processing...'
                    : bookingStep === 'payment'
                    ? 'Complete Booking'
                    : 'Continue'
                  }
                </Button>
              </div>
            )}
          </div>

          {/* Booking Summary Sidebar */}
          <div className="lg:col-span-1">
            <div className="sticky top-8">
              <Card padding="lg">
                <h3 className="text-lg font-bold mb-4">Booking Summary</h3>
                
                {/* Property Info */}
                <div className="flex space-x-4 mb-6">
                  <div className="w-16 h-16 bg-gray-200 rounded-lg flex-shrink-0">
                    <img
                      src={property.images[0]?.url || '/placeholder-property.jpg'}
                      alt={property.title}
                      className="w-full h-full object-cover rounded-lg"
                    />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-semibold text-sm">{property.title}</h4>
                    <p className="text-xs text-gray-600 flex items-center mt-1">
                      <MapPin className="w-3 h-3 mr-1" />
                      {property.area}, {property.city}
                    </p>
                    <div className="flex items-center mt-1">
                      <Star className="w-3 h-3 text-yellow-500 mr-1" />
                      <span className="text-xs text-gray-600">
                        {property.rating} ({property.reviewCount} reviews)
                      </span>
                    </div>
                  </div>
                </div>

                {/* Booking Details */}
                <div className="space-y-3 mb-6 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Check-in</span>
                    <span>{formatDate(bookingForm.checkIn)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Check-out</span>
                    <span>{formatDate(bookingForm.checkOut)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Guests</span>
                    <span>{bookingForm.guests}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Nights</span>
                    <span>{bookingDetails.nights}</span>
                  </div>
                </div>

                {/* Price Breakdown */}
                <div className="space-y-3 mb-6 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">
                      {formatCurrency(property.pricing.basePrice)} × {bookingDetails.nights} nights
                    </span>
                    <span>{formatCurrency(bookingDetails.baseTotal)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Cleaning fee</span>
                    <span>{formatCurrency(bookingDetails.cleaningFee)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Service fee</span>
                    <span>{formatCurrency(bookingDetails.serviceFee)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">VAT (5%)</span>
                    <span>{formatCurrency(bookingDetails.taxes)}</span>
                  </div>
                  <hr className="my-3" />
                  <div className="flex items-center justify-between font-bold">
                    <span>Total</span>
                    <span>{formatCurrency(bookingDetails.total)}</span>
                  </div>
                </div>

                {/* Security Deposit Notice */}
                {bookingDetails.securityDeposit > 0 && (
                  <Card padding="sm" className="bg-yellow-50 border-yellow-200">
                    <div className="flex items-start space-x-2">
                      <Info className="w-4 h-4 text-yellow-600 mt-0.5 flex-shrink-0" />
                      <div className="text-xs text-yellow-800">
                        <p className="font-medium">Security Deposit</p>
                        <p>
                          A refundable security deposit of {formatCurrency(bookingDetails.securityDeposit)} 
                          will be authorized on your payment method.
                        </p>
                      </div>
                    </div>
                  </Card>
                )}

                {/* Host Info */}
                <div className="mt-6 pt-6 border-t border-gray-200">
                  <h4 className="font-semibold mb-3">Your Host</h4>
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-gray-200 rounded-full">
                      <img
                        src={property.host.avatar || '/default-avatar.jpg'}
                        alt={`${property.host.firstName} ${property.host.lastName}`}
                        className="w-full h-full object-cover rounded-full"
                      />
                    </div>
                    <div>
                      <h3 className="font-semibold">{property.host.firstName} {property.host.lastName}</h3>
                      <div className="flex items-center text-xs text-gray-600">
                        <Star className="w-3 h-3 text-yellow-500 mr-1" />
                        <span>{property.host.profile?.rating || 0} • {property.host.profile?.reviewCount || 0} reviews</span>
                      </div>
                    </div>
                  </div>
                  <p className="text-xs text-gray-600 mt-2">
                    Response rate: {property.host.profile?.responseRate || 0}% • Response time: {property.host.profile?.responseTime || 'N/A'}
                  </p>
                </div>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BookingPage; 