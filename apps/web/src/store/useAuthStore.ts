import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { AuthState, User, KiteProfile, KiteSession } from '../types';
import { TradingMode } from '../constants';
import { marketApi } from '../api/market';
import { portfolioApi } from '../api/portfolio';

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      kiteToken: null,
      kiteSession: null,
      kiteProfile: null,
      isAuthenticated: false,
      isKiteConnected: false,
      tradingMode: TradingMode.REAL,
      instruments: [],
      login: (user: User, token: string) => set({ user, token, isAuthenticated: true }),
      logout: () => set({
        user: null,
        token: null,
        kiteToken: null,
        kiteSession: null,
        kiteProfile: null,
        instruments: [],
        isAuthenticated: false,
        isKiteConnected: false,
        tradingMode: TradingMode.REAL
      }),
      setKiteToken: (token: string | null) => set({ kiteToken: token }),
      setKiteSession: (session: KiteSession | null) => set({ kiteSession: session, isKiteConnected: !!session }),
      setKiteProfile: (profile: KiteProfile | null) => set({ kiteProfile: profile }),
      disconnectKite: () => set({
        kiteSession: null,
        kiteToken: null,
        kiteProfile: null,
        instruments: [],
        isKiteConnected: false
      }),
      setTradingMode: (mode: TradingMode) => set({ tradingMode: mode }),
      fetchKiteProfile: async () => {
        try {
            const { data } = await portfolioApi.getProfile();
            set({ kiteProfile: data.data || data });
        } catch (error) {
            if (import.meta.env.DEV) console.error('Failed to fetch profile', error);
        }
      },
      fetchInstruments: async () => {
          try {
              await marketApi.syncInstruments();
              const { data } = await marketApi.getAllInstruments();
              const instruments = data.data.instruments || [];
              set({ instruments });
          } catch (error) {
              if (import.meta.env.DEV) console.error('Failed to sync/fetch instruments', error);
          }
      }
    }),
    {
      name: 'auth-storage',
    }
  )
);
