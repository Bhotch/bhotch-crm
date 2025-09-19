// ============================================================================
// Bhotch CRM - Google Apps Script Backend (Code.gs)
// ULTIMATE LOMANCO AUTOMATION VERSION - Complete Job Count & Lead Management System
// ============================================================================

/**
 * @fileoverview Production-ready backend API for CRM application
 * with complete CRUD operations, advanced Lomanco automation, and enterprise features.
 * Updated: 2025-09-19 - Latest Lomanco Calculator Integration
 * Enhanced: 2025-09-19 - Added auto-calculation for ventilation values and updated pipe field mapping
 */

// --- CONFIGURATION ---
const SPREADSHEET_ID = '1E9VX7XI7GNGJa8Hq9__XAWv95WNgfJto1gUEXMbGqi0';
const LEADS_SHEET_NAME = 'Bhotchleads';
const JOB_COUNT_SHEET_NAME = 'Job Count';

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function createResponse(data, success = true, message = '') {
  const response = {
    success: success,
    message: message,
    timestamp: new Date().toISOString(),
    ...data
  };
  return ContentService
    .createTextOutput(JSON.stringify(response))
    .setMimeType(ContentService.MimeType.JSON);
}

function logMessage(message, level = 'INFO') {
  console.log(`[${new Date().toISOString()}] [${level}] ${message}`);
}

function getSheetSafely(sheetName) {
  try {
    const spreadsheet = SpreadsheetApp.openById(SPREADSHEET_ID);
    const sheet = spreadsheet.getSheetByName(sheetName);
    if (!sheet) {
      throw new Error(`Sheet "${sheetName}" not found in spreadsheet`);
    }
    return sheet;
  } catch (error) {
    throw new Error(`Failed to access sheet "${sheetName}": ${error.message}`);
  }
}

// ============================================================================
// WEB APP ENTRY POINTS
// ============================================================================

function doGet(e) {
  logMessage(`GET request received: ${JSON.stringify(e.parameter)}`);
  try {
    // Handle case where no parameters are provided
    if (!e.parameter || Object.keys(e.parameter).length === 0) {
      return createResponse({
        status: 'Ultimate Lomanco CRM API is running',
        version: '1.0.0',
        endpoints: {
          testConnection: 'GET ?action=testConnection',
          getLeads: 'GET ?action=getLeads',
          getJobCounts: 'GET ?action=getJobCounts'
        }
      }, true, 'API is operational');
    }

    const action = e.parameter.action;

    switch (action) {
      case 'getLeads':
        return getLeads();
      case 'getJobCounts':
        return getJobCounts();
      case 'testConnection':
        return testConnection();
      case 'health':
        return createResponse({
          status: 'healthy',
          timestamp: new Date().toISOString(),
          uptime: 'OK'
        }, true, 'System is healthy');
      default:
        return createResponse({
          availableActions: ['getLeads', 'getJobCounts', 'testConnection', 'health'],
          receivedAction: action
        }, false, `Unknown GET action: ${action}`);
    }
  } catch (error) {
    logMessage(`GET Error: ${error.toString()}`, 'ERROR');
    return createResponse({}, false, `Server Error: ${error.message}`);
  }
}

function doPost(e) {
  logMessage('POST request received');
  try {
    // Handle case where no POST data is provided
    if (!e.postData || !e.postData.contents) {
      return createResponse({}, false, 'No POST data provided');
    }

    let requestData;
    try {
      requestData = JSON.parse(e.postData.contents);
    } catch (parseError) {
      logMessage(`JSON Parse Error: ${parseError.toString()}`, 'ERROR');
      return createResponse({}, false, 'Invalid JSON in request body');
    }

    const action = requestData.action;
    if (!action) {
      return createResponse({
        availableActions: [
          'getLeads', 'addLead', 'updateLead', 'deleteLead',
          'getJobCounts', 'addJobCount', 'updateJobCount', 'deleteJobCount',
          'testConnection', 'geocodeAddress', 'calculateLomacoVents', 'batchCalculateVents'
        ]
      }, false, 'Action parameter is required');
    }

    logMessage(`Executing action: ${action}`);

    switch (action) {
      // Lead operations
      case 'getLeads':
        return getLeads();
      case 'addLead':
        return addLead(requestData.lead);
      case 'updateLead':
        return updateLead(requestData.lead);
      case 'deleteLead':
        return deleteLead(requestData.leadId);

      // Job Count operations
      case 'getJobCounts':
        return getJobCounts();
      case 'addJobCount':
        return addJobCount(requestData.jobCount);
      case 'updateJobCount':
        return updateJobCount(requestData.jobCount);
      case 'deleteJobCount':
        return deleteJobCount(requestData.jobCountId);

      // Utility operations
      case 'testConnection':
        return testConnection();
      case 'geocodeAddress':
        return geocodeAddress(requestData.address);

      // Lomanco vent calculation operations
      case 'calculateLomacoVents':
        return calculateLomacoVents(requestData.sqft, requestData.options);
      case 'batchCalculateVents':
        return batchCalculateVents(requestData.jobCountIds);

      default:
        return createResponse({
          availableActions: [
            'getLeads', 'addLead', 'updateLead', 'deleteLead',
            'getJobCounts', 'addJobCount', 'updateJobCount', 'deleteJobCount',
            'testConnection', 'geocodeAddress', 'calculateLomacoVents', 'batchCalculateVents'
          ],
          receivedAction: action
        }, false, `Unknown POST action: ${action}`);
    }
  } catch (error) {
    logMessage(`POST Error: ${error.toString()}`, 'ERROR');
    return createResponse({}, false, `Server Error: ${error.message}`);
  }
}

// ============================================================================
// UTILITY OPERATIONS
// ============================================================================

