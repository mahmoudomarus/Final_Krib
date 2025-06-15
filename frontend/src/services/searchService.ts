import { apiService } from './api';

export interface SearchSuggestion {
  type: 'location' | 'property_type' | 'property';
  value: string;
  label: string;
  sublabel?: string;
  category: string;
  icon?: string;
  color?: string;
}

export interface PopularSearchData {
  popularLocations: Array<{ location: string; count: number }>;
  popularTypes: Array<{ type: string; count: number }>;
  trendingSearches: string[];
}

export interface SearchFilters {
  emirate?: string;
  city?: string;
  area?: string;
  propertyType?: string;
  rentalType?: string;
  minPrice?: number;
  maxPrice?: number;
  bedrooms?: number;
  bathrooms?: number;
  maxGuests?: number;
  instantBook?: boolean;
  amenities?: string;
}

export interface UserRole {
  type: 'guest' | 'host' | 'lister' | 'admin';
  showShortTerm: boolean;
  showLongTerm: boolean;
  placeholder: string;
  defaultRentalType: 'short-term' | 'long-term';
}

class SearchService {
  private cache = new Map<string, any>();
  private cacheTimeout = 5 * 60 * 1000; // 5 minutes

  // Get search behavior based on user role
  getSearchBehavior(userRole?: string): UserRole {
    switch (userRole) {
      case 'super_admin':
        return {
          type: 'admin',
          showShortTerm: true,
          showLongTerm: true,
          placeholder: 'Search all properties (Admin)',
          defaultRentalType: 'short-term'
        };
      case 'host':
        return {
          type: 'host',
          showShortTerm: true,
          showLongTerm: false, // Hosts focus on short-term
          placeholder: 'Search destinations for guests',
          defaultRentalType: 'short-term'
        };
      case 'agent':
        return {
          type: 'lister',
          showShortTerm: false,
          showLongTerm: true, // Listers focus on long-term
          placeholder: 'Search long-term properties',
          defaultRentalType: 'long-term'
        };
      default:
        return {
          type: 'guest',
          showShortTerm: true,
          showLongTerm: true,
          placeholder: 'Search destinations',
          defaultRentalType: 'short-term'
        };
    }
  }

  // Get cached data or fetch new data
  private async getCachedData<T>(key: string, fetcher: () => Promise<T>): Promise<T> {
    const cached = this.cache.get(key);
    if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
      return cached.data;
    }

