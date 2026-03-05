
import axios from 'axios';
// @ts-ignore
import csv = require('csv-parser');
import { Readable } from 'stream';
import { logger } from '../utils/logger';
import { InstrumentRepository } from '../repositories/repository.instrument';

const KITE_INSTRUMENTS_BASE_URL = 'https://api.kite.trade/instruments';
const EXCHANGES_TO_SYNC = ['NSE', 'NFO', 'BSE'];

function parseDate(dateStr: string): Date | null {
    if (!dateStr || typeof dateStr !== 'string') return null;
    const trimmed = dateStr.trim();
    if (trimmed === '') return null;
    
    const date = new Date(trimmed);
    if (isNaN(date.getTime())) {
        return null;
    }
    return date;
}

export const InstrumentService = {
    async syncInstruments() {
        logger.info('Starting Combined Instruments Sync (Parallel Download)...');

        // 1. Parallel Download
        const downloadPromises = EXCHANGES_TO_SYNC.map(async (exchange) => {
            try {
                logger.info(`Downloading ${exchange}...`);
                const url = `${KITE_INSTRUMENTS_BASE_URL}/${exchange}`;
                const response = await axios.get(url, { responseType: 'arraybuffer', timeout: 60000 }); // 60s timeout
                return { exchange, buffer: Buffer.from(response.data), error: null };
            } catch (err: any) {
                return { exchange, buffer: null, error: err.message };
            }
        });

        const downloads = await Promise.all(downloadPromises);
        const results: Record<string, any> = {};
        let totalCount = 0;

        // 2. Sequential DB Sync
        for (const download of downloads) {
            const { exchange, buffer, error } = download;
            if (error || !buffer) {
                results[exchange] = { status: 'FAILURE', error: error || 'Download failed' };
                continue;
            }

            try {
                logger.info(`Parsing ${exchange}...`);
                const stream = Readable.from(buffer);
                const instruments: any[] = [];

                await new Promise((resolve, reject) => {
                     stream
                        .pipe(csv())
                        .on('data', (row: any) => {
                             instruments.push({
                                instrument_token: parseInt(row.instrument_token),
                                exchange_token: row.exchange_token,
                                tradingsymbol: row.tradingsymbol,
                                name: row.name,
                                last_price: parseFloat(row.last_price) || 0,
                                expiry: parseDate(row.expiry),
                                strike: parseFloat(row.strike) || 0,
                                tick_size: parseFloat(row.tick_size) || 0,
                                lot_size: parseInt(row.lot_size) || 0,
                                instrument_type: row.instrument_type,
                                segment: row.segment,
                                exchange: row.exchange,
                                updatedAt: new Date()
                            });
                        })
                         .on('end', resolve)
                         .on('error', reject);
                });

                logger.info(`Syncing DB for ${exchange} (${instruments.length} records)...`);
                
                // Use Repository
                const result = await InstrumentRepository.syncInstruments(exchange, instruments);
                const resultCreate = result[1]; 
                const inserted = resultCreate.count;
                
                logger.info(`  ${exchange}: Inserted ${inserted}`);

                results[exchange] = { status: 'SUCCESS', count: inserted };
                totalCount += inserted;

            } catch (err: any) {
                logger.error(`DB Sync failed for ${exchange}:`, err.message);
                results[exchange] = { status: 'FAILURE', error: err.message };
            }
        }

        return { total: totalCount, details: results };
    },

    async getInstruments(query: any) {
        const { 
            exchange, 
            segment, 
            instrument_type, 
            search
        } = query;

        const whereClause: any = {};

        if (exchange) whereClause.exchange = exchange;
        if (segment) whereClause.segment = segment;
        if (instrument_type) whereClause.instrument_type = instrument_type;

        if (search) {
            whereClause.OR = [
                { tradingsymbol: { contains: search, mode: 'insensitive' } },
                { name: { contains: search, mode: 'insensitive' } }
            ];
        }

        // Fetch up to 2000 candidates
        const instruments = await InstrumentRepository.searchInstruments(whereClause, 2000);

        // Relevance Sorting in Memory
        if (search) {
            const searchLower = search.toLowerCase();
            instruments.sort((a: any, b: any) => {
                const aSymbol = (a.tradingsymbol || '').toLowerCase();
                const bSymbol = (b.tradingsymbol || '').toLowerCase();
                
                // Priority 1: Exact Match
                if (aSymbol === searchLower && bSymbol !== searchLower) return -1;
                if (bSymbol === searchLower && aSymbol !== searchLower) return 1;

                // Priority 2: Starts With
                const aStarts = aSymbol.startsWith(searchLower);
                const bStarts = bSymbol.startsWith(searchLower);
                if (aStarts && !bStarts) return -1;
                if (!aStarts && bStarts) return 1;

                // Priority 3: Alphabetical
                return aSymbol.localeCompare(bSymbol);
            });
        } else {
             // Default sort if no search
            instruments.sort((a: any, b: any) => (a.tradingsymbol || '').localeCompare(b.tradingsymbol || ''));
        }

        // Apply Hard Limit of 500
        const limitedInstruments = instruments.slice(0, 500);

        return {
            instruments: limitedInstruments,
            count: limitedInstruments.length
        };
    }
};
