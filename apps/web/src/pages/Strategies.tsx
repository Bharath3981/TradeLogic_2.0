import { useEffect, useState } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Paper from '@mui/material/Paper';
import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogTitle from '@mui/material/DialogTitle';
import Alert from '@mui/material/Alert';
import { useTheme } from '@mui/material/styles';
import { strategiesApi } from '../api/strategies';
import type { Strategy } from '../types';

export const Strategies = () => {
    const theme = useTheme();
    const [strategies, setStrategies] = useState<Strategy[]>([]);
    const [loading, setLoading] = useState<boolean>(false);
    const [running, setRunning] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);

    useEffect(() => {
        fetchStrategies();
    }, []);

    const fetchStrategies = async () => {
        try {
            setLoading(true);
            const response = await strategiesApi.getStrategies();
            // Handle different potential response structures
            const data = (response.data as { data: Strategy[] }).data || response.data;
            if (Array.isArray(data)) {
                setStrategies(data as Strategy[]);
            } else {
                setStrategies([]);
                console.warn('Unexpected strategies response format:', response.data);
            }
        } catch (err: unknown) {
            console.error('Failed to fetch strategies:', err);
            setError('Failed to load strategies');
        } finally {
            setLoading(false);
        }
    };

    const [confirmDialog, setConfirmDialog] = useState<{
        open: boolean;
        type: 'DELETE_STRATEGY' | 'DELETE_HISTORY' | null;
        id: string | null;
    }>({ open: false, type: null, id: null });

    const handleRunStrategy = async (strategyId: string) => {
        try {
            setRunning(true);
            setError(null);
            setSuccessMessage(null);
            await strategiesApi.runStrategy(strategyId);
            setSuccessMessage('Strategy executed successfully');
        } catch (err: unknown) {
            console.error('Failed to run strategy:', err);
            const errorMessage = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Failed to run strategy';
            setError(errorMessage);
        } finally {
            setRunning(false);
        }
    };

    const handleDeleteClick = (strategyId: string) => {
        setConfirmDialog({ open: true, type: 'DELETE_STRATEGY', id: strategyId });
    };

    const handleDeleteHistoryClick = (strategyId: string) => {
        setConfirmDialog({ open: true, type: 'DELETE_HISTORY', id: strategyId });
    };

    const handleConfirmAction = async () => {
        const { type, id } = confirmDialog;
        if (!id || !type) return;
        
        try {
            setLoading(true);
            if (type === 'DELETE_STRATEGY') {
                await strategiesApi.deleteStrategy(id);
                setSuccessMessage('Strategy deleted successfully');
                fetchStrategies(); 
            } else if (type === 'DELETE_HISTORY') {
                await strategiesApi.deleteExecutionHistory(id);
                setSuccessMessage('Execution history deleted successfully');
            }
        } catch (err: unknown) {
            console.error(`Failed to ${type === 'DELETE_STRATEGY' ? 'delete strategy' : 'clear history'}:`, err);
            const errorMessage = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || `Failed to ${type === 'DELETE_STRATEGY' ? 'delete strategy' : 'clear history'}`;
            setError(errorMessage);
        } finally {
            setLoading(false);
            setConfirmDialog({ open: false, type: null, id: null });
        }
    };

    const handleCloseDialog = () => {
        setConfirmDialog({ open: false, type: null, id: null });
    };

    return (
        <Box sx={{ px: 3, pb: 3, pt: 3 }}>
            <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="h4" gutterBottom sx={{ fontWeight: 'bold' }}>
                    Strategies
                </Typography>
                <Button variant="contained" onClick={fetchStrategies} disabled={loading}>
                    Refresh
                </Button>
            </Box>

            {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
            {successMessage && <Alert severity="success" sx={{ mb: 2 }}>{successMessage}</Alert>}

            <TableContainer component={Paper} elevation={0} sx={{ border: '1px solid', borderColor: 'divider' }}>
                <Table sx={{ minWidth: 650 }} aria-label="strategies table">
                    <TableHead sx={{ bgcolor: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.04)' }}>
                        <TableRow>
                            <TableCell>Name</TableCell>
                            <TableCell>Description</TableCell>
                            <TableCell>ID</TableCell>
                             <TableCell align="right">Actions</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {loading && strategies.length === 0 ? (
                             <TableRow>
                                <TableCell colSpan={4} align="center" sx={{ py: 3 }}>
                                    <CircularProgress size={24} />
                                </TableCell>
                            </TableRow>
                        ) : strategies.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={4} align="center" sx={{ py: 3 }}>
                                    <Typography variant="body2" color="text.secondary">No strategies found</Typography>
                                </TableCell>
                            </TableRow>
                        ) : (
                            strategies.map((strategy) => (
                                <TableRow
                                    key={strategy.id}
                                    sx={{ '&:last-child td, &:last-child th': { border: 0 } }}
                                >
                                    <TableCell component="th" scope="row">
                                        <Typography variant="body2" fontWeight={600}>
                                            {strategy.name || 'Untitled Strategy'}
                                        </Typography>
                                    </TableCell>
                                    <TableCell>
                                        <Typography variant="body2" color="text.secondary">
                                            {strategy.description || '-'}
                                        </Typography>
                                    </TableCell>
                                    <TableCell>
                                        <Typography variant="caption" fontFamily="monospace" color="text.disabled">
                                            {strategy.id}
                                        </Typography>
                                    </TableCell>
                                    <TableCell align="right">
                                        <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
                                            <Button 
                                                variant="contained" 
                                                size="small" 
                                                color="success"
                                                onClick={() => handleRunStrategy(strategy.id)}
                                                disabled={running}
                                            >
                                                Run
                                            </Button>
                                            <Button 
                                                variant="outlined" 
                                                size="small" 
                                                color="warning"
                                                onClick={() => handleDeleteHistoryClick(strategy.id)}
                                                disabled={running}
                                            >
                                                History
                                            </Button>
                                            <Button 
                                                variant="outlined" 
                                                size="small" 
                                                color="error"
                                                onClick={() => handleDeleteClick(strategy.id)}
                                                disabled={running}
                                            >
                                                Delete
                                            </Button>
                                        </Box>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </TableContainer>

            {/* Confirmation Dialog */}
            <Dialog
                open={confirmDialog.open}
                onClose={handleCloseDialog}
                aria-labelledby="alert-dialog-title"
                aria-describedby="alert-dialog-description"
            >
                <DialogTitle id="alert-dialog-title">
                    {confirmDialog.type === 'DELETE_STRATEGY' ? "Confirm Delete Strategy" : "Confirm Clear History"}
                </DialogTitle>
                <DialogContent>
                    <DialogContentText id="alert-dialog-description">
                        {confirmDialog.type === 'DELETE_STRATEGY' 
                            ? "Are you sure you want to delete this strategy? This action cannot be undone."
                            : "Are you sure you want to clear the execution history for this strategy? This action cannot be undone."
                        }
                    </DialogContentText>
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleCloseDialog} color="inherit">
                        Cancel
                    </Button>
                    <Button onClick={handleConfirmAction} color="error" autoFocus>
                        {confirmDialog.type === 'DELETE_STRATEGY' ? "Delete" : "Clear"}
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};
