import app from './app';
import { createServer } from 'http';
import { config } from './config/config';
import { logger } from './utils/logger';
import { SocketManager } from './socket/socket.manager';
import { TickerService } from './services/service.ticker';

const httpServer = createServer(app);

// Initialize Socket Manager
new SocketManager(httpServer);

// Initialize Ticker (Default to Mock for now, or pass token if available)
// TickerService.init(); // Removed to prevent auto-mock data on startup 
// import { CronService } from './services/service.cron';
// CronService.start();  // Removed by User Request
 

httpServer.listen(config.PORT, () => {
    logger.info(`Server running on port ${config.PORT} in ${config.NODE_ENV} mode`);
});
