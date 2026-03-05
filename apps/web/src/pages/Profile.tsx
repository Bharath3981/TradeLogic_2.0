import { Box, Typography, Paper, Grid, Chip, Avatar, Divider, Stack } from '@mui/material';
import { useAuthStore } from '../store/useAuthStore';

export const Profile = () => {
    const user = useAuthStore((state) => state.user);
    const kiteProfile = useAuthStore((state) => state.kiteProfile);

    return (
        <Box sx={{ px: 3, pb: 3, pt: 3 }}>
            <Typography variant="h4" gutterBottom sx={{ fontWeight: 'bold', mb: 4 }}>
                User Profile
            </Typography>

            <Grid container spacing={3}>
                {/* Basic Info Card */}
                <Grid size={{ xs: 12, md: 6 }}>
                    <Paper sx={{ p: 4, height: '100%', borderRadius: 2 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 4 }}>
                            <Avatar 
                                src={kiteProfile?.avatar_url || undefined} 
                                sx={{ width: 80, height: 80, mr: 3, bgcolor: 'primary.main', fontSize: '2rem' }}
                            >
                                {kiteProfile?.user_shortname?.[0] || user?.name?.[0]}
                            </Avatar>
                            <Box>
                                <Typography variant="h5" fontWeight="bold">
                                    {kiteProfile?.user_name || user?.name}
                                </Typography>
                                <Typography variant="body1" color="text.secondary">
                                    {kiteProfile?.email || user?.email}
                                </Typography>
                                <Chip 
                                    label={kiteProfile?.user_type || 'User'} 
                                    size="small" 
                                    color="primary" 
                                    variant="outlined" 
                                    sx={{ mt: 1 }} 
                                />
                            </Box>
                        </Box>
                        
                        <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                            User ID
                        </Typography>
                        <Typography variant="body1" fontWeight="medium" gutterBottom>
                            {kiteProfile?.user_id || 'N/A'}
                        </Typography>

                        <Divider sx={{ my: 2 }} />

                         <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                            Broker
                        </Typography>
                        <Typography variant="body1" fontWeight="medium">
                            {kiteProfile?.broker || 'Internal'}
                        </Typography>
                    </Paper>
                </Grid>

                {/* Trading Info Card */}
                {kiteProfile && (
                    <Grid size={{ xs: 12, md: 6 }}>
                        <Paper sx={{ p: 4, height: '100%', borderRadius: 2 }}>
                            <Typography variant="h6" fontWeight="bold" gutterBottom>
                                Trading Preferences
                            </Typography>
                            
                            <Box sx={{ mb: 3 }}>
                                <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                                    Exchanges
                                </Typography>
                                <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                                {kiteProfile.exchanges.map((ex) => (
                                    <Chip key={ex} label={ex} size="small" />
                                ))}
                                </Stack>
                            </Box>

                            <Box sx={{ mb: 3 }}>
                                <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                                    Products
                                </Typography>
                                <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                                {kiteProfile.products.map((prod) => (
                                    <Chip key={prod} label={prod} size="small" color="info" variant="outlined" /> 
                                ))}
                                </Stack>
                            </Box>

                            <Box>
                                <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                                    Order Types
                                </Typography>
                                <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                                {kiteProfile.order_types.map((type) => (
                                    <Chip key={type} label={type} size="small" variant="outlined" />
                                ))}
                                </Stack>
                            </Box>
                        </Paper>
                    </Grid>
                )}
            </Grid>
        </Box>
    );
};
