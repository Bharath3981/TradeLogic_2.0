import { Server as SocketIOServer, Socket } from 'socket.io';
import { Server as HttpServer } from 'http';
import { logger } from '../utils/logger';
import { TickerService, tickerEvents } from '../services/service.ticker';
import jwt from 'jsonwebtoken';
import { config } from '../config/config';
import { decrypt } from '../utils/crypto';
import { prisma } from '../lib/prisma';

export class SocketManager {
    private io: SocketIOServer;

    constructor(httpServer: HttpServer) {
        this.io = new SocketIOServer(httpServer, {
            cors: {
                origin: config.ALLOWED_ORIGIN,
                credentials: true,
                methods: ['GET', 'POST']
            }
        });

        this.initialize();
    }

    private initialize() {
        this.io.on('connection', (socket: Socket) => {
            logger.info(`Client connected: ${socket.id}`);

            const queryToken = socket.handshake.query.access_token as string;
            const authToken = (socket.handshake.auth as any).token;

            const jwtToken = queryToken || authToken;

            if (jwtToken) {
                try {
                    const decoded = jwt.verify(jwtToken, config.JWT_SECRET) as any;

                    prisma.user.findUnique({
                        where: { id: decoded.id },
                        select: { kiteAccessToken: true }
                    }).then(user => {
                        if (user?.kiteAccessToken) {
                            try {
                                const kiteToken = decrypt(user.kiteAccessToken);
                                logger.info('Decrypted Kite Token from DB. Initializing Real Ticker.');
                                TickerService.init(kiteToken);
                            } catch (err) {
                                logger.error({ err }, 'Decrypt failed');
                            }
                        } else {
                            logger.info('User has no Kite Token in DB. Staying in Mock mode.');
                        }
                    }).catch(err => {
                        logger.error({ err }, 'DB User fetch failed');
                    });

                } catch (err) {
                    logger.error({ err }, 'Socket Auth Failed: Invalid JWT');
                }
            }

            socket.on('subscribe', (tokens: number[]) => {
                if (Array.isArray(tokens)) {
                    tokens.forEach(token => {
                        socket.join(`token_${token}`);
                    });
                    TickerService.subscribe(tokens);
                    logger.info(`Socket ${socket.id} subscribed to ${tokens}`);
                }
            });

            socket.on('unsubscribe', (tokens: number[]) => {
                if (Array.isArray(tokens)) {
                    tokens.forEach(token => {
                        socket.leave(`token_${token}`);
                    });
                    TickerService.unsubscribe(tokens);
                }
            });

            socket.on('disconnect', () => {
                logger.info(`Client disconnected: ${socket.id}`);
            });
        });

        // Listen for internal Ticker events and broadcast to token rooms
        tickerEvents.on('ticks', (ticks: any[]) => {
            ticks.forEach(tick => {
                this.io.to(`token_${tick.instrument_token}`).emit('tick', tick);
            });
        });
    }
}
