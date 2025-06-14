import React, { useState, useEffect } from 'react';
import { apiService } from '../services/api';

const TestApiPage: React.FC = () => {
  const [properties, setProperties] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const testApi = async () => {
      try {
        setLoading(true);
        console.log('Testing API connection...');
        const result: any = await apiService.getProperties();
        console.log('API Result:', result);
        setProperties(result.properties || []);
      } catch (err) {
        console.error('API Error:', err);
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    };

    testApi();
  }, []);

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">API Test Page</h1>
      
      {loading && (
        <div className="text-blue-600">Loading properties from API...</div>
      )}
      
      {error && (
        <div className="text-red-600 bg-red-50 p-4 rounded">
          <strong>Error:</strong> {error}
        </div>
      )}
      
      {!loading && !error && (
        <div>
          <h2 className="text-xl font-semibold mb-4">
            Found {properties.length} properties
          </h2>
          
          {properties.map((property) => (
            <div key={property.id} className="border p-4 mb-4 rounded">
              <h3 className="font-bold">{property.title}</h3>
              <p className="text-gray-600">{property.description}</p>
              <p className="text-sm">
                <strong>Location:</strong> {property.city}, {property.emirate}
              </p>
              <p className="text-sm">
                <strong>Price:</strong> {property.basePrice} {property.currency}
              </p>
              <p className="text-sm">
                <strong>Host:</strong> {property.host?.firstName} {property.host?.lastName}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default TestApiPage; 