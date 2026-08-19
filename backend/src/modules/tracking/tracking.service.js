const WorkerLocation = require('./location.model');
const AttendanceRecord = require('../attendance/attendance.model');
const Geofence = require('./geofence.model');

const { getStartOfDay, getEndOfDay } = require('../../core/utils/date.util');

async function saveLocation(workerId, payload) {
  const record = new WorkerLocation({
    workerId,
    location: {
      type: 'Point',
      coordinates: [payload.longitude, payload.latitude],
    },
    accuracy: payload.accuracy,
    speed: payload.speed,
    heading: payload.heading,
    batteryLevel: payload.batteryLevel,
    isMoving: payload.isMoving,
    timestamp: payload.timestamp || new Date(),
  });

  await record.save();
  return record;
}

async function getActiveWorkers() {
  const now = new Date();
  const date = getStartOfDay(now);

  // 1. Get all workers who are checked in and haven't checked out today
  const allActiveAttendances = await AttendanceRecord.find({
    date: date,
    checkOut: { $exists: false },
  })
    .sort({ createdAt: -1 })
    .populate('workerId', 'name email currentLocation lastPing batteryLevel accuracy');

  // Keep only the latest attendance record per worker
  const activeAttendances = [];
  const seenWorkers = new Set();
  
  for (const record of allActiveAttendances) {
    if (!record.workerId) continue;
    const wid = record.workerId._id.toString();
    if (!seenWorkers.has(wid)) {
      seenWorkers.add(wid);
      activeAttendances.push(record);
    }
  }

  // Load CustomerVisit model
  const CustomerVisit = require('./customerVisit.model');

  // 2. Fetch the latest location for each active worker
  const activeWorkersWithLocation = await Promise.all(
    activeAttendances.map(async (attendance) => {
      // If the worker document was deleted but attendance exists, skip or handle safely
      if (!attendance.workerId) return null;

      const workerId = attendance.workerId._id;
      const user = attendance.workerId;

      let latitude = null;
      let longitude = null;
      let timestamp = null;
      let accuracy = null;
      let speed = null;
      let isMoving = null;
      let batteryLevel = null;

      if (user.currentLocation && user.currentLocation.coordinates && user.currentLocation.coordinates.length === 2) {
        longitude = user.currentLocation.coordinates[0];
        latitude = user.currentLocation.coordinates[1];
        timestamp = user.lastPing;
        accuracy = user.accuracy;
        batteryLevel = user.batteryLevel;
      } else if (attendance.checkIn && attendance.checkIn.location) {
        // Fallback to check-in location if no active tracking ping exists
        longitude = attendance.checkIn.location.coordinates[0];
        latitude = attendance.checkIn.location.coordinates[1];
        timestamp = attendance.checkIn.time;
      }

      // Check active CustomerVisit
      const activeVisit = await CustomerVisit.findOne({
        workerId: workerId,
        departureTime: null
      }).populate('geofenceId', 'name category');
      
      let currentGeofence = null;
      let geofenceArrivalTime = null;

      if (activeVisit && activeVisit.geofenceId) {
        currentGeofence = activeVisit.geofenceId.name;
        geofenceArrivalTime = activeVisit.arrivalTime;
      }

      // If no CustomerVisit is found, resolve geofence based on current coordinates
      if (!currentGeofence && longitude !== null && latitude !== null) {
        const geofenceService = require('./geofence.service');
        const resolvedGeofence = await geofenceService.getActiveGeofenceForLocation(longitude, latitude);
        if (resolvedGeofence) {
          currentGeofence = resolvedGeofence;
        }
      }

      return {
        workerId: workerId,
        workerName: attendance.workerId.name,
        email: attendance.workerId.email,
        latitude,
        longitude,
        timestamp,
        accuracy,
        speed,
        isMoving,
        batteryLevel,
        attendanceStatus: attendance.status,
        currentGeofence,
        geofenceArrivalTime
      };
    })
  );

  return activeWorkersWithLocation.filter(w => w !== null);
}

const turf = require('@turf/turf');

async function getWorkerTrail(workerId, dateStr) {
  const date = new Date(dateStr);
  const start = getStartOfDay(date);
  
  const end = getEndOfDay(date);

  const locations = await WorkerLocation.find({
    workerId,
    timestamp: { $gte: start, $lte: end }
  }).sort({ timestamp: 1 });

  if (!locations || locations.length === 0) {
    return {
      coordinates: [],
      startTime: null,
      endTime: null,
      totalPoints: 0,
      totalDistance: 0
    };
  }

  const { calculateTotalDistance, filterValidLocations } = require('../../core/utils/distance.util');
  const validLocations = filterValidLocations(locations);

  console.log(`\n[TRAIL DEBUG] Worker: ${workerId}`);
  console.log(`[TRAIL DEBUG] Raw locations fetched from MongoDB: ${locations.length}`);
  console.log(`[TRAIL DEBUG] Filtered validLocations length: ${validLocations.length}`);

  const coordinates = [];
  
  for (let i = 0; i < validLocations.length; i++) {
    const loc = validLocations[i];
    if (loc.location && loc.location.coordinates) {
      coordinates.push({
        lat: loc.location.coordinates[1],
        lng: loc.location.coordinates[0],
        timestamp: loc.timestamp
      });
    }
  }

  console.log(`[TRAIL DEBUG] Coordinates returned array length: ${coordinates.length}`);

  const totalDistanceKm = calculateTotalDistance(validLocations);

  return {
    coordinates,
    startTime: validLocations.length > 0 ? validLocations[0].timestamp : null,
    endTime: validLocations.length > 0 ? validLocations[validLocations.length - 1].timestamp : null,
    totalPoints: coordinates.length,
    totalDistance: totalDistanceKm
  };
}

