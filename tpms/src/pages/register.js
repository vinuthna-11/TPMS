// src/pages/Register.js

import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import '../components/registerSteps.css';

const API_URL = 'http://127.0.0.1:8000/api';

const Register = () => {
    const [step, setStep] = useState(1);
    const [formData, setFormData] = useState({
        username: '',
        email: '',
        password: '',
        confirmPassword: '',
        firstName: '',
        lastName: '',
        address: '',
        dob: '',
        phone: '',
        gender: '',
        role: '',
    });

    const [errors, setErrors] = useState({});
    const [otp, setOtp] = useState('');
    const [otpError, setOtpError] = useState('');
    const [timer, setTimer] = useState(60);
    const [success, setSuccess] = useState(false);
    
    // 1. ADD a new state for loading
    const [isLoading, setIsLoading] = useState(false);

    const navigate = useNavigate();

    // Input change handler
    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    // Step navigation
    const nextStep = () => setStep(step + 1);
    const prevStep = () => setStep(step - 1);

    // Step 1: Frontend Validation
    const validateStep1 = () => {
        const newErrors = {};
        let isValid = true;

        if (!formData.username) {
            newErrors.username = 'Username is required';
            isValid = false;
        } else if (formData.username.length < 4) {
            newErrors.username = 'Username must be at least 4 characters';
            isValid = false;
        }

        if (!formData.email) {
            newErrors.email = 'Email is required';
            isValid = false;
        } else if (!/^\S+@\S+\.\S+$/.test(formData.email)) {
            newErrors.email = 'Please enter a valid email';
            isValid = false;
        }

        if (!formData.password) {
            newErrors.password = 'Password is required';
            isValid = false;
        } else if (formData.password.length < 8) {
            newErrors.password = 'Password must be at least 8 characters';
            isValid = false;
        }

        if (formData.password !== formData.confirmPassword) {
            newErrors.confirmPassword = 'Passwords do not match';
            isValid = false;
        }

        setErrors(newErrors);
        return isValid;
    };
    
    // Step 1: API Call to Send OTP
    const sendOTP = async () => {
        setErrors({}); // Clear previous backend errors
        setIsLoading(true); // 2. SET loading to true at the start
        try {
            const payload = {
                username: formData.username,
                email: formData.email,
                password: formData.password,
                first_name: formData.firstName,
                last_name: formData.lastName
            };
            await axios.post(`${API_URL}/register/`, payload);
            nextStep(); // Move to next step on success
        } catch (error) {
            if (error.response && error.response.data) {
                setErrors(error.response.data); // Set errors from backend
            } else {
                console.error('Registration failed:', error.message);
                alert('An unexpected error occurred.');
            }
        } finally {
            setIsLoading(false); // 2. SET loading to false at the end (always)
        }
    };
    
    // Step 2: OTP Timer
    useEffect(() => {
        if (step === 2 && timer > 0) {
            const interval = setInterval(() => {
                setTimer((prev) => prev - 1);
            }, 1000);
            return () => clearInterval(interval);
        }
    }, [step, timer]);

    const handleOtpChange = (e) => {
        const value = e.target.value.replace(/\D/g, '');
        setOtp(value.slice(0, 6));
        setOtpError('');
    };
    
    // Step 2: API Call to Verify OTP
    const verifyOTP = async () => {
        if (otp.length !== 6) {
            setOtpError('Please enter a 6-digit code');
            return;
        }
        try {
            const payload = { email: formData.email, otp: otp };
            const response = await axios.post(`${API_URL}/verify-otp/`, payload);
            if (response.data.token) {
                localStorage.setItem('authToken', response.data.token);
                nextStep();
            }
        } catch (error) {
            setOtpError('Invalid or expired OTP.');
        }
    };

    // Step 2: API Call to Resend OTP
    const resendOTP = async () => {
        if (timer > 0) return;
        setOtpError('');
        setOtp('');
        try {
            const payload = {
                username: formData.username,
                email: formData.email,
                password: formData.password,
                first_name: formData.firstName,
                last_name: formData.lastName
            };
            await axios.post(`${API_URL}/register/`, payload);
            setTimer(60); // Restart the timer
        } catch (error) {
            alert('Failed to resend OTP.');
        }
    };
    
    // Step 3: API Call to Submit Final Profile
    const handleSubmit = async () => {
        const token = localStorage.getItem('authToken');
        if (!token) {
            alert('Authentication error. Please log in again.');
            return;
        }
        try {
            const profileData = {
                gender: formData.gender,
                role: formData.role === 'Job Provider' ? 'recruiter' : 'job_seeker',
                phone_number: formData.phone, // Map 'phone' to 'phone_number'
                address: formData.address,
                dob: formData.dob,
                skills: formData.skills,
            };

            await axios.patch(`${API_URL}/complete-profile/`, profileData, {
                headers: { 'Authorization': `Token ${token}` }
            });
            
            localStorage.removeItem('authToken');
            setSuccess(true);
            setTimeout(() => navigate('/login'), 3000);
        } catch (error) {
            alert('Failed to complete your profile.');
            console.error('Profile completion failed:', error.response ? error.response.data : error.message);
        }
    };

    return (
        <div className="register-page">
            <section className="register-hero">
                <div className="hero-content">
                    <h1>Showcase Your Talent</h1>
                    <p>Connect with the best opportunities and grow your career with a community that values your skills and creativity.</p>
                </div>
            </section>

            {success ? (
                <div className="success-screen">
                    <div className="checkmark">✔</div>
                    <h2>Registration Successful!</h2>
                    <p>Redirecting to login...</p>
                </div>
            ) : (
                <div className="register-form-container">
                    <div className="register-form">
                        <div className="progress-steps">
                            <div className={`step ${step >= 1 ? 'active' : ''} ${step > 1 ? 'completed' : ''}`}>
                                <span>1</span>
                                <div className="step-label">Account</div>
                            </div>
                            <div className={`step ${step >= 2 ? 'active' : ''} ${step > 2 ? 'completed' : ''}`}>
                                <span>2</span>
                                <div className="step-label">Verify</div>
                            </div>
                            <div className={`step ${step >= 3 ? 'active' : ''}`}>
                                <span>3</span>
                                <div className="step-label">Profile</div>
                            </div>
                        </div>

                        {step === 1 && (
                            <div className="step-content">
                                <div className="step-header">
                                    <h2 className="form-title">Create Your Account</h2>
                                    <p className="form-subtitle">Join our community of talented professionals</p>
                                </div>
                                <div className="form-grid">
                                    <div className="form-group">
                                        <label>First Name</label>
                                        <input type="text" name="firstName" value={formData.firstName} onChange={handleChange} className="form-control" placeholder="Your first name" />
                                    </div>
                                    <div className="form-group">
                                        <label>Last Name</label>
                                        <input type="text" name="lastName" value={formData.lastName} onChange={handleChange} className="form-control" placeholder="Your last name" />
                                    </div>
                                    <div className="form-group">
                                        <label>Username</label>
                                        <input type="text" name="username" value={formData.username} onChange={handleChange} className={`form-control ${errors.username ? 'error' : ''}`} placeholder="Enter your username" />
                                        {errors.username && <p className="error-message">{errors.username}</p>}
                                    </div>
                                    <div className="form-group">
                                        <label>Email</label>
                                        <input type="email" name="email" value={formData.email} onChange={handleChange} className={`form-control ${errors.email ? 'error' : ''}`} placeholder="Enter your email" />
                                        {errors.email && <p className="error-message">{errors.email}</p>}
                                    </div>
                                    <div className="form-group">
                                        <label>Password</label>
                                        <input type="password" name="password" value={formData.password} onChange={handleChange} className={`form-control ${errors.password ? 'error' : ''}`} placeholder="••••••••" />
                                        {errors.password && <p className="error-message">{errors.password}</p>}
                                    </div>
                                    <div className="form-group">
                                        <label>Confirm Password</label>
                                        <input type="password" name="confirmPassword" value={formData.confirmPassword} onChange={handleChange} className={`form-control ${errors.confirmPassword ? 'error' : ''}`} placeholder="••••••••" />
                                        {errors.confirmPassword && <p className="error-message">{errors.confirmPassword}</p>}
                                    </div>
                                </div>
                                <div className="button-group">
                                    {/* 3. UPDATE the button JSX */}
                                    <button
                                        type="button"
                                        className="btn btn-primary"
                                        onClick={() => {
                                            if (validateStep1()) {
                                                sendOTP();
                                            }
                                        }}
                                        disabled={isLoading} // Disable button when loading
                                    >
                                        {isLoading ? 'Sending...' : 'Continue'} 
                                    </button>
                                </div>
                                <div className="auth-footer">
                                    <p>Already have an account? <Link to="/login">Sign in</Link></p>
                                </div>
                            </div>
                        )}

                        {step === 2 && (
                            <div className="step-content">
                                <div className="step-header">
                                    <h2 className="form-title">Verify Your Email</h2>
                                    <p className="form-subtitle">We sent a 6-digit code to <strong>{formData.email}</strong></p>
                                </div>
                                <div className="form-group">
                                    <label>Verification Code</label>
                                    <input type="text" value={otp} onChange={handleOtpChange} maxLength="6" className={`form-control otp-input ${otpError ? 'error' : ''}`} placeholder="••••••" />
                                    {otpError && <p className="error-message">{otpError}</p>}
                                </div>
                                <div className="otp-timer">
                                    {timer > 0 ? (
                                        <span className="timer-text">Code expires in {timer}s</span>
                                    ) : (
                                        <button type="button" className="resend-link" onClick={resendOTP}>Resend Code</button>
                                    )}
                                </div>
                                <div className="button-group">
                                    <button type="button" className="btn btn-outline" onClick={prevStep}>Back</button>
                                    <button type="button" className="btn btn-primary" disabled={otp.length !== 6} onClick={verifyOTP}>Verify</button>
                                </div>
                            </div>
                        )}

                        {step === 3 && (
                            <div className="step-content">
                                <div className="step-header">
                                    <h2 className="form-title">Complete Your Profile</h2>
                                    <p className="form-subtitle">Help us personalize your experience</p>
                                </div>
                                <div className="form-grid">
                                    <div className="form-group">
                                        <label>Address</label>
                                        <textarea name="address" value={formData.address} onChange={handleChange} className="form-control" placeholder="Enter your address" rows="3" />
                                    </div>
                                    <div className="form-group">
                                        <label>Date of Birth</label>
                                        <input type="date" name="dob" value={formData.dob} onChange={handleChange} className="form-control" />
                                    </div>
                                    <div className="form-group">
                                        <label>Phone Number</label>
                                        <input type="tel" name="phone" value={formData.phone} onChange={handleChange} className="form-control" placeholder="+91 __________" />
                                    </div>
                                    <div className="form-group">
                                        <label>Gender</label>
                                        <div style={{ display: 'flex', gap: '1rem' }}>
                                            <label><input type="radio" name="gender" value="Male" checked={formData.gender === 'Male'} onChange={handleChange} /> Male</label>
                                            <label><input type="radio" name="gender" value="Female" checked={formData.gender === 'Female'} onChange={handleChange} /> Female</label>
                                            <label><input type="radio" name="gender" value="Other" checked={formData.gender === 'Other'} onChange={handleChange} /> Other</label>
                                        </div>
                                    </div>
                                    <div className="form-group">
                                        <label>Role</label>
                                        <select name="role" value={formData.role} onChange={handleChange} className="form-control">
                                            <option value="">-- Select Role --</option>
                                            <option value="Job Seeker">Job Seeker</option>
                                            <option value="Job Provider">Job Provider</option>
                                        </select>
                                    </div>
                                   </div>
                                <div className="button-group">
                                    <button type="button" className="btn btn-outline" onClick={prevStep}>Back</button>
                                    <button type="button" className="btn btn-primary" onClick={handleSubmit}>Complete Registration</button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default Register;