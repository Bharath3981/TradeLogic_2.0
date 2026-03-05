import { create } from 'zustand';
import type { Tick, Instrument, WatchlistItem } from '../types';
import { watchlistApi } from '../api/watchlist';

interface MarketState {
  ticks: { [token: number]: Tick };
  watchlists: { [id: number]: number[] };
  // Map to store database IDs: listId -> token -> dbId
  watchlistMap: { [listId: number]: { [token: number]: string } };
  // Cache for watchlist details from API
  storedWatchlistItems: { [token: number]: WatchlistItem };
  activeWatchlistId: number;
  
  setTick: (tick: Tick) => void;
  setActiveWatchlistId: (id: number) => void;
  
  // Actions
  fetchWatchlist: () => Promise<void>;
  addToWatchlist: (listId: number, instrument: Instrument) => Promise<void>;
  removeFromWatchlist: (listId: number, token: number) => Promise<void>;
  setWatchlist: (listId: number, tokens: number[]) => void;
  resetTicks: () => void;
}

const INITIAL_WATCHLISTS = {
    1: [], 2: [], 3: [], 4: [], 5: [], 6: [], 7: []
};
const INITIAL_MAP = {
    1: {}, 2: {}, 3: {}, 4: {}, 5: {}, 6: {}, 7: {}
};

export const useMarketStore = create<MarketState>((set, get) => ({
  ticks: {},
  watchlists: INITIAL_WATCHLISTS,
  watchlistMap: INITIAL_MAP,
  storedWatchlistItems: {},
  activeWatchlistId: 1,
  
  setTick: (tick) => set((state) => ({
    ticks: {
      ...state.ticks,
      [tick.instrument_token]: tick,
    },
  })),

  setActiveWatchlistId: (id) => set({ activeWatchlistId: id }),

  fetchWatchlist: async () => {
      try {
          console.log('useMarketStore: Fetching watchlist...');
          const { data } = await watchlistApi.getWatchlist();
          console.log('useMarketStore: Watchlist API Response', data);
          
          const items = data.data || [];
          
          // Create fresh objects to avoid mutating constants
          const newWatchlists: { [id: number]: number[] } = { 
              1: [], 2: [], 3: [], 4: [], 5: [], 6: [], 7: [] 
          };
          const newMap: { [listId: number]: { [token: number]: string } } = {
              1: {}, 2: {}, 3: {}, 4: {}, 5: {}, 6: {}, 7: {}
          };
          const newStoredItems: { [token: number]: WatchlistItem } = {};

          items.forEach(item => {
              const listId = item.watchlistSet;
              const token = Number(item.instrumentToken);
              
              if (newWatchlists[listId]) {
                  newWatchlists[listId].push(token);
                  if (!newMap[listId]) newMap[listId] = {};
                  newMap[listId][token] = item.id;
                  newStoredItems[token] = item;
              }
          });
          
          console.log('useMarketStore: Processed Watchlists', newWatchlists);
          set({ watchlists: newWatchlists, watchlistMap: newMap, storedWatchlistItems: newStoredItems });
      } catch (error) {
          console.error("Failed to fetch watchlist", error);
      }
  },

  addToWatchlist: async (listId, instrument) => {
      const token = Number(instrument.instrument_token);
      const state = get();
      
      // Optimistic check
      if (state.watchlists[listId]?.includes(token)) return;

      try {
          const { data } = await watchlistApi.addToWatchlist(listId, instrument); 
          const createdItem = (data.data || data) as WatchlistItem; 
          const dbId = createdItem.id;

          set((state) => ({
              watchlists: {
                  ...state.watchlists,
                  [listId]: [...(state.watchlists[listId] || []), token]
              },
              watchlistMap: {
                  ...state.watchlistMap,
                  [listId]: {
                      ...(state.watchlistMap[listId] || {}),
                      [token]: dbId
                  }
              },
              storedWatchlistItems: {
                  ...state.storedWatchlistItems,
                  [token]: createdItem
              }
          }));
      } catch (error) {
          console.error("Failed to add to watchlist", error);
      }
  },

  removeFromWatchlist: async (listId, token) => {
      const state = get();
      const dbId = state.watchlistMap[listId]?.[token];
      
      if (!dbId) {
          console.warn(`No DB ID found for token ${token} in list ${listId}`);
           set((state) => ({
              watchlists: {
                  ...state.watchlists,
                  [listId]: (state.watchlists[listId] || []).filter(t => t !== token)
              }
          }));
          return;
      }

      try {
          await watchlistApi.removeFromWatchlist(dbId);
          
          set((state) => {
              const newMapStart = { ...state.watchlistMap[listId] };
              delete newMapStart[token];
              
              return {
                  watchlists: {
                      ...state.watchlists,
                      [listId]: (state.watchlists[listId] || []).filter(t => t !== token)
                  },
                  watchlistMap: {
                      ...state.watchlistMap,
                      [listId]: newMapStart
                  }
              };
          });
      } catch (error) {
          console.error("Failed to remove from watchlist", error);
      }
  },

  setWatchlist: (listId, tokens) => set((state) => ({
      watchlists: {
          ...state.watchlists,
          [listId]: tokens
      }
      // Note: Reordering doesn't sync to backend yet
  })),

  resetTicks: () => set({ ticks: {}, watchlists: INITIAL_WATCHLISTS, watchlistMap: INITIAL_MAP, storedWatchlistItems: {}, activeWatchlistId: 1 }),
}));
