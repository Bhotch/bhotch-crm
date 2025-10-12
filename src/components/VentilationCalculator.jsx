import React, { useState } from 'react';
import { Calculator, ExternalLink, Info } from 'lucide-react';

/**
 * Ventilation Calculator Component
 * Based on standard roofing ventilation requirements and Lomanco guidelines
 *
 * Formulas:
 * - Net Free Area (NFA) Required = Attic Square Footage ÷ 150 (for balanced ventilation)
 * - Ridge Vent: Typically 18 sq in NFA per linear foot for standard ridge vent
 * - Turbine Vents: 12" turbine provides ~50 sq in NFA each
 * - Rime Flow: Calculated based on ridge vent coverage
 */

const VentilationCalculator = ({ sqft, onCalculate, currentValues = {} }) => {
    const [showCalculator, setShowCalculator] = useState(false);
    const [calculationResults, setCalculationResults] = useState(null);

    // Ventilation calculation constants
    const CONSTANTS = {
        NFA_DIVIDER: 150, // Standard: Attic sqft / 150 = NFA needed
        RIDGE_VENT_NFA_PER_FT: 18, // 18 sq in NFA per linear foot for DA-4 type
        TURBINE_12_NFA: 50, // 12" turbine provides ~50 sq in NFA
        RIDGE_VENT_COVERAGE: 0.5, // 50% ridge, 50% soffit for balanced system
    };

    const calculateVentilation = () => {
        if (!sqft || sqft <= 0) {
            alert('Please enter Square Feet first');
            return;
        }

        const squareFeet = parseFloat(sqft);

        // Calculate total NFA required (in square inches)
        const totalNFARequired = squareFeet / CONSTANTS.NFA_DIVIDER;

        // Split 50/50 between exhaust (ridge/turbine) and intake (soffit)
        const exhaustNFARequired = totalNFARequired * CONSTANTS.RIDGE_VENT_COVERAGE;

        // Calculate Ridge Vents (DA-4 type)
        // Ridge vent linear feet needed = Exhaust NFA / NFA per foot
        const ridgeVentsLF = Math.ceil(exhaustNFARequired / CONSTANTS.RIDGE_VENT_NFA_PER_FT);

        // Calculate Rime Flow (where DA-4 meets DA-4)
        // Typically 1 connector per 10 feet of ridge vent
        const rimeFlow = Math.ceil(ridgeVentsLF / 10);

        // Calculate Turbine Vents (12" size)
        // Number of turbines = Exhaust NFA / Turbine NFA
        const turbineVents = Math.ceil(exhaustNFARequired / CONSTANTS.TURBINE_12_NFA);

        const results = {
            squareFeet,
            totalNFARequired: Math.round(totalNFARequired),
            exhaustNFARequired: Math.round(exhaustNFARequired),
            ridgeVents: ridgeVentsLF,
            rimeFlow: rimeFlow,
            turbineVents: turbineVents,
            notes: [
                `Based on ${squareFeet} sq ft attic space`,
                `Total NFA needed: ${Math.round(totalNFARequired)} sq in`,
                `Exhaust NFA needed: ${Math.round(exhaustNFARequired)} sq in`,
                `Ridge Vent option: ${ridgeVentsLF} linear feet`,
                `Turbine option: ${turbineVents} x 12" turbines`,
                `Rime Flow connectors: ${rimeFlow} units`
            ]
        };

        setCalculationResults(results);
        return results;
    };

    const applyCalculation = () => {
        const results = calculateVentilation();
        if (results && onCalculate) {
            onCalculate({
                ridgeVents: results.ridgeVents,
                turbineVents: results.turbineVents,
                rimeFlow: results.rimeFlow
            });
            setShowCalculator(false);
        }
    };

    const openLomancoCalculator = () => {
        window.open('https://ventselector.lomanco.com/', '_blank');
    };

    return (
        <div className="border-2 border-blue-200 rounded-lg p-4 bg-blue-50">
            <div className="flex items-center justify-between mb-3">
                <div className="flex items-center space-x-2">
                    <Calculator className="w-5 h-5 text-blue-600" />
                    <h4 className="text-sm font-semibold text-blue-900">Ventilation Calculator</h4>
                    <button
                        type="button"
                        onClick={() => setShowCalculator(!showCalculator)}
                        className="text-xs text-blue-600 hover:text-blue-800 underline"
                    >
                        {showCalculator ? 'Hide' : 'Show'}
                    </button>
                </div>
                <button
                    type="button"
                    onClick={openLomancoCalculator}
                    className="inline-flex items-center text-xs text-blue-600 hover:text-blue-800 underline"
                >
                    <ExternalLink className="w-3 h-3 mr-1" />
                    Lomanco Calculator
                </button>
            </div>

            {showCalculator && (
                <div className="space-y-4">
                    <div className="bg-white p-3 rounded-lg border border-blue-200">
                        <div className="flex items-start space-x-2 mb-3">
                            <Info className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                            <div className="text-xs text-gray-700">
                                <p className="font-medium mb-1">How it works:</p>
                                <ol className="list-decimal list-inside space-y-1">
                                    <li>Enter Square Feet in the form above</li>
                                    <li>Click "Calculate Ventilation" below</li>
                                    <li>Review the calculated values</li>
                                    <li>Click "Apply to Form" to auto-fill</li>
                                </ol>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <div className="text-xs text-gray-600">
                                <strong>Current Square Feet:</strong> {sqft || 'Not entered'}
                            </div>

                            {currentValues.ridgeVents !== undefined && (
                                <div className="text-xs text-gray-600">
                                    <strong>Current Values:</strong> Ridge: {currentValues.ridgeVents},
                                    Turbine: {currentValues.turbineVents},
                                    Rime Flow: {currentValues.rimeFlow}
                                </div>
                            )}
                        </div>
                    </div>

                    <button
                        type="button"
                        onClick={calculateVentilation}
                        disabled={!sqft || sqft <= 0}
                        className="w-full inline-flex items-center justify-center px-4 py-2 border border-transparent rounded-lg text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                        <Calculator className="w-4 h-4 mr-2" />
                        Calculate Ventilation
                    </button>

                    {calculationResults && (
                        <div className="bg-white p-4 rounded-lg border border-green-200 space-y-3">
                            <h5 className="text-sm font-semibold text-green-900 flex items-center">
                                <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                                Calculation Results
                            </h5>

                            <div className="grid grid-cols-3 gap-3">
                                <div className="bg-green-50 p-3 rounded-lg text-center">
                                    <div className="text-xs text-gray-600 mb-1">Ridge Vents</div>
                                    <div className="text-2xl font-bold text-green-700">{calculationResults.ridgeVents}</div>
                                    <div className="text-xs text-gray-500">linear feet</div>
                                </div>
                                <div className="bg-green-50 p-3 rounded-lg text-center">
                                    <div className="text-xs text-gray-600 mb-1">Turbine Vents</div>
                                    <div className="text-2xl font-bold text-green-700">{calculationResults.turbineVents}</div>
                                    <div className="text-xs text-gray-500">12" units</div>
                                </div>
                                <div className="bg-green-50 p-3 rounded-lg text-center">
                                    <div className="text-xs text-gray-600 mb-1">Rime Flow</div>
                                    <div className="text-2xl font-bold text-green-700">{calculationResults.rimeFlow}</div>
                                    <div className="text-xs text-gray-500">connectors</div>
                                </div>
                            </div>

                            <div className="bg-gray-50 p-3 rounded-lg">
                                <div className="text-xs text-gray-700 space-y-1">
                                    {calculationResults.notes.map((note, index) => (
                                        <div key={index} className="flex items-start">
                                            <span className="text-gray-400 mr-2">•</span>
                                            <span>{note}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <button
                                type="button"
                                onClick={applyCalculation}
                                className="w-full inline-flex items-center justify-center px-4 py-2 border border-transparent rounded-lg text-sm font-medium text-white bg-green-600 hover:bg-green-700 transition-colors"
                            >
                                Apply to Form
                            </button>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default VentilationCalculator;
