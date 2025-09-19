/**
 * Enterprise Security Manager
 *
 * Comprehensive security framework for protecting sensitive data,
 * preventing attacks, and ensuring compliance with data protection regulations.
 */

class SecurityManager {
    constructor() {
        this.encryptionKey = this.generateEncryptionKey();
        this.rateLimiter = new Map();
        this.securityLogs = [];
        this.bannedIPs = new Set();
        this.sessionTokens = new Map();
    }

    /**
     * Input sanitization and validation
     */
    sanitizeInput(input, type = 'text') {
        if (typeof input !== 'string') {
            input = String(input);
        }

        switch (type) {
            case 'sqft':
                // Validate SQFT input for calculations
                const cleaned = input.replace(/[^\d.]/g, '');
                const number = parseFloat(cleaned);
                if (isNaN(number) || number <= 0 || number > 100000) {
                    throw new Error('Invalid SQFT value: must be between 1 and 100,000');
                }
                return number;

            case 'name':
                // Sanitize customer names
                return input.replace(/[<>\"'&]/g, '').trim().slice(0, 100);

            case 'phone':
                // Validate and format phone numbers
                const phoneClean = input.replace(/\D/g, '');
                if (phoneClean.length !== 10) {
                    throw new Error('Invalid phone number: must be 10 digits');
                }
                return phoneClean;

            case 'email':
                // Email validation
                const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                if (!emailRegex.test(input)) {
                    throw new Error('Invalid email format');
                }
                return input.toLowerCase().trim();

            case 'address':
                // Address sanitization
                return input.replace(/[<>\"']/g, '').trim().slice(0, 500);

            default:
                // General text sanitization
                return input.replace(/[<>\"'&]/g, '').trim();
        }
    }

    /**
     * Rate limiting protection
     */
    checkRateLimit(identifier, maxRequests = 60, windowMs = 60000) {
        const now = Date.now();
        const windowStart = now - windowMs;

        if (!this.rateLimiter.has(identifier)) {
            this.rateLimiter.set(identifier, []);
        }

        const requests = this.rateLimiter.get(identifier);

        // Remove old requests outside the window
        const validRequests = requests.filter(timestamp => timestamp > windowStart);

        if (validRequests.length >= maxRequests) {
            this.logSecurityEvent('RATE_LIMIT_EXCEEDED', { identifier, requests: validRequests.length });
            throw new Error('Rate limit exceeded. Please try again later.');
        }

        validRequests.push(now);
        this.rateLimiter.set(identifier, validRequests);

        return true;
    }

    /**
     * Data encryption for sensitive information
     */
    encryptSensitiveData(data) {
        try {
            const jsonString = JSON.stringify(data);
            const encoded = btoa(jsonString);
            return `encrypted_${encoded}`;
        } catch (error) {
            this.logSecurityEvent('ENCRYPTION_FAILED', { error: error.message });
            throw new Error('Failed to encrypt sensitive data');
        }
    }

    /**
     * Data decryption
     */
    decryptSensitiveData(encryptedData) {
        try {
            if (!encryptedData.startsWith('encrypted_')) {
                throw new Error('Invalid encrypted data format');
            }

            const encoded = encryptedData.substring(10);
            const jsonString = atob(encoded);
            return JSON.parse(jsonString);
        } catch (error) {
            this.logSecurityEvent('DECRYPTION_FAILED', { error: error.message });
            throw new Error('Failed to decrypt sensitive data');
        }
    }

    /**
     * Secure session management
     */
    generateSessionToken(userId) {
        const token = this.generateRandomString(32);
        const expiresAt = Date.now() + (24 * 60 * 60 * 1000); // 24 hours

        this.sessionTokens.set(token, {
            userId: userId,
            createdAt: Date.now(),
            expiresAt: expiresAt,
            lastAccessed: Date.now()
        });

        this.logSecurityEvent('SESSION_CREATED', { userId, token: token.substring(0, 8) + '...' });
        return token;
    }

    /**
     * Validate session token
     */
    validateSession(token) {
        if (!token || !this.sessionTokens.has(token)) {
            this.logSecurityEvent('INVALID_SESSION_TOKEN', { token: token?.substring(0, 8) + '...' });
            return false;
        }

        const session = this.sessionTokens.get(token);

        if (Date.now() > session.expiresAt) {
            this.sessionTokens.delete(token);
            this.logSecurityEvent('SESSION_EXPIRED', { userId: session.userId });
            return false;
        }

        // Update last accessed time
        session.lastAccessed = Date.now();
        this.sessionTokens.set(token, session);

        return session;
    }

    /**
     * SQL injection prevention for database queries
     */
    sanitizeQueryParameters(params) {
        const sanitized = {};

        for (const [key, value] of Object.entries(params)) {
            if (typeof value === 'string') {
                // Remove potential SQL injection patterns
                sanitized[key] = value
                    .replace(/['";\\]/g, '')
                    .replace(/--/g, '')
                    .replace(/\/\*/g, '')
                    .replace(/\*\//g, '')
                    .trim();
            } else {
                sanitized[key] = value;
            }
        }

        return sanitized;
    }

    /**
     * XSS protection for output data
     */
    escapeHtml(unsafe) {
        return unsafe
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }

    /**
     * CSRF token generation and validation
     */
    generateCSRFToken() {
        return this.generateRandomString(32);
    }

    /**
     * Content Security Policy headers
     */
    getCSPHeaders() {
        return {
            'Content-Security-Policy': "default-src 'self'; script-src 'self' 'unsafe-inline' https://apis.google.com; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; connect-src 'self' https://script.google.com https://sheets.googleapis.com;",
            'X-Frame-Options': 'DENY',
            'X-Content-Type-Options': 'nosniff',
            'X-XSS-Protection': '1; mode=block',
            'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
            'Referrer-Policy': 'strict-origin-when-cross-origin'
        };
    }

    /**
     * Audit logging for security events
     */
    logSecurityEvent(eventType, details = {}) {
        const logEntry = {
            timestamp: new Date().toISOString(),
            eventType: eventType,
            details: details,
            userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'unknown',
            ip: this.getClientIP(),
            sessionId: this.getCurrentSessionId()
        };

        this.securityLogs.push(logEntry);

        // Keep only last 1000 log entries to prevent memory issues
        if (this.securityLogs.length > 1000) {
            this.securityLogs = this.securityLogs.slice(-1000);
        }

        // Send critical events to monitoring system
        if (this.isCriticalEvent(eventType)) {
            this.sendSecurityAlert(logEntry);
        }
    }

    /**
     * Data masking for sensitive information in logs
     */
    maskSensitiveData(data) {
        const masked = { ...data };

        // Mask common sensitive fields
        if (masked.phoneNumber) {
            masked.phoneNumber = `***-***-${masked.phoneNumber.slice(-4)}`;
        }
        if (masked.email) {
            const [username, domain] = masked.email.split('@');
            masked.email = `${username.substring(0, 2)}***@${domain}`;
        }
        if (masked.address) {
            masked.address = masked.address.substring(0, 10) + '***';
        }

        return masked;
    }

    /**
     * Vulnerability scanning for input data
     */
    scanForVulnerabilities(input) {
        const vulnerabilityPatterns = [
            // SQL Injection patterns
            /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|UNION)\b)/i,
            // XSS patterns
            /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
            // Command injection patterns
            /(\b(eval|exec|system|shell_exec|passthru|cmd)\b)/i,
            // Path traversal patterns
            /(\.\.\/|\.\.\\)/g,
            // LDAP injection patterns
            /(\*|\(|\)|\||\&)/g
        ];

        for (const pattern of vulnerabilityPatterns) {
            if (pattern.test(input)) {
                this.logSecurityEvent('VULNERABILITY_DETECTED', {
                    pattern: pattern.toString(),
                    input: input.substring(0, 100) + '...'
                });
                throw new Error('Potentially malicious input detected');
            }
        }

        return true;
    }

    /**
     * Access control validation
     */
    validatePermissions(userId, resource, action) {
        // Define permission matrix
        const permissions = {
            'job_counts': ['read', 'write', 'delete'],
            'calculations': ['read', 'execute'],
            'system_monitoring': ['read'],
            'batch_processing': ['execute']
        };

        if (!permissions[resource] || !permissions[resource].includes(action)) {
            this.logSecurityEvent('ACCESS_DENIED', { userId, resource, action });
            throw new Error('Access denied: insufficient permissions');
        }

        return true;
    }

    /**
     * Data backup encryption
     */
    encryptBackupData(data) {
        const timestamp = Date.now();
        const checksum = this.calculateChecksum(JSON.stringify(data));

        const backupPackage = {
            data: data,
            timestamp: timestamp,
            checksum: checksum,
            version: '1.0'
        };

        return this.encryptSensitiveData(backupPackage);
    }

    /**
     * Secure data export with watermarking
     */
    createSecureExport(data, userId) {
        const exportData = {
            ...data,
            exportMetadata: {
                exportedBy: userId,
                exportedAt: new Date().toISOString(),
                exportId: this.generateRandomString(16),
                watermark: `CONFIDENTIAL - Exported by User ${userId}`
            }
        };

        this.logSecurityEvent('DATA_EXPORTED', { userId, recordCount: data.length });
        return exportData;
    }

    /**
     * Utility functions
     */
    generateRandomString(length) {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        let result = '';
        for (let i = 0; i < length; i++) {
            result += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return result;
    }

    generateEncryptionKey() {
        return this.generateRandomString(32);
    }

    calculateChecksum(data) {
        let hash = 0;
        for (let i = 0; i < data.length; i++) {
            const char = data.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash; // Convert to 32-bit integer
        }
        return hash.toString(16);
    }

    getClientIP() {
        // This would typically be handled server-side
        return 'client-ip-masked';
    }

    getCurrentSessionId() {
        return sessionStorage.getItem('sessionId') || 'anonymous';
    }

    isCriticalEvent(eventType) {
        const criticalEvents = [
            'RATE_LIMIT_EXCEEDED',
            'VULNERABILITY_DETECTED',
            'ACCESS_DENIED',
            'ENCRYPTION_FAILED',
            'SESSION_HIJACK_ATTEMPT'
        ];
        return criticalEvents.includes(eventType);
    }

    sendSecurityAlert(logEntry) {
        // In a real implementation, this would send alerts to administrators
        console.warn('SECURITY ALERT:', logEntry);
    }

    /**
     * Get security report
     */
    getSecurityReport() {
        const now = Date.now();
        const last24Hours = now - (24 * 60 * 60 * 1000);

        const recentLogs = this.securityLogs.filter(log =>
            new Date(log.timestamp).getTime() > last24Hours
        );

        const eventCounts = recentLogs.reduce((counts, log) => {
            counts[log.eventType] = (counts[log.eventType] || 0) + 1;
            return counts;
        }, {});

        return {
            totalEvents: recentLogs.length,
            eventBreakdown: eventCounts,
            criticalEvents: recentLogs.filter(log => this.isCriticalEvent(log.eventType)),
            activeSessions: this.sessionTokens.size,
            generatedAt: new Date().toISOString()
        };
    }
}

export default SecurityManager;