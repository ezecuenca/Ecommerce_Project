import React, { useState, useContext } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AuthContext } from "../AuthContext";
import { FaEye, FaEyeSlash } from "react-icons/fa";

const Login = () => {
  const [formData, setFormData] = useState({ email: "", password: "" });
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const { login } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setErrors(prev => ({ ...prev, [e.target.name]: null, general: null }));
  };

  const togglePasswordVisibility = () => {
    setShowPassword(prev => !prev);
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
       let generalError = "Login failed. Please check your connection or try again.";

       if (error.response) {
            if (error.response.status === 422 && error.response.data.errors) {
                setErrors(error.response.data.errors);
                generalError = "Please correct the errors below.";
            } else if (error.response.status === 401 && error.response.data.message === 'Invalid credentials') {
                 generalError = "Incorrect email or password. Please try again.";
            } else if (error.response.data.message) {
                generalError = error.response.data.message;
            }
       } else if (error.message) {
            generalError = error.message;
       }
       setErrors(prev => ({ ...prev, general: generalError }));
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
          {errors.general && <p className="error-text-general">{errors.general}</p>}
          <form onSubmit={handleLogin} className="login-form-container">
            <div className="login-input-group">
              <label htmlFor="login-email">E-mail</label>
              <input
                id="login-email"
                type="email"
                className="login-email-input"
                placeholder="Type your username or e-mail"
                name="email"
                value={formData.email}
                onChange={handleChange}
                required
                disabled={isLoading}
              />
              {errors.email && <p className="error-text">{errors.email[0]}</p>}
            </div>
            <div className="login-password-group">
              <label htmlFor="login-password">Password</label>
              <div className="input-wrapper"> {/* Added class for wrapper */}
                  <input
                    id="login-password"
                    type={showPassword ? "text" : "password"}
                    className="login-password-input"
                    placeholder="Type your password"
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    required
                    disabled={isLoading}
                  />
                  <span
                    onClick={togglePasswordVisibility}
                    className="eye-toggle" // Added class for eye toggle
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? <FaEyeSlash size={18} /> : <FaEye size={18} />}
                  </span>
              </div>
              {errors.password && <p className="error-text">{errors.password[0]}</p>}
            </div>
            <div className="login-options">
              <Link to="/set-new-password" className="login-forgot-link">Forgot password?</Link>
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