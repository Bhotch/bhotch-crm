export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  // Handle OPTIONS request
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }
  
  try {
    // Your Google Apps Script URL from environment variable
    const GAS_URL = process.env.REACT_APP_GAS_WEB_APP_URL;
    
    if (!GAS_URL) {
      throw new Error('Google Apps Script URL not configured');
    }
    
    // Forward the request to Google Apps Script
    const response = await fetch(GAS_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(req.body)
    });
    
    // Get the response text first
    const responseText = await response.text();
    
    // Try to parse as JSON
    try {
      const data = JSON.parse(responseText);
      res.status(200).json(data);
    } catch (parseError) {
      // If not JSON, return as text
      res.status(200).json({ success: true, message: responseText });
    }
    
  } catch (error) {
    console.error('Proxy error:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
}