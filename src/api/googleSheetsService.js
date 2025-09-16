// src/api/googleSheetsService.js

// IMPORTANT: It's best practice to store this URL in a .env file.
// For now, we'll define it here for simplicity.
const GOOGLE_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbweOri4v6JDVEsMnU2KbxiQ2_MicbaltR49-cqYwwT2J8YE1dbLhd_Klc5AuUThJjpNZA/exec';

/**
 * A centralized method for making all POST requests to your Google Script.
 * @param {string} action - The function to call in your Google Apps Script (e.g., 'getLeads').
 * @param {object} payload - The data to send with the request.
 * @returns {Promise<object>} - The JSON response from the server.
 */
async function makeRequest(action, payload = {}) {
  try {
    const response = await fetch(GOOGLE_SCRIPT_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'text/plain;charset=utf-8',
      },
      body: JSON.stringify({ action, ...payload }),
      redirect: 'follow', // Crucial for handling Google Script responses correctly.
    });

    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }

    const data = await response.json();
    console.log(`✅ API [${action}]:`, data);
    return data;

  } catch (error) {
    console.error(`❌ API [${action}] Failed:`, error);
    // Re-throw the error so the component can handle it (e.g., show an error message).
    throw new Error(`Google Sheets API Error: ${error.message}`);
  }
}

// Export individual functions for each API action.
export const fetchLeads = () => makeRequest('getLeads');
export const addLead = (lead) => makeRequest('addLead', { lead });
export const updateLead = (lead) => makeRequest('updateLead', { lead });
export const deleteLead = (leadId) => makeRequest('deleteLead', { leadId });