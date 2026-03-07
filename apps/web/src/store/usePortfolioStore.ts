import { create } from 'zustand';
import { portfolioApi } from '../api/portfolio';
import type { Position, Holding, Margin } from '../types';

interface PortfolioState {
  holdings: Holding[];
  positions: {
    net: Position[];
    day: Position[];
  };
  margins: Margin | null; // Add margins state
  isLoading: boolean;
  error: string | null;

  // Actions
  fetchPositions: () => Promise<void>;
  fetchHoldings: () => Promise<void>;
  fetchMargins: () => Promise<void>;
}

export const usePortfolioStore = create<PortfolioState>((set) => ({
  holdings: [],
  positions: { net: [], day: [] },
  margins: null,
  isLoading: false,
  error: null,

  fetchPositions: async () => {
    set({ isLoading: true, error: null });
    try {
      const { data } = await portfolioApi.getPositions();
      // Handle { success: true, data: { ... } } structure
      const payload = data.data || { net: [], day: [] };
      set({ 
          positions: {
              net: payload?.net || [],
              day: payload?.day || []
          }, 
          isLoading: false 
      });
    } catch (err: unknown) {
        console.error('Failed to fetch positions:', err);
      set({ error: (err as Error).message || 'Failed to fetch positions', isLoading: false });
    }
  },

  fetchHoldings: async () => {
    set({ isLoading: true, error: null });
    try {
      const { data } = await portfolioApi.getHoldings();
      const holdings = data.data || [];
      set({ holdings, isLoading: false });
    } catch (err: unknown) {
      console.error('Failed to fetch holdings:', err);
      set({ error: (err as Error).message || 'Failed to fetch holdings', isLoading: false });
    }
  },

  fetchMargins: async () => {
    // Note: Margins are fast, usually don't need full page loading state, 
    // but consistent error handling is good.
    try {
      const { data } = await portfolioApi.getMargins();
      set({ margins: data.data || null });
    } catch (err: unknown) {
      console.error('Failed to fetch margins:', err);
      // Optional: don't block UI for margins failure
    }
  },
}));
