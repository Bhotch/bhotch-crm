import Dexie from 'dexie';

class AdvancedCacheManager {
  constructor() {
    this.db = new Dexie('UltimateCRMCache');
    this.initializeDatabase();
    this.initializeInMemoryCache();
  }

  initializeDatabase() {
    this.db.version(1).stores({
      cache: '++id, key, value, expiresAt, createdAt, accessCount, lastAccessed, tags',
      sessions: '++id, sessionId, data, expiresAt, createdAt',
      calculations: '++id, sqft, ridgeVents, turbineVents, rimeFlow, method, timestamp',
      metrics: '++id, operation, duration, success, timestamp, metadata'
    });

    this.db.open().catch(err => {
      console.error('Failed to open cache database:', err);
    });
  }

  initializeInMemoryCache() {
    this.memoryCache = new Map();
    this.cacheStats = {
      hits: 0,
      misses: 0,
      sets: 0,
      deletes: 0,
      evictions: 0
    };
    this.maxMemorySize = 1000;
    this.cleanupInterval = setInterval(() => this.cleanup(), 300000);
  }

  async set(key, value, options = {}) {
    const {
      ttl = 3600000, // 1 hour default
      tags = [],
      priority = 1,
      compress = false
    } = options;

    const now = Date.now();
    const expiresAt = now + ttl;

    const cacheEntry = {
      key,
      value: compress ? this.compress(value) : value,
      expiresAt,
      createdAt: now,
      accessCount: 0,
      lastAccessed: now,
      tags: Array.isArray(tags) ? tags : [tags],
      priority,
      compressed: compress
    };

    try {
      // Store in memory cache for fast access
      this.memoryCache.set(key, cacheEntry);
      this.enforceMemoryLimit();

      // Store in persistent database
      await this.db.cache.put(cacheEntry);

      this.cacheStats.sets++;
      return true;
    } catch (error) {
      console.error('Cache set error:', error);
      return false;
    }
  }

  async get(key) {
    const startTime = performance.now();

    try {
      // Check memory cache first
      let entry = this.memoryCache.get(key);

      // If not in memory, check database
      if (!entry) {
        const dbEntry = await this.db.cache.where('key').equals(key).first();
        if (dbEntry) {
          entry = dbEntry;
          // Add to memory cache for future access
          this.memoryCache.set(key, entry);
        }
      }

      if (!entry) {
        this.cacheStats.misses++;
        this.recordMetric('cache_get', performance.now() - startTime, false);
        return null;
      }

      // Check expiration
      if (Date.now() > entry.expiresAt) {
        await this.delete(key);
        this.cacheStats.misses++;
        this.recordMetric('cache_get', performance.now() - startTime, false);
        return null;
      }

      // Update access statistics
      entry.accessCount++;
      entry.lastAccessed = Date.now();

      // Update database asynchronously
      this.db.cache.put(entry).catch(err => {
        console.warn('Failed to update cache stats:', err);
      });

      this.cacheStats.hits++;
      this.recordMetric('cache_get', performance.now() - startTime, true);

      return entry.compressed ? this.decompress(entry.value) : entry.value;
    } catch (error) {
      console.error('Cache get error:', error);
      this.cacheStats.misses++;
      this.recordMetric('cache_get', performance.now() - startTime, false);
      return null;
    }
  }

  async delete(key) {
    try {
      this.memoryCache.delete(key);
      await this.db.cache.where('key').equals(key).delete();
      this.cacheStats.deletes++;
      return true;
    } catch (error) {
      console.error('Cache delete error:', error);
      return false;
    }
  }

  async deleteByTags(tags) {
    const tagsArray = Array.isArray(tags) ? tags : [tags];

    try {
      const entries = await this.db.cache.toArray();
      const keysToDelete = entries
        .filter(entry => entry.tags.some(tag => tagsArray.includes(tag)))
        .map(entry => entry.key);

      // Delete from memory cache
      keysToDelete.forEach(key => this.memoryCache.delete(key));

      // Delete from database
      await this.db.cache.where('key').anyOf(keysToDelete).delete();

      this.cacheStats.deletes += keysToDelete.length;
      return keysToDelete.length;
    } catch (error) {
      console.error('Cache delete by tags error:', error);
      return 0;
    }
  }

  async mget(keys) {
    const results = {};
    const promises = keys.map(async key => {
      const value = await this.get(key);
      results[key] = value;
    });

    await Promise.all(promises);
    return results;
  }

  async mset(entries, options = {}) {
    const promises = Object.entries(entries).map(([key, value]) =>
      this.set(key, value, options)
    );

    const results = await Promise.all(promises);
    return results.every(result => result === true);
  }

  async exists(key) {
    try {
      const entry = this.memoryCache.get(key) ||
        await this.db.cache.where('key').equals(key).first();

      return entry && Date.now() <= entry.expiresAt;
    } catch (error) {
      console.error('Cache exists error:', error);
      return false;
    }
  }

