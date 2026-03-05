import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import { logger } from './utils/logger';
import authRoutes from './routes/route.auth';
import portfolioRoutes from './routes/route.portfolio';
import marketRoutes from './routes/route.market';
import kiteRoutes from './routes/route.kite';
import { authenticate } from './middleware/middleware.auth';
import { generateId } from './utils/id';
import watchlistRouter from './routes/route.watchlist';
import instrumentRoutes from './routes/route.instruments';
import strategyRoutes from './routes/strategy.routes';
import screenerRoutes from './routes/route.screener';

const app = express();

app.use(helmet());
app.use(cors());
app.use(express.json());

import { context } from './utils/context';

// Request Logging Middleware
app.use((req, res, next) => {
    // Ensure requestId exists (helmet or other middleware might add it, otherwise generate)
    const requestId = generateId();
    (req as any).requestId = requestId;

    // Extract access token from header (x-kite-token) or query (access_token)
    const accessToken = (req.headers['x-kite-token'] as string) || (req.query.access_token as string);

    context.run({ requestId, accessToken }, () => {
        logger.info({
            msg: 'Incoming Request',
            method: req.method,
            url: req.url
        });
        next();
    });
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/portfolio', authenticate, portfolioRoutes); // /api/portfolio/holdings
app.use('/api/watchlist', authenticate, watchlistRouter); // /api/watchlist
// app.use('/api/audit', authenticate, auditRoutes); // Audit Log to be removed/refactored
app.use('/api/market', authenticate, marketRoutes); // /api/market/quote
app.use('/api/kite', authenticate, kiteRoutes); // /api/kite/login
app.use('/api/instruments', authenticate, instrumentRoutes); // /api/instruments/sync/nfo
app.use('/api/instruments', authenticate, instrumentRoutes); // /api/instruments/sync/nfo
app.use('/api/strategies', authenticate, strategyRoutes);
app.use('/api/screener',   screenerRoutes);

// Error Handler
import { globalErrorHandler } from './middleware/middleware.error';

// Error Handler
app.use(globalErrorHandler);

export default app;
