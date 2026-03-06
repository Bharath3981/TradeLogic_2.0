/**
 * src/store/useScreenerStore.ts
 * Follows exact same Zustand pattern as useMarketStore.ts
 */

import { create } from 'zustand';
import { screenerApi, type ScreenerResult, type ScreenerScanOptions, } from '../api/screener';

interface ScreenerState {
    // Data
    result: ScreenerResult | null;
    sectors: string[];

    // UI State
    isScanning: boolean;
    error: string | null;
    lastScanAt: string | null;

    // Filters
    selectedSector: string;
    selectedTrend: 'ALL' | 'uptrend' | 'downtrend' | 'sideways';
    holdingMonths: number;
    minScore: number;
    limit: number;

    // Actions
    runScan: () => Promise<void>;
    fetchSectors: () => Promise<void>;
    setSelectedSector: (sector: string) => void;
    setSelectedTrend: (trend: 'ALL' | 'uptrend' | 'downtrend' | 'sideways') => void;
    setHoldingMonths: (months: number) => void;
    setMinScore: (score: number) => void;
    setLimit: (limit: number) => void;
    clearResults: () => void;
}

export const useScreenerStore = create<ScreenerState>((set, get) => ({
    // Data
    result: null,
    sectors: [],

    // UI State
    isScanning: false,
    error: null,
    lastScanAt: null,

    // Filters (defaults)
    selectedSector: 'ALL',
    selectedTrend: 'ALL',
    holdingMonths: 3,
    minScore: 40,
    limit: 20,

    runScan: async () => {
        const { selectedSector, selectedTrend, holdingMonths, minScore, limit } = get();

        set({ isScanning: true, error: null });

        try {
            const options: ScreenerScanOptions = {
                sector: selectedSector,
                trend: selectedTrend,
                holdingMonths,
                minScore,
                limit,
            };

            const { data } = await screenerApi.runScan(options);
            const result = data.data;

            set({
                result,
                lastScanAt: new Date().toISOString(),
                isScanning: false,
            });
        } catch (error: any) {
            console.error('Screener scan failed', error);
            set({
                isScanning: false,
                error: error?.response?.data?.message || 'Scan failed. Please try again.',
            });
        }
    },

    fetchSectors: async () => {
        try {
            const { data } = await screenerApi.getSectors();
            set({ sectors: data.data || [] });
        } catch (error) {
            console.error('Failed to fetch sectors', error);
        }
    },

    setSelectedSector: (sector) => set({ selectedSector: sector }),
    setSelectedTrend: (trend) => set({ selectedTrend: trend }),
    setHoldingMonths: (months) => set({ holdingMonths: months }),
    setMinScore: (score) => set({ minScore: score }),
    setLimit: (limit) => set({ limit }),

    clearResults: () => set({ result: null, error: null, lastScanAt: null }),
}));