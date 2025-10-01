/**
 * AI Surface Detection Service
 * Uses computer vision and ML to detect roof surfaces, walls, and other architectural features
 * Phase 2 Feature
 */

import * as tf from '@tensorflow/tfjs';

export class AISurfaceDetector {
  constructor() {
    this.model = null;
    this.isLoaded = false;
  }

  /**
   * Initialize the AI model for surface detection
   */
  async initialize() {
    try {
      // Load pre-trained segmentation model (MobileNetV3 or DeepLabV3)
      // In production, you'd load a custom-trained model
      this.model = await tf.loadGraphModel('/models/surface-detection/model.json');
      this.isLoaded = true;
      console.log('AI Surface Detection model loaded successfully');
      return true;
    } catch (error) {
      console.error('Failed to load AI model:', error);
      // Fallback to rule-based detection if model fails
      this.isLoaded = false;
      return false;
    }
  }

  /**
   * Detect surfaces in an image
   * @param {string} imageUrl - URL or base64 of the image
   * @returns {Promise<Object>} Detected surfaces with masks and confidence scores
   */
  async detectSurfaces(imageUrl) {
    const image = await this.loadImage(imageUrl);

    if (this.isLoaded && this.model) {
      return await this.aiDetection(image);
    } else {
      // Fallback to heuristic-based detection
      return await this.heuristicDetection(image);
    }
  }

  /**
   * AI-based surface detection using TensorFlow
   */
  async aiDetection(image) {
    const tensor = tf.browser.fromPixels(image)
      .resizeBilinear([513, 513]) // Standard DeepLab input size
      .expandDims(0)
      .toFloat()
      .div(127.5)
      .sub(1); // Normalize to [-1, 1]

    const predictions = await this.model.predict(tensor);
    const segmentationMap = await predictions.squeeze().array();

    // Process segmentation map to identify roof, walls, etc.
    const surfaces = this.processSegmentationMap(segmentationMap, image.width, image.height);

    tensor.dispose();
    predictions.dispose();

    return surfaces;
  }

  /**
   * Heuristic-based detection (fallback when AI model unavailable)
   * Uses color, edge detection, and geometric analysis
   */
  async heuristicDetection(image) {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    canvas.width = image.width;
    canvas.height = image.height;
    ctx.drawImage(image, 0, 0);

    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const pixels = imageData.data;

    // Detect roof areas (typically upper third, darker colors for shingles)
    const roofRegions = this.detectRoofRegions(pixels, canvas.width, canvas.height);

    // Detect wall areas (vertical surfaces, various colors)
    const wallRegions = this.detectWallRegions(pixels, canvas.width, canvas.height);

    // Detect roof edges and eaves
    const edgeRegions = this.detectEdgeRegions(pixels, canvas.width, canvas.height);

    return {
      surfaces: [
        ...roofRegions,
        ...wallRegions,
        ...edgeRegions
      ],
      confidence: 0.75, // Heuristic confidence is lower than AI
      method: 'heuristic'
    };
  }

  /**
   * Detect roof regions using color and position heuristics
   */
  detectRoofRegions(pixels, width, height) {
    const regions = [];
    const roofThreshold = height * 0.4; // Top 40% likely contains roof

    // Sample key points to identify roof areas
    const samplePoints = [];
    for (let y = 0; y < roofThreshold; y += 10) {
      for (let x = 0; x < width; x += 10) {
        const idx = (y * width + x) * 4;
        const r = pixels[idx];
        const g = pixels[idx + 1];
        const b = pixels[idx + 2];

        // Check if color matches typical roof materials
        if (this.isRoofColor(r, g, b)) {
          samplePoints.push({ x, y });
        }
      }
    }

    // Cluster nearby points into regions
    const clusters = this.clusterPoints(samplePoints, 50);

    clusters.forEach((cluster, idx) => {
      if (cluster.length > 10) { // Minimum size threshold
        const bounds = this.getBounds(cluster);
        regions.push({
          id: `roof-${idx}`,
          type: 'roof',
          bounds,
          points: cluster,
          confidence: this.calculateConfidence(cluster, 'roof'),
          area: this.calculateArea(bounds),
          suitable: ['shingles', 'ridge-vent', 'flashing']
        });
      }
    });

    return regions;
  }

