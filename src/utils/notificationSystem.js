/**
 * Advanced Real-time Notification & Alert System
 *
 * Enterprise-grade notification management with multi-channel delivery,
 * smart filtering, priority queuing, and persistent storage.
 */

class NotificationSystem {
    constructor() {
        this.notifications = new Map();
        this.subscribers = new Set();
        this.alertRules = new Map();
        this.notificationHistory = [];
        this.channels = {
            ui: true,
            email: false,
            sms: false,
            webhook: false
        };
        this.priorities = {
            critical: 1,
            high: 2,
            medium: 3,
            low: 4,
            info: 5
        };
        this.maxNotifications = 100;
        this.maxHistorySize = 1000;
        this.autoCleanupInterval = 300000; // 5 minutes

        this.initializeSystem();
    }

    /**
     * Initialize notification system
     */
    initializeSystem() {
        // Load persisted notifications
        this.loadNotificationsFromStorage();

        // Set up auto-cleanup
        setInterval(() => {
            this.cleanupExpiredNotifications();
        }, this.autoCleanupInterval);

        // Set up performance monitoring
        this.setupPerformanceMonitoring();

        // Initialize alert rules
        this.setupDefaultAlertRules();
    }

    /**
     * Create and dispatch notification
     */
    createNotification(options) {
        const notification = {
            id: this.generateNotificationId(),
            title: options.title || 'Notification',
            message: options.message || '',
            type: options.type || 'info', // success, error, warning, info, critical
            priority: options.priority || 'medium',
            source: options.source || 'system',
            timestamp: new Date().toISOString(),
            read: false,
            persistent: options.persistent || false,
            expiresAt: options.expiresAt || this.calculateExpiration(options.type),
            actions: options.actions || [],
            metadata: options.metadata || {},
            channels: options.channels || ['ui'],
            retryCount: 0,
            maxRetries: options.maxRetries || 3
        };

        // Apply alert rules
        this.applyAlertRules(notification);

        // Store notification
        this.notifications.set(notification.id, notification);

        // Add to history
        this.addToHistory(notification);

        // Dispatch to channels
        this.dispatchToChannels(notification);

        // Notify subscribers
        this.notifySubscribers('notification_created', notification);

        // Persist to storage
        this.saveNotificationsToStorage();

        return notification;
    }

    /**
     * System monitoring notifications
     */
    createSystemAlert(alertType, data) {
        const alertConfigs = {
            automation_failure: {
                title: 'Automation System Failure',
                type: 'critical',
                priority: 'critical',
                persistent: true,
                channels: ['ui', 'email'],
                actions: [
                    { label: 'Run Diagnostics', action: 'run_diagnostics' },
                    { label: 'Switch to Manual', action: 'enable_manual_mode' }
                ]
            },
            calculation_error: {
                title: 'Calculation Error Detected',
                type: 'error',
                priority: 'high',
                channels: ['ui'],
                actions: [
                    { label: 'Retry Calculation', action: 'retry_calculation' },
                    { label: 'Use Fallback', action: 'use_fallback' }
                ]
            },
            performance_degradation: {
                title: 'Performance Degradation Alert',
                type: 'warning',
                priority: 'medium',
                channels: ['ui'],
                actions: [
                    { label: 'View Metrics', action: 'view_performance' },
                    { label: 'Optimize System', action: 'optimize_system' }
                ]
            },
            batch_complete: {
                title: 'Batch Processing Complete',
                type: 'success',
                priority: 'low',
                channels: ['ui'],
                actions: [
                    { label: 'View Results', action: 'view_batch_results' }
                ]
            },
            security_alert: {
                title: 'Security Alert',
                type: 'critical',
                priority: 'critical',
                persistent: true,
                channels: ['ui', 'email'],
                actions: [
                    { label: 'Review Logs', action: 'review_security_logs' },
                    { label: 'Block IP', action: 'block_suspicious_ip' }
                ]
            }
        };

        const config = alertConfigs[alertType] || alertConfigs.automation_failure;

        return this.createNotification({
            ...config,
            message: this.generateAlertMessage(alertType, data),
            source: 'system_monitor',
            metadata: {
                alertType: alertType,
                alertData: data,
                systemState: this.getSystemState()
            }
        });
    }

