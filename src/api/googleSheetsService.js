// Fix for deployment environment variable parsing issue
let GOOGLE_SCRIPT_URL = process.env.REACT_APP_GAS_WEB_APP_URL;

// Handle case where environment variable includes the variable name
if (GOOGLE_SCRIPT_URL && GOOGLE_SCRIPT_URL.includes('REACT_APP_GAS_WEB_APP_URL=')) {
  GOOGLE_SCRIPT_URL = GOOGLE_SCRIPT_URL.split('REACT_APP_GAS_WEB_APP_URL=')[1];
}

// Ensure URL has proper protocol
if (GOOGLE_SCRIPT_URL && !GOOGLE_SCRIPT_URL.startsWith('http')) {
  GOOGLE_SCRIPT_URL = 'https://' + GOOGLE_SCRIPT_URL.replace(/^\/+/, '');
}

class GoogleSheetsService {
  constructor(baseURL) {
    this.baseURL = baseURL;
  }

  async makeRequest(action, payload) {
    if (!this.baseURL) {
      return { success: false, message: 'API endpoint is not configured.' };
    }

    try {
      const response = await fetch(this.baseURL, {
        method: 'POST',
        mode: 'cors',
        credentials: 'omit',
        headers: {
          'Content-Type': 'text/plain;charset=utf-8'
        },
        body: JSON.stringify({ action, ...payload })
      });

      if (!response.ok) {
        throw new Error(`Server responded with status: ${response.status}`);
      }

      const text = await response.text();

      try {
        const result = JSON.parse(text);
        if (result.success === false) {
          throw new Error(result.message || 'An unknown backend error occurred.');
        }
        return result;
      } catch (parseError) {
        throw new Error('Invalid server response. The backend may have crashed.');
      }
    } catch (error) {
      return { success: false, message: `Network error: ${error.message}` };
    }
  }

  // Lead operations
  fetchLeads() {
    return this.makeRequest('getLeads', {});
  }

  addLead(lead) {
    return this.makeRequest('addLead', { lead });
  }

  updateLead(lead) {
    return this.makeRequest('updateLead', { lead });
  }

  deleteLead(leadId) {
    return this.makeRequest('deleteLead', { leadId });
  }

  // Job Count operations
  fetchJobCounts() {
    return this.makeRequest('getJobCounts', {});
  }

  addJobCount(jobCount) {
    return this.makeRequest('addJobCount', { jobCount });
  }

  updateJobCount(jobCount) {
    return this.makeRequest('updateJobCount', { jobCount });
  }

  deleteJobCount(jobCountId) {
    return this.makeRequest('deleteJobCount', { jobCountId });
  }

  // Utility operations
  testConnection() {
    return this.makeRequest('testConnection', {});
  }

  geocodeAddress(address) {
    return this.makeRequest('geocodeAddress', { address });
  }
}

export const googleSheetsService = new GoogleSheetsService(GOOGLE_SCRIPT_URL);