function testConnection() {
  logMessage('Testing connection to Google Sheets');
  try {
    const spreadsheet = SpreadsheetApp.openById(SPREADSHEET_ID);
    const leadsSheet = spreadsheet.getSheetByName(LEADS_SHEET_NAME);
    const jobCountSheet = spreadsheet.getSheetByName(JOB_COUNT_SHEET_NAME);

    const connectionStatus = {
      spreadsheetId: SPREADSHEET_ID,
      leadsSheet: {
        exists: !!leadsSheet,
        name: LEADS_SHEET_NAME,
        rowCount: leadsSheet ? leadsSheet.getLastRow() : 0
      },
      jobCountSheet: {
        exists: !!jobCountSheet,
        name: JOB_COUNT_SHEET_NAME,
        rowCount: jobCountSheet ? jobCountSheet.getLastRow() : 0
      }
    };

    logMessage(`Connection test successful: ${JSON.stringify(connectionStatus)}`);
    return createResponse(connectionStatus, true, 'Connection successful');
  } catch (error) {
    logMessage(`Connection test failed: ${error.toString()}`, 'ERROR');
    return createResponse({}, false, `Connection failed: ${error.message}`);
  }
}

function geocodeAddress(address) {
  if (!address) {
    return createResponse({}, false, 'Address parameter is required');
  }

  logMessage(`Geocoding address: ${address}`);
  try {
    const geocoder = Maps.newGeocoder().setRegion('US');
    const response = geocoder.geocode(address);

    if (response.status !== 'OK') {
      throw new Error(`Geocoding failed. Status: ${response.status}`);
    }

    const location = response.results[0].geometry.location;
    const coords = { latitude: location.lat, longitude: location.lng };

    logMessage(`Geocoding successful: ${JSON.stringify(coords)}`);
    return createResponse(coords, true, 'Address geocoded successfully');
  } catch (error) {
    logMessage(`Geocoding Error: ${error.toString()}`, 'ERROR');
    return createResponse({}, false, `Failed to geocode address: ${error.message}`);
  }
}

// ============================================================================
// LEAD OPERATIONS
// ============================================================================

function getLeads() {
  try {
    const sheet = getSheetSafely(LEADS_SHEET_NAME);
    const lastRow = sheet.getLastRow();

    if (lastRow <= 1) {
      return createResponse({ data: [], count: 0 }, true, 'No leads found');
    }

    const range = sheet.getDataRange();
    const values = range.getValues();
    const headers = values[0].map(h => String(h).trim());
    const dataRows = values.slice(1);

    const leads = dataRows.map(row => {
      const lead = {};
      headers.forEach((header, index) => {
        if (header) {
          const value = row[index];
          lead[header] = value instanceof Date ? value.toISOString() : value;
        }
      });
      return lead;
    });

    logMessage(`Successfully retrieved ${leads.length} leads`);
    return createResponse({ data: leads, count: leads.length }, true, `Retrieved ${leads.length} leads`);
  } catch (error) {
    logMessage(`getLeads Error: ${error.toString()}`, 'ERROR');
    return createResponse({ data: [] }, false, `Failed to fetch leads: ${error.message}`);
  }
}

function addLead(leadData) {
  try {
    if (!leadData || typeof leadData !== 'object') {
      throw new Error('Invalid lead data provided');
    }

    const sheet = getSheetSafely(LEADS_SHEET_NAME);
    const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];

    // Add metadata
    leadData.id = `lead_${Date.now()}`;
    leadData.createdDate = new Date().toISOString();
    leadData.status = leadData.status || 'new';

    const rowData = headers.map(header => leadData[header] || '');
    sheet.appendRow(rowData);

    logMessage(`Successfully added lead ID: ${leadData.id}`);
    return createResponse({ lead: leadData }, true, 'Lead added successfully');
  } catch (error) {
    logMessage(`addLead Error: ${error.toString()}`, 'ERROR');
    return createResponse({}, false, `Failed to add lead: ${error.message}`);
  }
}

function updateLead(leadData) {
  try {
    if (!leadData || !leadData.id) {
      throw new Error('Lead data with valid ID is required for updates');
    }

    const sheet = getSheetSafely(LEADS_SHEET_NAME);
    const data = sheet.getDataRange().getValues();
    const headers = data[0];
    const idColumnIndex = headers.indexOf('id');

    if (idColumnIndex === -1) {
      throw new Error("'id' column not found in sheet");
    }

    const rowIndex = data.slice(1).findIndex(row => row[idColumnIndex] == leadData.id) + 2;
    if (rowIndex < 2) {
      throw new Error(`Lead with ID ${leadData.id} not found`);
    }

    leadData.modifiedDate = new Date().toISOString();
    const rowData = headers.map(header =>
      leadData[header] !== undefined ? leadData[header] :
      sheet.getRange(rowIndex, headers.indexOf(header) + 1).getValue()
    );

    sheet.getRange(rowIndex, 1, 1, headers.length).setValues([rowData]);

    logMessage(`Successfully updated lead ID: ${leadData.id}`);
    return createResponse({ lead: leadData }, true, 'Lead updated successfully');
  } catch (error) {
    logMessage(`updateLead Error: ${error.toString()}`, 'ERROR');
    return createResponse({}, false, `Failed to update lead: ${error.message}`);
  }
}

function deleteLead(leadId) {
  try {
    if (!leadId) {
      throw new Error('Lead ID is required for deletion');
    }

    const sheet = getSheetSafely(LEADS_SHEET_NAME);
    const data = sheet.getDataRange().getValues();
    const headers = data[0];
    const idColumnIndex = headers.indexOf('id');

    if (idColumnIndex === -1) {
      throw new Error("'id' column not found in sheet");
    }

    const rowIndex = data.slice(1).findIndex(row => row[idColumnIndex] == leadId) + 2;
    if (rowIndex < 2) {
      throw new Error(`Lead with ID ${leadId} not found`);
    }

    sheet.deleteRow(rowIndex);

    logMessage(`Successfully deleted lead ID: ${leadId}`);
    return createResponse({ deletedId: leadId }, true, 'Lead deleted successfully');
  } catch (error) {
    logMessage(`deleteLead Error: ${error.toString()}`, 'ERROR');
    return createResponse({}, false, `Failed to delete lead: ${error.message}`);
  }
}

