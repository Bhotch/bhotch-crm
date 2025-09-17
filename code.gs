// ============================================================================
// Bhotch CRM - Google Apps Script Backend (Code.gs)
// UPDATED VERSION - Now includes Job Count functionality
// ============================================================================

/**
 * @fileoverview This script acts as the backend API for a CRM application,
 * interfacing with Google Sheets to perform CRUD operations on leads and job counts.
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

// ============================================================================
// WEB APP ENTRY POINTS (doGet / doPost)
// ============================================================================

function doGet(e) {
  logMessage(`GET request received: ${JSON.stringify(e.parameter)}`);
  try {
    const action = e.parameter.action;
    switch (action) {
      case 'getLeads':
        return getLeads();
      case 'getJobCounts':
        return getJobCounts();
      case 'testConnection':
        return testConnection();
      default:
        return createResponse({}, false, `Unknown GET action: ${action}`);
    }
  } catch (error) {
    logMessage(`GET Error: ${error.toString()}`, 'ERROR');
    return createResponse({}, false, `Server Error: ${error.message}`);
  }
}

function doPost(e) {
  logMessage('POST request received.');
  try {
    const requestData = JSON.parse(e.postData.contents);
    const action = requestData.action;

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

      default:
        return createResponse({}, false, `Unknown POST action: ${action}`);
    }
  } catch (error) {
    logMessage(`POST Error: ${error.toString()}`, 'ERROR');
    return createResponse({}, false, `Server Error: ${error.message}`);
  }
}

// ============================================================================
// API CORE FUNCTIONS - UTILITY
// ============================================================================

function testConnection() {
  logMessage('Testing connection to Google Sheets');
  try {
    const spreadsheet = SpreadsheetApp.openById(SPREADSHEET_ID);
    const leadsSheet = spreadsheet.getSheetByName(LEADS_SHEET_NAME);
    const jobCountSheet = spreadsheet.getSheetByName(JOB_COUNT_SHEET_NAME);

    if (!leadsSheet) throw new Error(`Sheet "${LEADS_SHEET_NAME}" not found.`);
    if (!jobCountSheet) throw new Error(`Sheet "${JOB_COUNT_SHEET_NAME}" not found.`);

    const leadsRowCount = leadsSheet.getLastRow();
    const jobCountRowCount = jobCountSheet.getLastRow();

    return createResponse({
      leadsRowCount: leadsRowCount,
      jobCountRowCount: jobCountRowCount
    }, true, 'Connection successful');
  } catch (error) {
    logMessage(`Connection test failed: ${error.toString()}`, 'ERROR');
    return createResponse({}, false, `Connection failed: ${error.message}`);
  }
}

function geocodeAddress(address) {
  if (!address) {
    return createResponse({}, false, 'Address parameter is required.');
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
    return createResponse(coords, true, 'Address geocoded successfully.');

  } catch (error) {
    logMessage(`Geocoding Error: ${error.toString()}`, 'ERROR');
    return createResponse({}, false, `Failed to geocode address: ${error.message}`);
  }
}

// ============================================================================
// API CORE FUNCTIONS - LEADS
// ============================================================================

function getLeads() {
  try {
    const sheet = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName(LEADS_SHEET_NAME);
    if (!sheet) throw new Error(`Sheet "${LEADS_SHEET_NAME}" not found.`);

    const lastRow = sheet.getLastRow();
    if (lastRow <= 1) {
      return createResponse({ data: [], count: 0 }, true, 'No leads found.');
    }

    const range = sheet.getDataRange();
    const values = range.getValues();
    const headers = values[0].map(h => h.trim());
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

    logMessage(`Successfully retrieved ${leads.length} leads.`);
    return createResponse({ data: leads, count: leads.length }, true, `Retrieved ${leads.length} leads.`);

  } catch (error) {
    logMessage(`getLeads Error: ${error.toString()}`, 'ERROR');
    return createResponse({ data: [] }, false, `Failed to fetch leads: ${error.message}`);
  }
}

function addLead(leadData) {
  try {
    if (!leadData || typeof leadData !== 'object') throw new Error('Invalid lead data provided.');

    const sheet = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName(LEADS_SHEET_NAME);
    if (!sheet) throw new Error(`Sheet "${LEADS_SHEET_NAME}" not found.`);

    const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];

    // Add metadata
    leadData.id = `lead_${Date.now()}`;
    leadData.createdDate = new Date().toISOString();
    leadData.status = leadData.status || 'new';

    const rowData = headers.map(header => leadData[header] || '');
    sheet.appendRow(rowData);

    logMessage(`Successfully added lead ID: ${leadData.id}`);
    return createResponse({ lead: leadData }, true, 'Lead added successfully.');

  } catch (error) {
    logMessage(`addLead Error: ${error.toString()}`, 'ERROR');
    return createResponse({}, false, `Failed to add lead: ${error.message}`);
  }
}

function updateLead(leadData) {
  try {
    if (!leadData || !leadData.id) throw new Error('Lead data with a valid ID is required for updates.');

    const sheet = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName(LEADS_SHEET_NAME);
    if (!sheet) throw new Error(`Sheet "${LEADS_SHEET_NAME}" not found.`);

    const data = sheet.getDataRange().getValues();
    const headers = data[0];
    const idColumnIndex = headers.indexOf('id');
    if (idColumnIndex === -1) throw new Error("'id' column not found in the sheet.");

    const rowIndex = data.slice(1).findIndex(row => row[idColumnIndex] == leadData.id) + 2;
    if (rowIndex < 2) throw new Error(`Lead with ID ${leadData.id} not found.`);

    // Add modified date
    leadData.modifiedDate = new Date().toISOString();

    const rowData = headers.map(header => leadData[header] !== undefined ? leadData[header] : sheet.getRange(rowIndex, headers.indexOf(header) + 1).getValue());
    sheet.getRange(rowIndex, 1, 1, headers.length).setValues([rowData]);

    logMessage(`Successfully updated lead ID: ${leadData.id}`);
    return createResponse({ lead: leadData }, true, 'Lead updated successfully.');

  } catch (error) {
    logMessage(`updateLead Error: ${error.toString()}`, 'ERROR');
    return createResponse({}, false, `Failed to update lead: ${error.message}`);
  }
}

function deleteLead(leadId) {
  try {
    if (!leadId) throw new Error('Lead ID is required for deletion.');

    const sheet = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName(LEADS_SHEET_NAME);
    if (!sheet) throw new Error(`Sheet "${LEADS_SHEET_NAME}" not found.`);

    const data = sheet.getDataRange().getValues();
    const headers = data[0];
    const idColumnIndex = headers.indexOf('id');
    if (idColumnIndex === -1) throw new Error("'id' column not found in the sheet.");

    const rowIndex = data.slice(1).findIndex(row => row[idColumnIndex] == leadId) + 2;
    if (rowIndex < 2) throw new Error(`Lead with ID ${leadId} not found.`);

    sheet.deleteRow(rowIndex);

    logMessage(`Successfully deleted lead ID: ${leadId}`);
    return createResponse({ deletedId: leadId }, true, 'Lead deleted successfully.');

  } catch (error) {
    logMessage(`deleteLead Error: ${error.toString()}`, 'ERROR');
    return createResponse({}, false, `Failed to delete lead: ${error.message}`);
  }
}

// ============================================================================
// API CORE FUNCTIONS - JOB COUNTS
// ============================================================================

function getJobCounts() {
  try {
    const sheet = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName(JOB_COUNT_SHEET_NAME);
    if (!sheet) throw new Error(`Sheet "${JOB_COUNT_SHEET_NAME}" not found.`);

    const lastRow = sheet.getLastRow();
    if (lastRow <= 1) {
      return createResponse({ data: [], count: 0 }, true, 'No job counts found.');
    }

    const range = sheet.getDataRange();
    const values = range.getValues();
    const headers = values[0].map(h => h.trim());
    const dataRows = values.slice(1);

    const jobCounts = dataRows.map((row, index) => {
      const jobCount = {};
      headers.forEach((header, columnIndex) => {
        if (header) {
          const value = row[columnIndex];
          // Convert header names to camelCase for frontend compatibility
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

    logMessage(`Successfully retrieved ${jobCounts.length} job counts.`);
    return createResponse({ data: jobCounts, count: jobCounts.length }, true, `Retrieved ${jobCounts.length} job counts.`);

  } catch (error) {
    logMessage(`getJobCounts Error: ${error.toString()}`, 'ERROR');
    return createResponse({ data: [] }, false, `Failed to fetch job counts: ${error.message}`);
  }
}

function addJobCount(jobCountData) {
  try {
    if (!jobCountData || typeof jobCountData !== 'object') throw new Error('Invalid job count data provided.');

    const sheet = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName(JOB_COUNT_SHEET_NAME);
    if (!sheet) throw new Error(`Sheet "${JOB_COUNT_SHEET_NAME}" not found.`);

    const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];

    // Add metadata
    jobCountData.id = `jobcount_${Date.now()}`;
    jobCountData.createdDate = new Date().toISOString();

    // Map camelCase frontend fields to sheet headers
    const rowData = headers.map(header => {
      const camelCaseHeader = convertToCamelCase(header);
      return jobCountData[camelCaseHeader] || '';
    });

    sheet.appendRow(rowData);

    logMessage(`Successfully added job count ID: ${jobCountData.id}`);
    return createResponse({ jobCount: jobCountData }, true, 'Job count added successfully.');

  } catch (error) {
    logMessage(`addJobCount Error: ${error.toString()}`, 'ERROR');
    return createResponse({}, false, `Failed to add job count: ${error.message}`);
  }
}

function updateJobCount(jobCountData) {
  try {
    if (!jobCountData || !jobCountData.id) throw new Error('Job count data with a valid ID is required for updates.');

    const sheet = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName(JOB_COUNT_SHEET_NAME);
    if (!sheet) throw new Error(`Sheet "${JOB_COUNT_SHEET_NAME}" not found.`);

    const data = sheet.getDataRange().getValues();
    const headers = data[0];

    // Find ID column (could be 'id' or 'ID')
    let idColumnIndex = headers.findIndex(h => h.toLowerCase().trim() === 'id');
    if (idColumnIndex === -1) {
      // If no ID column exists, try to find the row by firstName, lastName, and date
      const firstNameIndex = headers.findIndex(h => h.toLowerCase().includes('first'));
      const lastNameIndex = headers.findIndex(h => h.toLowerCase().includes('last'));
      const dateIndex = headers.findIndex(h => h.toLowerCase().includes('date'));

      if (firstNameIndex !== -1 && lastNameIndex !== -1 && dateIndex !== -1) {
        const rowIndex = data.slice(1).findIndex(row =>
          row[firstNameIndex] == jobCountData.firstName &&
          row[lastNameIndex] == jobCountData.lastName &&
          (row[dateIndex] == jobCountData.date || new Date(row[dateIndex]).toISOString().split('T')[0] == jobCountData.date)
        ) + 2;

        if (rowIndex < 2) throw new Error(`Job count not found.`);

        // Add modified date
        jobCountData.modifiedDate = new Date().toISOString();

        const rowData = headers.map(header => {
          const camelCaseHeader = convertToCamelCase(header);
          return jobCountData[camelCaseHeader] !== undefined ? jobCountData[camelCaseHeader] : sheet.getRange(rowIndex, headers.indexOf(header) + 1).getValue();
        });

        sheet.getRange(rowIndex, 1, 1, headers.length).setValues([rowData]);
        logMessage(`Successfully updated job count for: ${jobCountData.firstName} ${jobCountData.lastName}`);
        return createResponse({ jobCount: jobCountData }, true, 'Job count updated successfully.');
      } else {
        throw new Error("Unable to locate job count for update - no ID column or identifying fields found.");
      }
    } else {
      const rowIndex = data.slice(1).findIndex(row => row[idColumnIndex] == jobCountData.id) + 2;
      if (rowIndex < 2) throw new Error(`Job count with ID ${jobCountData.id} not found.`);

      // Add modified date
      jobCountData.modifiedDate = new Date().toISOString();

      const rowData = headers.map(header => {
        const camelCaseHeader = convertToCamelCase(header);
        return jobCountData[camelCaseHeader] !== undefined ? jobCountData[camelCaseHeader] : sheet.getRange(rowIndex, headers.indexOf(header) + 1).getValue();
      });

      sheet.getRange(rowIndex, 1, 1, headers.length).setValues([rowData]);
      logMessage(`Successfully updated job count ID: ${jobCountData.id}`);
      return createResponse({ jobCount: jobCountData }, true, 'Job count updated successfully.');
    }

  } catch (error) {
    logMessage(`updateJobCount Error: ${error.toString()}`, 'ERROR');
    return createResponse({}, false, `Failed to update job count: ${error.message}`);
  }
}

function deleteJobCount(jobCountId) {
  try {
    if (!jobCountId) throw new Error('Job count ID is required for deletion.');

    const sheet = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName(JOB_COUNT_SHEET_NAME);
    if (!sheet) throw new Error(`Sheet "${JOB_COUNT_SHEET_NAME}" not found.`);

    const data = sheet.getDataRange().getValues();
    const headers = data[0];

    // Find ID column
    let idColumnIndex = headers.findIndex(h => h.toLowerCase().trim() === 'id');
    if (idColumnIndex === -1) {
      // If no ID column, we'll need to identify by other means
      throw new Error("'id' column not found in the sheet.");
    }

    const rowIndex = data.slice(1).findIndex(row => row[idColumnIndex] == jobCountId) + 2;
    if (rowIndex < 2) throw new Error(`Job count with ID ${jobCountId} not found.`);

    sheet.deleteRow(rowIndex);

    logMessage(`Successfully deleted job count ID: ${jobCountId}`);
    return createResponse({ deletedId: jobCountId }, true, 'Job count deleted successfully.');

  } catch (error) {
    logMessage(`deleteJobCount Error: ${error.toString()}`, 'ERROR');
    return createResponse({}, false, `Failed to delete job count: ${error.message}`);
  }
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Converts sheet header names to camelCase for frontend compatibility
 * Examples:
 * "First Name" -> "firstName"
 * "SQ FT" -> "sqFt"
 * "Pipes [1 1/2"]" -> "pipes1Half"
 */
function convertToCamelCase(headerName) {
  if (!headerName) return '';

  // Handle special cases first
  const specialCases = {
    'First Name': 'firstName',
    'Last Name': 'lastName',
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
    'Gables': 'gables',
    'Turtle Backs': 'turtleBacks',
    'Satellite': 'satellite',
    'Chimney': 'chimney',
    'Solar': 'solar',
    'Swamp Cooler': 'swampCooler',
    'Gutters LF': 'guttersLf',
    'Downspouts': 'downspouts',
    'Gutter Guard LF': 'gutterGuardLf',
    'Permanent Lighting': 'permanentLighting'
  };

  if (specialCases[headerName]) {
    return specialCases[headerName];
  }

  // General conversion for any other headers
  return headerName
    .replace(/[\[\]"']/g, '') // Remove brackets and quotes
    .split(/\s+/) // Split on whitespace
    .map((word, index) => {
      if (index === 0) {
        return word.toLowerCase();
      }
      return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
    })
    .join('');
}