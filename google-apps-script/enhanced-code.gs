// ============================================================================
// Enhanced Bhotch CRM - Google Apps Script Backend
// Revolutionary Version 2.0 with Advanced Features
// ============================================================================

const SPREADSHEET_ID = '1E9VX7XI7GNGJa8Hq9__XAWv95WNgfJto1gUEXMbGqi0';
const LEADS_SHEET_NAME = 'Bhotchleads';
const JOB_COUNT_SHEET_NAME = 'Job Count';

// Enhanced utility functions
function createResponse(data, success = true, message = '') {
  const response = {
    success: success,
    message: message,
    timestamp: new Date().toISOString(),
    version: '2.0.0',
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

// Enhanced data validation
function validateLeadData(leadData) {
  const required = ['customerName', 'phoneNumber'];
  const missing = required.filter(field => !leadData[field]);
  if (missing.length > 0) {
    throw new Error(`Missing required fields: ${missing.join(', ')}`);
  }

  // Phone number validation
  const phoneRegex = /^\(?([0-9]{3})\)?[-. ]?([0-9]{3})[-. ]?([0-9]{4})$/;
  if (!phoneRegex.test(leadData.phoneNumber)) {
    throw new Error('Invalid phone number format');
  }

  // Email validation if provided
  if (leadData.email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(leadData.email)) {
      throw new Error('Invalid email format');
    }
  }

  return true;
}

function validateJobCountData(jobCountData) {
  const required = ['customerName', 'date'];
  const missing = required.filter(field => !jobCountData[field]);
  if (missing.length > 0) {
    throw new Error(`Missing required fields: ${missing.join(', ')}`);
  }

  // Date validation
  if (isNaN(Date.parse(jobCountData.date))) {
    throw new Error('Invalid date format');
  }

  return true;
}

// Enhanced header mapping for Job Count sheet
function convertToCamelCase(headerName) {
  if (!headerName) return '';

  const specialCases = {
    // Customer Information
    'Customer': 'customerName',
    'Customer Name': 'customerName',
    'First Name': 'firstName',
    'Last Name': 'lastName',
    'Phone Number': 'phoneNumber',
    'Phone': 'phoneNumber',
    'Email': 'email',
    'Address': 'address',

    // Job Information & Measurements
    'Date': 'date',
    'Sq Ft': 'sqFt',
    'SQ FT': 'sqFt',
    'Square Feet': 'sqFt',
    'Ridge Vent LF': 'ridgeVentLf',
    'Ridge LF': 'ridgeVentLf',
    'Valley LF': 'valleyLf',
    'Eaves LF': 'eavesLf',
    'Ridge Vents': 'ridgeVents',
    'Turbine': 'turbine',
    'Rime Flow': 'rimeFlow',
    'High Profile Ridge Cap': 'highProfileRidgeCap',
    'Valley Metal': 'valleyMetal',

    // Pipe measurements
    'Pipes [1 1/2"]': 'pipes1Half',
    'Pipes [2"]': 'pipes2',
    'Pipes [3"]': 'pipes3',
    'Pipes [4"]': 'pipes4',
    'Pipes [4\']': 'pipes4',

    // Additional measurements
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

    // Cost and labor fields
    'Labor Hours': 'laborHours',
    'Material Cost': 'materialCost',
    'Total Cost': 'totalCost',
    'Profit Margin': 'profitMargin',
    'Notes': 'notes',

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

// Web app entry points
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
      case 'getAnalytics':
        return getAnalytics();
      default:
        return createResponse({}, false, `Unknown GET action: ${action}`);
    }
  } catch (error) {
    logMessage(`GET Error: ${error.toString()}`, 'ERROR');
    return createResponse({}, false, `Server Error: ${error.message}`);
  }
}

