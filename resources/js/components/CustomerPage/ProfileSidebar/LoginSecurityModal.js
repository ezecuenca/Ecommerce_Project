import React, { useState, useCallback } from "react";
import { FaSpinner } from "react-icons/fa"; // Import spinner for loading state

// Assuming makeAuthenticatedRequest and API_BASE_URL are passed as props
// along with onAccountDeleteSuccess (which is the logout function)
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
    const [isUpdating, setIsUpdating] = useState(false); // Loading state for update

    // State for Delete Account action
    const [isDeleting, setIsDeleting] = useState(false); // Loading state for delete

    // General error state for the modal
    const [error, setError] = useState("");

    // --- Password Update Handler ---
    const handleUpdatePassword = async (e) => {
        e.preventDefault();
        setError(""); // Clear previous errors

        // Basic client-side validation
        if (!oldPassword || !newPassword || !confirmPassword) {
            setError("Please fill in all password fields.");
            return;
        }
        if (newPassword !== confirmPassword) {
            setError("New password and confirmation password do not match.");
            return;
        }
        // Optional: Add more complex password rules here if desired

        setIsUpdating(true);

        try {
            // --- Make Authenticated API Call ---
            // Adjust endpoint and payload keys if your backend differs
            await makeAuthenticatedRequest('put', `${API_BASE_URL}/user/password`, {
                old_password: oldPassword,
                password: newPassword,
                password_confirmation: confirmPassword,
            });

            alert("Password updated successfully!"); // Or use a more subtle notification
            setOldPassword(""); // Clear fields on success
            setNewPassword("");
            setConfirmPassword("");
            onClose(); // Close modal on success

        } catch (err) {
            console.error("Password update error:", err);
            let errorMsg = "Failed to update password.";
            if (err.response) {
                 // Handle validation errors (422) specifically if backend provides details
                 if (err.response.status === 422 && err.response.data?.errors) {
                     // Combine validation errors into one message
                     const messages = Object.values(err.response.data.errors).flat();
                     errorMsg = `Validation failed: ${messages.join(' ')}`;
                 } else if (err.response.data?.message) {
                     // Use backend message if available (e.g., "Incorrect old password")
                     errorMsg = err.response.data.message;
                 } else if (err.response.status === 401) {
                      errorMsg = "Authentication failed. Please log in again.";
                 }
            } else if (err.message?.includes("Unauthenticated")) {
                 errorMsg = "Authentication failed. Please log in again.";
            } else if (err.message) {
                 errorMsg = err.message;
            }
            setError(errorMsg); // Show error in the modal
        } finally {
            setIsUpdating(false); // Stop loading indicator
        }
    };

    // --- Account Deletion Handler ---
    const handleConfirmDelete = async () => {
        setError(""); // Clear previous errors
        setIsDeleting(true); // Start loading indicator

        try {
            // --- Make Authenticated API Call ---
            // Adjust endpoint if your backend differs
            await makeAuthenticatedRequest('delete', `${API_BASE_URL}/user/account`);

            alert("Account deleted successfully."); // Optional success message
            onAccountDeleteSuccess(); // Trigger the logout/redirect passed from parent
            onClose(); // Close the modal

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
             setError(errorMsg); // Show error in the modal
        } finally {
            setIsDeleting(false); // Stop loading indicator
        }
    };

    // Handle clicks outside the modal content to close it
    const handleOverlayClick = (e) => {
        if (e.target === e.currentTarget) { // Ensure click is on overlay, not content
            onClose();
        }
    };


    return (
        // Added overlay click handler
        <div className="modal-overlay" onClick={handleOverlayClick}>
            {/* Added stopPropagation to prevent overlay click when clicking inside content */}
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                {/* --- Error Display Area --- */}
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
                                <input
                                    id="old_password"
                                    type="password"
                                    placeholder="Enter current password"
                                    value={oldPassword}
                                    onChange={(e) => setOldPassword(e.target.value)}
                                    required // Add basic HTML validation
                                    disabled={isUpdating}
                                />
                            </div>
                            <div className="form-group">
                                <label htmlFor="new_password">New Password</label>
                                <input
                                    id="new_password"
                                    type="password"
                                    placeholder="Enter new password"
                                    value={newPassword}
                                    onChange={(e) => setNewPassword(e.target.value)}
                                    required
                                    disabled={isUpdating}
                                    // Add pattern for complexity if needed: pattern="(?=.*\d)(?=.*[a-z])(?=.*[A-Z]).{8,}"
                                />
                                 {/* Optional: Add password requirements text */}
                                {/* <small>Password must be at least 8 characters...</small> */}
                            </div>
                             <div className="form-group">
                                <label htmlFor="confirm_password">Confirm New Password</label>
                                <input
                                    id="confirm_password"
                                    type="password"
                                    placeholder="Confirm new password"
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    required
                                    disabled={isUpdating}
                                />
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
                ) : (
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
                )}
            </div>
        </div>
    );
};

export default LoginSecurityModal;