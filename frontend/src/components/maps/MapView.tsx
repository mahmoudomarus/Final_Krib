import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Property } from '../../types';
import { PropertyMapPopup } from './PropertyMapPopup';

// Modern Google Maps API types
declare global {
  interface Window {
    googleMapsLoaded: boolean;
  }
}

interface MapViewProps {
  properties: Property[];
  onPropertyClick: (property: Property) => void;
  center?: { lat: number; lng: number };
  zoom?: number;
  height?: string;
  className?: string;
  showPropertyCount?: boolean;
}

export const MapView: React.FC<MapViewProps> = ({
  properties,
  onPropertyClick,
  center = { lat: 25.2048, lng: 55.2708 }, // Dubai coordinates
  zoom = 11,
  height = '400px',
  className = '',
  showPropertyCount = true,
}) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const googleMapRef = useRef<any>(null);
  const markersRef = useRef<any[]>([]);
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load Google Maps API using modern async importLibrary approach
  useEffect(() => {
    const loadGoogleMaps = async () => {
      try {
        // Check if already loaded
        if ((window as any).google && (window as any).google.maps && window.googleMapsLoaded) {
          setMapLoaded(true);
          setLoading(false);
          return;
        }

        const apiKey = process.env.REACT_APP_GOOGLE_MAPS_API_KEY;
        
        if (!apiKey || apiKey === 'YOUR_API_KEY') {
          throw new Error('Google Maps API key not configured. Please add REACT_APP_GOOGLE_MAPS_API_KEY to your .env.local file.');
        }

        setLoading(true);
        setError(null);

        // Create the inline bootstrap loader (from Google documentation)
        if (!(window as any).google) {
          const script = document.createElement('script');
          script.innerHTML = `
            (g=>{var h,a,k,p="The Google Maps JavaScript API",c="google",l="importLibrary",q="__ib__",m=document,b=window;b=b[c]||(b[c]={});var d=b.maps||(b.maps={}),r=new Set,e=new URLSearchParams,u=()=>h||(h=new Promise(async(f,n)=>{await (a=m.createElement("script"));e.set("libraries",[...r]+"");for(k in g)e.set(k.replace(/[A-Z]/g,t=>"_"+t[0].toLowerCase()),g[k]);e.set("callback",c+".maps."+q);a.src=\`https://maps.\${c}apis.com/maps/api/js?\`+e;d[q]=f;a.onerror=()=>h=n(Error(p+" could not load."));a.nonce=m.querySelector("script[nonce]")?.nonce||"";m.head.append(a)}));d[l]?console.warn(p+" only loads once. Ignoring:",g):d[l]=(f,...n)=>r.add(f)&&u().then(()=>d[l](f,...n))})({
              key: "${apiKey}",
              v: "weekly"
            });
          `;
          document.head.appendChild(script);
        }

        // Wait for Google Maps to be available and then import the maps library
        const checkGoogleMaps = async () => {
          if ((window as any).google && (window as any).google.maps && (window as any).google.maps.importLibrary) {
            try {
              // Import the maps library
              await (window as any).google.maps.importLibrary("maps");
              // Import the marker library for AdvancedMarkerElement
              await (window as any).google.maps.importLibrary("marker");
              window.googleMapsLoaded = true;
              setMapLoaded(true);
              setLoading(false);
            } catch (err) {
              console.error('Failed to import maps library:', err);
              // Check if it's an API key issue
              if (err instanceof Error && err.message && err.message.includes('ApiNotActivatedMapError')) {
                setError('Google Maps API is not activated. Please enable the Maps JavaScript API in your Google Cloud Console.');
              } else {
                setError('Failed to load Google Maps. Please check your API key and internet connection.');
              }
              setLoading(false);
            }
          } else {
            // Keep checking until Google Maps is available
            setTimeout(checkGoogleMaps, 100);
          }
        };

        checkGoogleMaps();

      } catch (error) {
        console.error('Error loading Google Maps:', error);
        setError(error instanceof Error ? error.message : 'Failed to load Google Maps');
        setLoading(false);
      }
    };

    loadGoogleMaps();
  }, []);

  // Initialize map once Google Maps is loaded
  useEffect(() => {
    if (!mapLoaded || !mapRef.current || !(window as any).google || !(window as any).google.maps || !(window as any).google.maps.Map) {
      return;
    }

    try {
      const map = new (window as any).google.maps.Map(mapRef.current, {
        center: center,
        zoom: zoom,
        mapTypeControl: false,
        fullscreenControl: true,
        zoomControl: true,
        streetViewControl: false,
      });

      googleMapRef.current = map;

      // Clear existing markers
      markersRef.current.forEach(marker => {
        if (marker.setMap) marker.setMap(null);
      });
      markersRef.current = [];

      // Add markers for properties - use standard Marker for now to avoid AdvancedMarkerElement issues
      properties.forEach(property => {
        if (!property.coordinates?.latitude || !property.coordinates?.longitude) return;

        const position = {
          lat: property.coordinates.latitude,
          lng: property.coordinates.longitude
        };

        // Use standard Marker (works reliably)
        const marker = new (window as any).google.maps.Marker({
          position: position,
          map: map,
          title: property.title,
          icon: {
            url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
              <svg width="60" height="40" xmlns="http://www.w3.org/2000/svg">
                <rect x="2" y="2" width="56" height="36" rx="18" stroke="#0ea5e9" stroke-width="2" fill="white"/>
                <text x="30" y="24" text-anchor="middle" font-family="Arial, sans-serif" font-size="12" font-weight="bold" fill="#0ea5e9">
                  AED ${property.pricing?.basePrice || 0}
                </text>
              </svg>
            `),
            scaledSize: new (window as any).google.maps.Size(60, 40),
            anchor: new (window as any).google.maps.Point(30, 40)
          }
        });

        // Add click listener
        marker.addListener('click', () => {
          setSelectedProperty(property);
        });

        markersRef.current.push(marker);
      });

      // Fit bounds to show all properties
      if (properties.length > 0) {
        const bounds = new (window as any).google.maps.LatLngBounds();
        properties.forEach(property => {
          if (property.coordinates?.latitude && property.coordinates?.longitude) {
            bounds.extend(new (window as any).google.maps.LatLng(
              property.coordinates.latitude,
              property.coordinates.longitude
            ));
          }
        });
        
        if (!bounds.isEmpty()) {
          map.fitBounds(bounds);
          // Ensure minimum zoom level
          (window as any).google.maps.event.addListenerOnce(map, 'bounds_changed', () => {
            if (map.getZoom() > 15) {
              map.setZoom(15);
            }
          });
        }
      }

      // Close popup when clicking on map
      map.addListener('click', () => {
        setSelectedProperty(null);
      });

    } catch (err) {
      console.error('Error initializing map:', err);
      setError('Failed to initialize map');
    }

  }, [mapLoaded, properties, center, zoom]);

  const closePopup = useCallback(() => {
    setSelectedProperty(null);
  }, []);

  const handleViewProperty = useCallback(() => {
    if (selectedProperty) {
      onPropertyClick(selectedProperty);
    }
  }, [selectedProperty, onPropertyClick]);

  if (error) {
    return (
      <div className={`relative w-full ${className}`} style={{ height }}>
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100 rounded-lg">
          <div className="text-center p-6">
            <p className="text-sm text-red-600 mb-2">Failed to load map</p>
            <p className="text-xs text-gray-500 mb-4">{error}</p>
            {error.includes('ApiNotActivatedMapError') && (
              <div className="text-xs text-gray-600">
                <p className="mb-2">To fix this:</p>
                <ol className="text-left list-decimal list-inside space-y-1">
                  <li>Go to Google Cloud Console</li>
                  <li>Enable the Maps JavaScript API</li>
                  <li>Refresh this page</li>
                </ol>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`relative w-full ${className}`} style={{ height }}>
      <div
        ref={mapRef}
        className="w-full h-full rounded-lg"
        style={{ minHeight: '300px' }}
      />

      {/* Loading state */}
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100 rounded-lg">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto mb-2"></div>
            <p className="text-sm text-gray-600">Loading map...</p>
          </div>
        </div>
      )}

      {/* Property Popup */}
      {selectedProperty && (
        <PropertyMapPopup
          property={selectedProperty}
          onClose={closePopup}
          onViewProperty={handleViewProperty}
        />
      )}

      {/* Property Count */}
      {showPropertyCount && mapLoaded && (
        <div className="absolute top-4 left-4 bg-white rounded-lg shadow-lg px-3 py-2">
          <span className="text-sm font-medium text-gray-900">
            {properties.length} propert{properties.length !== 1 ? 'ies' : 'y'} shown
          </span>
        </div>
      )}

      {/* Map Controls Legend */}
      {mapLoaded && (
        <div className="absolute bottom-4 left-4 bg-white rounded-lg shadow-lg p-3">
          <div className="flex items-center space-x-2 text-sm">
            <div className="w-4 h-4 bg-primary-600 rounded-full border-2 border-white"></div>
            <span>Available Properties</span>
          </div>
        </div>
      )}
    </div>
  );
}; 