import React, { useState, useCallback } from 'react';
import { Calculator, Play, Pause, CheckCircle, AlertCircle, Loader2, BarChart3 } from 'lucide-react';
import { googleSheetsService } from '../api/googleSheetsService';

function BatchVentCalculation({ jobCounts, onBatchComplete, addNotification }) {
    const [isProcessing, setIsProcessing] = useState(false);
    const [progress, setProgress] = useState(null);
    const [results, setResults] = useState(null);
    const [selectedJobCounts, setSelectedJobCounts] = useState([]);

    const eligibleJobCounts = jobCounts.filter(jc =>
        jc.sqFt && !isNaN(jc.sqFt) && jc.sqFt > 0 &&
        (!jc.ridgeVents || !jc.turbineVents || !jc.rimeFlow)
    );

    const handleSelectAll = useCallback(() => {
        if (selectedJobCounts.length === eligibleJobCounts.length) {
            setSelectedJobCounts([]);
        } else {
            setSelectedJobCounts(eligibleJobCounts.map(jc => jc.id));
        }
    }, [selectedJobCounts.length, eligibleJobCounts]);

    const handleJobCountToggle = useCallback((jobCountId) => {
        setSelectedJobCounts(prev =>
            prev.includes(jobCountId)
                ? prev.filter(id => id !== jobCountId)
                : [...prev, jobCountId]
        );
    }, []);

    const handleBatchCalculation = useCallback(async () => {
        if (selectedJobCounts.length === 0) {
            addNotification('Please select job counts to process', 'error');
            return;
        }

        setIsProcessing(true);
        setProgress({ processed: 0, total: selectedJobCounts.length, errors: 0 });

        const processResults = [];

        try {
            for (let i = 0; i < selectedJobCounts.length; i++) {
                const jobCountId = selectedJobCounts[i];
                const jobCount = eligibleJobCounts.find(jc => jc.id === jobCountId);

                if (!jobCount) continue;

                try {
                    setProgress(prev => ({ ...prev, current: jobCount.customerName || 'Processing...' }));

                    const response = await googleSheetsService.calculateLomacoVents(jobCount.sqFt);

                    if (response.success && response.ventCalculations) {
                        // Update the job count with calculated values
                        const updatedJobCount = {
                            ...jobCount,
                            ridgeVents: response.ventCalculations.ridgeVents,
                            turbineVents: response.ventCalculations.turbineVents,
                            rimeFlow: response.ventCalculations.rimeFlow,
                            ventCalculationSource: response.ventCalculations.source,
                            ventCalculationDate: new Date().toISOString()
                        };

                        const updateResponse = await googleSheetsService.updateJobCount(updatedJobCount);

                        if (updateResponse.success) {
                            processResults.push({
                                jobCount: updatedJobCount,
                                calculations: response.ventCalculations,
                                method: response.calculationMethod,
                                success: true
                            });
                        } else {
                            throw new Error('Failed to update job count');
                        }
                    } else {
                        throw new Error(response.message || 'Calculation failed');
                    }

                    setProgress(prev => ({
                        ...prev,
                        processed: prev.processed + 1,
                        current: `Completed: ${jobCount.customerName || 'Unknown'}`
                    }));

                } catch (error) {
                    processResults.push({
                        jobCount,
                        error: error.message,
                        success: false
                    });

                    setProgress(prev => ({
                        ...prev,
                        processed: prev.processed + 1,
                        errors: prev.errors + 1,
                        current: `Error: ${jobCount.customerName || 'Unknown'}`
                    }));
                }

                // Add delay between requests to avoid rate limiting
                if (i < selectedJobCounts.length - 1) {
                    await new Promise(resolve => setTimeout(resolve, 1000));
                }
            }

            setResults(processResults);

            const successCount = processResults.filter(r => r.success).length;
            const errorCount = processResults.filter(r => !r.success).length;

            addNotification(
                `Batch calculation complete: ${successCount} successful, ${errorCount} errors`,
                errorCount === 0 ? 'success' : 'info'
            );

            if (onBatchComplete) {
                onBatchComplete(processResults);
            }

        } catch (error) {
            addNotification(`Batch calculation failed: ${error.message}`, 'error');
        } finally {
            setIsProcessing(false);
            setTimeout(() => {
                setProgress(null);
            }, 5000);
        }
    }, [selectedJobCounts, eligibleJobCounts, addNotification, onBatchComplete]);

    const formatValue = useCallback((value) => {
        if (!value || value === 0) return '-';
        return typeof value === 'number' ? value.toLocaleString() : value;
    }, []);

    return (
        <div className="bg-white rounded-lg shadow-sm border p-6">
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center">
                    <BarChart3 className="h-6 w-6 text-purple-600 mr-3" />
                    <div>
                        <h3 className="text-lg font-semibold text-gray-900">Batch Vent Calculation</h3>
                        <p className="text-sm text-gray-600">
                            Process multiple job counts automatically
                        </p>
                    </div>
                </div>
                <div className="flex items-center space-x-3">
                    <button
                        onClick={handleSelectAll}
                        className="px-3 py-1 text-xs font-medium border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors"
                    >
                        {selectedJobCounts.length === eligibleJobCounts.length ? 'Deselect All' : 'Select All'}
                    </button>
                    <button
                        onClick={handleBatchCalculation}
                        disabled={isProcessing || selectedJobCounts.length === 0}
                        className="inline-flex items-center px-4 py-2 border border-transparent rounded-lg text-sm font-medium text-white bg-purple-600 hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                        {isProcessing ? (
                            <>
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                Processing...
                            </>
                        ) : (
                            <>
                                <Play className="w-4 h-4 mr-2" />
                                Process Selected ({selectedJobCounts.length})
                            </>
                        )}
                    </button>
                </div>
            </div>

            {/* Progress Indicator */}
            {progress && (
                <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-blue-800">
                            Processing: {progress.processed} of {progress.total}
                        </span>
                        <span className="text-sm text-blue-600">
                            {Math.round((progress.processed / progress.total) * 100)}%
                        </span>
                    </div>
                    <div className="w-full bg-blue-200 rounded-full h-2 mb-2">
                        <div
                            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                            style={{ width: `${(progress.processed / progress.total) * 100}%` }}
                        />
                    </div>
                    <div className="text-xs text-blue-700">
                        {progress.current}
                    </div>
                    {progress.errors > 0 && (
                        <div className="text-xs text-red-600 mt-1">
                            {progress.errors} errors encountered
                        </div>
                    )}
                </div>
            )}

            {/* Job Count Selection */}
            <div className="space-y-3">
                <div className="flex items-center justify-between text-sm text-gray-600 border-b border-gray-200 pb-2">
                    <span>Eligible Job Counts ({eligibleJobCounts.length})</span>
                    <span>SQFT → Ridge/Turbine/Flow</span>
                </div>

                {eligibleJobCounts.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                        <Calculator className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                        <p>No job counts eligible for batch calculation</p>
                        <p className="text-xs">Job counts need SQFT values and missing vent calculations</p>
                    </div>
                ) : (
                    <div className="max-h-64 overflow-y-auto space-y-2">
                        {eligibleJobCounts.map((jobCount) => (
                            <div
                                key={jobCount.id}
                                className={`flex items-center justify-between p-3 rounded-lg border transition-colors cursor-pointer ${
                                    selectedJobCounts.includes(jobCount.id)
                                        ? 'bg-purple-50 border-purple-200'
                                        : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
                                }`}
                                onClick={() => handleJobCountToggle(jobCount.id)}
                            >
                                <div className="flex items-center">
                                    <input
                                        type="checkbox"
                                        checked={selectedJobCounts.includes(jobCount.id)}
                                        onChange={() => handleJobCountToggle(jobCount.id)}
                                        className="mr-3 h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
                                    />
                                    <div>
                                        <div className="font-medium text-gray-900">
                                            {jobCount.customerName ||
                                             `${jobCount.firstName || ''} ${jobCount.lastName || ''}`.trim() ||
                                             'Unknown Customer'}
                                        </div>
                                        <div className="text-xs text-gray-500">
                                            {new Date(jobCount.date).toLocaleDateString()}
                                        </div>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <div className="text-sm font-medium text-gray-900">
                                        {formatValue(jobCount.sqFt)} sq ft
                                    </div>
                                    <div className="text-xs text-gray-500">
                                        R:{formatValue(jobCount.ridgeVents)} T:{formatValue(jobCount.turbineVents)} F:{formatValue(jobCount.rimeFlow)}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Results Summary */}
            {results && (
                <div className="mt-6 p-4 bg-gray-50 rounded-lg border">
                    <h4 className="text-sm font-medium text-gray-900 mb-3">Batch Results</h4>
                    <div className="grid grid-cols-3 gap-4 text-center">
                        <div>
                            <div className="text-lg font-bold text-green-600">
                                {results.filter(r => r.success).length}
                            </div>
                            <div className="text-xs text-gray-600">Successful</div>
                        </div>
                        <div>
                            <div className="text-lg font-bold text-red-600">
                                {results.filter(r => !r.success).length}
                            </div>
                            <div className="text-xs text-gray-600">Errors</div>
                        </div>
                        <div>
                            <div className="text-lg font-bold text-blue-600">
                                {results.length}
                            </div>
                            <div className="text-xs text-gray-600">Total</div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default BatchVentCalculation;