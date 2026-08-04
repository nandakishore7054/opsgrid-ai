const turf = require('@turf/turf');

const MAX_SPEED_KMH = 150;

/**
 * Validates a new GPS point against the last valid point.
 * @param {Object} lastValidPoint - The previous valid location document.
 * @param {Object} curr - The new location document to validate.
 * @param {Number|String} index - Optional identifier for logging.
 * @returns {Object} - { isValid: boolean, reason: string, distanceKm: number }
 */
function isValidGPSUpdate(lastValidPoint, curr, index = 'live') {
  if (!curr?.location?.coordinates) {
    console.log(`DROP point ${index}`);
    console.log(`Reason: missing coordinates`);
    return { isValid: false, reason: 'missing_coordinates', distanceKm: 0 };
  }

  if (!lastValidPoint) {
    console.log(`KEEP point ${index} (first point)`);
    return { isValid: true, reason: 'first_point', distanceKm: 0 };
  }

  const from = turf.point(lastValidPoint.location.coordinates);
  const to = turf.point(curr.location.coordinates);
  const segmentDistance = turf.distance(from, to, { units: 'kilometers' });
  
  console.log(`Distance from previous point (meters): ${(segmentDistance * 1000).toFixed(2)}`);

  // Ignore micro-jitter and duplicate stationary points (< 5 meters)
  if (segmentDistance < 0.005) {
    console.log(`DROP point ${index}`);
    console.log(`Reason: distance < 5m`);
    return { isValid: false, reason: 'stationary', distanceKm: segmentDistance };
  }
  
  // Ignore impossible GPS jumps
  if (lastValidPoint.timestamp && curr.timestamp) {
    const timeDiffHours = (new Date(curr.timestamp) - new Date(lastValidPoint.timestamp)) / (1000 * 60 * 60);
    const timeDiffSecs = timeDiffHours * 3600;
    console.log(`Time difference (seconds): ${timeDiffSecs.toFixed(2)}`);
    
    if (timeDiffHours > 0) {
      const speedKmh = segmentDistance / timeDiffHours;
      console.log(`Calculated speed (km/h): ${speedKmh.toFixed(2)}`);
      
      if (speedKmh > MAX_SPEED_KMH) {
        console.log(`DROP point ${index}`);
        console.log(`Reason: speed > MAX_SPEED_KMH`);
        return { isValid: false, reason: 'impossible_jump', distanceKm: segmentDistance, speedKmh };
      }
    } else {
      console.log(`Calculated speed (km/h): N/A`);
      console.log(`DROP point ${index}`);
      console.log(`Reason: invalid timestamp (0s diff)`);
      return { isValid: false, reason: 'invalid_timestamp', distanceKm: segmentDistance };
    }
  } else {
    console.log(`Time difference (seconds): N/A`);
    console.log(`Calculated speed (km/h): N/A`);
    console.log(`DROP point ${index}`);
    console.log(`Reason: invalid timestamp (missing)`);
    return { isValid: false, reason: 'missing_timestamp', distanceKm: segmentDistance };
  }
  
  console.log(`KEEP point ${index}`);
  return { isValid: true, reason: 'valid_movement', distanceKm: segmentDistance };
}

/**
 * Filters out impossible GPS jumps (e.g., > 150 km/h) and returns a validated sequence.
 * @param {Array} locations - Array of location documents containing `.location.coordinates` as [lng, lat] and `.timestamp`.
 * @returns {Array} - Validated location documents.
 */
function filterValidLocations(locations) {
  if (!locations || locations.length === 0) return [];

  const validLocations = [];
  let lastValidPoint = null;

  for (let i = 0; i < locations.length; i++) {
    const curr = locations[i];
    
    console.log(`\nPoint ${i}`);
    
    if (curr?.location?.coordinates) {
      console.log(`Latitude: ${curr.location.coordinates[1]}`);
      console.log(`Longitude: ${curr.location.coordinates[0]}`);
      console.log(`Timestamp: ${curr.timestamp}`);
    }

    const validation = isValidGPSUpdate(lastValidPoint, curr, i);
    
    if (validation.isValid) {
      validLocations.push(curr);
      lastValidPoint = curr;
    }
  }

  return validLocations;
}

/**
 * Calculates the total Haversine distance for an array of locations sequentially.
 * @param {Array} locations - Array of location documents containing `.location.coordinates` as [lng, lat] and `.timestamp`.
 * @returns {Number} - Total distance in kilometers.
 */
function calculateTotalDistance(locations) {
  const validLocations = filterValidLocations(locations);
  if (validLocations.length < 2) return 0;

  let totalDistance = 0;

  for (let i = 1; i < validLocations.length; i++) {
    const prev = validLocations[i - 1];
    const curr = validLocations[i];
    
    const from = turf.point(prev.location.coordinates);
    const to = turf.point(curr.location.coordinates);
    totalDistance += turf.distance(from, to, { units: 'kilometers' });
  }

  return totalDistance;
}

module.exports = {
  calculateTotalDistance,
  filterValidLocations,
  isValidGPSUpdate,
  MAX_SPEED_KMH
};
