import logger from './enterpriseLogger';
import cacheManager from './advancedCache';
import notificationSystem from './notificationSystem';

class EnterpriseMonitoringSystem {
  constructor() {
    this.metrics = new Map();
    this.alerts = new Map();
    this.thresholds = {
      responseTime: 5000,        // 5 seconds
      errorRate: 0.05,           // 5%
      memoryUsage: 0.8,          // 80%
      cacheHitRate: 0.7,         // 70%
      apiFailureRate: 0.1,       // 10%
      calculationSuccessRate: 0.95, // 95%
      systemLoad: 0.8            // 80%
    };

    this.monitoring = {
      enabled: true,
      interval: 30000,           // 30 seconds
      batchSize: 100,
      retentionPeriod: 7 * 24 * 60 * 60 * 1000 // 7 days
    };

    this.alertChannels = ['ui', 'console', 'storage'];
    this.healthChecks = [];

    this.initializeMonitoring();
  }

  initializeMonitoring() {
    this.setupPerformanceObserver();
    this.setupResourceMonitoring();
    this.setupErrorTracking();
    this.setupHealthChecks();
    this.startMonitoringLoop();

    logger.info('Enterprise Monitoring System initialized', {
      thresholds: this.thresholds,
      monitoring: this.monitoring
    });
  }

