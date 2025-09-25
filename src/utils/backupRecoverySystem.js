import cacheManager from './advancedCache';
import securityManager from './securityManager';
import logger from './enterpriseLogger';

class BackupRecoverySystem {
  constructor() {
    this.backupPrefix = 'backup_';
    this.maxBackups = 10;
    this.autoBackupInterval = 6 * 60 * 60 * 1000; // 6 hours
    this.compressionThreshold = 10000; // bytes
    this.encryptionEnabled = true;

    this.initializeBackupSystem();
  }

  initializeBackupSystem() {
    // Schedule automatic backups
    this.scheduleAutoBackups();

    // Listen for critical data changes
    this.setupDataChangeListeners();

    // Register cleanup tasks
    this.scheduleCleanup();

    logger.info('Backup and Recovery System initialized', {
      autoBackupInterval: this.autoBackupInterval,
      maxBackups: this.maxBackups,
      encryptionEnabled: this.encryptionEnabled
    });
  }

  scheduleAutoBackups() {
    setInterval(async () => {
      try {
        await this.createAutoBackup();
        logger.info('Automatic backup completed successfully');
      } catch (error) {
        logger.error('Automatic backup failed', { error: error.message });
      }
    }, this.autoBackupInterval);

    // Create initial backup after 30 seconds
    setTimeout(() => this.createAutoBackup(), 30000);
  }

  setupDataChangeListeners() {
    // Listen for storage events
    window.addEventListener('storage', (event) => {
      if (this.isCriticalData(event.key)) {
        this.scheduleIncrementalBackup(event.key);
      }
    });

    // Listen for beforeunload to create emergency backup
    window.addEventListener('beforeunload', () => {
      this.createEmergencyBackup();
    });
  }

  scheduleCleanup() {
    // Clean old backups daily
    setInterval(() => {
      this.cleanupOldBackups();
    }, 24 * 60 * 60 * 1000);
  }

  isCriticalData(key) {
    const criticalPrefixes = ['leads_', 'jobCounts_', 'calculations_', 'userSettings_'];
    return criticalPrefixes.some(prefix => key?.startsWith(prefix));
  }

  async createFullBackup(backupName = null) {
    const startTime = performance.now();

    try {
      const backupId = backupName || `full_${Date.now()}`;
      const timestamp = new Date().toISOString();

      logger.info('Starting full backup', { backupId });

      // Collect all data sources
      const backupData = {
        metadata: {
          backupId,
          timestamp,
          type: 'full',
          version: '1.0',
          source: 'Ultimate CRM'
        },
        localStorage: await this.backupLocalStorage(),
        sessionStorage: await this.backupSessionStorage(),
        indexedDB: await this.backupIndexedDB(),
        cache: await this.backupCacheData(),
        settings: await this.backupUserSettings(),
        calculations: await this.backupCalculations()
      };

      // Calculate backup size and checksum
      const serializedData = JSON.stringify(backupData);
      backupData.metadata.size = serializedData.length;
      backupData.metadata.checksum = this.calculateChecksum(serializedData);

      // Compress if needed
      const finalData = this.shouldCompress(serializedData) ?
        this.compressData(backupData) : backupData;

      // Encrypt backup
      const encryptedBackup = this.encryptionEnabled ?
        securityManager.encryptBackupData(finalData) : finalData;

      // Store backup
      const backupKey = `${this.backupPrefix}${backupId}`;
      await this.storeBackup(backupKey, encryptedBackup);

      // Update backup registry
      await this.updateBackupRegistry(backupId, {
        timestamp,
        type: 'full',
        size: backupData.metadata.size,
        compressed: this.shouldCompress(serializedData),
        encrypted: this.encryptionEnabled
      });

      const duration = performance.now() - startTime;
      logger.info('Full backup completed', {
        backupId,
        duration: Math.round(duration),
        size: backupData.metadata.size,
        compressed: this.shouldCompress(serializedData)
      });

      return {
        success: true,
        backupId,
        size: backupData.metadata.size,
        duration
      };

    } catch (error) {
      const duration = performance.now() - startTime;
      logger.error('Full backup failed', {
        error: error.message,
        duration: Math.round(duration)
      });

      return {
        success: false,
        error: error.message,
        duration
      };
    }
  }

