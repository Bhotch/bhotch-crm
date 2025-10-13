import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Circle, useMap, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import {
  Navigation,
  Filter,
  Target,
  Play,
  Square,
  ClipboardList,
  ChevronDown,
  ChevronUp,
  Trash2,
  Edit2,
} from 'lucide-react';
import { useCanvassingStore } from './store/canvassingStore';
import { useGeoLocation } from './hooks/useGeoLocation';
import { PROPERTY_STATUS } from './components/map/PropertyMarker';
import PropertyDetailSheet from './components/property/PropertyDetailSheet';
import DaySummary from './components/summary/DaySummary';
import './CanvassingView.css';

// Fix Leaflet default icon issue
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: require('leaflet/dist/images/marker-icon-2x.png'),
  iconUrl: require('leaflet/dist/images/marker-icon.png'),
  shadowUrl: require('leaflet/dist/images/marker-shadow.png'),
});

/**
 * Create custom marker icon based on property status
 */
const createLeafletIcon = (status, quality, priority) => {
  const getColor = () => {
    switch (status) {
      case PROPERTY_STATUS.SOLD: return '#8B5CF6';
      case PROPERTY_STATUS.APPOINTMENT: return '#3B82F6';
      case PROPERTY_STATUS.INTERESTED: return '#10B981';
      case PROPERTY_STATUS.CALLBACK: return '#F59E0B';
      case PROPERTY_STATUS.NOT_HOME: return '#6B7280';
      case PROPERTY_STATUS.NOT_INTERESTED: return '#EF4444';
      case PROPERTY_STATUS.NEEDS_INSPECTION: return '#F97316';
      case PROPERTY_STATUS.KNOCK_NOT_HOME: return '#9CA3AF';
      case PROPERTY_STATUS.FOLLOW_UP_NEEDED: return '#EAB308';
      case PROPERTY_STATUS.DOOR_HANGER: return '#A855F7';
      default:
        switch (quality?.toLowerCase()) {
          case 'hot': return '#DC2626';
          case 'warm': return '#F59E0B';
          case 'cold': return '#3B82F6';
          default: return '#9CA3AF';
        }
    }
  };

  const color = getColor();
  const size = priority === 'high' ? 32 : 28;

  return L.divIcon({
    className: 'custom-marker',
    html: `
      <div style="
        width: ${size}px;
        height: ${size}px;
        background-color: ${color};
        border: 3px solid white;
        border-radius: 50%;
        box-shadow: 0 2px 6px rgba(0,0,0,0.3);
        transition: transform 0.2s ease;
        cursor: pointer;
      "></div>
    `,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
  });
};

/**
 * Free geocoding using Nominatim (OpenStreetMap)
 */
