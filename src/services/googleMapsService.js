const GOOGLE_MAPS_API_KEY = process.env.REACT_APP_GOOGLE_MAPS_API_KEY;
let googleMapsLoaded = false;

export const loadGoogleMaps = () => {
  return new Promise((resolve, reject) => {
    if (!GOOGLE_MAPS_API_KEY) {
        return reject(new Error('Google Maps API key is not configured.'));
    }
    if (googleMapsLoaded && window.google?.maps) {
      return resolve(window.google);
    }
    const scriptId = 'google-maps-script';
    if (document.getElementById(scriptId)) return;

    const script = document.createElement('script');
    script.id = scriptId;
    script.src = `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_MAPS_API_KEY}&libraries=geometry,places`;
    script.async = true;
    script.defer = true;
    script.onload = () => { 
        googleMapsLoaded = true; 
        resolve(window.google); 
    };
    script.onerror = () => reject(new Error('Failed to load Google Maps script.'));
    document.head.appendChild(script);
  });
};