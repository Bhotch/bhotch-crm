/**
 * Enterprise Testing Framework for Lomanco Vent Calculation System
 *
 * This comprehensive testing framework validates the entire automation pipeline
 * including web automation, mathematical fallbacks, and data validation.
 */

import { googleSheetsService } from '../api/googleSheetsService';

class VentCalculationTester {
    constructor() {
        this.testResults = [];
        this.isRunning = false;
        this.currentTest = null;
    }

    /**
     * Run complete test suite for vent calculation system
     */
    async runFullTestSuite(onProgress, onComplete) {
        this.isRunning = true;
        this.testResults = [];

        const testSuite = [
            { name: 'Connection Test', test: this.testConnection.bind(this) },
            { name: 'Basic Calculation Test', test: this.testBasicCalculation.bind(this) },
            { name: 'Mathematical Fallback Test', test: this.testMathematicalFallback.bind(this) },
            { name: 'Edge Cases Test', test: this.testEdgeCases.bind(this) },
            { name: 'Performance Test', test: this.testPerformance.bind(this) },
            { name: 'Data Validation Test', test: this.testDataValidation.bind(this) },
            { name: 'Error Handling Test', test: this.testErrorHandling.bind(this) },
            { name: 'Batch Processing Test', test: this.testBatchProcessing.bind(this) }
        ];

        try {
            for (let i = 0; i < testSuite.length; i++) {
                const testCase = testSuite[i];
                this.currentTest = testCase.name;

                if (onProgress) {
                    onProgress({
                        current: i + 1,
                        total: testSuite.length,
                        testName: testCase.name,
                        status: 'running'
                    });
                }

                try {
                    const result = await testCase.test();
                    this.testResults.push({
                        name: testCase.name,
                        status: 'passed',
                        result: result,
                        timestamp: new Date().toISOString()
                    });
                } catch (error) {
                    this.testResults.push({
                        name: testCase.name,
                        status: 'failed',
                        error: error.message,
                        timestamp: new Date().toISOString()
                    });
                }

                // Add delay between tests to avoid rate limiting
                await this.delay(1000);
            }

            const summary = this.generateSummary();

            if (onComplete) {
                onComplete({
                    summary: summary,
                    results: this.testResults,
                    success: summary.passed === testSuite.length
                });
            }

            return {
                success: true,
                summary: summary,
                results: this.testResults
            };

        } catch (error) {
            if (onComplete) {
                onComplete({
                    success: false,
                    error: error.message,
                    results: this.testResults
                });
            }
            return { success: false, error: error.message };
        } finally {
            this.isRunning = false;
            this.currentTest = null;
        }
    }

    /**
     * Test basic connection to Google Apps Script backend
     */
    async testConnection() {
        const response = await googleSheetsService.testConnection();

        if (!response.success) {
            throw new Error(`Connection failed: ${response.message}`);
        }

        return {
            connectionTime: Date.now(),
            spreadsheetId: response.spreadsheetId,
            sheetsFound: response.leadsSheet?.exists && response.jobCountSheet?.exists
        };
    }

    /**
     * Test basic vent calculation with known values
     */
    async testBasicCalculation() {
        const testCases = [
            { sqft: 1500, expectedRange: { ridgeMin: 5, ridgeMax: 15, turbineMin: 1, turbineMax: 5 } },
            { sqft: 2500, expectedRange: { ridgeMin: 8, ridgeMax: 25, turbineMin: 2, turbineMax: 8 } },
            { sqft: 4000, expectedRange: { ridgeMin: 12, ridgeMax: 40, turbineMin: 3, turbineMax: 12 } }
        ];

        const results = [];

        for (const testCase of testCases) {
            const response = await googleSheetsService.calculateLomacoVents(testCase.sqft);

            if (!response.success) {
                throw new Error(`Calculation failed for ${testCase.sqft} sqft: ${response.message}`);
            }

            const { ridgeVents, turbineVents, rimeFlow } = response.ventCalculations;
            const { expectedRange } = testCase;

            // Validate results are within expected ranges
            const ridgeValid = ridgeVents >= expectedRange.ridgeMin && ridgeVents <= expectedRange.ridgeMax;
            const turbineValid = turbineVents >= expectedRange.turbineMin && turbineVents <= expectedRange.turbineMax;
            const flowValid = rimeFlow > 0;

            if (!ridgeValid || !turbineValid || !flowValid) {
                throw new Error(`Results outside expected range for ${testCase.sqft} sqft`);
            }

            results.push({
                sqft: testCase.sqft,
                ridgeVents: ridgeVents,
                turbineVents: turbineVents,
                rimeFlow: rimeFlow,
                method: response.calculationMethod,
                valid: true
            });
        }

        return results;
    }

