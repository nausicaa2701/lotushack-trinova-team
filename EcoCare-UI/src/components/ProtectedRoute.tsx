import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth, type UserRole } from '../auth/AuthContext';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: UserRole[];
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, allowedRoles }) => {
  const { isAuthenticated, user, activeRole } = useAuth();
  const location = useLocation();

  // Prevent redirect loops by checking if we're already on a dashboard
  const isDashboard = location.pathname.includes('/dashboard');

  if (!isAuthenticated || !user || !activeRole) {
    // Only redirect if not already on login page
    if (location.pathname !== '/login') {
      return <Navigate to="/login" replace state={{ from: location.pathname }} />;
    }
    return null;
  }

  if (allowedRoles && !allowedRoles.includes(activeRole)) {
    // Prevent redirect loop
    const targetPath = `/${activeRole}/dashboard`;
    if (location.pathname === targetPath) {
      return <>{children}</>;
    }
    return <Navigate to={targetPath} replace />;
  }

  return <>{children}</>;
};
