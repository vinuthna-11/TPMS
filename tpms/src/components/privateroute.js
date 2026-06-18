// src/components/PrivateRoute.js
import React from 'react';
import { Navigate } from 'react-router-dom';

const PrivateRoute = ({ children }) => {
    const isLoggedIn = !!localStorage.getItem('authToken');

    if (!isLoggedIn) {
        // If the user is not logged in, redirect them to the login page
        return <Navigate to="/login" />;
    }

    // If the user is logged in, show the page they requested
    return children;
};

export default PrivateRoute;