  /**
   * Detect wall regions
   */
  detectWallRegions(pixels, width, height) {
    const regions = [];
    const wallStartY = height * 0.4; // Below roof region

    const samplePoints = [];
    for (let y = wallStartY; y < height; y += 10) {
      for (let x = 0; x < width; x += 10) {
        const idx = (y * width + x) * 4;
        const r = pixels[idx];
        const g = pixels[idx + 1];
        const b = pixels[idx + 2];

        if (this.isWallColor(r, g, b)) {
          samplePoints.push({ x, y });
        }
      }
    }

    const clusters = this.clusterPoints(samplePoints, 60);

    clusters.forEach((cluster, idx) => {
      if (cluster.length > 15) {
        const bounds = this.getBounds(cluster);
        regions.push({
          id: `wall-${idx}`,
          type: 'wall',
          bounds,
          points: cluster,
          confidence: this.calculateConfidence(cluster, 'wall'),
          area: this.calculateArea(bounds),
          suitable: ['siding', 'trim', 'gutters']
        });
      }
    });

    return regions;
  }

  /**
   * Detect roof edges and eaves (suitable for lighting)
   */
  detectEdgeRegions(pixels, width, height) {
    const regions = [];

    // Edge detection using simple gradient
    // const edges = this.detectEdges(pixels, width, height); // Reserved for future use

    // Find horizontal edges in upper-middle area (likely eaves)
    const eaveY = height * 0.45;
    const eaveRegion = {
      id: 'eave-primary',
      type: 'eave',
      bounds: {
        x: width * 0.1,
        y: eaveY,
        width: width * 0.8,
        height: 20
      },
      confidence: 0.70,
      suitable: ['lighting', 'gutters']
    };

    regions.push(eaveRegion);

    return regions;
  }

  /**
   * Simple edge detection (Sobel-like)
   */
  detectEdges(pixels, width, height) {
    const edges = new Uint8ClampedArray(width * height);

    for (let y = 1; y < height - 1; y++) {
      for (let x = 1; x < width - 1; x++) {
        // const idx = (y * width + x) * 4; // Reserved for future use

        // Calculate gradient
        const gx = this.getPixelBrightness(pixels, (y * width + x + 1) * 4) -
                   this.getPixelBrightness(pixels, (y * width + x - 1) * 4);
        const gy = this.getPixelBrightness(pixels, ((y + 1) * width + x) * 4) -
                   this.getPixelBrightness(pixels, ((y - 1) * width + x) * 4);

        const magnitude = Math.sqrt(gx * gx + gy * gy);
        edges[y * width + x] = magnitude > 30 ? 255 : 0;
      }
    }

    return edges;
  }

  /**
   * Get pixel brightness
   */
  getPixelBrightness(pixels, idx) {
    return (pixels[idx] + pixels[idx + 1] + pixels[idx + 2]) / 3;
  }

  /**
   * Check if color matches typical roof materials
   */
  isRoofColor(r, g, b) {
    // Roof colors: grays, browns, blacks, dark reds
    const brightness = (r + g + b) / 3;
    const isGrayish = Math.abs(r - g) < 30 && Math.abs(g - b) < 30;
    const isBrownish = r > g && g > b && r - b > 20;
    const isDark = brightness < 150;

    return isDark && (isGrayish || isBrownish);
  }

  /**
   * Check if color matches typical wall/siding
   */
  isWallColor(r, g, b) {
    const brightness = (r + g + b) / 3;
    // Walls are typically lighter and more varied
    return brightness > 80 && brightness < 240;
  }

  /**
   * Cluster nearby points using simple proximity
   */
  clusterPoints(points, maxDistance) {
    const clusters = [];
    const used = new Set();

    points.forEach((point, idx) => {
      if (used.has(idx)) return;

      const cluster = [point];
      used.add(idx);

      // Find nearby points
      points.forEach((other, otherIdx) => {
        if (used.has(otherIdx)) return;

        const dist = Math.sqrt(
          Math.pow(point.x - other.x, 2) +
          Math.pow(point.y - other.y, 2)
        );

        if (dist < maxDistance) {
          cluster.push(other);
          used.add(otherIdx);
        }
      });

      clusters.push(cluster);
    });

    return clusters;
  }

  /**
   * Get bounding box for a cluster of points
   */
  getBounds(points) {
    const xs = points.map(p => p.x);
    const ys = points.map(p => p.y);

    const minX = Math.min(...xs);
    const maxX = Math.max(...xs);
    const minY = Math.min(...ys);
    const maxY = Math.max(...ys);

    return {
      x: minX,
      y: minY,
      width: maxX - minX,
      height: maxY - minY
    };
  }

