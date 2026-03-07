import app from './app';
import { createServer } from 'http';
import { config } from './config/config';
import { logger } from './utils/logger';
import { prisma } from './lib/prisma';

const httpServer = createServer(app);

// Graceful shutdown
const shutdown = async (signal: string) => {
    logger.info(`${signal} received — shutting down gracefully`);

    httpServer.close(async () => {
        logger.info('HTTP server closed');
        await prisma.$disconnect();
        logger.info('Database connection closed');
        process.exit(0);
    });

    // Force exit after 10 seconds if pending connections don't drain
    setTimeout(() => {
        logger.error('Forced exit after timeout');
        process.exit(1);
    }, 10_000);
};

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT',  () => shutdown('SIGINT'));

httpServer.listen(config.PORT, () => {
    logger.info(`Server running on port ${config.PORT} in ${config.NODE_ENV} mode`);
});
