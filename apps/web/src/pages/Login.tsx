import React, { useState } from 'react';
import { AxiosError } from 'axios';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/useAuthStore';
import { authApi } from '../api/auth';
import Box from '@mui/material/Box';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import Container from '@mui/material/Container';
import Paper from '@mui/material/Paper';
import Link from '@mui/material/Link';
import Alert from '@mui/material/Alert';
import { useTheme } from '@mui/material/styles';
import CandlestickChartIcon from '@mui/icons-material/CandlestickChart';

export const Login = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const login = useAuthStore((state) => state.login);
    const navigate = useNavigate();
    const theme = useTheme();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            const response = await authApi.login({ email, password });
            login(response.data.data.user, response.data.data.token);
            navigate('/dashboard');
        } catch (err) {
            const error = err as AxiosError<{ message: string }>;
            setError(error.response?.data?.message || 'Failed to login');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Box sx={{ 
            minHeight: '100vh', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            background: theme.palette.mode === 'dark' ? 'linear-gradient(135deg, #1a237e 0%, #0d47a1 100%)' : 'linear-gradient(135deg, #e3f2fd 0%, #bbdefb 100%)'
        }}>
            <Container component="main" maxWidth="xs">
                <Paper elevation={24} sx={{ 
                    p: 5, 
                    width: '100%', 
                    maxWidth: 400, 
                    borderRadius: 4,
                    backdropFilter: 'blur(10px)',
                    backgroundColor: theme.palette.mode === 'dark' ? 'rgba(30, 30, 30, 0.8)' : 'rgba(255, 255, 255, 0.8)'
                }}>
                    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mb: 3 }}>
                        <Box sx={{ 
                            p: 1.5, 
                            borderRadius: '50%', 
                            bgcolor: 'primary.main', 
                            display: 'flex', 
                            mb: 2,
                            boxShadow: '0 4px 20px rgba(0,0,0,0.2)'
                        }}>
                            <CandlestickChartIcon sx={{ fontSize: 40, color: 'white' }} />
                        </Box>
                        <Typography variant="h4" fontWeight="bold" color="primary">
                            TradeLogic
                        </Typography>
                        <Typography color="text.secondary" sx={{ mt: 1 }}>
                            Welcome back
                        </Typography>
                    </Box>
                    
                    {error && <Alert severity="error" sx={{ width: '100%', mb: 2 }}>{error}</Alert>}

                    <Box component="form" onSubmit={handleSubmit} sx={{ mt: 1, width: '100%' }}>
                        <TextField
                            margin="normal"
                            required
                            fullWidth
                            id="email"
                            label="Email Address"
                            name="email"
                            autoComplete="email"
                            autoFocus
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            sx={{ mb: 2 }}
                        />
                        <TextField
                            margin="normal"
                            required
                            fullWidth
                            name="password"
                            label="Password"
                            type="password"
                            id="password"
                            autoComplete="current-password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            sx={{ mb: 3 }}
                        />
                        <Button
                            type="submit"
                            fullWidth
                            variant="contained"
                            size="large"
                            disabled={loading}
                            sx={{ 
                                mt: 1, 
                                mb: 2, 
                                py: 1.5,
                                fontSize: '1rem',
                                fontWeight: 'bold',
                                textTransform: 'none' 
                            }}
                        >
                            {loading ? 'Signing in...' : 'Sign In'}
                        </Button>
                        <Box sx={{ display: 'flex', justifyContent: 'center' }}>
                            <Link href="/register" variant="body2" sx={{ textDecoration: 'none' }}>
                                {"Don't have an account? Sign Up"}
                            </Link>
                        </Box>
                    </Box>
                </Paper>
            </Container>
        </Box>
    );
};
