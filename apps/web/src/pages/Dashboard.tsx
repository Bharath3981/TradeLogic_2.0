import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Paper from '@mui/material/Paper';
import { useTheme } from '@mui/material/styles';

export const Dashboard = () => {
    const theme = useTheme();

    return (
        <Box sx={{ px: 3, pb: 3, pt: 3 }}>
            <Box sx={{ mb: 4 }}>
                <Typography variant="h4" gutterBottom sx={{ fontWeight: 'bold' }}>
                    Dashboard
                </Typography>
                <Typography variant="subtitle1" color="text.secondary">
                    Welcome back, Trader
                </Typography>
            </Box>

            <Paper sx={{
                p: 6,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                minHeight: 400,
                textAlign: 'center',
                background: theme.palette.mode === 'dark' ? 'rgba(30, 30, 30, 0.4)' : 'rgba(255, 255, 255, 0.4)',
                backdropFilter: 'blur(10px)',
                border: '1px dashed',
                borderColor: 'divider'
            }}>
                <Typography variant="h3" fontWeight="bold" color="text.secondary" gutterBottom>
                    Coming Soon
                </Typography>
                <Typography variant="body1" color="text.secondary" sx={{ maxWidth: 400 }}>
                    We are working hard to bring you the best trading experience.
                    Stay tuned for advanced analytics and portfolio tracking features!
                </Typography>
            </Paper>
        </Box>
    );
};
