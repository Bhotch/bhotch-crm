const GOOGLE_SCRIPT_URL = process.env.REACT_APP_GAS_WEB_APP_URL;

class GoogleSheetsService {
  constructor(baseURL) { this.baseURL = baseURL; }
    
  async makeRequest(action, payload) {
    if (!this.baseURL) return { success: false, message: 'API endpoint is not configured.' };
    try {
      const response = await fetch(this.baseURL, {
        method: 'POST', mode: 'cors', credentials: 'omit',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify({ action, ...payload })
      });
      if (!response.ok) throw new Error(`Server responded with status: ${response.status}`);
      const text = await response.text();
      try { 
        const result = JSON.parse(text);
        if (result.success === false) throw new Error(result.message || 'An unknown backend error occurred.');
        return result;
      }
      catch { throw new Error('Invalid server response. The backend may have crashed.'); }
    } catch (error) {
      return { success: false, message: `Network error: ${error.message}` };
    }
  }
    
  fetchLeads() { return this.makeRequest('getLeads', {}); }
  addLead(lead) { return this.makeRequest('addLead', { lead }); }
  updateLead(lead) { return this.makeRequest('updateLead', { lead }); }
  deleteLead(leadId) { return this.makeRequest('deleteLead', { leadId }); }
  testConnection() { return this.makeRequest('testConnection', {}); }
  geocodeAddress(address) { return this.makeRequest('geocodeAddress', { address }); }
}

export const googleSheetsService = new GoogleSheetsService(GOOGLE_SCRIPT_URL);