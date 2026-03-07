import { Outlet } from 'react-router-dom';
import { Header } from '../components/Header';
import Box from '@mui/material/Box';
import CssBaseline from '@mui/material/CssBaseline';

export const MainLayout = () => {
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden' }}>
      <CssBaseline />
      <Header />
      <Box component="main" sx={{ flexGrow: 1, overflowY: 'auto', bgcolor: 'background.default' }}>
        <Outlet />
      </Box>
    </Box>
  );
};
