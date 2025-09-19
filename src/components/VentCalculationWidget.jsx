import React, { useState, useCallback } from 'react';
import { Calculator, Loader2, CheckCircle, AlertCircle, RefreshCw, Zap, Clock, TrendingUp } from 'lucide-react';
import { googleSheetsService } from '../api/googleSheetsService';

function VentCalculationWidget({ jobCount, onCalculationComplete, addNotification }) {
    const [isCalculating, setIsCalculating] = useState(false);
    const [calculationStatus, setCalculationStatus] = useState(null);
    const [lastCalculation, setLastCalculation] = useState(null);
    const [manualValues, setManualValues] = useState({
        ridgeVents: '',
        turbineVents: '',
        rimeFlow: ''
    });
    const [isManualMode, setIsManualMode] = useState(false);

    const handleAutomaticCalculation = useCallback(async () => {
        if (!jobCount?.sqFt || isNaN(jobCount.sqFt)) {
            addNotification('Valid SQFT value is required for calculation', 'error');
            return;
        }

        setIsCalculating(true);
        setCalculationStatus({ type: 'info', message: 'Connecting to Lomanco calculator...' });

        try {
            const response = await googleSheetsService.calculateLomacoVents(jobCount.sqFt);

            if (response.success && response.ventCalculations) {
                const calculations = response.ventCalculations;

                setCalculationStatus({
                    type: 'success',
                    message: `Calculation complete via ${calculations.source}`
                });

                setLastCalculation({
                    ...calculations,
                    calculatedAt: new Date().toISOString(),
                    method: response.calculationMethod
                });

                // Update the job count with calculated values
                const updatedJobCount = {
                    ...jobCount,
                    ridgeVents: calculations.ridgeVents,
                    turbineVents: calculations.turbineVents,
                    rimeFlow: calculations.rimeFlow,
                    ventCalculationSource: calculations.source,
                    ventCalculationDate: new Date().toISOString()
                };

                if (onCalculationComplete) {
                    await onCalculationComplete(updatedJobCount);
                }

                const methodText = response.calculationMethod === 'web_automation'
                    ? 'Lomanco website automation'
                    : 'mathematical formula';

                addNotification(
                    `Vent calculation completed via ${methodText}: Ridge ${calculations.ridgeVents}, Turbine ${calculations.turbineVents}, Flow ${calculations.rimeFlow}`,
                    'success'
                );

            } else {
                throw new Error(response.message || 'Calculation failed');
            }

        } catch (error) {
            setCalculationStatus({
                type: 'error',
                message: `Calculation failed: ${error.message}`
            });
            addNotification(`Vent calculation failed: ${error.message}`, 'error');
        } finally {
            setIsCalculating(false);
            setTimeout(() => setCalculationStatus(null), 5000);
        }
    }, [jobCount, onCalculationComplete, addNotification]);

    const handleManualSave = useCallback(async () => {
        try {
            const updatedJobCount = {
                ...jobCount,
                ridgeVents: parseInt(manualValues.ridgeVents) || 0,
                turbineVents: parseInt(manualValues.turbineVents) || 0,
                rimeFlow: parseFloat(manualValues.rimeFlow) || 0,
                ventCalculationSource: 'manual_entry',
                ventCalculationDate: new Date().toISOString()
            };

            if (onCalculationComplete) {
                await onCalculationComplete(updatedJobCount);
            }

            setIsManualMode(false);
            addNotification('Manual vent values saved successfully', 'success');

        } catch (error) {
            addNotification(`Failed to save manual values: ${error.message}`, 'error');
        }
    }, [manualValues, jobCount, onCalculationComplete, addNotification]);

    const formatValue = useCallback((value) => {
        if (!value || value === 0) return '-';
        return typeof value === 'number' ? value.toLocaleString() : value;
    }, []);

    const getStatusIcon = useCallback((type) => {
        switch (type) {
            case 'success': return <CheckCircle className="w-4 h-4 text-green-600" />;
            case 'error': return <AlertCircle className="w-4 h-4 text-red-600" />;
            default: return <Clock className="w-4 h-4 text-blue-600" />;
        }
    }, []);

    return (
        <div className="bg-white rounded-lg shadow-sm border p-6">
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center">
                    <Calculator className="h-6 w-6 text-blue-600 mr-3" />
                    <h3 className="text-lg font-semibold text-gray-900">Lomanco Vent Calculator</h3>
                </div>
                <div className="flex items-center space-x-2">
                    <button
                        onClick={() => setIsManualMode(!isManualMode)}
                        className={`px-3 py-1 text-xs font-medium rounded-full transition-colors ${
                            isManualMode
                                ? 'bg-orange-100 text-orange-700 hover:bg-orange-200'
                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                    >
                        {isManualMode ? 'Auto Mode' : 'Manual Mode'}
                    </button>
                </div>
            </div>

            {/* SQFT Input Display */}
            <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center justify-between">
                    <div>
                        <p className="text-sm font-medium text-gray-600">Attic Square Footage</p>
                        <p className="text-2xl font-bold text-gray-900">
                            {jobCount?.sqFt ? `${formatValue(jobCount.sqFt)} sq ft` : 'Not specified'}
                        </p>
                    </div>
                    {jobCount?.sqFt && (
                        <button
                            onClick={handleAutomaticCalculation}
                            disabled={isCalculating || isManualMode}
                            className="inline-flex items-center px-4 py-2 border border-transparent rounded-lg text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                            {isCalculating ? (
                                <>
                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                    Calculating...
                                </>
                            ) : (
                                <>
                                    <Zap className="w-4 h-4 mr-2" />
                                    Auto Calculate
                                </>
                            )}
                        </button>
                    )}
                </div>
            </div>

            {/* Calculation Status */}
            {calculationStatus && (
                <div className={`mb-4 p-3 rounded-lg flex items-center ${
                    calculationStatus.type === 'success' ? 'bg-green-50 text-green-800' :
                    calculationStatus.type === 'error' ? 'bg-red-50 text-red-800' : 'bg-blue-50 text-blue-800'
                }`}>
                    {getStatusIcon(calculationStatus.type)}
                    <span className="ml-2 text-sm">{calculationStatus.message}</span>
                </div>
            )}

            {/* Results Display */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                        <h4 className="text-sm font-medium text-blue-800">Ridge Vents</h4>
                        <TrendingUp className="w-4 h-4 text-blue-600" />
                    </div>
                    {isManualMode ? (
                        <input
                            type="number"
                            value={manualValues.ridgeVents}
                            onChange={(e) => setManualValues(prev => ({ ...prev, ridgeVents: e.target.value }))}
                            placeholder="Enter ridge vents"
                            className="w-full px-3 py-2 border border-blue-200 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                    ) : (
                        <div>
                            <p className="text-2xl font-bold text-blue-900">
                                {formatValue(jobCount?.ridgeVents)}
                            </p>
                            <p className="text-xs text-blue-600">DA-4 Linear Feet</p>
                        </div>
                    )}
                </div>

                <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                        <h4 className="text-sm font-medium text-green-800">Turbine Vents</h4>
                        <RefreshCw className="w-4 h-4 text-green-600" />
                    </div>
                    {isManualMode ? (
                        <input
                            type="number"
                            value={manualValues.turbineVents}
                            onChange={(e) => setManualValues(prev => ({ ...prev, turbineVents: e.target.value }))}
                            placeholder="Enter turbine count"
                            className="w-full px-3 py-2 border border-green-200 rounded-md focus:ring-2 focus:ring-green-500 focus:border-green-500"
                        />
                    ) : (
                        <div>
                            <p className="text-2xl font-bold text-green-900">
                                {formatValue(jobCount?.turbineVents)}
                            </p>
                            <p className="text-xs text-green-600">ALL-14" Units</p>
                        </div>
                    )}
                </div>

                <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                        <h4 className="text-sm font-medium text-purple-800">Rime Flow</h4>
                        <Calculator className="w-4 h-4 text-purple-600" />
                    </div>
                    {isManualMode ? (
                        <input
                            type="number"
                            step="0.1"
                            value={manualValues.rimeFlow}
                            onChange={(e) => setManualValues(prev => ({ ...prev, rimeFlow: e.target.value }))}
                            placeholder="Enter flow rate"
                            className="w-full px-3 py-2 border border-purple-200 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                        />
                    ) : (
                        <div>
                            <p className="text-2xl font-bold text-purple-900">
                                {formatValue(jobCount?.rimeFlow)}
                            </p>
                            <p className="text-xs text-purple-600">CFM Rate</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Manual Mode Actions */}
            {isManualMode && (
                <div className="flex justify-end space-x-3">
                    <button
                        onClick={() => setIsManualMode(false)}
                        className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleManualSave}
                        className="px-4 py-2 border border-transparent rounded-lg text-sm font-medium text-white bg-green-600 hover:bg-green-700 transition-colors"
                    >
                        Save Manual Values
                    </button>
                </div>
            )}

            {/* Last Calculation Info */}
            {lastCalculation && !isManualMode && (
                <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center justify-between text-sm text-gray-600">
                        <span>
                            Last calculated: {new Date(lastCalculation.calculatedAt).toLocaleString()}
                        </span>
                        <span className="capitalize">
                            Source: {lastCalculation.source?.replace('_', ' ')}
                        </span>
                    </div>
                </div>
            )}
        </div>
    );
}

export default VentCalculationWidget;