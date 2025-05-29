import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import useAuth from '../../hooks/useAuth';

// Component to protect routes that require authentication
const ProtectedRoute = ({ 
  children, 
  requiredRole = null, 
  redirectPath = '/login' 
}) => {
  const { isLoggedIn, userRole, loading } = useAuth();
  
  // If still loading, show a loading indicator
  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600"></div>
      </div>
    );
  }
  
  // Check if user is logged in
  if (!isLoggedIn) {
    return <Navigate to={redirectPath} replace />;
  }
  
  // Check if a specific role is required
  if (requiredRole && userRole !== requiredRole) {
    return <Navigate to="/dashboard" replace />;
  }
  
  // Render the children or the Outlet (for nested routes)
  return children ? children : <Outlet />;
};

export default ProtectedRoute; 