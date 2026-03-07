/**
 * src/store/useScreenerStore.ts
 * Follows exact same Zustand pattern as useMarketStore.ts
 */

import { create } from 'zustand';
import { screenerApi, type ScreenerResult, type ScreenerScanOptions, type ScreenerVersion } from '../api/screener';

interface ScreenerState {
    // Data
    result:            ScreenerResult | null;
    sectors:           string[];
    indices:           string[];
    availableVersions: ScreenerVersion[];

    // UI State
    isScanning: boolean;
    error:      string | null;
    lastScanAt: string | null;

    // Filters
    selectedSector:  string;
    selectedTrend:   'ALL' | 'uptrend' | 'downtrend' | 'sideways';
    holdingMonths:   number;
    minScore:        number;
    limit:           number;
    selectedVersion: string;

    // Actions
    runScan:            () => Promise<void>;
    fetchSectors:       () => Promise<void>;
    fetchIndices:       () => Promise<void>;
    fetchVersions:      () => Promise<void>;
    setSelectedSector:  (sector: string) => void;
    setSelectedTrend:   (trend: 'ALL' | 'uptrend' | 'downtrend' | 'sideways') => void;
    setHoldingMonths:   (months: number) => void;
    setMinScore:        (score: number) => void;
    setLimit:           (limit: number) => void;
    setSelectedVersion: (version: string) => void;
    clearResults:       () => void;
}

export const useScreenerStore = create<ScreenerState>((set, get) => ({
    // Data
    result:            null,
    sectors:           [],
    indices:           [],
    availableVersions: [],

    // UI State
    isScanning: false,
    error:      null,
    lastScanAt: null,

    // Filters (defaults)
    selectedSector:  'ALL',
    selectedTrend:   'ALL',
    holdingMonths:   3,
    minScore:        40,
    limit:           20,
    selectedVersion: 'v1',

    runScan: async () => {
        const { selectedSector, selectedTrend, holdingMonths, minScore, limit, selectedVersion } = get();

        set({ isScanning: true, error: null });

        try {
            const options: ScreenerScanOptions = {
                sector:  selectedSector,
                trend:   selectedTrend,
                holdingMonths,
                minScore,
                limit,
                version: selectedVersion,
            };

            const { data } = await screenerApi.runScan(options);
            set({ result: data.data, lastScanAt: new Date().toISOString(), isScanning: false });
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

    fetchIndices: async () => {
        try {
            const { data } = await screenerApi.getIndices();
            set({ indices: data.data || [] });
        } catch (error) {
            console.error('Failed to fetch indices', error);
        }
    },

    fetchVersions: async () => {
        try {
            const { data } = await screenerApi.getVersions();
            const versions = data.data || [];
            set({ availableVersions: versions });
            const { selectedVersion } = get();
            if (versions.length > 0 && !versions.find(v => v.id === selectedVersion)) {
                const latest = versions.find(v => v.isLatest) ?? versions[0];
                set({ selectedVersion: latest.id });
            }
        } catch (error) {
            console.error('Failed to fetch screener versions', error);
        }
    },

    setSelectedSector:  (sector)  => set({ selectedSector: sector }),
    setSelectedTrend:   (trend)   => set({ selectedTrend: trend }),
    setHoldingMonths:   (months)  => set({ holdingMonths: months }),
    setMinScore:        (score)   => set({ minScore: score }),
    setLimit:           (limit)   => set({ limit }),
    setSelectedVersion: (version) => set({ selectedVersion: version }),

    clearResults: () => set({ result: null, error: null, lastScanAt: null }),
}));
