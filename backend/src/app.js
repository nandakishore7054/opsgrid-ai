const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const cookieParser = require('cookie-parser');
const morgan = require('morgan');
const authRoutes = require('./modules/auth/auth.routes');
const usersRoutes = require('./modules/users/users.routes');
const tasksRoutes = require('./modules/tasks/tasks.routes');
const submissionsRoutes = require('./modules/submissions/submissions.routes');
const notificationsRoutes = require('./modules/notifications/notifications.routes');
const analyticsRoutes = require('./modules/analytics/analytics.routes');
const dashboardRoutes = require('./modules/dashboard/dashboard.routes');
const availabilityRoutes = require('./modules/availability/availability.routes');
const aiRoutes = require('./modules/ai/ai.routes');
const errorMiddleware = require('./core/middlewares/error.middleware');
const ApiError = require('./core/utils/apiError');
const { environment } = require('./config/environment');

const app = express();

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

app.use(
  cors({
    origin: (origin, callback) => {
      if (isAllowedOrigin(origin)) {
        callback(null, true);
      } else {
        callback(new Error(`Origin ${origin} not allowed by CORS`));
      }
    },
    credentials: true,
  })
);
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(morgan('dev'));

app.get('/api/health', (_request, response) => {
  response.status(200).json({
    status: 'success',
    data: {
      message: 'Backend is healthy.',
    },
  });
});

const { attendanceRouter, shiftsRouter } = require('./modules/attendance/attendance.routes');
const trackingRouter = require('./modules/tracking/tracking.routes');
const geofenceRouter = require('./modules/tracking/geofence.routes');

app.use('/api/auth', authRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/tasks', tasksRoutes);
app.use('/api/notifications', notificationsRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/attendance', attendanceRouter);
app.use('/api/shifts', shiftsRouter);
app.use('/api/tracking', trackingRouter);
app.use('/api/geofences', geofenceRouter);
app.use('/api/ai', aiRoutes);
app.use('/api', availabilityRoutes);
app.use('/api', submissionsRoutes);

app.use((_request, _response, next) => {
  next(new ApiError(404, 'The requested resource was not found.'));
});

app.use(errorMiddleware);

module.exports = app;