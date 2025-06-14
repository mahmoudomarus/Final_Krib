import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiService } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import RentalTypeSelector, { RentalType } from '../../components/property/RentalTypeSelector';
import {
  MapPin,
  Plus,
  X,
  Home,
  Bed,
  Bath,
  Users,
  DollarSign,
  Clock,
  Shield,
  Wifi,
  Car,
  Tv,
  Coffee,
  Snowflake,
  Waves,
  Dumbbell,
  Building,
  Check,
  AlertCircle,
} from 'lucide-react';

// Define constants
const EMIRATES = [
  'Abu Dhabi',
  'Dubai',
  'Sharjah',
  'Ajman',
  'Umm Al Quwain',
  'Ras Al Khaimah',
  'Fujairah',
];

const PROPERTY_TYPES = [
  { value: 'APARTMENT', label: 'Apartment' },
  { value: 'VILLA', label: 'Villa' },
  { value: 'STUDIO', label: 'Studio' },
  { value: 'PENTHOUSE', label: 'Penthouse' },
  { value: 'TOWNHOUSE', label: 'Townhouse' },
];

const PROPERTY_CATEGORIES = [
  { value: 'ENTIRE_PLACE', label: 'Entire Place' },
  { value: 'PRIVATE_ROOM', label: 'Private Room' },
  { value: 'SHARED_ROOM', label: 'Shared Room' },
];

const AMENITIES_LIST = [
  { id: 'wifi', icon: Wifi, label: 'WiFi' },
  { id: 'parking', icon: Car, label: 'Free Parking' },
  { id: 'tv', icon: Tv, label: 'TV' },
  { id: 'kitchen', icon: Coffee, label: 'Kitchen' },
  { id: 'ac', icon: Snowflake, label: 'Air Conditioning' },
  { id: 'pool', icon: Waves, label: 'Swimming Pool' },
  { id: 'gym', icon: Dumbbell, label: 'Gym' },
  { id: 'balcony', icon: Building, label: 'Balcony' },
  { id: 'washer', icon: Home, label: 'Washer & Dryer' },
  { id: 'elevator', icon: Building, label: 'Elevator' },
  { id: 'security', icon: Shield, label: '24/7 Security' },
  { id: 'concierge', icon: Users, label: 'Concierge' },
];

interface PropertyFormData {
  // Rental type (NEW)
  rentalType: RentalType;
  title: string;
  description: string;
  type: string;
  category: string;
  emirate: string;
  city: string;
  address: string;
  latitude: number | null;
  longitude: number | null;
  bedrooms: number;
  bathrooms: number;
  guests: number;
  area: number;
  basePrice: number;
  securityDeposit: number;
  cleaningFee: number;
  // Long-term specific fields (NEW)
  yearlyPrice: number;
  monthlyPrice: number;
  utilitiesIncluded: boolean;
  maintenanceIncluded: boolean;
  contractMinDuration: number;
  contractMaxDuration: number;
  permitNumber: string; // Required for long-term rentals in UAE
  images: string[];
  amenities: string[];
  houseRules: string[];
  isInstantBook: boolean;
  minStay: number;
  maxStay: number;
  checkInTime: string;
  checkOutTime: string;
}

