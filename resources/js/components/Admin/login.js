import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios"; // Import axios

const Login = () => {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  const [errors, setErrors] = useState({}); // State to store errors

  const navigate = useNavigate(); // Initialize useNavigate

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    // Clear errors for the field being edited
    setErrors({ ...errors, [e.target.name]: null });
  };

  const handleLogin = async (e) => {
    e.preventDefault();

    try {
      // Send a POST request to the Laravel backend
      const response = await axios.post("/api/login", {
        email: formData.email,
        password: formData.password,
      });

      console.log("Login successful", response.data);

      // Store the access token in local storage
      if (response.data.access_token) {
        localStorage.setItem("access_token", response.data.access_token);
      }

      // Clear form and errors
      setFormData({
        email: "",
        password: "",
      });
      setErrors({});

      // Redirect based on role_id
      const roleId = response.data.user.role_id;
      if (roleId === 1) {
        navigate("/customer"); // Customer
      } else if (roleId === 2) {
        navigate("/admin"); // Admin
      } else {
        navigate("/"); // Fallback for unexpected role_id
      }

    } catch (error) {
      console.error("Login failed", error.response ? error.response.data : error.message);
      // Handle errors
      if (error.response && error.response.data.errors) {
        // Store validation errors in state
        setErrors(error.response.data.errors);
      } else if (error.response && error.response.data.message) {
        // Handle authentication errors (e.g., "Invalid credentials", "Your account has been archived")
        setErrors({ general: error.response.data.message });
      } else {
        setErrors({ general: "Login failed. Please try again." });
      }
    }
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

          {/* Display general error if present */}
          {errors.general && <p className="error-text">{errors.general}</p>}

          <form onSubmit={handleLogin} className="login-form-container">
            <div className="login-input-group">
              <label>E-mail</label>
              <input
                type="email"
                className="login-email-input"
                placeholder="Type your username or e-mail"
                name="email"
                value={formData.email}
                onChange={handleChange}
                required
              />
              {errors.email && <p className="error-text">{errors.email[0]}</p>}
            </div>

            <div className="login-password-group">
              <label>Password</label>
              <input
                type="password"
                className="login-password-input"
                placeholder="Type your password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                required
              />
              {errors.password && <p className="error-text">{errors.password[0]}</p>}
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