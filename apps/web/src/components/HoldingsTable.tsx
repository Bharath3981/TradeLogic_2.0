
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
    Box,
    LinearProgress,
    useTheme,
    alpha
} from '@mui/material';
import { usePortfolioStore } from '../store/usePortfolioStore';
import { useMarketStore } from '../store/useMarketStore';


export const HoldingsTable = () => {
    const { holdings, fetchHoldings, isLoading } = usePortfolioStore();
    const ticks = useMarketStore((state) => state.ticks);
    const theme = useTheme();
    
    useEffect(() => {
        fetchHoldings();
    }, [fetchHoldings]);

    // Calculate Totals
    let totalInvestment = 0;
    let currentValue = 0;
    let totalDayPnL = 0;

    holdings.forEach((pos) => {
        const tick = ticks[pos.instrument_token];
        const ltp = tick ? tick.last_price : pos.last_price;
        const invested = pos.average_price * pos.quantity;
        const current = ltp * pos.quantity;
        const dayChange = tick ? (tick.change || 0) : 0;
        
        totalInvestment += invested;
        currentValue += current;
        
        const prevClose = ltp / (1 + dayChange / 100);
        totalDayPnL += (ltp - prevClose) * pos.quantity;
    });

    const totalPnL = currentValue - totalInvestment;
    const totalPnLPercent = totalInvestment > 0 ? (totalPnL / totalInvestment) * 100 : 0;
    const totalDayPnLPercent = (currentValue - totalDayPnL) > 0 ? (totalDayPnL / (currentValue - totalDayPnL)) * 100 : 0;

    const formatCurrency = (val: number) => {
        return val.toLocaleString('en-IN', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        });
    };

    if (isLoading && holdings.length === 0) {
        return <LinearProgress />;
    }

    if (holdings.length === 0 && !isLoading) {
        return (
             <Box sx={{ 
                 p: 4, 
                 textAlign: 'center', 
                 color: 'text.secondary', 
                 border: 1, 
                 borderColor: 'divider', 
                 borderRadius: 1, 
                 mb: 3, 
                 bgcolor: 'background.paper' 
             }}>
                <Typography variant="body2">No holdings found.</Typography>
            </Box>
        );
    }

    return (
        <Box>
            {/* Header Summary Stats */}
            <Box sx={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                mb: 3, 
                px: 0 
            }}>
                <Box>
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>Total investment</Typography>
                    <Typography variant="h5" sx={{ fontSize: '1.5rem', fontWeight: 500 }}>
                        {formatCurrency(totalInvestment)}
                    </Typography>
                </Box>
                <Box>
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>Current value</Typography>
                    <Typography variant="h5" sx={{ fontSize: '1.5rem', fontWeight: 500 }}>
                        {formatCurrency(currentValue)}
                    </Typography>
                </Box>
                <Box>
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>Day's P&L</Typography>
                    <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 1 }}>
                         <Typography variant="h5" sx={{ fontSize: '1.5rem', fontWeight: 500 }} color={totalDayPnL >= 0 ? 'success.main' : 'error.main'}>
                            {totalDayPnL >= 0 ? '+' : ''}{formatCurrency(totalDayPnL)}
                        </Typography>
                        <Typography variant="body2" sx={{ fontWeight: 500 }} color={totalDayPnL >= 0 ? 'success.main' : 'error.main'}>
                             {totalDayPnL >= 0 ? '+' : ''}{totalDayPnLPercent.toFixed(2)}%
                        </Typography>
                    </Box>
                </Box>
                <Box>
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>Total P&L</Typography>
                    <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 1 }}>
                        <Typography variant="h5" sx={{ fontSize: '1.5rem', fontWeight: 500 }} color={totalPnL >= 0 ? 'success.main' : 'error.main'}>
                            {totalPnL >= 0 ? '+' : ''}{formatCurrency(totalPnL)}
                        </Typography>
                        <Typography variant="body2" sx={{ fontWeight: 500 }} color={totalPnL >= 0 ? 'success.main' : 'error.main'}>
                             {totalPnL >= 0 ? '+' : ''}{totalPnLPercent.toFixed(2)}%
                        </Typography>
                    </Box>
                </Box>
            </Box>

            {/* Table */}
            <TableContainer component={Paper} sx={{ bgcolor: 'transparent', backgroundImage: 'none', boxShadow: 'none' }}>
                <Table sx={{ minWidth: 800, borderCollapse: 'separate', borderSpacing: '0' }} size="small" aria-label="holdings table">
                    <TableHead>
                        <TableRow sx={{ 
                            '& th': { 
                                borderBottom: 1, 
                                borderColor: 'divider',
                                color: 'text.secondary',
                                fontSize: '0.75rem',
                                fontWeight: 400,
                                py: 1,
                                textTransform: 'uppercase',
                                letterSpacing: '0.02em'
                            } 
                        }}>
                            <TableCell>Instrument</TableCell>
                            <TableCell align="right">Qty.</TableCell>
                            <TableCell align="right">Avg. cost</TableCell>
                            <TableCell align="right">LTP</TableCell>
                            <TableCell align="right">Invested</TableCell>
                            <TableCell align="right">Cur. val</TableCell>
                            <TableCell align="right">P&L</TableCell>
                            <TableCell align="right">Net chg.</TableCell>
                            <TableCell align="right">Day chg.</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {holdings.map((pos) => {
                             const tick = ticks[pos.instrument_token];
                             const ltp = tick ? tick.last_price : pos.last_price;
                             const invested = pos.average_price * pos.quantity;
                             const currentVal = ltp * pos.quantity;
                             const pnl = currentVal - invested;
                             const netChangePercent = pos.average_price > 0 ? ((ltp - pos.average_price) / pos.average_price) * 100 : 0;
                             const dayChangePercent = tick ? tick.change || 0 : 0;
                             
                             return (
                                <TableRow
                                    key={pos.instrument_token}
                                    sx={{ 
                                        '& td': { 
                                            borderBottom: 1,
                                            borderColor: alpha(theme.palette.divider, 0.1),
                                            fontSize: '0.85rem',
                                            py: 1.2,
                                            color: 'text.primary'
                                        },
                                        '&:last-child td': { borderBottom: 0 },
                                        '&:hover': { bgcolor: 'action.hover' },
                                        cursor: 'pointer'
                                    }}
                                >
                                    <TableCell component="th" scope="row">
                                        <Typography variant="body2" sx={{ fontWeight: 500, color: 'text.primary' }}>
                                            {pos.tradingsymbol}
                                        </Typography>
                                        <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: '0.7rem' }}>
                                            {pos.exchange}
                                        </Typography>
                                    </TableCell>
                                    <TableCell align="right">{pos.quantity}</TableCell>
                                    <TableCell align="right">{pos.average_price.toFixed(2)}</TableCell>
                                    <TableCell align="right" sx={{ color: tick ? 'text.primary' : 'text.disabled' }}>
                                        {ltp.toFixed(2)}
                                    </TableCell>
                                    <TableCell align="right">{formatCurrency(invested)}</TableCell>
                                    <TableCell align="right">{formatCurrency(currentVal)}</TableCell>
                                    <TableCell align="right" sx={{ color: pnl >= 0 ? 'success.main' : 'error.main', fontWeight: 500 }}>
                                        {pnl.toFixed(2)}
                                    </TableCell>
                                    <TableCell align="right" sx={{ color: netChangePercent >= 0 ? 'success.main' : 'error.main' }}>
                                        {netChangePercent.toFixed(2)}%
                                    </TableCell>
                                    <TableCell align="right" sx={{ color: dayChangePercent >= 0 ? 'success.main' : 'error.main' }}>
                                        {dayChangePercent.toFixed(2)}%
                                    </TableCell>
                                </TableRow>
                            );
                        })}
                    </TableBody>
                </Table>
            </TableContainer>
        </Box>
    );
};
