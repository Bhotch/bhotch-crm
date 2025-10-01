/**
 * Geospatial Utilities using Turf.js
 * Provides advanced mapping calculations for canvassing operations
 */

import * as turf from '@turf/turf';

/**
 * Calculate the area of a territory polygon in square miles
 */
export const calculateTerritoryArea = (coordinates) => {
  try {
    const polygon = turf.polygon([coordinates]);
    const area = turf.area(polygon);
    const sqMiles = area * 0.000000386102; // Convert sq meters to sq miles
    return sqMiles.toFixed(2);
  } catch (error) {
    console.error('Error calculating territory area:', error);
    return 0;
  }
};

/**
 * Check if a point is inside a territory polygon
 */
export const isPointInTerritory = (point, territoryCoordinates) => {
  try {
    const pt = turf.point([point.lng, point.lat]);
    const poly = turf.polygon([territoryCoordinates]);
    return turf.booleanPointInPolygon(pt, poly);
  } catch (error) {
    console.error('Error checking point in territory:', error);
    return false;
  }
};

/**
 * Calculate distance between two points in miles
 */
export const calculateDistance = (point1, point2) => {
  try {
    const from = turf.point([point1.lng, point1.lat]);
    const to = turf.point([point2.lng, point2.lat]);
    const options = { units: 'miles' };
    return turf.distance(from, to, options).toFixed(2);
  } catch (error) {
    console.error('Error calculating distance:', error);
    return 0;
  }
};

/**
 * Find the center point of a territory
 */
export const getTerritoryCenter = (coordinates) => {
  try {
    const polygon = turf.polygon([coordinates]);
    const center = turf.centroid(polygon);
    return {
      lat: center.geometry.coordinates[1],
      lng: center.geometry.coordinates[0],
    };
  } catch (error) {
    console.error('Error getting territory center:', error);
    return null;
  }
};

/**
 * Check if two territories overlap
 */
export const doTerritoriesOverlap = (territory1Coords, territory2Coords) => {
  try {
    const poly1 = turf.polygon([territory1Coords]);
    const poly2 = turf.polygon([territory2Coords]);
    const intersection = turf.intersect(turf.featureCollection([poly1, poly2]));
    return intersection !== null;
  } catch (error) {
    console.error('Error checking territory overlap:', error);
    return false;
  }
};

/**
 * Get bounding box for a set of coordinates
 */
export const getBoundingBox = (coordinates) => {
  try {
    const points = coordinates.map(coord => turf.point([coord.lng || coord[0], coord.lat || coord[1]]));
    const features = turf.featureCollection(points);
    const bbox = turf.bbox(features);
    return {
      southwest: { lat: bbox[1], lng: bbox[0] },
      northeast: { lat: bbox[3], lng: bbox[2] },
    };
  } catch (error) {
    console.error('Error getting bounding box:', error);
    return null;
  }
};

/**
 * Optimize route using nearest neighbor algorithm
 * Returns ordered array of points for most efficient route
 */
export const optimizeRoute = (startPoint, waypoints) => {
  try {
    if (!waypoints || waypoints.length === 0) return [];

    const ordered = [];
    let currentPoint = startPoint;
    let remaining = [...waypoints];

    while (remaining.length > 0) {
      let nearestIndex = 0;
      let minDistance = Infinity;
      const current = currentPoint; // Fix: capture current point to avoid loop closure issue

      remaining.forEach((point, index) => {
        const dist = calculateDistance(current, point);
        if (parseFloat(dist) < minDistance) {
          minDistance = parseFloat(dist);
          nearestIndex = index;
        }
      });

      const nearest = remaining[nearestIndex];
      ordered.push(nearest);
      currentPoint = nearest;
      remaining.splice(nearestIndex, 1);
    }

    return ordered;
  } catch (error) {
    console.error('Error optimizing route:', error);
    return waypoints;
  }
};

/**
 * Calculate total distance of a route
 */
export const calculateRouteDistance = (points) => {
  try {
    if (!points || points.length < 2) return 0;

    let totalDistance = 0;
    for (let i = 0; i < points.length - 1; i++) {
      totalDistance += parseFloat(calculateDistance(points[i], points[i + 1]));
    }

    return totalDistance.toFixed(2);
  } catch (error) {
    console.error('Error calculating route distance:', error);
    return 0;
  }
};

