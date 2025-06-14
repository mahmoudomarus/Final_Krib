import React, { useState, useEffect } from 'react';
import { apiService } from '../services/api';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Star } from 'lucide-react';

const TestReviewsPage: React.FC = () => {
  const [reviews, setReviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const testReviewsAPI = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await apiService.getReviews({
        hostId: 'cmbjvmgth0001on5h4dlvdnqf',
        type: 'received',
        limit: 10
      }) as { reviews: any[]; total: number };
      
      console.log('Reviews API Result:', result);
      setReviews(result.reviews || []);
    } catch (err) {
      console.error('Error:', err);
      setError('Failed to fetch reviews');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    testReviewsAPI();
  }, []);

  const renderStars = (rating: number) => {
    return (
      <div className="flex">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`w-4 h-4 ${
              star <= rating ? 'text-yellow-400 fill-current' : 'text-gray-300'
            }`}
          />
        ))}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">Reviews Integration Test</h1>
          <div className="flex space-x-4">
            <Button onClick={testReviewsAPI} disabled={loading}>
              {loading ? 'Loading...' : 'Refresh Reviews'}
            </Button>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <p className="text-red-700">{error}</p>
          </div>
        )}

        <div className="grid gap-6">
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4">API Status</h2>
            <div className="space-y-2">
              <p><strong>Reviews Found:</strong> {reviews.length}</p>
              <p><strong>Loading:</strong> {loading ? 'Yes' : 'No'}</p>
              <p><strong>Error:</strong> {error || 'None'}</p>
            </div>
          </Card>

          {reviews.length > 0 && (
            <div className="space-y-4">
              <h2 className="text-xl font-semibold">Reviews from Database</h2>
              {reviews.map((review, index) => (
                <Card key={review.id || index} className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="font-semibold text-lg">{review.title || 'Review'}</h3>
                      <p className="text-gray-600">
                        By {review.guest?.firstName} {review.guest?.lastName}
                      </p>
                      <p className="text-sm text-gray-500">
                        Property: {review.property?.title}
                      </p>
                    </div>
                    <div className="text-right">
                      {renderStars(review.overallRating)}
                      <p className="text-sm text-gray-600 mt-1">
                        {review.overallRating}/5
                      </p>
                    </div>
                  </div>
                  
                  <p className="text-gray-700 mb-4">{review.comment}</p>
                  
                  <div className="grid grid-cols-3 gap-4 text-sm text-gray-600">
                    <div>Cleanliness: {review.cleanlinessRating || 'N/A'}</div>
                    <div>Communication: {review.communicationRating || 'N/A'}</div>
                    <div>Location: {review.locationRating || 'N/A'}</div>
                  </div>
                  
                  {review.photos && review.photos.length > 0 && (
                    <div className="mt-4">
                      <p className="text-sm font-medium mb-2">Photos:</p>
                      <div className="flex space-x-2">
                        {review.photos.slice(0, 3).map((photo: string, photoIndex: number) => (
                          <img
                            key={photoIndex}
                            src={photo}
                            alt={`Review photo ${photoIndex + 1}`}
                            className="w-16 h-16 object-cover rounded"
                          />
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {review.hostResponse && (
                    <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                      <p className="text-sm font-medium text-blue-900 mb-1">Host Response:</p>
                      <p className="text-blue-800">{review.hostResponse}</p>
                    </div>
                  )}
                </Card>
              ))}
            </div>
          )}

          {!loading && reviews.length === 0 && !error && (
            <Card className="p-6 text-center">
              <p className="text-gray-600">No reviews found.</p>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default TestReviewsPage; 