import { create } from 'zustand';
import type { Tick, Instrument, WatchlistItem } from '../types';
import { watchlistApi } from '../api/watchlist';

interface MarketState {
  ticks: { [token: number]: Tick };
  watchlists: { [id: number]: number[] };
  watchlistMap: { [listId: number]: { [token: number]: string } };
  storedWatchlistItems: { [token: number]: WatchlistItem };
  activeWatchlistId: number;

  setTick: (tick: Tick) => void;
  setActiveWatchlistId: (id: number) => void;

  fetchWatchlist: () => Promise<void>;
  addToWatchlist: (listId: number, instrument: Instrument) => Promise<void>;
  removeFromWatchlist: (listId: number, token: number) => Promise<void>;
  setWatchlist: (listId: number, tokens: number[]) => void;
  resetTicks: () => void;
}

const NUM_WATCHLISTS = 7;
const makeInitialWatchlists = (): { [id: number]: number[] } =>
    Object.fromEntries(Array.from({ length: NUM_WATCHLISTS }, (_, i) => [i + 1, []]));
const makeInitialMap = (): { [id: number]: { [token: number]: string } } =>
    Object.fromEntries(Array.from({ length: NUM_WATCHLISTS }, (_, i) => [i + 1, {}]));

const INITIAL_WATCHLISTS = makeInitialWatchlists();
const INITIAL_MAP = makeInitialMap();

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
          const { data } = await watchlistApi.getWatchlist();
          const items = data.data || [];

          const newWatchlists = makeInitialWatchlists();
          const newMap = makeInitialMap();
          const newStoredItems: { [token: number]: WatchlistItem } = {};

          items.forEach(item => {
              const listId = item.watchlistSet;
              const token = Number(item.instrumentToken);

              if (newWatchlists[listId]) {
                  newWatchlists[listId].push(token);
                  newMap[listId][token] = item.id;
                  newStoredItems[token] = item;
              }
          });

          set({ watchlists: newWatchlists, watchlistMap: newMap, storedWatchlistItems: newStoredItems });
      } catch (error) {
          if (import.meta.env.DEV) console.error('Failed to fetch watchlist', error);
      }
  },

  addToWatchlist: async (listId, instrument) => {
      const token = Number(instrument.instrument_token);
      const state = get();

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
          if (import.meta.env.DEV) console.error('Failed to add to watchlist', error);
      }
  },

  removeFromWatchlist: async (listId, token) => {
      const state = get();
      const dbId = state.watchlistMap[listId]?.[token];

      if (!dbId) {
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
              const newMap = { ...state.watchlistMap[listId] };
              delete newMap[token];

              return {
                  watchlists: {
                      ...state.watchlists,
                      [listId]: (state.watchlists[listId] || []).filter(t => t !== token)
                  },
                  watchlistMap: {
                      ...state.watchlistMap,
                      [listId]: newMap
                  }
              };
          });
      } catch (error) {
          if (import.meta.env.DEV) console.error('Failed to remove from watchlist', error);
      }
  },

  setWatchlist: (listId, tokens) => set((state) => ({
      watchlists: {
          ...state.watchlists,
          [listId]: tokens
      }
  })),

  resetTicks: () => set({
      ticks: {},
      watchlists: makeInitialWatchlists(),
      watchlistMap: makeInitialMap(),
      storedWatchlistItems: {},
      activeWatchlistId: 1
  }),
}));
