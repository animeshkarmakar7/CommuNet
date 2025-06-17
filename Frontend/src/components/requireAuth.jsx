import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from './authcontext'; // Adjust path as needed

const RequireAuth = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return <div>Loading...</div>; // Or your loading component
  }

  if (!user) {
    return <Navigate to="/register" replace />;
  }

  return children;
};

export default RequireAuth;
