import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import '../components/login.css';

const API_URL = 'http://127.0.0.1:8000/api';

const Login = () => {
    // State to hold form data and errors
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const navigate = useNavigate();

    // Function to handle form submission
    const handleLogin = async (e) => {
        e.preventDefault(); // Prevent the form from reloading the page
        setError(''); // Clear any previous errors

        try {
            const payload = {
                username: username,
                password: password,
            };

            // Send the login request to the Django backend
            const response = await axios.post(`${API_URL}/login/`, payload);

            // If the login is successful, the response will contain a token
            if (response.data.token) {
                // Save the token to the browser's local storage
                localStorage.setItem('authToken', response.data.token);
                
                // Redirect the user to their profile page
                navigate('/dash');
            }
        } catch (err) {
            // If the backend returns an error (e.g., wrong password), display it
            if (err.response && err.response.data) {
                setError(err.response.data.error || 'Login failed. Please try again.');
            } else {
                setError('Login failed. Please check your connection or try again later.');
            }
            console.error('Login failed:', err);
        }
    };

    return (
        <div className="tpms-login">
            <div className="login-hero-section">
                <div className="login-content-container">
                    <div className="login-form-wrapper">
                        <div className="login-header">
                            <h2>Welcome Back</h2>
                            <p>Sign in to access your account</p>
                        </div>
                        
                        {/* Add the onSubmit handler to the form */}
                        <form className="login-form" onSubmit={handleLogin}>
                            <div className="form-group">
                                <input 
                                    type="text" 
                                    id="username" 
                                    placeholder="Enter your username" 
                                    value={username} // Bind value to state
                                    onChange={(e) => setUsername(e.target.value)} // Update state on change
                                    required 
                                />
                            </div>
                            
                            <div className="form-group">
                                <input 
                                    type="password" 
                                    id="password" 
                                    placeholder="Enter your password" 
                                    value={password} // Bind value to state
                                    onChange={(e) => setPassword(e.target.value)} // Update state on change
                                    required 
                                />
                            </div>
                            
                            {/* Conditionally display the error message */}
                            {error && <p className="error-text">{error}</p>}

                            <div className="form-options">
                                <Link to="/forgot-password" className="forgot-password">Forgot password?</Link>
                            </div>
                            
                            <button type="submit" className="login-button">Login</button>
                            
                            <div className="signup-redirect">
                                New to TPMS? <Link to="/register" className="signup-link">Create account</Link>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Login;