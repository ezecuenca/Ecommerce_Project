import React, { createContext, useState, useEffect } from "react";
import axios from "axios";

export const AuthContext = createContext();

const API_BASE_URL = "http://127.0.0.1:8000/api";

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadUser = async () => {
      const token = localStorage.getItem("access_token");
      if (token) {
        try {
          const response = await axios.get(`${API_BASE_URL}/user/me`, {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Accept': 'application/json'
            },
          });
          if (response.data && response.data.user) {
             setUser(response.data.user);
          } else {
             console.error("Invalid user data structure received from /user/me:", response.data);
          }
        } catch (err) {
          console.error("Failed to load user via /user/me", err);
          if (err.response && (err.response.status === 401 || err.response.status === 403)) {
            console.log("Removing token due to 401/403 error on /user/me");
            localStorage.removeItem("access_token");
          }
          setUser(null);
        }
      }
      setLoading(false);
    };

    loadUser();
  }, []);

  const login = async (email, password) => {
    const response = await axios.post(`${API_BASE_URL}/login`, {
      email,
      password,
    });
    if (response.data && response.data.access_token && response.data.user) {
        localStorage.setItem("access_token", response.data.access_token);
        setUser(response.data.user);
        return response.data.user.role_id;
    } else {
         console.error("Login response missing token or user data:", response.data);
         throw new Error("Login failed: Invalid response from server.");
    }
  };

  const logout = async () => {
    const token = localStorage.getItem("access_token");
    try {
      if (token) {
          await axios.post(`${API_BASE_URL}/logout`, null, {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Accept': 'application/json'
            },
          });
       }
    } catch (err) {
      console.error("Logout API call failed (token might be invalid):", err);
    } finally {
       localStorage.removeItem("access_token");
       setUser(null);
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, setUser }}>
      {children}
    </AuthContext.Provider>
  );
};