  setupPerformanceObserver() {
    if ('PerformanceObserver' in window) {
      try {
        const observer = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          entries.forEach(entry => this.recordPerformanceMetric(entry));
        });

        observer.observe({ entryTypes: ['navigation', 'measure', 'resource'] });
        this.performanceObserver = observer;
      } catch (error) {
        logger.warn('Performance Observer setup failed', { error: error.message });
      }
    }
  }

  setupResourceMonitoring() {
    // Monitor memory usage
    setInterval(() => {
      if ('memory' in performance) {
        this.recordMetric('memory.used', performance.memory.usedJSHeapSize);
        this.recordMetric('memory.total', performance.memory.totalJSHeapSize);
        this.recordMetric('memory.limit', performance.memory.jsHeapSizeLimit);

        const usage = performance.memory.usedJSHeapSize / performance.memory.jsHeapSizeLimit;
        this.checkThreshold('memoryUsage', usage);
      }
    }, this.monitoring.interval);

    // Monitor connection status
    this.monitorNetworkStatus();
  }

  setupErrorTracking() {
    // Global error handler
    window.addEventListener('error', (event) => {
      this.recordError('javascript', {
        message: event.message,
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
        stack: event.error?.stack
      });
    });

    // Promise rejection handler
    window.addEventListener('unhandledrejection', (event) => {
      this.recordError('promise', {
        reason: event.reason,
        promise: event.promise
      });
    });
  }

  setupHealthChecks() {
    // System health checks
    this.addHealthCheck('cache', async () => {
      try {
        const stats = await cacheManager.getStats();
        return {
          status: 'healthy',
          metrics: stats,
          hitRate: stats.hitRate || 0
        };
      } catch (error) {
        return {
          status: 'unhealthy',
          error: error.message
        };
      }
    });

    this.addHealthCheck('storage', async () => {
      try {
        const testKey = 'health_check_' + Date.now();
        localStorage.setItem(testKey, 'test');
        const value = localStorage.getItem(testKey);
        localStorage.removeItem(testKey);

        return {
          status: value === 'test' ? 'healthy' : 'degraded',
          metrics: {
            localStorageAvailable: true,
            itemCount: localStorage.length
          }
        };
      } catch (error) {
        return {
          status: 'unhealthy',
          error: error.message
        };
      }
    });

    this.addHealthCheck('network', async () => {
      try {
        const start = performance.now();
        const response = await fetch('https://httpbin.org/status/200', {
          method: 'HEAD',
          cache: 'no-cache'
        });
        const duration = performance.now() - start;

        return {
          status: response.ok ? 'healthy' : 'degraded',
          metrics: {
            responseTime: Math.round(duration),
            status: response.status
          }
        };
      } catch (error) {
        return {
          status: 'unhealthy',
          error: error.message
        };
      }
    });

    this.addHealthCheck('api', async () => {
      try {
        // Test basic API connectivity (simplified)
        const testData = { action: 'test', timestamp: Date.now() };
        const response = await fetch('/api/test', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(testData)
        });

        return {
          status: response.ok ? 'healthy' : 'degraded',
          metrics: {
            status: response.status,
            available: response.ok
          }
        };
      } catch (error) {
        return {
          status: 'degraded',
          error: 'API not available or CORS issue'
        };
      }
    });
  }

  startMonitoringLoop() {
    setInterval(async () => {
      if (this.monitoring.enabled) {
        await this.collectSystemMetrics();
        await this.runHealthChecks();
        await this.processAlerts();
        await this.cleanupOldMetrics();
      }
    }, this.monitoring.interval);

    // Initial run after 5 seconds
    setTimeout(() => this.collectSystemMetrics(), 5000);
  }

  async collectSystemMetrics() {
    try {
      const metrics = {
        timestamp: Date.now(),
        system: await this.getSystemMetrics(),
        performance: await this.getPerformanceMetrics(),
        cache: await this.getCacheMetrics(),
        errors: await this.getErrorMetrics()
      };

      await this.storeMetrics(metrics);
      this.analyzeMetrics(metrics);

    } catch (error) {
      logger.error('Failed to collect system metrics', { error: error.message });
    }
  }

  async getSystemMetrics() {
    return {
      timestamp: Date.now(),
      userAgent: navigator.userAgent,
      online: navigator.onLine,
      cookieEnabled: navigator.cookieEnabled,
      language: navigator.language,
      platform: navigator.platform,
      viewport: {
        width: window.innerWidth,
        height: window.innerHeight
      },
      memory: 'memory' in performance ? {
        used: performance.memory.usedJSHeapSize,
        total: performance.memory.totalJSHeapSize,
        limit: performance.memory.jsHeapSizeLimit,
        usage: performance.memory.usedJSHeapSize / performance.memory.jsHeapSizeLimit
      } : null
    };
  }

  async getPerformanceMetrics() {
    const navigation = performance.getEntriesByType('navigation')[0];

    return {
      domContentLoaded: navigation?.domContentLoadedEventEnd - navigation?.domContentLoadedEventStart || 0,
      loadComplete: navigation?.loadEventEnd - navigation?.loadEventStart || 0,
      firstPaint: this.getFirstPaint(),
      firstContentfulPaint: this.getFirstContentfulPaint(),
      timeToInteractive: this.estimateTimeToInteractive()
    };
  }

  async getCacheMetrics() {
    try {
      const stats = await cacheManager.getStats();
      const cacheMetrics = await cacheManager.getMetrics();

      return {
        ...stats,
        operations: cacheMetrics
      };
    } catch (error) {
      logger.warn('Failed to get cache metrics', { error: error.message });
      return {};
    }
  }

  async getErrorMetrics() {
    const errors = this.metrics.get('errors') || [];
    const recentErrors = errors.filter(
      error => Date.now() - error.timestamp < this.monitoring.interval * 2
    );

    return {
      totalErrors: errors.length,
      recentErrors: recentErrors.length,
      errorRate: recentErrors.length / this.monitoring.interval * 1000, // errors per second
      errorTypes: this.categorizeErrors(recentErrors)
    };
  }

  getFirstPaint() {
    const paintEntries = performance.getEntriesByType('paint');
    const firstPaint = paintEntries.find(entry => entry.name === 'first-paint');
    return firstPaint ? Math.round(firstPaint.startTime) : 0;
  }

  getFirstContentfulPaint() {
    const paintEntries = performance.getEntriesByType('paint');
    const fcp = paintEntries.find(entry => entry.name === 'first-contentful-paint');
    return fcp ? Math.round(fcp.startTime) : 0;
  }

  estimateTimeToInteractive() {
    // Simplified TTI estimation
    const navigation = performance.getEntriesByType('navigation')[0];
    return navigation ? Math.round(navigation.domInteractive - navigation.fetchStart) : 0;
  }

  recordMetric(name, value, metadata = {}) {
    const metric = {
      name,
      value,
      timestamp: Date.now(),
      metadata
    };

    if (!this.metrics.has(name)) {
      this.metrics.set(name, []);
    }

    const metrics = this.metrics.get(name);
    metrics.push(metric);

    // Keep only recent metrics
    const cutoff = Date.now() - this.monitoring.retentionPeriod;
    this.metrics.set(name, metrics.filter(m => m.timestamp > cutoff));

    // Check thresholds
    this.checkThreshold(name, value);
  }

  recordPerformanceMetric(entry) {
    const metric = {
      name: entry.name,
      type: entry.entryType,
      startTime: entry.startTime,
      duration: entry.duration,
      timestamp: Date.now()
    };

    this.recordMetric(`performance.${entry.entryType}`, entry.duration, metric);

    // Check performance thresholds
    if (entry.entryType === 'navigation' || entry.entryType === 'measure') {
      this.checkThreshold('responseTime', entry.duration);
    }
  }

  recordError(type, details) {
    const error = {
      type,
      details,
      timestamp: Date.now(),
      url: window.location.href,
      userAgent: navigator.userAgent
    };

    if (!this.metrics.has('errors')) {
      this.metrics.set('errors', []);
    }

    this.metrics.get('errors').push(error);

    // Trigger immediate alert for critical errors
    this.triggerAlert('error', 'critical', `${type} error occurred`, error);

    logger.error(`Monitoring: ${type} error recorded`, details);
  }

  checkThreshold(metricName, value) {
    const threshold = this.thresholds[metricName];
    if (!threshold) return;

    const exceeded = value > threshold;
    if (exceeded) {
      this.triggerAlert('threshold', 'warning',
        `${metricName} threshold exceeded`,
        { metric: metricName, value, threshold }
      );
    }
  }

  triggerAlert(type, severity, message, data = {}) {
    const alert = {
      id: this.generateAlertId(),
      type,
      severity,
      message,
      data,
      timestamp: Date.now(),
      resolved: false
    };

    this.alerts.set(alert.id, alert);

    // Send notifications based on severity
    this.sendAlert(alert);

    logger.warn(`Alert triggered: ${message}`, alert);
  }

  async sendAlert(alert) {
    try {
      // Send to configured channels
      for (const channel of this.alertChannels) {
        switch (channel) {
          case 'ui':
            await notificationSystem.error(alert.message, {
              priority: alert.severity === 'critical' ? 'high' : 'medium',
              category: 'monitoring',
              metadata: alert.data
            });
            break;

          case 'console':
            console.warn('🚨 MONITORING ALERT:', alert);
            break;

          case 'storage':
            await this.storeAlert(alert);
            break;

          case 'webhook':
            await this.sendWebhookAlert(alert);
            break;

          default:
            console.warn('Unknown alert channel:', channel);
            break;
        }
      }
    } catch (error) {
      logger.error('Failed to send alert', {
        alertId: alert.id,
        error: error.message
      });
    }
  }

  async runHealthChecks() {
    const results = {};

    for (const [name, checkFn] of this.healthChecks) {
      try {
        const result = await checkFn();
        results[name] = result;

        // Trigger alerts for unhealthy systems
        if (result.status === 'unhealthy') {
          this.triggerAlert('health', 'critical',
            `Health check failed: ${name}`,
            result
          );
        }

      } catch (error) {
        results[name] = {
          status: 'error',
          error: error.message
        };

        this.triggerAlert('health', 'critical',
          `Health check error: ${name}`,
          { error: error.message }
        );
      }
    }

    await this.storeHealthCheckResults(results);
    return results;
  }

  addHealthCheck(name, checkFunction) {
    this.healthChecks.push([name, checkFunction]);
  }

  removeHealthCheck(name) {
    this.healthChecks = this.healthChecks.filter(([checkName]) => checkName !== name);
  }

  async processAlerts() {
    const now = Date.now();
    const autoResolveTime = 5 * 60 * 1000; // 5 minutes

    // Auto-resolve old alerts
    for (const [id, alert] of this.alerts.entries()) {
      if (!alert.resolved && now - alert.timestamp > autoResolveTime) {
        await this.resolveAlert(id);
      }
    }

    // Clean up old resolved alerts
    const oldAlerts = Array.from(this.alerts.entries())
      .filter(([, alert]) => alert.resolved && now - alert.timestamp > 24 * 60 * 60 * 1000);

    oldAlerts.forEach(([id]) => this.alerts.delete(id));
  }

  async resolveAlert(alertId) {
    const alert = this.alerts.get(alertId);
    if (alert) {
      alert.resolved = true;
      alert.resolvedAt = Date.now();

      logger.info('Alert resolved', { alertId, alert: alert.message });
    }
  }

  categorizeErrors(errors) {
    const categories = {};

    errors.forEach(error => {
      const category = error.type || 'unknown';
      categories[category] = (categories[category] || 0) + 1;
    });

    return categories;
  }

  analyzeMetrics(metrics) {
    // Analyze trends and patterns
    const analysis = {
      timestamp: metrics.timestamp,
      performance: this.analyzePerformance(metrics.performance),
      errors: this.analyzeErrors(metrics.errors),
      cache: this.analyzeCachePerformance(metrics.cache),
      recommendations: []
    };

    // Generate recommendations
    if (metrics.performance?.domContentLoaded > 3000) {
      analysis.recommendations.push({
        type: 'performance',
        priority: 'medium',
        message: 'DOM Content Loaded time is high. Consider optimizing JavaScript loading.'
      });
    }

    if (metrics.errors?.errorRate > this.thresholds.errorRate) {
      analysis.recommendations.push({
        type: 'reliability',
        priority: 'high',
        message: 'Error rate is above threshold. Investigate recent errors.'
      });
    }

    if (metrics.cache?.hitRate < this.thresholds.cacheHitRate) {
      analysis.recommendations.push({
        type: 'performance',
        priority: 'medium',
        message: 'Cache hit rate is low. Review caching strategy.'
      });
    }

    return analysis;
  }

  analyzePerformance(performanceMetrics) {
    if (!performanceMetrics) return null;

    return {
      score: this.calculatePerformanceScore(performanceMetrics),
      bottlenecks: this.identifyBottlenecks(performanceMetrics),
      trends: this.getPerformanceTrends()
    };
  }

  calculatePerformanceScore(metrics) {
    let score = 100;

    // Deduct points for slow metrics
    if (metrics.domContentLoaded > 2000) score -= 20;
    if (metrics.loadComplete > 4000) score -= 20;
    if (metrics.firstContentfulPaint > 1500) score -= 15;
    if (metrics.timeToInteractive > 3000) score -= 25;

    return Math.max(0, score);
  }

  identifyBottlenecks(metrics) {
    const bottlenecks = [];

    if (metrics.domContentLoaded > 3000) {
      bottlenecks.push('Slow DOM content loading');
    }
    if (metrics.firstContentfulPaint > 2000) {
      bottlenecks.push('Slow first paint');
    }
    if (metrics.timeToInteractive > 5000) {
      bottlenecks.push('Slow time to interactive');
    }

    return bottlenecks;
  }

  getPerformanceTrends() {
    // Simple trend analysis
    const recentMetrics = this.metrics.get('performance.navigation') || [];
    const last5 = recentMetrics.slice(-5);

    if (last5.length < 2) return 'insufficient_data';

    const trend = last5[last5.length - 1].value - last5[0].value;
    return trend > 0 ? 'degrading' : 'improving';
  }

  analyzeErrors(errorMetrics) {
    if (!errorMetrics) return null;

    return {
      severity: this.categorizeErrorSeverity(errorMetrics),
      patterns: this.identifyErrorPatterns(errorMetrics),
      frequency: errorMetrics.errorRate
    };
  }

  categorizeErrorSeverity(errorMetrics) {
    if (errorMetrics.errorRate > 0.1) return 'critical';
    if (errorMetrics.errorRate > 0.05) return 'high';
    if (errorMetrics.errorRate > 0.01) return 'medium';
    return 'low';
  }

  identifyErrorPatterns(errorMetrics) {
    const errors = this.metrics.get('errors') || [];
    const recentErrors = errors.slice(-10);

    const patterns = {};
    recentErrors.forEach(error => {
      const pattern = error.details?.message || error.type;
      patterns[pattern] = (patterns[pattern] || 0) + 1;
    });

    return patterns;
  }

  analyzeCachePerformance(cacheMetrics) {
    if (!cacheMetrics) return null;

    return {
      efficiency: cacheMetrics.hitRate || 0,
      utilization: this.calculateCacheUtilization(cacheMetrics),
      recommendations: this.getCacheRecommendations(cacheMetrics)
    };
  }

  calculateCacheUtilization(metrics) {
    if (!metrics.memorySize || !metrics.maxMemorySize) return 0;
    return metrics.memorySize / metrics.maxMemorySize;
  }

  getCacheRecommendations(metrics) {
    const recommendations = [];

    if (metrics.hitRate < 0.7) {
      recommendations.push('Consider adjusting cache TTL values');
    }
    if (metrics.evictions > metrics.sets * 0.1) {
      recommendations.push('Cache size may be too small');
    }

    return recommendations;
  }

  monitorNetworkStatus() {
    window.addEventListener('online', () => {
      this.recordMetric('network.status', 1, { status: 'online' });
      logger.info('Network status: online');
    });

    window.addEventListener('offline', () => {
      this.recordMetric('network.status', 0, { status: 'offline' });
      this.triggerAlert('network', 'warning', 'Network connection lost', {});
      logger.warn('Network status: offline');
    });
  }

  async storeMetrics(metrics) {
    try {
      const key = `metrics:${Date.now()}`;
      await cacheManager.set(key, metrics, {
        ttl: this.monitoring.retentionPeriod,
        tags: ['metrics']
      });
    } catch (error) {
      logger.error('Failed to store metrics', { error: error.message });
    }
  }

  async storeAlert(alert) {
    try {
      const key = `alert:${alert.id}`;
      await cacheManager.set(key, alert, {
        ttl: 7 * 24 * 60 * 60 * 1000, // 7 days
        tags: ['alerts']
      });
    } catch (error) {
      logger.error('Failed to store alert', { error: error.message });
    }
  }

  async storeHealthCheckResults(results) {
    try {
      const key = `health:${Date.now()}`;
      await cacheManager.set(key, results, {
        ttl: 24 * 60 * 60 * 1000, // 24 hours
        tags: ['health']
      });
    } catch (error) {
      logger.error('Failed to store health check results', { error: error.message });
    }
  }

  async sendWebhookAlert(alert) {
    // Placeholder for webhook integration
    logger.info('Webhook alert would be sent', alert);
  }

  generateAlertId() {
    return `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  async cleanupOldMetrics() {
    try {
      const cutoff = Date.now() - this.monitoring.retentionPeriod;

      // Clean up in-memory metrics
      for (const [name, metrics] of this.metrics.entries()) {
        const filtered = metrics.filter(m => m.timestamp > cutoff);
        this.metrics.set(name, filtered);
      }

      // Clean up cached metrics
      await cacheManager.deleteByTags(['metrics']);

      logger.debug('Old metrics cleaned up', { cutoff: new Date(cutoff) });
    } catch (error) {
      logger.error('Failed to cleanup old metrics', { error: error.message });
    }
  }

  async getSystemReport() {
    try {
      const healthChecks = await this.runHealthChecks();
      const recentMetrics = await this.getRecentMetrics();
      const activeAlerts = Array.from(this.alerts.values())
        .filter(alert => !alert.resolved);

      return {
        timestamp: Date.now(),
        systemHealth: this.calculateOverallHealth(healthChecks),
        healthChecks,
        metrics: recentMetrics,
        alerts: {
          active: activeAlerts.length,
          critical: activeAlerts.filter(a => a.severity === 'critical').length,
          warnings: activeAlerts.filter(a => a.severity === 'warning').length
        },
        performance: await this.getPerformanceSummary(),
        recommendations: this.getSystemRecommendations(healthChecks, recentMetrics)
      };
    } catch (error) {
      logger.error('Failed to generate system report', { error: error.message });
      return { error: error.message };
    }
  }

  calculateOverallHealth(healthChecks) {
    const statuses = Object.values(healthChecks).map(check => check.status);
    const healthy = statuses.filter(status => status === 'healthy').length;
    const total = statuses.length;

    if (statuses.includes('unhealthy')) return 'critical';
    if (statuses.includes('degraded')) return 'degraded';
    if (healthy === total) return 'healthy';
    return 'unknown';
  }

  async getRecentMetrics() {
    const recent = {};
    for (const [name, metrics] of this.metrics.entries()) {
      const recentMetrics = metrics.slice(-5);
      if (recentMetrics.length > 0) {
        recent[name] = {
          latest: recentMetrics[recentMetrics.length - 1],
          count: recentMetrics.length,
          average: recentMetrics.reduce((sum, m) => sum + m.value, 0) / recentMetrics.length
        };
      }
    }
    return recent;
  }

  async getPerformanceSummary() {
    const navigation = performance.getEntriesByType('navigation')[0];
    if (!navigation) return null;

    return {
      pageLoad: Math.round(navigation.loadEventEnd - navigation.fetchStart),
      domReady: Math.round(navigation.domContentLoadedEventEnd - navigation.fetchStart),
      firstPaint: this.getFirstPaint(),
      score: this.calculatePerformanceScore({
        domContentLoaded: navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart,
        loadComplete: navigation.loadEventEnd - navigation.loadEventStart,
        firstContentfulPaint: this.getFirstContentfulPaint(),
        timeToInteractive: navigation.domInteractive - navigation.fetchStart
      })
    };
  }

  getSystemRecommendations(healthChecks, metrics) {
    const recommendations = [];

    // Health-based recommendations
    Object.entries(healthChecks).forEach(([name, check]) => {
      if (check.status === 'unhealthy') {
        recommendations.push({
          type: 'critical',
          component: name,
          message: `${name} is unhealthy and requires immediate attention`
        });
      }
    });

    // Metric-based recommendations
    if (metrics['memory.usage']?.latest?.value > 0.8) {
      recommendations.push({
        type: 'warning',
        component: 'memory',
        message: 'Memory usage is high. Consider clearing caches or reducing data retention.'
      });
    }

    return recommendations;
  }

  setThreshold(metric, value) {
    this.thresholds[metric] = value;
    logger.info('Threshold updated', { metric, value });
  }

  setMonitoringEnabled(enabled) {
    this.monitoring.enabled = enabled;
    logger.info(`Monitoring ${enabled ? 'enabled' : 'disabled'}`);
  }

  addAlertChannel(channel) {
    if (!this.alertChannels.includes(channel)) {
      this.alertChannels.push(channel);
      logger.info('Alert channel added', { channel });
    }
  }

  removeAlertChannel(channel) {
    this.alertChannels = this.alertChannels.filter(c => c !== channel);
    logger.info('Alert channel removed', { channel });
  }

  destroy() {
    if (this.performanceObserver) {
      this.performanceObserver.disconnect();
    }

    this.monitoring.enabled = false;
    logger.info('Enterprise Monitoring System destroyed');
  }
}

const enterpriseMonitoring = new EnterpriseMonitoringSystem();

export default enterpriseMonitoring;
export { EnterpriseMonitoringSystem };