import { useEffect, useRef } from 'react';
import { socketManager } from '../socket/SocketManager';
import { useAuthStore } from '../store/useAuthStore';
import { useMarketStore } from '../store/useMarketStore';
import { usePortfolioStore } from '../store/usePortfolioStore';

// NSE Nifty 50 and BSE Sensex instrument tokens (static indices)
const NIFTY_TOKEN = 256265;
const SENSEX_TOKEN = 265;

export const useGlobalTicker = () => {
  const token = useAuthStore((state) => state.token);
  const isKiteConnected = useAuthStore((state) => state.isKiteConnected);
  const instruments = useAuthStore((state) => state.instruments);
  const watchlists = useMarketStore((state) => state.watchlists);
  const setTick = useMarketStore((state) => state.setTick);

  const positions = usePortfolioStore((state) => state.positions) || { net: [], day: [] };

  const watchedTokens = Object.values(watchlists).flat();

  const positionTokens = [
      ...(positions.net || []).map(p => Number(p.instrument_token)),
      ...(positions.day || []).map(p => Number(p.instrument_token)),
  ];

  watchedTokens.push(...positionTokens, NIFTY_TOKEN, SENSEX_TOKEN);

  const uniqueWatchedTokens = [...new Set(watchedTokens)];

  const prevSubscribedRef = useRef<number[]>([]);

  // 1. Connection Management
  useEffect(() => {
    if (!token || !isKiteConnected) {
      socketManager.disconnect();
      return;
    }

    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:9000/api';
    const socketUrl = apiUrl.replace('/api', '');

    socketManager.connect(socketUrl, token);
  }, [token, isKiteConnected]);

  // 2. Subscription Management (Diffing)
  useEffect(() => {
    if (!token || !isKiteConnected) return;

    const targetTokens = uniqueWatchedTokens;
    const prevTokens = prevSubscribedRef.current;

    const toSubscribe = targetTokens.filter(t => !prevTokens.includes(t));
    const toUnsubscribe = prevTokens.filter(t => !targetTokens.includes(t));

    if (toUnsubscribe.length > 0) socketManager.unsubscribe(toUnsubscribe);
    if (toSubscribe.length > 0) socketManager.subscribe(toSubscribe);

    prevSubscribedRef.current = targetTokens;

    const GLOBAL_HANDLER_ID = 'GLOBAL_MARKET_STORE';
    socketManager.onTick(GLOBAL_HANDLER_ID, (tick) => {
        setTick(tick);
    });

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, isKiteConnected, uniqueWatchedTokens.join(','), instruments.length]);
};