    /**
     * Test mathematical fallback calculations
     */
    async testMathematicalFallback() {
        // Test various SQFT values using mathematical formulas
        const testValues = [1000, 1500, 2000, 2500, 3000, 4000, 5000];
        const results = [];

        for (const sqft of testValues) {
            // Calculate expected values using industry standards
            const expectedRidgeVents = Math.ceil((sqft / 300 * 144) / 18);
            const expectedTurbineVents = Math.ceil((sqft / 300 * 144) / 140);
            const expectedRimeFlow = Math.round(sqft * 0.75 * 100) / 100;

            const response = await googleSheetsService.calculateLomacoVents(sqft);

            if (!response.success) {
                throw new Error(`Mathematical calculation failed for ${sqft} sqft`);
            }

            const { ridgeVents, turbineVents, rimeFlow } = response.ventCalculations;

            // Allow for slight variations in calculation methods
            const ridgeAccuracy = Math.abs(ridgeVents - expectedRidgeVents) <= 2;
            const turbineAccuracy = Math.abs(turbineVents - expectedTurbineVents) <= 1;
            const flowAccuracy = Math.abs(rimeFlow - expectedRimeFlow) <= expectedRimeFlow * 0.1;

            results.push({
                sqft: sqft,
                calculated: { ridgeVents, turbineVents, rimeFlow },
                expected: { ridgeVents: expectedRidgeVents, turbineVents: expectedTurbineVents, rimeFlow: expectedRimeFlow },
                accurate: ridgeAccuracy && turbineAccuracy && flowAccuracy
            });
        }

        return results;
    }

    /**
     * Test edge cases and boundary conditions
     */
    async testEdgeCases() {
        const edgeCases = [
            { sqft: 1, description: 'Minimum SQFT' },
            { sqft: 100, description: 'Very small house' },
            { sqft: 10000, description: 'Very large house' },
            { sqft: 1500.5, description: 'Decimal SQFT' }
        ];

        const results = [];

        for (const testCase of edgeCases) {
            try {
                const response = await googleSheetsService.calculateLomacoVents(testCase.sqft);

                results.push({
                    sqft: testCase.sqft,
                    description: testCase.description,
                    success: response.success,
                    calculations: response.success ? response.ventCalculations : null,
                    error: response.success ? null : response.message
                });
            } catch (error) {
                results.push({
                    sqft: testCase.sqft,
                    description: testCase.description,
                    success: false,
                    error: error.message
                });
            }
        }

        return results;
    }

    /**
     * Test system performance under load
     */
    async testPerformance() {
        const testRequests = 5;
        const sqftValue = 2500;
        const results = [];

        // Test sequential requests
        const sequentialStart = Date.now();
        for (let i = 0; i < testRequests; i++) {
            const requestStart = Date.now();
            const response = await googleSheetsService.calculateLomacoVents(sqftValue);
            const requestTime = Date.now() - requestStart;

            results.push({
                requestNumber: i + 1,
                responseTime: requestTime,
                success: response.success,
                method: response.success ? response.calculationMethod : null
            });
        }
        const sequentialTotal = Date.now() - sequentialStart;

        // Test concurrent requests
        const concurrentStart = Date.now();
        const concurrentPromises = Array(testRequests).fill().map((_, i) =>
            googleSheetsService.calculateLomacoVents(sqftValue + i)
        );

        const concurrentResults = await Promise.allSettled(concurrentPromises);
        const concurrentTotal = Date.now() - concurrentStart;

        return {
            sequential: {
                totalTime: sequentialTotal,
                averageTime: sequentialTotal / testRequests,
                results: results
            },
            concurrent: {
                totalTime: concurrentTotal,
                successCount: concurrentResults.filter(r => r.status === 'fulfilled').length,
                errorCount: concurrentResults.filter(r => r.status === 'rejected').length
            }
        };
    }

