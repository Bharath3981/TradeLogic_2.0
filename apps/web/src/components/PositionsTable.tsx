import { useEffect } from 'react';
import { 
    Table, 
    TableBody, 
    TableCell, 
    TableContainer, 
    TableHead, 
    TableRow, 
    Paper, 
    Typography, 
    Box
} from '@mui/material';
import { usePortfolioStore } from '../store/usePortfolioStore';
import { useMarketStore } from '../store/useMarketStore';

interface PositionsTableProps {
    positions?: import('../types').Position[];
    isLoading?: boolean;
}

export const PositionsTable = ({ positions: propPositions, isLoading: propLoading }: PositionsTableProps) => {
    const { positions: storePositions, fetchPositions, isLoading: storeLoading } = usePortfolioStore();
    const ticks = useMarketStore((state) => state.ticks);

    const isPropMode = propPositions !== undefined;
    const displayPositions = isPropMode 
        ? (propPositions || []) 
        : (storePositions.net.length > 0 ? storePositions.net : storePositions.day);
    
    const isLoading = isPropMode ? propLoading : storeLoading;

    useEffect(() => {
        if (!isPropMode) {
            fetchPositions();
        }
    }, [fetchPositions, isPropMode]);



    if (displayPositions.length === 0 && !isLoading) {
        return (
            <Box sx={{ p: 4, textAlign: 'center', color: 'text.secondary', border: '1px solid #e0e0e0', borderRadius: 1, mb: 3 }}>
                <Typography variant="body2">No open positions.</Typography>
            </Box>
        );
    }

    // Calculate Total P&L
    const totalPnL = displayPositions.reduce((acc, pos) => {
        const tick = ticks[pos.instrument_token];
        const ltp = tick ? tick.last_price : pos.last_price;
        const pnl = (ltp - pos.average_price) * pos.quantity;
        return acc + pnl;
    }, 0);

    return (
        <TableContainer component={Paper} elevation={0} sx={{ border: '1px solid #e0e0e0', mb: 3 }}>
            <Box sx={{ p: 2, borderBottom: '1px solid #e0e0e0', bgcolor: 'background.default' }}>
                <Typography variant="h6" fontWeight={600} fontSize="1rem">
                    Positions ({displayPositions.length})
                </Typography>
            </Box>
            <Table sx={{ minWidth: 650, tableLayout: 'fixed' }} size="small" aria-label="positions table">
                <TableHead sx={{ bgcolor: 'secondary.light', opacity: 0.5 }}>
                    <TableRow>
                        <TableCell sx={{ width: '10%' }}>Product</TableCell>
                        <TableCell sx={{ width: '30%' }}>Instrument</TableCell>
                        <TableCell align="right" sx={{ width: '10%' }}>Qty.</TableCell>
                        <TableCell align="right" sx={{ width: '15%' }}>Avg.</TableCell>
                        <TableCell align="right" sx={{ width: '15%' }}>LTP</TableCell>
                        <TableCell align="right" sx={{ width: '20%' }}>P&L</TableCell>
                    </TableRow>
                </TableHead>
                <TableBody>
                    {displayPositions.map((pos) => {
                         const tick = ticks[pos.instrument_token];
                         const ltp = tick ? tick.last_price : pos.last_price;
                         const pnl = (ltp - pos.average_price) * pos.quantity;
                         const isProfit = pnl >= 0;

                        return (
                            <TableRow
                                key={pos.instrument_token + pos.product}
                                sx={{ '&:last-child td, &:last-child th': { border: 0 } }}
                            >
                                <TableCell>
                                    <Typography variant="caption" sx={{ bgcolor: 'action.hover', px: 0.5, py: 0.25, borderRadius: 0.5 }}>
                                        {pos.product}
                                    </Typography>
                                </TableCell>
                                <TableCell>
                                    <Typography variant="body2" fontWeight={500} color={pos.quantity > 0 ? 'primary.main' : 'error.main'}>
                                        {pos.tradingsymbol}
                                    </Typography>
                                    <Typography variant="caption" color="text.secondary">{pos.exchange}</Typography>
                                </TableCell>
                                <TableCell align="right">
                                    <Typography variant="body2" fontWeight={500}>{pos.quantity}</Typography>
                                </TableCell>
                                <TableCell align="right">{pos.average_price.toFixed(2)}</TableCell>
                                <TableCell align="right" sx={{ color: tick ? 'text.primary' : 'text.disabled' }}>
                                    {ltp.toFixed(2)}
                                </TableCell>
                                <TableCell align="right">
                                    <Typography 
                                        variant="body2" 
                                        fontWeight={600} 
                                        color={isProfit ? 'success.main' : 'error.main'}
                                    >
                                        {pnl > 0 ? '+' : ''}{pnl.toFixed(2)}
                                    </Typography>
                                </TableCell>
                            </TableRow>
                        );
                    })}
                    {/* Total P&L Footer Row */}
                    <TableRow sx={{ bgcolor: 'rgba(0, 0, 0, 0.02)' }}>
                        <TableCell colSpan={5} align="right">
                            <Typography variant="subtitle2" fontWeight={600} color="text.secondary">Total P&L</Typography>
                        </TableCell>
                        <TableCell align="right">
                             <Typography 
                                variant="subtitle1" 
                                fontWeight={700} 
                                color={totalPnL >= 0 ? 'success.main' : 'error.main'}
                            >
                                {totalPnL > 0 ? '+' : ''}{totalPnL.toFixed(2)}
                            </Typography>
                        </TableCell>
                    </TableRow>
                </TableBody>
            </Table>
        </TableContainer>
    );
};
