import * as THREE from 'three';
import localforage from 'localforage';

/**
 * Advanced Texture Loading and Caching System
 * Optimizes texture loading for 3D visualization with:
 * - Memory caching for instant reuse
 * - IndexedDB caching for persistent storage
 * - Texture compression and optimization
 * - Lazy loading and preloading strategies
 * - Automatic cleanup and memory management
 */

class TextureCache {
  constructor() {
    // In-memory cache for immediate access
    this.memoryCache = new Map();

    // IndexedDB for persistent storage
    this.storage = localforage.createInstance({
      name: 'visualization360',
      storeName: 'textures'
    });

    // Texture loader
    this.loader = new THREE.TextureLoader();

    // Loading queue
    this.loadingQueue = new Map();

    // Cache statistics
    this.stats = {
      hits: 0,
      misses: 0,
      memoryUsage: 0,
      totalLoaded: 0
    };

    // Maximum cache size (in bytes) - 100MB default
    this.maxCacheSize = 100 * 1024 * 1024;

    // Texture optimization settings
    this.optimizationSettings = {
      maxSize: 2048, // Maximum texture dimension
      compressFormat: 'RGBA',
      generateMipmaps: true,
      anisotropy: 16
    };

    // Initialize cleanup interval (every 5 minutes)
    this.startCleanupInterval();
  }

  /**
   * Load texture with caching
   * @param {string} url - Texture URL
   * @param {Object} options - Loading options
   * @returns {Promise<THREE.Texture>}
   */
  async loadTexture(url, options = {}) {
    // Check memory cache first
    if (this.memoryCache.has(url)) {
      this.stats.hits++;
      return this.memoryCache.get(url).clone();
    }

    // Check if already loading
    if (this.loadingQueue.has(url)) {
      return this.loadingQueue.get(url);
    }

    // Check IndexedDB cache
    try {
      const cachedData = await this.storage.getItem(url);
      if (cachedData) {
        const texture = await this.deserializeTexture(cachedData);
        this.memoryCache.set(url, texture);
        this.stats.hits++;
        return texture.clone();
      }
    } catch (error) {
      console.warn('Failed to load from cache:', error);
    }

    // Load from network
    this.stats.misses++;
    const loadPromise = this.loadFromNetwork(url, options);
    this.loadingQueue.set(url, loadPromise);

    try {
      const texture = await loadPromise;
      this.loadingQueue.delete(url);

      // Cache in memory and IndexedDB
      this.memoryCache.set(url, texture);
      await this.cacheTexture(url, texture);

      this.stats.totalLoaded++;
      this.updateMemoryUsage();

      return texture.clone();
    } catch (error) {
      this.loadingQueue.delete(url);
      throw error;
    }
  }

  /**
   * Load texture from network with optimization
   * @private
   */
  loadFromNetwork(url, options = {}) {
    return new Promise((resolve, reject) => {
      this.loader.load(
        url,
        (texture) => {
          // Apply optimization
          this.optimizeTexture(texture, options);
          resolve(texture);
        },
        undefined,
        (error) => {
          console.error('Texture loading failed:', url, error);
          reject(error);
        }
      );
    });
  }

  /**
   * Optimize texture for performance
   * @private
   */
  optimizeTexture(texture, options = {}) {
    const settings = { ...this.optimizationSettings, ...options };

    // Resize if too large
    if (texture.image && (texture.image.width > settings.maxSize || texture.image.height > settings.maxSize)) {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');

      const scale = settings.maxSize / Math.max(texture.image.width, texture.image.height);
      canvas.width = texture.image.width * scale;
      canvas.height = texture.image.height * scale;

      ctx.drawImage(texture.image, 0, 0, canvas.width, canvas.height);
      texture.image = canvas;
    }

    // Configure texture settings
    texture.generateMipmaps = settings.generateMipmaps;
    texture.anisotropy = settings.anisotropy;
    texture.minFilter = THREE.LinearMipmapLinearFilter;
    texture.magFilter = THREE.LinearFilter;
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;

    // Update texture
    texture.needsUpdate = true;

    return texture;
  }

  /**
   * Cache texture to IndexedDB
   * @private
   */
  async cacheTexture(url, texture) {
    try {
      const serialized = await this.serializeTexture(texture);

      // Check if we need to clear old cache
      if (this.stats.memoryUsage > this.maxCacheSize) {
        await this.clearOldestCache();
      }

      await this.storage.setItem(url, {
        data: serialized,
        timestamp: Date.now(),
        size: serialized.byteLength || 0
      });
    } catch (error) {
      console.warn('Failed to cache texture:', error);
    }
  }

  /**
   * Serialize texture for storage
   * @private
   */
  async serializeTexture(texture) {
    if (!texture.image) return null;

    // Convert to canvas if necessary
    let canvas;
    if (texture.image instanceof HTMLCanvasElement) {
      canvas = texture.image;
    } else if (texture.image instanceof HTMLImageElement) {
      canvas = document.createElement('canvas');
      canvas.width = texture.image.width;
      canvas.height = texture.image.height;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(texture.image, 0, 0);
    } else {
      return null;
    }

    // Convert to blob
    const blob = await new Promise((resolve) => canvas.toBlob(resolve, 'image/webp', 0.9));
    const arrayBuffer = await blob.arrayBuffer();

    return {
      imageData: arrayBuffer,
      width: canvas.width,
      height: canvas.height,
      format: texture.format,
      type: texture.type,
      wrapS: texture.wrapS,
      wrapT: texture.wrapT,
      minFilter: texture.minFilter,
      magFilter: texture.magFilter
    };
  }

