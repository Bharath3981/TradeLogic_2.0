import { useEffect, useRef, useState } from 'react';
import type { MarketData } from '../types';

export const useMarketStream = (url: string = 'ws://localhost:8080/ws/market') => {
    const [data, setData] = useState<MarketData | null>(null);
    const [isConnected, setIsConnected] = useState(false);
    const ws = useRef<WebSocket | null>(null);

    useEffect(() => {
        // In a real app, you might want to handle reconnection logic here
        
        // Mocking behavior if no server is running, or trying to connect
        try {
            ws.current = new WebSocket(url);

            ws.current.onopen = () => {
                console.log('Valid WebSocket Connected');
                setIsConnected(true);
            };

            ws.current.onmessage = (event) => {
                try {
                    const parsedData: MarketData = JSON.parse(event.data);
                    setData(parsedData);
                } catch (e) {
                    console.error('Error parsing market data', e);
                }
            };

            ws.current.onclose = () => {
                console.log('WebSocket Disconnected');
                setIsConnected(false);
            };

            ws.current.onerror = (error) => {
                console.error('WebSocket Error', error);
            };
        } catch (e) {
             console.error('WebSocket Connection Failed', e);
        }

        return () => {
            if (ws.current) {
                ws.current.close();
            }
        };
    }, [url]);

    return { data, isConnected };
};
