import React from 'react';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { Star, Heart } from 'lucide-react';
import { Property } from '../../types';

interface PropertyCardProps {
  property: Property;
  onFavoriteToggle?: (propertyId: string) => void;
  onClick?: (property: Property) => void;
  layout?: 'grid' | 'list';
}

export const PropertyCard: React.FC<PropertyCardProps> = ({
  property,
  onFavoriteToggle,
  onClick,
  layout = 'grid',
}) => {
  // Helper function to get the first image URL regardless of data structure
  const getFirstImageUrl = () => {
    if (!property.images || property.images.length === 0) {
      return '/placeholder-property.jpg';
    }
    
    const firstImage = property.images[0];
    // Handle both string URLs and image objects with url property
    if (typeof firstImage === 'string') {
      return firstImage;
    } else if (firstImage && typeof firstImage === 'object' && 'url' in firstImage) {
      return firstImage.url;
    }
    
    return '/placeholder-property.jpg';
  };

  // Grid layout (default - vertical card)
  if (layout === 'grid') {
    return (
      <Card 
        className="cursor-pointer group overflow-hidden" 
        padding="none" 
        hover
        onClick={() => onClick?.(property)}
      >
        {/* Image Gallery */}
        <div className="relative aspect-square overflow-hidden">
          <img
            src={getFirstImageUrl()}
            alt={property.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            onError={(e) => {
              (e.target as HTMLImageElement).src = '/placeholder-property.jpg';
            }}
          />
          
          {/* Favorite Button */}
          <button
            className="absolute top-3 right-3 p-2 rounded-full bg-white/80 hover:bg-white transition-colors"
            onClick={(e) => {
              e.stopPropagation();
              onFavoriteToggle?.(property.id);
            }}
          >
            <Heart className={`w-4 h-4 text-gray-600 hover:text-red-500 transition-colors`} />
          </button>

          {/* Guest Favorite Badge (if highly rated) */}
          {property.rating && property.rating >= 4.8 && (
            <Badge 
              className="absolute top-3 left-3 bg-white text-gray-800 text-xs font-medium"
              variant="secondary"
            >
              Guest favorite
            </Badge>
          )}
        </div>

        {/* Property Details */}
        <div className="p-3">
          {/* Title and Rating */}
          <div className="flex items-start justify-between mb-1">
            <h3 className="font-medium text-gray-900 line-clamp-1 flex-1 pr-2">
              {property.title}
            </h3>
            {property.rating && (
              <div className="flex items-center flex-shrink-0">
                <Star className="w-3 h-3 text-gray-900 fill-current" />
                <span className="ml-1 text-sm text-gray-900">{property.rating}</span>
              </div>
            )}
          </div>

          {/* Location */}
          <div className="text-sm text-gray-600 mb-2">
            {property.city}, {property.emirate}
          </div>

          {/* Price */}
          <div className="text-sm text-gray-900">
            <span className="font-semibold">AED {property.pricing?.basePrice?.toLocaleString() || 0}</span>
            <span className="text-gray-600"> /{property.pricing?.priceUnit?.toLowerCase() || 'night'}</span>
          </div>
        </div>
      </Card>
    );
  }

  // List layout (horizontal card) - also simplified
  return (
    <Card 
      className="cursor-pointer group overflow-hidden" 
      padding="none" 
      hover
      onClick={() => onClick?.(property)}
    >
      <div className="flex">
        {/* Image - smaller and on the left */}
        <div className="relative w-64 h-48 flex-shrink-0 overflow-hidden">
          <img
            src={getFirstImageUrl()}
            alt={property.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            onError={(e) => {
              (e.target as HTMLImageElement).src = '/placeholder-property.jpg';
            }}
          />
          
          {/* Favorite Button */}
          <button
            className="absolute top-3 right-3 p-2 rounded-full bg-white/80 hover:bg-white transition-colors"
            onClick={(e) => {
              e.stopPropagation();
              onFavoriteToggle?.(property.id);
            }}
          >
            <Heart className={`w-4 h-4 text-gray-600 hover:text-red-500 transition-colors`} />
          </button>

          {/* Guest Favorite Badge */}
          {property.rating && property.rating >= 4.8 && (
            <Badge 
              className="absolute top-3 left-3 bg-white text-gray-800 text-xs font-medium"
              variant="secondary"
            >
              Guest favorite
            </Badge>
          )}
        </div>

        {/* Property Details - main content area */}
        <div className="flex-1 p-6">
          <div className="flex justify-between items-start">
            {/* Left side - property info */}
            <div className="flex-1">
              <h3 className="font-medium text-lg text-gray-900 mb-2">
                {property.title}
              </h3>
              
              <div className="text-gray-600 mb-4">
                {property.city}, {property.emirate}
              </div>
              
              <div className="text-gray-900">
                <span className="font-semibold text-lg">AED {property.pricing?.basePrice?.toLocaleString() || 0}</span>
                <span className="text-gray-600"> /{property.pricing?.priceUnit?.toLowerCase() || 'night'}</span>
              </div>
            </div>

            {/* Right side - rating */}
            {property.rating && (
              <div className="flex items-center ml-6">
                <Star className="w-4 h-4 text-gray-900 fill-current" />
                <span className="ml-1 text-sm text-gray-900">{property.rating}</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </Card>
  );
}; 