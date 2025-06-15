import React, { useEffect, useState, useRef } from 'react';
import { Search, Plus, Minus, ChevronLeft, ChevronRight } from 'lucide-react';
import { useSearch } from '../../contexts/SearchContext';
import { useAuth } from '../../contexts/AuthContext';
import { Button } from '../ui/Button';
import { apiService } from '../../services/api';
import { RoleService } from '../../services/roleService';

// Move-in options for long-term rentals
const moveInOptions = [
  { id: 'immediate', label: 'Immediate', description: 'Ready to move in now' },
  { id: 'week', label: 'In a week', description: 'Within 7 days' },
  { id: 'month', label: 'In a month', description: 'Within 30 days' },
  { id: 'flexible', label: 'Flexible', description: 'I can wait for the right place' }
];

// Duration options for long-term rentals
const durationOptions = [
  { id: '6-months', label: '6 months', description: 'Medium-term stay' },
  { id: '1-year', label: '1 year', description: 'Annual lease' },
  { id: '2-years', label: '2 years', description: 'Long-term commitment' },
  { id: '3-years', label: '3+ years', description: 'Extended stay' },
  { id: 'flexible', label: 'Flexible', description: 'Open to different terms' }
];

// Date picker helper functions
const months = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

interface UnifiedSearchBarProps {
  variant?: 'compact' | 'expanded';
  className?: string;
}

interface SearchSuggestion {
  type: 'location' | 'property_type' | 'property';
  value: string;
  label: string;
  sublabel?: string;
  category: string;
  icon?: string;
  color?: string;
}

interface PopularSearchData {
  popularLocations: Array<{ location: string; count: number }>;
  popularTypes: Array<{ type: string; count: number }>;
  trendingSearches: string[];
}