/**
 * Create a buffer around a point (useful for proximity alerts)
 */
export const createBuffer = (point, radiusMiles) => {
  try {
    const pt = turf.point([point.lng, point.lat]);
    const buffered = turf.buffer(pt, radiusMiles, { units: 'miles' });
    return buffered.geometry.coordinates[0].map(coord => ({
      lat: coord[1],
      lng: coord[0],
    }));
  } catch (error) {
    console.error('Error creating buffer:', error);
    return [];
  }
};

/**
 * Find properties within radius of a point
 */
export const findPropertiesInRadius = (centerPoint, properties, radiusMiles) => {
  try {
    return properties.filter(property => {
      const distance = calculateDistance(centerPoint, {
        lat: property.latitude,
        lng: property.longitude,
      });
      return parseFloat(distance) <= radiusMiles;
    });
  } catch (error) {
    console.error('Error finding properties in radius:', error);
    return [];
  }
};

/**
 * Snap a point to the nearest road (simplified version)
 * In production, you'd use Google Maps Roads API
 */
export const snapToRoad = (point) => {
  // This is a placeholder - in production you'd call Google Maps Roads API
  return point;
};

/**
 * Calculate bearing between two points
 */
export const calculateBearing = (start, end) => {
  try {
    const from = turf.point([start.lng, start.lat]);
    const to = turf.point([end.lng, end.lat]);
    return turf.bearing(from, to);
  } catch (error) {
    console.error('Error calculating bearing:', error);
    return 0;
  }
};

/**
 * Cluster nearby properties for better map visualization
 */
export const clusterProperties = (properties, radiusMiles = 0.1) => {
  try {
    const clusters = [];
    const processed = new Set();

    properties.forEach((property, index) => {
      if (processed.has(index)) return;

      const cluster = {
        center: { lat: property.latitude, lng: property.longitude },
        properties: [property],
      };

      // Find nearby properties
      properties.forEach((otherProperty, otherIndex) => {
        if (otherIndex === index || processed.has(otherIndex)) return;

        const distance = calculateDistance(
          { lat: property.latitude, lng: property.longitude },
          { lat: otherProperty.latitude, lng: otherProperty.longitude }
        );

        if (parseFloat(distance) <= radiusMiles) {
          cluster.properties.push(otherProperty);
          processed.add(otherIndex);
        }
      });

      processed.add(index);
      clusters.push(cluster);
    });

    return clusters;
  } catch (error) {
    console.error('Error clustering properties:', error);
    return properties.map(p => ({
      center: { lat: p.latitude, lng: p.longitude },
      properties: [p],
    }));
  }
};

/**
 * Generate a grid of points within a territory (for systematic canvassing)
 */
export const generateGridInTerritory = (territoryCoords, spacing = 0.1) => {
  try {
    const polygon = turf.polygon([territoryCoords]);
    const bbox = turf.bbox(polygon);
    const grid = [];

    const cellWidth = spacing / 69; // Approximate miles to degrees
    const cellHeight = spacing / 69;

    for (let lng = bbox[0]; lng <= bbox[2]; lng += cellWidth) {
      for (let lat = bbox[1]; lat <= bbox[3]; lat += cellHeight) {
        const point = { lat, lng };
        if (isPointInTerritory(point, territoryCoords)) {
          grid.push(point);
        }
      }
    }

    return grid;
  } catch (error) {
    console.error('Error generating grid:', error);
    return [];
  }
};

/**
 * Convert Google Maps polygon to GeoJSON
 */
export const polygonToGeoJSON = (coordinates) => {
  try {
    return turf.polygon([coordinates]);
  } catch (error) {
    console.error('Error converting to GeoJSON:', error);
    return null;
  }
};

/**
 * Simplify territory polygon (reduce number of points)
 */
export const simplifyPolygon = (coordinates, tolerance = 0.0001) => {
  try {
    const polygon = turf.polygon([coordinates]);
    const simplified = turf.simplify(polygon, { tolerance, highQuality: true });
    return simplified.geometry.coordinates[0];
  } catch (error) {
    console.error('Error simplifying polygon:', error);
    return coordinates;
  }
};
