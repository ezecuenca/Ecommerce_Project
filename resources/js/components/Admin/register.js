import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios"; // Import axios

const Register = () => {
  const [formData, setFormData] = useState({
    first_name: "",
    last_name: "",
    username: "",
    email: "",
    password: "",
    password_confirmation: "",
  });

  const [errors, setErrors] = useState({}); // State to store validation errors

  const navigate = useNavigate(); // Initialize useNavigate

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    // Clear errors for the field being edited
    setErrors({ ...errors, [e.target.name]: null });
  };

  const handleRegister = async (e) => {
    e.preventDefault();

    // Prepare the data to send
    const dataToSend = {
      first_name: formData.first_name,
      last_name: formData.last_name,
      username: formData.username,
      email: formData.email,
      password: formData.password,
      password_confirmation: formData.password_confirmation,
    };

    try {
      // Send a POST request to your Laravel backend
      const response = await axios.post("/api/register", dataToSend);

      console.log("Registration successful", response.data);

      // Store the access token in local storage
      if (response.data.access_token) {
        localStorage.setItem("access_token", response.data.access_token);
      }

      // Clear form and errors
      setFormData({
        first_name: "",
        last_name: "",
        username: "",
        email: "",
        password: "",
        password_confirmation: "",
      });
      setErrors({});

      navigate("/");

    } catch (error) {
      console.error("Registration failed", error.response ? error.response.data : error.message);
      if (error.response && error.response.data.errors) {
        setErrors(error.response.data.errors);
      } else {
        setErrors({ general: "Registration failed. Please try again." });
      }
    }
  };

  return (
    <div className="register-container">
      <Link to="/" className="register-back-btn">← Back to Login</Link>
      <div className="register-card">
        <h2 className="register-title">Create your account</h2>
        {errors.general && <p className="error-text">{errors.general}</p>}
        <form onSubmit={handleRegister} className="register-form">
          <label>First name</label>
          <input
            type="text"
            name="first_name"
            placeholder="Enter your first name"
            value={formData.first_name}
            onChange={handleChange}
            required
          />
          {errors.first_name && <p className="error-text">{errors.first_name[0]}</p>}

          <label>Last Name</label>
          <input
            type="text"
            name="last_name"
            placeholder="Enter your last name"
            value={formData.last_name}
            onChange={handleChange}
            required
          />
          {errors.last_name && <p className="error-text">{errors.last_name[0]}</p>}

          <label>Username</label>
          <input
            type="text"
            name="username"
            placeholder="Type your username"
            value={formData.username}
            onChange={handleChange}
            required
          />
          {errors.username && <p className="error-text">{errors.username[0]}</p>}

          <label>E-mail</label>
          <input
            type="email"
            name="email"
            placeholder="Type your e-mail"
            value={formData.email}
            onChange={handleChange}
            required
          />
          {errors.email && <p className="error-text">{errors.email[0]}</p>}

          <label>Password</label>
          <input
            type="password"
            name="password"
            placeholder="Type your password"
            value={formData.password}
            onChange={handleChange}
            required
          />
          {errors.password && <p className="error-text">{errors.password[0]}</p>}

          <label>Confirm Password</label>
          <input
            type="password"
            name="password_confirmation"
            placeholder="Confirm your password"
            value={formData.password_confirmation}
            onChange={handleChange}
            required
          />
          {errors.password_confirmation && <p className="error-text">{errors.password_confirmation[0]}</p>}

          <p className="password-hint">Must be 8 characters at least</p>
          <button type="submit" className="register-submit-btn">Create</button>
        </form>
        <p className="signin-text">
          Already have an account? <Link to="/">Sign In</Link>
        </p>
      </div>
    </div>
  );
};

export default Register;