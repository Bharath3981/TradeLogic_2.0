import { createBrowserRouter, Navigate } from 'react-router-dom';
import { MainLayout } from '../layout/MainLayout';
import { Login } from '../pages/Login';
import { Register } from '../pages/Register';
import { Dashboard } from '../pages/Dashboard';
import { Holdings } from '../pages/Holdings';
import { Positions } from '../pages/Positions';
import { Profile } from '../pages/Profile';
import { Screener } from '../pages/Screener';
import { ProtectedRoute } from './ProtectedRoute';

export const router = createBrowserRouter([
    {
        path: '/login',
        element: <Login />,
    },
    {
        path: '/register',
        element: <Register />,
    },
    {
        element: <ProtectedRoute />,
        children: [
            {
                element: <MainLayout />,
                children: [
                    {
                        path: '/',
                        element: <Navigate to="/dashboard" replace />,
                    },
                    {
                        path: '/dashboard',
                        element: <Dashboard />,
                    },
                    {
                        path: '/holdings',
                        element: <Holdings />,
                    },
                    {
                        path: '/positions',
                        element: <Positions />,
                    },
                    {
                        path: '/screener',
                        element: <Screener />,
                    },
                    {
                        path: '/profile',
                        element: <Profile />,
                    },
                ],
            },
        ],
    },
]);
