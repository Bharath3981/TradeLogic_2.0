
import { useState, useEffect, useCallback } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Paper from '@mui/material/Paper';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Chip from '@mui/material/Chip';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import Select, { type SelectChangeEvent } from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import SearchIcon from '@mui/icons-material/Search';
import { auditApi } from '../api/audit';
import type { AuditLog, AuditAction, AuditStatus, AuditParams } from '../types';
import { TradingMode } from '../constants';

export const Audit = () => {
    const [logs, setLogs] = useState<AuditLog[]>([]);
    const [loading, setLoading] = useState(false);

    // Filters
    const [action, setAction] = useState<string>('');
    const [status, setStatus] = useState<string>('');
    const [tradeMode, setTradeMode] = useState<string>('');
    const [startDate, setStartDate] = useState<string>('');
    const [endDate, setEndDate] = useState<string>('');

    const fetchLogs = useCallback(async () => {
        setLoading(true);
        try {
            const params: AuditParams = {};
            if (action) params.action = action;
            if (status) params.status = status;
            if (tradeMode) params.tradeMode = tradeMode;
            if (startDate) params.startDate = new Date(startDate).toISOString();
            if (endDate) params.endDate = new Date(endDate).toISOString();

            const response = await auditApi.getAuditLogs(params);
            setLogs(response.data.data || []);
        } catch (error) {
            console.error('Failed to fetch audit logs', error);
        } finally {
            setLoading(false);
        }
    }, [action, status, tradeMode, startDate, endDate]);

    // Initial Fetch
    useEffect(() => {
        fetchLogs();
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    const handleSearch = () => {
        fetchLogs();
    };

    const getActionColor = (action: AuditAction) => {
        switch (action) {
            case 'PLACE_ORDER': return 'primary';
            case 'MODIFY_ORDER': return 'warning';
            case 'CANCEL_ORDER': return 'error';
            default: return 'default';
        }
    };

    const getStatusColor = (status: AuditStatus) => {
        return status === 'SUCCESS' ? 'success' : 'error';
    };

    return (
        <Box sx={{ p: 3 }}>
            <Typography variant="h5" gutterBottom sx={{ fontWeight: 'bold', mb: 3 }}>
                Audit Logs
            </Typography>

            {/* Filter Section */}
            <Paper sx={{ p: 2, mb: 3 }}>
                <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center' }}>
                    <FormControl size="small" sx={{ minWidth: 150 }}>
                        <InputLabel>Action</InputLabel>
                        <Select
                            value={action}
                            label="Action"
                            onChange={(e: SelectChangeEvent) => setAction(e.target.value)}
                        >
                            <MenuItem value="">All</MenuItem>
                            <MenuItem value="PLACE_ORDER">Place Order</MenuItem>
                            <MenuItem value="MODIFY_ORDER">Modify Order</MenuItem>
                            <MenuItem value="CANCEL_ORDER">Cancel Order</MenuItem>
                        </Select>
                    </FormControl>

                    <FormControl size="small" sx={{ minWidth: 150 }}>
                        <InputLabel>Status</InputLabel>
                        <Select
                            value={status}
                            label="Status"
                            onChange={(e: SelectChangeEvent) => setStatus(e.target.value)}
                        >
                            <MenuItem value="">All</MenuItem>
                            <MenuItem value="SUCCESS">Success</MenuItem>
                            <MenuItem value="FAILURE">Failure</MenuItem>
                        </Select>
                    </FormControl>

                    <FormControl size="small" sx={{ minWidth: 150 }}>
                        <InputLabel>Trading Mode</InputLabel>
                        <Select
                            value={tradeMode}
                            label="Trading Mode"
                            onChange={(e: SelectChangeEvent) => setTradeMode(e.target.value)}
                        >
                            <MenuItem value="">All</MenuItem>
                            <MenuItem value={TradingMode.REAL}>Real</MenuItem>
                            <MenuItem value={TradingMode.MOCK}>Mock</MenuItem>
                        </Select>
                    </FormControl>

                    <TextField
                        label="Start Date"
                        type="date"
                        size="small"
                        InputLabelProps={{ shrink: true }}
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                    />

                    <TextField
                        label="End Date"
                        type="date"
                        size="small"
                        InputLabelProps={{ shrink: true }}
                        value={endDate}
                        onChange={(e) => setEndDate(e.target.value)}
                    />

                    <Button 
                        variant="contained" 
                        startIcon={<SearchIcon />} 
                        onClick={handleSearch}
                        disabled={loading}
                    >
                        Search
                    </Button>
                </Box>
            </Paper>

            {/* Logs Table */}
            <TableContainer component={Paper}>
                <Table sx={{ minWidth: 650 }} aria-label="audit table">
                    <TableHead>
                        <TableRow>
                            <TableCell>Time</TableCell>
                            <TableCell>Action</TableCell>
                            <TableCell>Status</TableCell>
                            <TableCell>Trading Mode</TableCell>
                            <TableCell>Changes (Diff)</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {logs.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={5} align="center">
                                    No logs found.
                                </TableCell>
                            </TableRow>
                        ) : (
                            logs.map((log) => (
                                <TableRow key={log.id}>
                                    <TableCell>
                                        {new Date(log.createdAt).toLocaleString()}
                                    </TableCell>
                                    <TableCell>
                                        <Chip 
                                            label={log.action.replace('_', ' ')} 
                                            size="small" 
                                            color={getActionColor(log.action)} 
                                            variant="outlined"
                                        />
                                    </TableCell>
                                    <TableCell>
                                        <Chip 
                                            label={log.status} 
                                            size="small" 
                                            color={getStatusColor(log.status)}
                                        />
                                    </TableCell>
                                    <TableCell>
                                        <Typography variant="body2" color={log.tradeMode === TradingMode.REAL ? 'success.main' : 'warning.main'} fontWeight="bold">
                                            {log.tradeMode}
                                        </Typography>
                                    </TableCell>
                                    <TableCell>
                                        {log.diff ? (
                                            <Box component="pre" sx={{ m: 0, fontSize: '0.75rem', fontFamily: 'monospace' }}>
                                                {JSON.stringify(log.diff, null, 2)}
                                            </Box>
                                        ) : '-'}
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </TableContainer>
        </Box>
    );
};
