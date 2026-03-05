import { useEffect, useRef } from 'react';
import { socketManager } from '../socket/SocketManager';
import { useAuthStore } from '../store/useAuthStore';
import { useMarketStore } from '../store/useMarketStore';
import { usePortfolioStore } from '../store/usePortfolioStore';

export const useGlobalTicker = () => {
  const token = useAuthStore((state) => state.token);
  const instruments = useAuthStore((state) => state.instruments);
  const watchlists = useMarketStore((state) => state.watchlists);
  const setTick = useMarketStore((state) => state.setTick);
  
  // Get positions to subscribe to their tokens too
  const positions = usePortfolioStore((state) => state.positions);
  const strategyPositions = usePortfolioStore((state) => state.strategyPositions);

  // Flatten all watchlists to get unique tokens to subscribe to
  const watchedTokens = Object.values(watchlists).flat();
  
  // Add tokens from Positions (Net and Day)
  const positionTokens = [
      ...positions.net.map(p => Number(p.instrument_token)), 
      ...positions.day.map(p => Number(p.instrument_token)),
      ...strategyPositions.map(p => Number(p.instrument_token))
  ];
  
  // Combine and deduplicate
  watchedTokens.push(...positionTokens);

  // Static Header Indices (NIFTY 50 and SENSEX)
  const NIFTY_TOKEN = 256265;
  const SENSEX_TOKEN = 265;

  watchedTokens.push(NIFTY_TOKEN);
  watchedTokens.push(SENSEX_TOKEN);
  
  // Unique tokens
  const uniqueWatchedTokens = [...new Set(watchedTokens)];

  // Track previous subscribed tokens to separate new vs removed
  const prevSubscribedRef = useRef<number[]>([]);

  // 1. Connection Management
  useEffect(() => {
    if (!token) return;
    
    // Derive base URL (remove /api if present)
    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:9000/api';
    const socketUrl = apiUrl.replace('/api', '');
    
    socketManager.connect(socketUrl, token);
  }, [token]);

  // 2. Subscription Management (Diffing)
  useEffect(() => {
    if (!token) return;

    // Current target list
    const targetTokens = uniqueWatchedTokens; 
    const prevTokens = prevSubscribedRef.current;

    // Calculate diff
    const toSubscribe = targetTokens.filter(t => !prevTokens.includes(t));
    const toUnsubscribe = prevTokens.filter(t => !targetTokens.includes(t));

    if (toUnsubscribe.length > 0) {
        console.log(`GlobalTicker: Unsubscribing from ${toUnsubscribe.length} tokens`);
        socketManager.unsubscribe(toUnsubscribe);
    }

    if (toSubscribe.length > 0) {
        console.log(`GlobalTicker: Subscribing to ${toSubscribe.length} tokens`);
        socketManager.subscribe(toSubscribe);
    }
    
    // Update ref
    prevSubscribedRef.current = targetTokens;

    // Register global tick handler (idempotent)
    const GLOBAL_HANDLER_ID = 'GLOBAL_MARKET_STORE';
    socketManager.onTick(GLOBAL_HANDLER_ID, (tick) => {
        setTick(tick);
    });

    // Cleanup not needed for subscriptions (persistence), but maybe handler?
    // User wants persistence, so we keep handler active too.

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, uniqueWatchedTokens.join(','), instruments.length]); // Depend on serialized list and instruments count

};
