const GOOGLE_MAPS_API_KEY = process.env.REACT_APP_GOOGLE_MAPS_API_KEY;
const LOAD_TIMEOUT = 15000; // 15 second timeout
let googleMapsLoaded = false;
let loadingPromise = null;

export const loadGoogleMaps = () => {
  // If already loaded, return immediately
  if (googleMapsLoaded && window.google?.maps?.Map) {
    return Promise.resolve(window.google);
  }

  // If already loading, return the existing promise
  if (loadingPromise) {
    return loadingPromise;
  }

  loadingPromise = new Promise((resolve, reject) => {
    if (!GOOGLE_MAPS_API_KEY) {
      loadingPromise = null;
      return reject(new Error('Google Maps API key is not configured. Please check your environment variables.'));
    }

    // Double check if loaded while we were waiting
    if (window.google?.maps?.Map) {
      googleMapsLoaded = true;
      loadingPromise = null;
      return resolve(window.google);
    }

    const scriptId = 'google-maps-script';
    const existingScript = document.getElementById(scriptId);

    // Set up timeout for loading
    const timeoutId = setTimeout(() => {
      loadingPromise = null;
      const script = document.getElementById(scriptId);
      if (script && document.head.contains(script)) {
        document.head.removeChild(script);
      }
      reject(new Error('Google Maps loading timed out. Please check your internet connection and try again.'));
    }, LOAD_TIMEOUT);

    const handleSuccess = () => {
      clearTimeout(timeoutId);

      // Wait for google.maps.Map to be available (not just window.google)
      const checkMapsReady = () => {
        if (window.google?.maps?.Map) {
          googleMapsLoaded = true;
          loadingPromise = null;
          resolve(window.google);
        } else if (window.google) {
          // Maps library is loading, wait a bit longer
          setTimeout(checkMapsReady, 50);
        } else {
          handleFailure(new Error('Google Maps loaded but Maps API not available'));
        }
      };

      checkMapsReady();
    };

    const handleFailure = (error) => {
      clearTimeout(timeoutId);
      loadingPromise = null;
      const script = document.getElementById(scriptId);
      if (script && document.head.contains(script)) {
        document.head.removeChild(script);
      }
      reject(error || new Error('Failed to load Google Maps. Please check your API key and internet connection.'));
    };

    if (existingScript) {
      // Script is already in DOM, wait for it to load
      if (window.google?.maps?.Map) {
        handleSuccess();
      } else {
        existingScript.addEventListener('load', handleSuccess, { once: true });
        existingScript.addEventListener('error', () => handleFailure(), { once: true });
      }
      return;
    }

    // Create new script with loading=async parameter to follow best practices
    // Include marker library for AdvancedMarkerElement support
    // Note: Drawing library removed as it's deprecated - using custom drawing implementation
    const script = document.createElement('script');
    script.id = scriptId;
    script.src = `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_MAPS_API_KEY}&libraries=geometry,places,marker&loading=async`;
    script.async = true;
    script.defer = true;

    script.onload = handleSuccess;
    script.onerror = () => handleFailure();

    document.head.appendChild(script);
  });

  return loadingPromise;
};