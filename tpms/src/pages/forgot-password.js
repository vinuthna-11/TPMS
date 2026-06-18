import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import '../components/forgot-password.css'; // Import the new CSS

const API_URL = 'http://127.0.0.1:8000/api';

const ForgotPassword = () => {
    const [step, setStep] = useState(1);
    const [email, setEmail] = useState('');
    const [otp, setOtp] = useState('');
    const [password, setPassword] = useState('');
    const [passwordConfirm, setPasswordConfirm] = useState('');
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');
    const navigate = useNavigate();

    const handleRequestOTP = async (e) => {
        e.preventDefault();
        setMessage('');
        setError('');
        try {
            await axios.post(`${API_URL}/password-reset/request/`, { email });
            setMessage('An OTP has been sent. Please check your inbox or spam.');
            setStep(2);
        } catch (err) {
            setError('An error occurred. Please try again.');
            console.error('OTP Request failed:', err);
        }
    };

    const handleConfirmReset = async (e) => {
        e.preventDefault();
        if (password !== passwordConfirm) {
            setError('Passwords do not match.');
            return;
        }
        setError('');
        setMessage('');
        try {
            const payload = { email, otp, password };
            await axios.post(`${API_URL}/password-reset/confirm/`, payload);
            setMessage('Your password has been reset successfully! Redirecting to login...');
            setTimeout(() => navigate('/login'), 3000);
        } catch (err) {
            setError(err.response?.data?.error || 'Failed to reset password. The OTP may be invalid or expired.');
            console.error('Password Reset failed:', err);
        }
    };

    return (
        <div className="forgot-password-page">
            {/* --- Hero Section --- */}
            <section className="forgot-password-hero">
                <div className="hero-content">
                    <h1>Account Recovery</h1>
                    <p>Enter your email to regain access to your account.</p>
                </div>
            </section>

            {/* --- Form Container --- */}
            <div className="forgot-password-container">
                {step === 1 ? (
                    // --- FORM FOR STEP 1 ---
                    <form className="forgot-password-form" onSubmit={handleRequestOTP}>
                        <div className="form-header">
                            <h2 className="form-title">Forgot Password</h2>
                            <p className="form-subtitle">We'll send a recovery code to your email.</p>
                        </div>
                        <div className="form-group">
                            <label>Email</label>
                            <input
                                type="email"
                                className="form-control"
                                placeholder="Enter your email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                            />
                        </div>
                        {message && <p className="success-text">{message}</p>}
                        {error && <p className="error-text">{error}</p>}
                        <button type="submit" className="btn btn-primary">Send Recovery Code</button>
                    </form>
                ) : (
                    // --- FORM FOR STEP 2 ---
                    <form className="forgot-password-form" onSubmit={handleConfirmReset}>
                        <div className="form-header">
                            <h2 className="form-title">Reset Your Password</h2>
                            <p className="form-subtitle">If an account with this email exists, an OTP has been sent to <strong>{email}</strong>.</p>
                        </div>
                        <div className="form-group">
                            <label>Verification Code</label>
                            <input
                                type="text"
                                className="form-control"
                                placeholder="Enter 6-Digit OTP"
                                value={otp}
                                onChange={(e) => setOtp(e.target.value)}
                                maxLength="6"
                                required
                            />
                        </div>
                         <div className="form-group">
                            <label>New Password</label>
                            <input
                                type="password"
                                className="form-control"
                                placeholder="Enter new password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                            />
                        </div>
                         <div className="form-group">
                            <label>Confirm New Password</label>
                            <input
                                type="password"
                                className="form-control"
                                placeholder="Confirm new password"
                                value={passwordConfirm}
                                onChange={(e) => setPasswordConfirm(e.target.value)}
                                required
                            />
                        </div>
                        {message && <p className="success-text">{message}</p>}
                        {error && <p className="error-text">{error}</p>}
                        <button type="submit" className="btn btn-primary">Reset Password</button>
                    </form>
                )}
            </div>
        </div>
    );
};

export default ForgotPassword;