import AppBar from '@mui/material/AppBar';
import Box from '@mui/material/Box';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import MenuIcon from '@mui/icons-material/Menu';
import Brightness4Icon from '@mui/icons-material/Brightness4';
import Brightness7Icon from '@mui/icons-material/Brightness7';
import { useNavigate, useLocation } from 'react-router-dom';
import { useColorMode } from '../context/ThemeContext';
import { useTheme } from '@mui/material/styles';
import CandlestickChartIcon from '@mui/icons-material/CandlestickChart';
import Tooltip from '@mui/material/Tooltip';

const pages = ['Dashboard', 'Screener'];

export const Header = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { mode, toggleColorMode } = useColorMode();
  const theme = useTheme();

  return (
    <Box>
      <AppBar position="static" color="default" enableColorOnDark sx={{
          backgroundColor: theme.palette.background.paper,
          backgroundImage: 'none',
          boxShadow: theme.shadows[1],
          borderRadius: 0
      }}>
        <Toolbar>
          <IconButton
            size="large"
            edge="start"
            color="inherit"
            aria-label="menu"
            sx={{ mr: 2, display: { md: 'none' } }}
          >
            <MenuIcon />
          </IconButton>

          <Box sx={{
              display: 'flex',
              alignItems: 'center',
              mr: 4,
              cursor: 'pointer',
              color: 'primary.main',
              gap: 1
          }} onClick={() => navigate('/')}>
            <CandlestickChartIcon sx={{ fontSize: 32 }} />
            <Typography variant="h5" component="div" sx={{ fontWeight: 'bold' }}>
                TradeLogic
            </Typography>
          </Box>

          <Box sx={{ flexGrow: 1, display: { xs: 'none', md: 'flex' }, justifyContent: 'flex-end', gap: 1 }}>
            {pages.map((page) => {
              const path = `/${page.toLowerCase().replace(/\s+/g, '-')}`;
              const isActive = location.pathname.includes(path);
              return (
              <Button
                key={page}
                onClick={() => navigate(path)}
                sx={{
                    my: 0.5,
                    color: 'text.primary',
                    display: 'block',
                    fontWeight: isActive ? 'bold' : 'normal',
                    backgroundColor: isActive
                        ? (theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.04)')
                        : 'transparent',
                    '&:hover': {
                        backgroundColor: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.08)'
                    }
                }}
              >
                {page}
              </Button>
            )})}
          </Box>

          <Box sx={{ display: 'flex', alignItems: 'center', ml: 2 }}>
            <Tooltip title={mode === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}>
              <IconButton onClick={toggleColorMode} color="inherit">
                {mode === 'dark' ? <Brightness7Icon /> : <Brightness4Icon />}
              </IconButton>
            </Tooltip>
          </Box>
        </Toolbar>
      </AppBar>
    </Box>
  );
};
