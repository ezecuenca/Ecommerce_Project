import React, { createContext, useState, useEffect } from "react";
import axios from "axios";

export const AuthContext = createContext();

const API_BASE_URL = "http://127.0.0.1:8000/api";

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [token, setTokenState] = useState(localStorage.getItem("access_token")); // <-- ADDED STATE FOR TOKEN

  useEffect(() => {
    const loadUser = async () => {
      const storedToken = localStorage.getItem("access_token");
      if (storedToken) {
        setTokenState(storedToken); // <-- SET TOKEN STATE
        try {
          const response = await axios.get(`${API_BASE_URL}/user/me`, {
            headers: {
              'Authorization': `Bearer ${storedToken}`, // Use storedToken here
              'Accept': 'application/json'
            },
          });
          if (response.data && response.data.user) {
             setUser(response.data.user);
          } else {
             console.error("Invalid user data structure received from /user/me:", response.data);
             localStorage.removeItem("access_token"); // Clear inconsistent state
             setTokenState(null);
             setUser(null);
          }
        } catch (err) {
          console.error("Failed to load user via /user/me", err);
          if (err.response && (err.response.status === 401 || err.response.status === 403)) {
            console.log("Removing token due to 401/403 error on /user/me");
            localStorage.removeItem("access_token");
            setTokenState(null); // <-- CLEAR TOKEN STATE
          }
          setUser(null);
        }
      } else {
        setTokenState(null); // Ensure token state is null if not in localStorage
      }
      setLoading(false);
    };

    loadUser();
  }, []); // Empty dependency array: runs once on mount

  const login = async (email, password) => {
    const response = await axios.post(`${API_BASE_URL}/login`, {
      email,
      password,
    });
    if (response.data && response.data.access_token && response.data.user) {
        localStorage.setItem("access_token", response.data.access_token);
        setTokenState(response.data.access_token); // <-- SET TOKEN STATE ON LOGIN
        setUser(response.data.user);
        return response.data.user.role_id;
    } else {
         console.error("Login response missing token or user data:", response.data);
         throw new Error("Login failed: Invalid response from server.");
    }
  };

  const logout = async () => {
    const currentToken = localStorage.getItem("access_token"); // Or use token from state
    try {
      if (currentToken) { // Use currentToken
          await axios.post(`${API_BASE_URL}/logout`, null, {
            headers: {
              'Authorization': `Bearer ${currentToken}`, // Use currentToken
              'Accept': 'application/json'
            },
          });
       }
    } catch (err) {
      console.error("Logout API call failed (token might be invalid):", err);
    } finally {
       localStorage.removeItem("access_token");
       setTokenState(null); // <-- CLEAR TOKEN STATE ON LOGOUT
       setUser(null);
    }
  };

  return (
    // --- EXPOSE TOKEN IN CONTEXT VALUE ---
    <AuthContext.Provider value={{ user, token, loading, login, logout, setUser, setTokenState }}>
      {children}
    </AuthContext.Provider>
  );
};