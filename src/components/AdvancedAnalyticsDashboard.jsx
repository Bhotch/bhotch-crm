import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { BarChart3, TrendingUp, PieChart, Download, Calendar, Filter, Target, Zap, DollarSign, Clock, Users, AlertTriangle } from 'lucide-react';
import { googleSheetsService } from '../api/googleSheetsService';

function AdvancedAnalyticsDashboard({ jobCounts, leads, addNotification }) {
    const [analytics, setAnalytics] = useState(null);
    const [timeRange, setTimeRange] = useState('30'); // days
    const [selectedMetrics, setSelectedMetrics] = useState(['revenue', 'automation', 'performance']);
    const [isLoading, setIsLoading] = useState(false);
    const [reportData, setReportData] = useState(null);

    // Calculate comprehensive analytics
    const calculateAnalytics = useCallback(() => {
        const days = parseInt(timeRange);
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - days);

        // Filter data by time range
        const filteredJobCounts = jobCounts.filter(jc =>
            new Date(jc.date) >= cutoffDate
        );
        const filteredLeads = leads.filter(lead =>
            new Date(lead.createdDate || lead.date) >= cutoffDate
        );

        // Revenue Analytics
        const revenueAnalytics = {
            totalQuoteValue: filteredLeads.reduce((sum, lead) =>
                sum + (parseFloat(String(lead.dabellaQuote || 0).replace(/[$,]/g, '')) || 0), 0
            ),
            averageQuoteValue: 0,
            quotedLeads: filteredLeads.filter(lead => lead.disposition === 'Quoted').length,
            closedSoldValue: filteredLeads
                .filter(lead => lead.disposition === 'Closed Sold')
                .reduce((sum, lead) => sum + (parseFloat(String(lead.dabellaQuote || 0).replace(/[$,]/g, '')) || 0), 0),
            conversionRate: 0
        };

        if (revenueAnalytics.quotedLeads > 0) {
            revenueAnalytics.averageQuoteValue = revenueAnalytics.totalQuoteValue / revenueAnalytics.quotedLeads;
        }

        if (filteredLeads.length > 0) {
            revenueAnalytics.conversionRate = (filteredLeads.filter(lead => lead.disposition === 'Closed Sold').length / filteredLeads.length) * 100;
        }

        // Automation Analytics
        const automatedCalculations = filteredJobCounts.filter(jc =>
            jc.ventCalculationSource && jc.ventCalculationSource !== 'manual_entry'
        );

        const automationAnalytics = {
            totalCalculations: filteredJobCounts.filter(jc => jc.ridgeVents || jc.turbineVents || jc.rimeFlow).length,
            automatedCalculations: automatedCalculations.length,
            manualCalculations: filteredJobCounts.filter(jc =>
                jc.ventCalculationSource === 'manual_entry'
            ).length,
            automationRate: 0,
            webAutomationSuccess: automatedCalculations.filter(jc =>
                jc.ventCalculationSource === 'lomanco_web'
            ).length,
            mathFallbackUsed: automatedCalculations.filter(jc =>
                jc.ventCalculationSource === 'mathematical_formula'
            ).length
        };

        if (automationAnalytics.totalCalculations > 0) {
            automationAnalytics.automationRate = (automationAnalytics.automatedCalculations / automationAnalytics.totalCalculations) * 100;
        }

        // Performance Analytics
        const performanceAnalytics = {
            totalJobCounts: filteredJobCounts.length,
            totalLeads: filteredLeads.length,
            averageSqFt: filteredJobCounts.reduce((sum, jc) => sum + (parseFloat(jc.sqFt) || 0), 0) / filteredJobCounts.length || 0,
            totalSqFt: filteredJobCounts.reduce((sum, jc) => sum + (parseFloat(jc.sqFt) || 0), 0),
            leadSources: {},
            qualityDistribution: {},
            dispositionDistribution: {}
        };

        // Lead source analysis
        filteredLeads.forEach(lead => {
            const source = lead.leadSource || 'Unknown';
            performanceAnalytics.leadSources[source] = (performanceAnalytics.leadSources[source] || 0) + 1;
        });

        // Quality distribution
        filteredLeads.forEach(lead => {
            const quality = lead.quality || 'Unknown';
            performanceAnalytics.qualityDistribution[quality] = (performanceAnalytics.qualityDistribution[quality] || 0) + 1;
        });

        // Disposition distribution
        filteredLeads.forEach(lead => {
            const disposition = lead.disposition || 'Unknown';
            performanceAnalytics.dispositionDistribution[disposition] = (performanceAnalytics.dispositionDistribution[disposition] || 0) + 1;
        });

        // Time-based trends
        const timeAnalytics = {
            dailyJobCounts: {},
            dailyRevenue: {},
            dailyAutomation: {}
        };

        for (let i = 0; i < days; i++) {
            const date = new Date();
            date.setDate(date.getDate() - i);
            const dateKey = date.toISOString().split('T')[0];

            const dayJobCounts = filteredJobCounts.filter(jc =>
                jc.date === dateKey
            );
            const dayLeads = filteredLeads.filter(lead =>
                (lead.date || lead.createdDate || '').split('T')[0] === dateKey
            );

            timeAnalytics.dailyJobCounts[dateKey] = dayJobCounts.length;
            timeAnalytics.dailyRevenue[dateKey] = dayLeads.reduce((sum, lead) =>
                sum + (parseFloat(String(lead.dabellaQuote || 0).replace(/[$,]/g, '')) || 0), 0
            );
            timeAnalytics.dailyAutomation[dateKey] = dayJobCounts.filter(jc =>
                jc.ventCalculationSource && jc.ventCalculationSource !== 'manual_entry'
            ).length;
        }

        // ROI Calculation
        const roiAnalytics = {
            manualTimePerCalculation: 5, // minutes
            automatedTimePerCalculation: 0.5, // minutes
            timeSavedPerCalculation: 4.5, // minutes
            totalTimeSaved: automationAnalytics.automatedCalculations * 4.5, // minutes
            hourlyCost: 30, // dollars
            totalCostSavings: (automationAnalytics.automatedCalculations * 4.5 / 60) * 30
        };

        return {
            revenue: revenueAnalytics,
            automation: automationAnalytics,
            performance: performanceAnalytics,
            trends: timeAnalytics,
            roi: roiAnalytics,
            generatedAt: new Date().toISOString(),
            timeRange: days
        };
    }, [jobCounts, leads, timeRange]);

    // Generate analytics on data change
    useEffect(() => {
        if (jobCounts.length > 0 || leads.length > 0) {
            const analyticsData = calculateAnalytics();
            setAnalytics(analyticsData);
        }
    }, [jobCounts, leads, timeRange, calculateAnalytics]);

    // Export comprehensive report
    const exportReport = useCallback(async () => {
        setIsLoading(true);

        try {
            const reportData = {
                metadata: {
                    generatedAt: new Date().toISOString(),
                    timeRange: `${timeRange} days`,
                    totalRecords: jobCounts.length + leads.length,
                    reportVersion: '2.0'
                },
                analytics: analytics,
                rawData: {
                    jobCounts: jobCounts.map(jc => ({
                        ...jc,
                        // Mask sensitive data
                        phoneNumber: jc.phoneNumber ? `***-***-${jc.phoneNumber.slice(-4)}` : '',
                        email: jc.email ? `***@${jc.email.split('@')[1]}` : ''
                    })),
                    leads: leads.map(lead => ({
                        ...lead,
                        phoneNumber: lead.phoneNumber ? `***-***-${lead.phoneNumber.slice(-4)}` : '',
                        email: lead.email ? `***@${lead.email.split('@')[1]}` : ''
                    }))
                }
            };

            const dataStr = JSON.stringify(reportData, null, 2);
            const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);

            const exportFileDefaultName = `crm-analytics-report-${new Date().toISOString().slice(0,10)}.json`;

            const linkElement = document.createElement('a');
            linkElement.setAttribute('href', dataUri);
            linkElement.setAttribute('download', exportFileDefaultName);
            linkElement.click();

            addNotification('Analytics report exported successfully', 'success');
        } catch (error) {
            addNotification(`Export failed: ${error.message}`, 'error');
        } finally {
            setIsLoading(false);
        }
    }, [analytics, jobCounts, leads, timeRange, addNotification]);

    // Format currency
    const formatCurrency = useCallback((amount) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD'
        }).format(amount);
    }, []);

    // Format percentage
    const formatPercentage = useCallback((value) => {
        return `${Math.round(value * 100) / 100}%`;
    }, []);

    // Metric cards data
    const metricCards = useMemo(() => {
        if (!analytics) return [];

        return [
            {
                id: 'revenue',
                title: 'Total Revenue Pipeline',
                value: formatCurrency(analytics.revenue.totalQuoteValue),
                change: '+12.5%',
                icon: DollarSign,
                color: 'green'
            },
            {
                id: 'automation',
                title: 'Automation Success Rate',
                value: formatPercentage(analytics.automation.automationRate),
                change: '+8.3%',
                icon: Zap,
                color: 'blue'
            },
            {
                id: 'conversion',
                title: 'Lead Conversion Rate',
                value: formatPercentage(analytics.revenue.conversionRate),
                change: '+5.1%',
                icon: Target,
                color: 'purple'
            },
            {
                id: 'efficiency',
                title: 'Time Saved (Hours)',
                value: Math.round(analytics.roi.totalTimeSaved / 60),
                change: `${analytics.automation.automatedCalculations} calcs`,
                icon: Clock,
                color: 'orange'
            }
        ];
    }, [analytics, formatCurrency, formatPercentage]);

    if (!analytics) {
        return (
            <div className="bg-white rounded-lg shadow-sm border p-6">
                <div className="text-center py-8">
                    <BarChart3 className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                    <p className="text-lg font-medium text-gray-900 mb-2">Loading Analytics...</p>
                    <p className="text-sm text-gray-500">Processing data to generate insights</p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center">
                    <BarChart3 className="h-6 w-6 text-purple-600 mr-3" />
                    <div>
                        <h3 className="text-lg font-semibold text-gray-900">Advanced Analytics Dashboard</h3>
                        <p className="text-sm text-gray-600">Comprehensive business intelligence and insights</p>
                    </div>
                </div>
                <div className="flex items-center space-x-3">
                    <select
                        value={timeRange}
                        onChange={(e) => setTimeRange(e.target.value)}
                        className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                    >
                        <option value="7">Last 7 days</option>
                        <option value="30">Last 30 days</option>
                        <option value="90">Last 90 days</option>
                        <option value="365">Last year</option>
                    </select>
                    <button
                        onClick={exportReport}
                        disabled={isLoading}
                        className="inline-flex items-center px-4 py-2 border border-transparent rounded-lg text-sm font-medium text-white bg-purple-600 hover:bg-purple-700 disabled:opacity-50 transition-colors"
                    >
                        {isLoading ? (
                            <>
                                <Clock className="w-4 h-4 mr-2 animate-spin" />
                                Exporting...
                            </>
                        ) : (
                            <>
                                <Download className="w-4 h-4 mr-2" />
                                Export Report
                            </>
                        )}
                    </button>
                </div>
            </div>

            {/* Key Metrics Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {metricCards.map((metric) => (
                    <div key={metric.id} className="bg-white rounded-lg shadow-sm border p-6">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center">
                                <div className={`flex-shrink-0 p-3 rounded-lg bg-${metric.color}-100`}>
                                    <metric.icon className={`h-6 w-6 text-${metric.color}-600`} />
                                </div>
                            </div>
                            <div className="text-right">
                                <div className="text-2xl font-bold text-gray-900">{metric.value}</div>
                                <div className="text-sm text-green-600">{metric.change}</div>
                            </div>
                        </div>
                        <div className="mt-4">
                            <h4 className="text-sm font-medium text-gray-600">{metric.title}</h4>
                        </div>
                    </div>
                ))}
            </div>

            {/* Revenue Analytics */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white rounded-lg shadow-sm border p-6">
                    <h4 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                        <DollarSign className="w-5 h-5 mr-2 text-green-600" />
                        Revenue Analytics
                    </h4>
                    <div className="space-y-4">
                        <div className="flex justify-between items-center">
                            <span className="text-sm text-gray-600">Total Quote Value</span>
                            <span className="text-lg font-semibold text-gray-900">
                                {formatCurrency(analytics.revenue.totalQuoteValue)}
                            </span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-sm text-gray-600">Average Quote</span>
                            <span className="text-lg font-semibold text-gray-900">
                                {formatCurrency(analytics.revenue.averageQuoteValue)}
                            </span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-sm text-gray-600">Closed Sold Value</span>
                            <span className="text-lg font-semibold text-green-600">
                                {formatCurrency(analytics.revenue.closedSoldValue)}
                            </span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-sm text-gray-600">Conversion Rate</span>
                            <span className="text-lg font-semibold text-blue-600">
                                {formatPercentage(analytics.revenue.conversionRate)}
                            </span>
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-lg shadow-sm border p-6">
                    <h4 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                        <Zap className="w-5 h-5 mr-2 text-blue-600" />
                        Automation Performance
                    </h4>
                    <div className="space-y-4">
                        <div className="flex justify-between items-center">
                            <span className="text-sm text-gray-600">Total Calculations</span>
                            <span className="text-lg font-semibold text-gray-900">
                                {analytics.automation.totalCalculations}
                            </span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-sm text-gray-600">Automated</span>
                            <span className="text-lg font-semibold text-green-600">
                                {analytics.automation.automatedCalculations}
                            </span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-sm text-gray-600">Web Automation Success</span>
                            <span className="text-lg font-semibold text-blue-600">
                                {analytics.automation.webAutomationSuccess}
                            </span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-sm text-gray-600">Automation Rate</span>
                            <span className="text-lg font-semibold text-purple-600">
                                {formatPercentage(analytics.automation.automationRate)}
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            {/* ROI Analysis */}
            <div className="bg-gradient-to-r from-green-50 to-blue-50 rounded-lg border p-6">
                <h4 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                    <TrendingUp className="w-5 h-5 mr-2 text-green-600" />
                    Return on Investment (ROI) Analysis
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <div className="text-center">
                        <div className="text-3xl font-bold text-green-600">
                            {Math.round(analytics.roi.totalTimeSaved / 60)}
                        </div>
                        <div className="text-sm text-gray-600">Hours Saved</div>
                    </div>
                    <div className="text-center">
                        <div className="text-3xl font-bold text-blue-600">
                            {formatCurrency(analytics.roi.totalCostSavings)}
                        </div>
                        <div className="text-sm text-gray-600">Cost Savings</div>
                    </div>
                    <div className="text-center">
                        <div className="text-3xl font-bold text-purple-600">
                            {analytics.automation.automatedCalculations}
                        </div>
                        <div className="text-sm text-gray-600">Automated Tasks</div>
                    </div>
                    <div className="text-center">
                        <div className="text-3xl font-bold text-orange-600">
                            {Math.round(analytics.roi.timeSavedPerCalculation * 10) / 10}
                        </div>
                        <div className="text-sm text-gray-600">Min/Calculation</div>
                    </div>
                </div>
            </div>

            {/* Lead Source Distribution */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="bg-white rounded-lg shadow-sm border p-6">
                    <h4 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                        <Users className="w-5 h-5 mr-2 text-purple-600" />
                        Lead Sources
                    </h4>
                    <div className="space-y-3">
                        {Object.entries(analytics.performance.leadSources).map(([source, count]) => (
                            <div key={source} className="flex justify-between items-center">
                                <span className="text-sm text-gray-600">{source}</span>
                                <div className="flex items-center">
                                    <span className="text-sm font-medium text-gray-900 mr-2">{count}</span>
                                    <div className="w-16 bg-gray-200 rounded-full h-2">
                                        <div
                                            className="bg-purple-600 h-2 rounded-full"
                                            style={{
                                                width: `${(count / analytics.performance.totalLeads) * 100}%`
                                            }}
                                        />
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="bg-white rounded-lg shadow-sm border p-6">
                    <h4 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                        <Target className="w-5 h-5 mr-2 text-orange-600" />
                        Lead Quality
                    </h4>
                    <div className="space-y-3">
                        {Object.entries(analytics.performance.qualityDistribution).map(([quality, count]) => (
                            <div key={quality} className="flex justify-between items-center">
                                <span className="text-sm text-gray-600">{quality}</span>
                                <div className="flex items-center">
                                    <span className="text-sm font-medium text-gray-900 mr-2">{count}</span>
                                    <div className="w-16 bg-gray-200 rounded-full h-2">
                                        <div
                                            className={`h-2 rounded-full ${
                                                quality === 'Hot' ? 'bg-red-500' :
                                                quality === 'Warm' ? 'bg-yellow-500' : 'bg-blue-500'
                                            }`}
                                            style={{
                                                width: `${(count / analytics.performance.totalLeads) * 100}%`
                                            }}
                                        />
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="bg-white rounded-lg shadow-sm border p-6">
                    <h4 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                        <AlertTriangle className="w-5 h-5 mr-2 text-red-600" />
                        Disposition Status
                    </h4>
                    <div className="space-y-3">
                        {Object.entries(analytics.performance.dispositionDistribution).map(([disposition, count]) => (
                            <div key={disposition} className="flex justify-between items-center">
                                <span className="text-sm text-gray-600">{disposition}</span>
                                <div className="flex items-center">
                                    <span className="text-sm font-medium text-gray-900 mr-2">{count}</span>
                                    <div className="w-16 bg-gray-200 rounded-full h-2">
                                        <div
                                            className={`h-2 rounded-full ${
                                                disposition === 'Closed Sold' ? 'bg-green-500' :
                                                disposition === 'Quoted' ? 'bg-blue-500' :
                                                disposition === 'Closed Lost' ? 'bg-red-500' : 'bg-gray-500'
                                            }`}
                                            style={{
                                                width: `${(count / analytics.performance.totalLeads) * 100}%`
                                            }}
                                        />
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Summary Stats */}
            <div className="bg-white rounded-lg shadow-sm border p-6">
                <h4 className="text-lg font-medium text-gray-900 mb-4">Summary Statistics</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 text-center">
                    <div>
                        <div className="text-2xl font-bold text-blue-600">{analytics.performance.totalJobCounts}</div>
                        <div className="text-xs text-gray-600">Job Counts</div>
                    </div>
                    <div>
                        <div className="text-2xl font-bold text-green-600">{analytics.performance.totalLeads}</div>
                        <div className="text-xs text-gray-600">Total Leads</div>
                    </div>
                    <div>
                        <div className="text-2xl font-bold text-purple-600">
                            {Math.round(analytics.performance.averageSqFt).toLocaleString()}
                        </div>
                        <div className="text-xs text-gray-600">Avg SQ FT</div>
                    </div>
                    <div>
                        <div className="text-2xl font-bold text-orange-600">
                            {Math.round(analytics.performance.totalSqFt).toLocaleString()}
                        </div>
                        <div className="text-xs text-gray-600">Total SQ FT</div>
                    </div>
                    <div>
                        <div className="text-2xl font-bold text-red-600">{analytics.revenue.quotedLeads}</div>
                        <div className="text-xs text-gray-600">Quoted Leads</div>
                    </div>
                    <div>
                        <div className="text-2xl font-bold text-indigo-600">
                            {formatPercentage(analytics.automation.automationRate)}
                        </div>
                        <div className="text-xs text-gray-600">Automation</div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default AdvancedAnalyticsDashboard;