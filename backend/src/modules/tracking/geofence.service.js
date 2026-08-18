const Geofence = require('./geofence.model');
const Notification = require('../notifications/notifications.model');
const turf = require('@turf/turf');

// In-memory state tracking: workerId -> Set of Geofence IDs they are currently inside
const workerGeofenceState = new Map();

async function createGeofence(payload, userId) {
  const geofence = await Geofence.create({ ...payload, createdBy: userId });
  return geofence;
}

async function getGeofences() {
  return Geofence.find().sort({ createdAt: -1 });
}

async function getGeofenceById(id) {
  return Geofence.findById(id);
}

async function updateGeofence(id, payload) {
  return Geofence.findByIdAndUpdate(id, payload, { new: true });
}

async function deleteGeofence(id) {
  return Geofence.findByIdAndDelete(id);
}

async function checkGeofenceTransitions(workerId, location) {
  if (!workerId || !location) return;

  const workerIdStr = workerId.toString();
  const activeGeofences = await Geofence.find({ isActive: true });

  const currentGeofences = new Set();
  const point = turf.point([location.longitude, location.latitude]);

  console.log(`\n[TRACE: GEOFENCE ENGINE] Starting transitions check for worker ${workerIdStr}`);
  console.log(`[TRACE: GEOFENCE ENGINE] Worker GPS: lon=${location.longitude}, lat=${location.latitude}`);
  
  const matchedGeofences = [];

  for (const geofence of activeGeofences) {
    let isInside = false;
    let area = Infinity;

    console.log(`[TRACE: GEOFENCE ENGINE] Checking against geofence: ID=${geofence._id}, Name="${geofence.name}", Category="${geofence.category}", Type="${geofence.type}"`);

    if (geofence.type === 'polygon' && geofence.boundary && geofence.boundary.coordinates) {
      try {
        const polygon = turf.polygon(geofence.boundary.coordinates);
        isInside = turf.booleanPointInPolygon(point, polygon);
        if (isInside) {
          area = turf.area(polygon);
          console.log(`[TRACE: GEOFENCE ENGINE] INSIDE polygon! Area: ${area} sqm`);
        } else {
          console.log(`[TRACE: GEOFENCE ENGINE] OUTSIDE polygon.`);
        }
      } catch (err) {
        console.error(`[TRACE: ERROR] Turf error on polygon for geofence ${geofence._id}:`, err.message || err);
      }
    } else if (geofence.type === 'circle' && geofence.center && geofence.center.coordinates && geofence.radius) {
      try {
        const center = turf.point(geofence.center.coordinates);
        const distance = turf.distance(center, point, { units: 'meters' });
        isInside = distance <= geofence.radius;
        if (isInside) {
          area = Math.PI * Math.pow(geofence.radius, 2);
          console.log(`[TRACE: GEOFENCE ENGINE] INSIDE circle! Distance: ${distance}m, Radius: ${geofence.radius}m, Area: ${area} sqm`);
        } else {
          console.log(`[TRACE: GEOFENCE ENGINE] OUTSIDE circle (Distance: ${distance}m > Radius: ${geofence.radius}m).`);
        }
      } catch (err) {
        console.error(`[TRACE: ERROR] Turf error on circle for geofence ${geofence._id}:`, err.message || err);
      }
    }

    if (isInside) {
      matchedGeofences.push({ geofence, area });
    }
  }

  // Handle overlapping customer geofences: pick the smallest area
  const customerMatches = matchedGeofences.filter(m => m.geofence.category?.toLowerCase()?.trim() === 'customer');
  let bestCustomerGeofence = null;
  if (customerMatches.length > 0) {
    customerMatches.sort((a, b) => a.area - b.area);
    bestCustomerGeofence = customerMatches[0].geofence;
  }

  for (const match of matchedGeofences) {
    // Only add the best customer geofence to current state, ignore other customer overlaps
    if (match.geofence.category?.toLowerCase()?.trim() === 'customer') {
      if (match.geofence._id.toString() === bestCustomerGeofence._id.toString()) {
        currentGeofences.add(match.geofence._id.toString());
      }
    } else {
      currentGeofences.add(match.geofence._id.toString());
    }
  }

  const previousGeofences = workerGeofenceState.get(workerIdStr) || new Set();
  const attendanceService = require('../attendance/attendance.service');
  const CustomerVisit = require('./customerVisit.model');

  // Find newly entered geofences
  for (const geofenceId of currentGeofences) {
    if (!previousGeofences.has(geofenceId)) {
      const geofence = activeGeofences.find(g => g._id.toString() === geofenceId);
      const cat = geofence?.category?.toLowerCase()?.trim();
      
      global.io?.to('admin').emit('geofence:entered', {
        workerId: workerIdStr,
        geofenceId: geofenceId,
        geofenceName: geofence?.name,
        category: geofence?.category,
        timestamp: new Date()
      });
      
      await Notification.create({
        userId: workerIdStr,
        type: 'system',
        message: `Entered geofence: ${geofence?.name}`,
      });

      // Automatic Attendance Check-In
      if (cat === 'office') {
        console.log(`[DEBUG] Worker ${workerIdStr} entered office geofence: ${geofence.name}`);
        try {
          await attendanceService.checkIn(workerIdStr, {
            method: 'auto',
            location: { latitude: location.latitude, longitude: location.longitude }
          });
          
          console.log(`[DEBUG] Attendance auto check-in created for worker ${workerIdStr}`);
          await Notification.create({
            userId: workerIdStr,
            type: 'attendance_auto',
            message: `Automatically checked in at ${geofence.name}.`,
          });
          global.io?.to('manager').emit('attendance:auto_checkin', { workerId: workerIdStr, geofenceName: geofence.name });
        } catch (err) {
          console.error(`[ERROR] Auto check-in failed for worker ${workerIdStr}:`, err.message || err);
        }
      }

      // Customer Visit Arrival
      if (cat === 'customer') {
        console.log(`[DEBUG] Worker ${workerIdStr} entered customer geofence: ${geofence.name}`);
        try {
          const existingVisit = await CustomerVisit.findOne({
            workerId: workerIdStr,
            geofenceId: geofence._id,
            departureTime: null
          });
          
          let createNewVisit = false;

          if (!existingVisit) {
            createNewVisit = true;
          } else {
            // Stale visit recovery logic
            const WorkerLocation = require('./location.model');
            const firstOutsidePing = await WorkerLocation.findOne({
              workerId: workerIdStr,
              timestamp: { $gte: existingVisit.arrivalTime },
              location: {
                $not: {
                  $geoWithin: {
                    $geometry: geofence.boundary
                  }
                }
              }
            }).sort({ timestamp: 1 });

            if (firstOutsidePing) {
              console.log(`[DEBUG] Stale active CustomerVisit found (ID: ${existingVisit._id}). First outside ping at ${firstOutsidePing.timestamp}. Recovering visit.`);
              existingVisit.departureTime = firstOutsidePing.timestamp;
              existingVisit.durationMs = Math.max(0, firstOutsidePing.timestamp.getTime() - existingVisit.arrivalTime.getTime());
              await existingVisit.save();
              console.log(`[DEBUG] Stale CustomerVisit closed. Old visit ID: ${existingVisit._id}`);
              createNewVisit = true; // Proceed to create the new visit for today
            } else {
              console.log(`[DEBUG] Legitimate active CustomerVisit (or memory recovery) for worker ${workerIdStr} at ${geofence.name} (ID: ${existingVisit._id}). No outside pings found.`);
            }
          }

          if (createNewVisit) {
            const newVisit = await CustomerVisit.create({
              workerId: workerIdStr,
              geofenceId: geofence._id,
              arrivalTime: new Date()
            });
            console.log(`[DEBUG] CustomerVisit created for worker ${workerIdStr} at ${geofence.name} (New visit ID: ${newVisit._id})`);
            
            await Notification.create({
              userId: workerIdStr,
              type: 'system',
              message: `Arrived at customer site: ${geofence.name}`,
            });
            global.io?.to('manager').emit('geofence:customer_arrival', { workerId: workerIdStr, geofenceName: geofence.name });
          }
        } catch (err) {
          console.error(`[ERROR] Failed to handle CustomerVisit for worker ${workerIdStr}:`, err.message || err);
        }
      }
    }
  }

  // Find exited geofences
  for (const geofenceId of previousGeofences) {
    if (!currentGeofences.has(geofenceId)) {
      let geofence = activeGeofences.find(g => g._id.toString() === geofenceId);
      if (!geofence) {
        geofence = await Geofence.findById(geofenceId);
      }
      const cat = geofence?.category?.toLowerCase()?.trim();
      
      global.io?.to('admin').emit('geofence:exited', {
        workerId: workerIdStr,
        geofenceId: geofenceId,
        geofenceName: geofence?.name || geofenceId,
        category: geofence?.category,
        timestamp: new Date()
      });
      
      await Notification.create({
        userId: workerIdStr,
        type: 'system',
        message: `Exited geofence: ${geofence?.name || geofenceId}`,
      });

      // Automatic Attendance Check-Out
      if (cat === 'office') {
        console.log(`[DEBUG] Worker ${workerIdStr} exited office geofence: ${geofence?.name || geofenceId}`);
        try {
          await attendanceService.checkOut(workerIdStr, {
            method: 'auto',
            location: { latitude: location.latitude, longitude: location.longitude }
          });
          console.log(`[DEBUG] Attendance auto check-out for worker ${workerIdStr}`);
          await Notification.create({
            userId: workerIdStr,
            type: 'attendance_auto',
            message: `Automatically checked out of ${geofence?.name || geofenceId}.`,
          });
          global.io?.to('manager').emit('attendance:auto_checkout', { workerId: workerIdStr, geofenceName: geofence?.name || geofenceId });
        } catch (err) {
          console.error(`[ERROR] Auto check-out failed for worker ${workerIdStr}:`, err.message || err);
        }
      }

      // Customer Visit Departure
      if (cat === 'customer') {
        try {
          const visit = await CustomerVisit.findOne({ 
            workerId: workerIdStr, 
            geofenceId: geofence._id,
            departureTime: null 
          }).sort({ arrivalTime: -1 });
          
          if (visit) {
            const now = new Date();
            visit.departureTime = now;
            visit.durationMs = now.getTime() - visit.arrivalTime.getTime();
            await visit.save();
            console.log(`[DEBUG] CustomerVisit closed for worker ${workerIdStr} at ${geofence.name} (Duration: ${visit.durationMs}ms)`);
            
            await Notification.create({
              userId: workerIdStr,
              type: 'system',
              message: `Departed from customer site: ${geofence.name}`,
            });
            global.io?.to('manager').emit('geofence:customer_departure', { workerId: workerIdStr, geofenceName: geofence.name, durationMs: visit.durationMs });
          } else {
            console.warn(`[WARNING] No active CustomerVisit found to close for worker ${workerIdStr} at ${geofence.name}`);
          }
        } catch (err) {
          console.error(`[ERROR] Failed to close CustomerVisit for worker ${workerIdStr}:`, err.message || err);
        }
      }
    }
  }

  workerGeofenceState.set(workerIdStr, currentGeofences);
}

