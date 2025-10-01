/**
 * Automatic Product Placement Service
 * AI-powered automatic placement of shingles, lighting, and other products
 * Phase 2 Feature
 */

import { surfaceDetector } from './AISurfaceDetection';

export class AutoPlacementService {
  constructor() {
    this.placementRules = {
      shingles: {
        minCoverage: 0.95, // 95% coverage
        overlapFactor: 1.1, // 10% overlap for waste
        alignment: 'horizontal'
      },
      lighting: {
        spacing: 12, // inches between fixtures
        offset: 6, // inches from edge
        pattern: 'uniform'
      },
      ridgeVent: {
        placement: 'peak',
        coverage: 0.9 // 90% of ridge length
      },
      gutters: {
        placement: 'eave',
        coverage: 1.0 // 100% coverage
      }
    };
  }

  /**
   * Automatically place products on detected surfaces
   * @param {string} imageUrl - The panorama image
   * @param {Object} options - Placement options
   * @returns {Promise<Object>} Placement results
   */
  async autoPlaceAll(imageUrl, options = {}) {
    // Detect surfaces first
    const detection = await surfaceDetector.analyzePanorama(imageUrl);

    const placements = {
      shingles: [],
      lighting: [],
      ridgeVent: [],
      gutters: [],
      flashings: []
    };

    // Place shingles on roof surfaces
    detection.surfaces
      .filter(s => s.type === 'roof')
      .forEach(surface => {
        placements.shingles.push(
          ...this.placeShingles(surface, options.shingleColor || 'weathered-wood')
        );

        // Auto-add ridge vent to roof peaks
        const ridgeVent = this.placeRidgeVent(surface);
        if (ridgeVent) placements.ridgeVent.push(ridgeVent);
      });

    // Place lighting on eaves
    detection.surfaces
      .filter(s => s.type === 'eave')
      .forEach(surface => {
        placements.lighting.push(
          ...this.placeLighting(surface, options.lightingPattern || 'uniform')
        );
      });

    // Place gutters on eaves
    detection.surfaces
      .filter(s => s.type === 'eave')
      .forEach(surface => {
        placements.gutters.push(this.placeGutters(surface));
      });

    return {
      placements,
      surfaces: detection.surfaces,
      confidence: detection.confidence,
      summary: this.generateSummary(placements)
    };
  }

  /**
   * Place shingles on a roof surface
   */
  placeShingles(surface, color) {
    const placements = [];
    const bounds = surface.bounds;

    // Calculate coverage area
    const surfaceArea = surface.area;

    // Create main roof region
    const mainRegion = {
      id: `shingle-auto-${surface.id}`,
      surfaceId: surface.id,
      color,
      position: this.boundsToSpherical(bounds),
      bounds,
      coverage: surfaceArea,
      autoPlaced: true,
      confidence: surface.confidence,
      type: 'shingle-region',
      // Texture mapping coordinates for 360° sphere
      uvMapping: this.calculateUVMapping(bounds),
      // Material properties
      material: {
        roughness: 0.85,
        metalness: 0.1,
        normalScale: 1.5
      }
    };

    placements.push(mainRegion);

    // Add detail regions for corners and edges
    const edgePlacements = this.generateEdgeShingles(surface, color);
    placements.push(...edgePlacements);

    return placements;
  }

  /**
   * Generate edge shingle details
   */
  generateEdgeShingles(surface, color) {
    const edges = [];
    const bounds = surface.bounds;

    // Top edge (ridge)
    edges.push({
      id: `edge-top-${surface.id}`,
      surfaceId: surface.id,
      color,
      position: this.boundsToSpherical({
        x: bounds.x,
        y: bounds.y,
        width: bounds.width,
        height: 10
      }),
      type: 'ridge-shingle',
      autoPlaced: true
    });

    // Left edge (rake)
    edges.push({
      id: `edge-left-${surface.id}`,
      surfaceId: surface.id,
      color,
      position: this.boundsToSpherical({
        x: bounds.x,
        y: bounds.y,
        width: 10,
        height: bounds.height
      }),
      type: 'rake-shingle',
      autoPlaced: true
    });

    // Right edge (rake)
    edges.push({
      id: `edge-right-${surface.id}`,
      surfaceId: surface.id,
      color,
      position: this.boundsToSpherical({
        x: bounds.x + bounds.width - 10,
        y: bounds.y,
        width: 10,
        height: bounds.height
      }),
      type: 'rake-shingle',
      autoPlaced: true
    });

    return edges;
  }

