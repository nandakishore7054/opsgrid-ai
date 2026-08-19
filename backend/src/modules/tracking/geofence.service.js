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

  const matchedGeofences = [];

  for (const geofence of activeGeofences) {
    let isInside = false;
    let area = Infinity;
    let onBoundary = false;

    if (geofence.type === 'polygon' && geofence.boundary && geofence.boundary.coordinates) {
      try {
        const polygon = turf.polygon(geofence.boundary.coordinates);
        isInside = turf.booleanPointInPolygon(point, polygon, { ignoreBoundary: false });
        if (isInside) {
          area = turf.area(polygon);
          const strictlyInside = turf.booleanPointInPolygon(point, polygon, { ignoreBoundary: true });
          onBoundary = !strictlyInside;
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
          onBoundary = Math.abs(distance - geofence.radius) < 0.5;
        }
      } catch (err) {
        console.error(`[TRACE: ERROR] Turf error on circle for geofence ${geofence._id}:`, err.message || err);
      }
    }

    if (isInside) {
      matchedGeofences.push({ geofence, area, onBoundary });
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
  const { getStartOfDay, getEndOfDay } = require('../../core/utils/date.util');
  const { invalidateDashboardCache } = require('../dashboard/dashboard.service');

  const incomingTimestamp = location.timestamp ? new Date(location.timestamp) : new Date();
  const startOfToday = getStartOfDay(incomingTimestamp);
  const endOfToday = getEndOfDay(incomingTimestamp);

  // Find newly entered geofences
  for (const geofenceId of currentGeofences) {
    if (!previousGeofences.has(geofenceId)) {
      const matchObj = matchedGeofences.find(m => m.geofence._id.toString() === geofenceId);
      const geofence = matchObj?.geofence || activeGeofences.find(g => g._id.toString() === geofenceId);
      const cat = geofence?.category?.toLowerCase()?.trim();
      
      global.io?.to('admin').emit('geofence:entered', {
        workerId: workerIdStr,
        geofenceId: geofenceId,
        geofenceName: geofence?.name,
        category: geofence?.category,
        timestamp: incomingTimestamp
      });
      
      await Notification.create({
        userId: workerIdStr,
        type: 'system',
        message: `Entered geofence: ${geofence?.name}`,
      });

      // Automatic Attendance Check-In
      if (cat === 'office') {
        try {
          await attendanceService.checkIn(workerIdStr, {
            method: 'auto',
            location: { latitude: location.latitude, longitude: location.longitude }
          });
          
          await Notification.create({
            userId: workerIdStr,
            type: 'attendance_auto',
            message: `Automatically checked in at ${geofence.name}.`,
          });
          global.io?.to('manager').emit('attendance:auto_checkin', { workerId: workerIdStr, geofenceName: geofence.name });
          invalidateDashboardCache();
        } catch (err) {
          console.error(`[ERROR] Auto check-in failed for worker ${workerIdStr}:`, err.message || err);
        }
      }

      // Customer Visit Arrival
      if (cat === 'customer') {
        try {
          const existingVisit = await CustomerVisit.findOne({
            workerId: workerIdStr,
            geofenceId: geofence._id,
            departureTime: null
          }).sort({ arrivalTime: -1 });
          
          let createNewVisit = false;
          let visitAction = 'NONE';
          let visitRecordId = null;

          if (!existingVisit) {
            createNewVisit = true;
            visitAction = 'CREATED_NEW_VISIT';
          } else {
            const isVisitFromPastDay = existingVisit.arrivalTime < startOfToday;

            if (isVisitFromPastDay) {
              // Stale visit from a previous calendar day: close it out properly
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
                existingVisit.departureTime = firstOutsidePing.timestamp;
              } else {
                existingVisit.departureTime = getEndOfDay(existingVisit.arrivalTime);
              }
              existingVisit.durationMs = Math.max(0, existingVisit.departureTime.getTime() - existingVisit.arrivalTime.getTime());
              await existingVisit.save();

              createNewVisit = true;
              visitAction = 'RECOVERED_STALE_AND_CREATED_NEW';
            } else {
              // Continuing active visit already established today (memory state recovery)
              createNewVisit = false;
              visitAction = 'CONTINUING_ACTIVE_TODAY';
              visitRecordId = existingVisit._id;
            }
          }

          if (createNewVisit) {
            const newVisit = await CustomerVisit.create({
              workerId: workerIdStr,
              geofenceId: geofence._id,
              arrivalTime: incomingTimestamp
            });
            visitRecordId = newVisit._id;
            invalidateDashboardCache();

            await Notification.create({
              userId: workerIdStr,
              type: 'system',
              message: `Arrived at customer site: ${geofence.name}`,
            });
            global.io?.to('manager').emit('geofence:customer_arrival', { workerId: workerIdStr, geofenceName: geofence.name });
          }

          const dashboardVisitCount = await CustomerVisit.countDocuments({
            arrivalTime: { $gte: startOfToday, $lte: endOfToday }
          });

          console.log(`\n[CUSTOMER GEOFENCE DEBUG]
Worker: ${workerIdStr}
Incoming coordinates: ${location.latitude}, ${location.longitude}
Customer/geofence checked: ${geofence.name} (Category: ${geofence.category}, ID: ${geofence._id})
Polygon: ${geofence.type === 'polygon' ? JSON.stringify(geofence.boundary?.coordinates?.[0]) : 'N/A (Circle)'}
Point inside: true
Point on boundary: ${matchObj?.onBoundary ? 'true (On Polygon Vertex/Edge)' : 'false (Strictly Inside)'}
Previous geofence state: ${Array.from(previousGeofences).join(', ') || 'NONE (Outside)'}
Current geofence state: ${Array.from(currentGeofences).join(', ')}
Visit action: ${visitAction}
Visit record ID: ${visitRecordId || 'N/A'}
Dashboard visit count: ${dashboardVisitCount}\n`);
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
        timestamp: incomingTimestamp
      });
      
      await Notification.create({
        userId: workerIdStr,
        type: 'system',
        message: `Exited geofence: ${geofence?.name || geofenceId}`,
      });

      // Automatic Attendance Check-Out
      if (cat === 'office') {
        try {
          await attendanceService.checkOut(workerIdStr, {
            method: 'auto',
            location: { latitude: location.latitude, longitude: location.longitude }
          });
          
          await Notification.create({
            userId: workerIdStr,
            type: 'attendance_auto',
            message: `Automatically checked out of ${geofence?.name || geofenceId}.`,
          });
          global.io?.to('manager').emit('attendance:auto_checkout', { workerId: workerIdStr, geofenceName: geofence?.name || geofenceId });
          invalidateDashboardCache();
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
            visit.departureTime = incomingTimestamp;
            visit.durationMs = Math.max(0, incomingTimestamp.getTime() - visit.arrivalTime.getTime());
            await visit.save();
            invalidateDashboardCache();
            
            console.log(`[CUSTOMER GEOFENCE DEBUG] CustomerVisit closed for worker ${workerIdStr} at ${geofence.name} (Departure: ${visit.departureTime}, Duration: ${visit.durationMs}ms)`);
            
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
