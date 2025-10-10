import { useState, useEffect, useCallback, useRef } from 'react';
import { useCanvassingStore } from '../store/canvassingStore';

/**
 * Custom hook for real-time geolocation tracking
 * Optimized for mobile devices with battery-saving features
 * PERFORMANCE OPTIMIZED: Uses native watchPosition instead of setInterval
 */
export const useGeoLocation = (options = {}) => {
  const {
    enableHighAccuracy = true,
    timeout = 10000,
    maximumAge = 30000, // 30 seconds cache
    distanceFilter = 10, // Minimum distance in meters before update
  } = options;

  const [location, setLocation] = useState(null);
  const [error, setError] = useState(null);
  const [isTracking, setIsTracking] = useState(false);
  const watchIdRef = useRef(null);
  const lastPositionRef = useRef(null);

  const { setCurrentLocation, trackingEnabled } = useCanvassingStore();

  /**
   * Calculate distance between two positions in meters
   */
  const calculateDistanceMeters = (pos1, pos2) => {
    const R = 6371000; // Earth's radius in meters
    const dLat = (pos2.latitude - pos1.latitude) * Math.PI / 180;
    const dLon = (pos2.longitude - pos1.longitude) * Math.PI / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(pos1.latitude * Math.PI / 180) *
      Math.cos(pos2.latitude * Math.PI / 180) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  /**
   * Handle successful position update
   * OPTIMIZED: Throttled to prevent excessive re-renders
   */
  const handleSuccess = useCallback((position) => {
    const newLocation = {
      lat: position.coords.latitude,
      lng: position.coords.longitude,
      accuracy: position.coords.accuracy,
      altitude: position.coords.altitude,
      altitudeAccuracy: position.coords.altitudeAccuracy,
      heading: position.coords.heading,
      speed: position.coords.speed,
      timestamp: position.timestamp,
    };

    // Only update if moved significantly (battery optimization)
    if (lastPositionRef.current) {
      const distance = calculateDistanceMeters(
        {
          latitude: lastPositionRef.current.lat,
          longitude: lastPositionRef.current.lng,
        },
        {
          latitude: newLocation.lat,
          longitude: newLocation.lng,
        }
      );

      if (distance < distanceFilter) {
        return; // Don't update if movement is negligible
      }
    }

    // Use requestAnimationFrame to batch updates and prevent performance warnings
    requestAnimationFrame(() => {
      lastPositionRef.current = newLocation;
      setLocation(newLocation);
      setCurrentLocation(newLocation);
      setError(null);
    });
  }, [distanceFilter, setCurrentLocation]);

  /**
   * Handle geolocation error
   */
  const handleError = useCallback((error) => {
    const errorMessages = {
      1: 'Permission denied. Please enable location access.',
      2: 'Position unavailable. Check your GPS settings.',
      3: 'Request timeout. Please try again.',
    };

    setError({
      code: error.code,
      message: errorMessages[error.code] || 'Unknown error occurred',
    });
    setIsTracking(false);
  }, []);

  /**
   * Start tracking location
   */
  const startTracking = useCallback(() => {
    if (!navigator.geolocation) {
      setError({
        code: 0,
        message: 'Geolocation is not supported by your browser',
      });
      return;
    }

    setIsTracking(true);

    // Get initial position immediately
    navigator.geolocation.getCurrentPosition(handleSuccess, handleError, {
      enableHighAccuracy,
      timeout,
      maximumAge,
    });

    // Set up continuous tracking
    watchIdRef.current = navigator.geolocation.watchPosition(
      handleSuccess,
      handleError,
      {
        enableHighAccuracy,
        timeout,
        maximumAge,
      }
    );
  }, [enableHighAccuracy, timeout, maximumAge, handleSuccess, handleError]);

  /**
   * Stop tracking location
   */
  const stopTracking = useCallback(() => {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
    setIsTracking(false);
  }, []);

  /**
   * Get single location update (one-time)
   */
  const getCurrentLocation = useCallback(() => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Geolocation not supported'));
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          const loc = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
            accuracy: position.coords.accuracy,
            timestamp: position.timestamp,
          };
          setLocation(loc);
          resolve(loc);
        },
        (error) => {
          handleError(error);
          reject(error);
        },
        {
          enableHighAccuracy,
          timeout,
          maximumAge,
        }
      );
    });
  }, [enableHighAccuracy, timeout, maximumAge, handleError]);

  /**
   * Auto-start/stop tracking based on store state
   */
  useEffect(() => {
    if (trackingEnabled && !isTracking) {
      startTracking();
    } else if (!trackingEnabled && isTracking) {
      stopTracking();
    }
  }, [trackingEnabled, isTracking, startTracking, stopTracking]);

  /**
   * Cleanup on unmount
   */
  useEffect(() => {
    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
    };
  }, []);

  return {
    location,
    error,
    isTracking,
    startTracking,
    stopTracking,
    getCurrentLocation,
    isSupported: !!navigator.geolocation,
  };
};

/**
 * Hook for checking if user is within a territory (geofencing)
 */
export const useGeofence = (territory, onEnter, onExit) => {
  const { currentLocation } = useCanvassingStore();
  const [isInside, setIsInside] = useState(false);
  const wasInsideRef = useRef(false);
  const onEnterRef = useRef(onEnter);
  const onExitRef = useRef(onExit);

  // Keep callback refs up to date without adding to dependencies
  useEffect(() => {
    onEnterRef.current = onEnter;
    onExitRef.current = onExit;
  });

  useEffect(() => {
    if (!currentLocation || !territory?.coordinates) return;

    // Import geoUtils to check if point is in territory
    import('../utils/geoUtils')
      .then(({ isPointInTerritory }) => {
        const inside = isPointInTerritory(currentLocation, territory.coordinates);

        setIsInside(inside);

        // Trigger callbacks on state change
        if (inside && !wasInsideRef.current) {
          onEnterRef.current?.();
        } else if (!inside && wasInsideRef.current) {
          onExitRef.current?.();
        }

        wasInsideRef.current = inside;
      })
      .catch(error => {
        console.error('Failed to load geoUtils:', error);
      });
  }, [currentLocation, territory]);

  return isInside;
};

/**
 * Hook for distance tracking - Fixed to prevent infinite loop
 */
export const useDistanceTracking = () => {
  const [totalDistance, setTotalDistance] = useState(0);
  const { currentLocation } = useCanvassingStore();
  const lastPositionRef = useRef(null);

  useEffect(() => {
    if (!currentLocation) return;

    if (lastPositionRef.current) {
      import('../utils/geoUtils')
        .then(({ calculateDistance }) => {
          const distance = parseFloat(calculateDistance(lastPositionRef.current, currentLocation));
          if (!isNaN(distance) && distance > 0) {
            setTotalDistance(prev => prev + distance);
          }
        })
        .catch(error => {
          console.error('Failed to calculate distance:', error);
        });
    }

    // Update last position using ref to avoid dependency loop
    lastPositionRef.current = currentLocation;
  }, [currentLocation]); // Remove lastPosition from dependencies

  const resetDistance = useCallback(() => {
    setTotalDistance(0);
    lastPositionRef.current = null;
  }, []);

  return {
    totalDistance: totalDistance.toFixed(2),
    resetDistance,
  };
};
