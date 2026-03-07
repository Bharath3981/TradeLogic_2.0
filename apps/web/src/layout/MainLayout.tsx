import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { Header } from '../components/Header';
import { WatchlistSidebar } from '../components/WatchlistSidebar';
import { OrderDialog } from '../components/OrderDialog';
import { authApi } from '../api/auth';
import Box from '@mui/material/Box';
import CssBaseline from '@mui/material/CssBaseline';

import { useEffect } from 'react';
import { useAuthStore } from '../store/useAuthStore';
import { useOrderStore } from '../store/useOrderStore';
import { usePortfolioStore } from '../store/usePortfolioStore';
 
import { useGlobalTicker } from '../hooks/useKiteTicker';

export const MainLayout = () => {
  const kiteSession = useAuthStore((state) => state.kiteSession);
  const fetchKiteProfile = useAuthStore((state) => state.fetchKiteProfile);
  // const fetchInstruments = useAuthStore((state) => state.fetchInstruments);
  
  // Initialize Global Ticker Subscription
  useGlobalTicker();

  // Additional hooks for callback handling
  const setKiteSession = useAuthStore((state) => state.setKiteSession);
  const location = useLocation();
  const navigate = useNavigate();

  // Handle Kite Connect Callback (Global Check)
  useEffect(() => {
      const params = new URLSearchParams(location.search);
      const requestToken = params.get('request_token');

      if (requestToken) {
          console.log('MainLayout: Found request_token, initiating callback...');
          const handleCallback = async () => {
              try {
                  const response = await authApi.kiteCallback({ request_token: requestToken });
                  console.log('MainLayout: Kite callback success', response.data);
                  
                  // Set session (triggers global fetches via the other effect)
                  setKiteSession(response.data); 
                  
                  // Clean URL
                  navigate(location.pathname, { replace: true });
              } catch (error) {
                  console.error('MainLayout: Failed to handle Kite callback', error);
                  // Optionally show duplicate login error if already used
              }
          };
          handleCallback();
      }
  }, [location.search, navigate, setKiteSession, location.pathname]);



  // Global Data Fetch Effect (+ Watchlist Init)
  useEffect(() => {
    console.log('MainLayout Effect: Checking Session', { kiteSession });
    if (kiteSession) {
      console.log('MainLayout Effect: Triggering Global Fetches');
      fetchKiteProfile();
      usePortfolioStore.getState().fetchPositions(); // Fetch positions globally
      // fetchInstruments(); // Disabled: Manual sync only
    }
  }, [kiteSession, fetchKiteProfile]);
  


  const isOrderDialogOpen = useOrderStore((state) => state.dialog.isOpen);

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden' }}>
      <CssBaseline />
      <Header />
      {isOrderDialogOpen && <OrderDialog />}
      
      {/* Main Workspace Area (Sidebar + Content) */}
      <Box sx={{ display: 'flex', flexGrow: 1, overflow: 'hidden' }}>
          
          {/* Fixed Left Sidebar */}
          <Box sx={{ flexShrink: 0, zIndex: 10 }}>
              <WatchlistSidebar />
          </Box>

          {/* Scrollable Right Content */}
          <Box component="main" sx={{ flexGrow: 1, overflowY: 'auto', bgcolor: 'background.default' }}>
              <Outlet />
          </Box>
      </Box>
    </Box>
  );
};
