import React, { useEffect } from 'react';
import { Search, Plus, Minus, ChevronLeft, ChevronRight } from 'lucide-react';
import { useSearch } from '../../contexts/SearchContext';
import { Button } from '../ui/Button';

// UAE destinations for search suggestions
const uaeDestinations = [
  { id: 'nearby', name: 'Nearby', subtitle: "Find what's around you", icon: '📍', color: 'bg-green-50 text-green-600' },
  { id: 'dubai-marina', name: 'Dubai Marina', subtitle: "Dubai's Eye", icon: '🏗️', color: 'bg-blue-50 text-blue-600' },
  { id: 'abu-dhabi', name: 'Abu Dhabi', subtitle: 'Yas Island', icon: '🇦🇪', color: 'bg-purple-50 text-purple-600' },
  { id: 'sharjah', name: 'Sharjah', subtitle: 'Sharjah Museum', icon: '📍', color: 'bg-pink-50 text-pink-600' },
  { id: 'dubai-mall', name: 'Dubai', subtitle: 'Dubai Mall', icon: '📍', color: 'bg-yellow-50 text-yellow-600' },
  { id: 'dubai-hills', name: 'Dubai', subtitle: 'Dubai Hills', icon: '📍', color: 'bg-orange-50 text-orange-600' },
];

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

const getDaysInMonth = (year: number, month: number) => {
  return new Date(year, month + 1, 0).getDate();
};

const getFirstDayOfMonth = (year: number, month: number) => {
  return new Date(year, month, 1).getDay();
};

interface UnifiedSearchBarProps {
  isCompact?: boolean;
  className?: string;
}

