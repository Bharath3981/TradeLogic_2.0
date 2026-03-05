import { io, Socket } from 'socket.io-client';
import type { Tick } from '../types';

class SocketManager {
  private static instance: SocketManager;
  private socket: Socket | null = null;
  private subscribers: Map<string, (tick: Tick) => void> = new Map();
  private isConnected: boolean = false;

  private connectionListeners: Set<(connected: boolean) => void> = new Set();

  private constructor() {}

  public static getInstance(): SocketManager {
    if (!SocketManager.instance) {
      SocketManager.instance = new SocketManager();
    }
    return SocketManager.instance;
  }

  // Track subscriptions with reference counting to handle multiple components asking for same token
  private activeSubscriptions: Map<number, number> = new Map();
  private currentToken: string | undefined;

  public connect(url: string = 'http://localhost:9000', token?: string): void {
    if (this.socket?.connected) {
        if (this.currentToken === token) return; // Already connected with same token
        
        console.log('SocketManager: Token changed, reconnecting...');
        this.disconnect(); // Disconnect to reconnect with new token
    }

    this.currentToken = token; // Update current token

    this.socket = io(url, {
      transports: ['websocket'], // Force websocket to avoid polling issues
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
      auth: {
        token: token,
        tradingMode: 'REAL'
      },
      extraHeaders: {
        'x-trading-mode': 'REAL'
      }
    });

    this.socket.on('connect', () => {
      console.log('SocketConnected:', this.socket?.id);
      this.isConnected = true;
      this.notifyConnectionChange(true);
      this.resubscribeAll();
    });

    this.socket.on('disconnect', () => {
      console.log('SocketDisconnected');
      this.isConnected = false;
      this.notifyConnectionChange(false);
    });

    this.socket.on('tick', (tick: Tick) => {
      // console.log('SocketManager: Tick received:', tick); // Verbose logging (optional)
      this.subscribers.forEach((callback) => callback(tick));
    });
    
    this.socket.on('connect_error', (err) => {
      console.error('Socket connection error details:', { message: err.message, name: err.name, stack: err.stack });
    });
  }

  private resubscribeAll() {
      const tokens = Array.from(this.activeSubscriptions.keys());
      if (tokens.length > 0 && this.socket?.connected) {
          console.log('Resubscribing to all active tokens:', tokens);
          this.socket.emit('subscribe', tokens);
      }
  }

  private notifyConnectionChange(connected: boolean) {
      this.connectionListeners.forEach(listener => listener(connected));
  }

  public onConnectionChange(listener: (connected: boolean) => void): () => void {
      this.connectionListeners.add(listener);
      // Immediately notify current status
      listener(this.isConnected);
      return () => this.connectionListeners.delete(listener);
  }

  public disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.isConnected = false;
      this.isConnected = false;
      this.notifyConnectionChange(false);
      this.activeSubscriptions.clear(); // Clear all subscriptions on disconnect
    }
  }

  public subscribe(tokens: number[]): void {
    if (tokens.length === 0) return;
    
    const tokensToSubscribe: number[] = [];
    tokens.forEach(token => {
        const count = this.activeSubscriptions.get(token) || 0;
        if (count === 0) {
            tokensToSubscribe.push(token);
        }
        this.activeSubscriptions.set(token, count + 1);
    });

    if (tokensToSubscribe.length > 0 && this.socket?.connected) {
        console.log('Subscribing to:', tokensToSubscribe);
        this.socket.emit('subscribe', tokensToSubscribe);
    } else if (tokensToSubscribe.length > 0) {
         console.log('Queuing subscription (socket not connected):', tokensToSubscribe);
         // They will be picked up by resubscribeAll on connect
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
        console.log('Unsubscribing from:', tokensToUnsubscribe);
        this.socket.emit('unsubscribe', tokensToUnsubscribe);
    }
  }

  // Simple subscription mechanism for components to listen to all ticks
  // In a real app, you might filter by token for efficient updates
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
