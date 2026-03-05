import { Server as SocketIOServer, Socket } from 'socket.io';
import { Server as HttpServer } from 'http';
import { logger } from '../utils/logger';
import { TickerService, tickerEvents } from '../services/service.ticker';
import jwt from 'jsonwebtoken';
import { config } from '../config/config';
import { PrismaClient } from '@prisma/client';
import { decrypt } from '../utils/crypto';

const prisma = new PrismaClient();

export class SocketManager {
    private io: SocketIOServer;

    constructor(httpServer: HttpServer) {
        this.io = new SocketIOServer(httpServer, {
            cors: {
                origin: '*', // Allow all for dev
                methods: ['GET', 'POST']
            }
        });

        this.initialize();
    }

    private initialize() {
        this.io.on('connection', (socket: Socket) => {
            logger.info(`Client connected: ${socket.id}`);

            // Check for access_token in handshake query or auth object
            const queryToken = socket.handshake.query.access_token as string;
            const authToken = (socket.handshake.auth as any).token; // often used in socket.io v4
            
            const token = queryToken || authToken;

            // Extract 'token' from handshake, which is now the App JWT
            const jwtToken = queryToken || authToken;

            if (jwtToken) {
                try {
                    const decoded = jwt.verify(jwtToken, config.JWT_SECRET) as any;
                    
                    // Valid JWT -> Get User -> Get Kite Token
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
                    // Join rooms for each token to allow granular broadcasting
                    // Room name: "token_123456"
                    tokens.forEach(token => {
                        socket.join(`token_${token}`);
                    });
                    
                    // Tell TickerService to subscribe to these upstream
                    TickerService.subscribe(tokens);
                    
                    logger.info(`Socket ${socket.id} subscribed to ${tokens}`);
                }
            });

            socket.on('unsubscribe', (tokens: number[]) => {
                if (Array.isArray(tokens)) {
                    tokens.forEach(token => {
                        socket.leave(`token_${token}`);
                    });
                    
                    // We don't necessarily unsubscribe from TickerService immediately 
                    // because other clients might be interested. 
                    // Optimization: Check room size before unsubscribing upstream.
                    TickerService.unsubscribe(tokens); // Simplification for now
                }
            });

            socket.on('disconnect', () => {
                logger.info(`Client disconnected: ${socket.id}`);
            });
        });

        // Listen for internal Ticker events and broadcast
        tickerEvents.on('ticks', (ticks: any[]) => {
            if (ticks.length > 0) {
                // logger.debug(`SocketManager: Broadcasting ${ticks.length} ticks`);
            }
            // Broadcast to the specific room for each token
            ticks.forEach(tick => {
                // this.io.to(`token_${tick.instrument_token}`).emit('tick', tick); 
                // Using .compress(false) might help latency but generally io.to is fine
                this.io.to(`token_${tick.instrument_token}`).emit('tick', tick);
            });
        });
    }
}
