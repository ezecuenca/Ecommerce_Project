import React, { useState } from "react";
import { Link } from "react-router-dom";

const Login = () => {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");

    const handleLogin = (e) => {
        e.preventDefault();
        console.log("Login clicked", { email, password });
    };

    return (
        <div className="login-wrapper">
            <div className="login-card">
                <div className="login-image-section">
                    {/* Background image will be handled via CSS */}
                </div>

                <div className="login-content">
                    <h2 className="login-title">Welcome Back!</h2>
                    <p className="login-subtitle">Timeless Style, Just a Click Away!</p>

                    <form onSubmit={handleLogin} className="login-form-container">
                        <div className="login-input-group">
                        <label>E-mail</label>
                            <input
                                type="email"
                                className="login-email-input"
                                placeholder="Type your username or e-mail"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                            />
                        </div>

                        <div className="login-password-group">
                        <label>Password</label>
                            <input
                                type="password"
                                className="login-password-input"
                                placeholder="Type your password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                            />
                        </div>

                        <div className="login-options">
                            <a href="/forgot-password" className="login-forgot-link">Forgot password?</a>
                        </div>

                        <button type="submit" className="login-submit-btn">Login</button>
                    </form>

                    <div className="login-signup">
                        <p>
                            Don't have an account? <Link to="/register" className="login-signup-link">Sign up</Link>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Login;
