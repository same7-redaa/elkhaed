import React from 'react';
import { Navigate } from 'react-router-dom';
import { useStore } from '../store/useStore';

interface ProtectedRouteProps {
    children: React.ReactNode;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
    const { currentUser } = useStore();

    if (!currentUser) {
        return <Navigate to="/login" replace />;
    }

    return <>{children}</>;
};
