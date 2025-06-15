import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Map } from 'lucide-react'
import { Button } from '../components/ui/Button'
import { MapView } from '../components/maps/MapView'
import { PropertyCard } from '../components/property/PropertyCard'
import { UnifiedSearchBar } from '../components/search/UnifiedSearchBar'
import { RentalType, PropertyCategory, PropertyStatus, PriceUnit, PropertyType } from '../types'
import { apiService } from '../services/api'

const HomePage: React.FC = () => {
  const navigate = useNavigate();
  const [showMapView, setShowMapView] = useState(false);
  const [featuredProperties, setFeaturedProperties] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Load real properties from API
  useEffect(() => {
    const loadProperties = async () => {
      setLoading(true);
      console.log('Loading properties...'); // Debug log
      console.log('API Base URL:', process.env.REACT_APP_API_URL || 'http://localhost:5001/api'); // Debug log
      
      try {
        const result = await apiService.getProperties({ limit: 6 }) as any;
        console.log('API Result:', result); // Debug log
        console.log('result.properties:', result.properties); // Debug log
        console.log('Properties array length:', result.properties?.length); // Debug log
        
        // Handle both direct properties array and nested data structure
        let propertiesArray = [];
        if (result && Array.isArray(result)) {
          // Direct array response
          propertiesArray = result;
        } else if (result && result.properties && Array.isArray(result.properties)) {
          // Nested response with properties field
          propertiesArray = result.properties;
        } else if (result && result.data && Array.isArray(result.data)) {
          // Response with data field
          propertiesArray = result.data;
        } else if (result && result.data && result.data.properties && Array.isArray(result.data.properties)) {
          // Nested data.properties structure
          propertiesArray = result.data.properties;
        }
        
        console.log('Properties array:', propertiesArray); // Debug log
        console.log('Properties count:', propertiesArray.length); // Debug log
        
        if (propertiesArray.length > 0) {
          const transformedProperties = propertiesArray.map((property: any) => ({
            ...property,
            location: `${property.address || property.city}, ${property.city}`,
            coordinates: { 
              lat: property.latitude || 25.2048, 
              lng: property.longitude || 55.2708 
            },
            image: property.images?.[0]?.url || property.images?.[0] || 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=800',
            price: property.basePrice || property.base_price || 0,
            priceUnit: 'night',
            type: 'short-term',
            badge: property.isInstantBook || property.is_instant_book ? 'Instant Book' : 'Featured',
            badgeColor: property.isInstantBook || property.is_instant_book ? 'bg-success-600' : 'bg-primary-600',
            // Use real rating data
            rating: property.averageRating || property.rating || null,
            reviewCount: property.reviewCount || property.review_count || 0
          }));
          
          console.log('Transformed Properties:', transformedProperties); // Debug log
          console.log('Number of properties:', transformedProperties.length); // Debug log
          setFeaturedProperties(transformedProperties);
        } else {
          console.error('No properties found in result:');
          console.error('- result exists:', !!result);
          console.error('- result.properties exists:', !!result?.properties);
          console.error('- is properties array:', Array.isArray(result?.properties));
          console.error('Full result:', result);
          setFeaturedProperties([]);
        }
      } catch (error) {
        console.error('Error loading properties:', error);
        console.error('Error details:', {
          message: error instanceof Error ? error.message : 'Unknown error',
          stack: error instanceof Error ? error.stack : undefined,
          name: error instanceof Error ? error.name : 'Unknown'
        });
        setFeaturedProperties([]);
      } finally {
        setLoading(false);
        console.log('Loading complete'); // Debug log
      }
    };

    loadProperties();
  }, []);

  const handleViewDetails = (propertyId: string) => {
    navigate(`/property/${propertyId}`);
  };

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section 
        className="relative text-white bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage: `url('https://images.unsplash.com/photo-1512453979798-5ea266f8880c?w=1920&h=1080&fit=crop&q=80')`,
          minHeight: '90vh'
        }}
      >
        {/* Dark overlay for better text readability */}
        <div className="absolute inset-0 bg-gradient-to-br from-black/60 via-black/50 to-black/70"></div>
        <div className="relative container mx-auto px-4 py-20 lg:py-32 overflow-visible">
          <div className="max-w-4xl mx-auto text-center overflow-visible">
            <h1 className="text-3xl md:text-4xl lg:text-6xl font-bold mb-6 leading-tight drop-shadow-lg">
              Find Your Perfect Stay in the UAE
            </h1>
            <p className="text-lg md:text-xl lg:text-2xl mb-8 text-white/90 drop-shadow-md">
              Discover verified properties for short-term and long-term rentals across the Emirates
            </p>
            
            {/* Unified Search Bar */}
            <div className="relative z-50">
              <UnifiedSearchBar className="overflow-visible z-50" />
            </div>
          </div>
        </div>
      </section>

      {/* Featured Properties Section */}
      <section className="py-12 md:py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-6 md:mb-8 gap-4">
            <div>
              <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">Featured Properties</h2>
              <p className="text-sm md:text-base text-gray-600">Discover the best places to stay across the UAE</p>
            </div>
            <div className="flex items-center space-x-2">
              <Button
                variant={showMapView ? "outline" : "primary"}
                onClick={() => setShowMapView(false)}
                size="sm"
              >
                Grid
              </Button>
              <Button
                variant={showMapView ? "primary" : "outline"}
                onClick={() => setShowMapView(true)}
                leftIcon={<Map className="w-4 h-4" />}
                size="sm"
              >
                Map
              </Button>
            </div>
          </div>

          {showMapView ? (
            <div className="mb-6 md:mb-8">
              <MapView
                properties={featuredProperties.map(prop => ({
                  id: prop.id,
                  title: prop.title,
                  city: prop.location.split(', ')[1] || 'Dubai',
                  emirate: 'Dubai',
                  coordinates: {
                    latitude: prop.coordinates.lat,
                    longitude: prop.coordinates.lng,
                  },
                  images: [{ id: '1', propertyId: prop.id, url: prop.image, isMain: true, order: 1 }],
                  pricing: {
                    id: '1',
                    propertyId: prop.id,
                    basePrice: prop.price,
                    priceUnit: prop.priceUnit === 'night' ? 'NIGHT' : 'MONTH',
                  },
                  rating: prop.rating,
                  reviewCount: prop.reviewCount,
                  bedrooms: prop.bedrooms,
                  bathrooms: prop.bathrooms,
                  maxGuests: prop.guests,
                  type: prop.type as any,
                  instantBook: prop.badge === 'Instant Book',
                } as any))}
                onPropertyClick={(property) => handleViewDetails(property.id)}
                height="400px"
                className="rounded-xl"
              />
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-4 md:gap-6 mb-6 md:mb-8">
              {loading ? (
                // Loading skeleton
                Array.from({ length: 12 }).map((_, index) => (
                  <div key={index} className="bg-white rounded-xl shadow-md overflow-hidden animate-pulse">
                    <div className="h-48 bg-gray-200"></div>
                    <div className="p-4 md:p-6">
                      <div className="h-4 bg-gray-200 rounded mb-2"></div>
                      <div className="h-6 bg-gray-200 rounded mb-2"></div>
                      <div className="h-4 bg-gray-200 rounded mb-4"></div>
                      <div className="flex justify-between">
                        <div className="h-6 bg-gray-200 rounded w-24"></div>
                        <div className="h-8 bg-gray-200 rounded w-20"></div>
                      </div>
                    </div>
                  </div>
                ))
              ) : featuredProperties.length === 0 ? (
                // No properties found
                <div className="col-span-full text-center py-12">
                  <div className="text-gray-500 mb-4">
                    <Map className="w-12 h-12 mx-auto mb-4" />
                    <h3 className="text-lg font-medium mb-2">No properties found</h3>
                    <p className="text-sm md:text-base">We're working on adding more properties. Please check back soon!</p>
                  </div>
                </div>
              ) : (
                // Properties grid
                featuredProperties.map((property) => (
                  <PropertyCard
                    key={property.id}
                    property={{
                      id: property.id,
                      hostId: property.hostId || '',
                      host: property.host || null,
                      title: property.title,
                      description: property.description || '',
                      slug: property.id,
                      type: PropertyType.APARTMENT,
                      rentalType: property.type === 'short-term' ? RentalType.SHORT_TERM : RentalType.LONG_TERM,
                      category: PropertyCategory.RESIDENTIAL,
                      status: PropertyStatus.ACTIVE,
                      emirate: property.location.split(', ')[1] || 'Dubai',
                      city: property.location.split(', ')[0] || 'Dubai',
                      area: property.location.split(', ')[0] || 'Dubai',
                      address: property.location,
                      coordinates: property.coordinates || { latitude: 25.2048, longitude: 55.2708 },
                      bedrooms: property.bedrooms || 1,
                      bathrooms: property.bathrooms || 1,
                      maxGuests: property.guests || 1,
                      areaSize: 100,
                      floor: 1,
                      amenities: [],
                      houseRules: [],
                      safetyFeatures: [],
                      accessibility: [],
                      images: [{ 
                        id: '1', 
                        propertyId: property.id, 
                        url: property.image, 
                        isMain: true, 
                        order: 1 
                      }],
                      pricing: {
                        id: '1',
                        propertyId: property.id,
                        basePrice: property.price,
                        priceUnit: property.priceUnit === 'night' ? PriceUnit.NIGHT : PriceUnit.MONTH,
                        weekendSurcharge: 0,
                        monthlyDiscount: 0,
                        securityDeposit: 500,
                        cleaningFee: 0,
                      },
                      availability: [],
                      instantBook: property.badge === 'Instant Book',
                      minStay: 1,
                      checkInTime: '15:00',
                      checkOutTime: '11:00',
                      rating: property.rating,
                      reviewCount: property.reviewCount || 0,
                      viewCount: 0,
                      favoriteCount: 0,
                      bookingCount: 0,
                      createdAt: new Date(),
                      updatedAt: new Date(),
                      bookings: [],
                      reviews: [],
                    }}
                    onClick={(prop) => handleViewDetails(prop.id)}
                  />
                ))
              )}
            </div>
          )}
        </div>
      </section>
    </div>
  )
}

export default HomePage