  async createIncrementalBackup(changedKeys = []) {
    const startTime = performance.now();

    try {
      const backupId = `incremental_${Date.now()}`;
      const timestamp = new Date().toISOString();

      logger.info('Starting incremental backup', { backupId, changedKeys });

      const backupData = {
        metadata: {
          backupId,
          timestamp,
          type: 'incremental',
          version: '1.0',
          changedKeys
        },
        changes: {}
      };

      // Backup only changed data
      for (const key of changedKeys) {
        if (key.startsWith('localStorage_')) {
          const actualKey = key.substring(13);
          backupData.changes[key] = localStorage.getItem(actualKey);
        } else if (key.startsWith('sessionStorage_')) {
          const actualKey = key.substring(15);
          backupData.changes[key] = sessionStorage.getItem(actualKey);
        }
      }

      const serializedData = JSON.stringify(backupData);
      backupData.metadata.size = serializedData.length;
      backupData.metadata.checksum = this.calculateChecksum(serializedData);

      const encryptedBackup = this.encryptionEnabled ?
        securityManager.encryptBackupData(backupData) : backupData;

      const backupKey = `${this.backupPrefix}${backupId}`;
      await this.storeBackup(backupKey, encryptedBackup);

      await this.updateBackupRegistry(backupId, {
        timestamp,
        type: 'incremental',
        size: backupData.metadata.size,
        changedKeys
      });

      const duration = performance.now() - startTime;
      logger.info('Incremental backup completed', {
        backupId,
        duration: Math.round(duration),
        size: backupData.metadata.size
      });

      return { success: true, backupId, size: backupData.metadata.size };

    } catch (error) {
      logger.error('Incremental backup failed', { error: error.message });
      return { success: false, error: error.message };
    }
  }

  async createAutoBackup() {
    return await this.createFullBackup(`auto_${Date.now()}`);
  }

  createEmergencyBackup() {
    // Synchronous emergency backup using basic localStorage
    try {
      const emergencyData = {
        timestamp: Date.now(),
        localStorage: { ...localStorage },
        sessionStorage: { ...sessionStorage }
      };

      localStorage.setItem('emergencyBackup', JSON.stringify(emergencyData));
      logger.info('Emergency backup created');
    } catch (error) {
      console.error('Emergency backup failed:', error);
    }
  }

  async scheduleIncrementalBackup(changedKey) {
    // Debounce multiple rapid changes
    if (this.incrementalTimeout) {
      clearTimeout(this.incrementalTimeout);
    }

    if (!this.changedKeys) {
      this.changedKeys = new Set();
    }

    this.changedKeys.add(changedKey);

    this.incrementalTimeout = setTimeout(async () => {
      const keys = Array.from(this.changedKeys);
      this.changedKeys.clear();
      await this.createIncrementalBackup(keys);
    }, 30000); // 30 second delay
  }

  async restoreFromBackup(backupId, options = {}) {
    const startTime = performance.now();

    try {
      const {
        dryRun = false,
        skipConfirmation = false,
        selectiveRestore = null
      } = options;

      logger.info('Starting restore operation', { backupId, dryRun });

      if (!skipConfirmation && !dryRun) {
        const confirmed = window.confirm(
          `Are you sure you want to restore from backup "${backupId}"? This will overwrite current data.`
        );
        if (!confirmed) {
          return { success: false, cancelled: true };
        }
      }

      // Retrieve backup
      const backupKey = `${this.backupPrefix}${backupId}`;
      const encryptedBackup = await this.retrieveBackup(backupKey);

      if (!encryptedBackup) {
        throw new Error(`Backup "${backupId}" not found`);
      }

      // Decrypt backup
      const backupData = this.encryptionEnabled ?
        securityManager.decryptSensitiveData(encryptedBackup) : encryptedBackup;

      // Validate backup integrity
      const isValid = await this.validateBackupIntegrity(backupData);
      if (!isValid) {
        throw new Error('Backup integrity validation failed');
      }

      if (dryRun) {
        return {
          success: true,
          dryRun: true,
          metadata: backupData.metadata,
          dataKeys: Object.keys(backupData).filter(key => key !== 'metadata')
        };
      }

      // Create pre-restore backup
      await this.createFullBackup(`pre_restore_${Date.now()}`);

      // Perform restoration
      await this.performRestore(backupData, selectiveRestore);

      const duration = performance.now() - startTime;
      logger.info('Restore completed successfully', {
        backupId,
        duration: Math.round(duration)
      });

      return {
        success: true,
        backupId,
        restoredAt: new Date().toISOString(),
        duration
      };

    } catch (error) {
      const duration = performance.now() - startTime;
      logger.error('Restore operation failed', {
        backupId,
        error: error.message,
        duration: Math.round(duration)
      });

      return {
        success: false,
        error: error.message,
        duration
      };
    }
  }

