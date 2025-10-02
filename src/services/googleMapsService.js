const GOOGLE_MAPS_API_KEY = process.env.REACT_APP_GOOGLE_MAPS_API_KEY;
const LOAD_TIMEOUT = 10000; // 10 second timeout
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

    // Set up timeout for loading
    const timeoutId = setTimeout(() => {
      const script = document.getElementById(scriptId);
      if (script) {
        document.head.removeChild(script);
      }
      reject(new Error('Google Maps loading timed out. Please check your internet connection and try again.'));
    }, LOAD_TIMEOUT);

    if (existingScript) {
      // Script is already loading, wait for it
      const handleLoad = () => {
        clearTimeout(timeoutId);
        googleMapsLoaded = true;
        resolve(window.google);
      };
      const handleError = () => {
        clearTimeout(timeoutId);
        reject(new Error('Failed to load Google Maps. Please check your API key and internet connection.'));
      };

      existingScript.addEventListener('load', handleLoad, { once: true });
      existingScript.addEventListener('error', handleError, { once: true });
      return;
    }

    const script = document.createElement('script');
    script.id = scriptId;
    script.src = `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_MAPS_API_KEY}&libraries=geometry,places,drawing&loading=async`;
    script.async = true;
    script.defer = true;

    script.onload = () => {
        clearTimeout(timeoutId);
        googleMapsLoaded = true;
        resolve(window.google);
    };

    script.onerror = () => {
      clearTimeout(timeoutId);
      if (document.head.contains(script)) {
        document.head.removeChild(script);
      }
      reject(new Error('Failed to load Google Maps. Please check your API key and internet connection.'));
    };

    document.head.appendChild(script);
  });
};