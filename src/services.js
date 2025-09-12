// Emergency fix for src/services.js
// Replace your existing GoogleSheetsService class with this:

class GoogleSheetsService {
  constructor() {
    // Force direct URL for now - bypass the production routing issue
    this.baseURL = 'https://script.google.com/macros/s/AKfycbw8r0tVUeFptoP0hdEQONuP8RR5NdYxBjPZwiXPZCLJLwduWAm28K23aVjqwzr4joejtA/exec';
    
    console.log('Google Sheets Service initialized');
    console.log('Using URL:', this.baseURL);
  }

  async makeRequest(data) {
    try {
      console.log('Sending request:', data.action);
      
      // Use GET for getLeads, POST for others
      let response;
      if (data.action === 'getLeads') {
        const url = new URL(this.baseURL);
        url.searchParams.append('action', 'getLeads');
        url.searchParams.append('cacheBust', new Date().getTime());
        
        response = await fetch(url, {
          method: 'GET',
          mode: 'cors'
        });
      } else {
        response = await fetch(this.baseURL, {
          method: 'POST',
          mode: 'cors',
          headers: {
            'Content-Type': 'text/plain;charset=utf-8',
          },
          body: JSON.stringify(data)
        });
      }
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const result = await response.json();
      console.log('Response received:', result);
      
      if (result.success === false) {
        throw new Error(result.message || result.error);
      }
      
      return result.data || result.leads || result;
      
    } catch (error) {
      console.error('Error communicating with Google Sheets:', error);
      throw error;
    }
  }
  
  async getLeads() {
    return this.makeRequest({ 
      action: 'getLeads'
    });
  }

  async addLead(lead) {
    return this.makeRequest({ 
      action: 'addLead',
      lead: lead
    });
  }

  async updateLead(lead) {
    return this.makeRequest({ 
      action: 'updateLead',
      lead: lead
    });
  }

  async deleteLead(leadId) {
    return this.makeRequest({ 
      action: 'deleteLead',
      leadId: leadId
    });
  }
}

// Activity Logger class
class ActivityLogger {
  log(activity) {
    console.log('Activity:', activity);
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