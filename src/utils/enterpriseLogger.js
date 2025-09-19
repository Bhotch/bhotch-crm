import cacheManager from './advancedCache';

class EnterpriseLogger {
  constructor() {
    this.logLevels = {
      ERROR: 0,
      WARN: 1,
      INFO: 2,
      DEBUG: 3,
      TRACE: 4
    };

    this.currentLevel = this.logLevels.INFO;
    this.logBuffer = [];
    this.maxBufferSize = 1000;
    this.flushInterval = 30000; // 30 seconds
    this.endpoints = [];
    this.metadata = this.collectMetadata();

    this.initializeLogger();
  }

  initializeLogger() {
    // Start periodic flush
    setInterval(() => this.flushLogs(), this.flushInterval);

    // Handle page unload
    window.addEventListener('beforeunload', () => this.flushLogs(true));

    // Handle visibility change
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'hidden') {
        this.flushLogs(true);
      }
    });

    // Global error handler
    window.addEventListener('error', (event) => {
      this.error('Global Error', {
        message: event.message,
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
        stack: event.error?.stack
      });
    });

    // Unhandled promise rejection handler
    window.addEventListener('unhandledrejection', (event) => {
      this.error('Unhandled Promise Rejection', {
        reason: event.reason,
        promise: event.promise
      });
    });
  }

  collectMetadata() {
    return {
      userAgent: navigator.userAgent,
      platform: navigator.platform,
      language: navigator.language,
      cookieEnabled: navigator.cookieEnabled,
      onLine: navigator.onLine,
      screen: {
        width: window.screen.width,
        height: window.screen.height,
        colorDepth: window.screen.colorDepth
      },
      viewport: {
        width: window.innerWidth,
        height: window.innerHeight
      },
      url: window.location.href,
      referrer: document.referrer,
      timestamp: Date.now(),
      sessionId: this.getSessionId(),
      userId: this.getUserId()
    };
  }

  getSessionId() {
    let sessionId = sessionStorage.getItem('loggerSessionId');
    if (!sessionId) {
      sessionId = this.generateId();
      sessionStorage.setItem('loggerSessionId', sessionId);
    }
    return sessionId;
  }

  getUserId() {
    return localStorage.getItem('userId') || 'anonymous';
  }

  generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }

  setLevel(level) {
    if (typeof level === 'string') {
      this.currentLevel = this.logLevels[level.toUpperCase()] ?? this.logLevels.INFO;
    } else {
      this.currentLevel = level;
    }
  }

  addEndpoint(endpoint) {
    this.endpoints.push(endpoint);
  }

  createLogEntry(level, message, data = {}, category = 'general') {
    return {
      id: this.generateId(),
      timestamp: Date.now(),
      level,
      message,
      category,
      data: this.sanitizeData(data),
      metadata: {
        ...this.metadata,
        url: window.location.href,
        timestamp: Date.now()
      },
      stack: this.captureStack()
    };
  }

  sanitizeData(data) {
    try {
      // Remove circular references and sensitive data
      const sanitized = JSON.parse(JSON.stringify(data, (key, value) => {
        // Remove sensitive keys
        const sensitiveKeys = ['password', 'token', 'apiKey', 'secret', 'auth'];
        if (sensitiveKeys.some(sk => key.toLowerCase().includes(sk))) {
          return '[REDACTED]';
        }

        // Handle functions
        if (typeof value === 'function') {
          return `[Function: ${value.name || 'anonymous'}]`;
        }

        return value;
      }));

      return sanitized;
    } catch (error) {
      return { error: 'Failed to sanitize data', original: String(data) };
    }
  }

  captureStack() {
    try {
      throw new Error();
    } catch (error) {
      return error.stack.split('\n').slice(3).join('\n');
    }
  }

  shouldLog(level) {
    return this.logLevels[level] <= this.currentLevel;
  }

  log(level, message, data, category) {
    if (!this.shouldLog(level)) return;

    const logEntry = this.createLogEntry(level, message, data, category);

    // Add to buffer
    this.logBuffer.push(logEntry);

    // Enforce buffer size limit
    if (this.logBuffer.length > this.maxBufferSize) {
      this.logBuffer = this.logBuffer.slice(-this.maxBufferSize);
    }

    // Console output with styling
    this.outputToConsole(logEntry);

    // Store in cache for persistence
    this.storeInCache(logEntry);

    // Auto-flush on errors
    if (level === 'ERROR') {
      setTimeout(() => this.flushLogs(true), 100);
    }
  }

  outputToConsole(logEntry) {
    const { level, message, data, timestamp } = logEntry;
    const time = new Date(timestamp).toLocaleTimeString();

    const styles = {
      ERROR: 'color: #dc2626; font-weight: bold;',
      WARN: 'color: #f59e0b; font-weight: bold;',
      INFO: 'color: #2563eb;',
      DEBUG: 'color: #7c3aed;',
      TRACE: 'color: #6b7280;'
    };

    const style = styles[level] || styles.INFO;

    console.groupCollapsed(`%c[${level}] ${time} - ${message}`, style);
    if (data && Object.keys(data).length > 0) {
      console.log('Data:', data);
    }
    console.log('Stack:', logEntry.stack);
    console.log('Metadata:', logEntry.metadata);
    console.groupEnd();
  }

  async storeInCache(logEntry) {
    try {
      const key = `log:${logEntry.id}`;
      await cacheManager.set(key, logEntry, {
        ttl: 24 * 60 * 60 * 1000, // 24 hours
        tags: ['logs', logEntry.level.toLowerCase()]
      });
    } catch (error) {
      console.warn('Failed to cache log entry:', error);
    }
  }

  async flushLogs(force = false) {
    if (this.logBuffer.length === 0) return;

    const logsToFlush = [...this.logBuffer];
    this.logBuffer = [];

    try {
      // Send to configured endpoints
      await Promise.all(
        this.endpoints.map(endpoint => this.sendToEndpoint(endpoint, logsToFlush))
      );

      // Store in persistent cache
      await this.storeLogsInCache(logsToFlush);

      console.log(`Flushed ${logsToFlush.length} log entries`);
    } catch (error) {
      console.error('Failed to flush logs:', error);
      // Restore logs to buffer if flush failed
      this.logBuffer.unshift(...logsToFlush);
    }
  }

  async sendToEndpoint(endpoint, logs) {
    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          logs,
          metadata: this.metadata
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
    } catch (error) {
      console.warn(`Failed to send logs to ${endpoint}:`, error);
    }
  }

  async storeLogsInCache(logs) {
    try {
      const batchKey = `logs:batch:${Date.now()}`;
      await cacheManager.set(batchKey, logs, {
        ttl: 7 * 24 * 60 * 60 * 1000, // 7 days
        tags: ['log-batches']
      });
    } catch (error) {
      console.warn('Failed to store logs in cache:', error);
    }
  }

  // Public logging methods
  error(message, data, category = 'error') {
    this.log('ERROR', message, data, category);
  }

  warn(message, data, category = 'warning') {
    this.log('WARN', message, data, category);
  }

  info(message, data, category = 'info') {
    this.log('INFO', message, data, category);
  }

  debug(message, data, category = 'debug') {
    this.log('DEBUG', message, data, category);
  }

  trace(message, data, category = 'trace') {
    this.log('TRACE', message, data, category);
  }

  // Business logic logging methods
  business(event, data = {}) {
    this.info(`Business Event: ${event}`, data, 'business');
  }

  security(event, data = {}) {
    this.warn(`Security Event: ${event}`, data, 'security');
  }

  performance(operation, duration, data = {}) {
    this.info(`Performance: ${operation}`, {
      duration,
      ...data
    }, 'performance');
  }

  user(action, data = {}) {
    this.info(`User Action: ${action}`, data, 'user');
  }

  api(method, url, status, duration, data = {}) {
    const level = status >= 400 ? 'ERROR' : status >= 300 ? 'WARN' : 'INFO';
    this.log(level, `API: ${method} ${url}`, {
      status,
      duration,
      ...data
    }, 'api');
  }

  // Metrics and analytics
  async getLogStatistics(timeRange = 3600000) {
    try {
      const since = Date.now() - timeRange;
      const logKeys = await cacheManager.keys('log:*');

      const logs = await Promise.all(
        logKeys.map(key => cacheManager.get(key))
      );

      const recentLogs = logs
        .filter(log => log && log.timestamp > since)
        .filter(Boolean);

      const stats = {
        total: recentLogs.length,
        byLevel: {},
        byCategory: {},
        timeRange: timeRange,
        period: {
          start: since,
          end: Date.now()
        }
      };

      recentLogs.forEach(log => {
        stats.byLevel[log.level] = (stats.byLevel[log.level] || 0) + 1;
        stats.byCategory[log.category] = (stats.byCategory[log.category] || 0) + 1;
      });

      return stats;
    } catch (error) {
      console.error('Failed to get log statistics:', error);
      return null;
    }
  }

  async exportLogs(filters = {}) {
    try {
      const { level, category, timeRange = 24 * 60 * 60 * 1000 } = filters;
      const since = Date.now() - timeRange;

      const logKeys = await cacheManager.keys('log:*');
      const logs = await Promise.all(
        logKeys.map(key => cacheManager.get(key))
      );

      let filteredLogs = logs
        .filter(log => log && log.timestamp > since)
        .filter(Boolean);

      if (level) {
        filteredLogs = filteredLogs.filter(log => log.level === level);
      }

      if (category) {
        filteredLogs = filteredLogs.filter(log => log.category === category);
      }

      // Sort by timestamp
      filteredLogs.sort((a, b) => b.timestamp - a.timestamp);

      return {
        logs: filteredLogs,
        exportedAt: Date.now(),
        filters,
        totalCount: filteredLogs.length
      };
    } catch (error) {
      console.error('Failed to export logs:', error);
      return null;
    }
  }

  async clearLogs(olderThan = 7 * 24 * 60 * 60 * 1000) {
    try {
      const cutoff = Date.now() - olderThan;
      const logKeys = await cacheManager.keys('log:*');

      let deletedCount = 0;

      for (const key of logKeys) {
        const log = await cacheManager.get(key);
        if (log && log.timestamp < cutoff) {
          await cacheManager.delete(key);
          deletedCount++;
        }
      }

      this.info('Log cleanup completed', {
        deletedCount,
        cutoffDate: new Date(cutoff).toISOString()
      }, 'system');

      return deletedCount;
    } catch (error) {
      console.error('Failed to clear logs:', error);
      return 0;
    }
  }

  destroy() {
    this.flushLogs(true);
  }
}

// Create singleton instance
const logger = new EnterpriseLogger();

// Production environment configuration
if (process.env.NODE_ENV === 'production') {
  logger.setLevel('WARN');
} else {
  logger.setLevel('DEBUG');
}

export default logger;
export { EnterpriseLogger };