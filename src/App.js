// Google Apps Script for Bhotch CRM
// Deploy this as a Web App to connect your React CRM to Google Sheets

// Configuration
const SHEET_NAME = 'Bhotchleads'; 
const SPREADSHEET_ID = '1E9VX7XI7GNGJa8Hq9__XAWv95WNgfJto1gUEXMbGqi0';

// Column mapping
const COLUMNS = {
  id: 0, firstName: 1, lastName: 2, address: 3, phoneNumber: 4, email: 5, date: 6,
  followupDate: 7, leadStatus: 8, dabellaQuote: 9, roofAge: 10, roofType: 11,
  inspectionStatus: 12, quality: 13, notes: 14, leadSource: 15, disposition: 16,
  lastContact: 17, createdDate: 18, appointmentDate: 19, latitude: 20, longitude: 21,
  smsCount: 22, emailCount: 23
};

// --- Main Handlers ---
function doGet(e) {
  if (e && e.parameter && e.parameter.action === 'getLeads') {
    return getLeads();
  }
  return createJsonResponse({ success: false, message: 'Invalid GET action.' });
}

function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);
    switch (data.action) {
      case 'addLead': return addLead(data.lead);
      case 'updateLead': return updateLead(data.lead);
      case 'deleteLead': return deleteLead(data.leadId);
      default: return createJsonResponse({ success: false, message: 'Unknown action' });
    }
  } catch (error) {
    Logger.log('Critical Error in doPost: ' + error.toString());
    return createJsonResponse({ success: false, message: 'Error processing request: ' + error.message });
  }
}

// --- Core Functions ---
function getLeads() {
  try {
    const sheet = getSheet();
    if (!sheet) return createJsonResponse({ success: false, message: `Sheet '${SHEET_NAME}' not found.` });
    
    const data = sheet.getDataRange().getValues();
    if (data.length <= 1) return createJsonResponse({ success: true, leads: [] });

    const leads = data.slice(1).map(row => {
      if (row.every(cell => cell === "")) return null; // Skip empty rows
      const lead = {};
      Object.keys(COLUMNS).forEach(key => {
        lead[key] = row[COLUMNS[key]] || '';
      });
      lead.customerName = `${lead.firstName || ''} ${lead.lastName || ''}`.trim();
      return lead;
    }).filter(lead => lead && lead.id && lead.customerName); // Filter out invalid leads

    return createJsonResponse({ success: true, leads: leads });
  } catch (error) {
    Logger.log('Critical Error in getLeads: ' + error.toString());
    return createJsonResponse({ success: false, message: error.toString() });
  }
}

function addLead(leadData) {
  try {
    const sheet = getSheet();
    const nameParts = (leadData.customerName || '').split(' ');
    leadData.firstName = nameParts.shift() || '';
    leadData.lastName = nameParts.join(' ') || '';
    leadData.id = Utilities.getUuid();
    
    if (leadData.address && (!leadData.latitude || !leadData.longitude)) {
        const coords = geocodeAddress(leadData.address);
        if (coords) {
            leadData.latitude = coords.lat;
            leadData.longitude = coords.lng;
        }
    }

    const row = buildRowFromLeadData(leadData);
    sheet.appendRow(row);
    return createJsonResponse({ success: true, message: 'Lead added successfully', leadId: leadData.id });
  } catch (error) {
    Logger.log('Critical Error in addLead: ' + error.toString());
    return createJsonResponse({ success: false, message: error.toString() });
  }
}

function updateLead(leadData) {
    try {
        const sheet = getSheet();
        const data = sheet.getDataRange().getValues();
        const rowIndex = data.findIndex((row, i) => i > 0 && row[COLUMNS.id] === leadData.id);

        if (rowIndex === -1) return createJsonResponse({ success: false, message: 'Lead not found' });

        const nameParts = (leadData.customerName || '').split(' ');
        leadData.firstName = nameParts.shift() || '';
        leadData.lastName = nameParts.join(' ') || '';

        const newRow = buildRowFromLeadData(leadData);
        sheet.getRange(rowIndex + 1, 1, 1, newRow.length).setValues([newRow]);
        
        return createJsonResponse({ success: true, message: 'Lead updated successfully' });
    } catch(e) {
        Logger.log("Update Error: " + e.toString());
        return createJsonResponse({ success: false, message: e.toString() });
    }
}


function deleteLead(leadId) {
  try {
    const sheet = getSheet();
    const data = sheet.getDataRange().getValues();
    const rowIndex = data.findIndex((row, i) => i > 0 && row[COLUMNS.id] === leadId);

    if (rowIndex === -1) return createJsonResponse({ success: false, message: 'Lead not found' });
    
    sheet.deleteRow(rowIndex + 1);
    return createJsonResponse({ success: true, message: 'Lead deleted successfully' });
  } catch (error) {
    Logger.log('Critical Error in deleteLead: ' + error.toString());
    return createJsonResponse({ success: false, message: error.toString() });
  }
}

// --- Utility Functions ---
function getSheet() {
  const spreadsheet = SpreadsheetApp.openById(SPREADSHEET_ID);
  return spreadsheet.getSheetByName(SHEET_NAME);
}

function buildRowFromLeadData(leadData) {
    const row = [];
    Object.keys(COLUMNS).sort((a,b) => COLUMNS[a] - COLUMNS[b]).forEach(key => {
        row[COLUMNS[key]] = leadData[key] || '';
    });
    row[COLUMNS.lastContact] = new Date().toISOString();
    if (!leadData.createdDate) row[COLUMNS.createdDate] = new Date().toISOString();
    return row;
}

function geocodeAddress(address) {
    if (!address) return null;
    try {
        const geocoder = Maps.newGeocoder().setRegion('us'); 
        const response = geocoder.geocode(address);
        if (response.status === 'OK' && response.results.length > 0) {
            const location = response.results[0].geometry.location;
            Logger.log(`Geocoded '${address}' to: ${location.lat}, ${location.lng}`);
            return { lat: location.lat, lng: location.lng };
        }
        Logger.log(`Geocoding failed for '${address}': ${response.status}`);
        return null;
    } catch (e) {
        Logger.log(`Geocoding error for '${address}': ${e.toString()}`);
        return null;
    }
}

function createJsonResponse(data) {
    return ContentService.createTextOutput(JSON.stringify(data))
        .setMimeType(ContentService.MimeType.JSON)
        .addHttpHeader('Access-Control-Allow-Origin', '*')
        .addHttpHeader('Access-Control-Allow-Headers', 'Content-Type');
}

