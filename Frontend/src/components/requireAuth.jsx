import React, { useContext } from 'react';
import { Navigate } from 'react-router-dom';
import { AuthContext } from '../components/authcontext';

const RequireAuth = ({ children }) => {
  const { user } = useContext(AuthContext);

  // If user exists, render the child components
  if (user) {
    return children;
  }

  // Otherwise, redirect to register page
  return <Navigate to="/register" replace />;
};

export default RequireAuth;
