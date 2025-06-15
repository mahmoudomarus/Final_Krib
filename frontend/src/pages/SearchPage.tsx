import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { PropertyCard } from '../components/property/PropertyCard';
import { MapView } from '../components/maps/MapView';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { MapPin, SlidersHorizontal, Grid3X3, List, Map } from 'lucide-react';
import { Property, RentalType, PropertyType, DurationType } from '../types';
import { apiService } from '../services/api';
import { useSearch } from '../contexts/SearchContext';
import { searchService, SearchFilters } from '../services/searchService';
import { useAuth } from '../contexts/AuthContext';

const SearchPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const { searchData, setSearchData } = useSearch();
  const { user } = useAuth();
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'list' | 'map'>('grid');
  const [showFilters, setShowFilters] = useState(false);
  
  const [filters, setFilters] = useState<{
    location?: string;
    emirate?: string;
    checkIn?: Date;
    checkOut?: Date;
    guests?: number;
    rentalType?: RentalType;
    duration?: DurationType;
    propertyTypes?: PropertyType[];
    priceRange?: [number, number];
  }>({});

  // Initialize search context from URL params on mount
  useEffect(() => {
    const urlLocation = searchParams.get('location');
    const urlCheckIn = searchParams.get('checkIn');
    const urlCheckOut = searchParams.get('checkOut');
    const urlGuests = searchParams.get('guests');
    const urlType = searchParams.get('type');
    const urlBedrooms = searchParams.get('bedrooms');
    const urlBathrooms = searchParams.get('bathrooms');
    const urlPropertyType = searchParams.get('propertyType');

    // Update search context with URL params
    setSearchData(prev => ({
      ...prev,
      location: urlLocation || prev.location,
      checkIn: urlCheckIn || prev.checkIn,
      checkOut: urlCheckOut || prev.checkOut,
      guests: urlGuests ? parseInt(urlGuests) : prev.guests,
      adults: urlGuests ? parseInt(urlGuests) : prev.adults,
      rentalType: (urlType as 'short-term' | 'long-term') || prev.rentalType,
      bedrooms: urlBedrooms || prev.bedrooms,
      bathrooms: urlBathrooms || prev.bathrooms,
      propertyType: urlPropertyType || prev.propertyType,
    }));
  }, [searchParams, setSearchData]);

  // Load properties using intelligent search service
  useEffect(() => {
    const loadProperties = async () => {
      try {
        setLoading(true);
        setError(null);

        // Get search query from URL
        const query = searchParams.get('q') || '';
        
        // Build search filters from URL parameters
        const searchFilters: SearchFilters = {
          emirate: searchParams.get('emirate') || undefined,
          city: searchParams.get('city') || undefined,
          area: searchParams.get('area') || undefined,
          propertyType: searchParams.get('propertyType') || undefined,
          rentalType: searchParams.get('rentalType') || undefined,
          minPrice: searchParams.get('minPrice') ? Number(searchParams.get('minPrice')) : undefined,
          maxPrice: searchParams.get('maxPrice') ? Number(searchParams.get('maxPrice')) : undefined,
          bedrooms: searchParams.get('bedrooms') ? Number(searchParams.get('bedrooms')) : undefined,
          bathrooms: searchParams.get('bathrooms') ? Number(searchParams.get('bathrooms')) : undefined,
          maxGuests: searchParams.get('guests') ? Number(searchParams.get('guests')) : undefined,
          instantBook: searchParams.get('instantBook') === 'true' ? true : undefined,
          amenities: searchParams.get('amenities') || undefined,
        };

        console.log('Search query:', query);
        console.log('Search filters:', searchFilters);
        console.log('API Base URL:', process.env.REACT_APP_API_URL || 'http://localhost:5001/api');

        // Use intelligent search service
        const result = await searchService.searchProperties(query, searchFilters);
        console.log('Search result:', result);

        // Handle different API response structures
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

        console.log('Properties array:', propertiesArray);
        console.log('Properties count:', propertiesArray.length);

        // Transform API data to match frontend Property type
        const transformedProperties = propertiesArray.map((prop: any) => ({
          id: prop.id,
          hostId: prop.hostId || prop.host_id,
          host: prop.host || prop.users,
          title: prop.title,
          description: prop.description,
          slug: prop.id,
          type: prop.type,
          rentalType: (prop.isInstantBook || prop.is_instant_book) ? 'SHORT_TERM' : 'LONG_TERM',
          category: 'RESIDENTIAL',
          status: 'ACTIVE',
          emirate: prop.emirate,
          city: prop.city,
          area: prop.area || prop.city,
          address: prop.address,
          coordinates: { 
            latitude: prop.latitude || 25.2048, 
            longitude: prop.longitude || 55.2708 
          },
          bedrooms: prop.bedrooms,
          bathrooms: prop.bathrooms,
          maxGuests: prop.guests,
          areaSize: prop.area || (prop.bedrooms === 0 ? 600 : prop.bedrooms * 400),
          floor: 1,
          amenities: prop.amenities ? prop.amenities.split(',') : [],
          houseRules: prop.houseRules || prop.house_rules ? (prop.houseRules || prop.house_rules).split(',') : [],
          safetyFeatures: ['smoke_detector', 'fire_extinguisher'],
          accessibility: [],
          images: Array.isArray(prop.images) 
            ? prop.images.map((img: any, index: number) => ({
                id: `${prop.id}-${index}`,
                propertyId: prop.id,
                url: typeof img === 'string' ? img : img.url,
                isMain: index === 0,
                order: index + 1,
              }))
            : prop.images && typeof prop.images === 'string'
            ? prop.images.split(',').map((url: string, index: number) => ({
            id: `${prop.id}-${index}`,
            propertyId: prop.id,
            url: url.trim(),
            isMain: index === 0,
            order: index + 1,
              }))
            : [],
          pricing: {
            id: `p-${prop.id}`,
            propertyId: prop.id,
            basePrice: prop.basePrice || prop.base_price || 0,
            priceUnit: 'NIGHT',
            weekendSurcharge: 0,
            monthlyDiscount: 0,
            securityDeposit: prop.securityDeposit || prop.security_deposit || 500,
            cleaningFee: prop.cleaningFee || prop.cleaning_fee || 0,
          },
          // REAL RATINGS - Use actual API data, not fake values
          rating: prop.averageRating || prop.rating || null, // null if no reviews yet
          reviewCount: prop.reviewCount || prop.review_count || 0, // 0 if no reviews yet
          isInstantBook: prop.isInstantBook || prop.is_instant_book || false,
          isVerified: prop.verificationStatus === 'VERIFIED' || prop.verification_status === 'VERIFIED',
          isFeatured: false,
          createdAt: new Date(prop.createdAt || prop.created_at),
          updatedAt: new Date(prop.updatedAt || prop.updated_at),
        }));

        setProperties(transformedProperties);

        // Track search analytics
        try {
          await searchService.trackSearch(query, searchFilters, transformedProperties.length);
        } catch (analyticsError) {
          console.error('Failed to track search analytics:', analyticsError);
          // Don't fail the search if analytics fails
        }

      } catch (err) {
        console.error('Error loading properties:', err);
        setError('Failed to load properties. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    loadProperties();
  }, [searchParams]);

  const handlePropertyClick = (property: Property) => {
    navigate(`/property/${property.id}`);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Results Section */}
      <section className="container mx-auto px-4 py-8">
        {/* Results Header */}
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between mb-6 gap-4">
          <div>
            <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 mb-2">
              {searchData.location ? `Properties in ${searchData.location}` : 'All Properties'}
            </h1>
            <p className="text-gray-600">
              {loading ? 'Searching...' : `${properties.length} properties found`}
            </p>
          </div>
          
          {/* View Controls */}
          <div className="flex items-center space-x-2">
            <Button
              variant={viewMode === 'grid' ? 'primary' : 'outline'}
              onClick={() => setViewMode('grid')}
              size="sm"
              leftIcon={<Grid3X3 className="w-4 h-4" />}
            >
              Grid
            </Button>
            <Button
              variant={viewMode === 'list' ? 'primary' : 'outline'}
              onClick={() => setViewMode('list')}
              size="sm"
              leftIcon={<List className="w-4 h-4" />}
            >
              List
            </Button>
            <Button
              variant={viewMode === 'map' ? 'primary' : 'outline'}
              onClick={() => setViewMode('map')}
              size="sm"
              leftIcon={<Map className="w-4 h-4" />}
            >
              Map
            </Button>
          </div>
        </div>

        {/* Error State */}
        {error && (
          <Card className="text-center py-12 mb-6 border-red-200 bg-red-50">
            <h3 className="text-lg font-medium text-red-900 mb-2">Error Loading Properties</h3>
            <p className="text-red-700 mb-4">{error}</p>
            <Button onClick={() => window.location.reload()}>
              Try Again
            </Button>
          </Card>
        )}

        {/* Loading State */}
        {loading && (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-4">
            {Array.from({ length: 18 }).map((_, index) => (
              <Card key={index} className="animate-pulse">
                <div className="h-48 bg-gray-200 rounded-lg mb-4"></div>
                <div className="space-y-3">
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                  <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                  <div className="h-6 bg-gray-200 rounded w-1/4"></div>
                </div>
              </Card>
            ))}
          </div>
        )}

        {/* Properties Display */}
        {!loading && !error && (
          <>
            {viewMode === 'map' ? (
              <div className="h-[600px] rounded-lg overflow-hidden shadow-lg">
                <MapView
                  properties={properties}
                  onPropertyClick={handlePropertyClick}
                  height="100%"
                />
              </div>
            ) : (
              <div className={`grid gap-4 ${
                viewMode === 'grid' 
                  ? 'grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6' 
                  : 'grid-cols-1'
              }`}>
                {properties.length === 0 ? (
                  <Card className="col-span-full text-center py-12">
                    <div className="text-gray-500">
                      <MapPin className="w-12 h-12 mx-auto mb-4" />
                      <h3 className="text-lg font-medium mb-2">No Properties Found</h3>
                      <p className="text-sm">
                        Try adjusting your search criteria or location to find more properties.
                      </p>
                    </div>
                  </Card>
                ) : (
                  properties.map((property) => (
                    <PropertyCard
                      key={property.id}
                      property={property}
                      onClick={() => handlePropertyClick(property)}
                      layout={viewMode === 'list' ? 'list' : 'grid'}
                    />
                  ))
                )}
              </div>
            )}
          </>
        )}
      </section>
    </div>
  );
};

export default SearchPage; 