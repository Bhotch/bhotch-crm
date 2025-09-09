/**
 * Services file for connecting React CRM to Google Sheets
 * Save this as: src/services.js
 */

// Google Sheets Service Class
class GoogleSheetsService {
  constructor() {
    // Use the API route in production, direct URL in development
    this.baseURL = process.env.NODE_ENV === 'production' 
      ? '/api/sheets'  // This will use your Vercel function
      : process.env.REACT_APP_GAS_WEB_APP_URL;
    
    console.log('Google Sheets Service initialized');
    console.log('Using URL:', this.baseURL);
  }

  async makeRequest(data) {
    try {
      console.log('Sending request:', data.action);
      
      const response = await fetch(this.baseURL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data)
      });
      
      // Now we can read the response!
      const result = await response.json();
      console.log('Response received:', result);
      
      if (!result.success && result.error) {
        throw new Error(result.error);
      }
      
      return result.data || result;
      
    } catch (error) {
      console.error('Error communicating with Google Sheets:', error);
      throw error;
    }
  }
  
  // Now this can actually work!
  async getLeads() {
    return this.makeRequest({ 
      action: 'getLeads'
    });
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

