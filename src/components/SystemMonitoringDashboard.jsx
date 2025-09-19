import React, { useState, useEffect, useCallback } from 'react';
import { Activity, TrendingUp, AlertTriangle, CheckCircle, Clock, Zap, Server, Database, Globe } from 'lucide-react';
import { googleSheetsService } from '../api/googleSheetsService';
import VentCalculationTestInterface from './VentCalculationTester';

function SystemMonitoringDashboard({ addNotification }) {
    const [systemStatus, setSystemStatus] = useState({
        overall: 'unknown',
        components: {},
        lastChecked: null
    });
    const [performanceMetrics, setPerformanceMetrics] = useState({
        responseTime: 0,
        successRate: 0,
        totalRequests: 0,
        errors: 0
    });
    const [isMonitoring, setIsMonitoring] = useState(false);
    const [autoRefresh, setAutoRefresh] = useState(false);

    // Component status check functions
    const checkGoogleSheetsConnection = useCallback(async () => {
        try {
            const start = Date.now();
            const response = await googleSheetsService.testConnection();
            const responseTime = Date.now() - start;

            return {
                status: response.success ? 'healthy' : 'error',
                responseTime: responseTime,
                details: response.success ? 'Connected successfully' : response.message,
                lastChecked: new Date().toISOString()
            };
        } catch (error) {
            return {
                status: 'error',
                responseTime: 0,
                details: error.message,
                lastChecked: new Date().toISOString()
            };
        }
    }, []);

    const checkLomacoCalculation = useCallback(async () => {
        try {
            const start = Date.now();
            const response = await googleSheetsService.calculateLomacoVents(2000);
            const responseTime = Date.now() - start;

            return {
                status: response.success ? 'healthy' : 'warning',
                responseTime: responseTime,
                details: response.success
                    ? `Calculation successful via ${response.calculationMethod}`
                    : response.message,
                method: response.success ? response.calculationMethod : null,
                lastChecked: new Date().toISOString()
            };
        } catch (error) {
            return {
                status: 'error',
                responseTime: 0,
                details: error.message,
                lastChecked: new Date().toISOString()
            };
        }
    }, []);

    const checkApiEndpoints = useCallback(async () => {
        const endpoints = [
            { name: 'Job Counts', action: () => googleSheetsService.fetchJobCounts() },
            { name: 'Connection Test', action: () => googleSheetsService.testConnection() }
        ];

        const results = {};
        let totalResponseTime = 0;
        let healthyCount = 0;

        for (const endpoint of endpoints) {
            try {
                const start = Date.now();
                const response = await endpoint.action();
                const responseTime = Date.now() - start;
                totalResponseTime += responseTime;

                if (response.success) {
                    healthyCount++;
                    results[endpoint.name] = {
                        status: 'healthy',
                        responseTime: responseTime,
                        details: 'Endpoint responding normally'
                    };
                } else {
                    results[endpoint.name] = {
                        status: 'warning',
                        responseTime: responseTime,
                        details: response.message || 'Endpoint returned error'
                    };
                }
            } catch (error) {
                results[endpoint.name] = {
                    status: 'error',
                    responseTime: 0,
                    details: error.message
                };
            }
        }

        return {
            status: healthyCount === endpoints.length ? 'healthy' :
                   healthyCount > 0 ? 'warning' : 'error',
            averageResponseTime: totalResponseTime / endpoints.length,
            healthyEndpoints: healthyCount,
            totalEndpoints: endpoints.length,
            endpoints: results,
            lastChecked: new Date().toISOString()
        };
    }, []);

    // Comprehensive system check
    const runSystemCheck = useCallback(async () => {
        setIsMonitoring(true);

        try {
            const [sheetsStatus, calculationStatus, apiStatus] = await Promise.all([
                checkGoogleSheetsConnection(),
                checkLomacoCalculation(),
                checkApiEndpoints()
            ]);

            const components = {
                googleSheets: sheetsStatus,
                lomacoCalculation: calculationStatus,
                apiEndpoints: apiStatus
            };

            // Determine overall system status
            const componentStatuses = Object.values(components).map(c => c.status);
            const overallStatus = componentStatuses.every(s => s === 'healthy') ? 'healthy' :
                                componentStatuses.some(s => s === 'healthy') ? 'warning' : 'error';

            setSystemStatus({
                overall: overallStatus,
                components: components,
                lastChecked: new Date().toISOString()
            });

            // Update performance metrics
            const avgResponseTime = (
                sheetsStatus.responseTime +
                calculationStatus.responseTime +
                apiStatus.averageResponseTime
            ) / 3;

            setPerformanceMetrics(prev => ({
                responseTime: Math.round(avgResponseTime),
                successRate: Math.round((componentStatuses.filter(s => s === 'healthy').length / componentStatuses.length) * 100),
                totalRequests: prev.totalRequests + 3,
                errors: prev.errors + componentStatuses.filter(s => s === 'error').length
            }));

        } catch (error) {
            addNotification(`System check failed: ${error.message}`, 'error');
        } finally {
            setIsMonitoring(false);
        }
    }, [checkGoogleSheetsConnection, checkLomacoCalculation, checkApiEndpoints, addNotification]);

    // Auto-refresh functionality
    useEffect(() => {
        let interval;
        if (autoRefresh) {
            interval = setInterval(runSystemCheck, 30000); // Check every 30 seconds
        }
        return () => {
            if (interval) clearInterval(interval);
        };
    }, [autoRefresh, runSystemCheck]);

    // Initial system check
    useEffect(() => {
        runSystemCheck();
    }, [runSystemCheck]);

    const getStatusIcon = (status) => {
        switch (status) {
            case 'healthy': return <CheckCircle className="w-5 h-5 text-green-600" />;
            case 'warning': return <AlertTriangle className="w-5 h-5 text-yellow-600" />;
            case 'error': return <AlertTriangle className="w-5 h-5 text-red-600" />;
            default: return <Clock className="w-5 h-5 text-gray-600" />;
        }
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'healthy': return 'text-green-800 bg-green-50 border-green-200';
            case 'warning': return 'text-yellow-800 bg-yellow-50 border-yellow-200';
            case 'error': return 'text-red-800 bg-red-50 border-red-200';
            default: return 'text-gray-800 bg-gray-50 border-gray-200';
        }
    };

    const formatResponseTime = (time) => {
        if (time < 1000) return `${time}ms`;
        return `${(time / 1000).toFixed(2)}s`;
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center">
                    <Activity className="h-6 w-6 text-blue-600 mr-3" />
                    <div>
                        <h3 className="text-lg font-semibold text-gray-900">System Monitoring Dashboard</h3>
                        <p className="text-sm text-gray-600">Real-time monitoring of Lomanco automation system</p>
                    </div>
                </div>
                <div className="flex items-center space-x-3">
                    <button
                        onClick={() => setAutoRefresh(!autoRefresh)}
                        className={`px-3 py-2 text-xs font-medium border rounded-lg transition-colors ${
                            autoRefresh
                                ? 'border-blue-300 bg-blue-50 text-blue-700'
                                : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50'
                        }`}
                    >
                        {autoRefresh ? 'Stop Auto-Refresh' : 'Start Auto-Refresh'}
                    </button>
                    <button
                        onClick={runSystemCheck}
                        disabled={isMonitoring}
                        className="inline-flex items-center px-4 py-2 border border-transparent rounded-lg text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 transition-colors"
                    >
                        {isMonitoring ? (
                            <>
                                <Clock className="w-4 h-4 mr-2 animate-spin" />
                                Checking...
                            </>
                        ) : (
                            <>
                                <Activity className="w-4 h-4 mr-2" />
                                Run Check
                            </>
                        )}
                    </button>
                </div>
            </div>

            {/* Overall System Status */}
            <div className={`p-6 rounded-lg border ${getStatusColor(systemStatus.overall)}`}>
                <div className="flex items-center justify-between">
                    <div className="flex items-center">
                        {getStatusIcon(systemStatus.overall)}
                        <div className="ml-3">
                            <h4 className="text-lg font-medium">System Status</h4>
                            <p className="text-sm capitalize">{systemStatus.overall || 'Checking...'}</p>
                        </div>
                    </div>
                    <div className="text-right">
                        <div className="text-sm text-gray-600">Last Checked</div>
                        <div className="text-sm font-medium">
                            {systemStatus.lastChecked
                                ? new Date(systemStatus.lastChecked).toLocaleTimeString()
                                : 'Never'
                            }
                        </div>
                    </div>
                </div>
            </div>

            {/* Performance Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-white rounded-lg shadow-sm border p-6">
                    <div className="flex items-center">
                        <div className="flex-shrink-0">
                            <Zap className="h-8 w-8 text-blue-600" />
                        </div>
                        <div className="ml-4">
                            <p className="text-sm font-medium text-gray-600">Avg Response Time</p>
                            <p className="text-2xl font-bold text-gray-900">
                                {formatResponseTime(performanceMetrics.responseTime)}
                            </p>
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-lg shadow-sm border p-6">
                    <div className="flex items-center">
                        <div className="flex-shrink-0">
                            <TrendingUp className="h-8 w-8 text-green-600" />
                        </div>
                        <div className="ml-4">
                            <p className="text-sm font-medium text-gray-600">Success Rate</p>
                            <p className="text-2xl font-bold text-gray-900">
                                {performanceMetrics.successRate}%
                            </p>
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-lg shadow-sm border p-6">
                    <div className="flex items-center">
                        <div className="flex-shrink-0">
                            <Server className="h-8 w-8 text-purple-600" />
                        </div>
                        <div className="ml-4">
                            <p className="text-sm font-medium text-gray-600">Total Requests</p>
                            <p className="text-2xl font-bold text-gray-900">
                                {performanceMetrics.totalRequests.toLocaleString()}
                            </p>
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-lg shadow-sm border p-6">
                    <div className="flex items-center">
                        <div className="flex-shrink-0">
                            <AlertTriangle className="h-8 w-8 text-red-600" />
                        </div>
                        <div className="ml-4">
                            <p className="text-sm font-medium text-gray-600">Errors</p>
                            <p className="text-2xl font-bold text-gray-900">
                                {performanceMetrics.errors}
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Component Status Details */}
            <div className="bg-white rounded-lg shadow-sm border p-6">
                <h4 className="text-lg font-medium text-gray-900 mb-4">Component Status</h4>
                <div className="space-y-4">
                    {/* Google Sheets Connection */}
                    {systemStatus.components.googleSheets && (
                        <div className={`p-4 rounded-lg border ${getStatusColor(systemStatus.components.googleSheets.status)}`}>
                            <div className="flex items-center justify-between">
                                <div className="flex items-center">
                                    <Database className="w-5 h-5 mr-3" />
                                    <div>
                                        <div className="font-medium">Google Sheets Connection</div>
                                        <div className="text-sm">{systemStatus.components.googleSheets.details}</div>
                                    </div>
                                </div>
                                <div className="text-right">
                                    {getStatusIcon(systemStatus.components.googleSheets.status)}
                                    <div className="text-sm mt-1">
                                        {formatResponseTime(systemStatus.components.googleSheets.responseTime)}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Lomanco Calculation */}
                    {systemStatus.components.lomacoCalculation && (
                        <div className={`p-4 rounded-lg border ${getStatusColor(systemStatus.components.lomacoCalculation.status)}`}>
                            <div className="flex items-center justify-between">
                                <div className="flex items-center">
                                    <Globe className="w-5 h-5 mr-3" />
                                    <div>
                                        <div className="font-medium">Lomanco Calculation Engine</div>
                                        <div className="text-sm">{systemStatus.components.lomacoCalculation.details}</div>
                                        {systemStatus.components.lomacoCalculation.method && (
                                            <div className="text-xs text-gray-500 mt-1">
                                                Method: {systemStatus.components.lomacoCalculation.method}
                                            </div>
                                        )}
                                    </div>
                                </div>
                                <div className="text-right">
                                    {getStatusIcon(systemStatus.components.lomacoCalculation.status)}
                                    <div className="text-sm mt-1">
                                        {formatResponseTime(systemStatus.components.lomacoCalculation.responseTime)}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* API Endpoints */}
                    {systemStatus.components.apiEndpoints && (
                        <div className={`p-4 rounded-lg border ${getStatusColor(systemStatus.components.apiEndpoints.status)}`}>
                            <div className="flex items-center justify-between">
                                <div className="flex items-center">
                                    <Server className="w-5 h-5 mr-3" />
                                    <div>
                                        <div className="font-medium">API Endpoints</div>
                                        <div className="text-sm">
                                            {systemStatus.components.apiEndpoints.healthyEndpoints}/
                                            {systemStatus.components.apiEndpoints.totalEndpoints} endpoints healthy
                                        </div>
                                    </div>
                                </div>
                                <div className="text-right">
                                    {getStatusIcon(systemStatus.components.apiEndpoints.status)}
                                    <div className="text-sm mt-1">
                                        {formatResponseTime(systemStatus.components.apiEndpoints.averageResponseTime)}
                                    </div>
                                </div>
                            </div>

                            {/* Individual Endpoint Details */}
                            {systemStatus.components.apiEndpoints.endpoints && (
                                <div className="mt-3 space-y-2">
                                    {Object.entries(systemStatus.components.apiEndpoints.endpoints).map(([name, endpoint]) => (
                                        <div key={name} className="flex items-center justify-between text-sm pl-8">
                                            <span>{name}</span>
                                            <div className="flex items-center">
                                                {getStatusIcon(endpoint.status)}
                                                <span className="ml-2">{formatResponseTime(endpoint.responseTime)}</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* Testing Framework */}
            <VentCalculationTestInterface addNotification={addNotification} />
        </div>
    );
}

export default SystemMonitoringDashboard;