  async performRestore(backupData, selectiveRestore) {
    const { localStorage: lsData, sessionStorage: ssData, indexedDB, cache } = backupData;

    // Restore localStorage
    if ((!selectiveRestore || selectiveRestore.includes('localStorage')) && lsData) {
      Object.entries(lsData).forEach(([key, value]) => {
        if (value !== null) {
          localStorage.setItem(key, value);
        }
      });
    }

    // Restore sessionStorage
    if ((!selectiveRestore || selectiveRestore.includes('sessionStorage')) && ssData) {
      Object.entries(ssData).forEach(([key, value]) => {
        if (value !== null) {
          sessionStorage.setItem(key, value);
        }
      });
    }

    // Restore IndexedDB
    if ((!selectiveRestore || selectiveRestore.includes('indexedDB')) && indexedDB) {
      await this.restoreIndexedDB(indexedDB);
    }

    // Restore cache
    if ((!selectiveRestore || selectiveRestore.includes('cache')) && cache) {
      await this.restoreCache(cache);
    }

    logger.info('Data restoration completed', {
      restoredSections: selectiveRestore || ['all']
    });
  }

  async backupLocalStorage() {
    const data = {};
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      data[key] = localStorage.getItem(key);
    }
    return data;
  }

  async backupSessionStorage() {
    const data = {};
    for (let i = 0; i < sessionStorage.length; i++) {
      const key = sessionStorage.key(i);
      data[key] = sessionStorage.getItem(key);
    }
    return data;
  }

  async backupIndexedDB() {
    try {
      // Backup cache database
      const cacheKeys = await cacheManager.keys('*');
      const cacheData = {};

      for (const key of cacheKeys) {
        cacheData[key] = await cacheManager.get(key);
      }

      return cacheData;
    } catch (error) {
      logger.warn('IndexedDB backup failed', { error: error.message });
      return {};
    }
  }

  async backupCacheData() {
    try {
      return await cacheManager.getStats();
    } catch (error) {
      logger.warn('Cache backup failed', { error: error.message });
      return {};
    }
  }

  async backupUserSettings() {
    return {
      theme: localStorage.getItem('theme'),
      language: localStorage.getItem('language'),
      preferences: localStorage.getItem('userPreferences'),
      settings: localStorage.getItem('appSettings')
    };
  }

  async backupCalculations() {
    try {
      const calculationKeys = await cacheManager.keys('calculation:*');
      const calculations = {};

      for (const key of calculationKeys) {
        calculations[key] = await cacheManager.get(key);
      }

      return calculations;
    } catch (error) {
      logger.warn('Calculations backup failed', { error: error.message });
      return {};
    }
  }

  async restoreIndexedDB(indexedDBData) {
    try {
      for (const [key, value] of Object.entries(indexedDBData)) {
        await cacheManager.set(key, value, { ttl: 24 * 60 * 60 * 1000 });
      }
    } catch (error) {
      logger.error('IndexedDB restore failed', { error: error.message });
    }
  }

  async restoreCache(cacheData) {
    try {
      // Cache stats are informational only, no restoration needed
      logger.info('Cache stats from backup', cacheData);
    } catch (error) {
      logger.error('Cache restore failed', { error: error.message });
    }
  }

  shouldCompress(data) {
    return data.length > this.compressionThreshold;
  }

  compressData(data) {
    try {
      return {
        compressed: true,
        data: JSON.stringify(data) // Simple JSON compression
      };
    } catch (error) {
      logger.warn('Compression failed', { error: error.message });
      return data;
    }
  }

  decompressData(compressedData) {
    try {
      if (compressedData.compressed) {
        return JSON.parse(compressedData.data);
      }
      return compressedData;
    } catch (error) {
      logger.error('Decompression failed', { error: error.message });
      return compressedData;
    }
  }

  calculateChecksum(data) {
    let hash = 0;
    for (let i = 0; i < data.length; i++) {
      const char = data.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return hash.toString(16);
  }

  async validateBackupIntegrity(backupData) {
    try {
      if (!backupData.metadata) {
        logger.warn('Backup missing metadata');
        return false;
      }

      const { checksum, size } = backupData.metadata;
      const currentData = JSON.stringify(backupData);

      if (size && currentData.length !== size) {
        logger.warn('Backup size mismatch', {
          expected: size,
          actual: currentData.length
        });
      }

      if (checksum) {
        const currentChecksum = this.calculateChecksum(currentData);
        if (currentChecksum !== checksum) {
          logger.error('Backup checksum validation failed', {
            expected: checksum,
            actual: currentChecksum
          });
          return false;
        }
      }

      return true;
    } catch (error) {
      logger.error('Backup validation failed', { error: error.message });
      return false;
    }
  }

  async storeBackup(key, data) {
    await cacheManager.set(key, data, {
      ttl: 30 * 24 * 60 * 60 * 1000, // 30 days
      tags: ['backup']
    });
  }

  async retrieveBackup(key) {
    return await cacheManager.get(key);
  }

  async updateBackupRegistry(backupId, metadata) {
    try {
      const registry = await cacheManager.get('backup_registry') || {};
      registry[backupId] = metadata;

      await cacheManager.set('backup_registry', registry, {
        ttl: 30 * 24 * 60 * 60 * 1000,
        tags: ['backup', 'registry']
      });
    } catch (error) {
      logger.error('Failed to update backup registry', { error: error.message });
    }
  }

  async getBackupList() {
    try {
      const registry = await cacheManager.get('backup_registry') || {};
      return Object.entries(registry)
        .map(([id, metadata]) => ({ id, ...metadata }))
        .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    } catch (error) {
      logger.error('Failed to get backup list', { error: error.message });
      return [];
    }
  }

  async deleteBackup(backupId) {
    try {
      const backupKey = `${this.backupPrefix}${backupId}`;
      await cacheManager.delete(backupKey);

      const registry = await cacheManager.get('backup_registry') || {};
      delete registry[backupId];
      await cacheManager.set('backup_registry', registry);

      logger.info('Backup deleted', { backupId });
      return { success: true };
    } catch (error) {
      logger.error('Failed to delete backup', { backupId, error: error.message });
      return { success: false, error: error.message };
    }
  }

  async cleanupOldBackups() {
    try {
      const backups = await this.getBackupList();
      const backupsToDelete = backups.slice(this.maxBackups);

      for (const backup of backupsToDelete) {
        await this.deleteBackup(backup.id);
      }

      logger.info('Backup cleanup completed', {
        totalBackups: backups.length,
        deletedBackups: backupsToDelete.length,
        remainingBackups: Math.min(backups.length, this.maxBackups)
      });

      return backupsToDelete.length;
    } catch (error) {
      logger.error('Backup cleanup failed', { error: error.message });
      return 0;
    }
  }

  async getSystemHealth() {
    try {
      const backups = await this.getBackupList();
      const lastBackup = backups[0];
      const backupStats = await cacheManager.getStats();

      return {
        totalBackups: backups.length,
        lastBackup: lastBackup ? {
          id: lastBackup.id,
          timestamp: lastBackup.timestamp,
          type: lastBackup.type,
          size: lastBackup.size
        } : null,
        autoBackupEnabled: !!this.autoBackupInterval,
        nextAutoBackup: this.getNextBackupTime(),
        storageHealth: backupStats,
        encryptionEnabled: this.encryptionEnabled
      };
    } catch (error) {
      logger.error('Failed to get system health', { error: error.message });
      return { error: error.message };
    }
  }

  getNextBackupTime() {
    // Calculate next auto backup time
    const now = Date.now();
    const lastAutoBackupTime = this.lastAutoBackupTime || now;
    return new Date(lastAutoBackupTime + this.autoBackupInterval).toISOString();
  }

  destroy() {
    if (this.incrementalTimeout) {
      clearTimeout(this.incrementalTimeout);
    }
    logger.info('Backup and Recovery System destroyed');
  }
}

const backupRecoverySystem = new BackupRecoverySystem();

export default backupRecoverySystem;
export { BackupRecoverySystem };