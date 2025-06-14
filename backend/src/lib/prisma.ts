import { PrismaClient } from '@prisma/client';
import { logger } from './logger';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma = globalForPrisma.prisma ?? new PrismaClient({
  log: [
    {
      emit: 'event',
      level: 'query',
    },
    {
      emit: 'event',
      level: 'error',
    },
    {
      emit: 'event',
      level: 'info',
    },
    {
      emit: 'event',
      level: 'warn',
    },
  ],
});

// Event listeners for logging (commented out due to TypeScript issues)
// prisma.$on('query', (e) => {
//   logger.debug('Query: ' + e.query);
//   logger.debug('Duration: ' + e.duration + 'ms');
// });

// prisma.$on('error', (e) => {
//   logger.error('Prisma error:', e);
// });

// prisma.$on('info', (e) => {
//   logger.info('Prisma info:', e.message);
// });

// prisma.$on('warn', (e) => {
//   logger.warn('Prisma warning:', e.message);
// });

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma; 