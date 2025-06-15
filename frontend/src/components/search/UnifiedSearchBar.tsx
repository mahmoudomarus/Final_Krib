import React, { useEffect, useState, useRef } from 'react';
import { Search, Plus, Minus, ChevronLeft, ChevronRight, MapPin, Calendar, Users, Filter, ChevronDown, ChevronUp } from 'lucide-react';
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
  icon: string;
  color: string;
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
  const [calendarDate, setCalendarDate] = useState(new Date());
  const [showMonthView, setShowMonthView] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
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
        // Fallback to real UAE locations
        setPopularSearches({
          popularLocations: [
            { location: 'Dubai Marina', count: 45 },
            { location: 'Downtown Dubai', count: 38 },
            { location: 'Business Bay', count: 32 },
            { location: 'JBR - Jumeirah Beach Residence', count: 28 },
            { location: 'Palm Jumeirah', count: 25 },
            { location: 'Abu Dhabi', count: 22 },
            { location: 'Sharjah', count: 18 },
            { location: 'Ajman', count: 15 }
          ],
          popularTypes: [
            { type: 'APARTMENT', count: 156 },
            { type: 'VILLA', count: 89 },
            { type: 'STUDIO', count: 67 },
            { type: 'PENTHOUSE', count: 23 }
          ],
          trendingSearches: ['Dubai Marina', 'Downtown Dubai', 'Business Bay', 'JBR', 'Palm Jumeirah']
        });
      }
    };

    fetchPopularSearches();
  }, []);

  // Fetch search suggestions based on user input with enhanced autocomplete
  const fetchSearchSuggestions = async (query: string) => {
    if (!query || query.length < 2) {
      setSearchSuggestions([]);
      return;
    }

    setLoadingSuggestions(true);
    try {
      const response = await apiService.get(`/properties/autocomplete?q=${encodeURIComponent(query)}&limit=8`) as { suggestions: SearchSuggestion[] };
      
      // Enhanced suggestions with better categorization
      const enhancedSuggestions = response.suggestions.map((suggestion: SearchSuggestion) => ({
        ...suggestion,
        icon: suggestion.icon || getCategoryIcon(suggestion.category),
        color: suggestion.color || getCategoryColor(suggestion.category)
      }));

      // Add local UAE suggestions if API doesn't return enough
      if (enhancedSuggestions.length < 5) {
        const localSuggestions = getLocalSuggestions(query);
        enhancedSuggestions.push(...localSuggestions.slice(0, 8 - enhancedSuggestions.length));
      }

      setSearchSuggestions(enhancedSuggestions);
    } catch (error) {
      console.error('Error fetching search suggestions:', error);
      // Fallback to local suggestions
      setSearchSuggestions(getLocalSuggestions(query));
    } finally {
      setLoadingSuggestions(false);
    }
  };

  // Local UAE suggestions for better autocomplete
  const getLocalSuggestions = (query: string): SearchSuggestion[] => {
    const uaeLocations = [
      { name: 'Dubai Marina', type: 'Area', emirate: 'Dubai' },
      { name: 'Downtown Dubai', type: 'Area', emirate: 'Dubai' },
      { name: 'Business Bay', type: 'Area', emirate: 'Dubai' },
      { name: 'JBR - Jumeirah Beach Residence', type: 'Area', emirate: 'Dubai' },
      { name: 'Palm Jumeirah', type: 'Area', emirate: 'Dubai' },
      { name: 'Dubai Hills Estate', type: 'Area', emirate: 'Dubai' },
      { name: 'Dubai South', type: 'Area', emirate: 'Dubai' },
      { name: 'Al Barsha', type: 'Area', emirate: 'Dubai' },
      { name: 'Jumeirah Lake Towers', type: 'Area', emirate: 'Dubai' },
      { name: 'Dubai Investment Park', type: 'Area', emirate: 'Dubai' },
      { name: 'Abu Dhabi', type: 'City', emirate: 'Abu Dhabi' },
      { name: 'Al Reem Island', type: 'Area', emirate: 'Abu Dhabi' },
      { name: 'Yas Island', type: 'Area', emirate: 'Abu Dhabi' },
      { name: 'Saadiyat Island', type: 'Area', emirate: 'Abu Dhabi' },
      { name: 'Sharjah', type: 'City', emirate: 'Sharjah' },
      { name: 'Ajman', type: 'City', emirate: 'Ajman' },
      { name: 'Ras Al Khaimah', type: 'City', emirate: 'Ras Al Khaimah' },
      { name: 'Fujairah', type: 'City', emirate: 'Fujairah' }
    ];

    return uaeLocations
      .filter(location => location.name.toLowerCase().includes(query.toLowerCase()))
      .slice(0, 6)
      .map(location => ({
        type: 'location' as const,
        value: location.name,
        label: location.name,
        sublabel: `${location.type} in ${location.emirate}`,
        category: location.type,
        icon: getCategoryIcon(location.type),
        color: getCategoryColor(location.type)
      }));
  };

  // Handle location input change with enhanced debouncing
  const handleLocationChange = (value: string) => {
    updateSearchField('location', value);
    
    // Clear existing timeout
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    // Set new timeout for API call - faster response for better UX
    searchTimeoutRef.current = setTimeout(() => {
      fetchSearchSuggestions(value);
    }, 200);
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
      case 'Emirate': return 'bg-purple-50 text-purple-700 border-purple-200';
      case 'City': return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'Area': return 'bg-green-50 text-green-700 border-green-200';
      case 'Property Type': return 'bg-orange-50 text-orange-700 border-orange-200';
      case 'Property': return 'bg-gray-50 text-gray-700 border-gray-200';
      default: return 'bg-gray-50 text-gray-700 border-gray-200';
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
            onClick={() => !isPast && handleDateSelect(currentDay)}
          className={`
            w-10 h-10 text-sm rounded-full transition-all duration-200 
            ${!isCurrentMonth ? 'text-gray-300 cursor-default' : ''}
            ${isPast ? 'text-gray-300 cursor-default opacity-40' : 'hover:bg-gray-100 cursor-pointer text-gray-700'}
            ${isToday && !isPast ? 'bg-blue-100 text-blue-600 font-semibold' : ''}
            ${isCheckIn || isCheckOut ? 'bg-gray-900 text-white font-semibold' : ''}
            ${isInRange ? 'bg-gray-100' : ''}
            ${isCurrentMonth && !isPast && !isCheckIn && !isCheckOut && !isInRange ? 'hover:bg-green-50 hover:text-green-700' : ''}
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

  // Handle filter toggle and close other dropdowns
  const handleFilterToggle = () => {
    setShowFilters(!showFilters);
    // Close all other dropdowns when toggling filters
    updateUIField('showLocationDropdown', false);
    updateUIField('showDatePicker', false);
    updateUIField('showMoveInDropdown', false);
    updateUIField('showDurationDropdown', false);
    updateUIField('showGuestPicker', false);
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

  // Handle click outside to close dropdowns
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      
      // Don't close if clicking inside any dropdown or search field
      if (target.closest('.search-dropdown') || 
          target.closest('.search-field') || 
          target.closest('.calendar-container')) {
        return;
      }
      
      // Close all dropdowns
      updateUIField('showLocationDropdown', false);
      updateUIField('showDatePicker', false);
      updateUIField('showMoveInDropdown', false);
      updateUIField('showDurationDropdown', false);
      updateUIField('showGuestPicker', false);
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [updateUIField]);

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
        {/* Compact State - Elegant Design */}
        {!uiState.isExpanded ? (
          <div 
            className="flex items-center bg-white rounded-full border border-gray-300 shadow-sm hover:shadow-lg transition-all duration-300 cursor-pointer min-w-[300px] max-w-[400px]"
            onClick={() => updateUIField('isExpanded', true)}
          >
            <div className="flex-1 flex items-center divide-x divide-gray-200">
              {/* Location */}
              <div className="flex items-center px-4 py-2.5 flex-1">
                <MapPin className="w-4 h-4 text-gray-400 mr-2 flex-shrink-0" />
                <span className="text-sm text-gray-700 font-medium truncate">
                  {searchData.location || 'Anywhere'}
                </span>
              </div>
              
              {/* Date/Time */}
              <div className="flex items-center px-4 py-2.5 flex-1">
                <Calendar className="w-4 h-4 text-gray-400 mr-2 flex-shrink-0" />
                <span className="text-sm text-gray-700 truncate">
                  {searchData.rentalType === 'short-term' 
                    ? (formatDateForDisplay(searchData.checkIn) || 'Any week')
                    : getMoveInDisplayText(searchData.moveInOption)
                  }
                </span>
              </div>
              
              {/* Guests */}
              <div className="flex items-center px-4 py-2.5">
                <Users className="w-4 h-4 text-gray-400 mr-2 flex-shrink-0" />
                <span className="text-sm text-gray-700">
                  {searchData.guests === 1 ? 'Add guests' : `${searchData.guests} guests`}
                </span>
              </div>
            </div>
            
            {/* Search Button */}
            <div className="rounded-full bg-red-500 hover:bg-red-600 m-1.5 p-2.5 transition-colors">
              <Search className="w-4 h-4 text-white" />
          </div>
          </div>
        ) : (
          /* Expanded State - Full Search Interface */
          <div className="fixed inset-0 bg-black bg-opacity-50 z-[60] flex items-start justify-center pt-20">
            <div className="bg-white rounded-3xl shadow-2xl border border-gray-200 p-6 max-w-4xl w-full mx-4 max-h-[80vh] overflow-y-auto">
              {/* Header */}
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-semibold text-gray-900">Where to?</h2>
                <button
                  onClick={() => updateUIField('isExpanded', false)}
                  className="text-gray-400 hover:text-gray-600 transition-colors p-2 hover:bg-gray-100 rounded-full"
                >
                  ✕
                </button>
              </div>
              
              {/* Rental Type Selector */}
              <div className="flex justify-center mb-6">
                <div className="bg-gray-100 rounded-full p-1 flex">
                  <button
                    onClick={() => updateSearchField('rentalType', 'short-term')}
                    className={`px-6 py-2 rounded-full font-medium transition-all text-sm ${
                      searchData.rentalType === 'short-term' 
                        ? 'bg-red-500 text-white shadow-sm' 
                        : 'text-gray-600 hover:text-gray-800'
                    }`}
                  >
                    Short-term
                  </button>
                  <button
                    onClick={() => updateSearchField('rentalType', 'long-term')}
                    className={`px-6 py-2 rounded-full font-medium transition-all text-sm ${
                      searchData.rentalType === 'long-term' 
                        ? 'bg-red-500 text-white shadow-sm' 
                        : 'text-gray-600 hover:text-gray-800'
                    }`}
                  >
                    Long-term
                  </button>
                </div>
              </div>

              {/* Search Fields Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                {/* Location Field */}
                <div className="relative">
                  <label className="block text-sm font-semibold text-gray-900 mb-2">
                    Where
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      placeholder={searchBehavior.placeholder}
                      value={searchData.location}
                      onChange={(e) => handleLocationChange(e.target.value)}
                      className="w-full px-4 py-4 border border-gray-300 rounded-2xl focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent text-base"
                      onFocus={() => updateUIField('showLocationDropdown', true)}
                    />
                    
                    {/* Location Dropdown */}
                    {uiState.showLocationDropdown && (
                      <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl shadow-2xl border border-gray-100 z-[9999] max-h-80 overflow-y-auto">
                        <div className="p-4">
                          {loadingSuggestions ? (
                            <div className="flex items-center justify-center py-8">
                              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-500"></div>
                            </div>
                          ) : (
                            <div className="space-y-2">
                              {(searchData.location && searchSuggestions.length > 0 ? searchSuggestions : getPopularDestinations()).map((destination, index) => (
                                <div
                                  key={`${destination.type}-${destination.value}-${index}`}
                                  className="flex items-center space-x-3 p-3 hover:bg-gray-50 rounded-xl cursor-pointer transition-colors group"
                                  onClick={() => {
                                    updateSearchField('location', destination.value);
                                    updateUIField('showLocationDropdown', false);
                                  }}
                                >
                                  <div className={`w-10 h-10 rounded-xl ${destination.color} flex items-center justify-center text-lg border`}>
                                    {destination.icon}
                                  </div>
                                  <div className="flex-1">
                                    <div className="font-medium text-gray-900 group-hover:text-red-600 transition-colors">
                                      {destination.label}
                                    </div>
                                    <div className="text-sm text-gray-500">
                                      {destination.sublabel || destination.category}
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
                
                {/* Date/Move-in Field */}
                <div className="relative">
                  <label className="block text-sm font-semibold text-gray-900 mb-2">
                    {searchData.rentalType === 'short-term' ? 'When' : 'Move-in'}
                  </label>
                  <div
                    className="w-full px-4 py-4 border border-gray-300 rounded-2xl cursor-pointer hover:border-red-500 transition-colors flex items-center justify-between"
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
                    <span className="text-base text-gray-700">
                      {searchData.rentalType === 'short-term' 
                        ? (formatDateForDisplay(searchData.checkIn) || 'Select dates')
                        : getMoveInDisplayText(searchData.moveInOption)
                      }
                    </span>
                    <Calendar className="w-5 h-5 text-gray-400" />
                  </div>

                  {/* Date Picker for Short Term */}
                  {uiState.showDatePicker && searchData.rentalType === 'short-term' && (
                    <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl shadow-2xl border border-gray-100 z-[9999] p-6 w-[720px]">
                      <div className="flex flex-col space-y-6">
                        {/* Header with Dates/Months Toggle */}
                        <div className="flex items-center justify-center">
                          <div className="bg-gray-100 rounded-full p-1 flex">
                            <button
                              onClick={() => setShowMonthView(false)}
                              className={`px-6 py-2 rounded-full font-medium transition-all text-sm ${
                                !showMonthView 
                                  ? 'bg-gray-900 text-white shadow-sm' 
                                  : 'text-gray-600 hover:text-gray-800'
                              }`}
                            >
                              Dates
                            </button>
                            <button
                              onClick={() => setShowMonthView(true)}
                              className={`px-6 py-2 rounded-full font-medium transition-all text-sm ${
                                showMonthView 
                                  ? 'bg-gray-900 text-white shadow-sm' 
                                  : 'text-gray-600 hover:text-gray-800'
                              }`}
                            >
                              Months
                            </button>
                          </div>
                        </div>

                        {/* Calendar Content */}
                        {showMonthView ? (
                          /* Month Selection View */
                          <div className="grid grid-cols-3 gap-4">
                            {months.map((month, index) => (
                              <button
                                key={month}
                                onClick={() => {
                                  const newDate = new Date(calendarDate.getFullYear(), index, 1);
                                  setCalendarDate(newDate);
                                  setShowMonthView(false);
                                }}
                                className="p-4 text-center rounded-xl hover:bg-gray-100 transition-colors"
                              >
                                <div className="font-medium text-gray-900">{month}</div>
                                <div className="text-sm text-gray-500">{calendarDate.getFullYear()}</div>
                              </button>
                            ))}
                          </div>
                        ) : (
                          /* Dual Calendar Layout */
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
                                  {months[calendarDate.getMonth()]} {calendarDate.getFullYear()}
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
                                {renderCalendar(calendarDate)}
                              </div>
                            </div>

                            {/* Right Calendar - Check Out */}
                            <div className="space-y-4">
                              {/* Month Navigation */}
                              <div className="flex items-center justify-between">
                                <div className="w-9 h-9"></div>
                                <h4 className="text-lg font-semibold text-gray-900">
                                  {months[(calendarDate.getMonth() + 1) % 12]} {calendarDate.getMonth() === 11 ? calendarDate.getFullYear() + 1 : calendarDate.getFullYear()}
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
                                {renderCalendar(new Date(calendarDate.getFullYear(), calendarDate.getMonth() + 1, 1))}
                              </div>
                            </div>
                          </div>
                        )}

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

                  {/* Move-in Dropdown for Long Term */}
                  {uiState.showMoveInDropdown && searchData.rentalType === 'long-term' && (
                    <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl shadow-2xl border border-gray-100 z-[9999] p-6 w-80">
                      <h4 className="text-lg font-semibold text-gray-900 mb-4">When do you want to move in?</h4>
                      <div className="space-y-2">
                        {[
                          { value: 'immediate', label: 'Immediately', sublabel: 'Ready to move in now' },
                          { value: 'week', label: 'Within a week', sublabel: 'Next 7 days' },
                          { value: 'month', label: 'Within a month', sublabel: 'Next 30 days' },
                          { value: 'flexible', label: 'Flexible', sublabel: 'I can wait for the right place' }
                        ].map((option) => (
                          <div
                            key={option.value}
                            className="flex items-center space-x-4 p-4 hover:bg-gray-50 rounded-xl cursor-pointer transition-all duration-200"
                            onClick={() => {
                              updateSearchField('moveInOption', option.value);
                              updateUIField('showMoveInDropdown', false);
                            }}
                          >
                            <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                              <Calendar className="w-6 h-6 text-blue-600" />
                            </div>
                            <div>
                              <div className="font-semibold text-gray-900">{option.label}</div>
                              <div className="text-sm text-gray-500">{option.sublabel}</div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
                
                {/* Guests Field */}
                <div className="relative">
                  <label className="block text-sm font-semibold text-gray-900 mb-2">
                    Who
                  </label>
                  <div
                    className="w-full px-4 py-4 border border-gray-300 rounded-2xl cursor-pointer hover:border-red-500 transition-colors flex items-center justify-between"
                    onClick={() => {
                      updateUIField('showGuestPicker', !uiState.showGuestPicker);
                      updateUIField('showLocationDropdown', false);
                      updateUIField('showDatePicker', false);
                      updateUIField('showMoveInDropdown', false);
                    }}
                  >
                    <span className="text-base text-gray-700">
                      {searchData.guests === 1 ? 'Add guests' : `${searchData.guests} guests`}
                    </span>
                    <Users className="w-5 h-5 text-gray-400" />
                  </div>

                  {/* Guest Picker Dropdown */}
                  {uiState.showGuestPicker && (
                    <div className="absolute top-full right-0 mt-2 bg-white rounded-2xl shadow-2xl border border-gray-100 z-[9999] p-6 w-80">
                      <h4 className="text-lg font-semibold text-gray-900 mb-6">Who's coming?</h4>
                      <div className="space-y-6">
                        {/* Adults */}
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="font-semibold text-gray-900">Adults</div>
                            <div className="text-sm text-gray-500">Ages 13 or above</div>
                          </div>
                          <div className="flex items-center space-x-3">
                            <button
                              onClick={() => updateGuests('adults', 'subtract')}
                              disabled={searchData.adults <= 1}
                              className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center hover:border-gray-400 disabled:opacity-50 disabled:cursor-not-allowed transition-colors bg-white"
                            >
                              <Minus className="w-4 h-4 text-gray-700" />
                            </button>
                            <span className="w-8 text-center font-medium text-gray-900">{searchData.adults}</span>
                            <button
                              onClick={() => updateGuests('adults', 'add')}
                              className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center hover:border-gray-400 transition-colors bg-white"
                            >
                              <Plus className="w-4 h-4 text-gray-700" />
                            </button>
                          </div>
                        </div>

                        {/* Children */}
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="font-semibold text-gray-900">Children</div>
                            <div className="text-sm text-gray-500">Ages 2-12</div>
                          </div>
                          <div className="flex items-center space-x-3">
                            <button
                              onClick={() => updateGuests('children', 'subtract')}
                              disabled={searchData.children <= 0}
                              className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center hover:border-gray-400 disabled:opacity-50 disabled:cursor-not-allowed transition-colors bg-white"
                            >
                              <Minus className="w-4 h-4 text-gray-700" />
                            </button>
                            <span className="w-8 text-center font-medium text-gray-900">{searchData.children}</span>
                            <button
                              onClick={() => updateGuests('children', 'add')}
                              className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center hover:border-gray-400 transition-colors bg-white"
                            >
                              <Plus className="w-4 h-4 text-gray-700" />
                            </button>
                          </div>
                        </div>

                        {/* Infants */}
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="font-semibold text-gray-900">Infants</div>
                            <div className="text-sm text-gray-500">Under 2</div>
                          </div>
                          <div className="flex items-center space-x-3">
                            <button
                              onClick={() => updateGuests('infants', 'subtract')}
                              disabled={searchData.infants <= 0}
                              className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center hover:border-gray-400 disabled:opacity-50 disabled:cursor-not-allowed transition-colors bg-white"
                            >
                              <Minus className="w-4 h-4 text-gray-700" />
                            </button>
                            <span className="w-8 text-center font-medium text-gray-900">{searchData.infants}</span>
                            <button
                              onClick={() => updateGuests('infants', 'add')}
                              className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center hover:border-gray-400 transition-colors bg-white"
                            >
                              <Plus className="w-4 h-4 text-gray-700" />
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* Close Button */}
                      <div className="flex justify-end pt-6 border-t border-gray-100 mt-6">
                        <Button
                          onClick={() => updateUIField('showGuestPicker', false)}
                          className="bg-gray-100 text-gray-700 hover:bg-gray-200 border-0"
                        >
                          Close
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
              
              {/* Search Button */}
              <div className="flex justify-center mb-6">
                <Button
                  onClick={() => {
                    handleSearch();
                    updateUIField('isExpanded', false);
                  }}
                  className="bg-red-500 hover:bg-red-600 text-white px-12 py-4 rounded-2xl font-semibold text-lg shadow-lg hover:shadow-xl transition-all duration-200"
                >
                  <Search className="w-5 h-5 mr-3" />
                  Search
                </Button>
              </div>

              {/* Filters Section */}
              <div className="border-t border-gray-200 p-6">
                {/* Filters Toggle Button */}
                <button
                  onClick={handleFilterToggle}
                  className="w-full flex items-center justify-between p-4 bg-gray-50 hover:bg-gray-100 rounded-xl transition-colors mb-4"
                >
                  <div className="flex items-center space-x-3">
                    <Filter className="w-5 h-5 text-gray-600" />
                    <span className="font-medium text-gray-900">Filters</span>
                    {(searchData.bedrooms || searchData.bathrooms || searchData.propertyType || searchData.minPrice || searchData.maxPrice) && (
                      <span className="bg-red-500 text-white text-xs px-2 py-1 rounded-full">
                        Active
                      </span>
                    )}
                  </div>
                  {showFilters ? (
                    <ChevronUp className="w-5 h-5 text-gray-400" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-gray-400" />
                  )}
                </button>

                {/* Expandable Filters Content */}
                {showFilters && (
                  <div className="space-y-4 animate-in slide-in-from-top-2 duration-200">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-semibold text-gray-900">Search Filters</h3>
                      <button
                        onClick={() => {
                          updateSearchField('bedrooms', '');
                          updateSearchField('bathrooms', '');
                          updateSearchField('propertyType', '');
                          updateSearchField('minPrice', '');
                          updateSearchField('maxPrice', '');
                        }}
                        className="text-sm text-gray-600 hover:text-gray-800 underline"
                      >
                        Clear all
                      </button>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                      {/* Bedrooms */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Bedrooms</label>
                        <select
                          value={searchData.bedrooms}
                          onChange={(e) => updateSearchField('bedrooms', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent bg-white text-gray-900"
                        >
                          <option value="" className="text-gray-900">Any</option>
                          <option value="0" className="text-gray-900">Studio</option>
                          <option value="1" className="text-gray-900">1+</option>
                          <option value="2" className="text-gray-900">2+</option>
                          <option value="3" className="text-gray-900">3+</option>
                          <option value="4" className="text-gray-900">4+</option>
                          <option value="5" className="text-gray-900">5+</option>
                        </select>
                      </div>

                      {/* Bathrooms */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Bathrooms</label>
                        <select
                          value={searchData.bathrooms}
                          onChange={(e) => updateSearchField('bathrooms', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent bg-white text-gray-900"
                        >
                          <option value="" className="text-gray-900">Any</option>
                          <option value="1" className="text-gray-900">1+</option>
                          <option value="2" className="text-gray-900">2+</option>
                          <option value="3" className="text-gray-900">3+</option>
                          <option value="4" className="text-gray-900">4+</option>
                        </select>
                      </div>

                      {/* Property Type */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Property Type</label>
                        <select
                          value={searchData.propertyType}
                          onChange={(e) => updateSearchField('propertyType', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent bg-white text-gray-900"
                        >
                          <option value="" className="text-gray-900">Any</option>
                          <option value="APARTMENT" className="text-gray-900">Apartment</option>
                          <option value="VILLA" className="text-gray-900">Villa</option>
                          <option value="STUDIO" className="text-gray-900">Studio</option>
                          <option value="PENTHOUSE" className="text-gray-900">Penthouse</option>
                          <option value="TOWNHOUSE" className="text-gray-900">Townhouse</option>
                        </select>
                      </div>

                      {/* Min Price */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Min Price</label>
                        <input
                          type="number"
                          value={searchData.minPrice}
                          onChange={(e) => updateSearchField('minPrice', e.target.value)}
                          placeholder="AED"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent bg-white text-gray-900 placeholder-gray-500"
                        />
                      </div>

                      {/* Max Price */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Max Price</label>
                        <input
                          type="number"
                          value={searchData.maxPrice}
                          onChange={(e) => updateSearchField('maxPrice', e.target.value)}
                          placeholder="AED"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent bg-white text-gray-900 placeholder-gray-500"
                        />
                      </div>
                    </div>
                  </div>
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
        {/* Rental Type Toggle - At the top */}
        <div className="flex justify-center py-4 border-b border-gray-200">
          <div className="bg-gray-100 rounded-full p-1 flex">
            <button
              onClick={() => updateSearchField('rentalType', 'short-term')}
              className={`px-6 py-2 rounded-full font-medium transition-all text-sm ${
                searchData.rentalType === 'short-term' 
                  ? 'bg-red-500 text-white shadow-sm' 
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              Short-term
            </button>
            <button
              onClick={() => updateSearchField('rentalType', 'long-term')}
              className={`px-6 py-2 rounded-full font-medium transition-all text-sm ${
                searchData.rentalType === 'long-term' 
                  ? 'bg-red-500 text-white shadow-sm' 
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              Long-term
            </button>
          </div>
        </div>

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
                className="w-full bg-transparent text-gray-900 font-medium focus:outline-none border-0 p-0 m-0"
                onFocus={() => updateUIField('showLocationDropdown', true)}
              />
            </div>
            {uiState.showLocationDropdown && (
              <div className="search-dropdown absolute top-full left-0 md:left-0 right-0 md:right-auto md:w-96 mt-2 bg-white rounded-2xl shadow-2xl border border-gray-100 z-[9999] max-h-80 overflow-y-auto">
                <div className="p-4">
                  <h4 className="text-lg font-semibold text-gray-900 mb-4">
                    {searchData.location && searchSuggestions.length > 0 ? 'Search suggestions' : 'Popular destinations'}
                  </h4>
                  <div className="space-y-2">
                    {loadingSuggestions ? (
                      <div className="flex items-center justify-center py-8">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-500"></div>
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
                {searchData.rentalType === 'short-term' ? 'When' : 'Move-in'}
              </div>
              <div className="text-gray-900 cursor-pointer font-medium">
                {searchData.rentalType === 'short-term' 
                  ? (formatDateForDisplay(searchData.checkIn) || 'Select dates')
                  : getMoveInDisplayText(searchData.moveInOption)
                }
              </div>
            </div>
            
            {/* Date Picker Dropdown for Short Term */}
            {uiState.showDatePicker && searchData.rentalType === 'short-term' && (
              <div className="search-dropdown calendar-container absolute top-full left-0 right-0 md:left-0 md:right-auto md:w-[720px] mt-2 bg-white rounded-2xl shadow-2xl border border-gray-100 z-[9999] p-6">
                <div className="flex flex-col space-y-6">
                  {/* Header with Dates/Months Toggle */}
                  <div className="flex items-center justify-center">
                    <div className="bg-gray-100 rounded-full p-1 flex">
                      <button
                        onClick={() => setShowMonthView(false)}
                        className={`px-6 py-2 rounded-full font-medium transition-all text-sm ${
                          !showMonthView 
                            ? 'bg-gray-900 text-white shadow-sm' 
                            : 'text-gray-600 hover:text-gray-800'
                        }`}
                      >
                        Dates
                      </button>
                      <button
                        onClick={() => setShowMonthView(true)}
                        className={`px-6 py-2 rounded-full font-medium transition-all text-sm ${
                          showMonthView 
                            ? 'bg-gray-900 text-white shadow-sm' 
                            : 'text-gray-600 hover:text-gray-800'
                        }`}
                      >
                        Months
                      </button>
                    </div>
                  </div>

                  {/* Calendar Content */}
                  {showMonthView ? (
                    /* Month Selection View */
                    <div className="grid grid-cols-3 gap-4">
                      {months.map((month, index) => (
                        <button
                          key={month}
                          onClick={() => {
                            const newDate = new Date(calendarDate.getFullYear(), index, 1);
                            setCalendarDate(newDate);
                            setShowMonthView(false);
                          }}
                          className="p-4 text-center rounded-xl hover:bg-gray-100 transition-colors"
                        >
                          <div className="font-medium text-gray-900">{month}</div>
                          <div className="text-sm text-gray-500">{calendarDate.getFullYear()}</div>
                        </button>
                      ))}
                    </div>
                  ) : (
                    /* Dual Calendar Layout */
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
                            {months[calendarDate.getMonth()]} {calendarDate.getFullYear()}
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
                          {renderCalendar(calendarDate)}
                        </div>
                      </div>

                      {/* Right Calendar - Check Out */}
                      <div className="space-y-4">
                        {/* Month Navigation */}
                        <div className="flex items-center justify-between">
                          <div className="w-9 h-9"></div>
                          <h4 className="text-lg font-semibold text-gray-900">
                            {months[(calendarDate.getMonth() + 1) % 12]} {calendarDate.getMonth() === 11 ? calendarDate.getFullYear() + 1 : calendarDate.getFullYear()}
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
                          {renderCalendar(new Date(calendarDate.getFullYear(), calendarDate.getMonth() + 1, 1))}
                        </div>
                      </div>
                    </div>
                  )}

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

            {/* Move-in Dropdown for Long Term */}
            {uiState.showMoveInDropdown && searchData.rentalType === 'long-term' && (
              <div className="search-dropdown absolute top-full left-0 right-0 md:left-0 md:right-auto md:w-80 mt-2 bg-white rounded-2xl shadow-2xl border border-gray-100 z-[9999] p-6">
                <h4 className="text-lg font-semibold text-gray-900 mb-4">When do you want to move in?</h4>
                <div className="space-y-2">
                  {[
                    { value: 'immediate', label: 'Immediately', sublabel: 'Ready to move in now' },
                    { value: 'week', label: 'Within a week', sublabel: 'Next 7 days' },
                    { value: 'month', label: 'Within a month', sublabel: 'Next 30 days' },
                    { value: 'flexible', label: 'Flexible', sublabel: 'I can wait for the right place' }
                  ].map((option) => (
                    <div
                      key={option.value}
                      className="flex items-center space-x-4 p-4 hover:bg-gray-50 rounded-xl cursor-pointer transition-all duration-200"
                      onClick={() => {
                        updateSearchField('moveInOption', option.value);
                        updateUIField('showMoveInDropdown', false);
                      }}
                    >
                      <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                        <Calendar className="w-6 h-6 text-blue-600" />
                      </div>
                      <div>
                        <div className="font-semibold text-gray-900">{option.label}</div>
                        <div className="text-sm text-gray-500">{option.sublabel}</div>
                      </div>
                    </div>
                  ))}
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

              {/* Duration Dropdown */}
              {uiState.showDurationDropdown && (
                <div className="search-dropdown absolute top-full left-0 right-0 md:left-0 md:right-auto md:w-80 mt-2 bg-white rounded-2xl shadow-2xl border border-gray-100 z-[9999] p-6">
                  <h4 className="text-lg font-semibold text-gray-900 mb-4">How long do you want to stay?</h4>
                  <div className="space-y-2">
                    {[
                      { value: '6-months', label: '6 months', sublabel: 'Short-term lease' },
                      { value: '1-year', label: '1 year', sublabel: 'Most popular' },
                      { value: '2-years', label: '2 years', sublabel: 'Better rates' },
                      { value: '3-years', label: '3+ years', sublabel: 'Best rates' },
                      { value: 'flexible', label: 'Flexible', sublabel: 'Open to negotiation' }
                    ].map((option) => (
                      <div
                        key={option.value}
                        className="flex items-center space-x-4 p-4 hover:bg-gray-50 rounded-xl cursor-pointer transition-all duration-200"
                        onClick={() => {
                          updateSearchField('durationOption', option.value);
                          updateUIField('showDurationDropdown', false);
                        }}
                      >
                        <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                          <Calendar className="w-6 h-6 text-green-600" />
                        </div>
                        <div>
                          <div className="font-semibold text-gray-900">{option.label}</div>
                          <div className="text-sm text-gray-500">{option.sublabel}</div>
                        </div>
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
                className="bg-red-500 hover:bg-red-600 text-white rounded-full p-3 md:p-4 shadow-lg hover:shadow-xl transition-all duration-200"
              >
                <Search className="w-5 h-5 md:w-6 md:h-6" />
              </Button>
            </div>

            {/* Guest Picker Dropdown */}
            {uiState.showGuestPicker && (
              <div className="search-dropdown absolute top-full right-0 md:right-0 md:left-auto md:w-80 mt-2 bg-white rounded-2xl shadow-2xl border border-gray-100 z-[9999] p-6">
                <h4 className="text-lg font-semibold text-gray-900 mb-6">Who's coming?</h4>
                <div className="space-y-6">
                  {/* Adults */}
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-semibold text-gray-900">Adults</div>
                      <div className="text-sm text-gray-500">Ages 13 or above</div>
                    </div>
                    <div className="flex items-center space-x-3">
                      <button
                        onClick={() => updateGuests('adults', 'subtract')}
                        disabled={searchData.adults <= 1}
                        className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center hover:border-gray-400 disabled:opacity-50 disabled:cursor-not-allowed transition-colors bg-white"
                      >
                        <Minus className="w-4 h-4 text-gray-700" />
                      </button>
                      <span className="w-8 text-center font-medium text-gray-900">{searchData.adults}</span>
                      <button
                        onClick={() => updateGuests('adults', 'add')}
                        className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center hover:border-gray-400 transition-colors bg-white"
                      >
                        <Plus className="w-4 h-4 text-gray-700" />
                      </button>
                    </div>
                  </div>

                  {/* Children */}
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-semibold text-gray-900">Children</div>
                      <div className="text-sm text-gray-500">Ages 2-12</div>
                    </div>
                    <div className="flex items-center space-x-3">
                      <button
                        onClick={() => updateGuests('children', 'subtract')}
                        disabled={searchData.children <= 0}
                        className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center hover:border-gray-400 disabled:opacity-50 disabled:cursor-not-allowed transition-colors bg-white"
                      >
                        <Minus className="w-4 h-4 text-gray-700" />
                      </button>
                      <span className="w-8 text-center font-medium text-gray-900">{searchData.children}</span>
                      <button
                        onClick={() => updateGuests('children', 'add')}
                        className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center hover:border-gray-400 transition-colors bg-white"
                      >
                        <Plus className="w-4 h-4 text-gray-700" />
                      </button>
                    </div>
                  </div>

                  {/* Infants */}
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-semibold text-gray-900">Infants</div>
                      <div className="text-sm text-gray-500">Under 2</div>
                    </div>
                    <div className="flex items-center space-x-3">
                      <button
                        onClick={() => updateGuests('infants', 'subtract')}
                        disabled={searchData.infants <= 0}
                        className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center hover:border-gray-400 disabled:opacity-50 disabled:cursor-not-allowed transition-colors bg-white"
                      >
                        <Minus className="w-4 h-4 text-gray-700" />
                      </button>
                      <span className="w-8 text-center font-medium text-gray-900">{searchData.infants}</span>
                      <button
                        onClick={() => updateGuests('infants', 'add')}
                        className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center hover:border-gray-400 transition-colors bg-white"
                      >
                        <Plus className="w-4 h-4 text-gray-700" />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Close Button */}
                <div className="flex justify-end pt-6 border-t border-gray-100 mt-6">
                  <Button
                    onClick={() => updateUIField('showGuestPicker', false)}
                    className="bg-gray-100 text-gray-700 hover:bg-gray-200 border-0"
                  >
                    Close
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Filters Section */}
        <div className="border-t border-gray-200 p-6">
          {/* Filters Toggle Button */}
          <button
            onClick={handleFilterToggle}
            className="w-full flex items-center justify-between p-4 bg-gray-50 hover:bg-gray-100 rounded-xl transition-colors mb-4"
          >
            <div className="flex items-center space-x-3">
              <Filter className="w-5 h-5 text-gray-600" />
              <span className="font-medium text-gray-900">Filters</span>
              {(searchData.bedrooms || searchData.bathrooms || searchData.propertyType || searchData.minPrice || searchData.maxPrice) && (
                <span className="bg-red-500 text-white text-xs px-2 py-1 rounded-full">
                  Active
                </span>
              )}
            </div>
            {showFilters ? (
              <ChevronUp className="w-5 h-5 text-gray-400" />
            ) : (
              <ChevronDown className="w-5 h-5 text-gray-400" />
            )}
          </button>

          {/* Expandable Filters Content */}
          {showFilters && (
            <div className="space-y-4 animate-in slide-in-from-top-2 duration-200">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Search Filters</h3>
                <button
                  onClick={() => {
                    updateSearchField('bedrooms', '');
                    updateSearchField('bathrooms', '');
                    updateSearchField('propertyType', '');
                    updateSearchField('minPrice', '');
                    updateSearchField('maxPrice', '');
                  }}
                  className="text-sm text-gray-600 hover:text-gray-800 underline"
                >
                  Clear all
                </button>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                {/* Bedrooms */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Bedrooms</label>
                  <select
                    value={searchData.bedrooms}
                    onChange={(e) => updateSearchField('bedrooms', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent bg-white text-gray-900"
                  >
                    <option value="" className="text-gray-900">Any</option>
                    <option value="0" className="text-gray-900">Studio</option>
                    <option value="1" className="text-gray-900">1+</option>
                    <option value="2" className="text-gray-900">2+</option>
                    <option value="3" className="text-gray-900">3+</option>
                    <option value="4" className="text-gray-900">4+</option>
                    <option value="5" className="text-gray-900">5+</option>
                  </select>
                </div>

                {/* Bathrooms */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Bathrooms</label>
                  <select
                    value={searchData.bathrooms}
                    onChange={(e) => updateSearchField('bathrooms', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent bg-white text-gray-900"
                  >
                    <option value="" className="text-gray-900">Any</option>
                    <option value="1" className="text-gray-900">1+</option>
                    <option value="2" className="text-gray-900">2+</option>
                    <option value="3" className="text-gray-900">3+</option>
                    <option value="4" className="text-gray-900">4+</option>
                  </select>
                </div>

                {/* Property Type */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Property Type</label>
                  <select
                    value={searchData.propertyType}
                    onChange={(e) => updateSearchField('propertyType', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent bg-white text-gray-900"
                  >
                    <option value="" className="text-gray-900">Any</option>
                    <option value="APARTMENT" className="text-gray-900">Apartment</option>
                    <option value="VILLA" className="text-gray-900">Villa</option>
                    <option value="STUDIO" className="text-gray-900">Studio</option>
                    <option value="PENTHOUSE" className="text-gray-900">Penthouse</option>
                    <option value="TOWNHOUSE" className="text-gray-900">Townhouse</option>
                  </select>
                </div>

                {/* Min Price */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Min Price</label>
                  <input
                    type="number"
                    value={searchData.minPrice}
                    onChange={(e) => updateSearchField('minPrice', e.target.value)}
                    placeholder="AED"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent bg-white text-gray-900 placeholder-gray-500"
                  />
                </div>

                {/* Max Price */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Max Price</label>
                  <input
                    type="number"
                    value={searchData.maxPrice}
                    onChange={(e) => updateSearchField('maxPrice', e.target.value)}
                    placeholder="AED"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent bg-white text-gray-900 placeholder-gray-500"
                  />
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};