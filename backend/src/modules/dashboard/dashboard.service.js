const User = require('../auth/auth.model');
const AttendanceRecord = require('../attendance/attendance.model');
const CustomerVisit = require('../tracking/customerVisit.model');
const Geofence = require('../tracking/geofence.model');
const WorkerLocation = require('../tracking/location.model');
const trackingService = require('../tracking/tracking.service');
const { calculateTotalDistance } = require('../../core/utils/distance.util');
const { getStartOfDay, getEndOfDay, formatLocalYYYYMMDD } = require('../../core/utils/date.util');

// Add lightweight cache
let cache = {
  data: null,
  timestamp: 0
};
let chartsCache = {
  data: null,
  timestamp: 0
};
const CACHE_TTL = 30 * 1000; // 30 seconds

function invalidateDashboardCache() {
  cache.data = null;
  cache.timestamp = 0;
  chartsCache.data = null;
  chartsCache.timestamp = 0;
}
async function getWorkerKPIs() {
  const totalWorkers = await User.countDocuments({ role: 'worker' });
  const activeWorkersArray = await trackingService.getActiveWorkers();
  const activeWorkers = activeWorkersArray.length;
  const offlineWorkers = Math.max(0, totalWorkers - activeWorkers);

  return { activeWorkers, offlineWorkers, totalWorkers };
}

async function getAttendanceKPIs(start, end) {
  const attendances = await AttendanceRecord.find({ date: { $gte: start, $lte: end } });
  
  const presentToday = attendances.length;
  const completedShifts = attendances.filter(a => a.checkOut).length;

  let totalWorkingMs = 0;

  for (const a of attendances) {
    if (a.checkIn) {
      const startT = new Date(a.checkIn.time);
      const endT = a.checkOut ? new Date(a.checkOut.time) : new Date();
      totalWorkingMs += Math.max(0, endT - startT);
    }
  }

  const averageWorkingMs = presentToday > 0 ? totalWorkingMs / presentToday : 0;
  
  const formatDuration = (ms) => {
    if (ms === 0) return null;
    const h = Math.floor(ms / (1000 * 60 * 60));
    const m = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60));
    return `${h}h ${m}m`;
  };

  return {
    presentToday,
    completedShifts,
    averageWorkingHours: formatDuration(averageWorkingMs)
  };
}

async function getVisitKPIs(start, end) {
  const visits = await CustomerVisit.find({ arrivalTime: { $gte: start, $lte: end } });
  
  const customerVisitsToday = visits.length;
  let totalVisitMs = 0;

  for (const v of visits) {
    const endT = v.departureTime || new Date();
    totalVisitMs += Math.max(0, new Date(endT) - new Date(v.arrivalTime));
  }

  const averageVisitMs = customerVisitsToday > 0 ? totalVisitMs / customerVisitsToday : 0;

  const formatDuration = (ms) => {
    if (ms === 0) return null;
    const h = Math.floor(ms / (1000 * 60 * 60));
    const m = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60));
    return h > 0 ? `${h}h ${m}m` : `${m}m`;
  };

  return {
    customerVisitsToday,
    averageVisitDuration: formatDuration(averageVisitMs)
  };
}

async function getDistanceKPIs(start, end) {
  // Fetch all locations for today
  const locations = await WorkerLocation.find({ timestamp: { $gte: start, $lte: end } }).sort({ timestamp: 1 });
  
  // Group by workerId
  const byWorker = {};
  for (const loc of locations) {
    const wId = loc.workerId.toString();
    if (!byWorker[wId]) byWorker[wId] = [];
    byWorker[wId].push(loc);
  }

  let totalDistanceToday = 0;
  console.log(`\n--- Dashboard KPIs: getDistanceKPIs START ---`);
  for (const wId in byWorker) {
    const workerLocs = byWorker[wId];
    const dist = calculateTotalDistance(workerLocs);
    console.log(`Worker ID: ${wId} | Fetched records: ${workerLocs.length} | Passed to util: ${workerLocs.length} | Final distance: ${dist.toFixed(3)} km`);
    totalDistanceToday += dist;
  }
  console.log(`--- Dashboard KPIs END | Total Distance KPI: ${totalDistanceToday.toFixed(3)} km ---\n`);

  return {
    totalDistanceToday: totalDistanceToday > 0 ? `${totalDistanceToday.toFixed(2)} km` : null
  };
}

async function getDashboardAnalytics() {
  const now = Date.now();
  if (cache.data && (now - cache.timestamp < CACHE_TTL)) {
    return cache.data;
  }

  const start = getStartOfDay();
  const end = getEndOfDay();

  const [workerKPIs, attendanceKPIs, visitKPIs, distanceKPIs] = await Promise.all([
    getWorkerKPIs(),
    getAttendanceKPIs(start, end),
    getVisitKPIs(start, end),
    getDistanceKPIs(start, end)
  ]);

  const result = {
    workforce: workerKPIs,
    attendance: attendanceKPIs,
    customer: visitKPIs,
    productivity: distanceKPIs
  };

  cache = {
    data: result,
    timestamp: now
  };

  return result;
}

  getDistanceKPIs
