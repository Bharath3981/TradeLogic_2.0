import { create } from 'zustand';
import { ordersApi } from '../api/orders';
import type { Order, OrderParams, Instrument, TransactionType } from '../types';

interface OrderDialogState {
  isOpen: boolean;
  mode: TransactionType; // 'BUY' or 'SELL'
  instrument: Instrument | null;
  orderToModify?: Order; // If modifying an existing order
}

interface OrderState {
  orders: Order[];
  isLoading: boolean;
  error: string | null;
  dialog: OrderDialogState;

  // Actions
  fetchOrders: () => Promise<void>;
  placeOrder: (params: OrderParams) => Promise<void>;
  modifyOrder: (orderId: string, params: Partial<OrderParams>) => Promise<void>;
  cancelOrder: (orderId: string) => Promise<void>;
  
  // UI Actions
  openOrderDialog: (mode: TransactionType, instrument: Instrument, orderToModify?: Order) => void;
  setDialogMode: (mode: TransactionType) => void;
  closeOrderDialog: () => void;
}

export const useOrderStore = create<OrderState>((set, get) => ({
  orders: [],
  isLoading: false,
  error: null,
  dialog: {
    isOpen: false,
    mode: 'BUY',
    instrument: null,
  },

  fetchOrders: async () => {
    set({ isLoading: true, error: null });
    try {
      const { data } = await ordersApi.getOrders();
      const orders = data.data || [];
      set({ orders, isLoading: false });
    } catch (err: unknown) {
      set({ error: (err as Error).message || 'Failed to fetch orders', isLoading: false });
    }
  },

  placeOrder: async (params) => {
    set({ isLoading: true, error: null });
    try {
      await ordersApi.placeOrder(params);
      await get().fetchOrders(); // Refresh list
      set({ isLoading: false });
      get().closeOrderDialog();
    } catch (err: unknown) {
      set({ error: (err as Error).message || 'Failed to place order', isLoading: false });
      throw err; // Re-throw to handle in UI if needed (e.g. show toast)
    }
  },

  modifyOrder: async (orderId, params) => {
    set({ isLoading: true, error: null });
    try {
      await ordersApi.modifyOrder(orderId, params);
      await get().fetchOrders(); // Refresh list
      set({ isLoading: false });
      get().closeOrderDialog();
    } catch (err: unknown) {
      set({ error: (err as Error).message || 'Failed to modify order', isLoading: false });
      throw err;
    }
  },

  cancelOrder: async (orderId) => {
    set({ isLoading: true, error: null });
    try {
      await ordersApi.cancelOrder(orderId);
      await get().fetchOrders(); // Refresh list
      set({ isLoading: false });
    } catch (err: unknown) {
      set({ error: (err as Error).message || 'Failed to cancel order', isLoading: false });
    }
  },

  openOrderDialog: (mode, instrument, orderToModify) => {
    set({
      dialog: {
        isOpen: true,
        mode,
        instrument,
        orderToModify
      }
    });
  },

  setDialogMode: (mode) => {
    set((state) => ({
      dialog: { ...state.dialog, mode }
    }));
  },

  closeOrderDialog: () => {
    set((state) => ({
      dialog: { ...state.dialog, isOpen: false, orderToModify: undefined }
    }));
  }
}));
