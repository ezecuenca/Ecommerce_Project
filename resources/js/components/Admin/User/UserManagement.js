import React, { useState, useEffect } from "react";

const UserManagement = ({ type, user, selectedUsers, username, email, role, onClose, onConfirm, onSave }) => {
    const [localUsername, setLocalUsername] = useState(username || "");
    const [localEmail, setLocalEmail] = useState(email || "");
    const [localRole, setLocalRole] = useState(role || "Customer");
    const [error, setError] = useState("");

    // Initialize state with user data for edit or add
    useEffect(() => {
        if (type === "edit" && user) {
            setLocalUsername(user.username || "");
            setLocalEmail(user.email || "");
            setLocalRole(user.role || "Customer");
            console.log("Initializing edit for user:", user);
        } else if (type === "add") {
            setLocalUsername("");
            setLocalEmail("");
            setLocalRole("Customer");
            console.log("Initializing add for new user");
        }
    }, [type, user]);

    const validateEmail = (email) => {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    };

    const handleUsernameChange = (e) => {
        const value = e.target.value;
        console.log("Username input changed to:", value);
        setLocalUsername(value);
    };

    const handleEmailChange = (e) => {
        const value = e.target.value;
        console.log("Email input changed to:", value);
        setLocalEmail(value);
    };

    const handleRoleChange = (e) => {
        const value = e.target.value;
        console.log("Role input changed to:", value);
        setLocalRole(value);
    };

    const handleSave = () => {
        if (type === "edit") {
            if (!user) {
                alert("No user selected for editing.");
                return;
            }

            if (!localUsername.trim()) {
                setError("Username is required.");
                return;
            }

            if (!validateEmail(localEmail)) {
                setError("Please enter a valid email address.");
                return;
            }

            if (!localRole) {
                setError("Role is required.");
                return;
            }

            setError("");
            const updatedUser = {
                ...user,
                username: localUsername.trim(),
                email: localEmail,
                role: localRole,
                updatedAt: new Date().toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: '2-digit' }),
            };
            console.log("Saving updated user:", updatedUser);
            onSave(updatedUser);
            onClose();
        } else if (type === "add") {
            if (!localUsername.trim()) {
                setError("Username is required.");
                return;
            }

            if (!validateEmail(localEmail)) {
                setError("Please enter a valid email address.");
                return;
            }

            if (!localRole) {
                setError("Role is required.");
                return;
            }

            setError("");
            const newUser = {
                id: Date.now(),
                username: localUsername.trim(),
                email: localEmail,
                role: localRole,
                isArchived: false,
                createdAt: new Date().toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: '2-digit' }),
                updatedAt: new Date().toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: '2-digit' }),
            };
            console.log("Saving new user:", newUser);
            onSave(newUser);
            onClose();
        }
    };

    const handleConfirm = () => {
        if (type === "delete") {
            if (!selectedUsers || selectedUsers.length === 0) {
                alert("Please select at least one user to delete.");
                return;
            }
            onConfirm(selectedUsers);
            onClose();
        } else if (type === "restore") {
            if (!selectedUsers || selectedUsers.length === 0) {
                alert("Please select at least one user to restore.");
                return;
            }
            onConfirm(selectedUsers);
            onClose();
        }
    };

    const handleCancel = () => {
        if (type === "edit" || type === "add") {
            console.log(`Canceling ${type} for user:`, user || "new user");
        } else if (type === "delete" || type === "restore") {
            console.log(`Canceling ${type} for selected users:`, selectedUsers);
        }
        onClose();
    };

    if (type === "edit" || type === "add") {
        const title = type === "edit" ? `Edit User: ${user?.username || "User"}` : "Add New User";
        return (
            <div className="edit-modal-overlay" onClick={handleCancel}>
                <div className="edit-modal" onClick={e => e.stopPropagation()}>
                    <h3 className="edit-modal-header">{title}</h3>
                    {error && <p className="error-message">{error}</p>}
                    <div className="edit-form">
                        <label className="edit-form-label">Username:</label>
                        <input
                            type="text"
                            value={localUsername}
                            onChange={handleUsernameChange}
                            className="user-input"
                            placeholder="Enter username"
                            style={{ cursor: "text", pointerEvents: "auto", userSelect: "text" }}
                        />
                        <label className="edit-form-label">Email:</label>
                        <input
                            type="email"
                            value={localEmail}
                            onChange={handleEmailChange}
                            className="user-input"
                            placeholder="Enter email"
                            style={{ cursor: "text", pointerEvents: "auto", userSelect: "text" }}
                        />
                        <label className="edit-form-label">Role:</label>
                        <select
                            value={localRole}
                            onChange={handleRoleChange}
                            className="user-input"
                            style={{ cursor: "pointer", pointerEvents: "auto", userSelect: "text" }}
                        >
                            <option value="Customer">Customer</option>
                            <option value="Admin">Admin</option>
                        </select>
                        <div className="button-group">
                            <button className="save-button" onClick={handleSave}>Save</button>
                            <button className="cancel-button" onClick={handleCancel}>Cancel</button>
                        </div>
                    </div>
                </div>
            </div>
        );
    } else if (type === "delete" || type === "restore") {
        const title = type === "delete" ? "Confirm Delete" : "Confirm Restore";
        const message = type === "delete"
            ? `Are you sure you want to delete ${Array.isArray(selectedUsers) ? selectedUsers.length : 1} user(s)?`
            : `Are you sure you want to restore ${selectedUsers.length} user(s)?`;

        return (
            <div className={`${type}-modal-overlay`} onClick={handleCancel} style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                <div className={`${type}-modal`} onClick={e => e.stopPropagation()} style={{ position: 'relative', margin: 'auto' }}>
                    <h3>{title}</h3>
                    <p>{message}</p>
                    <div className="button-group">
                        <button className="save-button" onClick={handleConfirm}>
                            {type === "delete" ? "Delete" : "Restore"}
                        </button>
                        <button className="cancel-button" onClick={handleCancel}>Cancel</button>
                    </div>
                </div>
            </div>
        );
    }

    return null;
};

export default UserManagement;