export const UnifiedSearchBar: React.FC<UnifiedSearchBarProps> = ({ 
  variant = 'expanded', 
  className = '' 
}) => {
  const { searchData, uiState, updateSearchField, updateUIField, handleSearch } = useSearch();
  const { user } = useAuth();
  const [searchSuggestions, setSearchSuggestions] = useState<SearchSuggestion[]>([]);
  const [popularSearches, setPopularSearches] = useState<PopularSearchData | null>(null);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  const searchTimeoutRef = useRef<NodeJS.Timeout>();

  // Determine search behavior based on user role
  const getSearchBehavior = () => {
    if (!user) {
      return {
        type: 'guest',
        showShortTerm: true,
        showLongTerm: true,
        placeholder: 'Search destinations',
        defaultRentalType: 'short-term' as const
      };
    }

    const userRole = RoleService.getUserRole(user);

    switch (userRole) {
      case 'super_admin':
        return {
          type: 'admin',
          showShortTerm: true,
          showLongTerm: true,
          placeholder: 'Search all properties (Admin)',
          defaultRentalType: 'short-term' as const
        };
      case 'host':
        return {
          type: 'host',
          showShortTerm: true,
          showLongTerm: false, // Hosts focus on short-term
          placeholder: 'Search destinations for guests',
          defaultRentalType: 'short-term' as const
        };
      case 'agent':
        return {
          type: 'lister',
          showShortTerm: false,
          showLongTerm: true, // Listers focus on long-term
          placeholder: 'Search long-term properties',
          defaultRentalType: 'long-term' as const
        };
      default:
        return {
          type: 'guest',
          showShortTerm: true,
          showLongTerm: true,
          placeholder: 'Search destinations',
          defaultRentalType: 'short-term' as const
        };
    }
  };

  const searchBehavior = getSearchBehavior();

  // Fetch popular searches on component mount
  useEffect(() => {
    const fetchPopularSearches = async () => {
      try {
        const response = await apiService.get('/properties/popular-searches') as PopularSearchData;
        setPopularSearches(response);
      } catch (error) {
        console.error('Error fetching popular searches:', error);
        // Fallback to basic suggestions
        setPopularSearches({
          popularLocations: [
            { location: 'Dubai', count: 8 },
            { location: 'Abu Dhabi', count: 3 },
            { location: 'Sharjah', count: 1 }
          ],
          popularTypes: [
            { type: 'APARTMENT', count: 2 },
            { type: 'VILLA', count: 1 }
          ],
          trendingSearches: ['Dubai Marina', 'Downtown Dubai', 'Business Bay']
        });
      }
    };

    fetchPopularSearches();
  }, []);

  // Fetch search suggestions based on user input
  const fetchSearchSuggestions = async (query: string) => {
    if (!query || query.length < 2) {
      setSearchSuggestions([]);
      return;
    }

    setLoadingSuggestions(true);
    try {
      const response = await apiService.get(`/properties/autocomplete?q=${encodeURIComponent(query)}&limit=8`) as { suggestions: SearchSuggestion[] };
      // Add icons and colors based on category
      const enhancedSuggestions = response.suggestions.map((suggestion: SearchSuggestion) => ({
        ...suggestion,
        icon: getCategoryIcon(suggestion.category),
        color: getCategoryColor(suggestion.category)
      }));
      setSearchSuggestions(enhancedSuggestions);
    } catch (error) {
      console.error('Error fetching search suggestions:', error);
      setSearchSuggestions([]);
    } finally {
      setLoadingSuggestions(false);
    }
  };

  // Handle location input change with debouncing
  const handleLocationChange = (value: string) => {
    updateSearchField('location', value);
    
    // Clear existing timeout
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    // Set new timeout for API call
    searchTimeoutRef.current = setTimeout(() => {
      fetchSearchSuggestions(value);
    }, 300);
  };

  // Get category-specific icons and colors
  const getCategoryIcon = (category: string): string => {
    switch (category) {
      case 'Emirate': return '🇦🇪';
      case 'City': return '🏙️';
      case 'Area': return '📍';
      case 'Property Type': return '🏠';
      case 'Property': return '🏢';
      default: return '📍';
    }
  };

  const getCategoryColor = (category: string): string => {
    switch (category) {
      case 'Emirate': return 'bg-purple-50 text-purple-600';
      case 'City': return 'bg-blue-50 text-blue-600';
      case 'Area': return 'bg-green-50 text-green-600';
      case 'Property Type': return 'bg-orange-50 text-orange-600';
      case 'Property': return 'bg-pink-50 text-pink-600';
      default: return 'bg-gray-50 text-gray-600';
    }
  };

  // Get popular destinations for initial dropdown
  const getPopularDestinations = (): SearchSuggestion[] => {
    if (!popularSearches) return [];

    const destinations: SearchSuggestion[] = [];

    // Add popular locations
    popularSearches.popularLocations.forEach(location => {
      destinations.push({
        type: 'location',
        value: location.location,
        label: location.location,
        category: 'Popular Location',
        icon: '🔥',
        color: 'bg-red-50 text-red-600'
      });
    });

    // Add trending searches
    popularSearches.trendingSearches.forEach(search => {
      destinations.push({
        type: 'location',
        value: search,
        label: search,
        category: 'Trending',
        icon: '📈',
        color: 'bg-yellow-50 text-yellow-600'
      });
    });

    return destinations.slice(0, 6);
  };

  // Format date for display
  const formatDateForDisplay = (dateString: string): string => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return `${months[date.getMonth()]} ${date.getDate()}`;
  };

  // Get move-in display text
  const getMoveInDisplayText = (option: string): string => {
    const moveInOption = moveInOptions.find(opt => opt.id === option);
    return moveInOption ? moveInOption.label : 'Select move-in';
  };

  // Get duration display text
  const getDurationDisplayText = (option: string): string => {
    const durationOption = durationOptions.find(opt => opt.id === option);
    return durationOption ? durationOption.label : 'Select duration';
  };

  // Calendar state and functions
  const [currentDate, setCurrentDate] = useState(new Date());

  // Navigate calendar months
  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentDate(prev => {
      const newDate = new Date(prev);
      if (direction === 'prev') {
        newDate.setMonth(newDate.getMonth() - 1);
      } else {
        newDate.setMonth(newDate.getMonth() + 1);
      }
      return newDate;
    });
  };

  // Render calendar days
  const renderCalendar = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - firstDay.getDay());

    const days = [];
    const today = new Date();
    const checkInDate = searchData.checkIn ? new Date(searchData.checkIn) : null;
    const checkOutDate = searchData.checkOut ? new Date(searchData.checkOut) : null;

    for (let i = 0; i < 42; i++) {
      const currentDay = new Date(startDate);
      currentDay.setDate(startDate.getDate() + i);
      
      const isCurrentMonth = currentDay.getMonth() === month;
      const isToday = currentDay.toDateString() === today.toDateString();
      const isPast = currentDay < today;
      const isCheckIn = checkInDate && currentDay.toDateString() === checkInDate.toDateString();
      const isCheckOut = checkOutDate && currentDay.toDateString() === checkOutDate.toDateString();
      const isInRange = checkInDate && checkOutDate && currentDay > checkInDate && currentDay < checkOutDate;

      days.push(
        <button
          key={i}
          onClick={() => handleDateSelect(currentDay)}
          disabled={isPast}
          className={`
            w-10 h-10 text-sm rounded-full transition-all duration-200 
            ${!isCurrentMonth ? 'text-gray-300' : ''}
            ${isPast ? 'text-gray-300 cursor-not-allowed' : 'hover:bg-gray-100'}
            ${isToday ? 'bg-blue-100 text-blue-600 font-semibold' : ''}
            ${isCheckIn || isCheckOut ? 'bg-gray-900 text-white font-semibold' : ''}
            ${isInRange ? 'bg-gray-100' : ''}
          `}
        >
          {currentDay.getDate()}
        </button>
      );
    }

    return days;
  };

  // Handle date selection
  const handleDateSelect = (date: Date) => {
    const dateString = date.toISOString().split('T')[0];
    
    if (!searchData.checkIn || (searchData.checkIn && searchData.checkOut)) {
      // Set check-in date
      updateSearchField('checkIn', dateString);
      updateSearchField('checkOut', '');
    } else if (searchData.checkIn && !searchData.checkOut) {
      // Set check-out date
      const checkInDate = new Date(searchData.checkIn);
      if (date > checkInDate) {
        updateSearchField('checkOut', dateString);
      } else {
        // If selected date is before check-in, reset and set as new check-in
        updateSearchField('checkIn', dateString);
        updateSearchField('checkOut', '');
      }
    }
  };

  // Clear selected dates
  const clearDates = () => {
    updateSearchField('checkIn', '');
    updateSearchField('checkOut', '');
  };

  // Update guest counts
  const updateGuests = (type: 'adults' | 'children' | 'infants', action: 'add' | 'subtract') => {
    const currentValue = searchData[type];
    let newValue = currentValue;

    if (action === 'add') {
      newValue = currentValue + 1;
    } else if (action === 'subtract') {
      newValue = Math.max(type === 'adults' ? 1 : 0, currentValue - 1);
    }

    updateSearchField(type, newValue);
    
    // Update total guests count
    const totalGuests = (type === 'adults' ? newValue : searchData.adults) + 
                       (type === 'children' ? newValue : searchData.children);
    updateSearchField('guests', totalGuests);
  };

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, []);

  // Compact search bar for header
  if (variant === 'compact') {
    return (
      <div className={`relative ${className}`}>
        <div className="flex items-center bg-white rounded-full border border-gray-300 shadow-sm hover:shadow-md transition-all duration-300">
          <div className="flex-1 flex items-center">
            <input
              type="text"
              placeholder={searchBehavior.placeholder}
              value={searchData.location}
              onChange={(e) => handleLocationChange(e.target.value)}
              className="flex-1 px-6 py-3 rounded-l-full focus:outline-none text-sm font-medium placeholder-gray-500"
              onFocus={() => updateUIField('showLocationDropdown', true)}
            />
            {/* Show date and guests info only on desktop */}
            <div className="hidden md:flex items-center">
              <div className="px-4 py-3 border-l border-gray-200">
                <span className="text-sm text-gray-500">
                  {searchData.rentalType === 'short-term' 
                    ? (formatDateForDisplay(searchData.checkIn) || 'Any week')
                    : getMoveInDisplayText(searchData.moveInOption)
                  }
                </span>
              </div>
              <div className="px-4 py-3 border-l border-gray-200">
                <span className="text-sm text-gray-500">
                  {searchData.guests === 1 ? 'Add guests' : `${searchData.guests} guests`}
                </span>
              </div>
            </div>
          </div>
          <Button
            onClick={handleSearch}
            className="rounded-full bg-green-600 hover:bg-green-700 m-2 p-2"
            size="sm"
          >
            <Search className="w-4 h-4" />
          </Button>
        </div>
        
        {/* Location Dropdown */}
        {uiState.showLocationDropdown && (
          <div className="search-dropdown absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-xl border border-gray-100 z-[9999] max-h-80 overflow-y-auto">
            <div className="p-4">
              <h4 className="text-sm font-medium text-gray-900 mb-3">
                {searchData.location && searchSuggestions.length > 0 ? 'Search suggestions' : 'Popular destinations'}
              </h4>
              <div className="space-y-1">
                {loadingSuggestions ? (
                  <div className="flex items-center justify-center py-4">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-green-600"></div>
                  </div>
                ) : (
                  (searchData.location && searchSuggestions.length > 0 ? searchSuggestions : getPopularDestinations()).map((destination, index) => (
                    <div
                      key={`${destination.type}-${destination.value}-${index}`}
                      className="flex items-center space-x-3 p-3 hover:bg-gray-50 rounded-xl cursor-pointer transition-colors"
                      onClick={() => {
                        updateSearchField('location', destination.value);
                        updateUIField('showLocationDropdown', false);
                      }}
                    >
                      <div className={`w-10 h-10 rounded-lg ${destination.color} flex items-center justify-center text-lg`}>
                        {destination.icon}
                      </div>
                      <div>
                        <div className="font-medium text-gray-900">{destination.label}</div>
                        <div className="text-sm text-gray-500">{destination.sublabel || destination.category}</div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // Expanded search bar for main pages
  return (
    <div className={`relative ${className}`}>
      <div className="bg-white rounded-2xl shadow-2xl overflow-visible border border-gray-200">
        <div className="grid grid-cols-1 md:grid-cols-4 overflow-visible">
          {/* Where */}
          <div className="relative overflow-visible">
            <div
              className="search-field w-full p-4 md:p-6 text-left border-b md:border-b-0 md:border-r border-gray-200 hover:bg-gray-50 transition-all duration-200 cursor-pointer rounded-l-2xl"
              onClick={() => {
                updateUIField('showLocationDropdown', !uiState.showLocationDropdown);
                updateUIField('showDatePicker', false);
                updateUIField('showGuestPicker', false);
                updateUIField('showMoveInDropdown', false);
                updateUIField('showDurationDropdown', false);
              }}
            >
              <div className="text-xs font-bold text-gray-700 mb-2 uppercase tracking-wider">Where</div>
              <input
                type="text"
                placeholder={searchBehavior.placeholder}
                value={searchData.location}
                onChange={(e) => handleLocationChange(e.target.value)}
                className="w-full bg-transparent text-gray-900 cursor-pointer font-medium focus:outline-none"
                onFocus={() => updateUIField('showLocationDropdown', true)}
              />
            </div>
            {uiState.showLocationDropdown && (
              <div className="search-dropdown absolute top-full left-0 md:left-0 right-0 md:right-auto md:w-96 mt-2 bg-white rounded-2xl shadow-2xl border border-gray-100 z-[9999] max-h-80 overflow-y-auto">
                <div className="p-6">
                  <h4 className="text-lg font-semibold text-gray-900 mb-4">
                    {searchData.location && searchSuggestions.length > 0 ? 'Search suggestions' : 'Popular destinations'}
                  </h4>
                  <div className="space-y-2">
                    {loadingSuggestions ? (
                      <div className="flex items-center justify-center py-8">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
                      </div>
                    ) : (
                      (searchData.location && searchSuggestions.length > 0 ? searchSuggestions : getPopularDestinations()).map((destination, index) => (
                        <div
                          key={`${destination.type}-${destination.value}-${index}`}
                          className="flex items-center space-x-4 p-4 hover:bg-gray-50 rounded-xl cursor-pointer transition-all duration-200"
                          onClick={() => {
                            updateSearchField('location', destination.value);
                            updateUIField('showLocationDropdown', false);
                          }}
                        >
                          <div className={`w-12 h-12 rounded-xl ${destination.color} flex items-center justify-center text-xl shadow-sm`}>
                            {destination.icon}
                          </div>
                          <div>
                            <div className="font-semibold text-gray-900">{destination.label}</div>
                            <div className="text-sm text-gray-500">{destination.sublabel || destination.category}</div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Check In / Move In */}
          <div className="relative overflow-visible">
            <div
              className="search-field w-full p-4 md:p-6 text-left border-b md:border-b-0 md:border-r border-gray-200 hover:bg-gray-50 transition-all duration-200 cursor-pointer"
              onClick={() => {
                if (searchData.rentalType === 'short-term') {
                  updateUIField('showDatePicker', !uiState.showDatePicker);
                } else {
                  updateUIField('showMoveInDropdown', !uiState.showMoveInDropdown);
                }
                updateUIField('showLocationDropdown', false);
                updateUIField('showGuestPicker', false);
              }}
            >
              <div className="text-xs font-bold text-gray-700 mb-2 uppercase tracking-wider">
                {searchData.rentalType === 'short-term' ? 'Check In' : 'Move In'}
              </div>
              <div className="text-gray-900 cursor-pointer font-medium">
                {searchData.rentalType === 'short-term' 
                  ? (formatDateForDisplay(searchData.checkIn) || 'Add dates')
                  : getMoveInDisplayText(searchData.moveInOption)
                }
              </div>
            </div>
            {uiState.showMoveInDropdown && (
              <div className="search-dropdown absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl shadow-2xl border border-gray-100 z-[9999] p-6">
                <div className="space-y-3">
                  <h4 className="text-lg font-semibold text-gray-900 mb-4">When do you want to move in?</h4>
                  {moveInOptions.map((option) => (
                    <div
                      key={option.id}
                      className={`p-4 rounded-xl cursor-pointer transition-all duration-200 border-2 ${
                        searchData.moveInOption === option.id
                          ? 'border-gray-900 bg-gray-50'
                          : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                      }`}
                      onClick={() => {
                        updateSearchField('moveInOption', option.id);
                        updateUIField('showMoveInDropdown', false);
                      }}
                    >
                      <div className="font-semibold text-gray-900">{option.label}</div>
                      <div className="text-sm text-gray-500">{option.description}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {/* Date Picker Dropdown for Short Term */}
            {uiState.showDatePicker && searchData.rentalType === 'short-term' && (
              <div className="search-dropdown absolute top-full left-0 right-0 md:left-0 md:right-auto md:w-[720px] mt-2 bg-white rounded-2xl shadow-2xl border border-gray-100 z-[9999] p-6">
                <div className="flex flex-col space-y-6">
                  {/* Header with Dates/Months Toggle */}
                  <div className="flex items-center justify-center">
                    <div className="bg-gray-100 rounded-full p-1 flex">
                      <button
                        className="px-6 py-2 rounded-full font-medium transition-all text-sm bg-gray-600 text-white"
                      >
                        Dates
                      </button>
                      <button
                        className="px-6 py-2 rounded-full font-medium transition-all text-sm text-gray-600 hover:text-gray-800"
                      >
                        Months
                      </button>
                    </div>
                  </div>

                  {/* Dual Calendar Layout */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* Left Calendar - Check In */}
                    <div className="space-y-4">
                      {/* Month Navigation */}
                      <div className="flex items-center justify-between">
                        <button
                          onClick={() => navigateMonth('prev')}
                          className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                        >
                          <ChevronLeft className="w-5 h-5" />
                        </button>
                        <h4 className="text-lg font-semibold text-gray-900">
                          {months[currentDate.getMonth()]} {currentDate.getFullYear()}
                        </h4>
                        <div className="w-9 h-9"></div>
                      </div>

                      {/* Calendar Grid */}
                      <div className="grid grid-cols-7 gap-1">
                        {/* Days of week headers */}
                        {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map((day) => (
                          <div key={day} className="text-center text-xs font-medium text-gray-500 py-2">
                            {day}
                          </div>
                        ))}
                        
                        {/* Calendar days */}
                        {renderCalendar(currentDate)}
                      </div>
                    </div>

                    {/* Right Calendar - Check Out */}
                    <div className="space-y-4">
                      {/* Month Navigation */}
                      <div className="flex items-center justify-between">
                        <div className="w-9 h-9"></div>
                        <h4 className="text-lg font-semibold text-gray-900">
                          {months[(currentDate.getMonth() + 1) % 12]} {currentDate.getMonth() === 11 ? currentDate.getFullYear() + 1 : currentDate.getFullYear()}
                        </h4>
                        <button
                          onClick={() => navigateMonth('next')}
                          className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                        >
                          <ChevronRight className="w-5 h-5" />
                        </button>
                      </div>

                      {/* Calendar Grid */}
                      <div className="grid grid-cols-7 gap-1">
                        {/* Days of week headers */}
                        {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map((day) => (
                          <div key={day} className="text-center text-xs font-medium text-gray-500 py-2">
                            {day}
                          </div>
                        ))}
                        
                        {/* Calendar days for next month */}
                        {renderCalendar(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1))}
                      </div>
                    </div>
                  </div>

                  {/* Footer with Clear and Close buttons */}
                  <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                    <button
                      onClick={clearDates}
                      className="text-sm font-medium text-gray-600 hover:text-gray-800 underline"
                    >
                      Clear dates
                    </button>
                    <div className="flex space-x-3">
                      <Button
                        onClick={() => updateUIField('showDatePicker', false)}
                        className="bg-gray-100 text-gray-700 hover:bg-gray-200 border-0"
                      >
                        Close
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Check Out / Duration */}
          {searchData.rentalType === 'short-term' ? (
            <div className="relative overflow-visible">
              <div
                className="search-field w-full p-4 md:p-6 text-left border-b md:border-b-0 md:border-r border-gray-200 hover:bg-gray-50 transition-all duration-200 cursor-pointer"
                onClick={() => {
                  updateUIField('showDatePicker', !uiState.showDatePicker);
                  updateUIField('showLocationDropdown', false);
                  updateUIField('showGuestPicker', false);
                }}
              >
                <div className="text-xs font-bold text-gray-700 mb-2 uppercase tracking-wider">Check Out</div>
                <div className="text-gray-900 cursor-pointer font-medium">
                  {formatDateForDisplay(searchData.checkOut) || 'Add dates'}
                </div>
              </div>
            </div>
          ) : (
            <div className="relative overflow-visible">
              <div
                className="search-field w-full p-4 md:p-6 text-left border-b md:border-b-0 md:border-r border-gray-200 hover:bg-gray-50 transition-all duration-200 cursor-pointer"
                onClick={() => {
                  updateUIField('showDurationDropdown', !uiState.showDurationDropdown);
                  updateUIField('showLocationDropdown', false);
                  updateUIField('showGuestPicker', false);
                  updateUIField('showMoveInDropdown', false);
                }}
              >
                <div className="text-xs font-bold text-gray-700 mb-2 uppercase tracking-wider">Duration</div>
                <div className="text-gray-900 cursor-pointer font-medium">
                  {getDurationDisplayText(searchData.durationOption)}
                </div>
              </div>
              {uiState.showDurationDropdown && (
                <div className="search-dropdown absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl shadow-2xl border border-gray-100 z-[9999] p-6">
                  <div className="space-y-3">
                    <h4 className="text-lg font-semibold text-gray-900 mb-4">How long do you need it?</h4>
                    {durationOptions.map((option) => (
                      <div
                        key={option.id}
                        className={`p-4 rounded-xl cursor-pointer transition-all duration-200 border-2 ${
                          searchData.durationOption === option.id
                            ? 'border-gray-900 bg-gray-50'
                            : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                        }`}
                        onClick={() => {
                          updateSearchField('durationOption', option.id);
                          updateUIField('showDurationDropdown', false);
                        }}
                      >
                        <div className="font-semibold text-gray-900">{option.label}</div>
                        <div className="text-sm text-gray-500">{option.description}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Who */}
          <div className="relative overflow-visible">
            <div
              className="search-field w-full p-4 md:p-6 text-left hover:bg-gray-50 transition-all duration-200 flex items-center justify-between cursor-pointer rounded-r-2xl"
              onClick={() => {
                updateUIField('showGuestPicker', !uiState.showGuestPicker);
                updateUIField('showLocationDropdown', false);
                updateUIField('showDatePicker', false);
                updateUIField('showMoveInDropdown', false);
                updateUIField('showDurationDropdown', false);
              }}
            >
              <div>
                <div className="text-xs font-bold text-gray-700 mb-2 uppercase tracking-wider">Who</div>
                <div className="text-gray-900 cursor-pointer font-medium">
                  {searchData.guests === 1 ? 'Add guests' : `${searchData.guests} guests`}
                  {searchData.infants > 0 && `, ${searchData.infants} infant${searchData.infants > 1 ? 's' : ''}`}
                </div>
              </div>
              <Button
                onClick={handleSearch}
                className="bg-gray-900 hover:bg-gray-800 text-white rounded-full p-3 md:p-4 shadow-lg hover:shadow-xl transition-all duration-200"
              >
                <Search className="w-5 h-5 md:w-6 md:h-6" />
              </Button>
            </div>
            {uiState.showGuestPicker && (
              <div className="search-dropdown absolute top-full right-0 mt-2 bg-white rounded-2xl shadow-2xl border border-gray-100 z-[9999] w-80 overflow-hidden">
                <div className="p-8">
                  {/* Header */}
                  <div className="text-center mb-6">
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">Who's coming?</h3>
                    <p className="text-gray-500">Add guests to your search</p>
                  </div>

                  <div className="space-y-6">
                    {/* Adults */}
                    <div className="flex items-center justify-between py-4">
                      <div className="flex-1">
                        <div className="text-lg font-medium text-gray-900">Adults</div>
                        <div className="text-sm text-gray-500">Age 13 or above</div>
                      </div>
                      <div className="flex items-center space-x-4">
                        <button
                          onClick={() => updateGuests('adults', 'subtract')}
                          disabled={searchData.adults <= 1}
                          className="w-12 h-12 rounded-full border border-gray-300 flex items-center justify-center hover:border-gray-400 disabled:opacity-30 disabled:cursor-not-allowed transition-all duration-200 bg-white hover:bg-gray-50"
                        >
                          <Minus className="w-5 h-5 text-gray-600" />
                        </button>
                        <div className="w-12 text-center">
                          <span className="text-lg font-semibold text-gray-900">
                            {searchData.adults}
                          </span>
                        </div>
                        <button
                          onClick={() => updateGuests('adults', 'add')}
                          className="w-12 h-12 rounded-full border border-gray-300 flex items-center justify-center hover:border-gray-400 transition-all duration-200 bg-white hover:bg-gray-50"
                        >
                          <Plus className="w-5 h-5 text-gray-600" />
                        </button>
                      </div>
                    </div>

                    {/* Children */}
                    <div className="flex items-center justify-between py-4 border-t border-gray-100">
                      <div className="flex-1">
                        <div className="text-lg font-medium text-gray-900">Children</div>
                        <div className="text-sm text-gray-500">Ages 2-12</div>
                      </div>
                      <div className="flex items-center space-x-4">
                        <button
                          onClick={() => updateGuests('children', 'subtract')}
                          disabled={searchData.children <= 0}
                          className="w-12 h-12 rounded-full border border-gray-300 flex items-center justify-center hover:border-gray-400 disabled:opacity-30 disabled:cursor-not-allowed transition-all duration-200 bg-white hover:bg-gray-50"
                        >
                          <Minus className="w-5 h-5 text-gray-600" />
                        </button>
                        <div className="w-12 text-center">
                          <span className="text-lg font-semibold text-gray-900">
                            {searchData.children}
                          </span>
                        </div>
                        <button
                          onClick={() => updateGuests('children', 'add')}
                          className="w-12 h-12 rounded-full border border-gray-300 flex items-center justify-center hover:border-gray-400 transition-all duration-200 bg-white hover:bg-gray-50"
                        >
                          <Plus className="w-5 h-5 text-gray-600" />
                        </button>
                      </div>
                    </div>

                    {/* Infants */}
                    <div className="flex items-center justify-between py-4 border-t border-gray-100">
                      <div className="flex-1">
                        <div className="text-lg font-medium text-gray-900">Infants</div>
                        <div className="text-sm text-gray-500">Under 2</div>
                      </div>
                      <div className="flex items-center space-x-4">
                        <button
                          onClick={() => updateGuests('infants', 'subtract')}
                          disabled={searchData.infants <= 0}
                          className="w-12 h-12 rounded-full border border-gray-300 flex items-center justify-center hover:border-gray-400 disabled:opacity-30 disabled:cursor-not-allowed transition-all duration-200 bg-white hover:bg-gray-50"
                        >
                          <Minus className="w-5 h-5 text-gray-600" />
                        </button>
                        <div className="w-12 text-center">
                          <span className="text-lg font-semibold text-gray-900">
                            {searchData.infants}
                          </span>
                        </div>
                        <button
                          onClick={() => updateGuests('infants', 'add')}
                          className="w-12 h-12 rounded-full border border-gray-300 flex items-center justify-center hover:border-gray-400 transition-all duration-200 bg-white hover:bg-gray-50"
                        >
                          <Plus className="w-5 h-5 text-gray-600" />
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Footer */}
                  <div className="border-t border-gray-100 pt-6 mt-6 flex items-center justify-between">
                    <div className="text-sm text-gray-500">
                      {searchData.guests} {searchData.guests === 1 ? 'guest' : 'guests'}
                      {searchData.infants > 0 && `, ${searchData.infants} infant${searchData.infants > 1 ? 's' : ''}`}
                    </div>
                    <div className="flex space-x-3">
                      <Button
                        onClick={() => updateUIField('showGuestPicker', false)}
                        className="bg-gray-100 text-gray-700 hover:bg-gray-200 px-6 py-3 rounded-full border-0"
                      >
                        Cancel
                      </Button>
                      <Button
                        onClick={() => updateUIField('showGuestPicker', false)}
                        className="bg-gray-900 hover:bg-gray-800 text-white px-6 py-3 rounded-full"
                      >
                        Save
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Filters Row */}
        <div className="border-t border-gray-200 px-6 py-5 bg-gray-50 rounded-b-2xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-8">
              {/* Property Type */}
              <div className="flex items-center space-x-3">
                <span className="text-sm font-semibold text-gray-700">Type:</span>
                <select
                  value={searchData.propertyType}
                  onChange={(e) => updateSearchField('propertyType', e.target.value)}
                  className="text-sm border border-gray-300 bg-white rounded-lg px-3 py-2 focus:ring-2 focus:ring-gray-900 focus:border-gray-900 cursor-pointer text-gray-700 font-medium"
                >
                  <option value="">Any type</option>
                  <option value="APARTMENT">Apartment</option>
                  <option value="VILLA">Villa</option>
                  <option value="TOWNHOUSE">Townhouse</option>
                  <option value="STUDIO">Studio</option>
                  <option value="PENTHOUSE">Penthouse</option>
                </select>
              </div>

              {/* Bedrooms */}
              <div className="flex items-center space-x-3">
                <span className="text-sm font-semibold text-gray-700">Beds:</span>
                <select
                  value={searchData.bedrooms}
                  onChange={(e) => updateSearchField('bedrooms', e.target.value)}
                  className="text-sm border border-gray-300 bg-white rounded-lg px-3 py-2 focus:ring-2 focus:ring-gray-900 focus:border-gray-900 cursor-pointer text-gray-700 font-medium"
                >
                  <option value="">Any</option>
                  <option value="0">Studio</option>
                  <option value="1">1+</option>
                  <option value="2">2+</option>
                  <option value="3">3+</option>
                  <option value="4">4+</option>
                  <option value="5">5+</option>
                </select>
              </div>

              {/* Bathrooms */}
              <div className="flex items-center space-x-3">
                <span className="text-sm font-semibold text-gray-700">Baths:</span>
                <select
                  value={searchData.bathrooms}
                  onChange={(e) => updateSearchField('bathrooms', e.target.value)}
                  className="text-sm border border-gray-300 bg-white rounded-lg px-3 py-2 focus:ring-2 focus:ring-gray-900 focus:border-gray-900 cursor-pointer text-gray-700 font-medium"
                >
                  <option value="">Any</option>
                  <option value="1">1+</option>
                  <option value="2">2+</option>
                  <option value="3">3+</option>
                  <option value="4">4+</option>
                </select>
              </div>

              {/* Price Range */}
              <div className="flex items-center space-x-3">
                <span className="text-sm font-semibold text-gray-700">Price:</span>
                <select
                  value={searchData.maxPrice}
                  onChange={(e) => updateSearchField('maxPrice', e.target.value)}
                  className="text-sm border border-gray-300 bg-white rounded-lg px-3 py-2 focus:ring-2 focus:ring-gray-900 focus:border-gray-900 cursor-pointer text-gray-700 font-medium"
                >
                  <option value="">Any price</option>
                  <option value="500">Under AED 500</option>
                  <option value="1000">Under AED 1,000</option>
                  <option value="2000">Under AED 2,000</option>
                  <option value="5000">Under AED 5,000</option>
                </select>
              </div>
            </div>

            {/* Clear Filters */}
            <button
              onClick={() => {
                updateSearchField('propertyType', '');
                updateSearchField('bedrooms', '');
                updateSearchField('bathrooms', '');
                updateSearchField('maxPrice', '');
              }}
              className="text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-white px-4 py-2 rounded-lg transition-all duration-200"
            >
              Clear filters
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};