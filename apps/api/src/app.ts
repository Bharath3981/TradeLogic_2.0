import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import { logger } from './utils/logger';
import { injectKiteToken } from './middleware/middleware.auth';
import { generateId } from './utils/id';
import instrumentRoutes from './routes/route.instruments';
import screenerRoutes from './routes/route.screener';
import marketRoutes from './routes/route.market';
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

// Routes
app.use('/api/market', injectKiteToken, marketRoutes);
app.use('/api/instruments', injectKiteToken, instrumentRoutes);
app.use('/api/screener', screenerRoutes);

// Error Handler
import { globalErrorHandler } from './middleware/middleware.error';

app.use(globalErrorHandler);

export default app;