async function getActiveGeofenceForLocation(longitude, latitude) {
  if (longitude === undefined || latitude === undefined || longitude === null || latitude === null) return null;

  const activeGeofences = await Geofence.find({ isActive: true });
  const point = turf.point([longitude, latitude]);
  const matchedGeofences = [];

  for (const geofence of activeGeofences) {
    let isInside = false;
    let area = Infinity;

    if (geofence.type === 'polygon' && geofence.boundary && geofence.boundary.coordinates) {
      try {
        const polygon = turf.polygon(geofence.boundary.coordinates);
        isInside = turf.booleanPointInPolygon(point, polygon);
        if (isInside) area = turf.area(polygon);
      } catch (err) {}
    } else if (geofence.type === 'circle' && geofence.center && geofence.center.coordinates && geofence.radius) {
      try {
        const center = turf.point(geofence.center.coordinates);
        const distance = turf.distance(center, point, { units: 'meters' });
        isInside = distance <= geofence.radius;
        if (isInside) area = Math.PI * Math.pow(geofence.radius, 2);
      } catch (err) {}
    }

    if (isInside) {
      matchedGeofences.push({ geofence, area });
    }
  }

  if (matchedGeofences.length === 0) return null;

  // Prefer the smallest area geofence
  matchedGeofences.sort((a, b) => a.area - b.area);
  return matchedGeofences[0].geofence.name;
}

module.exports = {
  createGeofence,
  getGeofences,
  getGeofenceById,
  updateGeofence,
  deleteGeofence,
  checkGeofenceTransitions,
  getActiveGeofenceForLocation,
};
