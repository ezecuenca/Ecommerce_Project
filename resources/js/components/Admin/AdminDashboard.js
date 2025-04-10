import React, { useState, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../AuthContext";
import axios from "axios";

const AdminDashboard = () => {
  const { user, loading, logout } = useContext(AuthContext); // Use AuthContext to get user and logout
  const [isModalOpen, setIsModalOpen] = useState(false); // State for modal visibility
  const navigate = useNavigate();

  // Handle logout
  const handleLogout = async () => {
    try {
      await logout(); // Call the logout function from AuthContext
      navigate("/"); // Redirect to login page
    } catch (error) {
      console.error("Logout failed", error);
    }
  };

  // Open/close modal
  const toggleModal = () => {
    setIsModalOpen(!isModalOpen);
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!user) {
    return <div>Please log in to access the admin dashboard.</div>;
  }

  return (
    <div className="admin-dashboard">
      {/* Header Section */}
      <div className="dashboard-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "1rem" }}>
        <h2>Admin Dashboard</h2>
        <div className="user-actions" style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
          {/* Profile Icon */}
          <div className="profile-icon" onClick={toggleModal} style={{ cursor: "pointer" }}>
            <span style={{ fontSize: "1.5rem" }}>👤</span> {/* Placeholder icon (you can replace with an actual image/icon) */}
            <span style={{ marginLeft: "0.5rem" }}>{user.username}</span>
          </div>
          {/* Logout Button */}
          <button
            onClick={handleLogout}
            style={{
              padding: "0.5rem 1rem",
              backgroundColor: "#ff4d4f",
              color: "white",
              border: "none",
              borderRadius: "4px",
              cursor: "pointer",
            }}
          >
            Logout
          </button>
        </div>
      </div>

      {/* Dashboard Content */}
      <div className="dashboard-content" style={{ padding: "1rem" }}>
        <p>Welcome, {user.username}!</p>
        <p>Email: {user.email}</p>
        <p>Role: {user.role_id === 1 ? "Customer" : user.role_id === 2 ? "Admin" : "Unknown"}</p>
        <h3>Profile</h3>
        <p>First Name: {user.profile?.first_name || "N/A"}</p>
        <p>Last Name: {user.profile?.last_name || "N/A"}</p>
        {/* Add other admin dashboard content here */}
      </div>

      {/* Settings Modal */}
      {isModalOpen && (
        <div
          className="modal-overlay"
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(0, 0, 0, 0.5)",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            zIndex: 1000,
          }}
        >
          <div
            className="modal-content"
            style={{
              backgroundColor: "white",
              padding: "2rem",
              borderRadius: "8px",
              width: "400px",
              maxWidth: "90%",
              position: "relative",
            }}
          >
            <button
              onClick={toggleModal}
              style={{
                position: "absolute",
                top: "10px",
                right: "10px",
                background: "none",
                border: "none",
                fontSize: "1.2rem",
                cursor: "pointer",
              }}
            >
              ✕
            </button>
            <h3>Settings</h3>
            <p>Settings options will be added here.</p>
            {/* Add settings form or options here in the future */}
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;