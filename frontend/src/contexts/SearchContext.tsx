import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

// Search state interface
interface SearchState {
  location: string;
  checkIn: string;
  checkOut: string;
  guests: number;
  adults: number;
  children: number;
  infants: number;
  rentalType: 'short-term' | 'long-term';
  duration: number;
  moveInOption: 'immediate' | 'week' | 'month' | 'flexible';
  durationOption: '6-months' | '1-year' | '2-years' | '3-years' | 'flexible';
  bedrooms: string;
  bathrooms: string;
  propertyType: string;
  minPrice?: string;
  maxPrice?: string;
}

// UI state for dropdowns
interface SearchUIState {
  showLocationDropdown: boolean;
  showDatePicker: boolean;
  showGuestPicker: boolean;
  showMoveInDropdown: boolean;
  showDurationDropdown: boolean;
  showFilters: boolean;
  activeField: string;
  isExpanded: boolean; // For compact search bar expansion
}

// Context interface
interface SearchContextType {
  searchData: SearchState;
  uiState: SearchUIState;
  setSearchData: React.Dispatch<React.SetStateAction<SearchState>>;
  setUIState: React.Dispatch<React.SetStateAction<SearchUIState>>;
  updateSearchField: (field: keyof SearchState, value: any) => void;
  updateUIField: (field: keyof SearchUIState, value: any) => void;
  handleSearch: () => void;
  resetSearch: () => void;
  closeAllDropdowns: () => void;
  expandSearch: () => void;
  collapseSearch: () => void;
}

// Create context
const SearchContext = createContext<SearchContextType | undefined>(undefined);

// Default search state
const defaultSearchState: SearchState = {
  location: '',
  checkIn: '',
  checkOut: '',
  guests: 1,
  adults: 1,
  children: 0,
  infants: 0,
  rentalType: 'short-term',
  duration: 3,
  moveInOption: 'immediate',
  durationOption: '1-year',
  bedrooms: '',
  bathrooms: '',
  propertyType: '',
};

// Default UI state
const defaultUIState: SearchUIState = {
  showLocationDropdown: false,
  showDatePicker: false,
  showGuestPicker: false,
  showMoveInDropdown: false,
  showDurationDropdown: false,
  showFilters: false,
  activeField: '',
  isExpanded: false,
};

// Storage keys
const SEARCH_DATA_KEY = 'krib_search_data';
const SEARCH_UI_KEY = 'krib_search_ui';

// Helper functions for localStorage
const saveToStorage = (key: string, data: any) => {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (error) {
    console.warn('Failed to save to localStorage:', error);
  }
};

const loadFromStorage = (key: string, defaultValue: any) => {
  try {
    const stored = localStorage.getItem(key);
    return stored ? JSON.parse(stored) : defaultValue;
  } catch (error) {
    console.warn('Failed to load from localStorage:', error);
    return defaultValue;
  }
};

// Provider component
export const SearchProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const navigate = useNavigate();
  
  // Initialize state from localStorage
  const [searchData, setSearchData] = useState<SearchState>(() => 
    loadFromStorage(SEARCH_DATA_KEY, defaultSearchState)
  );
  
  const [uiState, setUIState] = useState<SearchUIState>(() => ({
    ...defaultUIState,
    // Don't persist dropdown states, only expansion state
    isExpanded: loadFromStorage(SEARCH_UI_KEY, defaultUIState).isExpanded || false
  }));

  // Save search data to localStorage whenever it changes
  useEffect(() => {
    saveToStorage(SEARCH_DATA_KEY, searchData);
  }, [searchData]);

  // Save UI state to localStorage (only expansion state)
  useEffect(() => {
    saveToStorage(SEARCH_UI_KEY, { isExpanded: uiState.isExpanded });
  }, [uiState.isExpanded]);

  const updateSearchField = (field: keyof SearchState, value: any) => {
    setSearchData(prev => ({ ...prev, [field]: value }));
  };

  const updateUIField = (field: keyof SearchUIState, value: any) => {
    setUIState(prev => ({ ...prev, [field]: value }));
  };

  const expandSearch = () => {
    setUIState(prev => ({ ...prev, isExpanded: true }));
  };

  const collapseSearch = () => {
    setUIState(prev => ({ 
      ...prev, 
      isExpanded: false,
      showLocationDropdown: false,
      showDatePicker: false,
      showGuestPicker: false,
      showMoveInDropdown: false,
      showDurationDropdown: false,
      showFilters: false,
    }));
  };

  const handleSearch = () => {
    // Close all dropdowns
    closeAllDropdowns();
    
    // Navigate to search page with search parameters
    const searchParams = new URLSearchParams({
      location: searchData.location,
      checkIn: searchData.checkIn,
      checkOut: searchData.checkOut,
      guests: (searchData.adults + searchData.children).toString(),
      type: searchData.rentalType,
      ...(searchData.bedrooms && { bedrooms: searchData.bedrooms }),
      ...(searchData.bathrooms && { bathrooms: searchData.bathrooms }),
      ...(searchData.propertyType && { propertyType: searchData.propertyType }),
      ...(searchData.minPrice && { minPrice: searchData.minPrice }),
      ...(searchData.maxPrice && { maxPrice: searchData.maxPrice }),
    });
    
    navigate(`/search?${searchParams.toString()}`);
  };

  const resetSearch = () => {
    setSearchData(defaultSearchState);
    setUIState(defaultUIState);
    // Clear localStorage
    localStorage.removeItem(SEARCH_DATA_KEY);
    localStorage.removeItem(SEARCH_UI_KEY);
  };

  const closeAllDropdowns = () => {
    setUIState(prev => ({
      ...prev,
      showLocationDropdown: false,
      showDatePicker: false,
      showGuestPicker: false,
      showMoveInDropdown: false,
      showDurationDropdown: false,
      showFilters: false,
    }));
  };

  const value = {
    searchData,
    uiState,
    setSearchData,
    setUIState,
    updateSearchField,
    updateUIField,
    handleSearch,
    resetSearch,
    closeAllDropdowns,
    expandSearch,
    collapseSearch,
  };

  return (
    <SearchContext.Provider value={value}>
      {children}
    </SearchContext.Provider>
  );
};

// Hook to use search context
export const useSearch = () => {
  const context = useContext(SearchContext);
  if (context === undefined) {
    throw new Error('useSearch must be used within a SearchProvider');
  }
  return context;
}; 