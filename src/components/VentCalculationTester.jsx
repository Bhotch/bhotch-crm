import React, { useState, useCallback } from 'react';
import { TestTube, Play, CheckCircle, AlertCircle, Clock, BarChart3, Download } from 'lucide-react';
import VentCalculationTester from '../utils/ventCalculationTester';

function VentCalculationTestInterface({ addNotification }) {
    const [tester] = useState(() => new VentCalculationTester());
    const [isRunning, setIsRunning] = useState(false);
    const [progress, setProgress] = useState(null);
    const [testResults, setTestResults] = useState(null);
    const [showResults, setShowResults] = useState(false);

    const handleRunTests = useCallback(async () => {
        setIsRunning(true);
        setProgress(null);
        setTestResults(null);
        setShowResults(true);

        try {
            const result = await tester.runFullTestSuite(
                // Progress callback
                (progressData) => {
                    setProgress(progressData);
                },
                // Completion callback
                (completionData) => {
                    setTestResults(completionData);
                    if (completionData.success) {
                        addNotification(
                            `Test suite completed: ${completionData.summary.passed}/${completionData.summary.total} tests passed`,
                            completionData.summary.failed === 0 ? 'success' : 'info'
                        );
                    } else {
                        addNotification(`Test suite failed: ${completionData.error}`, 'error');
                    }
                }
            );

        } catch (error) {
            addNotification(`Testing framework error: ${error.message}`, 'error');
        } finally {
            setIsRunning(false);
            setProgress(null);
        }
    }, [tester, addNotification]);

    const handleDownloadResults = useCallback(() => {
        if (!testResults) return;

        const dataStr = JSON.stringify(testResults, null, 2);
        const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);

        const exportFileDefaultName = `vent-calculation-test-results-${new Date().toISOString().slice(0,10)}.json`;

        const linkElement = document.createElement('a');
        linkElement.setAttribute('href', dataUri);
        linkElement.setAttribute('download', exportFileDefaultName);
        linkElement.click();
    }, [testResults]);

    const getStatusIcon = (status) => {
        switch (status) {
            case 'passed': return <CheckCircle className="w-4 h-4 text-green-600" />;
            case 'failed': return <AlertCircle className="w-4 h-4 text-red-600" />;
            default: return <Clock className="w-4 h-4 text-blue-600" />;
        }
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'passed': return 'text-green-800 bg-green-50 border-green-200';
            case 'failed': return 'text-red-800 bg-red-50 border-red-200';
            default: return 'text-blue-800 bg-blue-50 border-blue-200';
        }
    };

    return (
        <div className="bg-white rounded-lg shadow-sm border p-6">
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center">
                    <TestTube className="h-6 w-6 text-green-600 mr-3" />
                    <div>
                        <h3 className="text-lg font-semibold text-gray-900">Vent Calculation Testing Framework</h3>
                        <p className="text-sm text-gray-600">
                            Comprehensive validation of automation system
                        </p>
                    </div>
                </div>
                <div className="flex items-center space-x-3">
                    {testResults && (
                        <button
                            onClick={handleDownloadResults}
                            className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors"
                        >
                            <Download className="w-4 h-4 mr-2" />
                            Export Results
                        </button>
                    )}
                    <button
                        onClick={handleRunTests}
                        disabled={isRunning}
                        className="inline-flex items-center px-4 py-2 border border-transparent rounded-lg text-sm font-medium text-white bg-green-600 hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                        {isRunning ? (
                            <>
                                <Clock className="w-4 h-4 mr-2 animate-spin" />
                                Running Tests...
                            </>
                        ) : (
                            <>
                                <Play className="w-4 h-4 mr-2" />
                                Run Full Test Suite
                            </>
                        )}
                    </button>
                </div>
            </div>

            {/* Test Framework Description */}
            <div className="mb-6 p-4 bg-gray-50 rounded-lg border">
                <h4 className="text-sm font-medium text-gray-900 mb-2">Test Coverage</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 text-xs text-gray-600">
                    <div>• Connection Testing</div>
                    <div>• Basic Calculations</div>
                    <div>• Mathematical Fallbacks</div>
                    <div>• Edge Cases</div>
                    <div>• Performance Testing</div>
                    <div>• Data Validation</div>
                    <div>• Error Handling</div>
                    <div>• Batch Processing</div>
                </div>
            </div>

            {/* Progress Indicator */}
            {progress && (
                <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-blue-800">
                            Running: {progress.testName}
                        </span>
                        <span className="text-sm text-blue-600">
                            {progress.current} of {progress.total}
                        </span>
                    </div>
                    <div className="w-full bg-blue-200 rounded-full h-2 mb-2">
                        <div
                            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                            style={{ width: `${(progress.current / progress.total) * 100}%` }}
                        />
                    </div>
                    <div className="text-xs text-blue-700">
                        Test {progress.current}/{progress.total}: {progress.testName}
                    </div>
                </div>
            )}

            {/* Test Results */}
            {showResults && testResults && (
                <div className="space-y-6">
                    {/* Summary */}
                    <div className="p-4 bg-gray-50 rounded-lg border">
                        <div className="flex items-center justify-between mb-4">
                            <h4 className="text-lg font-medium text-gray-900">Test Results Summary</h4>
                            <div className="flex items-center space-x-4">
                                <div className="text-center">
                                    <div className="text-xl font-bold text-green-600">
                                        {testResults.summary?.passed || 0}
                                    </div>
                                    <div className="text-xs text-gray-600">Passed</div>
                                </div>
                                <div className="text-center">
                                    <div className="text-xl font-bold text-red-600">
                                        {testResults.summary?.failed || 0}
                                    </div>
                                    <div className="text-xs text-gray-600">Failed</div>
                                </div>
                                <div className="text-center">
                                    <div className="text-xl font-bold text-blue-600">
                                        {testResults.summary?.successRate || 0}%
                                    </div>
                                    <div className="text-xs text-gray-600">Success Rate</div>
                                </div>
                            </div>
                        </div>

                        {/* Overall Status */}
                        <div className={`p-3 rounded-lg border flex items-center ${
                            testResults.success
                                ? 'bg-green-50 border-green-200 text-green-800'
                                : 'bg-red-50 border-red-200 text-red-800'
                        }`}>
                            {testResults.success ? (
                                <CheckCircle className="w-5 h-5 mr-2" />
                            ) : (
                                <AlertCircle className="w-5 h-5 mr-2" />
                            )}
                            <span className="font-medium">
                                {testResults.success
                                    ? 'All tests completed successfully'
                                    : `${testResults.summary?.failed || 0} test(s) failed`
                                }
                            </span>
                        </div>
                    </div>

                    {/* Detailed Results */}
                    <div className="space-y-3">
                        <h4 className="text-lg font-medium text-gray-900 flex items-center">
                            <BarChart3 className="w-5 h-5 mr-2" />
                            Detailed Test Results
                        </h4>

                        {testResults.results?.map((result, index) => (
                            <div
                                key={index}
                                className={`p-4 rounded-lg border ${getStatusColor(result.status)}`}
                            >
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center">
                                        {getStatusIcon(result.status)}
                                        <span className="ml-2 font-medium">{result.name}</span>
                                    </div>
                                    <div className="text-xs">
                                        {new Date(result.timestamp).toLocaleTimeString()}
                                    </div>
                                </div>

                                {result.error && (
                                    <div className="mt-2 text-sm">
                                        <strong>Error:</strong> {result.error}
                                    </div>
                                )}

                                {result.result && typeof result.result === 'object' && (
                                    <div className="mt-2">
                                        <details className="text-sm">
                                            <summary className="cursor-pointer font-medium">
                                                View Details
                                            </summary>
                                            <pre className="mt-2 p-2 bg-white rounded text-xs overflow-auto">
                                                {JSON.stringify(result.result, null, 2)}
                                            </pre>
                                        </details>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>

                    {/* Performance Metrics */}
                    {testResults.results?.some(r => r.name === 'Performance Test' && r.result) && (
                        <div className="p-4 bg-purple-50 rounded-lg border border-purple-200">
                            <h4 className="text-lg font-medium text-purple-900 mb-3">Performance Metrics</h4>
                            {(() => {
                                const perfTest = testResults.results.find(r => r.name === 'Performance Test');
                                if (perfTest?.result) {
                                    return (
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                                            <div>
                                                <div className="font-medium text-purple-800">Sequential Processing</div>
                                                <div className="text-purple-700">
                                                    Average: {perfTest.result.sequential?.averageTime || 0}ms
                                                </div>
                                            </div>
                                            <div>
                                                <div className="font-medium text-purple-800">Concurrent Processing</div>
                                                <div className="text-purple-700">
                                                    Total: {perfTest.result.concurrent?.totalTime || 0}ms
                                                </div>
                                            </div>
                                        </div>
                                    );
                                }
                                return null;
                            })()}
                        </div>
                    )}
                </div>
            )}

            {/* Instructions */}
            {!showResults && (
                <div className="text-center py-8 text-gray-500">
                    <TestTube className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                    <p className="text-lg font-medium mb-2">Ready to Test Vent Calculation System</p>
                    <p className="text-sm">
                        Click "Run Full Test Suite" to validate all automation components including
                        web scraping, mathematical fallbacks, error handling, and performance.
                    </p>
                </div>
            )}
        </div>
    );
}

export default VentCalculationTestInterface;