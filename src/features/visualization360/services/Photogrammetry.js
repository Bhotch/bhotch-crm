/**
 * Photogrammetry Service
 * 3D mesh reconstruction from multiple photos
 * Phase 2 Feature - Requires server-side processing
 */

export class PhotogrammetryService {
  constructor() {
    this.apiEndpoint = process.env.REACT_APP_PHOTOGRAMMETRY_API || '/api/photogrammetry';
    this.requiredPhotos = 8;
    this.processingStatus = null;
  }

  /**
   * Upload and process 8 photos for 3D reconstruction
   * @param {Array} photos - Array of photo objects with image data
   * @returns {Promise<Object>} Processing job details
   */
  async processPhotos(photos) {
    if (photos.length < this.requiredPhotos) {
      throw new Error(`Minimum ${this.requiredPhotos} photos required. Got ${photos.length}.`);
    }

    // Validate photos before upload
    const validation = await this.validatePhotos(photos);
    if (!validation.valid) {
      throw new Error(`Photo validation failed: ${validation.errors.join(', ')}`);
    }

    // Upload photos to server
    const formData = new FormData();
    photos.forEach((photo, idx) => {
      formData.append(`photo_${idx}`, photo.file);
      formData.append(`metadata_${idx}`, JSON.stringify({
        angle: photo.angle,
        timestamp: photo.timestamp,
        gps: photo.gps,
        orientation: photo.orientation
      }));
    });

    try {
      const response = await fetch(`${this.apiEndpoint}/process`, {
        method: 'POST',
        body: formData
      });

      if (!response.ok) {
        throw new Error(`Upload failed: ${response.statusText}`);
      }

      const result = await response.json();
      this.processingStatus = result.jobId;

      return {
        jobId: result.jobId,
        estimatedTime: result.estimatedTime || 300, // 5 minutes default
        status: 'processing'
      };
    } catch (error) {
      console.error('Photogrammetry processing failed:', error);
      throw error;
    }
  }