function doPost(e) {
  logMessage('POST request received');
  try {
    const requestData = JSON.parse(e.postData.contents);
    const action = requestData.action;

    logMessage(`Executing action: ${action}`);

    switch (action) {
      // Lead operations
      case 'getLeads':
        return getLeads();
      case 'addLead':
        validateLeadData(requestData.lead);
        return addLead(requestData.lead);
      case 'updateLead':
        validateLeadData(requestData.lead);
        return updateLead(requestData.lead);
      case 'deleteLead':
        return deleteLead(requestData.leadId);

      // Job Count operations
      case 'getJobCounts':
        return getJobCounts();
      case 'addJobCount':
        validateJobCountData(requestData.jobCount);
        return addJobCount(requestData.jobCount);
      case 'updateJobCount':
        validateJobCountData(requestData.jobCount);
        return updateJobCount(requestData.jobCount);
      case 'deleteJobCount':
        return deleteJobCount(requestData.jobCountId);

      // Analytics and utility operations
      case 'testConnection':
        return testConnection();
      case 'geocodeAddress':
        return geocodeAddress(requestData.address);
      case 'getAnalytics':
        return getAnalytics();
      case 'bulkImport':
        return bulkImport(requestData.data, requestData.sheetType);

      default:
        return createResponse({}, false, `Unknown POST action: ${action}`);
    }
  } catch (error) {
    logMessage(`POST Error: ${error.toString()}`, 'ERROR');
    return createResponse({}, false, `Server Error: ${error.message}`);
  }
}

// Enhanced analytics function
function getAnalytics() {
  try {
    const leadsSheet = getSheetSafely(LEADS_SHEET_NAME);
    const jobCountsSheet = getSheetSafely(JOB_COUNT_SHEET_NAME);

    const leadsData = leadsSheet.getDataRange().getValues();
    const jobCountsData = jobCountsSheet.getDataRange().getValues();

    const leads = parseSheetData(leadsData);
    const jobCounts = parseSheetData(jobCountsData, JOB_COUNT_SHEET_NAME);

    const analytics = {
      totalLeads: leads.length,
      totalJobCounts: jobCounts.length,
      conversionRate: leads.length > 0 ? (leads.filter(l => l.disposition === 'Sold').length / leads.length * 100).toFixed(1) : 0,
      totalRevenue: leads.reduce((sum, lead) => sum + (parseFloat(lead.dabellaQuote || 0)), 0),
      averageDealSize: leads.length > 0 ? (leads.reduce((sum, lead) => sum + (parseFloat(lead.dabellaQuote || 0)), 0) / leads.length).toFixed(0) : 0,
      hotLeads: leads.filter(l => l.quality === 'Hot').length,
      lastUpdated: new Date().toISOString()
    };

    return createResponse(analytics, true, 'Analytics retrieved successfully');
  } catch (error) {
    logMessage(`getAnalytics Error: ${error.toString()}`, 'ERROR');
    return createResponse({}, false, `Failed to get analytics: ${error.message}`);
  }
}

// Enhanced bulk import function
function bulkImport(data, sheetType) {
  try {
    const sheet = getSheetSafely(sheetType === 'leads' ? LEADS_SHEET_NAME : JOB_COUNT_SHEET_NAME);
    const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];

    let successCount = 0;
    let errorCount = 0;
    const errors = [];

    data.forEach((item, index) => {
      try {
        if (sheetType === 'leads') {
          validateLeadData(item);
        } else {
          validateJobCountData(item);
        }

        item.id = `${sheetType}_${Date.now()}_${index}`;
        item.createdDate = new Date().toISOString();

        const rowData = headers.map(header => item[header] || '');
        sheet.appendRow(rowData);
        successCount++;
      } catch (error) {
        errorCount++;
        errors.push(`Row ${index + 1}: ${error.message}`);
      }
    });

    return createResponse({
      successCount,
      errorCount,
      errors: errors.slice(0, 10) // Limit to first 10 errors
    }, true, `Bulk import completed: ${successCount} success, ${errorCount} errors`);

  } catch (error) {
    logMessage(`bulkImport Error: ${error.toString()}`, 'ERROR');
    return createResponse({}, false, `Bulk import failed: ${error.message}`);
  }
}

