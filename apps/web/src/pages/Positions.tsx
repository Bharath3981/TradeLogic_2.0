import { useState, useEffect } from 'react';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogTitle from '@mui/material/DialogTitle';
import Typography from '@mui/material/Typography';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import MenuItem from '@mui/material/MenuItem';
import Select, { type SelectChangeEvent } from '@mui/material/Select';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import DeleteIcon from '@mui/icons-material/Delete';
import { PositionsTable } from '../components/PositionsTable';
import { ordersApi } from '../api/orders';
import { portfolioApi } from '../api/portfolio';
import { strategiesApi } from '../api/strategies';
import { usePortfolioStore } from '../store/usePortfolioStore';
import { useOrderStore } from '../store/useOrderStore';
import type { Strategy, Position } from '../types';

export const Positions = () => {
    const [confirmDialog, setConfirmDialog] = useState<{
        open: boolean;
        type: 'CLEAR_ORDERS' | 'CLEAR_POSITIONS' | null;
    }>({ open: false, type: null });
    
    const [loading, setLoading] = useState(false);
    const [tabValue, setTabValue] = useState(0);

    // Strategy positions state
    const [strategies, setStrategies] = useState<Strategy[]>([]);
    const [selectedStrategyId, setSelectedStrategyId] = useState<string>('');
    // const [strategyPositions, setStrategyPositions] = useState<Position[]>([]); // Removed local state
    const [loadingStrategies, setLoadingStrategies] = useState(false);
    const [loadingStrategyPositions, setLoadingStrategyPositions] = useState(false);


    // Get store actions to refresh data after clear
    const { 
        strategyPositions, 
        fetchPositions, 
        setStrategyPositions 
    } = usePortfolioStore();

    const fetchOrders = useOrderStore((state) => state.fetchOrders);

    // Fetch strategies on mount
    useEffect(() => {
        const loadStrategies = async () => {
             setLoadingStrategies(true);
             try {
                 const { data } = await strategiesApi.getStrategies();
                 const strategyList = data.data || [];
                 setStrategies(strategyList);
                 
                 // Default select first strategy
                 if (strategyList.length > 0) {
                     setSelectedStrategyId(strategyList[0].id);
                 }
             } catch (err) {
                 console.error("Failed to load strategies", err);
             } finally {
                 setLoadingStrategies(false);
             }
        };
        loadStrategies();
    }, []);

    // Fetch strategy positions when selected strategy changes
    useEffect(() => {
        const loadStrategyPositions = async () => {
            if (!selectedStrategyId) return;

            setLoadingStrategyPositions(true);
            try {
                // Determine if API is available. Assuming api added as per previous step.
                // Assuming strategiesApi.getStrategyPositions exists and returns { data: Position[] }
                 
                // Define API response shape
                interface StrategyPositionApiData {
                    id: string;
                    runId: string;
                    leg: string;
                    strike: number;
                    expiryDate: string;
                    instrumentToken: string;
                    instrument_token?: string | number; // Fallback
                    tradingsymbol: string;
                    exchange: string;
                    qty: number;
                    quantity?: number; // Fallback
                    entryPrice: string;
                    average_price?: string | number; // Fallback
                    exitPrice: string | null;
                    status: string;
                    openedAt: string;
                }

                const response = await strategiesApi.getStrategyPositions(selectedStrategyId);

                // Safe cast based on API client return type
                const rawData = (response as unknown as { data: { data: StrategyPositionApiData[] } }).data;
                const apiPositions = Array.isArray(rawData) ? rawData : (rawData?.data || []);

                console.log('StrategyPositions: Raw API Data:', apiPositions);

                // Map to Position type
                const mappedPositions: Position[] = apiPositions.map((apiPos: StrategyPositionApiData) => {
                    const token = apiPos.instrumentToken || apiPos.instrument_token;
                    const parsedToken = typeof token === 'string' ? parseInt(token, 10) : token;
                    
                    const price = apiPos.entryPrice || apiPos.average_price || 0;
                    const parsedPrice = typeof price === 'string' ? parseFloat(price) : Number(price);
                    
                    const qty = apiPos.qty || apiPos.quantity || 0;

                    return {
                        tradingsymbol: apiPos.tradingsymbol,
                        exchange: apiPos.exchange,
                        instrument_token: Number(parsedToken),
                        product: 'MIS', // Default, or derive if available
                        quantity: qty,
                        overnight_quantity: 0,
                        multiplier: 1,
                        average_price: parsedPrice,
                        close_price: 0,
                        last_price: parsedPrice, // Initial value, will update with ticks
                        value: 0, // Calculated
                        pnl: 0,   // Calculated
                        m2m: 0,
                        unrealised: 0,
                        realised: 0,
                        buy_quantity: qty, // Assuming buy?
                        buy_price: parsedPrice,
                        buy_value: 0,
                        sell_quantity: 0,
                        sell_price: 0,
                        sell_value: 0,
                        day_buy_quantity: 0,
                        day_buy_price: 0,
                        day_buy_value: 0,
                        day_sell_quantity: 0,
                        day_sell_price: 0,
                        day_sell_value: 0,
                    };
                });

                setStrategyPositions(mappedPositions);
            } catch (err) {
                console.error("Failed to load strategy positions", err);
                setStrategyPositions([]);
            } finally {
                setLoadingStrategyPositions(false);
            }
        };

        if (tabValue === 1) {
            loadStrategyPositions();
        }
    }, [selectedStrategyId, tabValue, setStrategyPositions]);


    const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
        setTabValue(newValue);
    };

    const handleStrategyChange = (event: SelectChangeEvent) => {
        setSelectedStrategyId(event.target.value as string);
    };

    const handleClearOrdersClick = () => {
        setConfirmDialog({ open: true, type: 'CLEAR_ORDERS' });
    };

    const handleClearPositionsClick = () => {
        setConfirmDialog({ open: true, type: 'CLEAR_POSITIONS' });
    };

    const handleCloseDialog = () => {
        setConfirmDialog({ open: false, type: null });
    };

    const handleConfirmAction = async () => {
        const { type } = confirmDialog;
        if (!type) return;

        setLoading(true);
        try {
            if (type === 'CLEAR_ORDERS') {
                await ordersApi.clearOrders();
                // Refresh orders if we were on orders page, but maybe just for consistency
                // Note: Positions page doesn't show orders, but good to refresh store if used elsewhere
                fetchOrders();
            } else if (type === 'CLEAR_POSITIONS') {
                await portfolioApi.clearPositions();
                fetchPositions(); // Critical: Refresh positions table
            }
        } catch (error) {
            console.error(`Failed to ${type}`, error);
            // Optionally show error toast
        } finally {
            setLoading(false);
            setConfirmDialog({ open: false, type: null });
        }
    };

    return (
        <Box sx={{ px: 3, pb: 3, pt: 3, maxWidth: 1200, mx: 'auto' }}>
            
            {/* Page Header with Actions */}
            <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="h5" fontWeight={600}>
                    Portfolio
                </Typography>
                <Box sx={{ display: 'flex', gap: 2 }}>
                     <Button 
                        variant="outlined" 
                        color="error" 
                        startIcon={<DeleteIcon />}
                        onClick={handleClearOrdersClick}
                        disabled={loading}
                    >
                        Clear Orders
                    </Button>
                    <Button 
                        variant="contained" 
                        color="error" 
                        startIcon={<DeleteIcon />}
                        onClick={handleClearPositionsClick}
                        disabled={loading}
                    >
                        Clear Positions
                    </Button>
                </Box>
            </Box>

             <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
                <Tabs value={tabValue} onChange={handleTabChange} aria-label="positions tabs">
                    <Tab label="All Positions" />
                    <Tab label="Strategy Positions" />
                </Tabs>
            </Box>

            {/* Tab 1: All Positions */}
            <div role="tabpanel" hidden={tabValue !== 0}>
                {tabValue === 0 && (
                     <Box>
                        <PositionsTable />
                    </Box>
                )}
            </div>

            {/* Tab 2: Strategy Positions */}
             <div role="tabpanel" hidden={tabValue !== 1}>
                {tabValue === 1 && (
                    <Box>
                         <Box sx={{ mb: 3, maxWidth: 300 }}>
                            <FormControl fullWidth size="small">
                                <InputLabel id="strategy-select-label">Select Strategy</InputLabel>
                                <Select
                                    labelId="strategy-select-label"
                                    id="strategy-select"
                                    value={selectedStrategyId}
                                    label="Select Strategy"
                                    onChange={handleStrategyChange}
                                    disabled={loadingStrategies}
                                >
                                    {strategies.map((strategy) => (
                                        <MenuItem key={strategy.id} value={strategy.id}>
                                            {strategy.name || strategy.id}
                                        </MenuItem>
                                    ))}
                                    {strategies.length === 0 && !loadingStrategies && (
                                         <MenuItem disabled value="">
                                            No strategies found
                                        </MenuItem>
                                    )}
                                </Select>
                            </FormControl>
                        </Box>
                        
                        <PositionsTable 
                            positions={strategyPositions} 
                            isLoading={loadingStrategyPositions} 
                        />
                    </Box>
                )}
            </div>

            {/* Confirmation Dialog */}
            <Dialog
                open={confirmDialog.open}
                onClose={handleCloseDialog}
            >
                <DialogTitle>
                    {confirmDialog.type === 'CLEAR_ORDERS' ? 'Clear All Orders?' : 'Clear All Positions?'}
                </DialogTitle>
                <DialogContent>
                    <DialogContentText>
                        {confirmDialog.type === 'CLEAR_ORDERS' 
                            ? 'Are you sure you want to delete all trade orders? This action cannot be undone.'
                            : 'Are you sure you want to delete all positions? This action cannot be undone.'
                        }
                    </DialogContentText>
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleCloseDialog} color="inherit" disabled={loading}>
                        Cancel
                    </Button>
                    <Button onClick={handleConfirmAction} color="error" autoFocus disabled={loading}>
                        {loading ? 'Clearing...' : 'Clear'}
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};
