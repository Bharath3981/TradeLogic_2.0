import { useState } from 'react';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogTitle from '@mui/material/DialogTitle';
import Typography from '@mui/material/Typography';
import DeleteIcon from '@mui/icons-material/Delete';
import { PositionsTable } from '../components/PositionsTable';
import { ordersApi } from '../api/orders';
import { portfolioApi } from '../api/portfolio';
import { usePortfolioStore } from '../store/usePortfolioStore';
import { useOrderStore } from '../store/useOrderStore';

export const Positions = () => {
    const [confirmDialog, setConfirmDialog] = useState<{
        open: boolean;
        type: 'CLEAR_ORDERS' | 'CLEAR_POSITIONS' | null;
    }>({ open: false, type: null });

    const [loading, setLoading] = useState(false);

    const { fetchPositions } = usePortfolioStore();
    const fetchOrders = useOrderStore((state) => state.fetchOrders);

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
                fetchOrders();
            } else if (type === 'CLEAR_POSITIONS') {
                await portfolioApi.clearPositions();
                fetchPositions();
            }
        } catch (error) {
            console.error(`Failed to ${type}`, error);
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

            <PositionsTable />

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