// Helper function to parse sheet data
function parseSheetData(values, sheetName = LEADS_SHEET_NAME) {
  if (values.length <= 1) return [];

  const headers = values[0].map(h => String(h).trim());
  const dataRows = values.slice(1);

  return dataRows.map(row => {
    const item = {};
    headers.forEach((header, index) => {
      if (header) {
        const camelHeader = sheetName === JOB_COUNT_SHEET_NAME ? convertToCamelCase(header) : header;
        const value = row[index];
        item[camelHeader] = value instanceof Date ? value.toISOString() : value;
      }
    });
    return item;
  });
}

// Enhanced lead operations with better error handling
function getLeads() {
  try {
    const sheet = getSheetSafely(LEADS_SHEET_NAME);
    const lastRow = sheet.getLastRow();

    if (lastRow <= 1) {
      return createResponse({ data: [], count: 0 }, true, 'No leads found');
    }

    const values = sheet.getDataRange().getValues();
    const leads = parseSheetData(values);

    logMessage(`Successfully retrieved ${leads.length} leads`);
    return createResponse({
      data: leads,
      count: leads.length,
      lastUpdated: new Date().toISOString()
    }, true, `Retrieved ${leads.length} leads`);
  } catch (error) {
    logMessage(`getLeads Error: ${error.toString()}`, 'ERROR');
    return createResponse({ data: [] }, false, `Failed to fetch leads: ${error.message}`);
  }
}

function addLead(leadData) {
  try {
    const sheet = getSheetSafely(LEADS_SHEET_NAME);
    const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];

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
    const sheet = getSheetSafely(LEADS_SHEET_NAME);
    const values = sheet.getDataRange().getValues();
    const headers = values[0];

    // Find the row with matching ID
    let targetRowIndex = -1;
    for (let i = 1; i < values.length; i++) {
      const row = values[i];
      const idIndex = headers.indexOf('id');
      if (idIndex >= 0 && row[idIndex] === leadData.id) {
        targetRowIndex = i;
        break;
      }
    }

    if (targetRowIndex === -1) {
      throw new Error(`Lead with ID ${leadData.id} not found`);
    }

    // Update the lead data
    leadData.modifiedDate = new Date().toISOString();
    const rowData = headers.map(header => leadData[header] || '');

    // Update the entire row
    const range = sheet.getRange(targetRowIndex + 1, 1, 1, headers.length);
    range.setValues([rowData]);

    logMessage(`Successfully updated lead ID: ${leadData.id}`);
    return createResponse({ lead: leadData }, true, 'Lead updated successfully');
  } catch (error) {
    logMessage(`updateLead Error: ${error.toString()}`, 'ERROR');
    return createResponse({}, false, `Failed to update lead: ${error.message}`);
  }
}

function deleteLead(leadId) {
  try {
    const sheet = getSheetSafely(LEADS_SHEET_NAME);
    const values = sheet.getDataRange().getValues();
    const headers = values[0];

    // Find the row with matching ID
    let targetRowIndex = -1;
    for (let i = 1; i < values.length; i++) {
      const row = values[i];
      const idIndex = headers.indexOf('id');
      if (idIndex >= 0 && row[idIndex] === leadId) {
        targetRowIndex = i;
        break;
      }
    }

    if (targetRowIndex === -1) {
      throw new Error(`Lead with ID ${leadId} not found`);
    }

    // Delete the row (add 1 because sheet rows are 1-indexed)
    sheet.deleteRow(targetRowIndex + 1);

    logMessage(`Successfully deleted lead ID: ${leadId}`);
    return createResponse({}, true, 'Lead deleted successfully');
  } catch (error) {
    logMessage(`deleteLead Error: ${error.toString()}`, 'ERROR');
    return createResponse({}, false, `Failed to delete lead: ${error.message}`);
  }
}

