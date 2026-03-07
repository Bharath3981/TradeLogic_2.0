import React, { useState } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Paper from '@mui/material/Paper';
import TextField from '@mui/material/TextField';
import Autocomplete from '@mui/material/Autocomplete';
import Divider from '@mui/material/Divider';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import IconButton from '@mui/material/IconButton';
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import SettingsIcon from '@mui/icons-material/Settings';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import DragIndicatorIcon from '@mui/icons-material/DragIndicator';
import SyncIcon from '@mui/icons-material/Sync';

import { useTheme } from '@mui/material/styles';
import { useAuthStore } from '../store/useAuthStore';
import { useMarketStore } from '../store/useMarketStore';
import { useOrderStore } from '../store/useOrderStore';
import { marketApi } from '../api/market';
import type { Instrument } from '../types';

// Ticker Component for Sidebar Item
import Tooltip from '@mui/material/Tooltip';
import ShoppingBagOutlinedIcon from '@mui/icons-material/ShoppingBagOutlined';
import SellOutlinedIcon from '@mui/icons-material/SellOutlined';

import {
  DndContext, 
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent
} from '@dnd-kit/core';

import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

const SortableWatchlistItem = ({ 
    token, 
    instruments, 
    onDelete,
    onBuy,
    onSell
}: { 
    token: number, 
    instruments: Instrument[], 
    onDelete: (token: number) => void,
    onBuy: () => void,
    onSell: () => void
}) => {
    const theme = useTheme();
    // ... rest of component logic (no changes inside, just ensuring props are correct)
    // ... rest of component logic (no changes inside, just ensuring props are correct)
    const ticks = useMarketStore((state) => state.ticks);
    const storedWatchlistItems = useMarketStore((state) => state.storedWatchlistItems);
    const tick = ticks[token];
    const instrument = instruments.find(i => Number(i.instrument_token) === token);
    const storedItem = storedWatchlistItems[token];

    const displayName = instrument?.tradingsymbol || storedItem?.tradingsymbol || token;
    const displayExchange = instrument?.exchange || storedItem?.exchange || '';
    const lastPrice = tick?.last_price || instrument?.last_price || storedItem?.lastPrice || 0;

    const price = lastPrice;
    const change = tick?.change || 0;
    const isPositive = change >= 0;

    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging
    } = useSortable({ id: token });

    const style: React.CSSProperties = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
        position: 'relative',
        zIndex: isDragging ? 3 : 1, // Ensure dragging item is on top
    };

    return (
        <ListItem 
            ref={setNodeRef}
            style={style}
            disablePadding
            sx={{ 
                borderBottom: `1px solid ${theme.palette.divider}`,
                height: 48, // Fixed height for consistency
                px: 2,
                cursor: 'pointer',
                bgcolor: theme.palette.background.paper, // Needed for drag view
                '&:hover': {
                    bgcolor: theme.palette.action.hover,
                    '& .actions-overlay': { opacity: 1, pointerEvents: 'auto' }
                }
            }}
        >
             {/* Main Content */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center' }}>
                <Box sx={{ overflow: 'hidden' }}>
                    <Typography variant="body2" sx={{ fontWeight: 500, lineHeight: 1.2 }}>
                        {displayName}
                    </Typography>
                     <Typography variant="caption" sx={{ color: 'text.disabled', fontSize: '0.7rem' }}>
                        {displayExchange}
                    </Typography>
                </Box>
                
                 <Box sx={{ textAlign: 'right' }}>
                    <Typography 
                        variant="body2" 
                        sx={{ 
                            color: isPositive ? 'success.main' : 'error.main',
                            fontWeight: 500,
                            lineHeight: 1.2
                        }}
                    >
                        {price.toFixed(2)}
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', mt: 0.5 }}>
                        <Typography variant="caption" sx={{ color: 'text.secondary', mr: 0.5, lineHeight: 1 }}>
                            {change.toFixed(2)}%
                        </Typography>
                        {isPositive ? 
                            <KeyboardArrowUpIcon sx={{ fontSize: 12, color: 'success.main' }} /> : 
                            <KeyboardArrowDownIcon sx={{ fontSize: 12, color: 'error.main' }} />
                        }
                    </Box>
                </Box>
            </Box>

            {/* Hover Actions Overlay */}
            <Box 
                className="actions-overlay"
                sx={{ 
                    position: 'absolute',
                    right: 86, // Positioned before the price column start
                    top: '50%',
                    transform: 'translateY(-50%)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1,
                    // bgcolor: theme.palette.background.paper, 
                    // Transparent background for cleaner look, relying on the hover row bg
                    zIndex: 2,
                    opacity: 0,
                    pointerEvents: 'none',
                    transition: 'all 0.2s ease-in-out',
                }}
            >
                <Tooltip title="Buy (B)" arrow placement="top">
                    <Box 
                        onClick={(e) => { e.stopPropagation(); onBuy(); }}
                        sx={{ 
                        bgcolor: '#4caf50', 
                        color: 'white', 
                        width: 28, 
                        height: 28, 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'center',
                        borderRadius: 1,
                        cursor: 'pointer',
                        boxShadow: 1,
                        '&:hover': { bgcolor: '#43a047', transform: 'scale(1.1)' }
                    }}>
                        <ShoppingBagOutlinedIcon sx={{ fontSize: 16 }} />
                    </Box>
                </Tooltip>
                
                <Tooltip title="Sell (S)" arrow placement="top">
                    <Box 
                        onClick={(e) => { e.stopPropagation(); onSell(); }}
                        sx={{ 
                        bgcolor: '#ff5722', 
                        color: 'white', 
                        width: 28, 
                        height: 28, 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'center',
                        borderRadius: 1,
                        cursor: 'pointer',
                        boxShadow: 1,
                        '&:hover': { bgcolor: '#f4511e', transform: 'scale(1.1)' }
                    }}>
                        <SellOutlinedIcon sx={{ fontSize: 16 }} />
                    </Box>
                </Tooltip>

                <Tooltip title="Delete" arrow placement="top">
                    <Box sx={{ 
                        bgcolor: theme.palette.grey[300],
                        color: theme.palette.text.primary,
                        width: 28, 
                        height: 28, 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'center',
                        borderRadius: 1,
                        cursor: 'pointer',
                         boxShadow: 1,
                        '&:hover': { bgcolor: theme.palette.error.light, color: 'white', transform: 'scale(1.1)' }
                    }} onClick={(e) => { e.stopPropagation(); onDelete(token); }}>
                        <DeleteOutlineIcon sx={{ fontSize: 18 }} />
                    </Box>
                </Tooltip>

                 <Tooltip title="Drag to reorder" arrow placement="top">
                    <Box 
                        {...attributes}
                        {...listeners}
                        sx={{ 
                            color: 'text.disabled',
                            width: 24, 
                            height: 24, 
                            display: 'flex', 
                            alignItems: 'center', 
                            justifyContent: 'center',
                            cursor: 'grab',
                            '&:hover': { color: 'text.primary' },
                            '&:active': { cursor: 'grabbing' }
                        }}
                    >
                         <DragIndicatorIcon sx={{ fontSize: 18 }} />
                    </Box>
                </Tooltip>
            </Box>
        </ListItem>
    );
};