;

// --- CHARTS LOGIC ---

async function getChartCustomerVisits(startDate, endDate) {
  const visits = await CustomerVisit.find({ arrivalTime: { $gte: startDate, $lte: endDate } });
  
  const days = {};
  for(let i=0; i<7; i++) {
    const d = new Date(startDate);
    d.setDate(d.getDate() + i);
    days[formatLocalYYYYMMDD(d)] = 0;
  }
  
  for(const v of visits) {
    const dStr = formatLocalYYYYMMDD(v.arrivalTime);
    if(days[dStr] !== undefined) {
      days[dStr]++;
    }
  }
  
  return Object.keys(days).sort().map(date => ({
    date,
    visits: days[date]
  }));
}

async function getChartDistanceTrend(startDate, endDate) {
  const locations = await WorkerLocation.find({ timestamp: { $gte: startDate, $lte: endDate } }).sort({ timestamp: 1 });
  
  const days = {};
  for(let i=0; i<7; i++) {
    const d = new Date(startDate);
    d.setDate(d.getDate() + i);
    days[formatLocalYYYYMMDD(d)] = {};
  }
  
  for(const loc of locations) {
    const dStr = formatLocalYYYYMMDD(loc.timestamp);
    if(days[dStr]) {
      const wId = loc.workerId.toString();
      if(!days[dStr][wId]) days[dStr][wId] = [];
      days[dStr][wId].push(loc);
    }
  }
  
  const result = [];
  for(const date in days) {
    let totalDist = 0;
    for(const wId in days[date]) {
      totalDist += calculateTotalDistance(days[date][wId]);
    }
    result.push({
      date,
      distance: Number(totalDist.toFixed(2))
    });
  }
  
  return result.sort((a, b) => a.date.localeCompare(b.date));
}

async function getChartAttendance(todayStart, todayEnd) {
  const [totalWorkers, attendances] = await Promise.all([
    User.countDocuments({ role: 'worker' }),
    AttendanceRecord.find({ date: { $gte: todayStart, $lte: todayEnd } })
  ]);
  
  let onTime = 0;
  let late = 0;
  
  for(const a of attendances) {
    if (a.status === 'late') late++;
    else onTime++;
  }
  
  const absent = Math.max(0, totalWorkers - (onTime + late));
  
  return [
    { name: 'On Time', value: onTime, fill: '#3b82f6' },      // blue-500
    { name: 'Late', value: late, fill: '#f59e0b' },           // amber-500
    { name: 'Absent', value: absent, fill: '#ef4444' }         // red-500
  ];
}

async function getChartWorkerDistance(todayStart, todayEnd) {
  const [locations, users] = await Promise.all([
    WorkerLocation.find({ timestamp: { $gte: todayStart, $lte: todayEnd } }).sort({ timestamp: 1 }),
    User.find({ role: 'worker' }).select('_id name')
  ]);
  
  const userMap = {};
  users.forEach(u => userMap[u._id.toString()] = u.name);

  const byWorker = {};
  for (const loc of locations) {
    const wId = loc.workerId.toString();
    if (!byWorker[wId]) byWorker[wId] = [];
    byWorker[wId].push(loc);
  }

  const result = [];
  for (const wId in byWorker) {
    const dist = calculateTotalDistance(byWorker[wId]);
    if(dist > 0) {
      result.push({
        workerName: userMap[wId] || 'Unknown Worker',
        distance: Number(dist.toFixed(2))
      });
    }
  }

  return result.sort((a, b) => b.distance - a.distance).slice(0, 5);
}

async function getDashboardCharts() {
  const now = Date.now();
  if (chartsCache.data && (now - chartsCache.timestamp < CACHE_TTL)) {
    return chartsCache.data;
  }

  const todayEnd = getEndOfDay();
  const todayStart = getStartOfDay();
  
  const sevenDaysAgo = new Date(todayStart);
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);

  const [customerVisitsPerDay, distanceTrend, attendanceDistribution, workerDistanceTravelled] = await Promise.all([
    getChartCustomerVisits(sevenDaysAgo, todayEnd),
    getChartDistanceTrend(sevenDaysAgo, todayEnd),
    getChartAttendance(todayStart, todayEnd),
    getChartWorkerDistance(todayStart, todayEnd)
  ]);

  const result = {
    customerVisitsPerDay,
    attendanceDistribution,
    workerDistanceTravelled,
    distanceTrend
  };

  console.log(`\n--- Dashboard Charts Log ---`);
  console.log(`Top 5 Worker Distance values:`, JSON.stringify(workerDistanceTravelled, null, 2));
  console.log(`Distance Trend values:`, JSON.stringify(distanceTrend, null, 2));
  console.log(`----------------------------\n`);

  chartsCache = {
    data: result,
    timestamp: now
  };

  return result;
}

module.exports = {
  getDashboardAnalytics,
  getDashboardCharts,
  getWorkerKPIs,
  getAttendanceKPIs,
  getVisitKPIs,
  getDistanceKPIs,
  invalidateDashboardCache
};