  /**
   * Place lighting fixtures along eaves
   */
  placeLighting(surface, pattern) {
    const placements = [];
    const bounds = surface.bounds;
    const spacing = this.placementRules.lighting.spacing;

    // Calculate number of fixtures based on length
    const lengthInches = bounds.width * 0.5; // Approximate conversion
    const numFixtures = Math.floor(lengthInches / spacing);

    for (let i = 0; i < numFixtures; i++) {
      const xPos = bounds.x + (bounds.width / numFixtures) * i;
      const yPos = bounds.y + this.placementRules.lighting.offset;

      const sphericalPos = this.pixelToSpherical(xPos, yPos);

      placements.push({
        id: `light-auto-${surface.id}-${i}`,
        surfaceId: surface.id,
        position: this.sphericalToCartesian(sphericalPos.theta, sphericalPos.phi, 480),
        spherical: sphericalPos,
        type: 'rime-light',
        autoPlaced: true,
        index: i,
        // Light properties
        color: '#fff8dc',
        intensity: 2.5,
        range: 18,
        beamWidth: 2.5,
        beamLength: 12,
        pattern
      });
    }

    return placements;
  }

  /**
   * Place ridge vent on roof peak
   */
  placeRidgeVent(surface) {
    const bounds = surface.bounds;

    // Find the highest point (lowest Y value in image coords)
    const ridgeBounds = {
      x: bounds.x + bounds.width * 0.1,
      y: bounds.y,
      width: bounds.width * 0.8,
      height: 15
    };

    return {
      id: `ridge-vent-auto-${surface.id}`,
      surfaceId: surface.id,
      position: this.boundsToSpherical(ridgeBounds),
      bounds: ridgeBounds,
      type: 'ridge-vent',
      autoPlaced: true,
      coverage: ridgeBounds.width,
      product: 'malarkey-ridge-vent'
    };
  }

  /**
   * Place gutters along eave
   */
  placeGutters(surface) {
    const bounds = surface.bounds;

    return {
      id: `gutter-auto-${surface.id}`,
      surfaceId: surface.id,
      position: this.boundsToSpherical(bounds),
      bounds,
      type: 'gutter',
      autoPlaced: true,
      coverage: bounds.width,
      color: 'white',
      style: 'k-style'
    };
  }

  /**
   * Convert bounds to spherical coordinates
   */
  boundsToSpherical(bounds) {
    const centerX = bounds.x + bounds.width / 2;
    const centerY = bounds.y + bounds.height / 2;

    return this.pixelToSpherical(centerX, centerY);
  }

  /**
   * Convert pixel coordinates to spherical
   */
  pixelToSpherical(x, y, imageWidth = 2048, imageHeight = 1024) {
    const theta = (x / imageWidth) * Math.PI * 2 - Math.PI;
    const phi = (y / imageHeight) * Math.PI;

    return { theta, phi };
  }

  /**
   * Convert spherical to Cartesian coordinates for Three.js
   */
  sphericalToCartesian(theta, phi, radius = 500) {
    return [
      radius * Math.sin(phi) * Math.cos(theta),
      radius * Math.cos(phi),
      radius * Math.sin(phi) * Math.sin(theta)
    ];
  }

  /**
   * Calculate UV mapping for texture application
   */
  calculateUVMapping(bounds, imageWidth = 2048, imageHeight = 1024) {
    return {
      u: bounds.x / imageWidth,
      v: bounds.y / imageHeight,
      uWidth: bounds.width / imageWidth,
      vHeight: bounds.height / imageHeight
    };
  }

