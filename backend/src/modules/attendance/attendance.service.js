const AttendanceRecord = require('./attendance.model');
const Shift = require('./shifts.model');
const User = require('../auth/auth.model');
const Notification = require('../notifications/notifications.model');
const Geofence = require('../tracking/geofence.model');
const turf = require('@turf/turf');
const CustomerVisit = require('../tracking/customerVisit.model');

const { getStartOfDay, getEndOfDay } = require('../../core/utils/date.util');

// Helper to parse "HH:mm" into minutes from midnight
function timeToMinutes(timeStr) {
  const [hours, minutes] = timeStr.split(':').map(Number);
  return hours * 60 + minutes;
}

async function checkIn(workerId, payload) {
  const now = new Date();
  const date = getStartOfDay(now);

  // Check if already checked in today
  const existingRecord = await AttendanceRecord.findOne({ workerId, date });
  if (existingRecord) {
    throw { statusCode: 400, message: 'Worker already checked in for today.' };
  }

  // Get Worker and Shift
  const worker = await User.findById(workerId);
  if (!worker) throw { statusCode: 404, message: 'Worker not found.' };

  let status = 'present';
  
  // Validate Geofence for manual check-in
  if (payload.method === 'manual' && payload.location) {
    const point = turf.point([payload.location.longitude, payload.location.latitude]);
    const officeGeofences = await Geofence.find({ isActive: true, category: 'office' });
    let inOffice = false;
    
    for (const geofence of officeGeofences) {
      if (geofence.type === 'polygon' && geofence.boundary?.coordinates) {
        try {
          const polygon = turf.polygon(geofence.boundary.coordinates);
          if (turf.booleanPointInPolygon(point, polygon)) {
            inOffice = true;
            break;
          }
        } catch (e) {}
      } else if (geofence.type === 'circle' && geofence.center?.coordinates && geofence.radius) {
        try {
          const center = turf.point(geofence.center.coordinates);
          const distance = turf.distance(center, point, { units: 'meters' });
          if (distance <= geofence.radius) {
            inOffice = true;
            break;
          }
        } catch (e) {}
      }
    }
    
    if (!inOffice && officeGeofences.length > 0) {
      status = 'manual_override';
      
      // Notify Manager of manual override outside office
      global.io?.to('manager').emit('attendance:override', { workerId, workerName: worker.name });
      await Notification.create({
        userId: workerId,
        type: 'attendance_override',
        message: `${worker.name} performed a manual check-in outside an office zone.`,
      });
    }
  }

  if (worker.shiftId && status !== 'manual_override') {
    const shift = await Shift.findById(worker.shiftId);
    if (shift && shift.isActive) {
      // Calculate late detection
      const currentMinutes = now.getHours() * 60 + now.getMinutes();
      const shiftStartMinutes = timeToMinutes(shift.startTime);
      
      if (currentMinutes > shiftStartMinutes + shift.gracePeriodMinutes) {
        status = 'late';
      }
    }
  }

  const record = new AttendanceRecord({
    workerId,
    date,
    shiftId: worker.shiftId ? worker.shiftId : null,
    checkIn: {
      time: now,
      method: payload.method,
      location: payload.location ? {
        type: 'Point',
        coordinates: [payload.location.longitude, payload.location.latitude]
      } : undefined,
    },
    status,
  });

  await record.save();

  // Socket event
  global.io?.to('admin').emit('attendance:checked-in', {
    workerId,
    workerName: worker.name,
    time: now,
    status,
  });

  // Notification for late arrival
  if (status === 'late') {
    global.io?.to('manager').emit('attendance:late', { workerId, workerName: worker.name });
    
    // Create admin notification
    await Notification.create({
      userId: workerId,
      type: 'attendance_late',
      message: `${worker.name} checked in late.`,
    });
  }

  return record;
}

