import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import { createServer } from 'http';
import { Server } from 'socket.io';
import dotenv from 'dotenv';

import { testSupabaseConnection } from './lib/supabase';
import { logger } from './lib/logger';
import redis from './lib/redis';
import { errorHandler } from './middleware/errorHandler';
import { authMiddleware } from './middleware/auth';

// Routes
import authRoutes from './routes/auth';
import userRoutes from './routes/users';
import propertyRoutes from './routes/properties';
import bookingRoutes from './routes/bookings';
import paymentRoutes from './routes/payments';
import reviewRoutes from './routes/reviews';
import messagesRoutes from './routes/messages';
import calendarRoutes from './routes/calendar';
import notificationRoutes from './routes/notifications';
import adminRoutes from './routes/admin';
import agentRoutes from './routes/agent';
import hostRoutes from './routes/host';
import superAdminRouter from './routes/superAdmin';
import wishlistRoutes from './routes/wishlist';
import viewingManagementRoutes from './routes/viewing-management';
import analyticsRoutes from './routes/analytics';

// Services
import { AnalyticsService } from './services/AnalyticsService';
import { NotificationService } from './services/NotificationService';
import { SocketService } from './services/SocketService';

// Load environment variables
dotenv.config();

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: [
      'http://localhost:3000',
      'http://localhost:3001',
      process.env.CLIENT_URL || 'http://localhost:3001'
    ],
    credentials: true,
    methods: ['GET', 'POST'],
  },
});

const PORT = process.env.PORT || 5001;

// Trust proxy for rate limiting (fixes X-Forwarded-For header warning)
app.set('trust proxy', 1);

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000, // Increased limit for development - was 100
  message: 'Too many requests from this IP, please try again later.',
});

// Middleware
app.use(helmet());
app.use(cors({
  origin: [
    'http://localhost:3000',
    'http://localhost:3001', 
    process.env.CLIENT_URL || 'http://localhost:3001'
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-user-id'],
}));
app.use(morgan('combined', { stream: { write: (message) => logger.info(message.trim()) } }));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(limiter);

// Health check
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV,
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', authMiddleware, userRoutes);
app.use('/api/properties', propertyRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/payments', authMiddleware, paymentRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/messages', authMiddleware, messagesRoutes);
app.use('/api/calendar', authMiddleware, calendarRoutes);
app.use('/api/notifications', authMiddleware, notificationRoutes);
app.use('/api/admin', authMiddleware, adminRoutes);
app.use('/api/agent', agentRoutes);
app.use('/api/host', hostRoutes);
app.use('/api/super-admin', superAdminRouter);
app.use('/api/wishlist', authMiddleware, wishlistRoutes);
app.use('/api/viewing-management', viewingManagementRoutes);
app.use('/api/analytics', authMiddleware, analyticsRoutes);

// Initialize services
const analyticsService = new AnalyticsService();
const notificationService = new NotificationService();
const socketService = new SocketService(io);

// Socket.IO connection handling
io.on('connection', (socket) => {
  logger.info(`Socket connected: ${socket.id}`);
  socketService.handleConnection(socket);
});

// Error handling
app.use(errorHandler);

// Start server
async function startServer() {
  try {
    // Test Supabase connection
    const isConnected = await testSupabaseConnection();
    if (!isConnected) {
      throw new Error('Failed to connect to Supabase database');
    }
    logger.info('Connected to Supabase database');

    // Test Redis connection (optional - not critical for functionality)
    try {
    await redis.ping();
    logger.info('Connected to Redis');
    } catch (redisError) {
      logger.warn('Redis connection failed - running without Redis cache', redisError);
      // Continue without Redis - it's not critical for basic functionality
    }

    // Start HTTP server
    httpServer.listen(PORT, () => {
      logger.info(`Server running on port ${PORT}`);
      logger.info(`Environment: ${process.env.NODE_ENV}`);
      logger.info('All services initialized successfully');
    });

    // Graceful shutdown
    process.on('SIGTERM', gracefulShutdown);
    process.on('SIGINT', gracefulShutdown);

  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
}

async function gracefulShutdown() {
  logger.info('Shutting down gracefully...');
  
  try {
    // Supabase connections are handled automatically
    try {
    await redis.quit();
      logger.info('Redis connection closed');
    } catch (error) {
      // Redis might not be connected, that's okay
      logger.debug('Redis quit error (non-critical):', error);
    }
    
    httpServer.close(() => {
      logger.info('Server closed');
      process.exit(0);
    });
  } catch (error) {
    logger.error('Error during shutdown:', error);
    process.exit(1);
  }
}

startServer(); 