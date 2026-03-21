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

  if (!isAuthenticated || !user || !activeRole) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  if (allowedRoles && !allowedRoles.includes(activeRole)) {
    return <Navigate to={`/${activeRole}/dashboard`} replace />;
  }

  return <>{children}</>;
};
