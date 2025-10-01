import * as THREE from 'three';

/**
 * Geometry Utilities for 3D Calculations
 */

/**
 * Calculate surface normal from three points
 */
export const calculateSurfaceNormal = (p1, p2, p3) => {
  const v1 = new THREE.Vector3().subVectors(p2, p1);
  const v2 = new THREE.Vector3().subVectors(p3, p1);
  return new THREE.Vector3().crossVectors(v1, v2).normalize();
};

/**
 * Calculate angle between two vectors
 */
export const calculateAngle = (v1, v2) => {
  return v1.angleTo(v2) * (180 / Math.PI);
};

/**
 * Project 3D point to 2D screen coordinates
 */
export const projectToScreen = (point3D, camera, width, height) => {
  const projected = point3D.clone().project(camera);

  return {
    x: ((projected.x + 1) / 2) * width,
    y: ((-projected.y + 1) / 2) * height,
  };
};

/**
 * Unproject 2D screen coordinates to 3D point
 */
export const unprojectFromScreen = (x, y, z, camera, width, height) => {
  const vector = new THREE.Vector3(
    (x / width) * 2 - 1,
    -(y / height) * 2 + 1,
    z
  );

  return vector.unproject(camera);
};

/**
 * Calculate distance between two 3D points
 */
export const calculateDistance = (p1, p2) => {
  return p1.distanceTo(p2);
};

/**
 * Calculate area of polygon from vertices
 */
export const calculatePolygonArea = (vertices) => {
  let area = 0;

  for (let i = 0; i < vertices.length; i++) {
    const j = (i + 1) % vertices.length;
    area += vertices[i].x * vertices[j].y;
    area -= vertices[j].x * vertices[i].y;
  }

  return Math.abs(area / 2);
};

/**
 * Calculate roof pitch (slope) in degrees
 */
export const calculateRoofPitch = (rise, run) => {
  const radians = Math.atan2(rise, run);
  return radians * (180 / Math.PI);
};

/**
 * Convert pitch to ratio (e.g., "4:12")
 */
export const pitchToRatio = (degrees) => {
  const radians = degrees * (Math.PI / 180);
  const rise = Math.tan(radians) * 12;
  return `${Math.round(rise)}:12`;
};

/**
 * Create UV coordinates for texture mapping
 */
export const generateUVCoordinates = (vertices, width, height) => {
  return vertices.map((vertex) => ({
    u: vertex.x / width,
    v: vertex.y / height,
  }));
};

/**
 * Calculate bounding box of points
 */
export const calculateBoundingBox = (points) => {
  if (points.length === 0) {
    return null;
  }

  const box = new THREE.Box3();
  points.forEach((point) => box.expandByPoint(point));

  return {
    min: box.min,
    max: box.max,
    center: box.getCenter(new THREE.Vector3()),
    size: box.getSize(new THREE.Vector3()),
  };
};

/**
 * Create mesh from vertices and faces
 */
export const createMeshFromVertices = (vertices, faces) => {
  const geometry = new THREE.BufferGeometry();

  const positions = new Float32Array(vertices.length * 3);
  vertices.forEach((v, i) => {
    positions[i * 3] = v.x;
    positions[i * 3 + 1] = v.y;
    positions[i * 3 + 2] = v.z;
  });

  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

  if (faces && faces.length > 0) {
    geometry.setIndex(faces.flat());
  }

  geometry.computeVertexNormals();

  return geometry;
};

/**
 * Calculate roof area from dimensions
 */
export const calculateRoofArea = (length, width, pitch) => {
  const pitchRadians = pitch * (Math.PI / 180);
  const slope = 1 / Math.cos(pitchRadians);
  return length * width * slope;
};

/**
 * Generate regular polygon vertices
 */
export const generatePolygonVertices = (sides, radius, centerX = 0, centerY = 0) => {
  const vertices = [];
  const angleStep = (Math.PI * 2) / sides;

  for (let i = 0; i < sides; i++) {
    const angle = angleStep * i;
    vertices.push(new THREE.Vector2(
      centerX + radius * Math.cos(angle),
      centerY + radius * Math.sin(angle)
    ));
  }

  return vertices;
};

/**
 * Smooth curve using Catmull-Rom spline
 */
export const createSmoothCurve = (points, segments = 50) => {
  const curve = new THREE.CatmullRomCurve3(points);
  return curve.getPoints(segments);
};

/**
 * Calculate perimeter of polygon
 */
export const calculatePerimeter = (vertices) => {
  let perimeter = 0;

  for (let i = 0; i < vertices.length; i++) {
    const next = (i + 1) % vertices.length;
    perimeter += vertices[i].distanceTo(vertices[next]);
  }

  return perimeter;
};

/**
 * Check if point is inside polygon
 */
export const isPointInPolygon = (point, polygon) => {
  let inside = false;

  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const xi = polygon[i].x;
    const yi = polygon[i].y;
    const xj = polygon[j].x;
    const yj = polygon[j].y;

    const intersect = ((yi > point.y) !== (yj > point.y)) &&
      (point.x < (xj - xi) * (point.y - yi) / (yj - yi) + xi);

    if (intersect) inside = !inside;
  }

  return inside;
};

/**
 * Raycast to find intersections
 */
export const raycastIntersection = (raycaster, objects) => {
  const intersects = raycaster.intersectObjects(objects, true);
  return intersects.length > 0 ? intersects[0] : null;
};

/**
 * Create tube geometry along path
 */
export const createTubeAlongPath = (points, radius = 0.05, segments = 64) => {
  const curve = new THREE.CatmullRomCurve3(points);
  return new THREE.TubeGeometry(curve, segments, radius, 8, false);
};
