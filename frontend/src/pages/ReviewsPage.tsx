import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { 
  Star, 
  Filter, 
  Search, 
  ThumbsUp, 
  ThumbsDown, 
  MessageSquare, 
  Calendar, 
  User, 
  Home, 
  MapPin, 
  CheckCircle, 
  Flag, 
  MoreVertical,
  Heart,
  Share2,
  Bookmark,
  Edit,
  Trash2,
  ChevronDown,
  Award,
  TrendingUp,
  Eye,
  Clock
} from 'lucide-react';
import { formatDate } from '@/lib/utils';
import { User as UserType, Property, Review, BookingStatus } from '@/types';
import { apiService } from '../services/api';

interface ReviewWithDetails {
  id: string;
  bookingId: string;
  guestId: string;
  guest: {
    id: string;
    firstName: string;
    lastName: string;
    avatar?: string;
    nationality?: string;
    isVerified: boolean;
    kycStatus: string;
  };
  hostId: string;
  host: {
    id: string;
    firstName: string;
    lastName: string;
  };
  propertyId: string;
  property: {
    id: string;
    title: string;
    area: string;
    city: string;
    emirate: string;
    images: string[];
  };
  overallRating: number;
  cleanlinessRating?: number;
  accuracyRating?: number;
  communicationRating?: number;
  locationRating?: number;
  checkInRating?: number;
  valueRating?: number;
  comment: string;
  title?: string;
  photos?: string[];
  hostResponse?: string;
  hostResponseAt?: string;
  createdAt: string;
  helpful?: number;
  unhelpful?: number;
  userReaction?: 'helpful' | 'unhelpful' | null;
  isEditable?: boolean;
}

interface HostResponse {
  id: string;
  content: string;
  createdAt: Date;
  isEditable?: boolean;
}

interface ReviewFilters {
  rating?: number;
  type: 'all' | 'received' | 'written' | 'pending';
  sortBy: 'newest' | 'oldest' | 'highest' | 'lowest' | 'helpful';
  propertyId?: string;
  withPhotos?: boolean;
  verified?: boolean;
}

const ReviewsPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const tab = searchParams.get('tab') || 'received';
  
  const [reviews, setReviews] = useState<ReviewWithDetails[]>([]);
  const [filters, setFilters] = useState<ReviewFilters>({
    type: tab as any,
    sortBy: 'newest'
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expandedReview, setExpandedReview] = useState<string | null>(null);

  // Mock current user ID - in real app this would come from auth context
  const currentUserId = 'cmbjvmgth0001on5h4dlvdnqf'; // Ahmed Al Mansoori (host)

  useEffect(() => {
    fetchReviews();
  }, [filters, tab]);

  const fetchReviews = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const apiFilters: any = {
        type: tab,
        sortBy: filters.sortBy,
        limit: 50
      };

      // Add filters based on tab
      if (tab === 'received') {
        apiFilters.hostId = currentUserId;
      } else if (tab === 'written') {
        apiFilters.guestId = currentUserId;
      }

      if (filters.rating) {
        apiFilters.rating = filters.rating;
      }

      const result = await apiService.getReviews(apiFilters) as { reviews: ReviewWithDetails[]; total: number };
      let fetchedReviews = result.reviews || [];

      // Apply additional client-side filters
      if (searchQuery) {
        fetchedReviews = fetchedReviews.filter((review: ReviewWithDetails) =>
          review.comment.toLowerCase().includes(searchQuery.toLowerCase()) ||
          review.guest.firstName.toLowerCase().includes(searchQuery.toLowerCase()) ||
          review.guest.lastName.toLowerCase().includes(searchQuery.toLowerCase()) ||
          review.property.title.toLowerCase().includes(searchQuery.toLowerCase())
        );
      }

      if (filters.withPhotos) {
        fetchedReviews = fetchedReviews.filter((review: ReviewWithDetails) => 
          review.photos && review.photos.length > 0
        );
      }

      if (filters.verified) {
        fetchedReviews = fetchedReviews.filter((review: ReviewWithDetails) => 
          review.guest.isVerified
        );
      }

      setReviews(fetchedReviews);
    } catch (err) {
      console.error('Error fetching reviews:', err);
      setError('Failed to load reviews. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleReaction = (reviewId: string, reaction: 'helpful' | 'unhelpful') => {
    setReviews(prev => prev.map(review => {
      if (review.id === reviewId) {
        const currentReaction = review.userReaction;
        let newHelpful = review.helpful || 0;
        let newUnhelpful = review.unhelpful || 0;
        let newReaction: 'helpful' | 'unhelpful' | null = reaction;

        // Remove previous reaction
        if (currentReaction === 'helpful') newHelpful = Math.max(0, newHelpful - 1);
        if (currentReaction === 'unhelpful') newUnhelpful = Math.max(0, newUnhelpful - 1);

        // Add new reaction or remove if same
        if (currentReaction === reaction) {
          newReaction = null;
        } else {
          if (reaction === 'helpful') newHelpful = newHelpful + 1;
          if (reaction === 'unhelpful') newUnhelpful = newUnhelpful + 1;
        }

        return {
          ...review,
          helpful: newHelpful,
          unhelpful: newUnhelpful,
          userReaction: newReaction
        };
      }
      return review;
    }));
  };

  const renderStars = (rating: number, size: 'sm' | 'md' | 'lg' = 'sm') => {
    const sizeClasses = {
      sm: 'w-4 h-4',
      md: 'w-5 h-5',
      lg: 'w-6 h-6'
    };

    return (
      <div className="flex items-center">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`${sizeClasses[size]} ${
              star <= rating ? 'text-yellow-400 fill-current' : 'text-gray-300'
            }`}
          />
        ))}
      </div>
    );
  };

  const getFilteredReviews = () => {
    let filtered = reviews;

    // Apply search filter
    if (searchQuery) {
      filtered = filtered.filter(review =>
        review.comment.toLowerCase().includes(searchQuery.toLowerCase()) ||
        review.guest.firstName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        review.guest.lastName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        review.property.title.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Apply rating filter
    if (filters.rating) {
      filtered = filtered.filter(review => review.overallRating === filters.rating);
    }

    // Apply other filters
    if (filters.withPhotos) {
      filtered = filtered.filter(review => review.photos && review.photos.length > 0);
    }

    if (filters.verified) {
      filtered = filtered.filter(review => review.guest.isVerified);
    }

    // Apply sorting
    filtered.sort((a, b) => {
      switch (filters.sortBy) {
        case 'newest':
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        case 'oldest':
          return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        case 'highest':
          return b.overallRating - a.overallRating;
        case 'lowest':
          return a.overallRating - b.overallRating;
        case 'helpful':
          return (b.helpful || 0) - (a.helpful || 0);
        default:
          return 0;
      }
    });

    return filtered;
  };

  const getAverageRating = () => {
    if (reviews.length === 0) return 0;
    const sum = reviews.reduce((acc, review) => acc + review.overallRating, 0);
    return (sum / reviews.length).toFixed(1);
  };

  const getRatingDistribution = () => {
    const distribution = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    reviews.forEach(review => {
      distribution[review.overallRating as keyof typeof distribution]++;
    });
    return distribution;
  };

  if (loading && reviews.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-[#C5A572] mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading reviews...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Reviews</h1>
          <p className="text-gray-600">Manage and view your reviews and ratings</p>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Star className="w-8 h-8 text-yellow-400 fill-current" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Average Rating</p>
                <p className="text-2xl font-bold text-gray-900">{getAverageRating()}</p>
              </div>
            </div>
          </Card>
          
          <Card className="p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <MessageSquare className="w-8 h-8 text-blue-500" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Reviews</p>
                <p className="text-2xl font-bold text-gray-900">{reviews.length}</p>
              </div>
            </div>
          </Card>
          
          <Card className="p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <TrendingUp className="w-8 h-8 text-green-500" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Response Rate</p>
                <p className="text-2xl font-bold text-gray-900">95%</p>
              </div>
            </div>
          </Card>
          
          <Card className="p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Clock className="w-8 h-8 text-orange-500" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Avg Response Time</p>
                <p className="text-2xl font-bold text-gray-900">2h</p>
              </div>
            </div>
          </Card>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200 mb-6">
          <nav className="-mb-px flex space-x-8">
            {[
              { key: 'received', label: 'Reviews Received', count: reviews.filter(r => r.hostId === 'current-user').length },
              { key: 'written', label: 'Reviews Written', count: reviews.filter(r => r.guestId === 'current-user').length },
              { key: 'pending', label: 'Pending Reviews', count: 0 }
            ].map(tab => (
              <button
                key={tab.key}
                onClick={() => {
                  navigate(`/reviews?tab=${tab.key}`);
                  setFilters(prev => ({ ...prev, type: tab.key as any }));
                }}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  filters.type === tab.key
                    ? 'border-[#C5A572] text-[#C5A572]'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                {tab.label} ({tab.count})
              </button>
            ))}
          </nav>
        </div>

        {/* Filters and Search */}
        <div className="flex flex-col lg:flex-row gap-4 mb-6">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search reviews..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#C5A572] focus:border-transparent"
            />
          </div>
          
          <div className="flex flex-wrap gap-3">
            <select
              value={filters.sortBy}
              onChange={(e) => setFilters(prev => ({ ...prev, sortBy: e.target.value as any }))}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#C5A572] focus:border-transparent"
            >
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
              <option value="highest">Highest Rating</option>
              <option value="lowest">Lowest Rating</option>
              <option value="helpful">Most Helpful</option>
            </select>
            
            <select
              value={filters.rating || ''}
              onChange={(e) => setFilters(prev => ({ ...prev, rating: e.target.value ? Number(e.target.value) : undefined }))}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#C5A572] focus:border-transparent"
            >
              <option value="">All Ratings</option>
              <option value="5">5 Stars</option>
              <option value="4">4 Stars</option>
              <option value="3">3 Stars</option>
              <option value="2">2 Stars</option>
              <option value="1">1 Star</option>
            </select>
            
            <Button
              variant={filters.withPhotos ? 'primary' : 'outline'}
              onClick={() => setFilters(prev => ({ ...prev, withPhotos: !prev.withPhotos }))}
              size="sm"
            >
              With Photos
            </Button>
            
            <Button
              variant={filters.verified ? 'primary' : 'outline'}
              onClick={() => setFilters(prev => ({ ...prev, verified: !prev.verified }))}
              size="sm"
            >
              Verified Only
            </Button>
          </div>
        </div>

        {/* Reviews List */}
        <div className="space-y-6">
          {getFilteredReviews().map((review) => (
            <Card key={review.id} className="p-6 hover:shadow-lg transition-shadow">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-start space-x-4">
                  <img
                    src={review.guest.avatar || '/default-avatar.jpg'}
                    alt={`${review.guest.firstName} ${review.guest.lastName}`}
                    className="w-12 h-12 rounded-full object-cover"
                  />
                  <div>
                    <div className="flex items-center space-x-2 mb-1">
                      <h3 className="font-semibold text-gray-900">
                        {review.guest.firstName} {review.guest.lastName}
                      </h3>
                      {review.guest.isVerified && (
                        <CheckCircle className="w-4 h-4 text-green-500" />
                      )}
                      <Badge variant="secondary" className="text-xs">
                        {review.guest.nationality}
                      </Badge>
                    </div>
                    <div className="flex items-center space-x-2 text-sm text-gray-600">
                      <Calendar className="w-4 h-4" />
                      <span>{formatDate(review.createdAt, 'en-US')}</span>
                      <span>•</span>
                      <Home className="w-4 h-4" />
                      <span>{review.property.title}</span>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center space-x-2">
                  {renderStars(review.overallRating, 'md')}
                  <span className="text-lg font-semibold text-gray-900">
                    {review.overallRating}.0
                  </span>
                  <Button variant="ghost" size="sm">
                    <MoreVertical className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              {/* Detailed Ratings */}
              {expandedReview === review.id && (
                <div className="mb-4 p-4 bg-gray-50 rounded-lg">
                  <h4 className="font-medium text-gray-900 mb-3">Detailed Ratings</h4>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                    {[
                      { label: 'Cleanliness', rating: review.cleanlinessRating },
                      { label: 'Accuracy', rating: review.accuracyRating },
                      { label: 'Communication', rating: review.communicationRating },
                      { label: 'Location', rating: review.locationRating },
                      { label: 'Check-in', rating: review.checkInRating },
                      { label: 'Value', rating: review.valueRating }
                    ].map(item => (
                      <div key={item.label} className="flex items-center justify-between">
                        <span className="text-gray-600">{item.label}</span>
                        <div className="flex items-center space-x-2">
                          {renderStars(item.rating || 0)}
                          <span className="font-medium">{item.rating}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Review Content */}
              <div className="mb-4">
                <p className="text-gray-700 leading-relaxed">{review.comment}</p>
              </div>

              {/* Review Photos */}
              {review.photos && review.photos.length > 0 && (
                <div className="mb-4">
                  <div className="flex space-x-2 overflow-x-auto">
                    {review.photos.map((photo, index) => (
                      <img
                        key={index}
                        src={photo}
                        alt={`Review photo ${index + 1}`}
                        className="w-20 h-20 object-cover rounded-lg flex-shrink-0"
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Host Response */}
              {review.hostResponse && (
                <div className="mb-4 p-4 bg-blue-50 border-l-4 border-blue-400 rounded-r-lg">
                  <div className="flex items-start justify-between mb-2">
                    <h4 className="font-medium text-gray-900 flex items-center">
                      <MessageSquare className="w-4 h-4 mr-2" />
                      Host Response
                    </h4>
                    <span className="text-sm text-gray-600">
                      {review.hostResponseAt ? formatDate(review.hostResponseAt, 'en-US') : 'Recently'}
                    </span>
                  </div>
                  <p className="text-gray-700">{review.hostResponse}</p>
                  {review.isEditable && (
                    <div className="mt-2 flex space-x-2">
                      <Button size="sm" variant="outline">
                        <Edit className="w-3 h-3 mr-1" />
                        Edit
                      </Button>
                      <Button size="sm" variant="outline">
                        <Trash2 className="w-3 h-3 mr-1" />
                        Delete
                      </Button>
                    </div>
                  )}
                </div>
              )}

              {/* Actions */}
              <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                <div className="flex items-center space-x-4">
                  <button
                    onClick={() => handleReaction(review.id, 'helpful')}
                    className={`flex items-center space-x-1 text-sm ${
                      review.userReaction === 'helpful'
                        ? 'text-green-600 font-medium'
                        : 'text-gray-600 hover:text-green-600'
                    }`}
                  >
                    <ThumbsUp className="w-4 h-4" />
                    <span>Helpful ({review.helpful})</span>
                  </button>
                  
                  <button
                    onClick={() => handleReaction(review.id, 'unhelpful')}
                    className={`flex items-center space-x-1 text-sm ${
                      review.userReaction === 'unhelpful'
                        ? 'text-red-600 font-medium'
                        : 'text-gray-600 hover:text-red-600'
                    }`}
                  >
                    <ThumbsDown className="w-4 h-4" />
                    <span>Not Helpful ({review.unhelpful})</span>
                  </button>
                  
                  <button
                    onClick={() => setExpandedReview(expandedReview === review.id ? null : review.id)}
                    className="flex items-center space-x-1 text-sm text-gray-600 hover:text-gray-900"
                  >
                    <Eye className="w-4 h-4" />
                    <span>Details</span>
                    <ChevronDown className={`w-4 h-4 transition-transform ${expandedReview === review.id ? 'rotate-180' : ''}`} />
                  </button>
                </div>
                
                <div className="flex items-center space-x-2">
                  {review.isEditable && (
                    <Button size="sm" variant="outline">
                      <Edit className="w-3 h-3 mr-1" />
                      Edit
                    </Button>
                  )}
                  
                  {!review.hostResponse && review.hostId === 'current-user' && (
                    <Button size="sm">
                      <MessageSquare className="w-3 h-3 mr-1" />
                      Respond
                    </Button>
                  )}
                  
                  <Button size="sm" variant="outline">
                    <Share2 className="w-3 h-3 mr-1" />
                    Share
                  </Button>
                  
                  <Button size="sm" variant="outline">
                    <Flag className="w-3 h-3 mr-1" />
                    Report
                  </Button>
                </div>
              </div>
            </Card>
          ))}
          
          {getFilteredReviews().length === 0 && (
            <Card className="p-8 text-center">
              <Star className="w-12 h-12 mx-auto mb-4 text-gray-300" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No reviews found</h3>
              <p className="text-gray-600">
                {searchQuery ? 'Try adjusting your search terms or filters.' : 'No reviews match your current filters.'}
              </p>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default ReviewsPage; 