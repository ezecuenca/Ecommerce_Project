import React, { useState, useContext } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AuthContext } from "../AuthContext";

const Login = () => {
  const [formData, setFormData] = useState({ email: "", password: "" });
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);

  const { login } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setErrors({ ...errors, [e.target.name]: null, general: null });
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setErrors({});
    setIsLoading(true);

    try {
      const roleId = await login(formData.email, formData.password);

      console.log("Login successful via context, Role ID:", roleId);

      setFormData({ email: "", password: "" });

      if (roleId === 1) {
        navigate("/admin");
      } else if (roleId === 2) {
        navigate("/customer");
      } else {
        console.warn("Logged in with unexpected role_id:", roleId);
        navigate("/");
      }

    } catch (error) {
       console.error("Login failed", error.response ? error.response.data : error.message);
       if (error.response && error.response.data.errors) {
           setErrors(error.response.data.errors);
       } else if (error.response && error.response.data.message) {
           setErrors({ general: error.response.data.message });
       } else {
           setErrors({ general: "Login failed. Please try again." });
       }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="login-wrapper">
      <div className="login-card">
        <div className="login-image-section"></div>
        <div className="login-content">
          <h2 className="login-title">Welcome Back!</h2>
          <p className="login-subtitle">Timeless Style, Just a Click Away!</p>
          {errors.general && <p className="error-text">{errors.general}</p>}
          <form onSubmit={handleLogin} className="login-form-container">
            <div className="login-input-group">
              <label>E-mail</label>
              <input type="email" className="login-email-input" placeholder="Type your username or e-mail" name="email" value={formData.email} onChange={handleChange} required disabled={isLoading}/>
              {errors.email && <p className="error-text">{errors.email[0]}</p>}
            </div>
            <div className="login-password-group">
              <label>Password</label>
              <input type="password" className="login-password-input" placeholder="Type your password" name="password" value={formData.password} onChange={handleChange} required disabled={isLoading}/>
              {errors.password && <p className="error-text">{errors.password[0]}</p>}
            </div>
            <div className="login-options">
              <a href="/forgot-password" className="login-forgot-link">Forgot password?</a>
            </div>
            <button type="submit" className="login-submit-btn" disabled={isLoading}>
              {isLoading ? 'Logging in...' : 'Login'}
            </button>
          </form>
          <div className="login-signup">
            <p> Don't have an account? <Link to="/register" className="login-signup-link">Sign up</Link> </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;