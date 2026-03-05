import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  // DialogActions, <-- Removing unused import
  Button,
  Box,
  Typography,
  // Tabs, <-- Removing unused import
  // Tab, <-- Removing unused import
  RadioGroup,
  FormControlLabel,
  Radio,
  TextField,
  Switch,
  IconButton,
  // useTheme  <-- Removing unused import
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import { useOrderStore } from '../store/useOrderStore';
import { useMarketStore } from '../store/useMarketStore';
import type { OrderParams, OrderType, ProductType, Validity } from '../types';

interface OrderFormState {
  quantity: number;
  product: ProductType;
  orderType: OrderType;
  price: number;
  triggerPrice: number;
  validity: Validity;
}

export const OrderDialog = () => {
    // const theme = useTheme(); <-- Removing unused variable
    
    // Store State
    const { 
        dialog: { isOpen, mode, instrument, orderToModify }, 
        isLoading, 
        closeOrderDialog, 
        setDialogMode,
        placeOrder, 
        modifyOrder 
    } = useOrderStore();

    // Live Market Data
    const ticks = useMarketStore((state) => state.ticks);
    const tick = (instrument && ticks[instrument.instrument_token]) || null;
    const displayPrice = tick?.last_price || instrument?.last_price || orderToModify?.price || 0;

    // Local Form State
    const [form, setForm] = useState<OrderFormState>(() => {
        if (orderToModify) {
            return {
                quantity: orderToModify.quantity,
                product: orderToModify.product,
                orderType: orderToModify.order_type,
                price: orderToModify.price || 0,
                triggerPrice: orderToModify.trigger_price || 0,
                validity: orderToModify.validity
            };
        }
        return {
            quantity: instrument?.lot_size || 1,
            product: 'CNC', // Default to CNC (Longterm)
            orderType: 'MARKET',
            price: instrument?.last_price || 0,
            triggerPrice: 0,
            validity: 'DAY'
        };
    });

    // Derived theme colors based on Transaction Type
    const isBuy = mode === 'BUY';
    const mainColor = isBuy ? '#4184f3' : '#ff5722'; // Kite Blue / Orange
    const contrastText = '#ffffff';

    const handleClose = () => closeOrderDialog();

    const handleSubmit = () => {
        if (!instrument && !orderToModify) return;
        
        const payload: OrderParams = {
            exchange: instrument?.exchange || orderToModify!.exchange,
            tradingsymbol: instrument?.tradingsymbol || orderToModify!.tradingsymbol,
            transaction_type: mode,
            quantity: Number(form.quantity),
            product: form.product,
            order_type: form.orderType,
            price: (form.orderType === 'LIMIT' || form.orderType === 'SL') ? Number(form.price) : 0,
            trigger_price: (form.orderType === 'SL' || form.orderType === 'SL-M') ? Number(form.triggerPrice) : 0,
            validity: form.validity
        };

        if (orderToModify) {
            modifyOrder(orderToModify.order_id, payload);
        } else {
            placeOrder(payload);
        }
    };

    if (!isOpen) return null;

    return (
        <Dialog 
            open={isOpen} 
            onClose={handleClose}
            maxWidth="sm"
            fullWidth
            PaperProps={{
                sx: { borderRadius: 2, overflow: 'hidden' }
            }}
        >
            {/* Header */}
            <Box sx={{ 
                bgcolor: mainColor, 
                color: contrastText, 
                p: 2, 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center' 
            }}>
                <Box>
                    <Typography variant="h6" sx={{ fontWeight: 600 }}>
                        {mode} {instrument?.tradingsymbol || orderToModify?.tradingsymbol}
                    </Typography>
                    <Typography variant="caption" sx={{ opacity: 0.9 }}>
                         {instrument?.exchange || orderToModify?.exchange} ₹{displayPrice.toFixed(2)}
                    </Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <Switch 
                        checked={mode === 'SELL'}
                        onChange={(e) => setDialogMode(e.target.checked ? 'SELL' : 'BUY')}
                        color="default" 
                        size="small" 
                    /> 
                    <IconButton size="small" onClick={handleClose} sx={{ color: 'inherit' }}>
                        <CloseIcon />
                    </IconButton>
                </Box>
            </Box>

            {/* Content using Kite-like layout */}
            <Box>
                {/* Visual "Regular" header removed as requested */}

                <DialogContent sx={{ p: 3 }}>
                    {/* Intraday / Longterm Toggles */}
                    <Box sx={{ mb: 3 }}>
                        <RadioGroup 
                            row 
                            value={form.product}
                            onChange={(e) => setForm({ ...form, product: e.target.value as ProductType })}
                        >
                            <FormControlLabel 
                                value="MIS" 
                                control={<Radio size="small" sx={{ '&.Mui-checked': { color: mainColor } }} />} 
                                label={<Typography variant="body2">Intraday <b>MIS</b></Typography>} 
                                sx={{ mr: 4 }}
                            />
                            <FormControlLabel 
                                value="CNC" 
                                control={<Radio size="small" sx={{ '&.Mui-checked': { color: mainColor } }} />} 
                                label={<Typography variant="body2">Longterm <b>CNC</b></Typography>} 
                            />
                        </RadioGroup>
                    </Box>

                    {/* Inputs Row 1: Qty | Price | Trigger */}
                    <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
                        <TextField
                            label="Qty."
                            type="number"
                            size="small"
                            value={form.quantity}
                            onChange={(e) => setForm({ ...form, quantity: Number(e.target.value) })}
                            fullWidth
                        />
                        <TextField
                            label="Price"
                            type="number"
                            size="small"
                            value={form.price}
                            onChange={(e) => setForm({ ...form, price: Number(e.target.value) })}
                            disabled={form.orderType === 'MARKET' || form.orderType === 'SL-M'}
                            fullWidth
                        />
                        <TextField
                            label="Trigger Price"
                            type="number"
                            size="small"
                            value={form.triggerPrice}
                            onChange={(e) => setForm({ ...form, triggerPrice: Number(e.target.value) })}
                            disabled={form.orderType === 'MARKET' || form.orderType === 'LIMIT'}
                            fullWidth
                        />
                    </Box>

                    {/* Order Type Radios */}
                    <Box sx={{ mb: 1 }}>
                         <RadioGroup 
                            row 
                            value={form.orderType}
                            onChange={(e) => setForm({ ...form, orderType: e.target.value as OrderType })}
                            sx={{ display: 'flex', justifyContent: 'space-between' }}
                        >
                            <FormControlLabel 
                                value="MARKET" 
                                control={<Radio size="small" sx={{ '&.Mui-checked': { color: mainColor } }} />} 
                                label={<Typography variant="body2">Market</Typography>} 
                            />
                            <FormControlLabel 
                                value="LIMIT" 
                                control={<Radio size="small" sx={{ '&.Mui-checked': { color: mainColor } }} />} 
                                label={<Typography variant="body2">Limit</Typography>} 
                            />
                             <FormControlLabel 
                                value="SL" 
                                control={<Radio size="small" sx={{ '&.Mui-checked': { color: mainColor } }} />} 
                                label={<Typography variant="body2">SL</Typography>} 
                            />
                             <FormControlLabel 
                                value="SL-M" 
                                control={<Radio size="small" sx={{ '&.Mui-checked': { color: mainColor } }} />} 
                                label={<Typography variant="body2">SL-M</Typography>} 
                            />
                        </RadioGroup>
                    </Box>
                </DialogContent>
                
                {/* Footer / Actions - Dark Bar */}
                <Box sx={{ 
                    bgcolor: 'rgba(0, 0, 0, 0.04)', // Slight contrast for footer
                    p: 2,
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    borderTop: 1,
                    borderColor: 'divider'
                }}>
                    {/* Left: Margin Info */}
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <Typography variant="body2" color="text.secondary">
                            Required 
                            <Box component="span" sx={{ color: mainColor, mx: 0.5 }}>
                                ₹{((form.price || instrument?.last_price || 0) * form.quantity).toFixed(2)}
                            </Box>
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                            Available ₹0.00
                        </Typography>
                    </Box>

                    {/* Right: Actions */}
                    <Box sx={{ display: 'flex', gap: 1 }}>
                        <Button 
                            onClick={handleSubmit} 
                            variant="contained" 
                            disabled={isLoading}
                            sx={{ 
                                bgcolor: mainColor, 
                                px: 4,
                                textTransform: 'none',
                                fontWeight: 600,
                                '&:hover': { bgcolor: isBuy ? '#2a6dd9' : '#e64a19' }
                            }}
                        >
                            {isLoading ? 'Processing...' : (mode === 'BUY' ? 'Buy' : 'Sell')}
                        </Button>
                        <Button 
                            onClick={handleClose} 
                            variant="outlined" 
                            color="inherit"
                            sx={{ 
                                px: 3,
                                textTransform: 'none',
                                borderColor: 'rgba(0, 0, 0, 0.12)',
                                color: 'text.primary'
                            }}
                        >
                            Cancel
                        </Button>
                    </Box>
                </Box>
            </Box>
        </Dialog>
    );
};
