import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios"; // Import axios

const Register = () => {
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    username: "",
    email: "",
    password: "",
  });

  const navigate = useNavigate(); // Initialize useNavigate

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleRegister = async (e) => {
    e.preventDefault();

    try {
      // Send a POST request to your Laravel backend
      const response = await axios.post("/api/register", formData);

      console.log("Registration successful", response.data);

      // Redirect to login or another page after successful registration
      navigate("/"); // Redirect to login page

    } catch (error) {
      console.error("Registration failed", error.response ? error.response.data : error.message);
      // Handle errors (e.g., display error messages to the user)
      if (error.response && error.response.data.errors) {
        // Display validation errors from Laravel
        Object.values(error.response.data.errors).forEach(messages => {
          messages.forEach(message => {
            alert(message); // Or display in a more user-friendly way
          });
        });
      } else {
        alert("Registration failed. Please try again.");
      }
    }
  };

  return (
    <div className="register-container">
      <Link to="/" className="register-back-btn">&larr; Back to Login</Link>
      <div className="register-card">
        <h2 className="register-title">Create your account</h2>
        <form onSubmit={handleRegister} className="register-form">
          <label>First name</label>
          <input
            type="text"
            name="firstName"
            placeholder="Enter your first name"
            value={formData.firstName}
            onChange={handleChange}
            required
          />
          <label>Last Name</label>
          <input
            type="text"
            name="lastName"
            placeholder="Enter your last name"
            value={formData.lastName}
            onChange={handleChange}
            required
          />
          <label>Username</label>
          <input
            type="text"
            name="username"
            placeholder="Type your username"
            value={formData.username}
            onChange={handleChange}
            required
          />
          <label>E-mail</label>
          <input
            type="email"
            name="email"
            placeholder="Type your e-mail"
            value={formData.email}
            onChange={handleChange}
            required
          />
          <label>Password</label>
          <input
            type="password"
            name="password"
            placeholder="Type your password"
            value={formData.password}
            onChange={handleChange}
            required
          />
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