    /**
     * Business logic notifications
     */
    createBusinessAlert(eventType, data) {
        const businessConfigs = {
            new_lead: {
                title: 'New Lead Created',
                type: 'info',
                priority: 'medium',
                message: `New lead: ${data.customerName || 'Unknown'}`
            },
            quote_generated: {
                title: 'Quote Generated',
                type: 'success',
                priority: 'medium',
                message: `Quote of $${data.amount} generated for ${data.customerName}`
            },
            calculation_completed: {
                title: 'Vent Calculation Completed',
                type: 'success',
                priority: 'low',
                message: `Calculation completed for ${data.sqft} sq ft via ${data.method}`
            },
            high_value_quote: {
                title: 'High Value Quote Alert',
                type: 'warning',
                priority: 'high',
                message: `High value quote: $${data.amount} for ${data.customerName}`,
                persistent: true,
                actions: [
                    { label: 'Review Quote', action: 'review_quote' },
                    { label: 'Contact Customer', action: 'contact_customer' }
                ]
            }
        };

        const config = businessConfigs[eventType] || businessConfigs.new_lead;

        return this.createNotification({
            ...config,
            source: 'business_logic',
            metadata: {
                eventType: eventType,
                eventData: data
            }
        });
    }

    /**
     * Real-time progress notifications
     */
    createProgressNotification(processId, progress) {
        const existingNotification = Array.from(this.notifications.values())
            .find(n => n.metadata.processId === processId);

        if (existingNotification) {
            // Update existing progress notification
            existingNotification.message = `${progress.current}/${progress.total} - ${progress.status}`;
            existingNotification.metadata.progress = progress;
            existingNotification.timestamp = new Date().toISOString();

            this.notifySubscribers('notification_updated', existingNotification);
        } else {
            // Create new progress notification
            return this.createNotification({
                title: progress.title || 'Processing...',
                message: `${progress.current}/${progress.total} - ${progress.status}`,
                type: 'info',
                priority: 'low',
                source: 'progress_tracker',
                persistent: false,
                metadata: {
                    processId: processId,
                    progress: progress
                }
            });
        }
    }

    /**
     * Smart notification filtering
     */
    applyAlertRules(notification) {
        for (const [, rule] of this.alertRules) {
            if (this.matchesRule(notification, rule)) {
                // Apply rule modifications
                if (rule.escalate) {
                    notification.priority = 'critical';
                    notification.persistent = true;
                }
                if (rule.suppress) {
                    notification.channels = [];
                }
                if (rule.addChannels) {
                    notification.channels = [...notification.channels, ...rule.addChannels];
                }
                if (rule.customMessage) {
                    notification.message = rule.customMessage(notification);
                }
            }
        }
    }

    /**
     * Multi-channel notification dispatch
     */
    async dispatchToChannels(notification) {
        const promises = notification.channels.map(channel => {
            switch (channel) {
                case 'ui':
                    return this.sendUINotification(notification);
                case 'email':
                    return this.sendEmailNotification(notification);
                case 'sms':
                    return this.sendSMSNotification(notification);
                case 'webhook':
                    return this.sendWebhookNotification(notification);
                case 'browser':
                    return this.sendBrowserNotification(notification);
                default:
                    return Promise.resolve();
            }
        });

        try {
            await Promise.allSettled(promises);
        } catch (error) {
            console.error('Error dispatching notification:', error);
            this.handleDeliveryFailure(notification, error);
        }
    }

    /**
     * UI notification delivery
     */
    sendUINotification(notification) {
        // Add visual indicators based on priority
        const uiNotification = {
            ...notification,
            className: this.getUIClassName(notification),
            icon: this.getNotificationIcon(notification.type),
            autoHide: !notification.persistent,
            hideDelay: this.getHideDelay(notification.priority)
        };

        this.notifySubscribers('ui_notification', uiNotification);
        return Promise.resolve();
    }

