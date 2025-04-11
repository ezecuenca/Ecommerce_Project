import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";

const Register = () => {
  const initialFormData = {
    first_name: "",
    last_name: "",
    username: "",
    email: "",
    password: "",
    password_confirmation: "",
  };

  const [formData, setFormData] = useState(initialFormData);
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prevData => ({
        ...prevData,
        [name]: value ?? ""
    }));
    if (errors[name]) {
        setErrors(prevErrors => ({ ...prevErrors, [name]: null }));
    }
    if (errors.general) {
         setErrors(prevErrors => ({ ...prevErrors, general: null }));
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setErrors({});
    setIsLoading(true);

    const dataToSend = {
      first_name: formData.first_name,
      last_name: formData.last_name,
      username: formData.username,
      email: formData.email,
      password: formData.password,
      password_confirmation: formData.password_confirmation,
    };

    try {
      const response = await axios.post("http://localhost:8000/api/register", dataToSend);
      console.log("Registration successful", response.data);
      alert("Registration successful! Please log in.");
      setFormData(initialFormData);
      setErrors({});
      navigate("/login");

    } catch (error) {
        console.error("--- Registration Error Caught ---");
        console.error("Full Error Object:", error);
        if (error.response) {
          console.error("Error Response Status:", error.response.status);
          console.error("Error Response Data:", error.response.data);
          if (error.response.data.errors) {
             console.error("Validation Errors Object:", error.response.data.errors);
             setErrors(error.response.data.errors);
          } else {
             const generalMessage = error.response.data.message || "Registration failed. Please check your input.";
             console.error("General Error Message:", generalMessage);
             setErrors({ general: generalMessage });
          }
        } else {
          console.error("Error Message (No Response):", error.message);
          setErrors({ general: "Registration failed. Network error or unexpected issue." });
        }
        console.error("--- End Registration Error ---");
    } finally {
        setIsLoading(false);
    }
  };

  return (
    <div className="register-container">
      <Link to="/login" className="register-back-btn">← Back to Login</Link>
      <div className="register-card">
        <h2 className="register-title">Create your account</h2>
        {errors.general && <p className="error-text" style={{ color: 'red', textAlign: 'center', marginBottom: '10px'}}>{errors.general}</p>}
        <form onSubmit={handleRegister} className="register-form">
          <label>First name</label>
          <input type="text" name="first_name" placeholder="Enter your first name" value={formData.first_name} onChange={handleChange} required disabled={isLoading} />
          {errors.first_name && <p className="error-text">{errors.first_name[0]}</p>}

          <label>Last Name</label>
          <input type="text" name="last_name" placeholder="Enter your last name" value={formData.last_name} onChange={handleChange} required disabled={isLoading} />
          {errors.last_name && <p className="error-text">{errors.last_name[0]}</p>}

          <label>Username</label>
          <input type="text" name="username" placeholder="Type your username" value={formData.username} onChange={handleChange} required disabled={isLoading} />
          {errors.username && <p className="error-text">{errors.username[0]}</p>}

          <label>E-mail</label>
          <input type="email" name="email" placeholder="Type your e-mail" value={formData.email} onChange={handleChange} required disabled={isLoading} autoComplete="email"/>
          {errors.email && <p className="error-text">{errors.email[0]}</p>}

          <label>Password</label>
          <input type="password" name="password" placeholder="Type your password" value={formData.password} onChange={handleChange} required disabled={isLoading} autoComplete="new-password"/>
          {errors.password && <p className="error-text">{errors.password[0]}</p>}

          <label>Confirm Password</label>
          <input type="password" name="password_confirmation" placeholder="Confirm your password" value={formData.password_confirmation} onChange={handleChange} required disabled={isLoading} autoComplete="new-password"/>
          {errors.password_confirmation && <p className="error-text">{errors.password_confirmation[0]}</p>}

          <p className="password-hint">Must be 8 characters at least</p>
          <button type="submit" className="register-submit-btn" disabled={isLoading}>
            {isLoading ? 'Creating Account...' : 'Create'}
          </button>
        </form>
        <p className="signin-text">
          Already have an account? <Link to="/login">Sign In</Link>
        </p>
      </div>
    </div>
  );
};

export default Register;