const http = require('http');
const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');
const app = require('./app');
const { environment, validateEnvironment } = require('./config/environment');
const { connectDatabase } = require('./config/db');

async function startServer() {
  validateEnvironment();
  await connectDatabase(environment.mongoUri);

  // One-time migration: backfill category on existing geofences that predate the field
  try {
    const Geofence = require('./modules/tracking/geofence.model');
    const result = await Geofence.updateMany(
      { category: { $exists: false } },
      { $set: { category: 'general' } }
    );
    if (result.modifiedCount > 0) {
      console.log(`[MIGRATION] Backfilled category='general' on ${result.modifiedCount} geofence(s).`);
    }
  } catch (err) {
    console.error('[MIGRATION] Failed to backfill geofence categories:', err.message);
  }

  const server = http.createServer(app);

  const isAllowedOrigin = (origin) => {
    if (!origin) return true;
    const cleanOrigin = origin.replace(/\/+$/, '');
    const allowed = environment.clientOrigins || [environment.clientOrigin];
    if (allowed.includes('*') || allowed.includes(cleanOrigin)) {
      return true;
    }
    if (environment.nodeEnv === 'development' && /^http:\/\/localhost(:\d+)?$/.test(cleanOrigin)) {
      return true;
    }
    return false;
  };

  const io = new Server(server, {
    cors: {
      origin: (origin, callback) => {
        if (isAllowedOrigin(origin)) {
          callback(null, true);
        } else {
          callback(new Error('Origin not allowed by Socket.IO CORS: ' + origin));
        }
      },
      credentials: true,
    },
  });

  // --- Socket.IO JWT Authentication Middleware ---
  const User = require('./modules/auth/auth.model');

  io.use(async (socket, next) => {
    const token = socket.handshake.auth?.token;

    if (!token) {
      return next(new Error('Authentication required. No token provided.'));
    }

    try {
      const decoded = jwt.verify(token, environment.accessTokenSecret);
      const user = await User.findById(decoded.sub).select('name email role status');

      if (!user) {
        return next(new Error('Authentication failed. User not found.'));
      }

      if (user.status !== 'active') {
        return next(new Error('Authentication failed. Account is not active.'));
      }

      // Attach verified user identity to the socket
      socket.user = {
        _id: user._id.toString(),
        name: user.name,
        email: user.email,
        role: user.role,
      };

      return next();
    } catch (err) {
      return next(new Error('Authentication failed. Invalid or expired token.'));
    }
  });

  // --- Connection handler: auto-join rooms based on verified identity ---
  io.on('connection', (socket) => {
    // Always join the user's personal room (for targeted notifications)
    socket.join(socket.user._id);

    // Join the 'admin' room only if the verified role allows it
    if (socket.user.role === 'admin' || socket.user.role === 'dispatcher') {
      socket.join('admin');
    }
  });

  const { setupTrackingSockets } = require('./modules/tracking/tracking.socket');
  setupTrackingSockets(io);

  global.io = io;

  server.listen(environment.port, () => {
    console.log(`Backend listening on port ${environment.port}`);
  });
}

startServer().catch((error) => {
  console.error('Failed to start backend server:', error);
  process.exit(1);
});