import axios from 'axios';
import { useAuthStore } from '../store/useAuthStore';

// Create Axios instance
const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:9000/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add token
apiClient.interceptors.request.use(
  (config) => {
    const token = useAuthStore.getState().token;
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    const tradingMode = useAuthStore.getState().tradingMode;

    // Force REAL for Instruments, Profile
    if (config.url?.includes('/market/instruments') || config.url?.includes('/portfolio/profile')) {
       config.headers['x-trading-mode'] = 'REAL';
    } 
    // Force MOCK for Watchlist, Audit
    else if (config.url?.includes('/watchlist') || config.url?.includes('/audit')) {
       config.headers['x-trading-mode'] = 'MOCK';
    }
    // Default to User Selection for Orders, Positions, Strategies etc.
    else if (tradingMode) {
      config.headers['x-trading-mode'] = tradingMode;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
apiClient.interceptors.response.use(
  (response) => {
    // Check for business logic errors in 200 OK responses
    if (response.data && response.data.success === false && response.data.error?.code === 'KITE_SESSION_EXPIRED') {
        useAuthStore.getState().disconnectKite();
    }
    return response;
  },
  (error) => {
    if (error.response) {
      const data = error.response.data;
      // Check for specific Kite Session Expired error
      if (data && data.error && data.error.code === 'KITE_SESSION_EXPIRED') {
          useAuthStore.getState().disconnectKite();
      } else if (error.response.status === 401) {
        // Handle unauthorized (e.g., logout)
        useAuthStore.getState().logout();
      } else if (error.response.status === 403) {
         // Generic 403 fallback
         useAuthStore.getState().disconnectKite();
      }
    }
    return Promise.reject(error);
  }
);

export default apiClient;
