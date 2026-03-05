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
import { useAuthStore } from '../store/useAuthStore';
import { useColorMode } from '../context/ThemeContext';
import { authApi } from '../api/auth';
import { useTheme } from '@mui/material/styles';
import CandlestickChartIcon from '@mui/icons-material/CandlestickChart';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import ListItemIcon from '@mui/material/ListItemIcon';
import Divider from '@mui/material/Divider';
import Avatar from '@mui/material/Avatar';
import Tooltip from '@mui/material/Tooltip';
import Logout from '@mui/icons-material/Logout';
import Switch from '@mui/material/Switch';
import React from 'react';
import { useMarketStore } from '../store/useMarketStore';
import { TradingMode } from '../constants';
import type { Instrument } from '../types';

import { usePortfolioStore } from '../store/usePortfolioStore';

const FundsDisplay = () => {
    const { margins, fetchMargins } = usePortfolioStore();
    const isKiteConnected = useAuthStore((state) => state.isKiteConnected);

    React.useEffect(() => {
        if (isKiteConnected) {
            fetchMargins();
        }
    }, [fetchMargins, isKiteConnected]);

    const netMargin = margins?.equity?.net || 0;

    return (
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', mr: 2 }}>
            <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem' }}>Funds</Typography>
             <Typography variant="body2" fontWeight="bold" color="primary">
                {netMargin.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
            </Typography>
        </Box>
    );
};

const IndexTicker = ({ name, token, instruments, staticData }: { name: string, token: number, instruments?: Instrument[], staticData?: { last_price: number } }) => {
    const ticks = useMarketStore((state) => state.ticks);
    const tick = ticks[token];
    const instrument = instruments?.find(i => i.instrument_token === token);
    
    const price = tick?.last_price || instrument?.last_price || staticData?.last_price || 0;
    const change = tick?.change || 0;
    const isPositive = change >= 0;

    if (!token) return null;

    return (
        <Box sx={{ display: 'flex', flexDirection: 'column', mx: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Typography variant="body2" fontWeight="bold">{name}</Typography>
                <Typography variant="caption" sx={{ 
                    color: isPositive ? 'success.main' : 'error.main',
                    fontWeight: 'bold'
                }}>
                    {change.toFixed(2)}%
                </Typography>
            </Box>
            <Typography variant="body2" fontWeight="bold" color={isPositive ? 'success.main' : 'error.main'}>
                {price.toFixed(2)}
            </Typography>
        </Box>
    );
};

const ProfileMenu = ({ 
    mode, 
    toggleTheme, 
    onLogout, 
    userInitial,
    userName,
    tradingMode,
    setTradingMode
}: { 
    mode: 'light' | 'dark', 
    toggleTheme: () => void, 
    onLogout: () => void, 
    userInitial: string,
    userName: string,
    tradingMode: TradingMode,
    setTradingMode: (mode: TradingMode) => void
}) => {
    const navigate = useNavigate();
    const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);
    const open = Boolean(anchorEl);
    
    const handleClick = (event: React.MouseEvent<HTMLElement>) => {
        setAnchorEl(event.currentTarget);
    };
    
    const handleClose = () => {
        setAnchorEl(null);
    };

    const handleTradingModeChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        setTradingMode(event.target.checked ? TradingMode.REAL : TradingMode.MOCK);
    };

    return (
        <React.Fragment>
            <Tooltip title="Account settings">
                <Button
                    onClick={handleClick}
                    size="small"
                    sx={{ ml: 2, textTransform: 'none', color: 'text.primary' }}
                    aria-controls={open ? 'account-menu' : undefined}
                    aria-haspopup="true"
                    aria-expanded={open ? 'true' : undefined}
                    endIcon={<Avatar sx={{ width: 32, height: 32, bgcolor: 'primary.main', fontSize: '0.9rem' }}>{userInitial}</Avatar>}
                >
                    <Typography variant="body2" sx={{ display: { xs: 'none', sm: 'block' }, mr: 1, fontWeight: 600 }}>
                         {userName}
                    </Typography>
                </Button>
            </Tooltip>
            <Menu
                anchorEl={anchorEl}
                id="account-menu"
                open={open}
                onClose={handleClose}
                PaperProps={{
                    elevation: 0,
                    sx: {
                        overflow: 'visible',
                        filter: 'drop-shadow(0px 2px 8px rgba(0,0,0,0.32))',
                        mt: 1.5,
                        minWidth: 200,
                        '& .MuiAvatar-root': {
                            width: 32,
                            height: 32,
                            ml: -0.5,
                            mr: 1,
                        },
                        '&::before': {
                            content: '""',
                            display: 'block',
                            position: 'absolute',
                            top: 0,
                            right: 14,
                            width: 10,
                            height: 10,
                            bgcolor: 'background.paper',
                            transform: 'translateY(-50%) rotate(45deg)',
                            zIndex: 0,
                        },
                    },
                }}
                transformOrigin={{ horizontal: 'right', vertical: 'top' }}
                anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
            >
                <MenuItem onClick={() => { handleClose(); navigate('/profile'); }}>
                    <Avatar /> Profile
                </MenuItem>
                <Divider />
                
                <MenuItem>
                    <ListItemIcon>
                        {mode === 'dark' ? <Brightness7Icon fontSize="small" /> : <Brightness4Icon fontSize="small" />}
                    </ListItemIcon>
                    <Box sx={{ flexGrow: 1 }}>Dark Mode</Box>
                    <Switch 
                        checked={mode === 'dark'} 
                        onChange={toggleTheme}
                        size="small" 
                    />
                </MenuItem>

                <MenuItem>
                    <ListItemIcon>
                        <CandlestickChartIcon fontSize="small" color={tradingMode === TradingMode.REAL ? 'success' : 'action'} />
                    </ListItemIcon>
                    <Box sx={{ flexGrow: 1 }}>Real Trading</Box>
                    <Switch 
                        checked={tradingMode === TradingMode.REAL} 
                        onChange={handleTradingModeChange} 
                        size="small"
                        color="success"
                    />
                </MenuItem>

                <Divider />
                <MenuItem onClick={onLogout}>
                    <ListItemIcon>
                        <Logout fontSize="small" />
                    </ListItemIcon>
                    Logout
                </MenuItem>
            </Menu>
        </React.Fragment>
    );
};

// ─── ADD 'Screener' here — it auto-generates the route /screener ──────────────
const pages = ['Dashboard', 'Holdings', 'Positions', 'Strategies', 'Option Strategies', 'Screener', 'Audit'];

export const Header = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const logout = useAuthStore((state) => state.logout);

  const { mode, toggleColorMode } = useColorMode();
  const theme = useTheme();

  const handleLogout = async () => {
    try {
        await authApi.logout();
    } catch (error) {
        console.error('Logout failed', error);
    } finally {
        logout();
        navigate('/login');
    }
  };

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
            {/* Indices Display */}
            <Box sx={{ display: 'flex', alignItems: 'center', mr: 4, borderRight: 1, borderColor: 'divider', pr: 2 }}>
                <IndexTicker 
                    name="NIFTY 50" 
                    token={256265} 
                    staticData={{ last_price: 0 }}
                />
                <IndexTicker 
                    name="SENSEX" 
                    token={265} 
                    staticData={{ last_price: 0 }} 
                />
            </Box>

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

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, ml: 2 }}>
             <FundsDisplay />

            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Button 
                    variant="contained" 
                    color={useAuthStore((state) => state.isKiteConnected) ? "error" : "primary"}
                    onClick={() => {
                        const isConnected = useAuthStore.getState().isKiteConnected;
                        if (isConnected) {
                            useAuthStore.getState().disconnectKite();
                        } else {
                            const apiKey = import.meta.env.VITE_KITE_API_KEY;
                            if (apiKey) {
                                window.location.href = `https://kite.zerodha.com/connect/login?v=3&api_key=${apiKey}`;
                            } else {
                                console.error('Kite API Key not found');
                                alert('Kite API Key not configured');
                            }
                        }
                    }}
                    size="small"
                >
                    {useAuthStore((state) => state.isKiteConnected) ? 'Disconnect' : 'Connect'}
                </Button>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Box sx={{ 
                        width: 10, 
                        height: 10, 
                        borderRadius: '50%', 
                        bgcolor: useAuthStore((state) => state.isKiteConnected) ? 'success.main' : 'error.main',
                        boxShadow: useAuthStore((state) => state.isKiteConnected) ? '0 0 10px #4caf50' : 'none'
                    }} />
                </Box>
            </Box>
            
            <ProfileMenu 
                mode={mode} 
                toggleTheme={toggleColorMode} 
                onLogout={handleLogout}
                userInitial={useAuthStore((state) => state.kiteProfile?.user_name?.[0] || 'U')}
                userName={useAuthStore((state) => state.kiteProfile?.user_name || 'User')}
                tradingMode={useAuthStore((state) => state.tradingMode)}
                setTradingMode={useAuthStore((state) => state.setTradingMode)}
            />
          </Box>
        </Toolbar>
      </AppBar>
    </Box>
  );
};