    /**
     * Browser push notification
     */
    async sendBrowserNotification(notification) {
        if ('Notification' in window && Notification.permission === 'granted') {
            const browserNotification = new Notification(notification.title, {
                body: notification.message,
                icon: '/favicon.ico',
                tag: notification.id,
                requireInteraction: notification.persistent,
                actions: notification.actions.slice(0, 2) // Browser supports max 2 actions
            });

            browserNotification.onclick = () => {
                window.focus();
                this.markAsRead(notification.id);
            };

            return Promise.resolve();
        }
        return Promise.reject('Browser notifications not supported or permission denied');
    }

    /**
     * Email notification (placeholder for actual implementation)
     */
    async sendEmailNotification(notification) {
        // In a real implementation, this would integrate with an email service
        console.log('Email notification would be sent:', notification);
        return Promise.resolve();
    }

    /**
     * SMS notification (placeholder for actual implementation)
     */
    async sendSMSNotification(notification) {
        // In a real implementation, this would integrate with an SMS service
        console.log('SMS notification would be sent:', notification);
        return Promise.resolve();
    }

    /**
     * Webhook notification (placeholder for actual implementation)
     */
    async sendWebhookNotification(notification) {
        // In a real implementation, this would send HTTP POST to configured webhooks
        console.log('Webhook notification would be sent:', notification);
        return Promise.resolve();
    }

    /**
     * Notification management
     */
    getNotifications(filters = {}) {
        let notifications = Array.from(this.notifications.values());

        // Apply filters
        if (filters.unreadOnly) {
            notifications = notifications.filter(n => !n.read);
        }
        if (filters.type) {
            notifications = notifications.filter(n => n.type === filters.type);
        }
        if (filters.priority) {
            notifications = notifications.filter(n => n.priority === filters.priority);
        }
        if (filters.source) {
            notifications = notifications.filter(n => n.source === filters.source);
        }

        // Sort by priority and timestamp
        notifications.sort((a, b) => {
            const priorityDiff = this.priorities[a.priority] - this.priorities[b.priority];
            if (priorityDiff !== 0) return priorityDiff;
            return new Date(b.timestamp) - new Date(a.timestamp);
        });

        return notifications;
    }

    /**
     * Mark notification as read
     */
    markAsRead(notificationId) {
        const notification = this.notifications.get(notificationId);
        if (notification) {
            notification.read = true;
            notification.readAt = new Date().toISOString();
            this.notifySubscribers('notification_read', notification);
            this.saveNotificationsToStorage();
        }
    }

    /**
     * Mark all notifications as read
     */
    markAllAsRead(filters = {}) {
        const notifications = this.getNotifications(filters);
        notifications.forEach(notification => {
            this.markAsRead(notification.id);
        });
    }

    /**
     * Dismiss notification
     */
    dismissNotification(notificationId) {
        const notification = this.notifications.get(notificationId);
        if (notification && !notification.persistent) {
            this.notifications.delete(notificationId);
            this.notifySubscribers('notification_dismissed', notification);
            this.saveNotificationsToStorage();
        }
    }

    /**
     * Clear all notifications
     */
    clearAllNotifications(includePersistent = false) {
        if (includePersistent) {
            this.notifications.clear();
        } else {
            for (const [id, notification] of this.notifications) {
                if (!notification.persistent) {
                    this.notifications.delete(id);
                }
            }
        }
        this.notifySubscribers('notifications_cleared');
        this.saveNotificationsToStorage();
    }

    /**
     * Subscription management
     */
    subscribe(callback) {
        this.subscribers.add(callback);
        return () => this.subscribers.delete(callback);
    }

    notifySubscribers(event, data) {
        this.subscribers.forEach(callback => {
            try {
                callback(event, data);
            } catch (error) {
                console.error('Error in notification subscriber:', error);
            }
        });
    }

    /**
     * Alert rules management
     */
    setupDefaultAlertRules() {
        // High frequency error suppression
        this.addAlertRule('suppress_duplicate_errors', {
            conditions: {
                type: 'error',
                frequency: { count: 5, window: 300000 } // 5 errors in 5 minutes
            },
            action: { suppress: true }
        });

        // Critical error escalation
        this.addAlertRule('escalate_critical', {
            conditions: {
                type: 'critical'
            },
            action: { escalate: true, addChannels: ['email', 'browser'] }
        });

        // Business hours filtering
        this.addAlertRule('business_hours_only', {
            conditions: {
                priority: 'low',
                timeFilter: { startHour: 9, endHour: 17 }
            },
            action: {
                suppress: (notification) => !this.isBusinessHours(),
                customMessage: (notification) => `${notification.message} (Business hours only)`
            }
        });
    }