async function checkOut(workerId, payload) {
  const now = new Date();
  const date = getStartOfDay(now);

  const record = await AttendanceRecord.findOne({ workerId, date });
  if (!record) {
    throw { statusCode: 400, message: 'No active check-in found for today.' };
  }

  if (record.checkOut && record.checkOut.time) {
    throw { statusCode: 400, message: 'Already checked out for today.' };
  }

  const checkInTime = record.checkIn.time;
  const diffMs = now.getTime() - checkInTime.getTime();
  const totalHours = diffMs / (1000 * 60 * 60);

  // Overtime calculation
  let overtime = 0;
  if (record.shiftId) {
    const shift = await Shift.findById(record.shiftId);
    if (shift && shift.isActive) {
      const shiftStart = timeToMinutes(shift.startTime);
      const shiftEnd = timeToMinutes(shift.endTime);
      let shiftDurationHours = (shiftEnd - shiftStart) / 60;
      if (shiftDurationHours < 0) shiftDurationHours += 24; // Cross-midnight shift
      
      if (totalHours > shiftDurationHours) {
        overtime = totalHours - shiftDurationHours;
      }
    }
  } else if (totalHours > 8) {
    // Default 8 hour day if no shift
    overtime = totalHours - 8;
  }

  record.checkOut = {
    time: now,
    method: payload.method,
    location: payload.location ? {
      type: 'Point',
      coordinates: [payload.location.longitude, payload.location.latitude]
    } : undefined,
  };
  record.totalHours = parseFloat(totalHours.toFixed(2));
  record.overtime = parseFloat(overtime.toFixed(2));

  await record.save();

  // Checkout cleanup: Close any active CustomerVisits for this worker
  try {
    const activeVisits = await CustomerVisit.find({ workerId, departureTime: null });
    for (const visit of activeVisits) {
      visit.departureTime = now;
      visit.durationMs = Math.max(0, now.getTime() - visit.arrivalTime.getTime());
      await visit.save();
      console.log(`[DEBUG] Checkout Cleanup: Closed CustomerVisit ${visit._id} for worker ${workerId}`);
    }
  } catch (err) {
    console.error(`[ERROR] Failed to cleanup CustomerVisits during checkout for worker ${workerId}:`, err.message || err);
  }

  const worker = await User.findById(workerId).select('name');

  global.io?.to('admin').emit('attendance:checked-out', {
    workerId,
    workerName: worker?.name,
    time: now,
    totalHours: record.totalHours,
  });

  return record;
}

async function getMyAttendance(workerId) {
  return AttendanceRecord.find({ workerId }).sort({ date: -1 });
}

async function getAllAttendance(filters) {
  const query = {};
  if (filters.date) {
    const start = getStartOfDay(filters.date);
    const end = getEndOfDay(filters.date);
    query.date = { $gte: start, $lte: end };
  }
  if (filters.status) {
    query.status = filters.status;
  }
  return AttendanceRecord.find(query).populate({
    path: 'workerId',
    select: 'name email',
  }).populate({
    path: 'shiftId',
    select: 'name'
  }).sort({ date: -1 });
}

async function updateAttendance(id, payload) {
  const record = await AttendanceRecord.findById(id);
  if (!record) throw { statusCode: 404, message: 'Attendance record not found.' };

  if (payload.checkInTime) {
    record.checkIn.time = payload.checkInTime;
  }
  if (payload.checkOutTime) {
    if (!record.checkOut) record.checkOut = {};
    record.checkOut.time = payload.checkOutTime;
  }
  if (payload.status) record.status = payload.status;
  if (payload.totalHours !== undefined) record.totalHours = payload.totalHours;

  await record.save();
  return record;
}

// Shift Management
async function createShift(payload) {
  const shift = await Shift.create(payload);
  
  if (shift.workers && shift.workers.length > 0) {
    await User.updateMany(
      { _id: { $in: shift.workers } },
      { $set: { shiftId: shift._id } }
    );
  }
  
  return shift;
}

async function getShifts() {
  return Shift.find().populate('workers', 'name email');
}

async function updateShift(id, payload) {
  const oldShift = await Shift.findById(id);
  if (!oldShift) throw { statusCode: 404, message: 'Shift not found.' };

  const shift = await Shift.findByIdAndUpdate(id, payload, { new: true });
  
  // Sync workers: remove shiftId from workers no longer in this shift, and add to new workers
  const oldWorkers = oldShift.workers ? oldShift.workers.map(w => w.toString()) : [];
  const newWorkers = shift.workers ? shift.workers.map(w => w.toString()) : [];

  const removedWorkers = oldWorkers.filter(w => !newWorkers.includes(w));
  const addedWorkers = newWorkers.filter(w => !oldWorkers.includes(w));

  if (removedWorkers.length > 0) {
    await User.updateMany(
      { _id: { $in: removedWorkers } },
      { $set: { shiftId: null } }
    );
  }

  if (addedWorkers.length > 0) {
    await User.updateMany(
      { _id: { $in: addedWorkers } },
      { $set: { shiftId: shift._id } }
    );
  }

  return shift;
}

async function deleteShift(id) {
  const shift = await Shift.findByIdAndDelete(id);
  if (!shift) throw { statusCode: 404, message: 'Shift not found.' };
  
  // Remove shiftId from all assigned workers
  if (shift.workers && shift.workers.length > 0) {
    await User.updateMany(
      { _id: { $in: shift.workers } },
      { $set: { shiftId: null } }
    );
  }
  
  return shift;
}

module.exports = {
  checkIn,
  checkOut,
  getMyAttendance,
  getAllAttendance,
  updateAttendance,
  createShift,
  getShifts,
  updateShift,
  deleteShift,
};