  /**
   * Validate photos meet requirements
   */
  async validatePhotos(photos) {
    const errors = [];

    // Check count
    if (photos.length !== this.requiredPhotos) {
      errors.push(`Expected ${this.requiredPhotos} photos, got ${photos.length}`);
    }

    // Check required angles are covered
    const requiredAngles = [
      'front-left', 'front-right',
      'left-side', 'right-side',
      'back-left', 'back-right',
      'overhead', 'detail'
    ];

    const providedAngles = photos.map(p => p.angle);
    const missingAngles = requiredAngles.filter(a => !providedAngles.includes(a));

    if (missingAngles.length > 0) {
      errors.push(`Missing required angles: ${missingAngles.join(', ')}`);
    }

    // Check image quality (resolution, focus, etc.)
    for (const photo of photos) {
      const qualityCheck = await this.checkImageQuality(photo);
      if (!qualityCheck.passed) {
        errors.push(`Photo ${photo.angle}: ${qualityCheck.issue}`);
      }
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  /**
   * Check individual image quality
   */
  async checkImageQuality(photo) {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        const checks = {
          passed: true,
          issue: null
        };

        // Check minimum resolution
        if (img.width < 1920 || img.height < 1080) {
          checks.passed = false;
          checks.issue = 'Resolution too low (minimum 1920x1080)';
        }

        // Check aspect ratio
        const aspectRatio = img.width / img.height;
        if (aspectRatio < 1.3 || aspectRatio > 1.8) {
          checks.passed = false;
          checks.issue = 'Unusual aspect ratio';
        }

        resolve(checks);
      };

      img.onerror = () => {
        resolve({
          passed: false,
          issue: 'Invalid image file'
        });
      };

      img.src = photo.preview || URL.createObjectURL(photo.file);
    });
  }

  /**
   * Poll processing status
   */
  async getStatus(jobId) {
    try {
      const response = await fetch(`${this.apiEndpoint}/status/${jobId}`);
      const data = await response.json();

      return {
        jobId,
        status: data.status, // 'processing', 'completed', 'failed'
        progress: data.progress || 0,
        result: data.result || null,
        error: data.error || null
      };
    } catch (error) {
      console.error('Failed to get status:', error);
      return {
        jobId,
        status: 'unknown',
        error: error.message
      };
    }
  }

  /**
   * Download generated 3D model
   */
  async downloadModel(jobId, format = 'glb') {
    try {
      const response = await fetch(`${this.apiEndpoint}/download/${jobId}?format=${format}`);

      if (!response.ok) {
        throw new Error('Download failed');
      }

      const blob = await response.blob();
      return {
        format,
        blob,
        url: URL.createObjectURL(blob)
      };
    } catch (error) {
      console.error('Model download failed:', error);
      throw error;
    }
  }

  /**
   * Cancel processing job
   */
  async cancelJob(jobId) {
    try {
      await fetch(`${this.apiEndpoint}/cancel/${jobId}`, {
        method: 'POST'
      });
      return true;
    } catch (error) {
      console.error('Failed to cancel job:', error);
      return false;
    }
  }

  /**
   * Generate point cloud from photos (client-side preview)
   * Limited version that doesn't require server
   */
  async generatePointCloudPreview(photos) {
    // This is a simplified preview - not a full 3D reconstruction
    // Uses feature matching to create sparse point cloud

    if (photos.length < 2) {
      throw new Error('Minimum 2 photos required for preview');
    }

    const points = [];

    // Extract features from first two photos for preview
    const features1 = await this.extractFeatures(photos[0]);
    const features2 = await this.extractFeatures(photos[1]);

    // Match features
    const matches = this.matchFeatures(features1, features2);

    // Triangulate matched points
    matches.forEach(match => {
      const point = this.triangulatePoint(match, photos[0], photos[1]);
      if (point) points.push(point);
    });

    return {
      points,
      count: points.length,
      bounds: this.calculateBounds(points),
      preview: true // Indicates this is not a full reconstruction
    };
  }

  /**
   * Extract visual features from image (simplified SIFT-like)
   */
  async extractFeatures(photo) {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        canvas.width = img.width;
        canvas.height = img.height;
        ctx.drawImage(img, 0, 0);

        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const features = this.detectKeypoints(imageData);

        resolve(features);
      };

      img.src = photo.preview || URL.createObjectURL(photo.file);
    });
  }

  /**
   * Detect keypoints in image (simplified corner detection)
   */
  detectKeypoints(imageData) {
    const keypoints = [];
    const { data, width, height } = imageData;

    // Sample grid of points
    const stepSize = 20;
    for (let y = stepSize; y < height - stepSize; y += stepSize) {
      for (let x = stepSize; x < width - stepSize; x += stepSize) {
        // const idx = (y * width + x) * 4; // Reserved for future use

        // Simple corner detection using gradient
        const gx = this.getGradientX(data, x, y, width);
        const gy = this.getGradientY(data, x, y, width);
        const magnitude = Math.sqrt(gx * gx + gy * gy);

        if (magnitude > 30) {
          keypoints.push({
            x,
            y,
            magnitude,
            descriptor: this.createDescriptor(data, x, y, width)
          });
        }
      }
    }

    return keypoints;
  }

  /**
   * Calculate X gradient
   */
  getGradientX(data, x, y, width) {
    const idx = (y * width + x) * 4;
    const left = (data[idx - 4] + data[idx - 3] + data[idx - 2]) / 3;
    const right = (data[idx + 4] + data[idx + 5] + data[idx + 6]) / 3;
    return right - left;
  }

  /**
   * Calculate Y gradient
   */
  getGradientY(data, x, y, width) {
    const idx = (y * width + x) * 4;
    const top = (data[idx - width * 4] + data[idx - width * 4 + 1] + data[idx - width * 4 + 2]) / 3;
    const bottom = (data[idx + width * 4] + data[idx + width * 4 + 1] + data[idx + width * 4 + 2]) / 3;
    return bottom - top;
  }

  /**
   * Create feature descriptor
   */
  createDescriptor(data, x, y, width, patchSize = 8) {
    const descriptor = [];
    for (let dy = -patchSize; dy <= patchSize; dy += 2) {
      for (let dx = -patchSize; dx <= patchSize; dx += 2) {
        const idx = ((y + dy) * width + (x + dx)) * 4;
        descriptor.push((data[idx] + data[idx + 1] + data[idx + 2]) / 3);
      }
    }
    return descriptor;
  }

  /**
   * Match features between two images
   */
  matchFeatures(features1, features2, threshold = 50) {
    const matches = [];

    features1.forEach(f1 => {
      let bestMatch = null;
      let bestDistance = Infinity;

      features2.forEach(f2 => {
        const distance = this.descriptorDistance(f1.descriptor, f2.descriptor);
        if (distance < bestDistance) {
          bestDistance = distance;
          bestMatch = f2;
        }
      });

      if (bestDistance < threshold) {
        matches.push({
          point1: { x: f1.x, y: f1.y },
          point2: { x: bestMatch.x, y: bestMatch.y },
          distance: bestDistance
        });
      }
    });

    return matches;
  }

  /**
   * Calculate descriptor distance
   */
  descriptorDistance(desc1, desc2) {
    return Math.sqrt(
      desc1.reduce((sum, val, idx) => sum + Math.pow(val - desc2[idx], 2), 0)
    );
  }

  /**
   * Triangulate 3D point from matched 2D points
   */
  triangulatePoint(match, photo1, photo2) {
    // Simplified triangulation - real implementation would use camera matrices
    // const baselineDistance = 10; // Assumed distance between photos - Reserved for future use

    return {
      x: (match.point1.x + match.point2.x) / 2,
      y: (match.point1.y + match.point2.y) / 2,
      z: Math.abs(match.point1.x - match.point2.x) * 0.1,
      confidence: 1 / (1 + match.distance)
    };
  }

  /**
   * Calculate bounding box of point cloud
   */
  calculateBounds(points) {
    if (points.length === 0) {
      return { min: [0, 0, 0], max: [0, 0, 0] };
    }

    const xs = points.map(p => p.x);
    const ys = points.map(p => p.y);
    const zs = points.map(p => p.z);

    return {
      min: [Math.min(...xs), Math.min(...ys), Math.min(...zs)],
      max: [Math.max(...xs), Math.max(...ys), Math.max(...zs)]
    };
  }

  /**
   * Convert point cloud to mesh (simplified)
   */
  pointCloudToMesh(pointCloud) {
    // This would use algorithms like Poisson surface reconstruction
    // For now, returns point cloud in THREE.js format

    const geometry = {
      vertices: pointCloud.points.map(p => [p.x, p.y, p.z]),
      colors: pointCloud.points.map(() => [1, 1, 1]), // White
      bounds: pointCloud.bounds
    };

    return geometry;
  }

  /**
   * Estimate roof measurements from 3D model
   */
  async estimateMeasurements(modelData) {
    // Extract roof surfaces from 3D model
    // Calculate area, pitch, perimeter

    return {
      roofArea: 0, // sq ft
      pitch: 0, // degrees
      perimeter: 0, // ft
      valleys: [], // valley locations
      ridges: [], // ridge locations
      hips: [] // hip locations
    };
  }
}

// Singleton instance
export const photogrammetry = new PhotogrammetryService();
