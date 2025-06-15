"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const ioredis_1 = __importDefault(require("ioredis"));
let hasLoggedConnectionError = false;
const redis = new ioredis_1.default(process.env.REDIS_URL || 'redis://localhost:6379', {
    maxRetriesPerRequest: 3,
    enableReadyCheck: false,
    lazyConnect: true,
    retryStrategy: (times) => {
        if (times > 3) {
            return null;
        }
        return Math.min(times * 100, 400);
    },
    reconnectOnError: (err) => {
        const targetErrors = ['READONLY', 'ECONNRESET'];
        if (err && typeof err === 'object' && 'code' in err && targetErrors.includes(err.code)) {
            return true;
        }
        return false;
    },
});
redis.on('error', (err) => {
    if (!hasLoggedConnectionError) {
        console.error('Redis connection error:', err.message);
        hasLoggedConnectionError = true;
        console.log('Redis is not available - running without caching functionality');
    }
});
redis.on('connect', () => {
    console.log('Connected to Redis');
    hasLoggedConnectionError = false;
});
exports.default = redis;
//# sourceMappingURL=redis.js.map