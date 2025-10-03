import React, { useState, useRef, useEffect, useMemo } from 'react';
import {
  Navigation,
  Filter,
  Target,
  Play,
  Square,
  Loader2,
  AlertCircle,
  ClipboardList,
} from 'lucide-react';
import { loadGoogleMaps } from '../../services/googleMapsService';
import { useCanvassingStore } from './store/canvassingStore';
import { useGeoLocation } from './hooks/useGeoLocation';
import { createPropertyMarkerIcon, PROPERTY_STATUS } from './components/map/PropertyMarker';
import PropertyDetailSheet from './components/property/PropertyDetailSheet';
import DaySummary from './components/summary/DaySummary';
import './CanvassingView.css';

/**
 * CanvassingView Component
 * Main door-to-door canvassing interface with advanced mapping features
 */
const CanvassingView = ({ leads, onMapLoad }) => {
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markersRef = useRef([]);
  const trafficLayerRef = useRef(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedProperty, setSelectedProperty] = useState(null);
  const [showPropertySheet, setShowPropertySheet] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [showDaySummary, setShowDaySummary] = useState(false);

  // Store state
  const {
    mapView,
    updateMapView,
    properties,
    addProperty,
    propertyFilter,
    setPropertyFilter,
    getFilteredProperties,
    setTrackingEnabled,
  } = useCanvassingStore();

  // Geolocation
  const { location, isTracking, startTracking, stopTracking } = useGeoLocation({
    updateInterval: 30000, // 30 seconds
  });

  // Auto-start location tracking on mount
  useEffect(() => {
    startTracking();
    setTrackingEnabled(true);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Auto-zoom to user location on first load
  const hasZoomedToLocation = useRef(false);
  useEffect(() => {
    if (location && mapInstanceRef.current && !hasZoomedToLocation.current) {
      hasZoomedToLocation.current = true;
      mapInstanceRef.current.panTo({ lat: location.lat, lng: location.lng });
      mapInstanceRef.current.setZoom(19); // Street-level zoom
    }
  }, [location]);

  // Initialize map with retry logic
  const initializeMapFunction = async (attempt = 0) => {
    const maxAttempts = 3;
    const delays = [100, 500, 1000];

    try {
      // Check if map container exists
      if (!mapRef.current) {
        if (attempt < maxAttempts - 1) {
          await new Promise(resolve => setTimeout(resolve, delays[attempt]));
          return initializeMapFunction(attempt + 1);
        }
        throw new Error('Map container not found. Please refresh the page.');
      }

      // Load Google Maps API
      const google = await loadGoogleMaps();

      // Verify container still exists after async load
      if (!mapRef.current) {
        throw new Error('Map container was removed during initialization.');
      }

      // Create map instance
      const mapInstance = new google.maps.Map(mapRef.current, {
        center: mapView.center,
        zoom: mapView.zoom,
        mapTypeId: mapView.mapType,
        mapTypeControl: true,
        streetViewControl: true,
        fullscreenControl: true,
        zoomControl: true,
        styles: [
          { featureType: 'poi.business', stylers: [{ visibility: 'off' }] },
          { featureType: 'transit', stylers: [{ visibility: 'simplified' }] },
        ],
      });

      // Traffic layer
      trafficLayerRef.current = new google.maps.TrafficLayer();
      if (mapView.showTraffic) {
        trafficLayerRef.current.setMap(mapInstance);
      }

      mapInstanceRef.current = mapInstance;

      // Save map position changes
      mapInstance.addListener('center_changed', () => {
        const center = mapInstance.getCenter();
        if (center) {
          updateMapView({
            center: { lat: center.lat(), lng: center.lng() },
          });
        }
      });

      mapInstance.addListener('zoom_changed', () => {
        updateMapView({ zoom: mapInstance.getZoom() });
      });

      // Add click listener to drop pins on the map
      mapInstance.addListener('click', async (event) => {
        const lat = event.latLng.lat();
        const lng = event.latLng.lng();

        try {
          // Reverse geocode to get address
          const geocoder = new google.maps.Geocoder();
          const result = await geocoder.geocode({ location: { lat, lng } });

          if (result.results && result.results[0]) {
            const address = result.results[0].formatted_address;

            // Extract address components
            const addressComponents = result.results[0].address_components;
            let streetNumber = '';
            let streetName = '';

            addressComponents.forEach(component => {
              if (component.types.includes('street_number')) {
                streetNumber = component.long_name;
              }
              if (component.types.includes('route')) {
                streetName = component.long_name;
              }
            });

            // Create new property at clicked location
            addProperty({
              address: address,
              streetAddress: streetNumber && streetName ? `${streetNumber} ${streetName}` : address,
              latitude: lat,
              longitude: lng,
              status: PROPERTY_STATUS.NOT_CONTACTED,
              visits: [],
              createdBy: 'map_click',
            });
          } else {
            // No address found, still create property with coordinates
            addProperty({
              address: `Location: ${lat.toFixed(6)}, ${lng.toFixed(6)}`,
              latitude: lat,
              longitude: lng,
              status: PROPERTY_STATUS.NOT_CONTACTED,
              visits: [],
              createdBy: 'map_click',
            });
          }
        } catch (error) {
          console.error('Error geocoding location:', error);
          // Still create property even if geocoding fails
          addProperty({
            address: `Location: ${lat.toFixed(6)}, ${lng.toFixed(6)}`,
            latitude: lat,
            longitude: lng,
            status: PROPERTY_STATUS.NOT_CONTACTED,
            visits: [],
            createdBy: 'map_click',
          });
        }
      });

      // Notify parent component
      if (onMapLoad) {
        onMapLoad(mapInstance);
      }

      setLoading(false);
      setError(null);
    } catch (err) {
      console.error('[Canvassing] Map initialization error:', err);
      setError(err.message || 'Failed to initialize map');
      setLoading(false);
    }
  };

  // Initialize map on mount
  useEffect(() => {
    let mounted = true;
    let timeoutId;

    const init = async () => {
      if (!mounted) return;

      setLoading(true);
      setError(null);

      // Wait for DOM to be ready
      timeoutId = setTimeout(async () => {
        if (mounted) {
          await initializeMapFunction();
        }
      }, 100);
    };

    init();

    return () => {
      mounted = false;
      if (timeoutId) clearTimeout(timeoutId);
      // Cleanup map instance
      if (mapInstanceRef.current) {
        window.google?.maps?.event?.clearInstanceListeners(mapInstanceRef.current);
        mapInstanceRef.current = null;
      }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Sync leads to properties if not already in store
  useEffect(() => {
    if (!leads || leads.length === 0) return;

    leads.forEach((lead) => {
      if (lead.latitude && lead.longitude) {
        const exists = properties.find((p) => p.leadId === lead.id);
        if (!exists) {
          addProperty({
            leadId: lead.id,
            address: lead.address,
            customerName: lead.customerName,
            phoneNumber: lead.phoneNumber,
            email: lead.email,
            latitude: lead.latitude,
            longitude: lead.longitude,
            quality: lead.quality,
            status: PROPERTY_STATUS.NOT_CONTACTED,
            visits: [],
          });
        }
      }
    });
  }, [leads, properties, addProperty]);

  // Render property markers using AdvancedMarkerElement (or fallback to Marker)
  useEffect(() => {
    if (!mapInstanceRef.current || !window.google) return;

    // Clear existing markers
    markersRef.current.forEach((marker) => {
      if (marker.setMap) {
        marker.setMap(null);
      }
    });
    markersRef.current = [];

    const filteredProperties = getFilteredProperties();

    // Create new markers
    filteredProperties.forEach((property) => {
      if (!property || !property.latitude || !property.longitude) return;

      try {
        let marker;

        // Use AdvancedMarkerElement if available (Google Maps v3.56+)
        if (window.google.maps.marker?.AdvancedMarkerElement) {
          // Create a div element for the custom marker content - FIX: Safely handle SVG without innerHTML
          const content = document.createElement('div');
          const iconData = createPropertyMarkerIcon(property);

          if (iconData && iconData.url) {
            // Create image element instead of using innerHTML to avoid SVG injection
            const img = document.createElement('img');
            img.src = iconData.url;
            img.style.width = '36px';
            img.style.height = '36px';
            img.style.cursor = 'pointer';
            content.appendChild(img);
          }

          marker = new window.google.maps.marker.AdvancedMarkerElement({
            map: mapInstanceRef.current,
            position: { lat: property.latitude, lng: property.longitude },
            title: property.address || 'Property',
            content: content,
          });

          // Add click listener
          content.addEventListener('click', () => {
            setSelectedProperty(property);
            setShowPropertySheet(true);
          });
        } else {
          // Fallback to legacy Marker
          marker = new window.google.maps.Marker({
            position: { lat: property.latitude, lng: property.longitude },
            map: mapInstanceRef.current,
            title: property.address || 'Property',
            icon: createPropertyMarkerIcon(property),
            animation: window.google.maps.Animation.DROP,
          });

          marker.addListener('click', () => {
            setSelectedProperty(property);
            setShowPropertySheet(true);
          });
        }

        if (marker) {
          markersRef.current.push(marker);
        }
      } catch (error) {
        console.error('Error creating marker for property:', property.id, error);
      }
    });
  }, [properties, propertyFilter, getFilteredProperties]);

  // Current location marker
  useEffect(() => {
    if (!mapInstanceRef.current || !window.google || !location) return;

    let currentLocationMarker;

    // Use AdvancedMarkerElement if available, otherwise fallback to Marker
    if (window.google.maps.marker?.AdvancedMarkerElement) {
      // Create custom div element for current location
      const locationDiv = document.createElement('div');
      locationDiv.style.width = '20px';
      locationDiv.style.height = '20px';
      locationDiv.style.borderRadius = '50%';
      locationDiv.style.backgroundColor = '#4285F4';
      locationDiv.style.border = '3px solid #FFFFFF';
      locationDiv.style.boxShadow = '0 2px 6px rgba(0,0,0,0.3)';

      currentLocationMarker = new window.google.maps.marker.AdvancedMarkerElement({
        map: mapInstanceRef.current,
        position: { lat: location.lat, lng: location.lng },
        title: 'Your Location',
        content: locationDiv,
      });
    } else {
      // Fallback to legacy Marker
      currentLocationMarker = new window.google.maps.Marker({
        position: { lat: location.lat, lng: location.lng },
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
    }

    // Create accuracy circle
    const accuracyCircle = new window.google.maps.Circle({
      map: mapInstanceRef.current,
      center: { lat: location.lat, lng: location.lng },
      radius: location.accuracy,
      fillColor: '#4285F4',
      fillOpacity: 0.1,
      strokeColor: '#4285F4',
      strokeOpacity: 0.3,
      strokeWeight: 1,
    });

    return () => {
      if (currentLocationMarker) {
        if (currentLocationMarker.setMap) {
          try {
            currentLocationMarker.setMap(null);
          } catch (e) {
            console.error('Error clearing location marker:', e);
          }
        }
      }
      if (accuracyCircle) {
        try {
          accuracyCircle.setMap(null);
        } catch (e) {
          console.error('Error clearing accuracy circle:', e);
        }
      }
    };
  }, [location]);

  // Toggle tracking
  const handleToggleTracking = () => {
    if (isTracking) {
      stopTracking();
      setTrackingEnabled(false);
    } else {
      startTracking();
      setTrackingEnabled(true);
    }
  };

  // Filter stats
  const filterStats = useMemo(() => {
    const filtered = getFilteredProperties();
    return {
      total: filtered.length,
      notContacted: filtered.filter((p) => p.status === PROPERTY_STATUS.NOT_CONTACTED).length,
      interested: filtered.filter((p) => p.status === PROPERTY_STATUS.INTERESTED).length,
      appointments: filtered.filter((p) => p.status === PROPERTY_STATUS.APPOINTMENT).length,
      sold: filtered.filter((p) => p.status === PROPERTY_STATUS.SOLD).length,
    };
  }, [getFilteredProperties]);

  return (
    <div className="h-full flex flex-col bg-gray-50">
      {/* Loading Overlay */}
      {loading && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-gray-50">
          <div className="text-center">
            <Loader2 className="animate-spin h-12 w-12 text-blue-600 mx-auto mb-3" />
            <p className="text-gray-600 text-lg">Loading Canvassing Map...</p>
          </div>
        </div>
      )}

      {/* Error Overlay */}
      {error && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-red-50">
          <div className="text-center max-w-md px-4">
            <AlertCircle className="h-12 w-12 text-red-600 mx-auto mb-3" />
            <h3 className="text-lg font-semibold text-red-800 mb-2">Map Initialization Error</h3>
            <p className="text-red-600 mb-6 text-sm">{error}</p>
            <div className="flex gap-3 justify-center">
              <button
                onClick={() => {
                  setError(null);
                  setLoading(true);
                  initializeMapFunction();
                }}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
              >
                Retry
              </button>
              <button
                onClick={() => window.location.reload()}
                className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-medium"
              >
                Refresh Page
              </button>
            </div>
            <p className="text-xs text-gray-500 mt-4">
              If the issue persists, please check your internet connection and Google Maps API configuration.
            </p>
          </div>
        </div>
      )}
      {/* Header */}
      <div className="bg-white border-b px-4 py-3 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <Target className="w-6 h-6 text-blue-600" />
          <div>
            <h2 className="text-lg font-bold text-gray-900">Door-to-Door Canvassing</h2>
            <p className="text-sm text-gray-600">{filterStats.total} properties</p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          {/* Day Summary Toggle */}
          <button
            onClick={() => setShowDaySummary(!showDaySummary)}
            className="flex items-center px-3 py-2 rounded-lg text-sm font-medium bg-blue-100 text-blue-700 hover:bg-blue-200 transition-colors"
            title="View Day Summary"
          >
            <ClipboardList className="w-4 h-4 mr-2" />
            Day Summary
          </button>

          {/* Location Tracking Toggle */}
          <button
            onClick={handleToggleTracking}
            className={`flex items-center px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
              isTracking
                ? 'bg-green-100 text-green-700 hover:bg-green-200'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {isTracking ? (
              <><Square className="w-4 h-4 mr-2" /> Stop Tracking</>
            ) : (
              <><Play className="w-4 h-4 mr-2" /> Start Tracking</>
            )}
          </button>

          {/* Filter Toggle */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`p-2 rounded-lg transition-colors ${
              showFilters ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <Filter className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Filters Panel */}
      {showFilters && (
        <div className="bg-white border-b px-4 py-3">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Status Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
              <select
                value={propertyFilter.status}
                onChange={(e) => setPropertyFilter({ status: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Statuses</option>
                {Object.values(PROPERTY_STATUS).map((status) => (
                  <option key={status} value={status}>
                    {status.replace('_', ' ').toUpperCase()}
                  </option>
                ))}
              </select>
            </div>

            {/* Quality Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Lead Quality</label>
              <select
                value={propertyFilter.quality}
                onChange={(e) => setPropertyFilter({ quality: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Qualities</option>
                <option value="hot">Hot</option>
                <option value="warm">Warm</option>
                <option value="cold">Cold</option>
              </select>
            </div>

            {/* Map Type */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Map Type</label>
              <select
                value={mapView.mapType}
                onChange={(e) => {
                  updateMapView({ mapType: e.target.value });
                  if (mapInstanceRef.current) {
                    mapInstanceRef.current.setMapTypeId(e.target.value);
                  }
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="roadmap">Road Map</option>
                <option value="satellite">Satellite</option>
                <option value="hybrid">Hybrid</option>
                <option value="terrain">Terrain</option>
              </select>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="mt-4 grid grid-cols-5 gap-3">
            <div className="bg-gray-50 px-3 py-2 rounded-lg text-center">
              <p className="text-xs text-gray-600">Not Contacted</p>
              <p className="text-lg font-bold text-gray-900">{filterStats.notContacted}</p>
            </div>
            <div className="bg-green-50 px-3 py-2 rounded-lg text-center">
              <p className="text-xs text-green-600">Interested</p>
              <p className="text-lg font-bold text-green-700">{filterStats.interested}</p>
            </div>
            <div className="bg-blue-50 px-3 py-2 rounded-lg text-center">
              <p className="text-xs text-blue-600">Appointments</p>
              <p className="text-lg font-bold text-blue-700">{filterStats.appointments}</p>
            </div>
            <div className="bg-purple-50 px-3 py-2 rounded-lg text-center">
              <p className="text-xs text-purple-600">Sold</p>
              <p className="text-lg font-bold text-purple-700">{filterStats.sold}</p>
            </div>
            <div className="bg-gray-50 px-3 py-2 rounded-lg text-center">
              <p className="text-xs text-gray-600">Total</p>
              <p className="text-lg font-bold text-gray-900">{filterStats.total}</p>
            </div>
          </div>
        </div>
      )}

      {/* Map Container */}
      <div className="flex-1 relative">
        <div
          ref={mapRef}
          id="canvassing-map-container"
          className="w-full h-full absolute inset-0"
          style={{ minHeight: '400px', zIndex: 1 }}
        />

        {/* Floating Action Button - Center on My Location */}
        {location && (
          <button
            onClick={() => {
              if (mapInstanceRef.current) {
                mapInstanceRef.current.panTo({ lat: location.lat, lng: location.lng });
                mapInstanceRef.current.setZoom(19); // Street-level zoom to show house numbers
              }
            }}
            className="absolute bottom-6 right-6 p-3 bg-white rounded-full shadow-lg hover:shadow-xl transition-shadow"
            title="Center on my location"
          >
            <Navigation className="w-5 h-5 text-blue-600" />
          </button>
        )}

        {/* Legend */}
        <div className="absolute top-4 right-4 bg-white rounded-lg shadow-lg p-4 max-w-xs max-h-[80vh] overflow-y-auto">
          <h3 className="text-sm font-semibold text-gray-900 mb-3">Canvassing Status</h3>
          <div className="space-y-2 text-xs">
            <div className="flex items-center">
              <div className="w-3 h-3 rounded-full bg-[#F97316] mr-2"></div>
              <span>Needs Inspection</span>
            </div>
            <div className="flex items-center">
              <div className="w-3 h-3 rounded-full bg-[#9CA3AF] mr-2"></div>
              <span>Knock Not Home</span>
            </div>
            <div className="flex items-center">
              <div className="w-3 h-3 rounded-full bg-[#EAB308] mr-2"></div>
              <span>Follow-up Needed</span>
            </div>
            <div className="flex items-center">
              <div className="w-3 h-3 rounded-full bg-[#A855F7] mr-2"></div>
              <span>Door Hanger</span>
            </div>
            <hr className="my-2" />
            <div className="flex items-center">
              <div className="w-3 h-3 rounded-full bg-green-500 mr-2"></div>
              <span>Interested</span>
            </div>
            <div className="flex items-center">
              <div className="w-3 h-3 rounded-full bg-blue-500 mr-2"></div>
              <span>Appointment</span>
            </div>
            <div className="flex items-center">
              <div className="w-3 h-3 rounded-full bg-purple-500 mr-2"></div>
              <span>Sold</span>
            </div>
            <div className="flex items-center">
              <div className="w-3 h-3 rounded-full bg-red-500 mr-2"></div>
              <span>Not Interested</span>
            </div>
          </div>
          <p className="text-[10px] text-gray-500 mt-3 pt-2 border-t">Click anywhere on map to drop a pin</p>
        </div>
      </div>

      {/* Property Detail Sheet */}
      {showPropertySheet && selectedProperty && (
        <PropertyDetailSheet
          property={selectedProperty}
          onClose={() => {
            setShowPropertySheet(false);
            setSelectedProperty(null);
          }}
          onEdit={(property) => {
            // Handle edit
            console.log('Edit property:', property);
          }}
          onDelete={(property) => {
            if (window.confirm('Delete this property from canvassing list?')) {
              // Handle delete
              console.log('Delete property:', property);
            }
          }}
        />
      )}

      {/* Day Summary Modal */}
      {showDaySummary && (
        <DaySummary
          onClose={() => setShowDaySummary(false)}
        />
      )}
    </div>
  );
};

export default CanvassingView;
