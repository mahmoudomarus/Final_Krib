import Redis from 'ioredis';

let hasLoggedConnectionError = false;

const redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379', {
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
    if (err && typeof err === 'object' && 'code' in err && targetErrors.includes((err as any).code)) {
      return true;
    }
    return false;
  },
});

redis.on('error', (err: any) => {
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

export default redis; 