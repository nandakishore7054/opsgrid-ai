const trackingService = require('./tracking.service');
const { parseLocation } = require('./tracking.validation');
const geofenceService = require('./geofence.service');
const { isValidGPSUpdate } = require('../../core/utils/distance.util');
const User = require('../auth/auth.model');

// Throttling map: workerId -> last timestamp
const lastUpdateMap = new Map();

function setupTrackingSockets(io) {
  io.on('connection', (socket) => {
    socket.on('worker:location-update', async (data) => {
      // Enforce: only workers can send GPS updates
      if (!socket.user || socket.user.role !== 'worker') {
        return; // Silently drop non-worker GPS updates
      }

      // Use the authenticated user's ID — never trust the client payload
      const workerIdStr = socket.user._id;

      if (!data) return;
      
      const { workerId: _untrusted, ...locationData } = data;
      
      const now = Date.now();
      const lastUpdate = lastUpdateMap.get(workerIdStr) || 0;
      
      // Throttle: 1 update per 5 seconds (5000ms)
      if (now - lastUpdate < 5000) {
        return; // Silently drop throttled update
      }
      
      // Update the throttle timestamp immediately to prevent race conditions from rapid concurrent requests
      lastUpdateMap.set(workerIdStr, now);
      
      try {
        const parsed = parseLocation(locationData);
        if (!parsed.success) {
          console.error('Socket location validation failed:', parsed.error);
          return;
        }
        
        const user = await User.findById(workerIdStr);
        if (!user) return;

        const incomingTimestamp = parsed.data.timestamp || new Date();
        const incomingLat = parsed.data.latitude;
        const incomingLng = parsed.data.longitude;

        const newPoint = {
          location: { coordinates: [incomingLng, incomingLat] },
          timestamp: incomingTimestamp
        };

        let lastValidPoint = null;
        if (user.currentLocation && user.currentLocation.coordinates && user.currentLocation.coordinates.length === 2) {
          lastValidPoint = {
            location: user.currentLocation,
            timestamp: user.lastPing
          };
        }

        const validation = isValidGPSUpdate(lastValidPoint, newPoint, 'socket');

        const updatePayload = {
          lastPing: new Date(),
          batteryLevel: parsed.data.batteryLevel !== undefined ? parsed.data.batteryLevel : user.batteryLevel,
          accuracy: parsed.data.accuracy !== undefined ? parsed.data.accuracy : user.accuracy
        };

        if (validation.isValid) {
          // Case 1: Valid Movement
          updatePayload.currentLocation = {
            type: 'Point',
            coordinates: [incomingLng, incomingLat]
          };
          await User.updateOne({ _id: workerIdStr }, { $set: updatePayload });

          const record = await trackingService.saveLocation(workerIdStr, parsed.data);
          
          io.to('admin').emit('location:updated', {
            workerId: workerIdStr,
            workerName: socket.user.name,
            latitude: incomingLat,
            longitude: incomingLng,
            timestamp: record.timestamp,
          });

          geofenceService.checkGeofenceTransitions(workerIdStr, parsed.data).catch(err => {
            console.error('[TRACE: ERROR] Geofence check error:', err);
          });
        } else if (validation.reason === 'stationary') {
          // Case 2: Stationary (<5m)
          await User.updateOne({ _id: workerIdStr }, { $set: updatePayload });

          if (user.currentLocation && user.currentLocation.coordinates) {
            io.to('admin').emit('location:updated', {
              workerId: workerIdStr,
              workerName: socket.user.name,
              latitude: user.currentLocation.coordinates[1],
              longitude: user.currentLocation.coordinates[0],
              timestamp: updatePayload.lastPing,
            });
          }
        } else {
          // Case 3: Impossible Jump
          await User.updateOne({ _id: workerIdStr }, { $set: updatePayload });

          if (user.currentLocation && user.currentLocation.coordinates) {
            io.to('admin').emit('location:updated', {
              workerId: workerIdStr,
              workerName: socket.user.name,
              latitude: user.currentLocation.coordinates[1],
              longitude: user.currentLocation.coordinates[0],
              timestamp: updatePayload.lastPing,
            });
          }
        }
      } catch (err) {
        console.error('Socket tracking error:', err.message);
      }
    });
  });
}

module.exports = { setupTrackingSockets };