// ============================================================================
// JOB COUNT OPERATIONS
// ============================================================================

function getJobCounts() {
  try {
    const sheet = getSheetSafely(JOB_COUNT_SHEET_NAME);
    const lastRow = sheet.getLastRow();

    if (lastRow <= 1) {
      return createResponse({ data: [], count: 0 }, true, 'No job counts found');
    }

    const range = sheet.getDataRange();
    const values = range.getValues();
    const headers = values[0].map(h => String(h).trim());
    const dataRows = values.slice(1);

    const jobCounts = dataRows.map((row, index) => {
      const jobCount = {};
      headers.forEach((header, columnIndex) => {
        if (header) {
          const value = row[columnIndex];
          const camelCaseHeader = convertToCamelCase(header);
          jobCount[camelCaseHeader] = value instanceof Date ? value.toISOString() : value;
        }
      });

      // Ensure we have an ID field
      if (!jobCount.id) {
        jobCount.id = `jobcount_${Date.now()}_${index}`;
      }

      return jobCount;
    });

    logMessage(`Successfully retrieved ${jobCounts.length} job counts`);
    return createResponse({ data: jobCounts, count: jobCounts.length }, true, `Retrieved ${jobCounts.length} job counts`);
  } catch (error) {
    logMessage(`getJobCounts Error: ${error.toString()}`, 'ERROR');
    return createResponse({ data: [] }, false, `Failed to fetch job counts: ${error.message}`);
  }
}

function addJobCount(jobCountData) {
  try {
    if (!jobCountData || typeof jobCountData !== 'object') {
      throw new Error('Invalid job count data provided');
    }

    const sheet = getSheetSafely(JOB_COUNT_SHEET_NAME);
    const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];

    // Add metadata
    jobCountData.id = `jobcount_${Date.now()}`;
    jobCountData.createdDate = new Date().toISOString();

    // Auto-calculate ventilation values if sqFt is provided (matching frontend logic)
    if (jobCountData.sqFt && !isNaN(parseFloat(jobCountData.sqFt))) {
      const sqFt = parseFloat(jobCountData.sqFt);
      if (!jobCountData.ridgeVents) {
        jobCountData.ridgeVents = Math.ceil(sqFt / 250).toString();
      }
      if (!jobCountData.turbine) {
        jobCountData.turbine = Math.ceil(sqFt / 1250).toString();
      }
      if (!jobCountData.rimeFlow) {
        jobCountData.rimeFlow = Math.ceil(sqFt * 0.04).toString();
      }
    }

    // Map camelCase frontend fields to sheet headers
    const rowData = headers.map(header => {
      const camelCaseHeader = convertToCamelCase(header);
      return jobCountData[camelCaseHeader] || '';
    });

    sheet.appendRow(rowData);

    logMessage(`Successfully added job count ID: ${jobCountData.id}`);
    return createResponse({ jobCount: jobCountData }, true, 'Job count added successfully');
  } catch (error) {
    logMessage(`addJobCount Error: ${error.toString()}`, 'ERROR');
    return createResponse({}, false, `Failed to add job count: ${error.message}`);
  }
}

function updateJobCount(jobCountData) {
  try {
    if (!jobCountData || !jobCountData.id) {
      throw new Error('Job count data with valid ID is required for updates');
    }

    const sheet = getSheetSafely(JOB_COUNT_SHEET_NAME);
    const data = sheet.getDataRange().getValues();
    const headers = data[0];

    // Find ID column or use name/date combination
    let idColumnIndex = headers.findIndex(h => h.toLowerCase().trim() === 'id');
    let rowIndex;

    if (idColumnIndex !== -1) {
      rowIndex = data.slice(1).findIndex(row => row[idColumnIndex] == jobCountData.id) + 2;
    } else {
      // Fallback to firstname/lastname/date matching
      const firstNameIndex = headers.findIndex(h => h.toLowerCase().includes('first'));
      const lastNameIndex = headers.findIndex(h => h.toLowerCase().includes('last'));
      const dateIndex = headers.findIndex(h => h.toLowerCase().includes('date'));

      if (firstNameIndex !== -1 && dateIndex !== -1) {
        rowIndex = data.slice(1).findIndex(row =>
          row[firstNameIndex] == jobCountData.firstName &&
          (row[lastNameIndex] == jobCountData.lastName || !jobCountData.lastName) &&
          (row[dateIndex] == jobCountData.date ||
           new Date(row[dateIndex]).toISOString().split('T')[0] == jobCountData.date)
        ) + 2;
      }
    }

    if (!rowIndex || rowIndex < 2) {
      throw new Error('Job count not found for update');
    }

    jobCountData.modifiedDate = new Date().toISOString();

    // Auto-calculate ventilation values if sqFt is provided (matching frontend logic)
    if (jobCountData.sqFt && !isNaN(parseFloat(jobCountData.sqFt))) {
      const sqFt = parseFloat(jobCountData.sqFt);
      if (!jobCountData.ridgeVents) {
        jobCountData.ridgeVents = Math.ceil(sqFt / 250).toString();
      }
      if (!jobCountData.turbine) {
        jobCountData.turbine = Math.ceil(sqFt / 1250).toString();
      }
      if (!jobCountData.rimeFlow) {
        jobCountData.rimeFlow = Math.ceil(sqFt * 0.04).toString();
      }
    }

    const rowData = headers.map(header => {
      const camelCaseHeader = convertToCamelCase(header);
      return jobCountData[camelCaseHeader] !== undefined ?
        jobCountData[camelCaseHeader] :
        sheet.getRange(rowIndex, headers.indexOf(header) + 1).getValue();
    });

    sheet.getRange(rowIndex, 1, 1, headers.length).setValues([rowData]);

    logMessage(`Successfully updated job count ID: ${jobCountData.id}`);
    return createResponse({ jobCount: jobCountData }, true, 'Job count updated successfully');
  } catch (error) {
    logMessage(`updateJobCount Error: ${error.toString()}`, 'ERROR');
    return createResponse({}, false, `Failed to update job count: ${error.message}`);
  }
}