  /**
   * Generate summary of placements
   */
  generateSummary(placements) {
    return {
      shingles: {
        count: placements.shingles.length,
        totalArea: placements.shingles.reduce((sum, p) => sum + (p.coverage || 0), 0)
      },
      lighting: {
        count: placements.lighting.length,
        totalLength: placements.lighting.length * 12 // spacing
      },
      ridgeVent: {
        count: placements.ridgeVent.length,
        totalLength: placements.ridgeVent.reduce((sum, p) => sum + (p.coverage || 0), 0)
      },
      gutters: {
        count: placements.gutters.length,
        totalLength: placements.gutters.reduce((sum, p) => sum + (p.coverage || 0), 0)
      }
    };
  }

  /**
   * Optimize placements (reduce overlaps, adjust spacing)
   */
  optimizePlacements(placements) {
    // Remove overlapping regions
    const optimized = { ...placements };

    // Optimize shingle regions
    optimized.shingles = this.mergeOverlappingRegions(placements.shingles);

    // Optimize lighting spacing
    optimized.lighting = this.optimizeLightingSpacing(placements.lighting);

    return optimized;
  }

  /**
   * Merge overlapping shingle regions
   */
  mergeOverlappingRegions(regions) {
    // Simple implementation - can be enhanced with proper region merging
    const merged = [];
    const used = new Set();

    regions.forEach((region, idx) => {
      if (used.has(idx)) return;

      let current = region;
      regions.forEach((other, otherIdx) => {
        if (idx === otherIdx || used.has(otherIdx)) return;

        if (this.regionsOverlap(current, other)) {
          current = this.mergeRegions(current, other);
          used.add(otherIdx);
        }
      });

      merged.push(current);
    });

    return merged;
  }

  /**
   * Check if two regions overlap
   */
  regionsOverlap(r1, r2) {
    if (!r1.bounds || !r2.bounds) return false;

    return !(
      r1.bounds.x + r1.bounds.width < r2.bounds.x ||
      r2.bounds.x + r2.bounds.width < r1.bounds.x ||
      r1.bounds.y + r1.bounds.height < r2.bounds.y ||
      r2.bounds.y + r2.bounds.height < r1.bounds.y
    );
  }

  /**
   * Merge two regions
   */
  mergeRegions(r1, r2) {
    const minX = Math.min(r1.bounds.x, r2.bounds.x);
    const minY = Math.min(r1.bounds.y, r2.bounds.y);
    const maxX = Math.max(r1.bounds.x + r1.bounds.width, r2.bounds.x + r2.bounds.width);
    const maxY = Math.max(r1.bounds.y + r1.bounds.height, r2.bounds.y + r2.bounds.height);

    return {
      ...r1,
      bounds: {
        x: minX,
        y: minY,
        width: maxX - minX,
        height: maxY - minY
      },
      coverage: (maxX - minX) * (maxY - minY)
    };
  }

  /**
   * Optimize lighting fixture spacing
   */
  optimizeLightingSpacing(lights) {
    // Ensure minimum and maximum spacing
    const minSpacing = 8; // inches
    const maxSpacing = 18; // inches

    return lights.filter((light, idx) => {
      if (idx === 0) return true;

      const prev = lights[idx - 1];
      const distance = this.calculateDistance(light.position, prev.position);

      return distance >= minSpacing && distance <= maxSpacing;
    });
  }

  /**
   * Calculate distance between two 3D points
   */
  calculateDistance(p1, p2) {
    return Math.sqrt(
      Math.pow(p1[0] - p2[0], 2) +
      Math.pow(p1[1] - p2[1], 2) +
      Math.pow(p1[2] - p2[2], 2)
    );
  }

  /**
   * Manual adjustment of auto-placed product
   */
  adjustPlacement(placementId, adjustments) {
    return {
      ...adjustments,
      autoPlaced: false, // Mark as manually adjusted
      originalAutoPlacement: placementId
    };
  }
}

// Singleton instance
export const autoPlacement = new AutoPlacementService();