  /**
   * Deserialize texture from storage
   * @private
   */
  async deserializeTexture(cachedData) {
    const { data } = cachedData;
    if (!data || !data.imageData) return null;

    // Create image from array buffer
    const blob = new Blob([data.imageData], { type: 'image/webp' });
    const imageUrl = URL.createObjectURL(blob);

    const texture = await new Promise((resolve, reject) => {
      this.loader.load(
        imageUrl,
        (tex) => {
          URL.revokeObjectURL(imageUrl);
          resolve(tex);
        },
        undefined,
        (error) => {
          URL.revokeObjectURL(imageUrl);
          reject(error);
        }
      );
    });

    // Restore texture properties
    texture.format = data.format || THREE.RGBAFormat;
    texture.type = data.type || THREE.UnsignedByteType;
    texture.wrapS = data.wrapS || THREE.RepeatWrapping;
    texture.wrapT = data.wrapT || THREE.RepeatWrapping;
    texture.minFilter = data.minFilter || THREE.LinearMipmapLinearFilter;
    texture.magFilter = data.magFilter || THREE.LinearFilter;
    texture.needsUpdate = true;

    return texture;
  }

  /**
   * Preload multiple textures
   * @param {string[]} urls - Array of texture URLs
   * @returns {Promise<THREE.Texture[]>}
   */
  async preloadTextures(urls) {
    const promises = urls.map((url) => this.loadTexture(url));
    return Promise.all(promises);
  }

  /**
   * Clear specific texture from cache
   * @param {string} url - Texture URL
   */
  async clearTexture(url) {
    this.memoryCache.delete(url);
    await this.storage.removeItem(url);
    this.updateMemoryUsage();
  }

  /**
   * Clear all cached textures
   */
  async clearCache() {
    // Dispose all textures in memory cache
    for (const texture of this.memoryCache.values()) {
      texture.dispose();
    }

    this.memoryCache.clear();
    await this.storage.clear();
    this.stats.memoryUsage = 0;
  }

  /**
   * Clear oldest cached items to free space
   * @private
   */
  async clearOldestCache() {
    try {
      const keys = await this.storage.keys();
      const items = [];

      // Get all items with timestamps
      for (const key of keys) {
        const item = await this.storage.getItem(key);
        if (item && item.timestamp) {
          items.push({ key, timestamp: item.timestamp, size: item.size || 0 });
        }
      }

      // Sort by timestamp (oldest first)
      items.sort((a, b) => a.timestamp - b.timestamp);

      // Remove oldest 25% of items
      const removeCount = Math.ceil(items.length * 0.25);
      for (let i = 0; i < removeCount; i++) {
        await this.storage.removeItem(items[i].key);
        this.memoryCache.delete(items[i].key);
      }

      this.updateMemoryUsage();
    } catch (error) {
      console.error('Failed to clear old cache:', error);
    }
  }

  /**
   * Update memory usage statistics
   * @private
   */
  updateMemoryUsage() {
    let totalSize = 0;

    for (const texture of this.memoryCache.values()) {
      if (texture.image) {
        // Estimate size: width * height * 4 bytes (RGBA)
        const size = texture.image.width * texture.image.height * 4;
        totalSize += size;
      }
    }

    this.stats.memoryUsage = totalSize;
  }

  /**
   * Start automatic cleanup interval
   * @private
   */
  startCleanupInterval() {
    setInterval(() => {
      // If memory usage exceeds 80% of max, trigger cleanup
      if (this.stats.memoryUsage > this.maxCacheSize * 0.8) {
        this.clearOldestCache();
      }

      // Dispose unused textures from memory cache
      const now = Date.now();
      for (const [url, texture] of this.memoryCache.entries()) {
        // Remove textures not used in last 10 minutes
        if (texture.lastUsed && now - texture.lastUsed > 10 * 60 * 1000) {
          texture.dispose();
          this.memoryCache.delete(url);
        }
      }

      this.updateMemoryUsage();
    }, 5 * 60 * 1000); // Run every 5 minutes
  }

  /**
   * Get cache statistics
   * @returns {Object}
   */
  getStats() {
    return {
      ...this.stats,
      memoryUsageMB: (this.stats.memoryUsage / (1024 * 1024)).toFixed(2),
      cacheSize: this.memoryCache.size,
      hitRate: this.stats.hits > 0 ? (this.stats.hits / (this.stats.hits + this.stats.misses) * 100).toFixed(2) : 0
    };
  }

  /**
   * Set maximum cache size
   * @param {number} sizeInMB - Maximum size in megabytes
   */
  setMaxCacheSize(sizeInMB) {
    this.maxCacheSize = sizeInMB * 1024 * 1024;
  }

  /**
   * Dispose and cleanup
   */
  dispose() {
    for (const texture of this.memoryCache.values()) {
      texture.dispose();
    }
    this.memoryCache.clear();
  }
}

// Singleton instance
const textureCache = new TextureCache();

export default textureCache;
export { TextureCache };
