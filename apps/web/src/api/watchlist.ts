import apiClient from './client';
import type { WatchlistItem, Instrument } from '../types';

export const watchlistApi = {
  getWatchlist: () => apiClient.get<{ success: boolean; data: WatchlistItem[] }>('/watchlist'),
  
  addToWatchlist: (watchlistSet: number, instrument: Instrument) => {
    // Construct payload matching the user request requirements
    const payload = {
        watchlist_set: watchlistSet,
        instrument_token: String(instrument.instrument_token),
        exchange_token: instrument.exchange_token,
        tradingsymbol: instrument.tradingsymbol,
        name: instrument.name || instrument.tradingsymbol,
        last_price: instrument.last_price || 0,
        expiry: instrument.expiry || "",
        strike: instrument.strike || 0,
        tick_size: instrument.tick_size || 0,
        lot_size: instrument.lot_size || 0,
        instrument_type: instrument.instrument_type || "EQ",
        segment: instrument.segment || "INDICES",
        exchange: instrument.exchange
    };
    return apiClient.post('/watchlist', payload);
  },

  removeFromWatchlist: (id: string | number) => apiClient.delete(`/watchlist/${id}`)
};
