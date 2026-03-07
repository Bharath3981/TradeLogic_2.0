import { z } from 'zod';

export const CreateWatchlistItemDto = z.object({
    watchlist_set: z.number().int().min(1).max(7),
    instrument_token: z.string(),
    exchange_token: z.string().optional(),
    tradingsymbol: z.string(),
    name: z.string().optional(),
    last_price: z.number().optional(),
    expiry: z.string().optional(),
    strike: z.number().optional(),
    tick_size: z.number().optional(),
    lot_size: z.number().optional(),
    instrument_type: z.string().optional(),
    segment: z.string().optional(),
    exchange: z.string()
});

export const DeleteWatchlistItemParams = z.object({
    id: z.string().uuid()
});

export type CreateWatchlistItemInput = z.infer<typeof CreateWatchlistItemDto>;