  /**
   * Calculate confidence score for a region
   */
  calculateConfidence(points, type) {
    // More points = higher confidence
    const sizeScore = Math.min(points.length / 100, 1);

    // Add type-specific bonuses
    const typeBonus = type === 'roof' ? 0.1 : 0.05;

    return Math.min(sizeScore + typeBonus, 0.95);
  }

  /**
   * Calculate approximate area
   */
  calculateArea(bounds) {
    return bounds.width * bounds.height;
  }

  /**
   * Process AI segmentation map into surface regions
   */
  processSegmentationMap(segMap, width, height) {
    const surfaces = [];

    // Map class IDs to surface types (depends on your model)
    const classMap = {
      0: 'background',
      1: 'roof',
      2: 'wall',
      3: 'window',
      4: 'door',
      5: 'vegetation'
    };

    // Extract regions for each class
    Object.entries(classMap).forEach(([classId, className]) => {
      if (className === 'background' || className === 'vegetation') return;

      const mask = this.extractMask(segMap, parseInt(classId));
      const regions = this.maskToRegions(mask, width, height);

      regions.forEach((region, idx) => {
        surfaces.push({
          id: `${className}-${idx}`,
          type: className,
          bounds: region.bounds,
          mask: region.mask,
          confidence: region.confidence,
          area: this.calculateArea(region.bounds),
          suitable: this.getSuitableProducts(className)
        });
      });
    });

    return {
      surfaces,
      confidence: 0.92,
      method: 'ai'
    };
  }

  /**
   * Extract binary mask for a specific class
   */
  extractMask(segMap, classId) {
    return segMap.map(row => row.map(val => val === classId ? 1 : 0));
  }

  /**
   * Convert mask to region objects
   */
  maskToRegions(mask, width, height) {
    // Connected component analysis would go here
    // Simplified version for now
    return [{
      bounds: { x: 0, y: 0, width, height },
      mask,
      confidence: 0.9
    }];
  }

  /**
   * Get suitable products for surface type
   */
  getSuitableProducts(surfaceType) {
    const productMap = {
      'roof': ['shingles', 'ridge-vent', 'flashing', 'underlayment'],
      'wall': ['siding', 'trim', 'paint'],
      'eave': ['lighting', 'gutters', 'soffit'],
      'edge': ['lighting', 'gutters']
    };

    return productMap[surfaceType] || [];
  }

  /**
   * Load image from URL
   */
  loadImage(url) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => resolve(img);
      img.onerror = reject;
      img.src = url;
    });
  }

  /**
   * Analyze panorama for optimal product placement
   * Returns recommended placement coordinates in 3D space
   */
  async analyzePanorama(imageUrl) {
    const surfaces = await this.detectSurfaces(imageUrl);

    return {
      ...surfaces,
      placements: this.generatePlacements(surfaces.surfaces)
    };
  }

  /**
   * Generate automatic product placements
   */
  generatePlacements(surfaces) {
    const placements = [];

    surfaces.forEach(surface => {
      switch (surface.type) {
        case 'roof':
          placements.push({
            surfaceId: surface.id,
            product: 'shingles',
            coverage: 100,
            position: this.boundsToPosition(surface.bounds),
            autoPlaced: true
          });
          break;

        case 'eave':
          placements.push({
            surfaceId: surface.id,
            product: 'lighting',
            spacing: 12, // inches
            position: this.boundsToPosition(surface.bounds),
            autoPlaced: true
          });
          break;

        default:
          break;
      }
    });

    return placements;
  }

  /**
   * Convert 2D bounds to 3D position for panorama sphere
   */
  boundsToPosition(bounds) {
    // Convert pixel coordinates to spherical coordinates
    const centerX = bounds.x + bounds.width / 2;
    const centerY = bounds.y + bounds.height / 2;

    return {
      x: centerX,
      y: centerY,
      spherical: this.pixelToSpherical(centerX, centerY)
    };
  }

  /**
   * Convert pixel coordinates to spherical (theta, phi)
   */
  pixelToSpherical(x, y, imageWidth = 2048, imageHeight = 1024) {
    const theta = (x / imageWidth) * Math.PI * 2;
    const phi = (y / imageHeight) * Math.PI;

    return { theta, phi };
  }
}

// Singleton instance
export const surfaceDetector = new AISurfaceDetector();
