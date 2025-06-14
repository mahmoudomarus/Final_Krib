import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  MapPin, 
  Star, 
  Wifi, 
  Car, 
  Coffee, 
  Users, 
  Bed, 
  Bath, 
  Heart,
  Calendar,
  Shield,
  Phone,
  Dumbbell,
  Waves,
  Check,
  ChevronLeft,
  ChevronRight,
  Share2,
  Clock,
  CheckCircle,
  FileText,
  Mail
} from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { MapView } from '../components/maps/MapView';
import { apiService } from '../services/api';

const PropertyDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [showAllAmenities, setShowAllAmenities] = useState(false);
  const [isLiked, setIsLiked] = useState(false);
  
  // Long-term rental application state
  const [showApplicationForm, setShowApplicationForm] = useState(false);
  const [applicationData, setApplicationData] = useState({
    moveInDate: '',
    leaseDuration: '12',
    message: '',
    fullName: '',
    email: '',
    phone: '',
    occupation: '',
    monthlyIncome: '',
    emiratesId: ''
  });
  const [applicationSubmitted, setApplicationSubmitted] = useState(false);

  // Viewing appointment state
  const [showViewingForm, setShowViewingForm] = useState(false);
  const [viewingData, setViewingData] = useState({
    preferredDate: '',
    preferredTime: '',
    fullName: '',
    email: '',
    phone: '',
    message: ''
  });
  const [viewingBooked, setViewingBooked] = useState(false);

  // Short-term booking state
  const [bookingData, setBookingData] = useState({
    checkIn: '',
    checkOut: '',
    guests: 2
  });
  const [showBookingForm, setShowBookingForm] = useState(false);
  const [bookingSubmitted, setBookingSubmitted] = useState(false);

  const [property, setProperty] = useState<any>(null);
  const [reviews, setReviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [isFavorited, setIsFavorited] = useState(false);
  const [checkInDate, setCheckInDate] = useState('');
  const [checkOutDate, setCheckOutDate] = useState('');
  const [guests, setGuests] = useState(1);
  const [showContactForm, setShowContactForm] = useState(false);
  const [message, setMessage] = useState('');

  const fetchProperty = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await apiService.getProperty(id!) as any;
      console.log('Property API response:', response);
      
      if (response) {
        setProperty(response);
      } else {
        setError('Property not found');
      }
    } catch (error) {
      console.error('Error fetching property:', error);
      setError('Failed to load property details');
    } finally {
      setLoading(false);
    }
  }, [id]);

  const fetchReviews = useCallback(async () => {
    try {
      const reviewsResponse = await apiService.getReviews({ 
        propertyId: id!
      }) as any;
      
      if (reviewsResponse && reviewsResponse.reviews) {
        setReviews(reviewsResponse.reviews);
        console.log('Reviews fetched:', reviewsResponse.reviews);
      } else {
        setReviews([]);
      }
    } catch (error) {
      console.error('Error fetching reviews:', error);
      setReviews([]);
    }
  }, [id]);

  useEffect(() => {
    if (id) {
      fetchProperty();
      fetchReviews();
    }
  }, [id, fetchProperty, fetchReviews]);

  // Calculate real rating and review count from fetched reviews
  const calculateRatingData = () => {
    if (reviews.length === 0) {
      return { rating: null, reviewCount: 0 };
    }
    
    const totalRating = reviews.reduce((sum, review) => sum + review.overallRating, 0);
    const averageRating = totalRating / reviews.length;
    
    return {
      rating: parseFloat(averageRating.toFixed(1)),
      reviewCount: reviews.length
    };
  };

  const { rating, reviewCount } = calculateRatingData();

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading property details...</p>
        </div>
      </div>
    );
  }

  // Transform API data to match UI expectations
  const transformedProperty = property ? {
    ...property,
    location: `${property.address || property.area}, ${property.city}`,
    coordinates: { 
      lat: property.latitude || 25.2048, 
      lng: property.longitude || 55.2708 
    },
    guests: property.guests || property.maxGuests || 1,
    price: property.basePrice,
    priceUnit: property.isInstantBook ? 'night' : 'month',
    type: property.isInstantBook ? 'short-term' : 'long-term',
    rating: rating,
    reviewCount: reviewCount,
  } : null;

  if (!transformedProperty) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Property Not Found</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <Button onClick={() => navigate('/search')}>
            Back to Search
          </Button>
        </div>
      </div>
    );
  }

  // Transform images string to array
  const images = Array.isArray(transformedProperty.images) 
    ? transformedProperty.images.map((img: any) => img.url || img) 
    : transformedProperty.images 
      ? transformedProperty.images.split(',').map((url: string) => url.trim()) 
      : [];
  
  // Transform amenities string to array with icons
  const getAmenityIcon = (amenity: string) => {
    const amenityLower = amenity.toLowerCase();
    if (amenityLower.includes('wifi')) return <Wifi className="w-5 h-5" />;
    if (amenityLower.includes('parking')) return <Car className="w-5 h-5" />;
    if (amenityLower.includes('gym')) return <Dumbbell className="w-5 h-5" />;
    if (amenityLower.includes('pool')) return <Waves className="w-5 h-5" />;
    if (amenityLower.includes('security')) return <Shield className="w-5 h-5" />;
    if (amenityLower.includes('kitchen')) return <Coffee className="w-5 h-5" />;
    return <Check className="w-5 h-5" />;
  };

  const transformedAmenities = transformedProperty.amenities 
    ? transformedProperty.amenities.split(',').map((amenity: string) => ({
        icon: getAmenityIcon(amenity.trim()),
        name: amenity.trim()
      }))
    : [];

  const handleApplicationSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Here you would typically send the application to your backend
    console.log('Application submitted:', applicationData);
    setApplicationSubmitted(true);
    
    // Simulate sending notification
    setTimeout(() => {
      alert(`Application submitted successfully! You will receive a confirmation email at ${applicationData.email} within 24 hours.`);
    }, 1000);
  };

  const handleBookingSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate dates
    if (!bookingData.checkIn || !bookingData.checkOut) {
      alert('Please select both check-in and check-out dates');
      return;
    }
    
    const checkIn = new Date(bookingData.checkIn);
    const checkOut = new Date(bookingData.checkOut);
    const today = new Date();
    
    if (checkIn <= today) {
      alert('Check-in date must be in the future');
      return;
    }
    
    if (checkOut <= checkIn) {
      alert('Check-out date must be after check-in date');
      return;
    }
    
    // Calculate total price
    const nights = Math.ceil((checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24));
    const totalPrice = nights * transformedProperty.price;
    
    console.log('Booking submitted:', { ...bookingData, nights, totalPrice });
    setBookingSubmitted(true);
    
    // Simulate booking confirmation
    setTimeout(() => {
      alert(`Booking confirmed! Total: AED ${totalPrice.toLocaleString()} for ${nights} night${nights > 1 ? 's' : ''}. You will receive a confirmation email shortly.`);
    }, 1000);
  };

  const handleViewingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate required fields
    if (!viewingData.preferredDate || !viewingData.preferredTime || !viewingData.fullName || !viewingData.email || !viewingData.phone) {
      alert('Please fill in all required fields');
      return;
    }
    
    // Validate date is in the future
    const selectedDate = new Date(viewingData.preferredDate);
    const today = new Date();
    
    if (selectedDate <= today) {
      alert('Please select a future date for the viewing');
      return;
    }
    
    try {
      const response = await fetch('/api/viewing-requests', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          propertyId: transformedProperty.id,
          propertyTitle: transformedProperty.title,
          guestName: viewingData.fullName,
          guestEmail: viewingData.email,
          guestPhone: viewingData.phone,
          requestedDate: viewingData.preferredDate,
          requestedTime: viewingData.preferredTime,
          message: viewingData.message || '',
          agentId: transformedProperty.host?.id, // Get agent/lister ID from property
        })
      });

      if (response.ok) {
        console.log('Viewing request submitted successfully:', viewingData);
        setViewingBooked(true);
        
        // Show success message
        setTimeout(() => {
          alert(`Viewing request sent successfully! The property owner will contact you at ${viewingData.phone} to confirm the appointment for ${new Date(viewingData.preferredDate).toLocaleDateString()} at ${viewingData.preferredTime}.`);
        }, 1000);
      } else {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to submit viewing request');
      }
    } catch (error) {
      console.error('Error submitting viewing request:', error);
      alert('Failed to submit viewing request. Please try again.');
    }
  };

  const nextImage = () => {
    setCurrentImageIndex((prev: number) => (prev + 1) % images.length);
  };

  const prevImage = () => {
    setCurrentImageIndex((prev: number) => (prev - 1 + images.length) % images.length);
  };

  const isLongTerm = transformedProperty.type === 'long-term';

  const handleViewMessages = () => {
    navigate('/host/messages');
  };

  const handleViewNotifications = () => {
    navigate('/host/notifications');
  };

  // Contact host handlers
  const handleCallHost = () => {
    // In a real app, you would get the host's phone number from the property data
    const phoneNumber = '+971501234567'; // Mock phone number
    window.open(`tel:${phoneNumber}`);
  };

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const handleMessageHost = () => {
    // Navigate to messaging interface or open chat
    alert(`Opening message conversation with property host. This would typically open a chat interface.`);
    // navigate(`/messages/new?hostId=${property.hostId}&propertyId=${property.id}`);
  };

  const handleBookNow = () => {
    navigate(`/book/${transformedProperty.id}`);
  };

  const handleContactHost = () => {
    // TODO: Implement messaging system
    console.log('Contact host feature coming soon');
  };

  const toggleFavorite = () => {
    setIsFavorited(!isFavorited);
    // TODO: Implement favorites API
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Back Button */}
        <Button 
          variant="ghost" 
          onClick={() => navigate(-1)}
          leftIcon={<ChevronLeft className="w-4 h-4" />}
          className="mb-6"
        >
          Back to results
        </Button>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Images and Details */}
          <div className="lg:col-span-2 space-y-6">
            {/* Image Gallery */}
            <div className="relative">
              <div className="aspect-[4/3] rounded-xl overflow-hidden">
                <img
                  src={images[currentImageIndex]}
                  alt={transformedProperty.title}
                  className="w-full h-full object-cover"
                />
              </div>
              
              {/* Image Navigation */}
              <button
                onClick={prevImage}
                className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-white/80 hover:bg-white rounded-full p-2 shadow-lg"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <button
                onClick={nextImage}
                className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-white/80 hover:bg-white rounded-full p-2 shadow-lg"
              >
                <ChevronRight className="w-5 h-5" />
              </button>

              {/* Image Indicators */}
              <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-2">
                {images.map((_: string, index: number) => (
                  <button
                    key={index}
                    onClick={() => setCurrentImageIndex(index)}
                    className={`w-2 h-2 rounded-full ${
                      index === currentImageIndex ? 'bg-white' : 'bg-white/50'
                    }`}
                  />
                ))}
              </div>

              {/* Action Buttons */}
              <div className="absolute top-4 right-4 flex space-x-2">
                <button
                  onClick={() => setIsLiked(!isLiked)}
                  className={`p-2 rounded-full shadow-lg ${
                    isLiked ? 'bg-red-500 text-white' : 'bg-white/80 text-gray-700'
                  }`}
                >
                  <Heart className={`w-5 h-5 ${isLiked ? 'fill-current' : ''}`} />
                </button>
                <button className="p-2 bg-white/80 rounded-full shadow-lg">
                  <Share2 className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Property Info */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center text-sm text-gray-600">
                  <MapPin className="w-4 h-4 mr-1" />
                  {transformedProperty.location}
                </div>
                <div className="flex items-center">
                  {transformedProperty.rating ? (
                    <>
                      <Star className="w-4 h-4 text-yellow-400 fill-current" />
                      <span className="ml-1 text-sm font-medium">{transformedProperty.rating}</span>
                      <span className="ml-1 text-sm text-gray-500">({transformedProperty.reviewCount} reviews)</span>
                    </>
                  ) : (
                    <span className="text-sm text-gray-500">New</span>
                  )}
                </div>
              </div>

              <h1 className="text-3xl font-bold text-gray-900 mb-4">{transformedProperty.title}</h1>
              
              <div className="flex items-center space-x-6 mb-6 text-gray-600">
                <div className="flex items-center">
                  <Users className="w-5 h-5 mr-2" />
                  {transformedProperty.guests} guests
                </div>
                <div className="flex items-center">
                  <Bed className="w-5 h-5 mr-2" />
                  {transformedProperty.bedrooms} bedroom{transformedProperty.bedrooms !== 1 ? 's' : ''}
                </div>
                <div className="flex items-center">
                  <Bath className="w-5 h-5 mr-2" />
                  {transformedProperty.bathrooms} bathroom{transformedProperty.bathrooms !== 1 ? 's' : ''}
                </div>
              </div>

              <Badge variant={isLongTerm ? 'secondary' : 'primary'} className="mb-4">
                {isLongTerm ? 'Long-term Rental' : 'Short-term Rental'}
              </Badge>

              <p className="text-gray-700 text-lg leading-relaxed mb-6">
                {transformedProperty.description}
              </p>

              {/* Amenities */}
              <div className="mb-6">
                <h3 className="text-xl font-semibold mb-4">Amenities</h3>
                <div className="grid grid-cols-2 gap-4">
                  {transformedAmenities.slice(0, showAllAmenities ? transformedAmenities.length : 4).map((amenity: any, index: number) => (
                    <div key={index} className="flex items-center space-x-3">
                      <div className="text-primary-600">{amenity.icon}</div>
                      <span>{amenity.name}</span>
                    </div>
                  ))}
                </div>
                {transformedAmenities.length > 4 && (
                  <Button
                    variant="ghost"
                    onClick={() => setShowAllAmenities(!showAllAmenities)}
                    className="mt-4"
                  >
                    {showAllAmenities ? 'Show less' : `Show all ${transformedAmenities.length} amenities`}
                  </Button>
                )}
              </div>

              {/* Map */}
              <div className="mb-6">
                <h3 className="text-xl font-semibold mb-4">Location</h3>
                <div className="h-64 rounded-xl overflow-hidden">
                  <MapView
                    properties={[{
                      id: transformedProperty.id,
                      title: transformedProperty.title,
                      coordinates: {
                        latitude: transformedProperty.coordinates.lat,
                        longitude: transformedProperty.coordinates.lng,
                      },
                      images: [{ id: '1', propertyId: transformedProperty.id, url: images[0], isMain: true, order: 1 }],
                      pricing: {
                        id: '1',
                        propertyId: transformedProperty.id,
                        basePrice: transformedProperty.price,
                        priceUnit: transformedProperty.priceUnit === 'night' ? 'NIGHT' : 'MONTH',
                      },
                      rating: transformedProperty.rating,
                      reviewCount: transformedProperty.reviewCount,
                    } as any]}
                    onPropertyClick={() => {}}
                    height="100%"
                    className="w-full h-full"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Right Column - Booking/Application */}
          <div className="lg:col-span-1">
            <div className="sticky top-8">
              {/* Modern Booking Card */}
              <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
                {/* Price Header with Gradient */}
                <div className="bg-gradient-to-r from-primary-500 to-primary-600 p-6 text-white">
                  <div className="flex items-baseline justify-between">
                    <div>
                      <div className="text-3xl font-bold">
                        AED {transformedProperty.price.toLocaleString()}
                      </div>
                      <div className="text-primary-100 text-sm font-medium">
                        per {transformedProperty.priceUnit}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="flex items-center text-primary-100 text-sm">
                        <Star className="w-4 h-4 mr-1 fill-current" />
                        4.8 (23 reviews)
                      </div>
                    </div>
                  </div>
                  {isLongTerm && (
                    <div className="mt-3 inline-flex items-center px-3 py-1 rounded-full bg-white/20 backdrop-blur-sm">
                      <Clock className="w-4 h-4 mr-2" />
                      <span className="text-sm font-medium">Minimum lease: 12 months</span>
                    </div>
                  )}
                </div>

                {/* Booking Form Content */}
                <div className="p-6">
                  {!isLongTerm ? (
                    // Short-term booking form - Modern Design
                    <div>
                      {!showBookingForm ? (
                        <div className="space-y-5">
                          {/* Date Selection with Modern Style */}
                          <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-3">
                              <div className="relative">
                                <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-2">
                                  Check-in
                                </label>
                                <div className="relative">
                                  <input
                                    type="date"
                                    value={bookingData.checkIn}
                                    onChange={(e) => setBookingData(prev => ({ ...prev, checkIn: e.target.value }))}
                                    min={new Date().toISOString().split('T')[0]}
                                    className="w-full px-4 py-3 bg-gray-50 border-0 rounded-xl focus:bg-white focus:ring-2 focus:ring-primary-500 focus:outline-none transition-all duration-200 text-gray-900 font-medium"
                                  />
                                  <Calendar className="absolute right-3 top-3 w-5 h-5 text-gray-400 pointer-events-none" />
                                </div>
                              </div>
                              <div className="relative">
                                <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-2">
                                  Check-out
                                </label>
                                <div className="relative">
                                  <input
                                    type="date"
                                    value={bookingData.checkOut}
                                    onChange={(e) => setBookingData(prev => ({ ...prev, checkOut: e.target.value }))}
                                    min={bookingData.checkIn || new Date().toISOString().split('T')[0]}
                                    className="w-full px-4 py-3 bg-gray-50 border-0 rounded-xl focus:bg-white focus:ring-2 focus:ring-primary-500 focus:outline-none transition-all duration-200 text-gray-900 font-medium"
                                  />
                                  <Calendar className="absolute right-3 top-3 w-5 h-5 text-gray-400 pointer-events-none" />
                                </div>
                              </div>
                            </div>
                            
                            {/* Guests Selection */}
                            <div className="relative">
                              <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-2">
                                Guests
                              </label>
                              <div className="relative">
                                <select
                                  value={bookingData.guests}
                                  onChange={(e) => setBookingData(prev => ({ ...prev, guests: parseInt(e.target.value) || 1 }))}
                                  className="w-full px-4 py-3 bg-gray-50 border-0 rounded-xl focus:bg-white focus:ring-2 focus:ring-primary-500 focus:outline-none transition-all duration-200 text-gray-900 font-medium appearance-none"
                                >
                                  {Array.from({ length: transformedProperty.guests }, (_, i) => i + 1).map(num => (
                                    <option key={num} value={num}>
                                      {num} {num === 1 ? 'guest' : 'guests'}
                                    </option>
                                  ))}
                                </select>
                                <Users className="absolute right-3 top-3 w-5 h-5 text-gray-400 pointer-events-none" />
                              </div>
                            </div>
                          </div>

                          {/* Price Breakdown */}
                          {bookingData.checkIn && bookingData.checkOut && (
                            <div className="bg-gradient-to-br from-gray-50 to-gray-100 p-5 rounded-xl border border-gray-200">
                              <h4 className="font-semibold text-gray-900 mb-3">Price breakdown</h4>
                              <div className="space-y-2 text-sm">
                                <div className="flex justify-between items-center">
                                  <span className="text-gray-600">
                                    AED {transformedProperty.price.toLocaleString()} × {Math.ceil((new Date(bookingData.checkOut).getTime() - new Date(bookingData.checkIn).getTime()) / (1000 * 60 * 60 * 24))} nights
                                  </span>
                                  <span className="font-medium text-gray-900">
                                    AED {(Math.ceil((new Date(bookingData.checkOut).getTime() - new Date(bookingData.checkIn).getTime()) / (1000 * 60 * 60 * 24)) * transformedProperty.price).toLocaleString()}
                                  </span>
                                </div>
                                <div className="flex justify-between items-center">
                                  <span className="text-gray-600">Service fee</span>
                                  <span className="font-medium text-gray-900">AED 50</span>
                                </div>
                                <div className="border-t border-gray-200 pt-2 mt-3">
                                  <div className="flex justify-between items-center">
                                    <span className="font-semibold text-gray-900">Total</span>
                                    <span className="font-bold text-lg text-gray-900">
                                      AED {((Math.ceil((new Date(bookingData.checkOut).getTime() - new Date(bookingData.checkIn).getTime()) / (1000 * 60 * 60 * 24)) * transformedProperty.price) + 50).toLocaleString()}
                                    </span>
                                  </div>
                                </div>
                              </div>
                            </div>
                          )}

                          {/* Book Now Button */}
                          <button
                            onClick={() => setShowBookingForm(true)}
                            disabled={!bookingData.checkIn || !bookingData.checkOut}
                            className="w-full bg-gradient-to-r from-primary-600 to-primary-700 hover:from-primary-700 hover:to-primary-800 disabled:from-gray-300 disabled:to-gray-400 text-white font-semibold py-4 px-6 rounded-xl transition-all duration-200 transform hover:scale-[1.02] disabled:hover:scale-100 disabled:cursor-not-allowed shadow-lg hover:shadow-xl"
                          >
                            {transformedProperty.type === 'short-term' && transformedProperty.title.includes('Instant') ? 
                              'Instant Book' : 'Reserve Now'
                            }
                          </button>

                          {/* Trust Indicators */}
                          <div className="flex items-center justify-center text-xs text-gray-500 pt-2">
                            <Shield className="w-4 h-4 mr-1" />
                            <span>You won't be charged yet</span>
                          </div>
                        </div>
                      ) : bookingSubmitted ? (
                        // Booking Success State
                        <div className="text-center space-y-5">
                          <div className="w-20 h-20 bg-gradient-to-br from-green-400 to-green-600 rounded-full flex items-center justify-center mx-auto shadow-lg">
                            <CheckCircle className="w-10 h-10 text-white" />
                          </div>
                          <div>
                            <h3 className="text-xl font-bold text-gray-900 mb-2">Booking Confirmed!</h3>
                            <p className="text-gray-600 text-sm leading-relaxed">
                              Your reservation has been confirmed. You will receive a confirmation email with all the details shortly.
                            </p>
                          </div>
                          <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-4 rounded-xl border border-blue-200">
                            <div className="space-y-2 text-sm">
                              <div className="flex items-center text-blue-700">
                                <Calendar className="w-4 h-4 mr-2" />
                                <span className="font-medium">Check-in: {new Date(bookingData.checkIn).toLocaleDateString()}</span>
                              </div>
                              <div className="flex items-center text-blue-700">
                                <Calendar className="w-4 h-4 mr-2" />
                                <span className="font-medium">Check-out: {new Date(bookingData.checkOut).toLocaleDateString()}</span>
                              </div>
                            </div>
                          </div>
                          <button
                            onClick={() => navigate('/bookings')}
                            className="w-full bg-white border-2 border-gray-200 hover:border-gray-300 text-gray-700 font-semibold py-3 px-6 rounded-xl transition-all duration-200 hover:bg-gray-50"
                          >
                            View Booking Details
                          </button>
                        </div>
                      ) : (
                        // Booking Confirmation Form - Modern Design
                        <form onSubmit={handleBookingSubmit} className="space-y-5">
                          <div className="text-center pb-4 border-b border-gray-100">
                            <h3 className="text-xl font-bold text-gray-900">Confirm Your Booking</h3>
                            <p className="text-gray-600 text-sm mt-1">Review your details below</p>
                          </div>
                          
                          <div className="bg-gradient-to-br from-gray-50 to-gray-100 p-5 rounded-xl space-y-3">
                            <div className="flex justify-between items-center">
                              <span className="text-gray-600">Check-in:</span>
                              <span className="font-semibold text-gray-900">{new Date(bookingData.checkIn).toLocaleDateString()}</span>
                            </div>
                            <div className="flex justify-between items-center">
                              <span className="text-gray-600">Check-out:</span>
                              <span className="font-semibold text-gray-900">{new Date(bookingData.checkOut).toLocaleDateString()}</span>
                            </div>
                            <div className="flex justify-between items-center">
                              <span className="text-gray-600">Guests:</span>
                              <span className="font-semibold text-gray-900">{bookingData.guests}</span>
                            </div>
                            <div className="border-t border-gray-200 pt-3 mt-3">
                              <div className="flex justify-between items-center">
                                <span className="font-bold text-gray-900">Total:</span>
                                <span className="font-bold text-lg text-gray-900">
                                  AED {((Math.ceil((new Date(bookingData.checkOut).getTime() - new Date(bookingData.checkIn).getTime()) / (1000 * 60 * 60 * 24)) * transformedProperty.price) + 50).toLocaleString()}
                                </span>
                              </div>
                            </div>
                          </div>

                          <div className="flex space-x-3">
                            <button
                              type="button"
                              onClick={() => setShowBookingForm(false)}
                              className="flex-1 bg-white border-2 border-gray-200 hover:border-gray-300 text-gray-700 font-semibold py-3 px-4 rounded-xl transition-all duration-200 hover:bg-gray-50"
                            >
                              Back
                            </button>
                            <button
                              type="submit"
                              className="flex-1 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white font-semibold py-3 px-4 rounded-xl transition-all duration-200 transform hover:scale-[1.02] shadow-lg hover:shadow-xl flex items-center justify-center"
                            >
                              <CheckCircle className="w-4 h-4 mr-2" />
                              Confirm
                            </button>
                          </div>
                        </form>
                      )}
                    </div>
                  ) : (
                    // Long-term rental application - Modern Design
                    <div>
                      {!showApplicationForm && !showViewingForm ? (
                        <div className="space-y-5">
                          {/* Move-in Date */}
                          <div className="relative">
                            <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-2">
                              Preferred Move-in Date
                            </label>
                            <div className="relative">
                              <input
                                type="date"
                                value={applicationData.moveInDate}
                                onChange={(e) => setApplicationData(prev => ({ ...prev, moveInDate: e.target.value }))}
                                min={new Date().toISOString().split('T')[0]}
                                className="w-full px-4 py-3 bg-gray-50 border-0 rounded-xl focus:bg-white focus:ring-2 focus:ring-primary-500 focus:outline-none transition-all duration-200 text-gray-900 font-medium"
                              />
                              <Calendar className="absolute right-3 top-3 w-5 h-5 text-gray-400 pointer-events-none" />
                            </div>
                          </div>
                          
                          {/* Lease Duration */}
                          <div className="relative">
                            <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-2">
                              Lease Duration
                            </label>
                            <div className="relative">
                              <select
                                value={applicationData.leaseDuration}
                                onChange={(e) => setApplicationData(prev => ({ ...prev, leaseDuration: e.target.value }))}
                                className="w-full px-4 py-3 bg-gray-50 border-0 rounded-xl focus:bg-white focus:ring-2 focus:ring-primary-500 focus:outline-none transition-all duration-200 text-gray-900 font-medium appearance-none"
                              >
                                <option value="12">12 months</option>
                                <option value="24">24 months</option>
                                <option value="36">36 months</option>
                              </select>
                              <Clock className="absolute right-3 top-3 w-5 h-5 text-gray-400 pointer-events-none" />
                            </div>
                          </div>

                          {/* Action Buttons */}
                          <div className="grid grid-cols-2 gap-3 pt-2">
                            <button
                              onClick={() => setShowViewingForm(true)}
                              className="flex items-center justify-center px-4 py-3 bg-white border-2 border-primary-200 text-primary-700 font-semibold rounded-xl hover:bg-primary-50 hover:border-primary-300 transition-all duration-200 transform hover:scale-[1.02]"
                            >
                              <Calendar className="w-4 h-4 mr-2" />
                              Book Viewing
                            </button>
                            
                            <button
                              onClick={() => setShowApplicationForm(true)}
                              className="flex items-center justify-center px-4 py-3 bg-gradient-to-r from-primary-600 to-primary-700 hover:from-primary-700 hover:to-primary-800 text-white font-semibold rounded-xl transition-all duration-200 transform hover:scale-[1.02] shadow-lg hover:shadow-xl"
                            >
                              <FileText className="w-4 h-4 mr-2" />
                              Apply Now
                            </button>
                          </div>

                          {/* Trust Badge */}
                          <div className="flex items-center justify-center text-xs text-gray-500 pt-2">
                            <div className="flex items-center bg-green-50 text-green-700 px-3 py-1 rounded-full">
                              <CheckCircle className="w-3 h-3 mr-1" />
                              <span className="font-medium">Response within 24 hours</span>
                            </div>
                          </div>
                        </div>
                      ) : showViewingForm && !viewingBooked ? (
                        // Viewing Form - Modern Design
                        <form onSubmit={handleViewingSubmit} className="space-y-5">
                          <div className="text-center pb-4 border-b border-gray-100">
                            <h3 className="text-xl font-bold text-gray-900">Book a Viewing</h3>
                            <p className="text-gray-600 text-sm mt-1">Schedule your property visit</p>
                          </div>
                          
                          <div className="grid grid-cols-2 gap-3">
                            <div className="relative">
                              <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-2">
                                Preferred Date *
                              </label>
                              <div className="relative">
                                <input
                                  type="date"
                                  required
                                  value={viewingData.preferredDate}
                                  onChange={(e) => setViewingData(prev => ({ ...prev, preferredDate: e.target.value }))}
                                  min={new Date().toISOString().split('T')[0]}
                                  className="w-full px-4 py-3 bg-gray-50 border-0 rounded-xl focus:bg-white focus:ring-2 focus:ring-primary-500 focus:outline-none transition-all duration-200 text-gray-900 font-medium"
                                />
                                <Calendar className="absolute right-3 top-3 w-5 h-5 text-gray-400 pointer-events-none" />
                              </div>
                            </div>
                            
                            <div className="relative">
                              <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-2">
                                Time *
                              </label>
                              <div className="relative">
                                <select
                                  required
                                  value={viewingData.preferredTime}
                                  onChange={(e) => setViewingData(prev => ({ ...prev, preferredTime: e.target.value }))}
                                  className="w-full px-4 py-3 bg-gray-50 border-0 rounded-xl focus:bg-white focus:ring-2 focus:ring-primary-500 focus:outline-none transition-all duration-200 text-gray-900 font-medium appearance-none"
                                >
                                  <option value="">Select time</option>
                                  <option value="09:00">9:00 AM</option>
                                  <option value="10:00">10:00 AM</option>
                                  <option value="11:00">11:00 AM</option>
                                  <option value="12:00">12:00 PM</option>
                                  <option value="14:00">2:00 PM</option>
                                  <option value="15:00">3:00 PM</option>
                                  <option value="16:00">4:00 PM</option>
                                  <option value="17:00">5:00 PM</option>
                                </select>
                                <Clock className="absolute right-3 top-3 w-5 h-5 text-gray-400 pointer-events-none" />
                              </div>
                            </div>
                          </div>

                          {/* Contact Details */}
                          <div className="space-y-3">
                            <div className="relative">
                              <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-2">
                                Full Name *
                              </label>
                              <input
                                type="text"
                                required
                                value={viewingData.fullName}
                                onChange={(e) => setViewingData(prev => ({ ...prev, fullName: e.target.value }))}
                                placeholder="Enter your full name"
                                className="w-full px-4 py-3 bg-gray-50 border-0 rounded-xl focus:bg-white focus:ring-2 focus:ring-primary-500 focus:outline-none transition-all duration-200 text-gray-900 font-medium"
                              />
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                              <div className="relative">
                                <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-2">
                                  Email *
                                </label>
                                <input
                                  type="email"
                                  required
                                  value={viewingData.email}
                                  onChange={(e) => setViewingData(prev => ({ ...prev, email: e.target.value }))}
                                  placeholder="your@email.com"
                                  className="w-full px-4 py-3 bg-gray-50 border-0 rounded-xl focus:bg-white focus:ring-2 focus:ring-primary-500 focus:outline-none transition-all duration-200 text-gray-900 font-medium"
                                />
                              </div>

                              <div className="relative">
                                <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-2">
                                  Phone *
                                </label>
                                <input
                                  type="tel"
                                  required
                                  value={viewingData.phone}
                                  onChange={(e) => setViewingData(prev => ({ ...prev, phone: e.target.value }))}
                                  placeholder="+971 50 123 4567"
                                  className="w-full px-4 py-3 bg-gray-50 border-0 rounded-xl focus:bg-white focus:ring-2 focus:ring-primary-500 focus:outline-none transition-all duration-200 text-gray-900 font-medium"
                                />
                              </div>
                            </div>

                            <div className="relative">
                              <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-2">
                                Message (Optional)
                              </label>
                              <textarea
                                value={viewingData.message}
                                onChange={(e) => setViewingData(prev => ({ ...prev, message: e.target.value }))}
                                placeholder="Any specific requirements or questions..."
                                rows={3}
                                className="w-full px-4 py-3 bg-gray-50 border-0 rounded-xl focus:bg-white focus:ring-2 focus:ring-primary-500 focus:outline-none transition-all duration-200 text-gray-900 font-medium resize-none"
                              />
                            </div>
                          </div>

                          <div className="flex space-x-3 pt-2">
                            <button
                              type="button"
                              onClick={() => setShowViewingForm(false)}
                              className="flex-1 bg-white border-2 border-gray-200 hover:border-gray-300 text-gray-700 font-semibold py-3 px-4 rounded-xl transition-all duration-200 hover:bg-gray-50"
                            >
                              Back
                            </button>
                            <button
                              type="submit"
                              className="flex-1 bg-gradient-to-r from-primary-600 to-primary-700 hover:from-primary-700 hover:to-primary-800 text-white font-semibold py-3 px-4 rounded-xl transition-all duration-200 transform hover:scale-[1.02] shadow-lg hover:shadow-xl flex items-center justify-center"
                            >
                              <Calendar className="w-4 h-4 mr-2" />
                              Book Viewing
                            </button>
                          </div>
                        </form>
                      ) : viewingBooked ? (
                        // Viewing Confirmed State
                        <div className="text-center space-y-5">
                          <div className="w-20 h-20 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center mx-auto shadow-lg">
                            <Calendar className="w-10 h-10 text-white" />
                          </div>
                          <div>
                            <h3 className="text-xl font-bold text-gray-900 mb-2">Viewing Scheduled!</h3>
                            <p className="text-gray-600 text-sm leading-relaxed">
                              Your viewing appointment has been scheduled. Our agent will contact you shortly to confirm the details.
                            </p>
                          </div>
                          <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-4 rounded-xl border border-blue-200">
                            <div className="space-y-2 text-sm">
                              <div className="flex items-center text-blue-700">
                                <Calendar className="w-4 h-4 mr-2" />
                                <span className="font-medium">{new Date(viewingData.preferredDate).toLocaleDateString()} at {viewingData.preferredTime}</span>
                              </div>
                              <div className="flex items-center text-blue-700">
                                <Phone className="w-4 h-4 mr-2" />
                                <span className="font-medium">Agent will call: {viewingData.phone}</span>
                              </div>
                            </div>
                          </div>
                          <div className="grid grid-cols-2 gap-3">
                            <button
                              onClick={() => {
                                setViewingBooked(false);
                                setShowViewingForm(false);
                                setViewingData({
                                  preferredDate: '',
                                  preferredTime: '',
                                  fullName: '',
                                  email: '',
                                  phone: '',
                                  message: ''
                                });
                              }}
                              className="bg-white border-2 border-gray-200 hover:border-gray-300 text-gray-700 font-semibold py-3 px-4 rounded-xl transition-all duration-200 hover:bg-gray-50"
                            >
                              Book Another
                            </button>
                            <button
                              onClick={() => setShowApplicationForm(true)}
                              className="bg-gradient-to-r from-primary-600 to-primary-700 hover:from-primary-700 hover:to-primary-800 text-white font-semibold py-3 px-4 rounded-xl transition-all duration-200 transform hover:scale-[1.02] shadow-lg hover:shadow-xl flex items-center justify-center"
                            >
                              <FileText className="w-4 h-4 mr-2" />
                              Apply Now
                            </button>
                          </div>
                        </div>
                      ) : null}
                    </div>
                  )}
                </div>

                {/* Contact Host Section */}
                <div className="border-t border-gray-100 p-6 bg-gray-50">
                  <h4 className="font-semibold text-gray-900 mb-4">Contact Host</h4>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      onClick={handleCallHost}
                      className="flex items-center justify-center px-4 py-3 bg-white border border-gray-200 hover:border-gray-300 text-gray-700 font-medium rounded-xl transition-all duration-200 hover:bg-gray-50"
                    >
                      <Phone className="w-4 h-4 mr-2" />
                      Call
                    </button>
                    <button
                      onClick={handleMessageHost}
                      className="flex items-center justify-center px-4 py-3 bg-white border border-gray-200 hover:border-gray-300 text-gray-700 font-medium rounded-xl transition-all duration-200 hover:bg-gray-50"
                    >
                      <Mail className="w-4 h-4 mr-2" />
                      Message
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PropertyDetailPage; 