function deleteJobCount(jobCountId) {
  try {
    if (!jobCountId) {
      throw new Error('Job count ID is required for deletion');
    }

    const sheet = getSheetSafely(JOB_COUNT_SHEET_NAME);
    const data = sheet.getDataRange().getValues();
    const headers = data[0];

    const idColumnIndex = headers.findIndex(h => h.toLowerCase().trim() === 'id');
    if (idColumnIndex === -1) {
      throw new Error("'id' column not found in job count sheet");
    }

    const rowIndex = data.slice(1).findIndex(row => row[idColumnIndex] == jobCountId) + 2;
    if (rowIndex < 2) {
      throw new Error(`Job count with ID ${jobCountId} not found`);
    }

    sheet.deleteRow(rowIndex);

    logMessage(`Successfully deleted job count ID: ${jobCountId}`);
    return createResponse({ deletedId: jobCountId }, true, 'Job count deleted successfully');
  } catch (error) {
    logMessage(`deleteJobCount Error: ${error.toString()}`, 'ERROR');
    return createResponse({}, false, `Failed to delete job count: ${error.message}`);
  }
}

// ============================================================================
// LOMANCO VENT CALCULATION AUTOMATION
// ============================================================================

/**
 * Enterprise-grade Lomanco vent calculation service
 * Supports web automation with mathematical fallback
 */
class LomacoVentCalculationService {
  constructor() {
    this.baseUrl = 'https://ventselector.lomanco.com/index.php';
    this.retryAttempts = 5;
    this.retryDelay = 1500;
    this.requestTimeout = 15000;
    this.userAgents = [
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36',
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    ];
    this.sessionCache = new Map();
  }

  /**
   * Calculate vent requirements with fallback strategy
   */
  calculateVentRequirements(sqft, options = {}) {
    try {
      logMessage(`Starting vent calculation for ${sqft} sqft`);

      // Primary: Web automation approach
      const webResult = this.calculateViaWebAutomation(sqft, options);
      if (webResult.success) {
        logMessage('Web automation successful');
        return webResult;
      }

      logMessage('Web automation failed, using mathematical fallback');

      // Secondary: Mathematical fallback
      const mathResult = this.calculateViaMathematicalFormulas(sqft, options);
      if (mathResult.success) {
        logMessage('Mathematical calculation successful');
        return mathResult;
      }

      logMessage('All calculation methods failed');
      return createResponse({}, false, 'All calculation methods failed. Manual entry required.');

    } catch (error) {
      logMessage(`Vent calculation error: ${error.toString()}`, 'ERROR');
      return createResponse({}, false, `Calculation failed: ${error.message}`);
    }
  }

