import React, { useState, useEffect } from 'react';
import {
  Route,
  Navigation,
  Trash2,
  ArrowUp,
  ArrowDown,
  Play,
  MapPin,
  TrendingUp,
  Sparkles,
} from 'lucide-react';

/**
 * RouteBuilder - Smart route planning and optimization for canvassing
 * Inspired by SalesRabbit's route optimizer
 */
const RouteBuilder = ({ properties, userLocation, onNavigate, onClose }) => {
  const [selectedProperties, setSelectedProperties] = useState([]);
  const [routeStats, setRouteStats] = useState(null);
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [currentStopIndex, setCurrentStopIndex] = useState(0);

  // Calculate route statistics
  useEffect(() => {
    const calculateRouteStats = () => {
      let totalDistance = 0;
      let estimatedTime = 0;

      // Calculate distance between consecutive properties
      for (let i = 0; i < selectedProperties.length - 1; i++) {
        const prop1 = selectedProperties[i];
        const prop2 = selectedProperties[i + 1];

        const distance = calculateDistance(
          prop1.latitude,
          prop1.longitude,
          prop2.latitude,
          prop2.longitude
        );

        totalDistance += distance;
        // Estimate 2 minutes per km driving + 5 minutes per stop
        estimatedTime += (distance * 2) + 5;
      }

      setRouteStats({
        totalDistance: totalDistance.toFixed(2),
        estimatedTime: Math.round(estimatedTime),
        stops: selectedProperties.length,
      });
    };

    if (selectedProperties.length > 1) {
      calculateRouteStats();
    }
  }, [selectedProperties]);

  // Haversine formula for distance calculation
  const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371; // Earth's radius in km
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;

    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  // Add property to route
  const addToRoute = (property) => {
    if (!selectedProperties.find((p) => p.id === property.id)) {
      setSelectedProperties([...selectedProperties, property]);
    }
  };

  // Remove property from route
  const removeFromRoute = (propertyId) => {
    setSelectedProperties(selectedProperties.filter((p) => p.id !== propertyId));
  };

  // Move property up in route
  const moveUp = (index) => {
    if (index > 0) {
      const newProperties = [...selectedProperties];
      [newProperties[index - 1], newProperties[index]] = [
        newProperties[index],
        newProperties[index - 1],
      ];
      setSelectedProperties(newProperties);
    }
  };

  // Move property down in route
  const moveDown = (index) => {
    if (index < selectedProperties.length - 1) {
      const newProperties = [...selectedProperties];
      [newProperties[index], newProperties[index + 1]] = [
        newProperties[index + 1],
        newProperties[index],
      ];
      setSelectedProperties(newProperties);
    }
  };

  // Optimize route using nearest neighbor algorithm
  const optimizeRoute = () => {
    setIsOptimizing(true);

    setTimeout(() => {
      if (selectedProperties.length < 2) {
        setIsOptimizing(false);
        return;
      }

      const startPoint = userLocation || {
        lat: selectedProperties[0].latitude,
        lng: selectedProperties[0].longitude,
      };

      const unvisited = [...selectedProperties];
      const optimized = [];
      let currentPoint = startPoint;

      while (unvisited.length > 0) {
        let nearestIndex = 0;
        let nearestDistance = Infinity;
        const currentLat = currentPoint.lat || currentPoint.latitude;
        const currentLng = currentPoint.lng || currentPoint.longitude;

        for (let i = 0; i < unvisited.length; i++) {
          const prop = unvisited[i];
          const distance = calculateDistance(
            currentLat,
            currentLng,
            prop.latitude,
            prop.longitude
          );

          if (distance < nearestDistance) {
            nearestDistance = distance;
            nearestIndex = i;
          }
        }

        const nearest = unvisited.splice(nearestIndex, 1)[0];
        optimized.push(nearest);
        currentPoint = { lat: nearest.latitude, lng: nearest.longitude };
      }

      setSelectedProperties(optimized);
      setIsOptimizing(false);
    }, 1000);
  };

  // Start navigation
  const startNavigation = () => {
    if (selectedProperties.length > 0) {
      const firstStop = selectedProperties[0];
      if (onNavigate) {
        onNavigate(firstStop);
      }
      setCurrentStopIndex(0);
    }
  };

  // Navigate to next stop
  const nextStop = () => {
    if (currentStopIndex < selectedProperties.length - 1) {
      const nextIndex = currentStopIndex + 1;
      const nextStop = selectedProperties[nextIndex];
      if (onNavigate) {
        onNavigate(nextStop);
      }
      setCurrentStopIndex(nextIndex);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-xl border border-gray-200 flex flex-col h-full max-h-[80vh]">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 p-4 rounded-t-xl">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/20 rounded-lg">
              <Route className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Route Planner</h2>
              <p className="text-xs text-blue-100">
                {selectedProperties.length} stop{selectedProperties.length !== 1 ? 's' : ''}{' '}
                selected
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/20 rounded-lg transition-colors"
          >
            <Trash2 className="w-5 h-5 text-white" />
          </button>
        </div>
      </div>

      {/* Stats */}
      {routeStats && (
        <div className="grid grid-cols-3 gap-3 p-4 bg-gray-50 border-b border-gray-200">
          <div className="text-center">
            <p className="text-xs text-gray-600 font-medium mb-1">Distance</p>
            <p className="text-lg font-bold text-gray-900">{routeStats.totalDistance} km</p>
          </div>
          <div className="text-center">
            <p className="text-xs text-gray-600 font-medium mb-1">Est. Time</p>
            <p className="text-lg font-bold text-gray-900">{routeStats.estimatedTime} min</p>
          </div>
          <div className="text-center">
            <p className="text-xs text-gray-600 font-medium mb-1">Stops</p>
            <p className="text-lg font-bold text-gray-900">{routeStats.stops}</p>
          </div>
        </div>
      )}

      {/* Property Selector */}
      <div className="p-4 border-b border-gray-200">
        <label className="block text-sm font-semibold text-gray-900 mb-2">
          Add Properties to Route
        </label>
        <select
          onChange={(e) => {
            const property = properties.find((p) => p.id === e.target.value);
            if (property) {
              addToRoute(property);
            }
            e.target.value = '';
          }}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        >
          <option value="">Select a property...</option>
          {properties
            .filter((p) => !selectedProperties.find((sp) => sp.id === p.id))
            .map((property) => (
              <option key={property.id} value={property.id}>
                {property.address} - {property.status}
              </option>
            ))}
        </select>
      </div>

      {/* Route List */}
      <div className="flex-1 overflow-y-auto p-4">
        {selectedProperties.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <MapPin className="w-16 h-16 mx-auto mb-3 text-gray-300" />
            <p className="text-sm font-medium">No stops in route</p>
            <p className="text-xs text-gray-400 mt-1">Add properties to build your route</p>
          </div>
        ) : (
          <div className="space-y-2">
            {selectedProperties.map((property, index) => (
              <div
                key={property.id}
                className={`bg-gray-50 rounded-lg p-3 border-2 transition-all ${
                  index === currentStopIndex
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="flex items-start gap-3">
                  {/* Stop Number */}
                  <div
                    className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${
                      index === currentStopIndex
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-300 text-gray-700'
                    }`}
                  >
                    {index + 1}
                  </div>

                  {/* Property Info */}
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm text-gray-900 truncate">
                      {property.address}
                    </p>
                    <p className="text-xs text-gray-600 mt-1">
                      Status: <span className="font-medium">{property.status}</span>
                    </p>
                    {property.owner_name && (
                      <p className="text-xs text-gray-600">Owner: {property.owner_name}</p>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex flex-col gap-1">
                    <button
                      onClick={() => moveUp(index)}
                      disabled={index === 0}
                      className="p-1 hover:bg-gray-200 rounded disabled:opacity-30 disabled:cursor-not-allowed"
                      title="Move up"
                    >
                      <ArrowUp className="w-4 h-4 text-gray-600" />
                    </button>
                    <button
                      onClick={() => moveDown(index)}
                      disabled={index === selectedProperties.length - 1}
                      className="p-1 hover:bg-gray-200 rounded disabled:opacity-30 disabled:cursor-not-allowed"
                      title="Move down"
                    >
                      <ArrowDown className="w-4 h-4 text-gray-600" />
                    </button>
                    <button
                      onClick={() => removeFromRoute(property.id)}
                      className="p-1 hover:bg-red-100 rounded"
                      title="Remove"
                    >
                      <Trash2 className="w-4 h-4 text-red-600" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Actions */}
      {selectedProperties.length > 0 && (
        <div className="p-4 border-t border-gray-200 bg-gray-50 space-y-2">
          <button
            onClick={optimizeRoute}
            disabled={isOptimizing || selectedProperties.length < 2}
            className="w-full px-4 py-3 bg-purple-600 text-white rounded-lg font-medium hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isOptimizing ? (
              <>
                <TrendingUp className="w-5 h-5 animate-pulse" />
                Optimizing Route...
              </>
            ) : (
              <>
                <Sparkles className="w-5 h-5" />
                Optimize Route (AI)
              </>
            )}
          </button>

          <button
            onClick={startNavigation}
            className="w-full px-4 py-3 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-colors flex items-center justify-center gap-2"
          >
            <Play className="w-5 h-5" />
            Start Navigation
          </button>

          {currentStopIndex < selectedProperties.length - 1 && currentStopIndex > 0 && (
            <button
              onClick={nextStop}
              className="w-full px-4 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
            >
              <Navigation className="w-5 h-5" />
              Next Stop ({currentStopIndex + 2} of {selectedProperties.length})
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default RouteBuilder;
