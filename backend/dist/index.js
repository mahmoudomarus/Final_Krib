"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const morgan_1 = __importDefault(require("morgan"));
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const http_1 = require("http");
const socket_io_1 = require("socket.io");
const dotenv_1 = __importDefault(require("dotenv"));
const supabase_1 = require("./lib/supabase");
const logger_1 = require("./lib/logger");
const redis_1 = __importDefault(require("./lib/redis"));
const errorHandler_1 = require("./middleware/errorHandler");
const auth_1 = require("./middleware/auth");
const auth_2 = __importDefault(require("./routes/auth"));
const users_1 = __importDefault(require("./routes/users"));
const properties_1 = __importDefault(require("./routes/properties"));
const bookings_1 = __importDefault(require("./routes/bookings"));
const payments_1 = __importDefault(require("./routes/payments"));
const reviews_1 = __importDefault(require("./routes/reviews"));
const messages_1 = __importDefault(require("./routes/messages"));
const calendar_1 = __importDefault(require("./routes/calendar"));
const notifications_1 = __importDefault(require("./routes/notifications"));
const admin_1 = __importDefault(require("./routes/admin"));
const agent_1 = __importDefault(require("./routes/agent"));
const host_1 = __importDefault(require("./routes/host"));
const superAdmin_1 = __importDefault(require("./routes/superAdmin"));
const wishlist_1 = __importDefault(require("./routes/wishlist"));
const viewing_management_1 = __importDefault(require("./routes/viewing-management"));
const analytics_1 = __importDefault(require("./routes/analytics"));
const AnalyticsService_1 = require("./services/AnalyticsService");
const NotificationService_1 = require("./services/NotificationService");
const SocketService_1 = require("./services/SocketService");
dotenv_1.default.config();
const app = (0, express_1.default)();
const httpServer = (0, http_1.createServer)(app);
const io = new socket_io_1.Server(httpServer, {
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
app.set('trust proxy', 1);
const limiter = (0, express_rate_limit_1.default)({
    windowMs: 15 * 60 * 1000,
    max: 1000,
    message: 'Too many requests from this IP, please try again later.',
});
app.use((0, helmet_1.default)());
app.use((0, cors_1.default)({
    origin: [
        'http://localhost:3000',
        'http://localhost:3001',
        process.env.CLIENT_URL || 'http://localhost:3001'
    ],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'x-user-id'],
}));
app.use((0, morgan_1.default)('combined', { stream: { write: (message) => logger_1.logger.info(message.trim()) } }));
app.use(express_1.default.json({ limit: '10mb' }));
app.use(express_1.default.urlencoded({ extended: true, limit: '10mb' }));
app.use(limiter);
app.get('/health', (req, res) => {
    res.status(200).json({
        status: 'OK',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        environment: process.env.NODE_ENV,
    });
});
app.use('/api/auth', auth_2.default);
app.use('/api/users', auth_1.authMiddleware, users_1.default);
app.use('/api/properties', properties_1.default);
app.use('/api/bookings', bookings_1.default);
app.use('/api/payments', auth_1.authMiddleware, payments_1.default);
app.use('/api/reviews', reviews_1.default);
app.use('/api/messages', auth_1.authMiddleware, messages_1.default);
app.use('/api/calendar', auth_1.authMiddleware, calendar_1.default);
app.use('/api/notifications', auth_1.authMiddleware, notifications_1.default);
app.use('/api/admin', auth_1.authMiddleware, admin_1.default);
app.use('/api/agent', agent_1.default);
app.use('/api/host', host_1.default);
app.use('/api/super-admin', superAdmin_1.default);
app.use('/api/wishlist', auth_1.authMiddleware, wishlist_1.default);
app.use('/api/viewing-management', viewing_management_1.default);
app.use('/api/analytics', auth_1.authMiddleware, analytics_1.default);
const analyticsService = new AnalyticsService_1.AnalyticsService();
const notificationService = new NotificationService_1.NotificationService();
const socketService = new SocketService_1.SocketService(io);
io.on('connection', (socket) => {
    logger_1.logger.info(`Socket connected: ${socket.id}`);
    socketService.handleConnection(socket);
});
app.use(errorHandler_1.errorHandler);
async function startServer() {
    try {
        const isConnected = await (0, supabase_1.testSupabaseConnection)();
        if (!isConnected) {
            throw new Error('Failed to connect to Supabase database');
        }
        logger_1.logger.info('Connected to Supabase database');
        await redis_1.default.ping();
        logger_1.logger.info('Connected to Redis');
        httpServer.listen(PORT, () => {
            logger_1.logger.info(`Server running on port ${PORT}`);
            logger_1.logger.info(`Environment: ${process.env.NODE_ENV}`);
            logger_1.logger.info('All services initialized successfully');
        });
        process.on('SIGTERM', gracefulShutdown);
        process.on('SIGINT', gracefulShutdown);
    }
    catch (error) {
        logger_1.logger.error('Failed to start server:', error);
        process.exit(1);
    }
}
async function gracefulShutdown() {
    logger_1.logger.info('Shutting down gracefully...');
    try {
        await redis_1.default.quit();
        httpServer.close(() => {
            logger_1.logger.info('Server closed');
            process.exit(0);
        });
    }
    catch (error) {
        logger_1.logger.error('Error during shutdown:', error);
        process.exit(1);
    }
}
startServer();
//# sourceMappingURL=index.js.map