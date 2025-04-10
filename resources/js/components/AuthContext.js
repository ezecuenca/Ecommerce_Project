import React, { createContext, useState, useEffect } from "react";
import axios from "axios";

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadUser = async () => {
      const token = localStorage.getItem("access_token");
      if (token) {
        try {
          const response = await axios.get("http://127.0.0.1:8000/api/me", {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          });
          setUser(response.data.user);
        } catch (err) {
          console.error("Failed to load user", err);
          localStorage.removeItem("access_token");
        }
      }
      setLoading(false);
    };

    loadUser();
  }, []);

  const login = async (email, password) => {
    const response = await axios.post("http://127.0.0.1:8000/api/login", {
      email,
      password,
    });
    localStorage.setItem("access_token", response.data.access_token);
    setUser(response.data.user);
    return response.data.user.role_id; // Return role_id for redirect
  };

  const logout = async () => {
    try {
      await axios.post("http://127.0.0.1:8000/api/logout", null, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("access_token")}`,
        },
      });
    } catch (err) {
      console.error("Logout failed", err);
    }
    localStorage.removeItem("access_token");
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, setUser }}>
      {children}
    </AuthContext.Provider>
  );
};