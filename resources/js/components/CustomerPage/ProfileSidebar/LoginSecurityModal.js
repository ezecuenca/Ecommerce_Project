import React, { useState, useCallback } from "react";
// Make sure all necessary icons are imported
import { FaSpinner, FaEye, FaEyeSlash } from "react-icons/fa";

// Props are destructured, including the ones passed from LoginSecurity
const LoginSecurityModal = ({
    type,
    onClose,
    onAccountDeleteSuccess, // Function to call after successful deletion (e.g., logout)
    makeAuthenticatedRequest, // Function for authenticated API calls
    API_BASE_URL // Base URL for API endpoints
}) => {
    // State for Update Password form
    const [oldPassword, setOldPassword] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [isUpdating, setIsUpdating] = useState(false);

    // State for password visibility
    const [showOldPassword, setShowOldPassword] = useState(false);
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    // State for Delete Account action
    const [isDeleting, setIsDeleting] = useState(false);

    // General error state for the modal
    const [error, setError] = useState("");

    // --- Password Update Handler ---
    const handleUpdatePassword = async (e) => {
        e.preventDefault();
        setError("");
        if (!oldPassword || !newPassword || !confirmPassword) {
            setError("Please fill in all password fields."); return;
        }
        if (newPassword !== confirmPassword) {
            setError("New password and confirmation password do not match."); return;
        }
        setIsUpdating(true);
        try {
            await makeAuthenticatedRequest('put', `${API_BASE_URL}/user/password`, {
                old_password: oldPassword, password: newPassword, password_confirmation: confirmPassword,
            });
            alert("Password updated successfully!");
            setOldPassword(""); setNewPassword(""); setConfirmPassword("");
            onClose();
        } catch (err) {
            console.error("Password update error:", err);
            let errorMsg = "Failed to update password.";
             if (err.response) {
                 if (err.response.status === 422 && err.response.data?.errors) {
                     const messages = Object.values(err.response.data.errors).flat();
                     errorMsg = `Validation failed: ${messages.join(' ')}`;
                 } else if (err.response.data?.message) {
                     errorMsg = err.response.data.message;
                 } else if (err.response.status === 401) {
                      errorMsg = "Authentication failed. Please log in again.";
                 }
            } else if (err.message?.includes("Unauthenticated")) {
                 errorMsg = "Authentication failed. Please log in again.";
            } else if (err.message) {
                 errorMsg = err.message;
            }
            setError(errorMsg);
        } finally {
            setIsUpdating(false);
        }
    };

    // --- Account Deletion Handler ---
    const handleConfirmDelete = async () => {
        setError(""); setIsDeleting(true);
        try {
            await makeAuthenticatedRequest('delete', `${API_BASE_URL}/user/account`);
            alert("Account deleted successfully.");
            onAccountDeleteSuccess();
            onClose();
        } catch (err) {
            console.error("Account deletion error:", err);
             let errorMsg = "Failed to delete account.";
             if (err.response?.data?.message) {
                 errorMsg = err.response.data.message;
             } else if (err.message?.includes("Unauthenticated")) {
                  errorMsg = "Authentication failed. Please log in again.";
             } else if (err.message) {
                  errorMsg = err.message;
             }
             setError(errorMsg);
        } finally {
            setIsDeleting(false);
        }
    };

    // Handle clicks outside the modal content to close it
    const handleOverlayClick = (e) => {
        if (e.target === e.currentTarget) {
            onClose();
        }
    };

    // --- Helper functions to toggle visibility ---
    const toggleOldPasswordVisibility = () => setShowOldPassword(prev => !prev);
    const toggleNewPasswordVisibility = () => setShowNewPassword(prev => !prev);
    const toggleConfirmPasswordVisibility = () => setShowConfirmPassword(prev => !prev);

    // --- Styles for Icon Positioning (Inline for simplicity) ---
    // It's better to move these to a CSS/SCSS file and use classes
    const inputWrapperStyle = { position: 'relative', display: 'block' };
    const eyeIconStyle = {
        position: 'absolute',
        top: '50%',
        right: '10px',
        transform: 'translateY(-50%)', // Vertically center the icon
        cursor: 'pointer',
        color: '#6b7280', // Example gray color
        zIndex: 2 // Ensure icon is clickable over input padding
    };

    return (
        <div className="modal-overlay" onClick={handleOverlayClick}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                 {error && (
                     <p className="error-message modal-error" style={{ color: 'red', marginBottom: '15px', border: '1px solid red', padding: '8px', borderRadius: '4px' }} aria-live="polite">
                         {error}
                     </p>
                 )}

                {/* --- Update Password Form --- */}
                {type === "update" ? (
                    <>
                        <h3>Update Password</h3>
                        <form onSubmit={handleUpdatePassword}>
                            <div className="form-group">
                                <label htmlFor="old_password">Old Password</label>
                                <div style={inputWrapperStyle}> {/* Wrapper */}
                                    <input
                                        id="old_password"
                                        type={showOldPassword ? "text" : "password"} // Dynamic type
                                        placeholder="Enter current password"
                                        value={oldPassword}
                                        onChange={(e) => setOldPassword(e.target.value)}
                                        required
                                        disabled={isUpdating}
                                        style={{ paddingRight: '40px' }} // Add padding for icon space
                                    />
                                    <span onClick={toggleOldPasswordVisibility} style={eyeIconStyle} aria-label={showOldPassword ? "Hide password" : "Show password"}>
                                        {showOldPassword ? <FaEyeSlash /> : <FaEye />}
                                    </span>
                                </div>
                            </div>
                            <div className="form-group">
                                <label htmlFor="new_password">New Password</label>
                                <div style={inputWrapperStyle}> {/* Wrapper */}
                                    <input
                                        id="new_password"
                                        type={showNewPassword ? "text" : "password"} // Dynamic type
                                        placeholder="Enter new password"
                                        value={newPassword}
                                        onChange={(e) => setNewPassword(e.target.value)}
                                        required
                                        disabled={isUpdating}
                                        style={{ paddingRight: '40px' }} // Add padding for icon space
                                    />
                                    <span onClick={toggleNewPasswordVisibility} style={eyeIconStyle} aria-label={showNewPassword ? "Hide password" : "Show password"}>
                                        {showNewPassword ? <FaEyeSlash /> : <FaEye />}
                                    </span>
                                </div>
                            </div>
                             <div className="form-group">
                                <label htmlFor="confirm_password">Confirm New Password</label>
                                <div style={inputWrapperStyle}> {/* Wrapper */}
                                    <input
                                        id="confirm_password"
                                        type={showConfirmPassword ? "text" : "password"} // Dynamic type
                                        placeholder="Confirm new password"
                                        value={confirmPassword}
                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                        required
                                        disabled={isUpdating}
                                        style={{ paddingRight: '40px' }} // Add padding for icon space
                                    />
                                     <span onClick={toggleConfirmPasswordVisibility} style={eyeIconStyle} aria-label={showConfirmPassword ? "Hide password" : "Show password"}>
                                        {showConfirmPassword ? <FaEyeSlash /> : <FaEye />}
                                    </span>
                                </div>
                            </div>
                            <div className="modal-actions">
                                <button type="submit" className="save-btn" disabled={isUpdating}>
                                    {isUpdating ? <FaSpinner className="spinner" /> : 'Save Changes'}
                                </button>
                                <button type="button" className="cancel-btn" onClick={onClose} disabled={isUpdating}>Cancel</button>
                            </div>
                        </form>
                    </>
                /* --- Delete Account Confirmation --- */
                ) : type === "delete" ? (
                    <>
                         <h3>Delete Account</h3>
                        <p className="delete-message">Are you sure you want to permanently delete your account?</p>
                        <p>This action cannot be undone.</p>
                        <div className="modal-actions">
                            <button className="confirm-btn delete-confirm-btn" onClick={handleConfirmDelete} disabled={isDeleting}>
                                 {isDeleting ? <FaSpinner className="spinner" /> : 'Yes, Delete Account'}
                            </button>
                            <button className="cancel-btn" onClick={onClose} disabled={isDeleting}>Cancel</button>
                        </div>
                    </>
                ) : null }
            </div>
        </div>
    );
};

export default LoginSecurityModal;