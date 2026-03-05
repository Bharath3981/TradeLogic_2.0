/// <reference path="../types/kiteconnect.d.ts" />
import { KiteTicker } from 'kiteconnect';
import { EventEmitter } from 'events';
import { config } from '../config/config';
import { logger } from '../utils/logger';

// Event Emitter for Ticks
export const tickerEvents = new EventEmitter();

interface Tick {
    instrument_token: number;
    last_price: number;
    // Add other fields as needed
}

class TickerServiceClass {
    private ticker: KiteTicker | null = null;
    private subscribedTokens: Set<number> = new Set();
    private isMock: boolean = true;
    private mockInterval: NodeJS.Timeout | null = null;
    
    // Cache for latest prices
    private latestTicks: Map<string, number> = new Map();

    constructor() {
        // Default to Mock, can be switched or decided by config
        // meaningful "Real" ticker requires a valid user access_token, 
        // which varies per user. 
        // ARCHITECTURE DECISION: 
        // For a multi-user app, we usually have ONE central master ticker (using a master account) 
        // OR we instantiate a ticker per user.
        // For this personal project, we assume a single master ticker or Mock.
    }
    
    /**
     * Returns the latest cached LTP for a token.
     * Returns undefined if not found.
     */
    public getLTP(token: string | number): number | undefined {
        return this.latestTicks.get(String(token));
    }

    public init(accessToken?: string) {
        // If config forces mock, ignore real token
        if (config.ENABLE_MOCK_DATA) {
             if (this.ticker) return; 
             this.startMockTicker();
             return;
        }

        // If already connected in Real mode, don't re-init unless forced?
        // Simple logic: If we have a token, we WANT Real mode.
        if (accessToken) {
            if (!this.isMock && this.ticker) {
                // Already real, maybe just log or update token if allowed
                 logger.info('Ticker already in Real mode');
                 return;
            }

            // Clean up mock if running
            if (this.mockInterval) clearInterval(this.mockInterval);
            this.isMock = false;

            this.ticker = new KiteTicker({
                api_key: config.KITE_API_KEY,
                access_token: accessToken
            });

            this.ticker.connect();
            this.ticker.on('ticks', (ticks: any[]) => {
                this.handleTicks(ticks);
            });
            this.ticker.on('connect', () => {
                logger.info('KiteTicker connected');
                // Re-subscribe to existing tokens
                if (this.subscribedTokens.size > 0) {
                     this.ticker?.subscribe(Array.from(this.subscribedTokens));
                     this.ticker?.setMode(this.ticker.modeFull, Array.from(this.subscribedTokens));
                }
            });
            this.ticker.on('error', (err: any) => {
                logger.error({ msg: 'KiteTicker error', error: err });
            });
        } else {
            // Only start mock if not already running Real
            if (this.ticker) return; 
            this.startMockTicker();
        }
    }

    private startMockTicker() {
        if (this.mockInterval) clearInterval(this.mockInterval);
        this.isMock = true;
        logger.info('Starting Mock Ticker');
        
        this.mockInterval = setInterval(() => {
            if (this.subscribedTokens.size === 0) return;

            const ticks: Tick[] = Array.from(this.subscribedTokens).map(token => ({
                instrument_token: token,
                last_price: 1000 + Math.random() * 10, // Mock price
                mode: 'full',
                is_tradable: true
            }));

            this.handleTicks(ticks);
        }, 1000);
    }

    public subscribe(tokens: number[]) {
        tokens.forEach(t => this.subscribedTokens.add(t));

        if (!this.isMock && this.ticker) {
            this.ticker.subscribe(tokens);
            this.ticker.setMode(this.ticker.modeFull, tokens);
        }
    }

    public unsubscribe(tokens: number[]) {
        tokens.forEach(t => this.subscribedTokens.delete(t));

        if (!this.isMock && this.ticker) {
            this.ticker.unsubscribe(tokens);
        }
    }

    private handleTicks(ticks: any[]) {
        if (ticks.length > 0) {
             // Update Cache
             ticks.forEach(t => {
                 this.latestTicks.set(String(t.instrument_token), t.last_price);
             });
             
             logger.debug(`TickerService: Cached ${ticks.length} ticks.`);
        }
        // Broadcast via EventEmitter
        tickerEvents.emit('ticks', ticks);
    }
}

export const TickerService = new TickerServiceClass();
