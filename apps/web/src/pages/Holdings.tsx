import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import { HoldingsTable } from '../components/HoldingsTable';
import { usePortfolioStore } from '../store/usePortfolioStore';

export const Holdings = () => {
    const { holdings } = usePortfolioStore();

    return (
        <Box sx={{ px: 3, pb: 3, pt: 3, maxWidth: 1200, mx: 'auto' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 4 }}>
                <Typography variant="h5" sx={{ fontWeight: 'normal' }}>
                    Holdings ({holdings.length})
                </Typography>
            </Box>
            
            <Box>
                <HoldingsTable />
            </Box>
        </Box>
    );
};
