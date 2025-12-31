// OpenRouteService API utilities for Foodly AI Assistant (Free Alternative to Google Maps)

const ORS_API_KEY = import.meta.env.VITE_ORS_API_KEY;

// Campus locations coordinates (approximate for SASTRA University)
const CAMPUS_LOCATIONS = {
  'Main Canteen': { lat: 10.8862, lng: 78.8769 },
  'Canopy': { lat: 10.8875, lng: 78.8782 },
  'Nescafe': { lat: 10.8858, lng: 78.8771 },
  'South Mess': { lat: 10.8845, lng: 78.8763 },
  'VKJ': { lat: 10.8868, lng: 78.8775 },
  'VBH': { lat: 10.8852, lng: 78.8768 },
  'Library': { lat: 10.8872, lng: 78.8778 },
  'TIFAC': { lat: 10.8881, lng: 78.8785 },
  'CVR': { lat: 10.8859, lng: 78.8772 }
};

export const getTrafficTime = async (origin, destination, mode = 'walking') => {
  if (!ORS_API_KEY) {
    console.warn('OpenRouteService API key not configured, using fallback distance calculation');
    return getFallbackTravelTime(origin, destination);
  }

  try {
    const originCoords = CAMPUS_LOCATIONS[origin];
    const destCoords = CAMPUS_LOCATIONS[destination];

    if (!originCoords || !destCoords) {
      return getFallbackTravelTime(origin, destination);
    }

    // Map mode to ORS profile
    const profile = mode === 'walking' ? 'foot-walking' : 'driving-car';

    const url = `https://api.openrouteservice.org/v2/directions/${profile}?api_key=${ORS_API_KEY}&start=${originCoords.lng},${originCoords.lat}&end=${destCoords.lng},${destCoords.lat}`;

    const response = await fetch(url);
    const data = await response.json();

    if (data.features && data.features.length > 0) {
      const route = data.features[0];
      const properties = route.properties;
      const segments = properties.segments[0];

      // Convert duration from seconds to appropriate format
      const durationSeconds = Math.round(segments.duration);
      const durationMinutes = Math.round(durationSeconds / 60);

      // Convert distance from meters
      const distanceMeters = Math.round(segments.distance);
      const distanceKm = (distanceMeters / 1000).toFixed(1);

      return {
        duration: durationSeconds,
        durationText: `${durationMinutes} mins`,
        distance: distanceMeters,
        distanceText: `${distanceKm} km`,
        trafficDuration: durationSeconds, // ORS doesn't provide traffic data like Google
        trafficDurationText: `${durationMinutes} mins`
      };
    }
  } catch (error) {
    console.error('Error fetching ORS directions:', error);
  }

  return getFallbackTravelTime(origin, destination);
};

const getFallbackTravelTime = (origin, destination) => {
  // Fallback using static distance data
  const distances = {
    'Main Canteen': { 'VKJ': 0.5, 'VBH': 1.2, 'Library': 0.2, 'TIFAC': 0.8, 'CVR': 0.6 },
    'Canopy': { 'VKJ': 1.5, 'VBH': 0.4, 'Library': 1.1, 'TIFAC': 0.3, 'CVR': 0.9 },
    'Nescafe': { 'VKJ': 0.8, 'VBH': 0.9, 'Library': 0.1, 'TIFAC': 1.2, 'CVR': 0.4 },
    'South Mess': { 'VKJ': 1.8, 'VBH': 0.2, 'Library': 1.5, 'TIFAC': 1.4, 'CVR': 1.6 }
  };

  const distance = distances[origin]?.[destination] || 0.5; // default 0.5km
  const walkingSpeed = 5; // km/h
  const durationMinutes = Math.round((distance / walkingSpeed) * 60);

  return {
    duration: durationMinutes * 60,
    durationText: `${durationMinutes} mins`,
    distance: distance * 1000,
    distanceText: `${distance} km`,
    trafficDuration: durationMinutes * 60,
    trafficDurationText: `${durationMinutes} mins`
  };
};

export const getBestRoute = async (userLocation, canteens) => {
  if (!ORS_API_KEY) {
    // Fallback: sort by static distance
    return canteens.sort((a, b) => a.distance - b.distance);
  }

  try {
    const routes = await Promise.all(
      canteens.map(async (canteen) => {
        const trafficData = await getTrafficTime(userLocation, canteen.name);
        return {
          ...canteen,
          trafficTime: trafficData.trafficDuration,
          trafficTimeText: trafficData.trafficDurationText,
          realDistance: trafficData.distance / 1000
        };
      })
    );

    return routes.sort((a, b) => a.trafficTime - b.trafficTime);
  } catch (error) {
    console.error('Error getting best routes:', error);
    return canteens.sort((a, b) => a.distance - b.distance);
  }
};

export const getLocationSuggestions = (input) => {
  const lowerInput = input.toLowerCase();
  return Object.keys(CAMPUS_LOCATIONS).filter(location =>
    location.toLowerCase().includes(lowerInput)
  );
};

export const getCurrentTrafficStatus = async () => {
  // This would typically check current traffic conditions
  // For now, return a simple status based on time
  const hour = new Date().getHours();
  const isPeakHour = (hour >= 12 && hour <= 14) || (hour >= 19 && hour <= 21);

  return {
    isPeakHour,
    congestionLevel: isPeakHour ? 'high' : 'normal',
    message: isPeakHour ? 'High traffic expected during peak hours' : 'Normal traffic conditions'
  };
};
