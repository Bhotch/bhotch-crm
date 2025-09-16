const GOOGLE_MAPS_API_KEY = process.env.REACT_APP_GOOGLE_MAPS_API_KEY;
let googleMapsLoaded = false;

export const loadGoogleMaps = () => {
  return new Promise((resolve, reject) => {
    if (!GOOGLE_MAPS_API_KEY) {
        return reject(new Error('Google Maps API key is not configured. Please check your environment variables.'));
    }
    
    if (googleMapsLoaded && window.google?.maps) {
      return resolve(window.google);
    }
    
    const scriptId = 'google-maps-script';
    const existingScript = document.getElementById(scriptId);
    
    if (existingScript) {
      // Script is already loading, wait for it
      existingScript.addEventListener('load', () => {
        googleMapsLoaded = true;
        resolve(window.google);
      });
      existingScript.addEventListener('error', () => {
        reject(new Error('Failed to load Google Maps. Please check your API key and internet connection.'));
      });
      return;
    }

    const script = document.createElement('script');
    script.id = scriptId;
    script.src = `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_MAPS_API_KEY}&libraries=geometry,places&loading=async`;
    script.async = true;
    script.defer = true;
    
    script.onload = () => { 
        googleMapsLoaded = true; 
        resolve(window.google); 
    };
    
    script.onerror = () => {
      document.head.removeChild(script);
      reject(new Error('Failed to load Google Maps. Please check your API key and internet connection.'));
    };
    
    document.head.appendChild(script);
  });
};