const geocodeNominatim = async (lat, lng) => {
  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`,
      {
        headers: {
          'User-Agent': 'BhotchCRM/1.0',
        },
      }
    );
    const data = await response.json();

    if (data && data.address) {
      const addr = data.address;
      const streetNumber = addr.house_number || '';
      const street = addr.road || addr.street || '';
      const city = addr.city || addr.town || addr.village || '';
      const state = addr.state || '';
      const zip = addr.postcode || '';

      return {
        formatted: data.display_name,
        streetAddress: `${streetNumber} ${street}`.trim(),
        city,
        state,
        zip,
      };
    }
  } catch (error) {
    console.warn('[Canvassing] Nominatim geocoding failed:', error.message);
  }
  return null;
};

/**
 * Map event handler component
 */
const MapClickHandler = ({ onMapClick }) => {
  useMapEvents({
    click: (e) => {
      onMapClick(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
};

/**
 * Auto-center and zoom controller
 */
const MapController = ({ location, shouldCenter }) => {
  const map = useMap();

  useEffect(() => {
    if (location && shouldCenter) {
      // Use requestAnimationFrame to prevent forced reflow
      requestAnimationFrame(() => {
        map.setView([location.lat, location.lng], 19, {
          animate: true,
          duration: 1,
        });
      });
    }
  }, [location, shouldCenter, map]);

  return null;
};

/**
 * CanvassingViewLeaflet - FREE alternative with no billing required
 * Uses OpenStreetMap + Leaflet + Nominatim geocoding (all free!)
 */
const CanvassingViewLeaflet = ({ leads }) => {
  const [selectedProperty, setSelectedProperty] = useState(null);
  const [showPropertySheet, setShowPropertySheet] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [showDaySummary, setShowDaySummary] = useState(false);
  const [mapReady, setMapReady] = useState(false);
  const [shouldCenter, setShouldCenter] = useState(true);
  const [legendMinimized, setLegendMinimized] = useState(false);
  const [isAddingProperty, setIsAddingProperty] = useState(false);

  // Store state
  const {
    properties,
    addProperty,
    deleteProperty,
    propertyFilter,
    setPropertyFilter,
    getFilteredProperties,
    setTrackingEnabled,
  } = useCanvassingStore();

  // Geolocation
  const { location, isTracking, startTracking, stopTracking } = useGeoLocation({
    updateInterval: 30000,
    distanceFilter: 10,
  });

  // Start tracking on mount
  useEffect(() => {
    startTracking();
    setTrackingEnabled(true);
    setMapReady(true);
  }, [startTracking, setTrackingEnabled]);

  // Sync leads to properties
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
            priority: lead.quality === 'Hot' ? 'high' : 'normal',
          });
        }
      }
    });
  }, [leads, properties, addProperty]);

  // Handle map click - OPTIMIZED to prevent 1000ms+ click handlers
  const handleMapClick = useCallback((lat, lng) => {
    // Prevent multiple rapid clicks
    if (isAddingProperty) return;

    // Quick proximity check (optimized - no expensive sqrt until necessary)
    const hasNearby = properties.some((p) => {
      const latDiff = Math.abs(p.latitude - lat);
      const lngDiff = Math.abs(p.longitude - lng);
      return latDiff < 0.00005 && lngDiff < 0.00005; // ~5 meters
    });

    if (hasNearby) return;

    setIsAddingProperty(true);

    // Add property immediately with coordinates (instant feedback)
    const propertyData = {
      address: `📍 ${lat.toFixed(5)}, ${lng.toFixed(5)}`,
      latitude: lat,
      longitude: lng,
      status: PROPERTY_STATUS.NOT_CONTACTED,
      visits: [],
      createdBy: 'map_click',
      priority: 'normal',
    };

    addProperty(propertyData);

    // Geocode in background (doesn't block UI)
    setTimeout(async () => {
      try {
        const geocoded = await geocodeNominatim(lat, lng);
        if (geocoded && propertyData) {
          // Update with real address (silent update)
          propertyData.address = geocoded.formatted;
          propertyData.streetAddress = geocoded.streetAddress;
        }
      } catch (error) {
        // Silent fail
      } finally {
        setTimeout(() => setIsAddingProperty(false), 500);
      }
    }, 0);
  }, [addProperty, properties, isAddingProperty]);

  // Toggle tracking
  const handleToggleTracking = useCallback(() => {
    if (isTracking) {
      stopTracking();
      setTrackingEnabled(false);
    } else {
      startTracking();
      setTrackingEnabled(true);
    }
  }, [isTracking, startTracking, stopTracking, setTrackingEnabled]);

  // Center on user
  const handleCenterOnUser = useCallback(() => {
    setShouldCenter(true);
    setTimeout(() => setShouldCenter(false), 100);
  }, []);

  // Filter statistics
  const filterStats = useMemo(() => {
    const filtered = getFilteredProperties();
    return {
      total: filtered.length,
      notContacted: filtered.filter((p) => p.status === PROPERTY_STATUS.NOT_CONTACTED).length,
      interested: filtered.filter((p) => p.status === PROPERTY_STATUS.INTERESTED).length,
      appointments: filtered.filter((p) => p.status === PROPERTY_STATUS.APPOINTMENT).length,
      sold: filtered.filter((p) => p.status === PROPERTY_STATUS.SOLD).length,
      needsInspection: filtered.filter((p) => p.status === PROPERTY_STATUS.NEEDS_INSPECTION).length,
      followUp: filtered.filter((p) => p.status === PROPERTY_STATUS.FOLLOW_UP_NEEDED).length,
    };
  }, [getFilteredProperties]);

  const filteredProperties = useMemo(() => getFilteredProperties(), [getFilteredProperties]);

  // Default center (Salt Lake City)
  const defaultCenter = [40.7608, -111.8910];
  const center = location ? [location.lat, location.lng] : defaultCenter;

  return (
    <div className="h-full flex flex-col bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-green-600 via-green-700 to-emerald-700 border-b border-green-800 px-6 py-4 shadow-xl">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="bg-white/20 p-3 rounded-xl backdrop-blur-md shadow-lg">
              <Target className="w-7 h-7 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white drop-shadow-md">
                Elite Canvassing System
                <span className="ml-3 text-xs bg-green-500 px-2 py-1 rounded-full">FREE - No Billing</span>
              </h2>
              <div className="flex items-center gap-4 mt-1">
                <p className="text-sm text-green-100 flex items-center gap-1">
                  <span className="font-bold">{filterStats.total}</span> properties
                </p>
                <span className="text-green-300">•</span>
                <p className="text-sm text-green-200 flex items-center gap-1">
                  <span className="font-bold">{filterStats.interested}</span> interested
                </p>
                <span className="text-green-300">•</span>
                <p className="text-sm text-purple-200 flex items-center gap-1">
                  <span className="font-bold">{filterStats.sold}</span> sold
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            {/* Day Summary */}
            <button
              onClick={() => setShowDaySummary(!showDaySummary)}
              className="flex items-center px-4 py-2.5 rounded-lg text-sm font-medium bg-white/10 text-white hover:bg-white/20 transition-all backdrop-blur-sm border border-white/20 shadow-lg"
              title="View Day Summary"
            >
              <ClipboardList className="w-4 h-4 mr-2" />
              Daily Stats
            </button>

            {/* Location Tracking */}
            <button
              onClick={handleToggleTracking}
              className={`flex items-center px-4 py-2.5 rounded-lg text-sm font-semibold transition-all shadow-lg border ${
                isTracking
                  ? 'bg-green-500 text-white hover:bg-green-600 border-green-400 animate-pulse'
                  : 'bg-white/10 text-white hover:bg-white/20 backdrop-blur-sm border-white/20'
              }`}
            >
              {isTracking ? (
                <>
                  <Square className="w-4 h-4 mr-2" />
                  Tracking Live
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 mr-2" />
                  Start Tracking
                </>
              )}
            </button>

            {/* Filters */}
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`p-2.5 rounded-lg transition-all shadow-lg ${
                showFilters
                  ? 'bg-white text-green-600'
                  : 'bg-white/10 text-white hover:bg-white/20 backdrop-blur-sm border border-white/20'
              }`}
              title="Toggle Filters"
            >
              <Filter className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Filters Panel */}
      {showFilters && (
        <div className="bg-gradient-to-b from-gray-50 to-white border-b border-gray-200 px-6 py-5 shadow-inner">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-5">
            {/* Status Filter */}
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-2">
                Status Filter
              </label>
              <select
                value={propertyFilter.status}
                onChange={(e) => setPropertyFilter({ status: e.target.value })}
                className="w-full px-4 py-2.5 bg-white border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all shadow-sm font-medium text-sm"
              >
                <option value="all">All Statuses</option>
                {Object.entries(PROPERTY_STATUS).map(([key, value]) => (
                  <option key={key} value={value}>
                    {value.replace(/_/g, ' ').toUpperCase()}
                  </option>
                ))}
              </select>
            </div>

            {/* Quality Filter */}
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-2">
                Lead Quality
              </label>
              <select
                value={propertyFilter.quality}
                onChange={(e) => setPropertyFilter({ quality: e.target.value })}
                className="w-full px-4 py-2.5 bg-white border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all shadow-sm font-medium text-sm"
              >
                <option value="all">All Qualities</option>
                <option value="hot">🔥 Hot Leads</option>
                <option value="warm">⭐ Warm Leads</option>
                <option value="cold">❄️ Cold Leads</option>
              </select>
            </div>

            {/* Quick Actions */}
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-2">
                Quick Actions
              </label>
              <button
                onClick={() => setPropertyFilter({ status: 'all', quality: 'all' })}
                className="w-full px-4 py-2.5 bg-gradient-to-r from-gray-100 to-gray-200 hover:from-gray-200 hover:to-gray-300 border-2 border-gray-300 rounded-xl transition-all shadow-sm font-bold text-sm text-gray-700"
              >
                Reset Filters
              </button>
            </div>
          </div>

          {/* Stats Dashboard */}
          <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
            <StatCard label="Not Contacted" value={filterStats.notContacted} color="gray" />
            <StatCard label="Needs Inspection" value={filterStats.needsInspection} color="orange" />
            <StatCard label="Interested" value={filterStats.interested} color="green" />
            <StatCard label="Follow-up" value={filterStats.followUp} color="yellow" />
            <StatCard label="Appointments" value={filterStats.appointments} color="blue" />
            <StatCard label="Sold" value={filterStats.sold} color="purple" />
          </div>
        </div>
      )}

      {/* Map Container */}
      <div className="flex-1 relative">
        {mapReady && (
          <MapContainer
            center={center}
            zoom={19}
            style={{ height: '100%', width: '100%' }}
            zoomControl={true}
            className="leaflet-canvassing-map"
          >
            {/* OpenStreetMap Tiles - FREE! */}
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              maxZoom={19}
            />

            {/* Map Controllers */}
            <MapClickHandler onMapClick={handleMapClick} />
            <MapController location={location} shouldCenter={shouldCenter} />

            {/* User Location Marker */}
            {location && (
              <>
                {/* Only show accuracy circle if reasonable (< 100m) */}
                {location.accuracy && location.accuracy < 100 && (
                  <Circle
                    center={[location.lat, location.lng]}
                    radius={location.accuracy}
                    pathOptions={{
                      fillColor: '#4285F4',
                      fillOpacity: 0.03,
                      color: '#4285F4',
                      weight: 0.5,
                      opacity: 0.2,
                    }}
                  />
                )}
                <Marker
                  position={[location.lat, location.lng]}
                  icon={L.divIcon({
                    className: 'user-location-marker',
                    html: '<div style="width: 20px; height: 20px; background: #4285F4; border: 3px solid white; border-radius: 50%; box-shadow: 0 2px 6px rgba(0,0,0,0.3); animation: pulse 2s ease-in-out infinite;"></div>',
                    iconSize: [20, 20],
                    iconAnchor: [10, 10],
                  })}
                >
                  <Popup>Your Location</Popup>
                </Marker>
              </>
            )}

            {/* Property Markers */}
            {filteredProperties.map((property) => (
              <Marker
                key={property.id}
                position={[property.latitude, property.longitude]}
                icon={createLeafletIcon(property.status, property.quality, property.priority)}
                eventHandlers={{
                  click: () => {
                    setSelectedProperty(property);
                    setShowPropertySheet(true);
                  },
                }}
              >
                <Popup>
                  <div className="text-sm min-w-[200px]">
                    <div className="font-bold text-gray-900 mb-2">
                      {property.address || 'Unknown Address'}
                    </div>
                    <div className="text-gray-600 mb-2">
                      <div className="mb-1">
                        <span className="font-semibold">Status:</span>{' '}
                        <span className="capitalize">{property.status?.replace(/_/g, ' ')}</span>
                      </div>
                      {property.customerName && (
                        <div className="mb-1">
                          <span className="font-semibold">Customer:</span> {property.customerName}
                        </div>
                      )}
                      {property.quality && (
                        <div className="mb-1">
                          <span className="font-semibold">Quality:</span> {property.quality}
                        </div>
                      )}
                      {property.createdBy === 'map_click' && (
                        <div className="text-xs text-blue-600 italic mt-2">
                          📍 Pin dropped on map
                        </div>
                      )}
                    </div>
                    <div className="flex gap-2 pt-2 border-t border-gray-200">
                      <button
                        onClick={() => {
                          setSelectedProperty(property);
                          setShowPropertySheet(true);
                        }}
                        className="flex-1 px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white text-xs font-semibold rounded transition-colors flex items-center justify-center gap-1"
                      >
                        <Edit2 className="w-3 h-3" />
                        View/Edit
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          if (window.confirm(`Delete property at ${property.address}?`)) {
                            deleteProperty(property.id);
                          }
                        }}
                        className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white text-xs font-semibold rounded transition-colors flex items-center justify-center gap-1"
                        title="Delete Property"
                      >
                        <Trash2 className="w-3 h-3" />
                        Delete
                      </button>
                    </div>
                  </div>
                </Popup>
              </Marker>
            ))}
          </MapContainer>
        )}

        {/* Floating Action Button */}
        {location && (
          <button
            onClick={handleCenterOnUser}
            className="absolute bottom-6 right-6 p-4 bg-white rounded-full shadow-2xl hover:shadow-3xl transition-all hover:scale-110 active:scale-95 border-2 border-green-500 z-[1000]"
            title="Center on my location"
          >
            <Navigation className="w-6 h-6 text-green-600" />
          </button>
        )}

        {/* Legend - Minimizable */}
        <div className={`absolute top-4 right-4 bg-white/95 backdrop-blur-lg rounded-2xl shadow-2xl border-2 border-gray-200 max-w-xs z-[1000] transition-all ${legendMinimized ? 'w-auto' : ''}`}>
          {/* Legend Header - Always Visible */}
          <div
            className="flex items-center justify-between p-4 cursor-pointer hover:bg-gray-50 rounded-t-2xl transition-colors"
            onClick={() => setLegendMinimized(!legendMinimized)}
          >
            <h3 className="text-base font-black text-gray-900 flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-green-600 animate-pulse"></div>
              {legendMinimized ? 'Legend' : 'Property Status Legend'}
            </h3>
            <button
              className="p-1 hover:bg-gray-200 rounded-lg transition-colors"
              title={legendMinimized ? 'Expand Legend' : 'Minimize Legend'}
            >
              {legendMinimized ? (
                <ChevronDown className="w-5 h-5 text-gray-600" />
              ) : (
                <ChevronUp className="w-5 h-5 text-gray-600" />
              )}
            </button>
          </div>

          {/* Legend Content - Collapsible */}
          {!legendMinimized && (
            <div className="px-4 pb-4">
              <div className="space-y-2 text-sm">
                <LegendItem color="#F97316" label="Needs Inspection" />
                <LegendItem color="#9CA3AF" label="Knock Not Home" />
                <LegendItem color="#EAB308" label="Follow-up Needed" />
                <LegendItem color="#A855F7" label="Door Hanger" />
                <hr className="my-3 border-gray-300" />
                <LegendItem color="#10B981" label="Interested" bold />
                <LegendItem color="#3B82F6" label="Appointment" bold />
                <LegendItem color="#8B5CF6" label="Sold" bold />
                <LegendItem color="#EF4444" label="Not Interested" bold />
              </div>
              <div className="mt-4 pt-4 border-t-2 border-gray-200">
                <p className="text-xs text-gray-600 bg-green-50 p-3 rounded-lg border border-green-200 font-medium">
                  💡 <strong>Tip:</strong> Click anywhere on map to add property. Click marker popup's delete button to remove.
                </p>
              </div>
            </div>
          )}
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
            console.log('[Canvassing] Edit property:', property);
          }}
          onDelete={(property) => {
            if (window.confirm('Delete this property from canvassing list?')) {
              deleteProperty(property.id);
              setShowPropertySheet(false);
              setSelectedProperty(null);
            }
          }}
        />
      )}

      {/* Day Summary Modal */}
      {showDaySummary && <DaySummary onClose={() => setShowDaySummary(false)} />}
    </div>
  );
};

/**
 * Stat Card Component
 */
const StatCard = ({ label, value, color }) => {
  const colorClasses = {
    gray: 'from-gray-50 to-gray-100 border-gray-200 text-gray-800',
    orange: 'from-orange-50 to-orange-100 border-orange-200 text-orange-800',
    green: 'from-green-50 to-green-100 border-green-200 text-green-800',
    yellow: 'from-yellow-50 to-yellow-100 border-yellow-200 text-yellow-800',
    blue: 'from-blue-50 to-blue-100 border-blue-200 text-blue-800',
    purple: 'from-purple-50 to-purple-100 border-purple-200 text-purple-800',
  };

  return (
    <div className={`bg-gradient-to-br ${colorClasses[color]} border-2 px-4 py-3 rounded-xl text-center hover:shadow-lg transition-all`}>
      <p className={`text-xs font-bold uppercase tracking-wide mb-1`}>{label}</p>
      <p className="text-2xl font-black">{value}</p>
    </div>
  );
};

/**
 * Legend Item Component
 */
const LegendItem = ({ color, label, bold = false }) => (
  <div className="flex items-center p-2 rounded-lg hover:bg-gray-50 transition-colors">
    <div className="w-4 h-4 rounded-full mr-3 shadow-sm" style={{ backgroundColor: color }}></div>
    <span className={`${bold ? 'font-bold' : 'font-medium'} text-gray-700`}>{label}</span>
  </div>
);

export default CanvassingViewLeaflet;
