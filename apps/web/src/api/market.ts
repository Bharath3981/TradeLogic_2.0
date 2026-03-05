import client from './client';
import type { Instrument } from '../types';

export const marketApi = {
    getInstruments: (exchange: string = 'NSE') => 
        client.get<Instrument[]>('/market/instruments', {
            params: { exchange }
        }),
    syncNFOInstruments: () => client.post<{ success: boolean; message: string }>('/instruments/sync/nfo'),
    syncInstruments: () => client.post<{ success: boolean; message: string }>('/instruments/sync'),
    getAllInstruments: () => client.get<{ success: boolean; data: { instruments: Instrument[] } }>('/instruments'),
    searchInstruments: (query: string, signal?: AbortSignal) => client.get<{ success: boolean; data: { instruments: Instrument[] } }>('/instruments', { params: { search: query }, signal })
};