const AddPropertyPage: React.FC = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<any>({});
  const [newImageUrl, setNewImageUrl] = useState('');
  const [newRule, setNewRule] = useState('');

  const [formData, setFormData] = useState<PropertyFormData>({
    rentalType: 'SHORT_TERM', // Always short term
    title: '',
    description: '',
    type: '',
    category: 'ENTIRE_PLACE',
    emirate: '',
    city: '',
    address: '',
    latitude: null,
    longitude: null,
    bedrooms: 1,
    bathrooms: 1,
    guests: 2,
    area: 500,
    basePrice: 100,
    securityDeposit: 0,
    cleaningFee: 0,
    yearlyPrice: 0,
    monthlyPrice: 0,
    utilitiesIncluded: false,
    maintenanceIncluded: false,
    contractMinDuration: 6,
    contractMaxDuration: 24,
    permitNumber: '',
    images: [],
    amenities: [],
    houseRules: [],
    isInstantBook: false,
    minStay: 1,
    maxStay: 365,
    checkInTime: '15:00',
    checkOutTime: '11:00',
  });

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors((prev: any) => ({ ...prev, [field]: '' }));
    }
  };

  const handleAmenityToggle = (amenityId: string) => {
    setFormData(prev => ({
      ...prev,
      amenities: prev.amenities.includes(amenityId)
        ? prev.amenities.filter(id => id !== amenityId)
        : [...prev.amenities, amenityId],
    }));
  };

  const addImage = () => {
    if (newImageUrl.trim() && formData.images.length < 10) {
      setFormData(prev => ({
        ...prev,
        images: [...prev.images, newImageUrl.trim()],
      }));
      setNewImageUrl('');
    }
  };

  const removeImage = (index: number) => {
    setFormData(prev => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index),
    }));
  };

  const addRule = () => {
    if (newRule.trim()) {
      setFormData(prev => ({
        ...prev,
        houseRules: [...prev.houseRules, newRule.trim()],
      }));
      setNewRule('');
    }
  };

  const removeRule = (index: number) => {
    setFormData(prev => ({
      ...prev,
      houseRules: prev.houseRules.filter((_, i) => i !== index),
    }));
  };

  // Get coordinates from address using Google Maps Geocoding
  const getCoordinatesFromAddress = async () => {
    if (!formData.address || !formData.city || !formData.emirate) {
      alert('Please fill in address, city, and emirate first');
      return;
    }

    try {
      // This is a simplified version - in production, you'd use Google Maps Geocoding API
      // For now, we'll set some default coordinates for Dubai
      const defaultCoords = {
        'Abu Dhabi': { lat: 24.4539, lng: 54.3773 },
        'Dubai': { lat: 25.2048, lng: 55.2708 },
        'Sharjah': { lat: 25.3573, lng: 55.4033 },
        'Ajman': { lat: 25.4052, lng: 55.5136 },
        'Umm Al Quwain': { lat: 25.5641, lng: 55.6552 },
        'Ras Al Khaimah': { lat: 25.7889, lng: 55.9758 },
        'Fujairah': { lat: 25.1288, lng: 56.3264 },
      };

      const coords = defaultCoords[formData.emirate as keyof typeof defaultCoords];
      if (coords) {
        setFormData(prev => ({
          ...prev,
          latitude: coords.lat + (Math.random() - 0.5) * 0.1, // Add some random offset
          longitude: coords.lng + (Math.random() - 0.5) * 0.1,
        }));
        alert(`Coordinates set for ${formData.emirate}`);
      }
    } catch (error) {
      console.error('Error getting coordinates:', error);
      alert('Could not get coordinates. Please try again.');
    }
  };

  const validateStep = (step: number): boolean => {
    const newErrors: any = {};

    switch (step) {
      case 1: // Basic Info
        if (!formData.title.trim()) newErrors.title = 'Title is required';
        if (!formData.description.trim()) newErrors.description = 'Description is required';
        if (!formData.type) newErrors.type = 'Property type is required';
        if (!formData.category) newErrors.category = 'Category is required';
        break;

      case 2: // Location
        if (!formData.emirate) newErrors.emirate = 'Emirate is required';
        if (!formData.city.trim()) newErrors.city = 'City is required';
        if (!formData.address.trim()) newErrors.address = 'Address is required';
        if (!formData.latitude || !formData.longitude) {
          newErrors.coordinates = 'Please get coordinates for the property';
        }
        break;

      case 3: // Property Details
        if (formData.bedrooms < 0) newErrors.bedrooms = 'Bedrooms must be 0 or more';
        if (formData.bathrooms < 1) newErrors.bathrooms = 'At least 1 bathroom required';
        if (formData.guests < 1) newErrors.guests = 'At least 1 guest capacity required';
        if (formData.area <= 0) newErrors.area = 'Area must be positive';
        break;

      case 4: // Pricing
        if (formData.basePrice <= 0) newErrors.basePrice = 'Base price must be positive';
        if (formData.securityDeposit < 0) newErrors.securityDeposit = 'Security deposit cannot be negative';
        if (formData.cleaningFee < 0) newErrors.cleaningFee = 'Cleaning fee cannot be negative';
        break;

      case 5: // Images & Amenities
        if (formData.images.length === 0) newErrors.images = 'At least 1 image is required';
        if (formData.amenities.length === 0) newErrors.amenities = 'At least 1 amenity is required';
        break;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const nextStep = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => Math.min(prev + 1, 6));
    }
  };

  const prevStep = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
  };

  const handleSubmit = async () => {
    if (!validateStep(5)) return;

    // Check if user is authenticated and is a host
    if (!isAuthenticated || !user) {
      alert('You must be logged in to create a property');
      navigate('/login');
      return;
    }

    if (!user.is_host) {
      alert('You must be a host to create properties. Please upgrade your account.');
      navigate('/become-host');
      return;
    }

    setIsSubmitting(true);
    try {
      const propertyData = {
        ...formData,
        hostId: user.id, // Use the actual logged-in user's ID
      };

      console.log('Creating property with data:', propertyData);
      await apiService.createProperty(propertyData);
      alert('Property created successfully!');
      navigate('/host/dashboard');
    } catch (error: any) {
      console.error('Error creating property:', error);
      if (error.details) {
        // Zod validation errors
        const fieldErrors: any = {};
        error.details.forEach((detail: any) => {
          fieldErrors[detail.path[0]] = detail.message;
        });
        setErrors(fieldErrors);
      } else {
        alert('Failed to create property. Please try again.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-neutral-900 mb-4">Basic Information</h2>
            
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-2">
                Property Title *
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => handleInputChange('title', e.target.value)}
                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 ${
                  errors.title ? 'border-red-500' : 'border-neutral-300'
                }`}
                placeholder="Beautiful apartment in downtown Dubai"
              />
              {errors.title && <p className="text-red-500 text-sm mt-1">{errors.title}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-2">
                Description *
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                rows={4}
                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 ${
                  errors.description ? 'border-red-500' : 'border-neutral-300'
                }`}
                placeholder="Describe your property, its unique features, and what makes it special..."
              />
              {errors.description && <p className="text-red-500 text-sm mt-1">{errors.description}</p>}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">
                  Property Type *
                </label>
                <select
                  value={formData.type}
                  onChange={(e) => handleInputChange('type', e.target.value)}
                  className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 ${
                    errors.type ? 'border-red-500' : 'border-neutral-300'
                  }`}
                >
                  <option value="">Select type</option>
                  {PROPERTY_TYPES.map(type => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </select>
                {errors.type && <p className="text-red-500 text-sm mt-1">{errors.type}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">
                  Category *
                </label>
                <select
                  value={formData.category}
                  onChange={(e) => handleInputChange('category', e.target.value)}
                  className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 ${
                    errors.category ? 'border-red-500' : 'border-neutral-300'
                  }`}
                >
                  <option value="">Select category</option>
                  {PROPERTY_CATEGORIES.map(category => (
                    <option key={category.value} value={category.value}>
                      {category.label}
                    </option>
                  ))}
                </select>
                {errors.category && <p className="text-red-500 text-sm mt-1">{errors.category}</p>}
              </div>
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-neutral-900 mb-4">Location Details</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">
                  Emirate *
                </label>
                <select
                  value={formData.emirate}
                  onChange={(e) => handleInputChange('emirate', e.target.value)}
                  className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 ${
                    errors.emirate ? 'border-red-500' : 'border-neutral-300'
                  }`}
                >
                  <option value="">Select emirate</option>
                  {EMIRATES.map(emirate => (
                    <option key={emirate} value={emirate}>
                      {emirate}
                    </option>
                  ))}
                </select>
                {errors.emirate && <p className="text-red-500 text-sm mt-1">{errors.emirate}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">
                  City *
                </label>
                <input
                  type="text"
                  value={formData.city}
                  onChange={(e) => handleInputChange('city', e.target.value)}
                  className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 ${
                    errors.city ? 'border-red-500' : 'border-neutral-300'
                  }`}
                  placeholder="e.g. Dubai"
                />
                {errors.city && <p className="text-red-500 text-sm mt-1">{errors.city}</p>}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-2">
                Full Address *
              </label>
              <input
                type="text"
                value={formData.address}
                onChange={(e) => handleInputChange('address', e.target.value)}
                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 ${
                  errors.address ? 'border-red-500' : 'border-neutral-300'
                }`}
                placeholder="Building name, street address"
              />
              {errors.address && <p className="text-red-500 text-sm mt-1">{errors.address}</p>}
            </div>

            <div className="bg-neutral-50 p-4 rounded-lg">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="font-medium text-neutral-900">Coordinates</h3>
                  <p className="text-sm text-neutral-600">Get exact location coordinates</p>
                </div>
                <button
                  type="button"
                  onClick={getCoordinatesFromAddress}
                  className="flex items-center px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
                >
                  <MapPin className="w-4 h-4 mr-2" />
                  Get Coordinates
                </button>
              </div>
              
              {formData.latitude && formData.longitude ? (
                <div className="flex items-center text-green-600">
                  <Check className="w-4 h-4 mr-2" />
                  <span className="text-sm">
                    Coordinates: {formData.latitude.toFixed(6)}, {formData.longitude.toFixed(6)}
                  </span>
                </div>
              ) : (
                <div className="flex items-center text-amber-600">
                  <AlertCircle className="w-4 h-4 mr-2" />
                  <span className="text-sm">No coordinates set</span>
                </div>
              )}
              
              {errors.coordinates && <p className="text-red-500 text-sm mt-2">{errors.coordinates}</p>}
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-neutral-900 mb-4">Property Details</h2>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">
                  <Bed className="w-4 h-4 inline mr-1" />
                  Bedrooms *
                </label>
                <input
                  type="number"
                  min="0"
                  value={formData.bedrooms}
                  onChange={(e) => handleInputChange('bedrooms', parseInt(e.target.value) || 0)}
                  className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 ${
                    errors.bedrooms ? 'border-red-500' : 'border-neutral-300'
                  }`}
                />
                {errors.bedrooms && <p className="text-red-500 text-sm mt-1">{errors.bedrooms}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">
                  <Bath className="w-4 h-4 inline mr-1" />
                  Bathrooms *
                </label>
                <input
                  type="number"
                  min="1"
                  value={formData.bathrooms}
                  onChange={(e) => handleInputChange('bathrooms', parseInt(e.target.value) || 1)}
                  className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 ${
                    errors.bathrooms ? 'border-red-500' : 'border-neutral-300'
                  }`}
                />
                {errors.bathrooms && <p className="text-red-500 text-sm mt-1">{errors.bathrooms}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">
                  <Users className="w-4 h-4 inline mr-1" />
                  Guests *
                </label>
                <input
                  type="number"
                  min="1"
                  value={formData.guests}
                  onChange={(e) => handleInputChange('guests', parseInt(e.target.value) || 1)}
                  className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 ${
                    errors.guests ? 'border-red-500' : 'border-neutral-300'
                  }`}
                />
                {errors.guests && <p className="text-red-500 text-sm mt-1">{errors.guests}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">
                  Area (sq ft) *
                </label>
                <input
                  type="number"
                  min="1"
                  value={formData.area}
                  onChange={(e) => handleInputChange('area', parseInt(e.target.value) || 1)}
                  className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 ${
                    errors.area ? 'border-red-500' : 'border-neutral-300'
                  }`}
                />
                {errors.area && <p className="text-red-500 text-sm mt-1">{errors.area}</p>}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">
                  Minimum Stay (nights)
                </label>
                <input
                  type="number"
                  min="1"
                  value={formData.minStay}
                  onChange={(e) => handleInputChange('minStay', parseInt(e.target.value) || 1)}
                  className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">
                  Maximum Stay (nights)
                </label>
                <input
                  type="number"
                  min="1"
                  value={formData.maxStay}
                  onChange={(e) => handleInputChange('maxStay', parseInt(e.target.value) || 365)}
                  className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">
                  <Clock className="w-4 h-4 inline mr-1" />
                  Check-in Time
                </label>
                <input
                  type="time"
                  value={formData.checkInTime}
                  onChange={(e) => handleInputChange('checkInTime', e.target.value)}
                  className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">
                  <Clock className="w-4 h-4 inline mr-1" />
                  Check-out Time
                </label>
                <input
                  type="time"
                  value={formData.checkOutTime}
                  onChange={(e) => handleInputChange('checkOutTime', e.target.value)}
                  className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                />
              </div>
            </div>

            <div>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={formData.isInstantBook}
                  onChange={(e) => handleInputChange('isInstantBook', e.target.checked)}
                  className="rounded border-neutral-300 text-primary-600 focus:ring-primary-500"
                />
                <span className="ml-2 text-sm text-neutral-700">
                  Enable instant booking (guests can book without approval)
                </span>
              </label>
            </div>
          </div>
        );

      case 4:
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-neutral-900 mb-4">Pricing</h2>

            {/* Short-term Pricing */}
              <div className="bg-white border border-neutral-200 rounded-lg p-4 mb-4">
                <h3 className="font-medium text-neutral-900 mb-4">Short-term Rates</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">
                  <DollarSign className="w-4 h-4 inline mr-1" />
                      Daily Rate (AED) *
                </label>
                <input
                  type="number"
                  min="1"
                  step="0.01"
                  value={formData.basePrice}
                  onChange={(e) => handleInputChange('basePrice', parseFloat(e.target.value) || 0)}
                  className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 ${
                    errors.basePrice ? 'border-red-500' : 'border-neutral-300'
                  }`}
                      placeholder="250"
                />
                {errors.basePrice && <p className="text-red-500 text-sm mt-1">{errors.basePrice}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">
                      Cleaning Fee (AED)
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                      value={formData.cleaningFee}
                      onChange={(e) => handleInputChange('cleaningFee', parseFloat(e.target.value) || 0)}
                  className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 ${
                        errors.cleaningFee ? 'border-red-500' : 'border-neutral-300'
                  }`}
                      placeholder="50"
                />
                    {errors.cleaningFee && <p className="text-red-500 text-sm mt-1">{errors.cleaningFee}</p>}
              </div>
            </div>
              </div>

            {/* Common Settings */}
            <div className="bg-white border border-neutral-200 rounded-lg p-4">
              <h3 className="font-medium text-neutral-900 mb-4">Common Settings</h3>
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">
                  <Shield className="w-4 h-4 inline mr-1" />
                  Security Deposit (AED)
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.securityDeposit}
                  onChange={(e) => handleInputChange('securityDeposit', parseFloat(e.target.value) || 0)}
                  className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 ${
                    errors.securityDeposit ? 'border-red-500' : 'border-neutral-300'
                  }`}
                  placeholder="500"
                />
                {errors.securityDeposit && <p className="text-red-500 text-sm mt-1">{errors.securityDeposit}</p>}
              </div>
            </div>
          </div>
        );

      case 5:
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-neutral-900 mb-4">Images & Amenities</h2>
            
            {/* Images Section */}
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-2">
                Property Images * (at least 1 required)
              </label>
              
              <div className="space-y-4">
                <div className="flex gap-2">
                  <input
                    type="url"
                    value={newImageUrl}
                    onChange={(e) => setNewImageUrl(e.target.value)}
                    placeholder="Enter image URL"
                    className="flex-1 px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  />
                  <button
                    type="button"
                    onClick={addImage}
                    disabled={!newImageUrl.trim() || formData.images.length >= 10}
                    className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:bg-neutral-300 flex items-center"
                  >
                    <Plus className="w-4 h-4 mr-1" />
                    Add
                  </button>
                </div>
                
                {formData.images.length > 0 && (
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {formData.images.map((url, index) => (
                      <div key={index} className="relative">
                        <img
                          src={url}
                          alt={`Property ${index + 1}`}
                          className="w-full h-32 object-cover rounded-lg"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = 'https://via.placeholder.com/300x200?text=Image+Not+Found';
                          }}
                        />
                        <button
                          type="button"
                          onClick={() => removeImage(index)}
                          className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600"
                        >
                          <X className="w-3 h-3" />
                        </button>
                        {index === 0 && (
                          <div className="absolute bottom-2 left-2 px-2 py-1 bg-primary-600 text-white text-xs rounded">
                            Main
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
                
                {errors.images && <p className="text-red-500 text-sm">{errors.images}</p>}
              </div>
            </div>

            {/* Amenities Section */}
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-2">
                Amenities * (select at least 1)
              </label>
              
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                {AMENITIES_LIST.map((amenity) => {
                  const Icon = amenity.icon;
                  const isSelected = formData.amenities.includes(amenity.id);
                  
                  return (
                    <button
                      key={amenity.id}
                      type="button"
                      onClick={() => handleAmenityToggle(amenity.id)}
                      className={`p-3 border rounded-lg text-center transition-colors ${
                        isSelected
                          ? 'border-primary-500 bg-primary-50 text-primary-700'
                          : 'border-neutral-300 hover:border-neutral-400'
                      }`}
                    >
                      <Icon className="w-5 h-5 mx-auto mb-1" />
                      <span className="text-xs">{amenity.label}</span>
                    </button>
                  );
                })}
              </div>
              
              {errors.amenities && <p className="text-red-500 text-sm mt-2">{errors.amenities}</p>}
            </div>

            {/* House Rules Section */}
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-2">
                House Rules (optional)
              </label>
              
              <div className="space-y-4">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newRule}
                    onChange={(e) => setNewRule(e.target.value)}
                    placeholder="Enter a house rule"
                    className="flex-1 px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  />
                  <button
                    type="button"
                    onClick={addRule}
                    disabled={!newRule.trim()}
                    className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:bg-neutral-300 flex items-center"
                  >
                    <Plus className="w-4 h-4 mr-1" />
                    Add
                  </button>
                </div>
                
                {formData.houseRules.length > 0 && (
                  <div className="space-y-2">
                    {formData.houseRules.map((rule, index) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-neutral-50 rounded-lg">
                        <span className="text-sm">{rule}</span>
                        <button
                          type="button"
                          onClick={() => removeRule(index)}
                          className="p-1 text-red-500 hover:text-red-700"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        );

      case 6:
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-neutral-900 mb-4">Review & Submit</h2>
            
            <div className="bg-neutral-50 p-6 rounded-lg">
              <h3 className="font-semibold text-lg mb-4">Property Summary</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <strong>Title:</strong> {formData.title}
                </div>
                <div>
                  <strong>Type:</strong> {PROPERTY_TYPES.find(t => t.value === formData.type)?.label}
                </div>
                <div>
                  <strong>Location:</strong> {formData.address}, {formData.city}, {formData.emirate}
                </div>
                <div>
                  <strong>Capacity:</strong> {formData.guests} guests, {formData.bedrooms} bed, {formData.bathrooms} bath
                </div>
                <div>
                  <strong>Area:</strong> {formData.area} sq ft
                </div>
                <div>
                  <strong>Price:</strong> AED {formData.basePrice}
                </div>
                <div>
                  <strong>Images:</strong> {formData.images.length} photos
                </div>
                <div>
                  <strong>Amenities:</strong> {formData.amenities.length} selected
                </div>
              </div>
              
              {formData.description && (
                <div className="mt-4">
                  <strong>Description:</strong>
                  <p className="mt-1 text-neutral-600">{formData.description}</p>
                </div>
              )}
            </div>

            <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-lg">
              <div className="flex items-start">
                <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5 mr-2" />
                <div className="text-sm text-yellow-800">
                  <p className="font-medium">Before submitting:</p>
                  <ul className="mt-1 list-disc list-inside space-y-1">
                    <li>Ensure all information is accurate</li>
                    <li>Double-check image URLs are working</li>
                    <li>Verify location coordinates are set</li>
                    <li>Review pricing and fees</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  // If not authenticated, redirect to login
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 mb-4">You must be logged in to add a property.</p>
          <button
            onClick={() => navigate('/login')}
            className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
          >
            Login
          </button>
        </div>
      </div>
    );
  }

  // If not a host, show upgrade message
  if (!user?.is_host) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 mb-4">You must be a host to add properties.</p>
          <button
            onClick={() => navigate('/become-host')}
            className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
          >
            Become a Host
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="bg-white rounded-xl shadow-lg border border-neutral-200 p-8">
        <div className="flex items-center justify-between mb-2">
          <h1 className="text-3xl font-bold text-neutral-900">Add New Property</h1>
            <span className="text-sm text-neutral-500">Step {currentStep} of 6</span>
        </div>
        <div className="w-full bg-neutral-200 rounded-full h-2">
          <div
            className="bg-primary-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${(currentStep / 6) * 100}%` }}
          />
      </div>

          <form onSubmit={(e) => e.preventDefault()} className="mt-8">
        {renderStepContent()}

            <div className="mt-8 pt-6 border-t border-neutral-200 flex justify-between items-center">
        <button
          type="button"
          onClick={prevStep}
          disabled={currentStep === 1}
                className="px-6 py-2 border border-neutral-300 rounded-lg text-neutral-700 hover:bg-neutral-100 disabled:opacity-50 disabled:cursor-not-allowed"
        >
                Back
        </button>

        <div className="flex gap-2">
                {currentStep < 6 ? (
            <button
              type="button"
              onClick={nextStep}
              className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
            >
              Next
            </button>
          ) : (
            <button
              type="button"
              onClick={handleSubmit}
              disabled={isSubmitting}
                    className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-green-300"
            >
                    {isSubmitting ? 'Submitting...' : 'Submit Property'}
            </button>
          )}
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AddPropertyPage; 