/**
 * Services file for connecting React CRM to Google Sheets
 * Save this as: src/services.js
 */

// Google Sheets Service Class
class GoogleSheetsService {
  constructor() {
    this.baseURL = process.env.REACT_APP_GAS_WEB_APP_URL;

    if (!this.baseURL) {
      console.error('Google Apps Script URL not configured! Check your .env file');
    } else {
      console.log('Google Sheets Service initialized with URL:', this.baseURL);
    }
  }

  async makeRequest(data) {
    if (!this.baseURL) {
        console.error("Google Apps Script URL is not configured. Cannot make request.");
        return { success: false, message: "Configuration error." };
    }
    try {
      console.log('Sending request to Google Sheets:', data.action);
      console.log('URL being used:', this.baseURL);
      console.log('Data being sent:', data);

      // CRITICAL: Use no-cors mode for Google Apps Script
      await fetch(this.baseURL, {
        method: 'POST',
        mode: 'no-cors', // Required for Google Apps Script
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data)
      });

      // With no-cors, we can't read response but request is sent
      console.log('Request sent successfully to Google Sheets!');

      // Return success
      return { success: true, message: 'Data sent to Google Sheets' };

    } catch (error) {
      console.error('Error communicating with Google Sheets:', error);
      throw error;
    }
  }

  async getLeads(filters = {}) {
    // With no-cors, we can't fetch data back
    // Return empty array for now
    console.log('Note: Reading from Google Sheets requires a different approach');
    return [];
  }

  async addLead(lead) {
    console.log('Service addLead called with:', lead.customerName);
    console.log('Adding lead:', lead);
    return this.makeRequest({
      action: 'addLead',
      lead: lead
    });
  }

  async updateLead(lead) {
    console.log('Updating lead:', lead);
    return this.makeRequest({
      action: 'updateLead',
      lead: lead
    });
  }

  async deleteLead(leadId) {
    console.log('Deleting lead:', leadId);
    return this.makeRequest({
      action: 'deleteLead',
      leadId: leadId
    });
  }

  async getStats() {
    return this.makeRequest({
      action: 'getStats'
    });
  }
}

// Activity Logger Class
class ActivityLogger {
  constructor() {
    this.backendURL = process.env.REACT_APP_GAS_WEB_APP_URL;
  }

  async logActivity(type, leadId, description) {
    console.log(`Activity logged: ${type} - ${description}`);
    // For now, just log to console
    // Could send to Google Sheets if needed
    return { success: true };
  }
}

// Create and export service instances
export const googleSheetsService = new GoogleSheetsService();
export const activityLogger = new ActivityLogger();

// Also export as default
const services = {
  sheets: googleSheetsService,
  logger: activityLogger
};

export default services;

