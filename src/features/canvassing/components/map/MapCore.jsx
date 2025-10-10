import React, { useRef, useEffect, useState, useCallback, useMemo } from 'react';
import { Navigation, Loader2, AlertCircle, Layers } from 'lucide-react';
import { loadGoogleMaps } from '../../../../services/googleMapsService';

/**
 * MapCore - Advanced Google Maps wrapper for canvassing
 * Handles map initialization, user location, property markers, and territories
 */
const MapCore = ({
  properties = [],
  onPropertyClick,
  onMapClick,
  userLocation,
  territories = [],
  mapType = 'roadmap',
  onMapTypeChange,
  showTraffic = false,
  onMapReady
}) => {
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markersRef = useRef([]);
  const userMarkerRef = useRef(null);
  const accuracyCircleRef = useRef(null);
  const trafficLayerRef = useRef(null);
  const territoryOverlaysRef = useRef([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showMapTypeSelector, setShowMapTypeSelector] = useState(false);

  // Property status colors matching SalesRabbit - memoized to prevent rerenders
  const STATUS_COLORS = useMemo(() => ({
    'Not Contacted': '#9CA3AF',
    'Interested': '#10B981',
    'Appointment': '#3B82F6',
    'Sold': '#8B5CF6',
    'Not Interested': '#EF4444',
    'Callback': '#F59E0B',
    'Not Home': '#6B7280',
    'DNC': '#1F2937',
  }), []);

  // Create property marker icon
  const createMarkerIcon = useCallback((property) => {
    const color = STATUS_COLORS[property.status] || '#9CA3AF';
    return {
      path: 'M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z',
      fillColor: color,
      fillOpacity: 1,
      strokeColor: '#FFFFFF',
      strokeWeight: 2,
      scale: 1.5,
      anchor: new window.google.maps.Point(12, 22),
    };
  }, [STATUS_COLORS]);

  // Initialize map
  useEffect(() => {
    let mounted = true;
    let retryCount = 0;
    const maxRetries = 5;

    const initMap = async () => {
      try {
        // Wait for DOM to be fully ready
        await new Promise(resolve => setTimeout(resolve, 100));

        if (!mounted) return;

        if (!mapRef.current) {
          if (retryCount < maxRetries) {
            retryCount++;
            console.warn(`Map container not ready, retry ${retryCount}/${maxRetries}...`);
            setTimeout(() => {
              if (mounted) initMap();
            }, 300 * retryCount); // Exponential backoff
            return;
          } else {
            throw new Error('Map container not found after multiple retries');
          }
        }

        const google = await loadGoogleMaps();

        if (!mounted || !mapRef.current) return;

        // Create map instance
        const map = new google.maps.Map(mapRef.current, {
          center: userLocation || { lat: 40.7128, lng: -74.0060 }, // Default to NYC
          zoom: userLocation ? 19 : 12,
          mapTypeId: mapType,
          mapTypeControl: false, // We'll use custom control
          streetViewControl: true,
          fullscreenControl: true,
          zoomControl: true,
          styles: [
            { featureType: 'poi.business', stylers: [{ visibility: 'off' }] },
            { featureType: 'transit', stylers: [{ visibility: 'simplified' }] },
          ],
        });

        mapInstanceRef.current = map;

        // Traffic layer
        trafficLayerRef.current = new google.maps.TrafficLayer();
        if (showTraffic) {
          trafficLayerRef.current.setMap(map);
        }

        // Map click listener for adding properties
        map.addListener('click', async (event) => {
          const lat = event.latLng.lat();
          const lng = event.latLng.lng();

          // Reverse geocode
          const geocoder = new google.maps.Geocoder();
          try {
            const result = await geocoder.geocode({ location: { lat, lng } });
            const address = result.results?.[0]?.formatted_address || `${lat.toFixed(6)}, ${lng.toFixed(6)}`;

            if (onMapClick) {
              onMapClick({ lat, lng, address });
            }
          } catch (error) {
            console.error('Geocoding error:', error);
            if (onMapClick) {
              onMapClick({ lat, lng, address: `${lat.toFixed(6)}, ${lng.toFixed(6)}` });
            }
          }
        });

        if (onMapReady) {
          onMapReady(map);
        }

        setLoading(false);
        setError(null);
        console.log('Map initialized successfully');
      } catch (err) {
        console.error('Map initialization error:', err);
        if (mounted) {
          setError(err.message || 'Failed to initialize map');
          setLoading(false);
        }
      }
    };

    initMap();

    return () => {
      mounted = false;
      if (mapInstanceRef.current) {
        window.google?.maps?.event?.clearInstanceListeners(mapInstanceRef.current);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Update map type
  useEffect(() => {
    if (mapInstanceRef.current && window.google) {
      mapInstanceRef.current.setMapTypeId(mapType);
    }
  }, [mapType]);

  // Update traffic layer
  useEffect(() => {
    if (trafficLayerRef.current && mapInstanceRef.current) {
      trafficLayerRef.current.setMap(showTraffic ? mapInstanceRef.current : null);
    }
  }, [showTraffic]);

  // Render property markers
  useEffect(() => {
    if (!mapInstanceRef.current || !window.google || !properties.length) return;

    // Clear existing markers
    markersRef.current.forEach(marker => marker.setMap(null));
    markersRef.current = [];

    // Create new markers
    properties.forEach((property) => {
      if (!property.latitude || !property.longitude) return;

      const marker = new window.google.maps.Marker({
        position: { lat: property.latitude, lng: property.longitude },
        map: mapInstanceRef.current,
        title: property.address || 'Property',
        icon: createMarkerIcon(property),
        animation: window.google.maps.Animation.DROP,
      });

      marker.addListener('click', () => {
        if (onPropertyClick) {
          onPropertyClick(property);
        }
      });

      markersRef.current.push(marker);
    });
  }, [properties, createMarkerIcon, onPropertyClick]);

  // Render user location marker
  useEffect(() => {
    if (!mapInstanceRef.current || !window.google || !userLocation) return;

    // Clear existing user marker
    if (userMarkerRef.current) {
      userMarkerRef.current.setMap(null);
    }
    if (accuracyCircleRef.current) {
      accuracyCircleRef.current.setMap(null);
    }

    // Create user location marker
    userMarkerRef.current = new window.google.maps.Marker({
      position: { lat: userLocation.lat, lng: userLocation.lng },
      map: mapInstanceRef.current,
      title: 'Your Location',
      icon: {
        path: window.google.maps.SymbolPath.CIRCLE,
        scale: 10,
        fillColor: '#4285F4',
        fillOpacity: 1,
        strokeColor: '#FFFFFF',
        strokeWeight: 3,
      },
      zIndex: 10000,
    });

    // Create accuracy circle
    if (userLocation.accuracy) {
      accuracyCircleRef.current = new window.google.maps.Circle({
        map: mapInstanceRef.current,
        center: { lat: userLocation.lat, lng: userLocation.lng },
        radius: userLocation.accuracy,
        fillColor: '#4285F4',
        fillOpacity: 0.1,
        strokeColor: '#4285F4',
        strokeOpacity: 0.3,
        strokeWeight: 1,
      });
    }

    return () => {
      if (userMarkerRef.current) {
        userMarkerRef.current.setMap(null);
      }
      if (accuracyCircleRef.current) {
        accuracyCircleRef.current.setMap(null);
      }
    };
  }, [userLocation]);

  // Render territory overlays
  useEffect(() => {
    if (!mapInstanceRef.current || !window.google || !territories.length) return;

    // Clear existing territories
    territoryOverlaysRef.current.forEach(overlay => overlay.setMap(null));
    territoryOverlaysRef.current = [];

    // Create territory polygons
    territories.forEach((territory) => {
      if (!territory.boundary_geojson || !territory.boundary_geojson.coordinates) return;

      const polygon = new window.google.maps.Polygon({
        paths: territory.boundary_geojson.coordinates[0].map(coord => ({
          lat: coord[1],
          lng: coord[0]
        })),
        strokeColor: territory.color || '#FF0000',
        strokeOpacity: 0.8,
        strokeWeight: 2,
        fillColor: territory.color || '#FF0000',
        fillOpacity: 0.15,
        map: mapInstanceRef.current,
      });

      territoryOverlaysRef.current.push(polygon);
    });

    return () => {
      territoryOverlaysRef.current.forEach(overlay => overlay.setMap(null));
      territoryOverlaysRef.current = [];
    };
  }, [territories]);

  // Center on user location
  const centerOnUser = useCallback(() => {
    if (mapInstanceRef.current && userLocation) {
      mapInstanceRef.current.panTo({ lat: userLocation.lat, lng: userLocation.lng });
      mapInstanceRef.current.setZoom(19);
    }
  }, [userLocation]);

  if (loading) {
    return (
      <div className="absolute inset-0 flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Loader2 className="animate-spin h-12 w-12 text-blue-600 mx-auto mb-3" />
          <p className="text-gray-600">Loading Map...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="absolute inset-0 flex items-center justify-center bg-red-50">
        <div className="text-center max-w-md px-4">
          <AlertCircle className="h-12 w-12 text-red-600 mx-auto mb-3" />
          <h3 className="text-lg font-semibold text-red-800 mb-2">Map Error</h3>
          <p className="text-red-600 text-sm mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Reload Page
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-full h-full">
      {/* Map Container */}
      <div ref={mapRef} className="w-full h-full" />

      {/* Floating Controls */}
      <div className="absolute top-4 right-4 flex flex-col gap-2">
        {/* Map Type Selector */}
        <div className="relative">
          <button
            onClick={() => setShowMapTypeSelector(!showMapTypeSelector)}
            className="p-3 bg-white rounded-lg shadow-lg hover:shadow-xl transition-shadow"
            title="Map Type"
          >
            <Layers className="w-5 h-5 text-gray-700" />
          </button>

          {showMapTypeSelector && (
            <div className="absolute top-full right-0 mt-2 bg-white rounded-lg shadow-xl border border-gray-200 p-2 w-40">
              {['roadmap', 'satellite', 'hybrid', 'terrain'].map((type) => (
                <button
                  key={type}
                  onClick={() => {
                    if (onMapTypeChange) onMapTypeChange(type);
                    setShowMapTypeSelector(false);
                  }}
                  className={`w-full text-left px-3 py-2 rounded hover:bg-gray-100 ${
                    mapType === type ? 'bg-blue-50 text-blue-700 font-medium' : 'text-gray-700'
                  }`}
                >
                  {type.charAt(0).toUpperCase() + type.slice(1)}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Center on Location */}
        {userLocation && (
          <button
            onClick={centerOnUser}
            className="p-3 bg-white rounded-lg shadow-lg hover:shadow-xl transition-shadow"
            title="Center on my location"
          >
            <Navigation className="w-5 h-5 text-blue-600" />
          </button>
        )}
      </div>

      {/* Legend */}
      <div className="absolute bottom-4 right-4 bg-white/95 backdrop-blur-md rounded-lg shadow-xl border border-gray-200 p-4 max-w-xs">
        <h3 className="text-sm font-bold text-gray-900 mb-3">Status Legend</h3>
        <div className="space-y-2 text-xs">
          {Object.entries(STATUS_COLORS).map(([status, color]) => (
            <div key={status} className="flex items-center gap-2">
              <div
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: color }}
              />
              <span className="text-gray-700">{status}</span>
            </div>
          ))}
        </div>
        <p className="text-xs text-gray-500 mt-3 pt-3 border-t">
          💡 Tip: Click map to add property
        </p>
      </div>
    </div>
  );
};

export default MapCore;
