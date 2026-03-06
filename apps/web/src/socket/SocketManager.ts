import { io, Socket } from 'socket.io-client';
import type { Tick } from '../types';

class SocketManager {
  private static instance: SocketManager;
  private socket: Socket | null = null;
  private subscribers: Map<string, (tick: Tick) => void> = new Map();
  private isConnected: boolean = false;
  private connectionListeners: Set<(connected: boolean) => void> = new Set();
  private activeSubscriptions: Map<number, number> = new Map();
  private currentToken: string | undefined;

  private constructor() {}

  public static getInstance(): SocketManager {
    if (!SocketManager.instance) {
      SocketManager.instance = new SocketManager();
    }
    return SocketManager.instance;
  }

  public connect(url: string = 'http://localhost:9000', token?: string): void {
    if (this.socket?.connected) {
        if (this.currentToken === token) return;
        this.disconnect();
    }

    this.currentToken = token;

    this.socket = io(url, {
      transports: ['websocket'],
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
      auth: { token, tradingMode: 'REAL' },
      extraHeaders: { 'x-trading-mode': 'REAL' }
    });

    this.socket.on('connect', () => {
      this.isConnected = true;
      this.notifyConnectionChange(true);
      this.resubscribeAll();
    });

    this.socket.on('disconnect', () => {
      this.isConnected = false;
      this.notifyConnectionChange(false);
    });

    this.socket.on('tick', (tick: Tick) => {
      this.subscribers.forEach((callback) => callback(tick));
    });

    this.socket.on('connect_error', (err) => {
      if (import.meta.env.DEV) {
        console.error('Socket connection error:', err.message);
      }
    });
  }

  private resubscribeAll() {
      const tokens = Array.from(this.activeSubscriptions.keys());
      if (tokens.length > 0 && this.socket?.connected) {
          this.socket.emit('subscribe', tokens);
      }
  }

  private notifyConnectionChange(connected: boolean) {
      this.connectionListeners.forEach(listener => listener(connected));
  }

  public onConnectionChange(listener: (connected: boolean) => void): () => void {
      this.connectionListeners.add(listener);
      listener(this.isConnected);
      return () => this.connectionListeners.delete(listener);
  }

  public disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.isConnected = false;
      this.notifyConnectionChange(false);
      this.activeSubscriptions.clear();
    }
  }

  public subscribe(tokens: number[]): void {
    if (tokens.length === 0) return;

    const tokensToSubscribe: number[] = [];
    tokens.forEach(token => {
        const count = this.activeSubscriptions.get(token) || 0;
        if (count === 0) tokensToSubscribe.push(token);
        this.activeSubscriptions.set(token, count + 1);
    });

    if (tokensToSubscribe.length > 0 && this.socket?.connected) {
        this.socket.emit('subscribe', tokensToSubscribe);
    }
  }

  public unsubscribe(tokens: number[]): void {
    if (tokens.length === 0) return;

    const tokensToUnsubscribe: number[] = [];
    tokens.forEach(token => {
        const count = this.activeSubscriptions.get(token) || 0;
        if (count > 1) {
             this.activeSubscriptions.set(token, count - 1);
        } else {
             this.activeSubscriptions.delete(token);
             tokensToUnsubscribe.push(token);
        }
    });

    if (tokensToUnsubscribe.length > 0 && this.socket?.connected) {
        this.socket.emit('unsubscribe', tokensToUnsubscribe);
    }
  }

  public onTick(id: string, callback: (tick: Tick) => void): void {
    this.subscribers.set(id, callback);
  }

  public offTick(id: string): void {
    this.subscribers.delete(id);
  }

  public getStatus(): boolean {
    return this.isConnected;
  }
}

export const socketManager = SocketManager.getInstance();
