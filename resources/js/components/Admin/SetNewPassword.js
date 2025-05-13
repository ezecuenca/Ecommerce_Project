import React, { useState } from 'react'; 
import axios from 'axios';
import { Link, useNavigate } from 'react-router-dom';
import { FaEye, FaEyeSlash } from "react-icons/fa";

const API_BASE_URL = 'http://localhost:8000/api';

const SetNewPassword = () => {
    const navigate = useNavigate();

    const [formData, setFormData] = useState({
        email: '', 
        password: '',
        password_confirmation: '',
    });
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');
    const [validationErrors, setValidationErrors] = useState({});
    const [isLoading, setIsLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    const handleChange = (e) => {
        setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
        setError('');
        if (validationErrors[e.target.name]) {
            setValidationErrors(prev => ({ ...prev, [e.target.name]: null }));
        }
        if (validationErrors.password && e.target.name === 'password_confirmation') {
             setValidationErrors(prev => ({ ...prev, password: null }));
         }
    };

    const togglePasswordVisibility = () => setShowPassword(prev => !prev);
    const toggleConfirmPasswordVisibility = () => setShowConfirmPassword(prev => !prev);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setMessage('');
        setError('');
        setValidationErrors({});
        setIsLoading(true);

        // Frontend validation
        if (!formData.email.trim()) {
            setError('Please enter your email address.');
            setIsLoading(false);
            return;
        }
        if (!formData.password || !formData.password_confirmation) {
            setError('Please enter and confirm your new password.');
            setIsLoading(false);
            return;
        }
        if (formData.password !== formData.password_confirmation) {
            setValidationErrors({ password_confirmation: ['Passwords do not match.'] });
            setError('Passwords do not match.');
            setIsLoading(false);
            return;
        }

        try {
            const response = await axios.post(`${API_BASE_URL}/direct-reset-password`, {
                email: formData.email,
                password: formData.password,
                password_confirmation: formData.password_confirmation,
            });

            setMessage(response.data.message || 'Your password has been reset successfully! Redirecting to login...');
            setFormData({ email: '', password: '', password_confirmation: '' });
            setTimeout(() => {
                navigate('/login');
            }, 3000);

        } catch (err) {
            console.error("Direct Reset Password error:", err.response?.data || err.message);
            if (err.response && err.response.data) {
                 if (err.response.status === 422 && err.response.data.errors) {
                     setValidationErrors(err.response.data.errors);
                     if (err.response.data.errors.email && err.response.data.errors.email[0].includes('exist')) {
                         setError('This email address is not registered.');
                     } else {
                        setError('Validation failed. Please check the fields below.');
                     }
                 } else if (err.response.data.message) {
                    setError(err.response.data.message);
                 } else {
                    setError('An unexpected error occurred. Please try again.');
                 }
            } else {
                setError('Failed to reset password. Please check your connection or try again later.');
            }
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="set-new-password-wrapper">
            <div className="set-new-password-card">
                <h2>Set New Password</h2>
                <p className="subtitle">
                    Enter your email and new password below.
                </p>

                {message && <p className="success-message">{message}</p>}
                {error && <p className="error-message">{error}</p>}

                <form onSubmit={handleSubmit} className="set-password-form">
                    <div className="input-group">
                        <label htmlFor="reset-email">Your Email Address</label>
                        <input
                            type="email"
                            id="reset-email"
                            name="email"
                            placeholder="Enter your registered email"
                            value={formData.email}
                            onChange={handleChange}
                            required
                            disabled={isLoading}
                            className={`form-input ${validationErrors.email ? 'input-error' : ''}`}
                        />
                        {validationErrors.email && <p className="validation-error">{validationErrors.email[0]}</p>}
                    </div>

                    <div className="input-group password-input-group">
                        <label htmlFor="new-password">New Password</label>
                        <div className="input-wrapper">
                            <input
                                type={showPassword ? "text" : "password"}
                                id="new-password"
                                name="password"
                                placeholder="Enter new password"
                                value={formData.password}
                                onChange={handleChange}
                                required
                                disabled={isLoading}
                                style={{ paddingRight: "40px" }} // Added to prevent overlap with eye icon
                                className={`form-input ${validationErrors.password ? 'input-error' : ''}`}
                            />
                            <span onClick={togglePasswordVisibility} className="eye-toggle">
                                {showPassword ? <FaEyeSlash size={18} /> : <FaEye size={18} />}
                            </span>
                        </div>
                        {validationErrors.password && <p className="validation-error">{validationErrors.password[0]}</p>}
                    </div>

                    <div className="input-group password-input-group">
                        <label htmlFor="confirm-new-password">Confirm New Password</label>
                        <div className="input-wrapper">
                            <input
                                type={showConfirmPassword ? "text" : "password"}
                                id="confirm-new-password"
                                name="password_confirmation"
                                placeholder="Confirm new password"
                                value={formData.password_confirmation}
                                onChange={handleChange}
                                required
                                disabled={isLoading}
                                style={{ paddingRight: "40px" }} // Added to prevent overlap with eye icon
                                className={`form-input ${validationErrors.password_confirmation ? 'input-error' : ''}`}
                            />
                            <span onClick={toggleConfirmPasswordVisibility} className="eye-toggle">
                                {showConfirmPassword ? <FaEyeSlash size={18} /> : <FaEye size={18} />}
                            </span>
                        </div>
                        {validationErrors.password_confirmation && <p className="validation-error">{validationErrors.password_confirmation[0]}</p>}
                    </div>

                    <button
                        type="submit"
                        disabled={isLoading}
                        className="submit-button"
                    >
                        {isLoading ? 'Resetting...' : 'Set New Password'}
                    </button>
                </form>

                <div className="back-link-container">
                    <Link to="/login" className="back-link">← Back to Login</Link>
                </div>
            </div>
        </div>
    );
};

export default SetNewPassword;