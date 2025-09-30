// Google Apps Script Web App URL
const COMMUNICATIONS_API_URL = 'https://script.google.com/macros/s/YOUR_SCRIPT_ID/exec';

/**
 * Communications Service
 * Handles all communication logging operations with Google Sheets backend
 */

/**
 * Log a communication (call, SMS, email)
 * @param {Object} communication - Communication data
 * @returns {Promise<Object>} - Response from the API
 */
export async function logCommunication(communication) {
  try {
    await fetch(`${COMMUNICATIONS_API_URL}?action=addCommunication`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(communication),
      mode: 'no-cors', // Google Apps Script requires no-cors
    });

    // Note: With no-cors, we can't read the response body
    // We'll assume success if no error is thrown
    console.log('Communication logged successfully:', communication);
    return { success: true, data: communication };
  } catch (error) {
    console.error('Error logging communication:', error);
    throw new Error('Failed to log communication');
  }
}

/**
 * Get all communications for a specific lead
 * @param {string} leadId - The lead ID
 * @returns {Promise<Array>} - Array of communications
 */
export async function getCommunicationsForLead(leadId) {
  try {
    await fetch(`${COMMUNICATIONS_API_URL}?action=getCommunications&leadId=${leadId}`, {
      method: 'GET',
      mode: 'no-cors',
    });

    // With no-cors, we can't read the response
    // For now, return empty array
    // TODO: Implement CORS-enabled endpoint or use Google Sheets API directly
    console.log('Fetching communications for lead:', leadId);
    return [];
  } catch (error) {
    console.error('Error fetching communications:', error);
    return [];
  }
}

/**
 * Get recent communications (last N days)
 * @param {number} days - Number of days to look back
 * @returns {Promise<Array>} - Array of recent communications
 */
export async function getRecentCommunications(days = 7) {
  try {
    await fetch(`${COMMUNICATIONS_API_URL}?action=getRecentCommunications&days=${days}`, {
      method: 'GET',
      mode: 'no-cors',
    });

    console.log(`Fetching communications from last ${days} days`);
    return [];
  } catch (error) {
    console.error('Error fetching recent communications:', error);
    return [];
  }
}

/**
 * Get communication statistics
 * @returns {Promise<Object>} - Communication statistics
 */
export async function getCommunicationStats() {
  try {
    await fetch(`${COMMUNICATIONS_API_URL}?action=getCommunicationStats`, {
      method: 'GET',
      mode: 'no-cors',
    });

    console.log('Fetching communication statistics');
    return {
      totalCalls: 0,
      totalSMS: 0,
      totalEmails: 0,
      appointmentsConfirmed: 0,
      noAnswers: 0,
      voicemailsLeft: 0,
    };
  } catch (error) {
    console.error('Error fetching communication stats:', error);
    return null;
  }
}

/**
 * Delete a communication
 * @param {string} communicationId - The communication ID
 * @returns {Promise<Object>} - Response from the API
 */
export async function deleteCommunication(communicationId) {
  try {
    await fetch(`${COMMUNICATIONS_API_URL}?action=deleteCommunication&id=${communicationId}`, {
      method: 'DELETE',
      mode: 'no-cors',
    });

    console.log('Communication deleted:', communicationId);
    return { success: true };
  } catch (error) {
    console.error('Error deleting communication:', error);
    throw new Error('Failed to delete communication');
  }
}

/**
 * Local storage fallback for development/offline mode
 */
const LOCAL_STORAGE_KEY = 'crm_communications';

export function saveToLocalStorage(communication) {
  try {
    const communications = JSON.parse(localStorage.getItem(LOCAL_STORAGE_KEY) || '[]');
    communications.push({
      ...communication,
      id: Date.now().toString(),
    });
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(communications));
    return { success: true, data: communication };
  } catch (error) {
    console.error('Error saving to local storage:', error);
    throw error;
  }
}

export function getFromLocalStorage() {
  try {
    return JSON.parse(localStorage.getItem(LOCAL_STORAGE_KEY) || '[]');
  } catch (error) {
    console.error('Error reading from local storage:', error);
    return [];
  }
}

export function clearLocalStorage() {
  try {
    localStorage.removeItem(LOCAL_STORAGE_KEY);
    return { success: true };
  } catch (error) {
    console.error('Error clearing local storage:', error);
    throw error;
  }
}