    addAlertRule(ruleId, rule) {
        this.alertRules.set(ruleId, rule);
    }

    removeAlertRule(ruleId) {
        this.alertRules.delete(ruleId);
    }

    /**
     * Utility functions
     */
    generateNotificationId() {
        return `notification_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    calculateExpiration(type) {
        const expirationTimes = {
            critical: null, // Never expires
            error: 24 * 60 * 60 * 1000, // 24 hours
            warning: 12 * 60 * 60 * 1000, // 12 hours
            success: 6 * 60 * 60 * 1000, // 6 hours
            info: 3 * 60 * 60 * 1000 // 3 hours
        };

        const expiration = expirationTimes[type] || expirationTimes.info;
        return expiration ? new Date(Date.now() + expiration).toISOString() : null;
    }

    getUIClassName(notification) {
        const baseClass = 'notification';
        const typeClass = `notification-${notification.type}`;
        const priorityClass = `notification-priority-${notification.priority}`;
        return `${baseClass} ${typeClass} ${priorityClass}`;
    }

    getNotificationIcon(type) {
        const icons = {
            success: '✅',
            error: '❌',
            warning: '⚠️',
            info: 'ℹ️',
            critical: '🚨'
        };
        return icons[type] || icons.info;
    }

    getHideDelay(priority) {
        const delays = {
            critical: 0, // Don't auto-hide
            high: 10000, // 10 seconds
            medium: 7000, // 7 seconds
            low: 5000, // 5 seconds
            info: 3000 // 3 seconds
        };
        return delays[priority] || delays.info;
    }

    matchesRule(notification, rule) {
        const conditions = rule.conditions;

        // Check basic conditions
        if (conditions.type && notification.type !== conditions.type) return false;
        if (conditions.priority && notification.priority !== conditions.priority) return false;
        if (conditions.source && notification.source !== conditions.source) return false;

        // Check frequency conditions
        if (conditions.frequency) {
            const recentNotifications = this.getRecentNotifications(
                conditions.frequency.window,
                { type: notification.type, message: notification.message }
            );
            if (recentNotifications.length < conditions.frequency.count) return false;
        }

        // Check time filters
        if (conditions.timeFilter) {
            const now = new Date();
            const hour = now.getHours();
            if (hour < conditions.timeFilter.startHour || hour > conditions.timeFilter.endHour) {
                return false;
            }
        }

        return true;
    }

    getRecentNotifications(windowMs, filters = {}) {
        const cutoff = Date.now() - windowMs;
        return this.notificationHistory.filter(notification => {
            const notificationTime = new Date(notification.timestamp).getTime();
            if (notificationTime < cutoff) return false;

            if (filters.type && notification.type !== filters.type) return false;
            if (filters.message && notification.message !== filters.message) return false;

            return true;
        });
    }

    isBusinessHours() {
        const now = new Date();
        const hour = now.getHours();
        const day = now.getDay(); // 0 = Sunday, 6 = Saturday
        return day >= 1 && day <= 5 && hour >= 9 && hour <= 17;
    }

    addToHistory(notification) {
        this.notificationHistory.push({
            id: notification.id,
            type: notification.type,
            message: notification.message,
            timestamp: notification.timestamp
        });

        // Keep history size manageable
        if (this.notificationHistory.length > this.maxHistorySize) {
            this.notificationHistory = this.notificationHistory.slice(-this.maxHistorySize);
        }
    }

    cleanupExpiredNotifications() {
        const now = Date.now();
        const toDelete = [];

        for (const [id, notification] of this.notifications) {
            if (notification.expiresAt && new Date(notification.expiresAt).getTime() < now) {
                toDelete.push(id);
            }
        }

        toDelete.forEach(id => {
            this.notifications.delete(id);
        });

        if (toDelete.length > 0) {
            this.saveNotificationsToStorage();
        }
    }

    setupPerformanceMonitoring() {
        // Monitor notification system performance
        setInterval(() => {
            const metrics = {
                totalNotifications: this.notifications.size,
                unreadNotifications: Array.from(this.notifications.values()).filter(n => !n.read).length,
                criticalNotifications: Array.from(this.notifications.values()).filter(n => n.priority === 'critical').length,
                memoryUsage: this.calculateMemoryUsage()
            };

            // Alert if system is overloaded
            if (metrics.totalNotifications > this.maxNotifications) {
                this.createSystemAlert('notification_overload', metrics);
                this.performEmergencyCleanup();
            }
        }, 60000); // Check every minute
    }

    calculateMemoryUsage() {
        return JSON.stringify(Array.from(this.notifications.values())).length;
    }

    performEmergencyCleanup() {
        // Keep only critical and high priority notifications
        for (const [id, notification] of this.notifications) {
            if (!['critical', 'high'].includes(notification.priority)) {
                this.notifications.delete(id);
            }
        }
        this.saveNotificationsToStorage();
    }

    generateAlertMessage(alertType, data) {
        const messages = {
            automation_failure: `Automation system failed: ${data.error || 'Unknown error'}`,
            calculation_error: `Calculation failed for ${data.sqft || 'unknown'} sq ft: ${data.error || 'Unknown error'}`,
            performance_degradation: `System performance degraded: ${data.metric || 'response time'} is ${data.value || 'high'}`,
            batch_complete: `Batch processing completed: ${data.processed || 0} items processed, ${data.errors || 0} errors`,
            security_alert: `Security threat detected: ${data.threat || 'Unknown threat'} from ${data.source || 'unknown source'}`
        };

        return messages[alertType] || `System alert: ${alertType}`;
    }

    getSystemState() {
        return {
            timestamp: new Date().toISOString(),
            notificationCount: this.notifications.size,
            subscriberCount: this.subscribers.size,
            alertRuleCount: this.alertRules.size
        };
    }

    handleDeliveryFailure(notification, error) {
        notification.retryCount++;

        if (notification.retryCount < notification.maxRetries) {
            // Schedule retry
            setTimeout(() => {
                this.dispatchToChannels(notification);
            }, Math.pow(2, notification.retryCount) * 1000); // Exponential backoff
        } else {
            // Log failure and create alert
            this.createSystemAlert('notification_delivery_failed', {
                notificationId: notification.id,
                error: error.message,
                retryCount: notification.retryCount
            });
        }
    }

    /**
     * Persistence
     */
    saveNotificationsToStorage() {
        try {
            const data = {
                notifications: Array.from(this.notifications.entries()),
                history: this.notificationHistory.slice(-100), // Keep last 100 in storage
                timestamp: new Date().toISOString()
            };
            localStorage.setItem('crm_notifications', JSON.stringify(data));
        } catch (error) {
            console.error('Failed to save notifications to storage:', error);
        }
    }

    loadNotificationsFromStorage() {
        try {
            const data = localStorage.getItem('crm_notifications');
            if (data) {
                const parsed = JSON.parse(data);
                this.notifications = new Map(parsed.notifications || []);
                this.notificationHistory = parsed.history || [];

                // Clean up expired notifications on load
                this.cleanupExpiredNotifications();
            }
        } catch (error) {
            console.error('Failed to load notifications from storage:', error);
        }
    }

    /**
     * Get notification statistics
     */
    getStatistics() {
        const notifications = Array.from(this.notifications.values());

        return {
            total: notifications.length,
            unread: notifications.filter(n => !n.read).length,
            byType: notifications.reduce((acc, n) => {
                acc[n.type] = (acc[n.type] || 0) + 1;
                return acc;
            }, {}),
            byPriority: notifications.reduce((acc, n) => {
                acc[n.priority] = (acc[n.priority] || 0) + 1;
                return acc;
            }, {}),
            bySource: notifications.reduce((acc, n) => {
                acc[n.source] = (acc[n.source] || 0) + 1;
                return acc;
            }, {}),
            persistent: notifications.filter(n => n.persistent).length,
            historySize: this.notificationHistory.length,
            subscriberCount: this.subscribers.size,
            alertRuleCount: this.alertRules.size
        };
    }
}

export default NotificationSystem;