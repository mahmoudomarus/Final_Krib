import React, { useState } from 'react';
import { Search, MapPin, Calendar, Users, SlidersHorizontal } from 'lucide-react';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Card } from '../ui/Card';
import { RentalType } from '../../types';

interface SearchParams {
  location: string;
  checkIn: string;
  checkOut: string;
  guests: number;
  rentalType: RentalType;
}

interface SearchBarProps {
  onSearch: (searchParams: SearchParams) => void;
  onFiltersOpen: () => void;
  className?: string;
  defaultValues?: Partial<SearchParams>;
}

export const SearchBar: React.FC<SearchBarProps> = ({
  onSearch,
  onFiltersOpen,
  className = '',
  defaultValues = {},
}) => {
  const [searchParams, setSearchParams] = useState<SearchParams>({
    location: '',
    checkIn: '',
    checkOut: '',
    guests: 1,
    rentalType: RentalType.SHORT_TERM,
    ...defaultValues,
  });

  const handleSearch = () => {
    onSearch(searchParams);
  };

  const handleInputChange = (field: keyof SearchParams, value: string | number | RentalType) => {
    setSearchParams(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  return (
    <Card className={`w-full ${className}`} padding="md" shadow="lg">
      <div className="flex flex-col space-y-4 lg:space-y-0 lg:flex-row lg:items-center lg:space-x-4">
        {/* Rental Type Toggle */}
        <div className="flex bg-gray-100 rounded-lg p-1">
          <button
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              searchParams.rentalType === RentalType.SHORT_TERM
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
            onClick={() => handleInputChange('rentalType', RentalType.SHORT_TERM)}
          >
            Short-term
          </button>
          <button
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              searchParams.rentalType === RentalType.LONG_TERM
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
            onClick={() => handleInputChange('rentalType', RentalType.LONG_TERM)}
          >
            Long-term
          </button>
        </div>

        {/* Location */}
        <div className="flex-1">
          <Input
            placeholder="Where are you going?"
            value={searchParams.location}
            onChange={(e) => handleInputChange('location', e.target.value)}
            leftIcon={<MapPin className="w-4 h-4" />}
            className="min-w-0"
          />
        </div>

        {/* Check-in Date */}
        <div className="lg:w-48">
          <Input
            type="date"
            placeholder="Check-in"
            value={searchParams.checkIn}
            onChange={(e) => handleInputChange('checkIn', e.target.value)}
            leftIcon={<Calendar className="w-4 h-4" />}
          />
        </div>

        {/* Check-out Date */}
        <div className="lg:w-48">
          <Input
            type="date"
            placeholder="Check-out"
            value={searchParams.checkOut}
            onChange={(e) => handleInputChange('checkOut', e.target.value)}
            leftIcon={<Calendar className="w-4 h-4" />}
          />
        </div>

        {/* Guests */}
        <div className="lg:w-32">
          <Input
            type="number"
            placeholder="Guests"
            value={searchParams.guests}
            onChange={(e) => handleInputChange('guests', parseInt(e.target.value) || 1)}
            leftIcon={<Users className="w-4 h-4" />}
            min="1"
            max="20"
          />
        </div>

        {/* Actions */}
        <div className="flex space-x-2">
          <Button
            variant="outline"
            onClick={onFiltersOpen}
            leftIcon={<SlidersHorizontal className="w-4 h-4" />}
          >
            Filters
          </Button>
          <Button
            onClick={handleSearch}
            leftIcon={<Search className="w-4 h-4" />}
            className="px-8"
          >
            Search
          </Button>
        </div>
      </div>
    </Card>
  );
}; 