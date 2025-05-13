import React, { useState, useCallback } from "react";
import LoginSecurityModal from "./LoginSecurityModal";
import Axios from 'axios'; // Import Axios

// --- API Base URL --- (Define this or import from a config file)
const API_BASE_URL = "http://localhost:8000/api";

// --- Authentication Helper --- (Define this or import from a shared utility file)
const makeAuthenticatedRequest = async (method, url, data = null, config = {}) => {
    const token = localStorage.getItem("access_token"); // Ensure this key matches how you store the token
    if (!token) {
        console.error("Auth token not found for request.");
        // Handle logout or redirect if token is missing
        // For now, just throw an error
        throw new Error("Unauthenticated: No token found.");
    }
    const headers = {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/json',
        ...(!(data instanceof FormData) && data ? { 'Content-Type': 'application/json' } : {}),
        ...(config.headers || {}),
    };
    if (data instanceof FormData) delete headers['Content-Type'];
    const fullConfig = { ...config, headers };
    try {
        const response = await Axios({ method: method.toLowerCase(), url, data, ...fullConfig });
        return response;
    } catch (error) {
        console.error(`Axios Error: ${method.toUpperCase()} ${url}`, error.response?.data || error.message, error);
        // Re-throw the error so the calling component can handle it
        throw error;
    }
};


const LoginSecurity = () => {
    const [modalType, setModalType] = useState(null); // 'update' or 'delete'

    const openModal = (type) => {
        setModalType(type);
    };

    const closeModal = () => {
        setModalType(null);
    };

    // --- Function to handle successful account deletion ---
    // This usually involves clearing local storage/state and redirecting
    const handleAccountDeletionSuccess = useCallback(() => {
        console.log("Account deleted successfully. Logging out.");
        // Clear token from local storage
        localStorage.removeItem("access_token");
        // Optionally clear other user data from state/storage if applicable
        // Redirect to login page or home page
        window.location.href = '/login'; // Simple redirect, consider using React Router's navigate
    }, []); // No dependencies needed usually for logout


    return (
        // Use a more specific class name if needed, e.g., from your SCSS
        <div className="login-security">
            <h1>Login and security</h1>

            {/* --- Password Section --- */}
            <div className="security-section">
                <h2>Update your password</h2>
                <div className="content-row">
                    <div className="form-group">
                        <label>Password</label>
                        {/* Consider fetching last updated time if needed */}
                        <p>*********</p> {/* Mask password */}
                    </div>
                    <div className="button-group">
                        <button className="update-btn" onClick={() => openModal("update")}>
                            Update password
                        </button>
                    </div>
                </div>
            </div>

            {/* --- Account Deletion Section --- */}
            <div className="security-section">
                <h2>Delete your account?</h2>
                <div className="content-row">
                    <div className="form-group">
                        <p>Permanently delete your account and all associated data.</p>
                    </div>
                    <div className="button-group">
                        {/* Use a more indicative class, e.g., danger-btn */}
                        <button className="delete-btn" onClick={() => openModal("delete")}>
                            Delete Account
                        </button>
                    </div>
                </div>
            </div>

            {/* --- Modal --- */}
            {modalType && (
                <LoginSecurityModal
                    type={modalType}
                    onClose={closeModal}
                    // --- Pass Necessary Props to Modal ---
                    makeAuthenticatedRequest={makeAuthenticatedRequest} // Pass the helper
                    API_BASE_URL={API_BASE_URL} // Pass the URL
                    onAccountDeleteSuccess={handleAccountDeletionSuccess} // Pass the logout handler
                />
            )}
        </div>
    );
};

export default LoginSecurity;