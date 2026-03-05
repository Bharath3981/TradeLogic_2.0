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
    Chip,
    IconButton,
    Tooltip,
    Box
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import CancelIcon from '@mui/icons-material/Cancel';
import { useOrderStore } from '../store/useOrderStore';
import type { Order, OrderStatus } from '../types';

const StatusChip = ({ status }: { status: OrderStatus }) => {
    let color: 'default' | 'primary' | 'secondary' | 'error' | 'info' | 'success' | 'warning' = 'default';
    switch (status) {
        case 'COMPLETE': color = 'success'; break;
        case 'REJECTED': color = 'error'; break;
        case 'CANCELLED': color = 'default'; break;
        case 'OPEN': color = 'info'; break; 
        case 'PENDING': color = 'warning'; break;
    }
    // Denser, smaller chip
    return <Chip label={status} size="small" color={color} variant="outlined" sx={{ height: 20, fontSize: '0.65rem', fontWeight: 600 }} />;
};

export const OrdersTable = () => {
    const { orders, fetchOrders, cancelOrder, openOrderDialog } = useOrderStore();

    useEffect(() => {
        fetchOrders();
    }, [fetchOrders]);

    const handleModify = (order: Order) => {
        openOrderDialog(
            order.transaction_type, 
            { 
                instrument_token: order.instrument_token || 0,
                tradingsymbol: order.tradingsymbol,
                exchange: order.exchange,
                last_price: order.price || 0,
            } as unknown as import('../types').Instrument, 
            order
        );
    };

    // If no orders, styled empty state
    if (orders.length === 0) {
        return (
            <Box sx={{ p: 3, textAlign: 'center', color: 'text.secondary', border: '1px solid #e0e0e0', borderRadius: 1 }}>
                <Typography variant="body2">No orders placed today.</Typography>
            </Box>
        );
    }

    return (
        <TableContainer component={Paper} elevation={0} sx={{ border: '1px solid #e0e0e0' }}>
            <Box sx={{ p: 2, borderBottom: '1px solid #e0e0e0', bgcolor: 'background.default' }}>
                <Typography variant="h6" fontWeight={600} fontSize="1rem">Orders</Typography>
            </Box>
            <Table sx={{ minWidth: 650 }} size="small" aria-label="orders table">
                <TableHead sx={{ bgcolor: 'secondary.light', opacity: 0.5 }}>
                    <TableRow>
                        <TableCell>Time</TableCell>
                        <TableCell>Type</TableCell>
                        <TableCell>Instrument</TableCell>
                        <TableCell>Product</TableCell>
                        <TableCell align="right">Qty.</TableCell>
                        <TableCell align="right">LTP / Price</TableCell>
                        <TableCell align="center">Status</TableCell>
                        <TableCell align="right"></TableCell>
                    </TableRow>
                </TableHead>
                <TableBody>
                    {orders.map((order) => (
                        <TableRow
                            key={order.order_id}
                            hover
                            sx={{ '&:last-child td, &:last-child th': { border: 0 } }}
                        >
                            <TableCell component="th" scope="row" sx={{ fontSize: '0.75rem', color: 'text.secondary' }}>
                                {order.order_timestamp ? new Date(order.order_timestamp).toLocaleTimeString() : '--'}
                            </TableCell>
                            <TableCell>
                                <Typography 
                                    sx={{ 
                                        color: order.transaction_type === 'BUY' ? 'primary.main' : 'error.main', 
                                        fontWeight: 600,
                                        fontSize: '0.75rem',
                                        bgcolor: order.transaction_type === 'BUY' ? 'rgba(65, 132, 243, 0.1)' : 'rgba(255, 87, 34, 0.1)',
                                        px: 0.5, py: 0.25, borderRadius: 0.5,
                                        display: 'inline-block'
                                    }}
                                >
                                    {order.transaction_type}
                                </Typography>
                                <Typography component="span" variant="caption" sx={{ ml: 1, color: 'text.secondary' }}>{order.order_type}</Typography>
                            </TableCell>
                            <TableCell>
                                <Typography variant="body2" fontWeight={500} fontSize="0.85rem">{order.tradingsymbol}</Typography>
                                <Typography variant="caption" color="text.secondary">{order.exchange}</Typography>
                            </TableCell>
                            <TableCell>
                                <Typography variant="caption" sx={{ border: '1px solid', borderColor: 'divider', px: 0.5, borderRadius: 0.5 }}>
                                    {order.product}
                                </Typography>
                            </TableCell>
                            <TableCell align="right" sx={{ fontSize: '0.85rem' }}>{order.filled_quantity} / {order.quantity}</TableCell>
                            <TableCell align="right" sx={{ fontSize: '0.85rem' }}>{order.price || 'MKT'}</TableCell>
                            <TableCell align="center">
                                <StatusChip status={order.status} />
                                {order.status_message && (
                                    <Tooltip title={order.status_message}>
                                         <Typography variant="caption" display="block" color="error" sx={{ cursor:'help', fontSize: '0.6rem', mt: 0.5, maxWidth: 100, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', mx: 'auto' }}>
                                            {order.status_message}
                                        </Typography>
                                    </Tooltip>
                                )}
                            </TableCell>
                            <TableCell align="right">
                                {['OPEN', 'PENDING'].includes(order.status) && (
                                    <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                                        <Tooltip title="Modify">
                                            <IconButton size="small" onClick={() => handleModify(order)} sx={{ p: 0.5 }}>
                                                <EditIcon fontSize="small" color="primary" sx={{ fontSize: '1rem' }} />
                                            </IconButton>
                                        </Tooltip>
                                        <Tooltip title="Cancel">
                                            <IconButton size="small" onClick={() => cancelOrder(order.order_id)} sx={{ p: 0.5 }}>
                                                <CancelIcon fontSize="small" color="error" sx={{ fontSize: '1rem' }} />
                                            </IconButton>
                                        </Tooltip>
                                    </Box>
                                )}
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </TableContainer>
    );
};
