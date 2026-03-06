import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
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
import { config } from './config/config';

const app = express();

app.use(helmet());
app.use(cors({
    origin: config.ALLOWED_ORIGIN,
    credentials: true,
}));
app.use(express.json());

import { context } from './utils/context';

// Request Logging Middleware
app.use((req, res, next) => {
    const requestId = generateId();
    (req as any).requestId = requestId;

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

// Rate limiter for auth endpoints — 20 requests per minute per IP
const authLimiter = rateLimit({
    windowMs: 60 * 1000,
    max: 20,
    standardHeaders: true,
    legacyHeaders: false,
    message: { success: false, error: { code: 'RATE_LIMIT_EXCEEDED', message: 'Too many requests, please try again later.' } }
});

// Routes
app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/portfolio', authenticate, portfolioRoutes);
app.use('/api/watchlist', authenticate, watchlistRouter);
app.use('/api/market', authenticate, marketRoutes);
app.use('/api/kite', authenticate, kiteRoutes);
app.use('/api/instruments', authenticate, instrumentRoutes);
app.use('/api/strategies', authenticate, strategyRoutes);
app.use('/api/screener', screenerRoutes);

// Error Handler
import { globalErrorHandler } from './middleware/middleware.error';

app.use(globalErrorHandler);

export default app;