  async keys(pattern = '*') {
    try {
      const allKeys = await this.db.cache.toCollection().primaryKeys();

      if (pattern === '*') {
        return allKeys;
      }

      const regex = new RegExp(pattern.replace(/\*/g, '.*'));
      return allKeys.filter(key => regex.test(key));
    } catch (error) {
      console.error('Cache keys error:', error);
      return [];
    }
  }

  async clear() {
    try {
      this.memoryCache.clear();
      await this.db.cache.clear();
      this.resetStats();
      return true;
    } catch (error) {
      console.error('Cache clear error:', error);
      return false;
    }
  }

  async getStats() {
    try {
      const memorySize = this.memoryCache.size;
      const dbSize = await this.db.cache.count();
      const hitRate = this.cacheStats.hits / (this.cacheStats.hits + this.cacheStats.misses) || 0;

      return {
        ...this.cacheStats,
        memorySize,
        dbSize,
        hitRate: Math.round(hitRate * 100) / 100,
        memoryUsage: `${memorySize}/${this.maxMemorySize}`
      };
    } catch (error) {
      console.error('Cache stats error:', error);
      return this.cacheStats;
    }
  }

  async cleanup() {
    const now = Date.now();

    try {
      // Clean expired entries from memory
      for (const [key, entry] of this.memoryCache.entries()) {
        if (now > entry.expiresAt) {
          this.memoryCache.delete(key);
          this.cacheStats.evictions++;
        }
      }

      // Clean expired entries from database
      const expiredCount = await this.db.cache
        .where('expiresAt')
        .below(now)
        .delete();

      this.cacheStats.evictions += expiredCount;

      console.log(`Cache cleanup: removed ${expiredCount} expired entries`);
    } catch (error) {
      console.error('Cache cleanup error:', error);
    }
  }

  enforceMemoryLimit() {
    if (this.memoryCache.size <= this.maxMemorySize) {
      return;
    }

    // LRU eviction - remove least recently accessed
    const entries = Array.from(this.memoryCache.entries())
      .sort(([, a], [, b]) => a.lastAccessed - b.lastAccessed);

    const toRemove = entries.length - this.maxMemorySize;
    for (let i = 0; i < toRemove; i++) {
      this.memoryCache.delete(entries[i][0]);
      this.cacheStats.evictions++;
    }
  }

  compress(data) {
    try {
      return JSON.stringify(data);
    } catch (error) {
      console.warn('Compression failed:', error);
      return data;
    }
  }

  decompress(data) {
    try {
      return JSON.parse(data);
    } catch (error) {
      console.warn('Decompression failed:', error);
      return data;
    }
  }

  async recordMetric(operation, duration, success, metadata = {}) {
    try {
      await this.db.metrics.add({
        operation,
        duration,
        success,
        timestamp: Date.now(),
        metadata
      });
    } catch (error) {
      console.warn('Failed to record metric:', error);
    }
  }

  resetStats() {
    this.cacheStats = {
      hits: 0,
      misses: 0,
      sets: 0,
      deletes: 0,
      evictions: 0
    };
  }

  async getMetrics(timeRange = 3600000) {
    try {
      const since = Date.now() - timeRange;
      const metrics = await this.db.metrics
        .where('timestamp')
        .above(since)
        .toArray();

      const byOperation = metrics.reduce((acc, metric) => {
        if (!acc[metric.operation]) {
          acc[metric.operation] = {
            count: 0,
            totalDuration: 0,
            successCount: 0,
            failureCount: 0
          };
        }

        acc[metric.operation].count++;
        acc[metric.operation].totalDuration += metric.duration;

        if (metric.success) {
          acc[metric.operation].successCount++;
        } else {
          acc[metric.operation].failureCount++;
        }

        return acc;
      }, {});

      // Calculate averages
      Object.keys(byOperation).forEach(operation => {
        const stats = byOperation[operation];
        stats.avgDuration = stats.totalDuration / stats.count;
        stats.successRate = stats.successCount / stats.count;
      });

      return byOperation;
    } catch (error) {
      console.error('Failed to get metrics:', error);
      return {};
    }
  }

  async cacheCalculation(sqft, result) {
    const key = `calculation:${sqft}`;
    const cacheEntry = {
      sqft,
      ...result,
      timestamp: Date.now()
    };

    await Promise.all([
      this.set(key, cacheEntry, {
        ttl: 3600000, // 1 hour
        tags: ['calculations']
      }),
      this.db.calculations.add(cacheEntry)
    ]);
  }

  async getCachedCalculation(sqft) {
    const key = `calculation:${sqft}`;
    return await this.get(key);
  }

  destroy() {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }
    this.memoryCache.clear();
    this.db.close();
  }
}

const cacheManager = new AdvancedCacheManager();

export default cacheManager;
export { AdvancedCacheManager };