async function getNearestWorkers(lat, lng, limit = 3) {
  const activeWorkers = await getActiveWorkers();
  console.log(`Number of active workers returned by getActiveWorkers: ${activeWorkers.length}`);
  
  const targetPoint = turf.point([lng, lat]);
  const workersWithDistance = [];
  
  for (const worker of activeWorkers) {
    console.log(`Worker: ${worker.workerId}`);
    console.log(`- latitude: ${worker.latitude}`);
    console.log(`- longitude: ${worker.longitude}`);
    console.log(`- attendance status: ${worker.attendanceStatus}`);
    console.log(`- current assignment: ${worker.currentGeofence}`);

    if (worker.latitude == null || worker.longitude == null) {
      console.log(`-> Skipping worker ${worker.workerId} because latitude or longitude missing`);
      continue;
    }

    // Attempt to calculate distance
    try {
      const workerPoint = turf.point([worker.longitude, worker.latitude]);
      const distance = turf.distance(targetPoint, workerPoint, { units: 'kilometers' });
      workersWithDistance.push({
        ...worker,
        distance
      });
      console.log(`-> Kept worker ${worker.workerId}, distance: ${distance}`);
    } catch (err) {
      console.log(`-> Skipping worker ${worker.workerId} due to turf error: ${err.message}`);
    }
  }

  workersWithDistance.sort((a, b) => a.distance - b.distance);
  return workersWithDistance.slice(0, limit);
}

async function getWorkerDailySummary(workerId, dateStr) {
  const User = require('../users/users.model');
  const CustomerVisit = require('./customerVisit.model');

  const date = dateStr ? new Date(dateStr) : new Date();
  const start = getStartOfDay(date);
  const end = getEndOfDay(date);

  // 1. Worker info
  const worker = await User.findById(workerId).select('name');
  if (!worker) throw new Error('Worker not found');

  // 2. Attendance
  const attendance = await AttendanceRecord.findOne({
    workerId,
    date: { $gte: start, $lte: end }
  });

  let checkIn = null;
  let checkOut = null;
  let attendanceStatus = 'Absent';

  if (attendance) {
    attendanceStatus = attendance.status;
    if (attendance.checkIn) checkIn = attendance.checkIn.time;
    if (attendance.checkOut) checkOut = attendance.checkOut.time;
  }

  // 3. Latest GPS & Online Status
  const latestLoc = await WorkerLocation.findOne({ workerId }).sort({ timestamp: -1 });
  let isOnline = false;
  let lastGPSUpdate = null;
  let latitude = null;
  let longitude = null;
  
  if (latestLoc) {
    lastGPSUpdate = latestLoc.timestamp;
    latitude = latestLoc.location.coordinates[1];
    longitude = latestLoc.location.coordinates[0];
    const msSinceLastPing = new Date() - new Date(latestLoc.timestamp);
    isOnline = msSinceLastPing < 5 * 60 * 1000;
  }

  // 4. Working Hours (in ms)
  let workingHoursMs = 0;
  if (checkIn) {
    const endCalc = checkOut || new Date();
    workingHoursMs = Math.max(0, new Date(endCalc) - new Date(checkIn));
  }

  // 5. Customer Visits & Time
  const visits = await CustomerVisit.find({
    workerId,
    arrivalTime: { $gte: start, $lte: end }
  });

  let customerVisits = visits.length;
  let customerTimeMs = 0;

  for (const v of visits) {
    const vEnd = v.departureTime || new Date();
    customerTimeMs += Math.max(0, new Date(vEnd) - new Date(v.arrivalTime));
  }

  // 6. Travel Time
  let travelTimeMs = Math.max(0, workingHoursMs - customerTimeMs);

  // 7. Distance
  const locations = await WorkerLocation.find({
    workerId,
    timestamp: { $gte: start, $lte: end }
  }).sort({ timestamp: 1 });

  const { calculateTotalDistance } = require('../../core/utils/distance.util');
  const totalDistance = calculateTotalDistance(locations);

  // 8. Performance Score
  let score = 100;
  if (attendanceStatus.toLowerCase() === 'absent') {
    score = 0;
  } else {
    if (attendanceStatus.toLowerCase() === 'late') score -= 15;
    else if (attendanceStatus.toLowerCase() !== 'present') score -= 5;
    
    const hoursWorked = workingHoursMs / (1000 * 60 * 60);
    if (hoursWorked < 6) score -= 20;
    else if (hoursWorked < 8) score -= 10;
    
    if (customerVisits === 0) score -= 20;
  }

  score = Math.max(0, Math.min(100, score));

  let rating = 'Needs Attention';
  if (score >= 90) rating = 'Excellent';
  else if (score >= 75) rating = 'Good';
  else if (score >= 60) rating = 'Average';

  // Format helpers
  const formatDuration = (ms) => {
    const totalMinutes = Math.floor(ms / (1000 * 60));
    const h = Math.floor(totalMinutes / 60);
    const m = totalMinutes % 60;
    return `${h}h ${m}m`;
  };

  const formatTime = (d) => {
    if (!d) return null;
    return new Date(d).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return {
    workerId,
    workerName: worker.name,
    attendanceStatus,
    checkIn: formatTime(checkIn),
    checkOut: formatTime(checkOut),
    workingHours: formatDuration(workingHoursMs),
    distanceTravelled: `${totalDistance.toFixed(2)} km`,
    customerVisits,
    customerTime: formatDuration(customerTimeMs),
    travelTime: formatDuration(travelTimeMs),
    performanceScore: score,
    performanceRating: rating,
    lastGPSUpdate,
    latitude,
    longitude,
    isOnline
  };
}

module.exports = {
  saveLocation,
  getActiveWorkers,
  getWorkerTrail,
  getNearestWorkers,
  getWorkerDailySummary,
};