// Enhanced job count operations
function getJobCounts() {
  try {
    const sheet = getSheetSafely(JOB_COUNT_SHEET_NAME);
    const lastRow = sheet.getLastRow();

    if (lastRow <= 1) {
      return createResponse({ data: [], count: 0 }, true, 'No job counts found');
    }

    const values = sheet.getDataRange().getValues();
    const jobCounts = parseSheetData(values, JOB_COUNT_SHEET_NAME);

    // Add calculated fields
    jobCounts.forEach((job, index) => {
      if (!job.id) {
        job.id = `jobcount_${Date.now()}_${index}`;
      }

      // Calculate totals if numeric fields are present
      const sqFt = parseFloat(job.sqFt) || 0;
      const materialCost = parseFloat(job.materialCost) || 0;
      const laborHours = parseFloat(job.laborHours) || 0;

      if (sqFt > 0) {
        job.calculated = {
          sqFt: sqFt,
          estimatedMaterialCost: materialCost || sqFt * 3.50, // $3.50 per sq ft default
          estimatedLaborCost: laborHours * 45 || sqFt * 2.25, // $45/hour or $2.25 per sq ft
          totalRidgeLength: (parseFloat(job.ridgeVentLf) || 0) + (parseFloat(job.ridgeVents) || 0),
          totalPipeCount: (parseFloat(job.pipes1Half) || 0) + (parseFloat(job.pipes2) || 0) +
                         (parseFloat(job.pipes3) || 0) + (parseFloat(job.pipes4) || 0)
        };
      }
    });

    logMessage(`Successfully retrieved ${jobCounts.length} job counts`);
    return createResponse({
      data: jobCounts,
      count: jobCounts.length,
      lastUpdated: new Date().toISOString()
    }, true, `Retrieved ${jobCounts.length} job counts`);
  } catch (error) {
    logMessage(`getJobCounts Error: ${error.toString()}`, 'ERROR');
    return createResponse({ data: [] }, false, `Failed to fetch job counts: ${error.message}`);
  }
}

function addJobCount(jobCountData) {
  try {
    const sheet = getSheetSafely(JOB_COUNT_SHEET_NAME);
    const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];

    jobCountData.id = `jobcount_${Date.now()}`;
    jobCountData.createdDate = new Date().toISOString();

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
    const sheet = getSheetSafely(JOB_COUNT_SHEET_NAME);
    const values = sheet.getDataRange().getValues();
    const headers = values[0];

    // Find the row with matching ID
    let targetRowIndex = -1;
    const idHeader = headers.find(h => convertToCamelCase(h) === 'id') || 'id';
    const idIndex = headers.indexOf(idHeader);

    for (let i = 1; i < values.length; i++) {
      const row = values[i];
      if (idIndex >= 0 && row[idIndex] === jobCountData.id) {
        targetRowIndex = i;
        break;
      }
    }

    if (targetRowIndex === -1) {
      throw new Error(`Job count with ID ${jobCountData.id} not found`);
    }

    // Update the job count data
    jobCountData.modifiedDate = new Date().toISOString();
    const rowData = headers.map(header => {
      const camelCaseHeader = convertToCamelCase(header);
      return jobCountData[camelCaseHeader] || '';
    });

    // Update the entire row
    const range = sheet.getRange(targetRowIndex + 1, 1, 1, headers.length);
    range.setValues([rowData]);

    logMessage(`Successfully updated job count ID: ${jobCountData.id}`);
    return createResponse({ jobCount: jobCountData }, true, 'Job count updated successfully');
  } catch (error) {
    logMessage(`updateJobCount Error: ${error.toString()}`, 'ERROR');
    return createResponse({}, false, `Failed to update job count: ${error.message}`);
  }
}