export const UnifiedSearchBar: React.FC<UnifiedSearchBarProps> = ({ 
  isCompact = false, 
  className = '' 
}) => {
  const { 
    searchData, 
    uiState, 
    updateSearchField, 
    updateUIField, 
    handleSearch, 
    closeAllDropdowns 
  } = useSearch();

  // Date picker state
  const [currentDate, setCurrentDate] = React.useState(new Date());
  const [selectedStartDate, setSelectedStartDate] = React.useState<Date | null>(null);
  const [selectedEndDate, setSelectedEndDate] = React.useState<Date | null>(null);
  const [isSelectingEndDate, setIsSelectingEndDate] = React.useState(false);

  // Initialize dates from search data
  React.useEffect(() => {
    if (searchData.checkIn) {
      setSelectedStartDate(new Date(searchData.checkIn));
    }
    if (searchData.checkOut) {
      setSelectedEndDate(new Date(searchData.checkOut));
    }
  }, [searchData.checkIn, searchData.checkOut]);

  // Date picker functions
  const handleDateSelect = (date: Date) => {
    if (!isSelectingEndDate && !selectedStartDate) {
      // First date selection (check-in)
      setSelectedStartDate(date);
      setIsSelectingEndDate(true);
      updateSearchField('checkIn', date.toISOString().split('T')[0]);
    } else if (isSelectingEndDate) {
      // Second date selection (check-out)
      if (selectedStartDate && date < selectedStartDate) {
        // If selected date is before check-in, make it the new check-in
        setSelectedStartDate(date);
        setSelectedEndDate(null);
        setIsSelectingEndDate(true);
        updateSearchField('checkIn', date.toISOString().split('T')[0]);
        updateSearchField('checkOut', '');
      } else {
        // Valid check-out date
        setSelectedEndDate(date);
        setIsSelectingEndDate(false);
        updateSearchField('checkOut', date.toISOString().split('T')[0]);
        updateUIField('showDatePicker', false);
      }
    } else {
      // Start over
      setSelectedStartDate(date);
      setSelectedEndDate(null);
      setIsSelectingEndDate(true);
      updateSearchField('checkIn', date.toISOString().split('T')[0]);
      updateSearchField('checkOut', '');
    }
  };

  const clearDates = () => {
    setSelectedStartDate(null);
    setSelectedEndDate(null);
    setIsSelectingEndDate(false);
    updateSearchField('checkIn', '');
    updateSearchField('checkOut', '');
  };

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

  const renderCalendar = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const daysInMonth = getDaysInMonth(year, month);
    const firstDay = getFirstDayOfMonth(year, month);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const days = [];
    
    // Add empty cells for days before the first day of the month
    for (let i = 0; i < firstDay; i++) {
      days.push(<div key={`empty-${i}`} className="w-10 h-10"></div>);
    }

    // Add days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const currentDay = new Date(year, month, day);
      const isToday = currentDay.getTime() === today.getTime();
      const isPast = currentDay < today;
      const isCheckIn = selectedStartDate && currentDay.getTime() === selectedStartDate.getTime();
      const isCheckOut = selectedEndDate && currentDay.getTime() === selectedEndDate.getTime();
      const isInRange = selectedStartDate && selectedEndDate && 
        currentDay > selectedStartDate && currentDay < selectedEndDate;

      let buttonStyle = 'w-10 h-10 rounded-full text-sm font-medium transition-all duration-200 relative ';
      
      if (isPast) {
        buttonStyle += 'text-gray-300 cursor-not-allowed ';
      } else if (isCheckIn) {
        buttonStyle += 'bg-gray-900 text-white shadow-lg z-10 ';
      } else if (isCheckOut) {
        buttonStyle += 'bg-gray-900 text-white shadow-lg z-10 ';
      } else if (isInRange) {
        buttonStyle += 'bg-gray-100 text-gray-900 ';
      } else if (isToday) {
        buttonStyle += 'bg-gray-100 text-gray-900 border border-gray-900 ';
      } else {
        buttonStyle += 'text-gray-700 hover:bg-gray-100 ';
      }

      days.push(
        <div key={day} className="relative">
          {/* Range background */}
          {isInRange && (
            <div className="absolute inset-0 bg-gray-100"></div>
          )}
          {isCheckIn && selectedEndDate && (
            <div className="absolute top-0 right-0 bottom-0 w-1/2 bg-gray-100"></div>
          )}
          {isCheckOut && selectedStartDate && (
            <div className="absolute top-0 left-0 bottom-0 w-1/2 bg-gray-100"></div>
          )}
          
          <button
            onClick={() => !isPast && handleDateSelect(currentDay)}
            disabled={isPast}
            className={buttonStyle}
          >
            {day}
          </button>
        </div>
      );
    }

    return days;
  };

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      
      // Don't close dropdowns if clicking inside any search dropdown or search field
      if (target.closest('.search-dropdown') || target.closest('.search-field')) {
        return;
      }
      
      closeAllDropdowns();
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [closeAllDropdowns]);

  // Helper functions
  const formatDateForDisplay = (dateString: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric'
    });
  };

  const getMoveInDisplayText = (optionId: string) => {
    const option = moveInOptions.find(opt => opt.id === optionId);
    return option ? option.label : 'Select move-in date';
  };

  const getDurationDisplayText = (optionId: string) => {
    const option = durationOptions.find(opt => opt.id === optionId);
    return option ? option.label : 'Select duration';
  };

  const updateGuests = (type: 'adults' | 'children' | 'infants', operation: 'add' | 'subtract') => {
    const currentValue = searchData[type];
    const newValue = operation === 'add' 
      ? currentValue + 1 
      : Math.max(0, currentValue - 1);
    
    // Ensure at least 1 adult
    if (type === 'adults' && newValue === 0) return;
    
    updateSearchField(type, newValue);
    
    // Update total guests count
    const totalGuests = type === 'infants' 
      ? searchData.adults + searchData.children 
      : type === 'adults' 
        ? newValue + searchData.children 
        : searchData.adults + newValue;
    
    updateSearchField('guests', totalGuests);
  };

  // Compact version for header
  if (isCompact) {
    return (
      <div className={`relative ${className}`}>
        <div className="flex items-center bg-white rounded-full border border-gray-300 shadow-sm hover:shadow-md transition-all duration-200 max-w-md mx-auto">
          <div className="flex-1 flex items-center">
            <input
              type="text"
              placeholder="Search destinations"
              value={searchData.location}
              onChange={(e) => updateSearchField('location', e.target.value)}
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
              <h4 className="text-sm font-medium text-gray-900 mb-3">Suggested destinations</h4>
              <div className="space-y-1">
                {uaeDestinations.map((destination) => (
                  <div
                    key={destination.id}
                    className="flex items-center space-x-3 p-3 hover:bg-gray-50 rounded-xl cursor-pointer transition-colors"
                    onClick={() => {
                      updateSearchField('location', destination.name);
                      updateUIField('showLocationDropdown', false);
                    }}
                  >
                    <div className={`w-10 h-10 rounded-lg ${destination.color} flex items-center justify-center text-lg`}>
                      {destination.icon}
                    </div>
                    <div>
                      <div className="font-medium text-gray-900">{destination.name}</div>
                      <div className="text-sm text-gray-500">{destination.subtitle}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // Full version with all features
  return (
    <div className={`relative ${className}`}>
      {/* Rental Type Toggle */}
      <div className="flex justify-center mb-6">
        <div className="bg-white/10 backdrop-blur-sm rounded-full p-1 flex border border-white/20">
          <button
            type="button"
            onClick={() => updateSearchField('rentalType', 'short-term')}
            className={`px-6 md:px-8 py-3 rounded-full font-medium transition-all text-sm md:text-lg ${
              searchData.rentalType === 'short-term'
                ? 'bg-white text-gray-900 shadow-lg'
                : 'text-white hover:text-gray-200'
            }`}
          >
            Short Term
          </button>
          <button
            type="button"
            onClick={() => updateSearchField('rentalType', 'long-term')}
            className={`px-6 md:px-8 py-3 rounded-full font-medium transition-all text-sm md:text-lg ${
              searchData.rentalType === 'long-term'
                ? 'bg-white text-gray-900 shadow-lg'
                : 'text-white hover:text-gray-200'
            }`}
          >
            Long Term
          </button>
        </div>
      </div>

      {/* Main Search Bar */}
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
              <div className="text-gray-900 cursor-pointer font-medium">
                {searchData.location || 'Search destinations'}
              </div>
            </div>
            {uiState.showLocationDropdown && (
              <div className="search-dropdown absolute top-full left-0 md:left-0 right-0 md:right-auto md:w-96 mt-2 bg-white rounded-2xl shadow-2xl border border-gray-100 z-[9999] max-h-80 overflow-y-auto">
                <div className="p-6">
                  <h4 className="text-lg font-semibold text-gray-900 mb-4">Popular destinations</h4>
                  <div className="space-y-2">
                    {uaeDestinations.map((destination) => (
                      <div
                        key={destination.id}
                        className="flex items-center space-x-4 p-4 hover:bg-gray-50 rounded-xl cursor-pointer transition-all duration-200"
                        onClick={() => {
                          updateSearchField('location', destination.name);
                          updateUIField('showLocationDropdown', false);
                        }}
                      >
                        <div className={`w-12 h-12 rounded-xl ${destination.color} flex items-center justify-center text-xl shadow-sm`}>
                          {destination.icon}
                        </div>
                        <div>
                          <div className="font-semibold text-gray-900">{destination.name}</div>
                          <div className="text-sm text-gray-500">{destination.subtitle}</div>
                        </div>
                      </div>
                    ))}
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