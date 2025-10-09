import React, { useState, useEffect, useCallback } from 'react';
import {
  Map,
  Route,
  BarChart3,
  Plus,
  Filter,
  Play,
  Square,
  X,
} from 'lucide-react';
import { useCanvassingStore } from './store/canvassingStore';
import { useGeoLocation } from './hooks/useGeoLocation';
import MapCore from './components/map/MapCore';
import PropertyQuickActions from './components/property/PropertyQuickActions';
import PropertyDetailSheetEnhanced from './components/property/PropertyDetailSheetEnhanced';
import RouteBuilder from './components/route/RouteBuilder';
import KnockMetrics from './components/analytics/KnockMetrics';

/**
 * CanvassingViewRebuild - Complete rebuild of canvassing system
 * Industry-leading field sales platform inspired by SalesRabbit
 */
const CanvassingViewRebuild = ({ leads }) => {
  // State management
  const {
    properties,
    addProperty,
    updateProperty,
    deleteProperty,
    getFilteredProperties,
    propertyFilter,
    setPropertyFilter,
    mapView,
    updateMapView,
  } = useCanvassingStore();

  // UI State
  const [selectedProperty, setSelectedProperty] = useState(null);
  const [showPropertyDetail, setShowPropertyDetail] = useState(false);
  const [showQuickActions, setShowQuickActions] = useState(false);
  const [showRouteBuilder, setShowRouteBuilder] = useState(false);
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [showFilters, setShowFilters] = useState(false);

  // Geolocation
  const { location, isTracking, startTracking, stopTracking } = useGeoLocation({
    updateInterval: 30000, // 30 seconds
  });

  // Auto-start tracking
  useEffect(() => {
    startTracking();
    return () => stopTracking();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
            owner_name: lead.customerName,
            owner_phone: lead.phoneNumber,
            latitude: lead.latitude,
            longitude: lead.longitude,
            status: 'Not Contacted',
            visits: [],
          });
        }
      }
    });
  }, [leads, properties, addProperty]);

  // Handle map click - add new property
  const handleMapClick = useCallback(
    ({ lat, lng, address }) => {
      const newProperty = {
        address,
        latitude: lat,
        longitude: lng,
        status: 'Not Contacted',
        visits: [],
        created_at: new Date().toISOString(),
        visit_count: 0,
      };

      addProperty(newProperty);
      setSelectedProperty(newProperty);
      setShowQuickActions(true);
    },
    [addProperty]
  );

  // Handle property click
  const handlePropertyClick = useCallback((property) => {
    setSelectedProperty(property);
    setShowQuickActions(true);
  }, []);

  // Handle status change from quick actions
  const handleStatusChange = useCallback(
    (updatedProperty) => {
      updateProperty(updatedProperty);
      setShowQuickActions(false);
      setSelectedProperty(null);
    },
    [updateProperty]
  );

  // Handle property update from detail sheet
  const handlePropertyUpdate = useCallback(
    (updatedProperty) => {
      updateProperty(updatedProperty);
      setShowPropertyDetail(false);
      setSelectedProperty(null);
    },
    [updateProperty]
  );

  // Handle property delete
  const handlePropertyDelete = useCallback(
    (property) => {
      deleteProperty(property.id);
      setShowPropertyDetail(false);
      setShowQuickActions(false);
      setSelectedProperty(null);
    },
    [deleteProperty]
  );

  // Handle navigate to property
  const handleNavigate = useCallback((property) => {
    const destination = encodeURIComponent(property.address);
    window.open(
      `https://www.google.com/maps/dir/?api=1&destination=${destination}`,
      '_blank'
    );
  }, []);

  // Open detail sheet from quick actions
  const handleViewDetails = useCallback(() => {
    setShowQuickActions(false);
    setShowPropertyDetail(true);
  }, []);

  // Filter stats
  const filteredProperties = getFilteredProperties();
  const stats = {
    total: filteredProperties.length,
    interested: filteredProperties.filter((p) => p.status === 'Interested').length,
    appointments: filteredProperties.filter((p) => p.status === 'Appointment').length,
    sold: filteredProperties.filter((p) => p.status === 'Sold').length,
  };

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 border-b border-blue-800 px-6 py-4 shadow-lg">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="bg-white/10 p-3 rounded-lg backdrop-blur-sm">
              <Map className="w-7 h-7 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white drop-shadow-sm">
                Field Sales Canvassing
              </h1>
              <div className="flex items-center gap-4 mt-1">
                <span className="text-sm text-blue-100">
                  <span className="font-semibold">{stats.total}</span> properties
                </span>
                <span className="text-blue-200">•</span>
                <span className="text-sm text-blue-100">
                  <span className="font-semibold">{stats.interested}</span> interested
                </span>
                <span className="text-blue-200">•</span>
                <span className="text-sm text-blue-100">
                  <span className="font-semibold">{stats.sold}</span> sold
                </span>
              </div>
            </div>
          </div>

          {/* Top Bar Actions */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowAnalytics(!showAnalytics)}
              className={`flex items-center px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${
                showAnalytics
                  ? 'bg-white text-blue-700'
                  : 'bg-white/10 text-white hover:bg-white/20 border border-white/20'
              }`}
            >
              <BarChart3 className="w-4 h-4 mr-2" />
              Analytics
            </button>

            <button
              onClick={() => setShowRouteBuilder(!showRouteBuilder)}
              className={`flex items-center px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${
                showRouteBuilder
                  ? 'bg-white text-blue-700'
                  : 'bg-white/10 text-white hover:bg-white/20 border border-white/20'
              }`}
            >
              <Route className="w-4 h-4 mr-2" />
              Route
            </button>

            <button
              onClick={() => {
                if (isTracking) {
                  stopTracking();
                } else {
                  startTracking();
                }
              }}
              className={`flex items-center px-4 py-2.5 rounded-lg text-sm font-semibold transition-all ${
                isTracking
                  ? 'bg-green-500 text-white hover:bg-green-600 animate-pulse'
                  : 'bg-white/10 text-white hover:bg-white/20 border border-white/20'
              }`}
            >
              {isTracking ? (
                <>
                  <Square className="w-4 h-4 mr-2" />
                  Tracking
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 mr-2" />
                  Start
                </>
              )}
            </button>

            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`p-2.5 rounded-lg transition-all ${
                showFilters
                  ? 'bg-white text-blue-700'
                  : 'bg-white/10 text-white hover:bg-white/20 border border-white/20'
              }`}
            >
              <Filter className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Filters Panel */}
      {showFilters && (
        <div className="bg-white border-b border-gray-200 px-6 py-4 shadow-sm">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-700 uppercase mb-2">
                Status
              </label>
              <select
                value={propertyFilter.status}
                onChange={(e) => setPropertyFilter({ status: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
              >
                <option value="all">All Statuses</option>
                <option value="Not Contacted">Not Contacted</option>
                <option value="Interested">Interested</option>
                <option value="Not Interested">Not Interested</option>
                <option value="Appointment">Appointment</option>
                <option value="Sold">Sold</option>
                <option value="Not Home">Not Home</option>
                <option value="Callback">Callback</option>
                <option value="DNC">Do Not Contact</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 uppercase mb-2">
                Quality
              </label>
              <select
                value={propertyFilter.quality}
                onChange={(e) => setPropertyFilter({ quality: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
              >
                <option value="all">All Qualities</option>
                <option value="hot">Hot</option>
                <option value="warm">Warm</option>
                <option value="cold">Cold</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 uppercase mb-2">
                Date Range
              </label>
              <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm">
                <option>Today</option>
                <option>This Week</option>
                <option>This Month</option>
                <option>All Time</option>
              </select>
            </div>

            <div className="flex items-end">
              <button
                onClick={() => setPropertyFilter({ status: 'all', quality: 'all' })}
                className="w-full px-4 py-2 bg-gray-100 hover:bg-gray-200 border border-gray-300 rounded-lg font-medium text-sm text-gray-700 transition-colors"
              >
                Reset Filters
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 flex overflow-hidden">
        {/* Map Container */}
        <div className="flex-1 relative">
          <MapCore
            properties={filteredProperties}
            onPropertyClick={handlePropertyClick}
            onMapClick={handleMapClick}
            userLocation={location}
            mapType={mapView.mapType}
            onMapTypeChange={(type) => updateMapView({ mapType: type })}
            showTraffic={mapView.showTraffic}
            onMapReady={() => {}}
          />

          {/* Floating Quick Actions Panel */}
          {showQuickActions && selectedProperty && !showPropertyDetail && (
            <div className="absolute top-4 left-4 z-10 w-80">
              <PropertyQuickActions
                property={selectedProperty}
                onStatusChange={handleStatusChange}
                onViewDetails={handleViewDetails}
              />
            </div>
          )}
        </div>

        {/* Side Panel - Route Builder */}
        {showRouteBuilder && (
          <div className="w-96 border-l border-gray-200 bg-white overflow-y-auto">
            <RouteBuilder
              properties={filteredProperties}
              userLocation={location}
              onNavigate={handleNavigate}
              onClose={() => setShowRouteBuilder(false)}
            />
          </div>
        )}

        {/* Side Panel - Analytics */}
        {showAnalytics && (
          <div className="w-96 border-l border-gray-200 bg-gray-50 overflow-y-auto p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900">Analytics</h2>
              <button
                onClick={() => setShowAnalytics(false)}
                className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-gray-600" />
              </button>
            </div>
            <KnockMetrics
              properties={filteredProperties}
              visits={properties.flatMap((p) => p.visits || [])}
              timeFrame="today"
            />
          </div>
        )}
      </div>

      {/* Property Detail Sheet Modal */}
      {showPropertyDetail && selectedProperty && (
        <PropertyDetailSheetEnhanced
          property={selectedProperty}
          onClose={() => {
            setShowPropertyDetail(false);
            setSelectedProperty(null);
          }}
          onUpdate={handlePropertyUpdate}
          onDelete={handlePropertyDelete}
          onNavigate={handleNavigate}
          onAddVisit={(visit) => {
            const updatedProperty = {
              ...selectedProperty,
              visits: [...(selectedProperty.visits || []), visit],
              visit_count: (selectedProperty.visit_count || 0) + 1,
            };
            updateProperty(updatedProperty);
            setSelectedProperty(updatedProperty);
          }}
        />
      )}

      {/* Floating Action Button - Add Property */}
      <button
        onClick={() => {
          const address = window.prompt('Enter property address:');
          if (address) {
            // This would normally geocode the address
            handleMapClick({
              lat: (location?.lat || 0) + Math.random() * 0.01,
              lng: (location?.lng || 0) + Math.random() * 0.01,
              address,
            });
          }
        }}
        className="fixed bottom-6 right-6 p-4 bg-blue-600 text-white rounded-full shadow-2xl hover:bg-blue-700 transition-all hover:scale-110 z-20"
        title="Add property"
      >
        <Plus className="w-6 h-6" />
      </button>
    </div>
  );
};

export default CanvassingViewRebuild;