    const data = await fetcher();
    this.cache.set(key, { data, timestamp: Date.now() });
    return data;
  }

  // Fetch popular searches with caching
  async getPopularSearches(): Promise<PopularSearchData> {
    return this.getCachedData('popular-searches', async () => {
      try {
        const response: any = await apiService.get('/api/properties/popular-searches');
        if (response.success) {
          return response.data;
        }
        throw new Error('Failed to fetch popular searches');
      } catch (error) {
        console.error('Error fetching popular searches:', error);
        // Fallback data
        return {
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
        };
      }
    });
  }

  // Fetch search suggestions with debouncing
  async getSearchSuggestions(query: string, limit: number = 8): Promise<SearchSuggestion[]> {
    if (!query || query.length < 2) {
      return [];
    }

    const cacheKey = `suggestions-${query}-${limit}`;
    return this.getCachedData(cacheKey, async () => {
      try {
        const response: any = await apiService.get(
          `/api/properties/autocomplete?q=${encodeURIComponent(query)}&limit=${limit}`
        );
        
        if (response.success) {
          return response.data.suggestions.map((suggestion: SearchSuggestion) => ({
            ...suggestion,
            icon: this.getCategoryIcon(suggestion.category),
            color: this.getCategoryColor(suggestion.category)
          }));
        }
        return [];
      } catch (error) {
        console.error('Error fetching search suggestions:', error);
        return [];
      }
    });
  }

  // Get category-specific icons
  private getCategoryIcon(category: string): string {
    switch (category) {
      case 'Emirate': return '🇦🇪';
      case 'City': return '🏙️';
      case 'Area': return '📍';
      case 'Property Type': return '🏠';
      case 'Property': return '🏢';
      case 'Popular Location': return '🔥';
      case 'Trending': return '📈';
      default: return '📍';
    }
  }

  // Get category-specific colors
  private getCategoryColor(category: string): string {
    switch (category) {
      case 'Emirate': return 'bg-purple-50 text-purple-600';
      case 'City': return 'bg-blue-50 text-blue-600';
      case 'Area': return 'bg-green-50 text-green-600';
      case 'Property Type': return 'bg-orange-50 text-orange-600';
      case 'Property': return 'bg-pink-50 text-pink-600';
      case 'Popular Location': return 'bg-red-50 text-red-600';
      case 'Trending': return 'bg-yellow-50 text-yellow-600';
      default: return 'bg-gray-50 text-gray-600';
    }
  }

  // Convert popular searches to suggestions format
  getPopularDestinations(popularSearches: PopularSearchData): SearchSuggestion[] {
    const destinations: SearchSuggestion[] = [];

    // Add popular locations
    popularSearches.popularLocations.forEach(location => {
      destinations.push({
        type: 'location',
        value: location.location,
        label: location.location,
        category: 'Popular Location',
        icon: this.getCategoryIcon('Popular Location'),
        color: this.getCategoryColor('Popular Location')
      });
    });

    // Add trending searches
    popularSearches.trendingSearches.forEach(search => {
      destinations.push({
        type: 'location',
        value: search,
        label: search,
        category: 'Trending',
        icon: this.getCategoryIcon('Trending'),
        color: this.getCategoryColor('Trending')
      });
    });

    return destinations.slice(0, 6);
  }

  // Perform intelligent search with filters
  async searchProperties(query: string, filters: SearchFilters = {}) {
    try {
      // Clean filters - remove null/undefined values
      const cleanFilters: any = {};
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== null && value !== undefined && value !== '') {
          cleanFilters[key] = value;
        }
      });

      let result: any;
      if (query && query.trim()) {
        result = await apiService.searchProperties(query.trim(), cleanFilters);
      } else {
        result = await apiService.getProperties(cleanFilters);
      }

      return result;
    } catch (error) {
      console.error('Error searching properties:', error);
      throw error;
    }
  }

  // Track search analytics
  async trackSearch(query: string, filters: SearchFilters, resultCount: number) {
    try {
      await apiService.post('/api/properties/search-analytics', {
        query,
        filters,
        resultCount,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error tracking search analytics:', error);
      // Don't throw - analytics failure shouldn't break search
    }
  }

  // Clear cache
  clearCache() {
    this.cache.clear();
  }

  // Get search suggestions for different contexts
  getContextualSuggestions(userRole?: string, location?: string): string[] {
    const behavior = this.getSearchBehavior(userRole);
    
    const baseSuggestions = [
      'Dubai Marina',
      'Downtown Dubai',
      'Business Bay',
      'JBR',
      'Palm Jumeirah',
      'Abu Dhabi',
      'Sharjah'
    ];

    // Customize suggestions based on role
    switch (behavior.type) {
      case 'host':
        return [
          'Dubai Marina apartments',
          'Short-term rentals Dubai',
          'Tourist areas UAE',
          'Vacation rentals Abu Dhabi',
          ...baseSuggestions
        ];
      case 'lister':
        return [
          'Long-term rentals Dubai',
          'Family apartments UAE',
          'Annual lease properties',
          'Residential areas Dubai',
          ...baseSuggestions
        ];
      case 'admin':
        return [
          'All properties Dubai',
          'Property analytics',
          'Market overview UAE',
          ...baseSuggestions
        ];
      default:
        return baseSuggestions;
    }
  }
}

export const searchService = new SearchService(); 