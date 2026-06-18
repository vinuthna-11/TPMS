// src/components/PublicRoute.js
import React from 'react';
import { Navigate } from 'react-router-dom';

const PublicRoute = ({ children }) => {
    const isLoggedIn = !!localStorage.getItem('authToken');

    if (isLoggedIn) {
        // If the user is already logged in, redirect them to their profile
        return <Navigate to="/login" />;
    }

    // If the user is not logged in, show the page they requested
    return children;
};

export default PublicRoute;