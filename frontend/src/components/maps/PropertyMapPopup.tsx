import React from 'react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { Star, Users, Bed, Bath, X, MapPin } from 'lucide-react';
import { Property } from '../../types';

interface PropertyMapPopupProps {
  property: Property;
  onClose: () => void;
  onViewProperty: () => void;
}

export const PropertyMapPopup: React.FC<PropertyMapPopupProps> = ({
  property,
  onClose,
  onViewProperty,
}) => {
  return (
    <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-50">
      <Card className="w-80 max-w-sm" padding="none">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-2 right-2 z-10 p-1 bg-white rounded-full shadow-md hover:bg-gray-50"
        >
          <X className="w-4 h-4 text-gray-600" />
        </button>

        {/* Property Image */}
        <div className="relative aspect-[4/3] overflow-hidden rounded-t-xl">
          <img
            src={
              property.images && property.images.length > 0 
                ? (typeof property.images[0] === 'string' ? property.images[0] : property.images[0].url)
                : '/placeholder-property.jpg'
            }
            alt={property.title}
            className="w-full h-full object-cover"
          />
          
          {/* Property Type Badge */}
          <Badge 
            className="absolute top-3 left-3 bg-white/90 text-gray-800"
            variant="secondary"
          >
            {property.type}
          </Badge>
        </div>

        {/* Property Details */}
        <div className="p-4">
          {/* Location and Rating */}
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center text-sm text-gray-600">
              <MapPin className="w-4 h-4 mr-1" />
              {property.city}, {property.emirate}
            </div>
            <div className="flex items-center">
              {property.rating ? (
                <>
                  <Star className="w-4 h-4 text-yellow-400 fill-current" />
                  <span className="ml-1 text-sm font-medium">{property.rating}</span>
                  <span className="ml-1 text-sm text-gray-500">({property.reviewCount || 0})</span>
                </>
              ) : (
                <span className="text-sm text-gray-500">New</span>
              )}
            </div>
          </div>

          {/* Title */}
          <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2">
            {property.title}
          </h3>

          {/* Property Details */}
          <div className="flex items-center space-x-4 mb-3 text-sm text-gray-600">
            <div className="flex items-center">
              <Users className="w-4 h-4 mr-1" />
              {property.maxGuests} guests
            </div>
            <div className="flex items-center">
              <Bed className="w-4 h-4 mr-1" />
              {property.bedrooms} bed{property.bedrooms !== 1 ? 's' : ''}
            </div>
            <div className="flex items-center">
              <Bath className="w-4 h-4 mr-1" />
              {property.bathrooms} bath{property.bathrooms !== 1 ? 's' : ''}
            </div>
          </div>

          {/* Pricing */}
          <div className="flex items-center justify-between mb-4">
            <div>
              <span className="text-lg font-bold text-gray-900">
                AED {(property.pricing?.basePrice || 0).toLocaleString()}
              </span>
              <span className="text-sm text-gray-600 ml-1">
                /{property.pricing?.priceUnit?.toLowerCase() || 'night'}
              </span>
            </div>
            
            {property.instantBook && (
              <Badge variant="success" className="text-xs">
                Instant Book
              </Badge>
            )}
          </div>

          {/* Action Button */}
          <Button 
            onClick={onViewProperty}
            className="w-full"
            size="sm"
          >
            View Details
          </Button>
        </div>
      </Card>
    </div>
  );
}; 