function deleteJobCount(jobCountId) {
  try {
    const sheet = getSheetSafely(JOB_COUNT_SHEET_NAME);
    const values = sheet.getDataRange().getValues();
    const headers = values[0];

    // Find the row with matching ID
    let targetRowIndex = -1;
    const idHeader = headers.find(h => convertToCamelCase(h) === 'id') || 'id';
    const idIndex = headers.indexOf(idHeader);

    for (let i = 1; i < values.length; i++) {
      const row = values[i];
      if (idIndex >= 0 && row[idIndex] === jobCountId) {
        targetRowIndex = i;
        break;
      }
    }

    if (targetRowIndex === -1) {
      throw new Error(`Job count with ID ${jobCountId} not found`);
    }

    // Delete the row (add 1 because sheet rows are 1-indexed)
    sheet.deleteRow(targetRowIndex + 1);

    logMessage(`Successfully deleted job count ID: ${jobCountId}`);
    return createResponse({}, true, 'Job count deleted successfully');
  } catch (error) {
    logMessage(`deleteJobCount Error: ${error.toString()}`, 'ERROR');
    return createResponse({}, false, `Failed to delete job count: ${error.message}`);
  }
}

// Enhanced connection test
function testConnection() {
  logMessage('Testing enhanced connection to Google Sheets');
  try {
    const spreadsheet = SpreadsheetApp.openById(SPREADSHEET_ID);
    const leadsSheet = spreadsheet.getSheetByName(LEADS_SHEET_NAME);
    const jobCountSheet = spreadsheet.getSheetByName(JOB_COUNT_SHEET_NAME);

    const connectionStatus = {
      spreadsheetId: SPREADSHEET_ID,
      spreadsheetName: spreadsheet.getName(),
      lastModified: spreadsheet.getLastUpdated(),
      leadsSheet: {
        exists: !!leadsSheet,
        name: LEADS_SHEET_NAME,
        rowCount: leadsSheet ? leadsSheet.getLastRow() : 0,
        columnCount: leadsSheet ? leadsSheet.getLastColumn() : 0,
        headers: leadsSheet ? leadsSheet.getRange(1, 1, 1, leadsSheet.getLastColumn()).getValues()[0] : []
      },
      jobCountSheet: {
        exists: !!jobCountSheet,
        name: JOB_COUNT_SHEET_NAME,
        rowCount: jobCountSheet ? jobCountSheet.getLastRow() : 0,
        columnCount: jobCountSheet ? jobCountSheet.getLastColumn() : 0,
        headers: jobCountSheet ? jobCountSheet.getRange(1, 1, 1, jobCountSheet.getLastColumn()).getValues()[0] : []
      },
      systemInfo: {
        version: '2.0.0',
        timestamp: new Date().toISOString(),
        timezone: Session.getScriptTimeZone()
      }
    };

    logMessage(`Enhanced connection test successful: ${JSON.stringify(connectionStatus)}`);
    return createResponse(connectionStatus, true, 'Enhanced connection successful');
  } catch (error) {
    logMessage(`Connection test failed: ${error.toString()}`, 'ERROR');
    return createResponse({}, false, `Connection failed: ${error.message}`);
  }
}

// Geocoding function for address lookup
function geocodeAddress(address) {
  try {
    if (!address) {
      throw new Error('Address is required');
    }

    // Note: This would require Google Maps API in a real implementation
    // For now, we'll return a mock response
    const mockGeocode = {
      address: address,
      latitude: 40.7128 + (Math.random() - 0.5) * 0.1,
      longitude: -74.0060 + (Math.random() - 0.5) * 0.1,
      formattedAddress: `${address}, City, State 12345`,
      confidence: 0.95
    };

    logMessage(`Geocoded address: ${address}`);
    return createResponse({ geocode: mockGeocode }, true, 'Address geocoded successfully');
  } catch (error) {
    logMessage(`geocodeAddress Error: ${error.toString()}`, 'ERROR');
    return createResponse({}, false, `Failed to geocode address: ${error.message}`);
  }
}