export const WatchlistSidebar = () => {
    const theme = useTheme();
    const instruments = useAuthStore((state) => state.instruments);
    
    // Global Store State
    const watchlists = useMarketStore((state) => state.watchlists);
    const activeWatchlistId = useMarketStore((state) => state.activeWatchlistId);
    const setActiveWatchlistId = useMarketStore((state) => state.setActiveWatchlistId);
    const addToWatchlist = useMarketStore((state) => state.addToWatchlist);
    const removeFromWatchlist = useMarketStore((state) => state.removeFromWatchlist);
    const fetchWatchlist = useMarketStore((state) => state.fetchWatchlist); // New action
    const openOrderDialog = useOrderStore((state) => state.openOrderDialog);
    const setWatchlist = useMarketStore((state) => state.setWatchlist);

    // Initial Fetch
    React.useEffect(() => {
        fetchWatchlist();
    }, [fetchWatchlist]);

    // Derived state from global store
    const currentTokens = watchlists[activeWatchlistId] || [];

    const [inputValue, setInputValue] = useState('');
    const [isSyncing, setIsSyncing] = React.useState(false);

    const [options, setOptions] = useState<Instrument[]>([]);
    const [loading, setLoading] = useState(false);

    // Restore Sensors
    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 5, 
            }
        }),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    // Debounce Logic
    React.useEffect(() => {
        let active = true;
        const controller = new AbortController();

        if (inputValue === '' || inputValue.length < 2) {
            setOptions([]);
            return undefined;
        }

        const timeoutId = setTimeout(async () => {
            setLoading(true);
            try {
                // Fetch from API with abort signal
                const { data } = await marketApi.searchInstruments(inputValue, controller.signal);
                if (active) {
                    // API returns nested { instruments: [] }
                    setOptions(data.data.instruments || []);
                }
            } catch(e: unknown) { 
                const error = e as { code?: string; name?: string };
                if (error.code === 'ERR_CANCELED' || error.name === 'CanceledError') {
                    // Request canceled, ignore
                } else {
                    console.error(e);
                    if(active) setOptions([]);
                }
            } finally {
                if (active) setLoading(false);
            }
        }, 250);

        return () => {
            active = false;
            controller.abort();
            clearTimeout(timeoutId);
        };
    }, [inputValue]);


    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;

        if (over && active.id !== over.id) {
            const oldIndex = currentTokens.indexOf(Number(active.id));
            const newIndex = currentTokens.indexOf(Number(over.id));

            if (oldIndex !== -1 && newIndex !== -1) {
                const newOrder = arrayMove(currentTokens, oldIndex, newIndex);
                setWatchlist(activeWatchlistId, newOrder);
            }
        }
    };

    const storedWatchlistItems = useMarketStore((state) => state.storedWatchlistItems);

    const getInstrument = (token: number): Instrument | null => {
        // 1. Try finding in full instruments list
        const inst = instruments.find(i => Number(i.instrument_token) === token);
        if (inst) return inst;

        // 2. Fallback to stored items
        const stored = storedWatchlistItems[token];
        if (stored) {
            return {
                instrument_token: Number(stored.instrumentToken),
                exchange_token: stored.exchangeToken,
                tradingsymbol: stored.tradingsymbol,
                name: stored.name || stored.tradingsymbol,
                last_price: stored.lastPrice || 0,
                expiry: stored.expiry || '',
                strike: stored.strike || '0',
                tick_size: stored.tickSize || 0.05,
                lot_size: stored.lotSize || 1,
                instrument_type: stored.instrumentType || 'EQUITY',
                segment: stored.segment || 'NSE',
                exchange: stored.exchange
            };
        }
        return null;
    };


    const handleBuy = (token: number) => {
        const inst = getInstrument(token);
        if (inst) openOrderDialog('BUY', inst);
    };

    const handleSell = (token: number) => {
        const inst = getInstrument(token);
        if (inst) openOrderDialog('SELL', inst);
    };



    const handleAddInstrument = (_event: React.SyntheticEvent, newValue: Instrument | null) => {
        if (newValue) {
            const token = Number(newValue.instrument_token);
            if (currentTokens.length >= 50) {
                alert('Watchlist full (max 50 instruments)');
                return;
            }
            if (!currentTokens.includes(token)) {
                // Pass full instrument object now
                addToWatchlist(activeWatchlistId, newValue);
                setInputValue(''); // Reset search
            }
        }
    };

    const handleDelete = (token: number) => {
        removeFromWatchlist(activeWatchlistId, token);
    }

    return (
        <Paper 
            elevation={0}
            sx={{ 
                width: 380, 
                height: '100%', 
                display: 'flex', 
                flexDirection: 'column',
                borderRight: `1px solid ${theme.palette.divider}`,
                bgcolor: theme.palette.background.paper,
                borderRadius: 0
            }}
        >
            {/* Search Header */}
            <Box sx={{ p: 2, borderBottom: `1px solid ${theme.palette.divider}`, display: 'flex', gap: 1, alignItems: 'center' }}>
                <Autocomplete
                    freeSolo
                    autoHighlight // Enables selecting first option with Enter and improves keyboard nav
                    options={options}
                    getOptionLabel={(option) => typeof option === 'string' ? option : `${option.tradingsymbol}`}
                    filterOptions={(x) => x}
                    onInputChange={(_, newInputValue) => setInputValue(newInputValue)}
                    onChange={(event, newValue) => {
                         if (typeof newValue !== 'string' && newValue) {
                             handleAddInstrument(event, newValue);
                         }
                    }}
                    inputValue={inputValue}
                    value={null} // Keep selection empty so input doesn't stick to selected item label
                    renderInput={(params) => {
                         const { InputProps, ...restParams } = params;
                         return (
                        <TextField 
                            {...restParams} 
                            placeholder={`Search & add (Watchlist ${activeWatchlistId})`}
                            variant="outlined" 
                            size="small"
                            fullWidth
                            slotProps={{
                                input: {
                                    ...InputProps,
                                    startAdornment: (
                                        <Box sx={{ color: 'text.secondary', mr: 1, display: 'flex' }}>
                                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                <circle cx="11" cy="11" r="8"></circle>
                                                <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                                            </svg>
                                        </Box>
                                    )
                                }
                            }}
                        />
                    );}}
                    renderOption={(props, option) => {
                        const { key, ...otherProps } = props;
                         // Handle string vs Instrument type safety for renderOption
                         if (typeof option === 'string') return null;

                        return (
                            <li key={key} {...otherProps}>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
                                    <Typography variant="body2">{option.tradingsymbol}</Typography>
                                    <Typography variant="caption" color="text.secondary">{option.exchange}</Typography>
                                </Box>
                            </li>
                        );
                    }}
                    loading={loading}
                    sx={{ flexGrow: 1 }}
                />
                <Tooltip title={isSyncing ? "Syncing..." : "Sync Instruments"}>
                    <IconButton 
                        size="small" 
                        onClick={async () => {
                            if (isSyncing) return;
                            setIsSyncing(true);
                            try {
                                // Re-using store action which now calls syncInstruments
                                await useAuthStore.getState().fetchInstruments(); 
                            } catch (e) {
                                console.error('Sync Error', e);
                            } finally {
                                setIsSyncing(false);
                            }
                        }}
                        disabled={isSyncing}
                    >
                        <SyncIcon 
                            fontSize="small" 
                            sx={{ 
                                animation: isSyncing ? 'spin 1s linear infinite' : 'none',
                                '@keyframes spin': {
                                    '0%': { transform: 'rotate(0deg)' },
                                    '100%': { transform: 'rotate(360deg)' }
                                }
                            }}
                        />
                    </IconButton>
                </Tooltip>
            </Box>

            {/* List Header Info */}
            <Box sx={{ px: 2, py: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="caption" color="text.secondary">
                    Watchlist {activeWatchlistId} ({currentTokens.length} / 50)
                </Typography>
                <IconButton size="small">
                    <SettingsIcon fontSize="small" />
                </IconButton>
            </Box>
            <Divider />

            {/* Scrollable List */}
            <Box sx={{ flexGrow: 1, overflowY: 'auto' }}>
                {currentTokens.length === 0 ? (
                    <Box sx={{ p: 4, textAlign: 'center' }}>
                        <Typography variant="body2" color="text.secondary">
                            Use the search bar to add instruments.
                        </Typography>
                    </Box>
                ) : (
                    <DndContext 
                        sensors={sensors}
                        collisionDetection={closestCenter}
                        onDragEnd={handleDragEnd}
                    >
                        <SortableContext 
                            items={currentTokens}
                            strategy={verticalListSortingStrategy}
                        >
                            <List disablePadding>
                                {currentTokens.map(token => (
                                    <SortableWatchlistItem 
                                        key={token} 
                                        token={token} 
                                        instruments={instruments} 
                                        onDelete={handleDelete}
                                        onBuy={() => handleBuy(token)}
                                        onSell={() => handleSell(token)}
                                    />
                                ))}
                            </List>
                        </SortableContext>
                    </DndContext>
                )}
            </Box>

            {/* Pagination Footer */}
            <Box sx={{ borderTop: `1px solid ${theme.palette.divider}`, display: 'flex' }}>
                {[1, 2, 3, 4, 5, 6, 7].map(num => (
                    <Box 
                        key={num}
                        onClick={() => setActiveWatchlistId(num)}
                        sx={{ 
                            flex: 1, 
                            py: 1.5, 
                            textAlign: 'center', 
                            cursor: 'pointer',
                            bgcolor: activeWatchlistId === num ? theme.palette.action.selected : 'transparent',
                            borderTop: activeWatchlistId === num ? `2px solid ${theme.palette.primary.main}` : '2px solid transparent',
                            '&:hover': { bgcolor: theme.palette.action.hover }
                        }}
                    >
                        <Typography 
                            variant="caption" 
                            sx={{ 
                                fontWeight: activeWatchlistId === num ? 'bold' : 'normal',
                                color: activeWatchlistId === num ? 'primary.main' : 'text.secondary'
                            }}
                        >
                            {num}
                        </Typography>
                    </Box>
                ))}
            </Box>
        </Paper>
    );
};
