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
      instruments: [], // Initialize instruments
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
        console.log('useAuthStore: fetchKiteProfile called');
        try {
            const { data } = await portfolioApi.getProfile();
            console.log('useAuthStore: Profile fetched', data);
            set({ kiteProfile: data.data || data });
        } catch (error) {
            console.error('Failed to fetch profile', error);
            // Error handling is centralized in client.ts
        }
      },
      fetchInstruments: async () => {
          console.log('useAuthStore: fetchInstruments (sync + fetch) called');
          try {
              // 1. Trigger Sync
              await marketApi.syncInstruments();
              console.log('useAuthStore: Sync triggered successfully');

              // 2. Fetch All Instruments
              const { data } = await marketApi.getAllInstruments();
              const instruments = data.data.instruments || [];
              
              console.log('useAuthStore: Instruments fetched after sync', instruments.length);
              set({ instruments });
          } catch (error) {
              console.error('Failed to sync/fetch instruments', error);
          }
      }
    }),
    {
      name: 'auth-storage', // unique name for local storage
    }
  )
);