  /**
   * Web automation approach using UrlFetchApp
   */
  calculateViaWebAutomation(sqft, options = {}) {
    try {
      for (let attempt = 1; attempt <= this.retryAttempts; attempt++) {
        try {
          logMessage(`Web automation attempt ${attempt} for ${sqft} sqft`);

          // Step 1: Get initial page to establish session
          const sessionResponse = UrlFetchApp.fetch(this.baseUrl, {
            method: 'GET',
            followRedirects: true,
            muteHttpExceptions: true,
            headers: {
              'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            }
          });

          if (sessionResponse.getResponseCode() !== 200) {
            throw new Error(`Session setup failed: ${sessionResponse.getResponseCode()}`);
          }

          // Step 2: Submit calculation request
          const calculationPayload = {
            'attic_floor_space': sqft.toString(),
            'exhaust_system': 'ridge_vent',
            'roof_slope': '4'
          };

          const calculationResponse = UrlFetchApp.fetch(this.baseUrl, {
            method: 'POST',
            payload: calculationPayload,
            followRedirects: true,
            muteHttpExceptions: true,
            headers: {
              'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
              'Content-Type': 'application/x-www-form-urlencoded',
              'X-Requested-With': 'XMLHttpRequest'
            }
          });

          if (calculationResponse.getResponseCode() !== 200) {
            throw new Error(`Calculation request failed: ${calculationResponse.getResponseCode()}`);
          }

          const responseText = calculationResponse.getContentText();
          const results = this.parseLomacoResponse(responseText, sqft);

          if (results.success) {
            return createResponse({
              ventCalculations: results.data,
              calculationMethod: 'web_automation',
              timestamp: new Date().toISOString()
            }, true, 'Lomanco calculation completed successfully');
          } else {
            throw new Error('Failed to parse Lomanco response');
          }

        } catch (attemptError) {
          logMessage(`Attempt ${attempt} failed: ${attemptError.message}`, 'WARN');
          if (attempt < this.retryAttempts) {
            Utilities.sleep(this.retryDelay * attempt);
          } else {
            throw attemptError;
          }
        }
      }
    } catch (error) {
      logMessage(`Web automation failed: ${error.toString()}`, 'ERROR');
      return { success: false, message: error.message };
    }
  }

  /**
   * Parse Lomanco website response to extract vent values
   */
  parseLomacoResponse(htmlContent, sqft) {
    try {
      let ridgeVents = 0;
      let turbineVents = 0;
      let rimeFlow = 0;

      // Extract DA-4 Ridge Vent values
      const ridgeVentRegex = /DA-4[^0-9]*(\d+)/gi;
      const ridgeMatches = htmlContent.match(ridgeVentRegex);
      if (ridgeMatches && ridgeMatches.length > 0) {
        const numbers = ridgeMatches[0].match(/\d+/);
        if (numbers) ridgeVents = parseInt(numbers[0]);
      }

      // Extract ALL-14" Turbine values
      const turbineRegex = /ALL-14["\s]*[^0-9]*(\d+)/gi;
      const turbineMatches = htmlContent.match(turbineRegex);
      if (turbineMatches && turbineMatches.length > 0) {
        const numbers = turbineMatches[0].match(/\d+/);
        if (numbers) turbineVents = parseInt(numbers[0]);
      }

      // Extract Rime Flow values (typically between ridge vent calculations)
      const rimeFlowRegex = /(?:rime|flow)[^0-9]*(\d+(?:\.\d+)?)/gi;
      const rimeMatches = htmlContent.match(rimeFlowRegex);
      if (rimeMatches && rimeMatches.length > 0) {
        const numbers = rimeMatches[0].match(/\d+(?:\.\d+)?/);
        if (numbers) rimeFlow = parseFloat(numbers[0]);
      }

      // Validate results
      if (ridgeVents > 0 || turbineVents > 0) {
        return {
          success: true,
          data: {
            ridgeVents: ridgeVents,
            turbineVents: turbineVents,
            rimeFlow: rimeFlow,
            sqft: sqft,
            source: 'lomanco_web'
          }
        };
      }

      return { success: false, message: 'No valid vent calculations found in response' };

    } catch (error) {
      logMessage(`Response parsing error: ${error.toString()}`, 'ERROR');
      return { success: false, message: `Failed to parse response: ${error.message}` };
    }
  }

  /**
   * Mathematical fallback calculation based on industry standards
   */
  calculateViaMathematicalFormulas(sqft, options = {}) {
    try {
      logMessage(`Calculating vents using mathematical formulas for ${sqft} sqft`);

      // Industry standard: 1 sq ft of ventilation per 300 sq ft of attic space
      const requiredVentilationSqFt = sqft / 300;

      // Ridge vent calculations (DA-4 specifications)
      // DA-4: ~18 sq in of Net Free Area per linear foot
      const da4NfaPerFoot = 18; // sq inches per linear foot
      const requiredVentilationSqIn = requiredVentilationSqFt * 144; // convert to sq inches
      const ridgeVentsLinearFt = Math.ceil(requiredVentilationSqIn / da4NfaPerFoot);

      // Turbine vent calculations (ALL-14" specifications)
      // ALL-14": ~130-150 sq in effective area
      const all14EffectiveArea = 140; // sq inches per turbine
      const turbineVentsCount = Math.ceil(requiredVentilationSqIn / all14EffectiveArea);

      // Rime flow calculation (CFM estimate)
      // Standard: ~0.75 CFM per sq ft of attic space
      const rimeFlowCfm = Math.round(sqft * 0.75 * 100) / 100;

      const calculations = {
        ridgeVents: ridgeVentsLinearFt,
        turbineVents: turbineVentsCount,
        rimeFlow: rimeFlowCfm,
        sqft: sqft,
        source: 'mathematical_formula'
      };

      logMessage(`Mathematical calculation complete: ${JSON.stringify(calculations)}`);

      return createResponse({
        ventCalculations: calculations,
        calculationMethod: 'mathematical_fallback',
        timestamp: new Date().toISOString()
      }, true, 'Mathematical calculation completed successfully');

    } catch (error) {
      logMessage(`Mathematical calculation error: ${error.toString()}`, 'ERROR');
      return { success: false, message: `Mathematical calculation failed: ${error.message}` };
    }
  }
}

/**
 * Main vent calculation endpoint
 */
function calculateLomacoVents(sqft, options = {}) {
  try {
    if (!sqft || isNaN(sqft) || sqft <= 0) {
      return createResponse({}, false, 'Valid SQFT value is required');
    }

    const calculator = new LomacoVentCalculationService();
    return calculator.calculateVentRequirements(parseFloat(sqft), options);

  } catch (error) {
    logMessage(`calculateLomacoVents Error: ${error.toString()}`, 'ERROR');
    return createResponse({}, false, `Vent calculation failed: ${error.message}`);
  }
}

/**
 * Batch process multiple job counts for vent calculations
 */
function batchCalculateVents(jobCountIds = []) {
  try {
    const sheet = getSheetSafely(JOB_COUNT_SHEET_NAME);
    const data = sheet.getDataRange().getValues();
    const headers = data[0];

    const sqftIndex = headers.findIndex(h => h.toLowerCase().includes('sq ft'));
    const ridgeVentsIndex = headers.findIndex(h => h.toLowerCase().includes('ridge vents'));
    const turbineIndex = headers.findIndex(h => h.toLowerCase().includes('turbine'));
    const rimeFlowIndex = headers.findIndex(h => h.toLowerCase().includes('rime flow'));

    if (sqftIndex === -1) {
      return createResponse({}, false, 'SQFT column not found in Job Count sheet');
    }

    let processedCount = 0;
    let errorCount = 0;
    const results = [];

    // Process each row
    for (let i = 1; i < data.length; i++) {
      try {
        const row = data[i];
        const sqft = parseFloat(row[sqftIndex]);

        if (!isNaN(sqft) && sqft > 0) {
          const calculationResult = calculateLomacoVents(sqft);
          const calculationData = JSON.parse(calculationResult.getContent());

          if (calculationData.success) {
            const vents = calculationData.ventCalculations;

            // Update the sheet with calculated values
            if (ridgeVentsIndex !== -1) {
              sheet.getRange(i + 1, ridgeVentsIndex + 1).setValue(vents.ridgeVents);
            }
            if (turbineIndex !== -1) {
              sheet.getRange(i + 1, turbineIndex + 1).setValue(vents.turbineVents);
            }
            if (rimeFlowIndex !== -1) {
              sheet.getRange(i + 1, rimeFlowIndex + 1).setValue(vents.rimeFlow);
            }

            processedCount++;
            results.push({
              row: i + 1,
              sqft: sqft,
              calculations: vents,
              success: true
            });
          } else {
            errorCount++;
            results.push({
              row: i + 1,
              sqft: sqft,
              error: calculationData.message,
              success: false
            });
          }
        }
      } catch (rowError) {
        errorCount++;
        logMessage(`Error processing row ${i + 1}: ${rowError.toString()}`, 'ERROR');
      }
    }

    return createResponse({
      processedCount: processedCount,
      errorCount: errorCount,
      results: results
    }, true, `Batch calculation complete: ${processedCount} processed, ${errorCount} errors`);

  } catch (error) {
    logMessage(`Batch calculation error: ${error.toString()}`, 'ERROR');
    return createResponse({}, false, `Batch calculation failed: ${error.message}`);
  }
}

// ============================================================================
// ENHANCED LOMANCO AUTOMATION FEATURES
// ============================================================================

/**
 * Enhanced web automation strategies for Lomanco calculator
 */
function tryMultipleWebStrategies(sqft, options = {}) {
  const service = new LomacoVentCalculationService();

  // Strategy 1: Direct POST with comprehensive headers
  try {
    const userAgent = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

    const payload = {
      'attic_floor_space': sqft.toString(),
      'exhaust_system': 'ridge_vent',
      'roof_slope': options.roofSlope || '4',
      'roof_type': options.roofType || 'shingle',
      'climate_zone': options.climateZone || 'mixed',
      'intake_system': 'soffit_vent'
    };

    const response = UrlFetchApp.fetch(service.baseUrl, {
      method: 'POST',
      payload: payload,
      followRedirects: true,
      muteHttpExceptions: true,
      headers: {
        'User-Agent': userAgent,
        'Content-Type': 'application/x-www-form-urlencoded',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
        'Accept-Encoding': 'gzip, deflate, br',
        'DNT': '1',
        'Connection': 'keep-alive',
        'Upgrade-Insecure-Requests': '1'
      }
    });

    if (response.getResponseCode() === 200) {
      const results = parseEnhancedLomacoResponse(response.getContentText(), sqft);
      if (results.success) {
        return createResponse({
          ventCalculations: results.data,
          calculationMethod: 'enhanced_web_automation',
          timestamp: new Date().toISOString()
        }, true, 'Enhanced Lomanco calculation successful');
      }
    }
  } catch (error) {
    logMessage(`Enhanced web strategy failed: ${error.message}`, 'WARN');
  }

  return { success: false, message: 'Enhanced web strategies failed' };
}

/**
 * Enhanced response parser with multiple extraction strategies
 */
function parseEnhancedLomacoResponse(htmlContent, sqft) {
  try {
    let ridgeVents = 0;
    let turbineVents = 0;
    let rimeFlow = 0;
    let extractionMethod = 'unknown';

    // Strategy 1: JSON response parsing
    try {
      const jsonData = JSON.parse(htmlContent);
      if (jsonData.ridge_vents || jsonData.ridgeVents) {
        ridgeVents = parseInt(jsonData.ridge_vents || jsonData.ridgeVents) || 0;
        turbineVents = parseInt(jsonData.turbine_vents || jsonData.turbineVents) || 0;
        rimeFlow = parseFloat(jsonData.rime_flow || jsonData.rimeFlow || jsonData.cfm) || 0;
        extractionMethod = 'json_api';
      }
    } catch (jsonError) {
      // Not JSON, continue with HTML parsing
    }

    // Strategy 2: Enhanced HTML parsing with multiple patterns
    if (ridgeVents === 0 && turbineVents === 0) {
      // Enhanced DA-4 Ridge Vent extraction patterns
      const ridgePatterns = [
        /DA-?4[^\d]*(\d+)\s*(?:feet|ft|linear)/gi,
        /ridge[^\d]*(\d+)\s*(?:feet|ft|linear)/gi,
        /DA-?4[^\d]*(\d+)/gi,
        /<span[^>]*ridge[^>]*>(\d+)<\/span>/gi,
        /id=["']ridge[^"']*["'][^>]*>(\d+)/gi
      ];

      for (const pattern of ridgePatterns) {
        const matches = htmlContent.match(pattern);
        if (matches && matches.length > 0) {
          const numbers = matches[0].match(/\d+/);
          if (numbers && parseInt(numbers[0]) > 0) {
            ridgeVents = parseInt(numbers[0]);
            extractionMethod = 'html_ridge_pattern';
            break;
          }
        }
      }

      // Enhanced ALL-14" Turbine extraction patterns
      const turbinePatterns = [
        /ALL-?14["\s]*[^\d]*(\d+)\s*(?:units?|turbines?)/gi,
        /turbine[^\d]*(\d+)\s*(?:units?)/gi,
        /ALL-?14["\s]*[^\d]*(\d+)/gi,
        /<span[^>]*turbine[^>]*>(\d+)<\/span>/gi,
        /id=["']turbine[^"']*["'][^>]*>(\d+)/gi
      ];

      for (const pattern of turbinePatterns) {
        const matches = htmlContent.match(pattern);
        if (matches && matches.length > 0) {
          const numbers = matches[0].match(/\d+/);
          if (numbers && parseInt(numbers[0]) > 0) {
            turbineVents = parseInt(numbers[0]);
            if (extractionMethod === 'unknown') extractionMethod = 'html_turbine_pattern';
            break;
          }
        }
      }

      // Enhanced Rime Flow extraction patterns
      const rimeFlowPatterns = [
        /(?:rime|flow)[^\d]*(\d+(?:\.\d+)?)\s*(?:cfm|cubic)/gi,
        /cfm[^\d]*(\d+(?:\.\d+)?)/gi,
        /air\s*flow[^\d]*(\d+(?:\.\d+)?)/gi,
        /<span[^>]*flow[^>]*>(\d+(?:\.\d+)?)<\/span>/gi,
        /id=["']flow[^"']*["'][^>]*>(\d+(?:\.\d+)?)/gi
      ];

      for (const pattern of rimeFlowPatterns) {
        const matches = htmlContent.match(pattern);
        if (matches && matches.length > 0) {
          const numbers = matches[0].match(/\d+(?:\.\d+)?/);
          if (numbers && parseFloat(numbers[0]) > 0) {
            rimeFlow = parseFloat(numbers[0]);
            if (extractionMethod === 'unknown') extractionMethod = 'html_flow_pattern';
            break;
          }
        }
      }
    }

    // Validation and sanity checks
    if (ridgeVents > 0 || turbineVents > 0) {
      // Sanity check: values should be reasonable for the given SQFT
      const maxReasonableRidge = Math.ceil(sqft / 50); // Very generous upper bound
      const maxReasonableTurbine = Math.ceil(sqft / 200); // Very generous upper bound

      if (ridgeVents > maxReasonableRidge) {
        logMessage(`Ridge vent value ${ridgeVents} seems too high for ${sqft} sqft, capping at ${maxReasonableRidge}`, 'WARN');
        ridgeVents = maxReasonableRidge;
      }

      if (turbineVents > maxReasonableTurbine) {
        logMessage(`Turbine vent value ${turbineVents} seems too high for ${sqft} sqft, capping at ${maxReasonableTurbine}`, 'WARN');
        turbineVents = maxReasonableTurbine;
      }

      // Estimate Rime Flow if not found
      if (rimeFlow === 0) {
        rimeFlow = Math.round(sqft * 0.75 * 100) / 100;
        logMessage(`Rime flow not found in response, estimated as ${rimeFlow}`, 'INFO');
      }

      return {
        success: true,
        data: {
          ridgeVents: ridgeVents,
          turbineVents: turbineVents,
          rimeFlow: rimeFlow,
          sqft: sqft,
          source: 'lomanco_web_enhanced',
          extractionMethod: extractionMethod,
          timestamp: new Date().toISOString()
        }
      };
    }

    logMessage(`No valid vent calculations found. Response preview: ${htmlContent.substring(0, 500)}...`, 'WARN');
    return { success: false, message: 'No valid vent calculations found in response' };

  } catch (error) {
    logMessage(`Enhanced response parsing error: ${error.toString()}`, 'ERROR');
    return { success: false, message: `Failed to parse response: ${error.message}` };
  }
}

/**
 * Enhanced mathematical calculations with climate and roof adjustments
 */
function calculateEnhancedMathematical(sqft, options = {}) {
  try {
    logMessage(`Calculating vents using enhanced mathematical formulas for ${sqft} sqft`);

    // Enhanced calculation options
    const roofSlope = parseFloat(options.roofSlope) || 4;
    const climateZone = options.climateZone || 'mixed';
    const buildingType = options.buildingType || 'residential';
    const insulationLevel = options.insulationLevel || 'standard';

    // Base ventilation requirements
    const requiredVentilationSqFt = sqft / 150; // Enhanced standard
    const requiredVentilationSqIn = requiredVentilationSqFt * 144; // convert to sq inches

    // Ridge vent calculations with roof slope adjustment
    const slopeMultiplier = getRoofSlopeMultiplier(roofSlope);
    const da4NfaPerFoot = 18 * slopeMultiplier; // Adjusted for slope
    const ridgeVentsLinearFt = Math.ceil(requiredVentilationSqIn / da4NfaPerFoot);

    // Turbine vent calculations with performance adjustments
    const all14EffectiveArea = getTurbineEffectiveArea(climateZone);
    const turbineVentsCount = Math.ceil(requiredVentilationSqIn / all14EffectiveArea);

    // Enhanced Rime flow calculation with multiple factors
    const baseFlowRate = 0.75; // CFM per sq ft
    const climateMultiplier = getClimateFlowMultiplier(climateZone);
    const insulationMultiplier = getInsulationMultiplier(insulationLevel);
    const rimeFlowCfm = Math.round(sqft * baseFlowRate * climateMultiplier * insulationMultiplier * 100) / 100;

    const calculations = {
      ridgeVents: ridgeVentsLinearFt,
      turbineVents: turbineVentsCount,
      rimeFlow: rimeFlowCfm,
      sqft: sqft,
      source: 'mathematical_formula_enhanced',
      calculationDetails: {
        roofSlope: roofSlope,
        climateZone: climateZone,
        slopeMultiplier: slopeMultiplier,
        requiredVentilationSqFt: requiredVentilationSqFt,
        requiredVentilationSqIn: requiredVentilationSqIn
      }
    };

    logMessage(`Enhanced mathematical calculation complete: ${JSON.stringify(calculations)}`);

    return createResponse({
      ventCalculations: calculations,
      calculationMethod: 'mathematical_enhanced',
      timestamp: new Date().toISOString()
    }, true, 'Enhanced mathematical calculation completed successfully');

  } catch (error) {
    logMessage(`Enhanced mathematical calculation error: ${error.toString()}`, 'ERROR');
    return { success: false, message: `Enhanced mathematical calculation failed: ${error.message}` };
  }
}

// Helper functions for enhanced calculations
function getRoofSlopeMultiplier(roofSlope) {
  if (roofSlope >= 12) return 1.2;      // Steep roof - better natural ventilation
  if (roofSlope >= 8) return 1.1;       // High slope
  if (roofSlope >= 6) return 1.0;       // Standard slope
  if (roofSlope >= 4) return 0.9;       // Low slope - reduced effectiveness
  return 0.8;                           // Very low slope
}

function getTurbineEffectiveArea(climateZone) {
  const baseArea = 140; // sq inches
  const adjustments = {
    'hot_humid': baseArea * 0.9,    // Reduced effectiveness in high humidity
    'hot_dry': baseArea * 1.1,      // Better performance in dry conditions
    'mixed': baseArea,              // Standard
    'cold': baseArea * 0.8,         // Reduced effectiveness in cold
    'very_cold': baseArea * 0.7     // Minimal effectiveness
  };
  return adjustments[climateZone] || baseArea;
}

function getClimateFlowMultiplier(climateZone) {
  const multipliers = {
    'hot_humid': 1.3,       // Higher flow needed
    'hot_dry': 1.2,         // Moderate increase
    'mixed': 1.0,           // Standard
    'cold': 0.8,            // Reduced flow
    'very_cold': 0.6        // Minimal flow
  };
  return multipliers[climateZone] || 1.0;
}

function getInsulationMultiplier(insulationLevel) {
  const multipliers = {
    'minimal': 1.4,         // Poor insulation needs more ventilation
    'standard': 1.0,        // Standard
    'enhanced': 0.8,        // Good insulation needs less
    'superior': 0.6         // Excellent insulation
  };
  return multipliers[insulationLevel] || 1.0;
}

// ============================================================================
// TESTING FUNCTIONS
// ============================================================================

/**
 * Test function that can be called directly from Google Apps Script editor
 */
function runTestSuite() {
  logMessage('=== Starting Google Apps Script Test Suite ===');

  try {
    // Test 1: Connection test
    logMessage('Test 1: Testing connection...');
    const connectionTest = testConnection();
    const connectionData = JSON.parse(connectionTest.getContent());
    logMessage(`Connection test result: ${connectionData.success ? 'PASSED' : 'FAILED'}`);

    // Test 2: Mathematical calculation
    logMessage('Test 2: Testing mathematical calculation...');
    const mathTest = calculateLomacoVents(2500);
    const mathData = JSON.parse(mathTest.getContent());
    logMessage(`Math calculation result: ${mathData.success ? 'PASSED' : 'FAILED'}`);
    if (mathData.success) {
      logMessage(`Ridge Vents: ${mathData.ventCalculations.ridgeVents}, Turbine: ${mathData.ventCalculations.turbineVents}, Rime Flow: ${mathData.ventCalculations.rimeFlow}`);
    }

    // Test 3: API endpoint simulation
    logMessage('Test 3: Testing GET endpoint...');
    const getTest = doGet({ parameter: { action: 'testConnection' } });
    const getData = JSON.parse(getTest.getContent());
    logMessage(`GET endpoint test result: ${getData.success ? 'PASSED' : 'FAILED'}`);

    logMessage('=== Test Suite Complete ===');
    return 'All tests completed. Check execution logs for results.';

  } catch (error) {
    logMessage(`Test suite error: ${error.toString()}`, 'ERROR');
    return `Test suite failed: ${error.message}`;
  }
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Converts sheet header names to camelCase for frontend compatibility
 */
function convertToCamelCase(headerName) {
  if (!headerName) return '';

  const specialCases = {
    // Customer Information
    'First Name': 'firstName',
    'Last Name': 'lastName',
    'Customer Name': 'customerName',
    'Full Name': 'customerName',
    'Phone Number': 'phoneNumber',
    'Phone': 'phoneNumber',
    'Email': 'email',
    'Address': 'address',

    // Job Information
    'Lead Source': 'leadSource',
    'Quality': 'quality',
    'Disposition': 'disposition',
    'Roof Age': 'roofAge',
    'Roof Type': 'roofType',
    'Quote Amount': 'dabellaQuote',
    'DaBella Quote': 'dabellaQuote',
    'Notes': 'notes',

    // Job Count Measurements
    'Date': 'date',
    'SQ FT': 'sqFt',
    'Ridge LF': 'ridgeLf',
    'Valley LF': 'valleyLf',
    'Eaves LF': 'eavesLf',
    'Ridge Vents': 'ridgeVents',
    'Turbine': 'turbine',
    'Rime Flow': 'rimeFlow',
    'High Profile Ridge Cap': 'highProfileRidgeCap',
    'Valley Metal': 'valleyMetal',
    'Pipes [1 1/2"]': 'pipes1Half',
    'Pipes [2"]': 'pipes2',
    'Pipes [3"]': 'pipes3',
    'Pipes [4\']': 'pipes4',
    'Pipes [4"]': 'pipes4',
    'Pipes 1 1/2" - 2"': 'pipes1Half2',
    'Pipes 3" - 5"': 'pipes3To5',
    'Gables': 'gables',
    'Turtle Backs': 'turtleBacks',
    'Satellite': 'satellite',
    'Chimney': 'chimney',
    'Solar': 'solar',
    'Swamp Cooler': 'swampCooler',
    'Gutters LF': 'guttersLf',
    'Downspouts': 'downspouts',
    'Gutter Guard LF': 'gutterGuardLf',
    'Permanent Lighting': 'permanentLighting',

    // System fields
    'ID': 'id',
    'Created Date': 'createdDate',
    'Modified Date': 'modifiedDate'
  };

  return specialCases[headerName] || headerName
    .replace(/[\[\]"']/g, '')
    .split(/\s+/)
    .map((word, index) => {
      if (index === 0) return word.toLowerCase();
      return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
    })
    .join('');
}