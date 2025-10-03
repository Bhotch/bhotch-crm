import React, { useState, useEffect } from 'react';
import { Route, Navigation, Zap, Save, Play } from 'lucide-react';
import { useCanvassingStore } from '../../store/canvassingStore';
import { useGeoLocation } from '../../hooks/useGeoLocation';
import { optimizeRoute, calculateRouteDistance } from '../../utils/geoUtils';
import { PROPERTY_STATUS } from '../map/PropertyMarker';

/**
 * RouteOptimizer Component
 * AI-powered route planning and optimization
 */
const RouteOptimizer = ({ map }) => {
  const { properties, activeRoute, setActiveRoute, addRoute, currentLocation } = useCanvassingStore();
  const { location } = useGeoLocation();
  const [selectedProperties, setSelectedProperties] = useState([]);
  const [optimizedRoute, setOptimizedRoute] = useState(null);
  const [routeName, setRouteName] = useState('');
  const [isOptimizing, setIsOptimizing] = useState(false);

  // Get uncontacted properties for route planning
  const availableProperties = properties.filter(
    (p) => p.status === PROPERTY_STATUS.NOT_CONTACTED || p.status === PROPERTY_STATUS.CALLBACK
  );

  // Auto-optimize when properties selected
  useEffect(() => {
    if (selectedProperties.length > 0 && location) {
      optimizeSelectedRoute();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedProperties, location]);

  const optimizeSelectedRoute = () => {
    if (selectedProperties.length === 0) return;

    setIsOptimizing(true);

    setTimeout(() => {
      const startPoint = location || currentLocation || { lat: 40.7608, lng: -111.8910 };

      const waypoints = selectedProperties.map((p) => ({
        ...p,
        lat: p.latitude,
        lng: p.longitude,
      }));

      const optimized = optimizeRoute(startPoint, waypoints);
      const distance = calculateRouteDistance([startPoint, ...optimized]);

      setOptimizedRoute({
        properties: optimized,
        distance,
        estimatedTime: (parseFloat(distance) * 8).toFixed(0), // ~8 min per mile with stops
      });

      setIsOptimizing(false);
    }, 500);
  };

  const togglePropertySelection = (property) => {
    setSelectedProperties((prev) => {
      const exists = prev.find((p) => p.id === property.id);
      if (exists) {
        return prev.filter((p) => p.id !== property.id);
      } else {
        return [...prev, property];
      }
    });
  };

  const handleSaveRoute = () => {
    if (!optimizedRoute || !routeName.trim()) {
      alert('Please name your route and select properties');
      return;
    }

    addRoute({
      name: routeName,
      properties: optimizedRoute.properties.map((p) => p.id),
      distance: optimizedRoute.distance,
      estimatedTime: optimizedRoute.estimatedTime,
      status: 'pending',
    });

    setActiveRoute({
      name: routeName,
      properties: optimizedRoute.properties,
      distance: optimizedRoute.distance,
    });

    alert('Route saved and activated!');
  };

  const handleQuickRoute = (count) => {
    const nearest = availableProperties
      .slice()
      .sort((a, b) => {
        const startPoint = location || currentLocation || { lat: 40.7608, lng: -111.8910 };
        const distA = Math.sqrt(
          Math.pow(a.latitude - startPoint.lat, 2) + Math.pow(a.longitude - startPoint.lng, 2)
        );
        const distB = Math.sqrt(
          Math.pow(b.latitude - startPoint.lat, 2) + Math.pow(b.longitude - startPoint.lng, 2)
        );
        return distA - distB;
      })
      .slice(0, count);

    setSelectedProperties(nearest);
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-bold text-gray-900 flex items-center">
          <Route className="w-5 h-5 mr-2 text-blue-600" />
          Route Optimizer
        </h3>
        <div className="flex items-center space-x-2">
          <button
            onClick={() => handleQuickRoute(10)}
            className="px-3 py-1 text-sm bg-blue-50 text-blue-700 rounded hover:bg-blue-100"
          >
            <Zap className="w-4 h-4 inline mr-1" />
            Quick 10
          </button>
          <button
            onClick={() => handleQuickRoute(20)}
            className="px-3 py-1 text-sm bg-blue-50 text-blue-700 rounded hover:bg-blue-100"
          >
            <Zap className="w-4 h-4 inline mr-1" />
            Quick 20
          </button>
        </div>
      </div>

      {/* Route Name Input */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">Route Name</label>
        <input
          type="text"
          value={routeName}
          onChange={(e) => setRouteName(e.target.value)}
          placeholder="e.g., Morning Route - Downtown"
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* Stats */}
      {optimizedRoute && (
        <div className="bg-blue-50 p-4 rounded-lg mb-4">
          <h4 className="text-sm font-semibold text-blue-900 mb-3">Optimized Route</h4>
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{optimizedRoute.properties.length}</div>
              <div className="text-xs text-blue-800">Properties</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{optimizedRoute.distance}</div>
              <div className="text-xs text-blue-800">Miles</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{optimizedRoute.estimatedTime}</div>
              <div className="text-xs text-blue-800">Minutes</div>
            </div>
          </div>
        </div>
      )}

      {/* Property Selection */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <label className="text-sm font-medium text-gray-700">
            Select Properties ({selectedProperties.length} selected)
          </label>
          {selectedProperties.length > 0 && (
            <button
              onClick={() => setSelectedProperties([])}
              className="text-sm text-red-600 hover:text-red-700"
            >
              Clear All
            </button>
          )}
        </div>
        <div className="max-h-64 overflow-y-auto border border-gray-200 rounded-lg divide-y">
          {availableProperties.length === 0 ? (
            <div className="p-4 text-center text-gray-500 text-sm">
              No available properties for routing
            </div>
          ) : (
            availableProperties.slice(0, 50).map((property, index) => {
              const isSelected = selectedProperties.find((p) => p.id === property.id);
              const uniqueKey = `${property.id}-${index}-${property.address?.substring(0, 10) || ''}`;
              return (
                <div
                  key={uniqueKey}
                  onClick={() => togglePropertySelection(property)}
                  className={`p-3 cursor-pointer transition-colors ${
                    isSelected ? 'bg-blue-50 border-l-4 border-blue-500' : 'hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="font-medium text-sm text-gray-900">
                        {property.address?.split(',')[0] || 'Unknown Address'}
                      </div>
                      <div className="text-xs text-gray-500">{property.customerName || 'No name'}</div>
                    </div>
                    {isSelected && (
                      <div className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs font-bold">
                        {selectedProperties.findIndex((p) => p.id === property.id) + 1}
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex space-x-2">
        <button
          onClick={optimizeSelectedRoute}
          disabled={selectedProperties.length === 0 || isOptimizing}
          className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
        >
          <Navigation className="w-4 h-4 mr-2" />
          {isOptimizing ? 'Optimizing...' : 'Optimize Route'}
        </button>
        <button
          onClick={handleSaveRoute}
          disabled={!optimizedRoute || !routeName.trim()}
          className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
        >
          <Save className="w-4 h-4 mr-2" />
          Save & Start
        </button>
      </div>

      {/* Active Route Display */}
      {activeRoute && (
        <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <div className="font-semibold text-green-900">Active Route: {activeRoute.name}</div>
              <div className="text-sm text-green-700">
                {activeRoute.properties?.length || 0} stops • {activeRoute.distance} mi
              </div>
            </div>
            <Play className="w-6 h-6 text-green-600" />
          </div>
        </div>
      )}
    </div>
  );
};

export default RouteOptimizer;
