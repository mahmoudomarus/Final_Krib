import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { 
  Star, 
  Upload, 
  X, 
  Camera, 
  CheckCircle, 
  AlertCircle, 
  ArrowLeft, 
  Home, 
  Calendar, 
  MapPin,
  Image as ImageIcon,
  FileText,
  Send
} from 'lucide-react';
import { formatDate } from '@/lib/utils';
import { Property, Booking, User } from '@/types';

interface ReviewForm {
  ratingOverall: number;
  ratingCleanliness: number;
  ratingAccuracy: number;
  ratingCommunication: number;
  ratingLocation: number;
  ratingCheckIn: number;
  ratingValue: number;
  publicComment: string;
  privateComment: string;
  photos: File[];
  wouldRecommend: boolean;
}

interface BookingDetails {
  booking: Booking;
  property: Property;
  host: User;
  checkInDate: Date;
  checkOutDate: Date;
  guests: number;
}

const WriteReviewPage: React.FC = () => {
  const navigate = useNavigate();
  const { bookingId } = useParams<{ bookingId: string }>();
  
  const [bookingDetails, setBookingDetails] = useState<BookingDetails | null>(null);
  const [reviewForm, setReviewForm] = useState<ReviewForm>({
    ratingOverall: 0,
    ratingCleanliness: 0,
    ratingAccuracy: 0,
    ratingCommunication: 0,
    ratingLocation: 0,
    ratingCheckIn: 0,
    ratingValue: 0,
    publicComment: '',
    privateComment: '',
    photos: [],
    wouldRecommend: true
  });
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [photoPreviewUrls, setPhotoPreviewUrls] = useState<string[]>([]);

  useEffect(() => {
    fetchBookingDetails();
  }, [bookingId]);

  useEffect(() => {
    // Calculate overall rating based on individual ratings
    const ratings = [
      reviewForm.ratingCleanliness,
      reviewForm.ratingAccuracy,
      reviewForm.ratingCommunication,
      reviewForm.ratingLocation,
      reviewForm.ratingCheckIn,
      reviewForm.ratingValue
    ].filter(rating => rating > 0);

    if (ratings.length > 0) {
      const average = ratings.reduce((sum, rating) => sum + rating, 0) / ratings.length;
      setReviewForm(prev => ({ ...prev, ratingOverall: Math.round(average) }));
    }
  }, [
    reviewForm.ratingCleanliness,
    reviewForm.ratingAccuracy,
    reviewForm.ratingCommunication,
    reviewForm.ratingLocation,
    reviewForm.ratingCheckIn,
    reviewForm.ratingValue
  ]);

  const fetchBookingDetails = async () => {
    setLoading(true);
    try {
      // Simulate API call
      setTimeout(() => {
        const mockBookingDetails: BookingDetails = {
          booking: {
            id: bookingId || 'booking-1',
            checkIn: new Date('2024-12-25'),
            checkOut: new Date('2024-12-30'),
            guests: 4,
            status: 'COMPLETED' as any
          } as Booking,
          property: {
            id: 'prop-1',
            title: 'Luxurious Marina View Apartment',
            area: 'Dubai Marina',
            city: 'Dubai',
            emirate: 'Dubai',
            images: [{ url: '/property1.jpg', isMain: true }],
            amenities: ['WiFi', 'Pool', 'Gym', 'Parking', 'Balcony'],
            rating: 4.8,
            reviewCount: 127
          } as Property,
          host: {
            id: 'host-1',
            firstName: 'Ahmed',
            lastName: 'Al Mansoori',
            avatar: '/host-avatar.jpg',
            isVerified: true
          } as User,
          checkInDate: new Date('2024-12-25'),
          checkOutDate: new Date('2024-12-30'),
          guests: 4
        };

        setBookingDetails(mockBookingDetails);
        setLoading(false);
      }, 1000);
    } catch (error) {
      console.error('Error fetching booking details:', error);
      setLoading(false);
    }
  };

  const handleRatingClick = (category: keyof ReviewForm, rating: number) => {
    setReviewForm(prev => ({
      ...prev,
      [category]: prev[category] === rating ? 0 : rating
    }));
  };

  const handlePhotoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    if (files.length + reviewForm.photos.length > 5) {
      alert('You can upload maximum 5 photos');
      return;
    }

    const newPhotoUrls: string[] = [];
    files.forEach(file => {
      const url = URL.createObjectURL(file);
      newPhotoUrls.push(url);
    });

    setReviewForm(prev => ({
      ...prev,
      photos: [...prev.photos, ...files]
    }));
    setPhotoPreviewUrls(prev => [...prev, ...newPhotoUrls]);
  };

  const removePhoto = (index: number) => {
    setReviewForm(prev => ({
      ...prev,
      photos: prev.photos.filter((_, i) => i !== index)
    }));
    setPhotoPreviewUrls(prev => {
      const newUrls = prev.filter((_, i) => i !== index);
      URL.revokeObjectURL(prev[index]); // Clean up object URL
      return newUrls;
    });
  };

  const validateForm = (): boolean => {
    const requiredRatings = [
      'ratingCleanliness',
      'ratingAccuracy',
      'ratingCommunication',
      'ratingLocation',
      'ratingCheckIn',
      'ratingValue'
    ] as const;

    for (const rating of requiredRatings) {
      if (reviewForm[rating] === 0) {
        alert('Please provide all required ratings');
        return false;
      }
    }

    if (reviewForm.publicComment.trim().length < 50) {
      alert('Please provide a detailed review (at least 50 characters)');
      return false;
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setSubmitting(true);
    try {
      // Simulate API call
      setTimeout(() => {
        console.log('Submitting review:', reviewForm);
        setSubmitting(false);
        navigate('/reviews?tab=written');
      }, 2000);
    } catch (error) {
      console.error('Error submitting review:', error);
      setSubmitting(false);
    }
  };

  const renderStarRating = (
    category: keyof ReviewForm,
    label: string,
    description?: string,
    required: boolean = true
  ) => {
    const rating = reviewForm[category] as number;
    
    return (
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <div>
            <label className="block text-sm font-medium text-gray-700">
              {label} {required && <span className="text-red-500">*</span>}
            </label>
            {description && (
              <p className="text-sm text-gray-500">{description}</p>
            )}
          </div>
          <div className="flex items-center space-x-1">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                onClick={() => handleRatingClick(category, star)}
                className={`p-1 rounded transition-colors ${
                  star <= rating ? 'text-yellow-400' : 'text-gray-300 hover:text-yellow-300'
                }`}
              >
                <Star
                  className={`w-6 h-6 ${star <= rating ? 'fill-current' : ''}`}
                />
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-[#C5A572] mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading booking details...</p>
        </div>
      </div>
    );
  }

  if (!bookingDetails) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="p-8 text-center">
          <AlertCircle className="w-12 h-12 mx-auto mb-4 text-red-500" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Booking Not Found</h3>
          <p className="text-gray-600 mb-4">We couldn't find the booking you're trying to review.</p>
          <Button onClick={() => navigate('/reviews')}>
            Go Back to Reviews
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <Button
            variant="ghost"
            onClick={() => navigate('/reviews')}
            className="mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Reviews
          </Button>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Write a Review</h1>
          <p className="text-gray-600">Share your experience to help other travelers</p>
        </div>

        {/* Booking Summary */}
        <Card className="p-6 mb-8">
          <div className="flex items-start space-x-4">
            <img
              src={bookingDetails.property.images[0]?.url || '/default-property.jpg'}
              alt={bookingDetails.property.title}
              className="w-20 h-20 object-cover rounded-lg"
            />
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                {bookingDetails.property.title}
              </h3>
              <div className="flex items-center space-x-4 text-sm text-gray-600 mb-2">
                <div className="flex items-center">
                  <MapPin className="w-4 h-4 mr-1" />
                  <span>{bookingDetails.property.area}, {bookingDetails.property.city}</span>
                </div>
                <div className="flex items-center">
                  <Calendar className="w-4 h-4 mr-1" />
                  <span>
                    {formatDate(bookingDetails.checkInDate, 'en-US')} - {formatDate(bookingDetails.checkOutDate, 'en-US')}
                  </span>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <Badge variant="secondary">{bookingDetails.guests} guests</Badge>
                <Badge variant="success">Completed Stay</Badge>
              </div>
            </div>
            <div className="text-right">
              <div className="flex items-center space-x-1 mb-1">
                <Star className="w-4 h-4 text-yellow-400 fill-current" />
                <span className="font-medium">{bookingDetails.property.rating}</span>
              </div>
              <p className="text-sm text-gray-600">
                {bookingDetails.property.reviewCount} reviews
              </p>
            </div>
          </div>
        </Card>

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Overall Experience */}
          <Card className="p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">Overall Experience</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {renderStarRating('ratingCleanliness', 'Cleanliness', 'Was the property clean and well-maintained?')}
              {renderStarRating('ratingAccuracy', 'Accuracy', 'Did the property match the listing description?')}
              {renderStarRating('ratingCommunication', 'Communication', 'How was your communication with the host?')}
              {renderStarRating('ratingLocation', 'Location', 'How was the neighborhood and location?')}
              {renderStarRating('ratingCheckIn', 'Check-in', 'How smooth was the check-in process?')}
              {renderStarRating('ratingValue', 'Value', 'Was the property worth the price paid?')}
            </div>

            {/* Overall Rating Display */}
            {reviewForm.ratingOverall > 0 && (
              <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <div className="flex items-center justify-center space-x-4">
                  <span className="text-lg font-medium text-gray-900">Overall Rating:</span>
                  <div className="flex items-center space-x-2">
                    <div className="flex items-center">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star
                          key={star}
                          className={`w-6 h-6 ${
                            star <= reviewForm.ratingOverall
                              ? 'text-yellow-400 fill-current'
                              : 'text-gray-300'
                          }`}
                        />
                      ))}
                    </div>
                    <span className="text-xl font-bold text-gray-900">
                      {reviewForm.ratingOverall}.0
                    </span>
                  </div>
                </div>
              </div>
            )}
          </Card>

          {/* Written Review */}
          <Card className="p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">Tell us about your stay</h2>
            
            <div className="space-y-6">
              {/* Public Comment */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Public Review <span className="text-red-500">*</span>
                </label>
                <p className="text-sm text-gray-500 mb-3">
                  This will be visible to other travelers and the host. Be honest and constructive.
                </p>
                <textarea
                  rows={6}
                  value={reviewForm.publicComment}
                  onChange={(e) => setReviewForm(prev => ({ ...prev, publicComment: e.target.value }))}
                  placeholder="Share the highlights of your stay - what made it special? What could have been better? Your honest feedback helps other travelers and hosts improve..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#C5A572] focus:border-transparent resize-none"
                  maxLength={2000}
                />
                <div className="flex justify-between items-center mt-2">
                  <span className="text-sm text-gray-500">
                    Minimum 50 characters required
                  </span>
                  <span className="text-sm text-gray-500">
                    {reviewForm.publicComment.length}/2000
                  </span>
                </div>
              </div>

              {/* Private Comment */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Private Feedback (Optional)
                </label>
                <p className="text-sm text-gray-500 mb-3">
                  This will only be visible to the host and can help them improve their service.
                </p>
                <textarea
                  rows={4}
                  value={reviewForm.privateComment}
                  onChange={(e) => setReviewForm(prev => ({ ...prev, privateComment: e.target.value }))}
                  placeholder="Any private feedback for the host..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#C5A572] focus:border-transparent resize-none"
                  maxLength={1000}
                />
                <div className="flex justify-end mt-2">
                  <span className="text-sm text-gray-500">
                    {reviewForm.privateComment.length}/1000
                  </span>
                </div>
              </div>

              {/* Would Recommend */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Would you recommend this place to other travelers?
                </label>
                <div className="flex space-x-4">
                  <button
                    type="button"
                    onClick={() => setReviewForm(prev => ({ ...prev, wouldRecommend: true }))}
                    className={`flex items-center px-4 py-2 rounded-lg border transition-colors ${
                      reviewForm.wouldRecommend
                        ? 'bg-green-50 border-green-300 text-green-700'
                        : 'bg-gray-50 border-gray-300 text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Yes, I recommend this place
                  </button>
                  <button
                    type="button"
                    onClick={() => setReviewForm(prev => ({ ...prev, wouldRecommend: false }))}
                    className={`flex items-center px-4 py-2 rounded-lg border transition-colors ${
                      !reviewForm.wouldRecommend
                        ? 'bg-red-50 border-red-300 text-red-700'
                        : 'bg-gray-50 border-gray-300 text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    <X className="w-4 h-4 mr-2" />
                    No, I would not recommend
                  </button>
                </div>
              </div>
            </div>
          </Card>

          {/* Photos */}
          <Card className="p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">Add Photos (Optional)</h2>
            
            <div className="space-y-4">
              <p className="text-sm text-gray-600">
                Help other travelers by sharing photos of your stay. You can upload up to 5 photos.
              </p>

              {/* Photo Upload */}
              <div>
                <input
                  type="file"
                  id="photo-upload"
                  multiple
                  accept="image/*"
                  onChange={handlePhotoUpload}
                  className="hidden"
                />
                <label
                  htmlFor="photo-upload"
                  className="flex flex-col items-center justify-center w-full h-32 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100 transition-colors"
                >
                  <div className="flex flex-col items-center justify-center pt-5 pb-6">
                    <Camera className="w-8 h-8 mb-2 text-gray-400" />
                    <p className="mb-2 text-sm text-gray-500">
                      <span className="font-semibold">Click to upload</span> or drag and drop
                    </p>
                    <p className="text-xs text-gray-500">PNG, JPG up to 10MB each</p>
                  </div>
                </label>
              </div>

              {/* Photo Previews */}
              {photoPreviewUrls.length > 0 && (
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                  {photoPreviewUrls.map((url, index) => (
                    <div key={index} className="relative">
                      <img
                        src={url}
                        alt={`Preview ${index + 1}`}
                        className="w-full h-24 object-cover rounded-lg"
                      />
                      <button
                        type="button"
                        onClick={() => removePhoto(index)}
                        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-colors"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </Card>

          {/* Submit */}
          <div className="flex items-center justify-between pt-6">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate('/reviews')}
            >
              Cancel
            </Button>
            
            <Button
              type="submit"
              disabled={submitting}
              className="min-w-32"
            >
              {submitting ? (
                <div className="flex items-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Submitting...
                </div>
              ) : (
                <div className="flex items-center">
                  <Send className="w-4 h-4 mr-2" />
                  Submit Review
                </div>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default WriteReviewPage; 