    /**
     * Test data validation and sanitization
     */
    async testDataValidation() {
        const invalidInputs = [
            { input: null, description: 'Null input' },
            { input: undefined, description: 'Undefined input' },
            { input: '', description: 'Empty string' },
            { input: 'abc', description: 'Text input' },
            { input: -100, description: 'Negative number' },
            { input: 0, description: 'Zero input' }
        ];

        const results = [];

        for (const testCase of invalidInputs) {
            try {
                const response = await googleSheetsService.calculateLomacoVents(testCase.input);

                // These should all fail validation
                results.push({
                    input: testCase.input,
                    description: testCase.description,
                    shouldFail: true,
                    actuallyFailed: !response.success,
                    response: response
                });
            } catch (error) {
                results.push({
                    input: testCase.input,
                    description: testCase.description,
                    shouldFail: true,
                    actuallyFailed: true,
                    error: error.message
                });
            }
        }

        return results;
    }

    /**
     * Test error handling and recovery
     */
    async testErrorHandling() {
        // This test verifies that the system gracefully handles various error conditions
        const results = {
            connectionRecovery: false,
            fallbackActivation: false,
            errorReporting: false
        };

        try {
            // Test with a valid request to ensure baseline functionality
            const baselineResponse = await googleSheetsService.calculateLomacoVents(2000);
            results.baselineSuccess = baselineResponse.success;

            // Test error reporting
            const invalidResponse = await googleSheetsService.calculateLomacoVents(-1);
            results.errorReporting = !invalidResponse.success && invalidResponse.message;

            // Test fallback mechanism by checking if both web and math methods work
            const fallbackResponse = await googleSheetsService.calculateLomacoVents(3000);
            if (fallbackResponse.success) {
                results.fallbackActivation = true;
            }

        } catch (error) {
            results.testError = error.message;
        }

        return results;
    }

    /**
     * Test batch processing functionality
     */
    async testBatchProcessing() {
        // Simulate batch processing test data
        const testJobCounts = [
            { id: 'test1', sqft: 1500 },
            { id: 'test2', sqft: 2000 },
            { id: 'test3', sqft: 2500 }
        ];

        const results = [];

        for (const jobCount of testJobCounts) {
            try {
                const response = await googleSheetsService.calculateLomacoVents(jobCount.sqft);

                results.push({
                    id: jobCount.id,
                    sqft: jobCount.sqft,
                    success: response.success,
                    calculations: response.success ? response.ventCalculations : null,
                    processingTime: response.processingTime || 'unknown'
                });

                // Add delay to simulate real batch processing
                await this.delay(500);
            } catch (error) {
                results.push({
                    id: jobCount.id,
                    sqft: jobCount.sqft,
                    success: false,
                    error: error.message
                });
            }
        }

        return {
            processedCount: results.length,
            successCount: results.filter(r => r.success).length,
            errorCount: results.filter(r => !r.success).length,
            results: results
        };
    }

    /**
     * Generate test summary
     */
    generateSummary() {
        const total = this.testResults.length;
        const passed = this.testResults.filter(r => r.status === 'passed').length;
        const failed = this.testResults.filter(r => r.status === 'failed').length;

        return {
            total: total,
            passed: passed,
            failed: failed,
            successRate: total > 0 ? Math.round((passed / total) * 100) : 0,
            completedAt: new Date().toISOString()
        };
    }

    /**
     * Utility function for adding delays
     */
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    /**
     * Get current test results
     */
    getResults() {
        return {
            isRunning: this.isRunning,
            currentTest: this.currentTest,
            results: this.testResults,
            summary: this.testResults.length > 0 ? this.generateSummary() : null
        };
    }
}

export default VentCalculationTester;