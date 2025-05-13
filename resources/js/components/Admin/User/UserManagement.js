import React, { useState, useEffect } from "react";


const ROLES = [
    { id: "1", name: "Admin" },
    { id: "2", name: "Customer" },

];

const UserManagement = ({
    type,
    user, 
    selectedUsers = [],
    onClose,
    onConfirm, 
    onSave,    
    externalError
}) => {

    const [formData, setFormData] = useState({
        username: '',
        email: '',
        role_id: '', 
        
    });
    const [internalError, setInternalError] = useState(''); 
    const [validationErrors, setValidationErrors] = useState({}); 

    useEffect(() => {
        setInternalError('');
        setValidationErrors({});

        if (type === 'edit' && user) {
            setFormData({
                username: user.username || '',
                email: user.email || '',
                role_id: user.role_id ? String(user.role_id) : '',
            });
        } else if (type === 'add') { 
            setFormData({
                username: '',
                email: '',
                role_id: '',
            });
        }
        
    }, [type, user, externalError]); 

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        if (validationErrors[name]) {
            setValidationErrors(prev => ({ ...prev, [name]: null })); 
        }
        if (internalError) setInternalError(''); // Clear general internal error
    };

    const handleSaveClick = (e) => {
        e.preventDefault(); // Prevent default form submission if it's inside a form tag
        setInternalError('');
        setValidationErrors({});

        // Basic frontend validation (optional, backend should always validate)
        if (type === 'edit' || type === 'add') {
            if (!formData.username.trim()) {
                setInternalError("Username cannot be empty.");
                return;
            }
            if (!formData.email.trim()) { // Add more robust email validation if needed
                setInternalError("Email cannot be empty.");
                return;
            }
            if (!formData.role_id) {
                setInternalError("Please select a role.");
                return;
            }
        }

        if (typeof onSave === 'function') {
            onSave(formData, type, user ? user.id : null); // Pass formData, type, and user.id (for edit)
        } else {
            console.error("onSave prop is not a function!");
            setInternalError("Configuration error: Save function not available.");
        }
    };

    const handleConfirmClick = () => {
        if (typeof onConfirm === 'function') {
            onConfirm(selectedUsers);
        } else {
            console.error("onConfirm prop is not a function!");
        }
    };

    const handleCancelClick = () => {
        onClose();
    };

    // --- RENDER LOGIC FOR EDIT/ADD ---
    if (type === "edit" || type === "add") { // Assuming 'add' might be a future type
        const actionTitle = type === "edit" ? "Edit User" : "Add User";
        return (
            <div className={`${type}-modal-overlay user-edit-modal-overlay`} onClick={handleCancelClick}>
                <div className={`${type}-modal user-edit-modal`} onClick={e => e.stopPropagation()}>
                    <h3>{actionTitle} {user ? `(${user.username})` : ''}</h3>

                    {/* Display external errors passed from parent (e.g., API errors) */}
                    {externalError && <p className="error-message" style={{ color: 'red', marginBottom: '10px' }}>{externalError}</p>}
                    {/* Display internal form errors */}
                    {internalError && <p className="error-message" style={{ color: 'orange', marginBottom: '10px' }}>{internalError}</p>}

                    <form onSubmit={handleSaveClick} className="user-edit-form">
                        <div className="form-group">
                            <label htmlFor="username">Username:</label>
                            <input
                                type="text"
                                id="username"
                                name="username"
                                value={formData.username}
                                onChange={handleInputChange}
                                className={validationErrors.username ? 'input-error' : ''}
                            />
                            {validationErrors.username && <p className="validation-error">{validationErrors.username[0]}</p>}
                        </div>
                        <div className="form-group">
                            <label htmlFor="email">Email:</label>
                            <input
                                type="email"
                                id="email"
                                name="email"
                                value={formData.email}
                                onChange={handleInputChange}
                                className={validationErrors.email ? 'input-error' : ''}
                            />
                            {validationErrors.email && <p className="validation-error">{validationErrors.email[0]}</p>}
                        </div>
                        <div className="form-group">
                            <label htmlFor="role_id">Role:</label>
                            <select
                                id="role_id"
                                name="role_id"
                                value={formData.role_id}
                                onChange={handleInputChange}
                                className={validationErrors.role_id ? 'input-error' : ''}
                            >
                                <option value="">-- Select Role --</option>
                                {ROLES.map(role => (
                                    <option key={role.id} value={role.id}>{role.name}</option>
                                ))}
                            </select>
                            {validationErrors.role_id && <p className="validation-error">{validationErrors.role_id[0]}</p>}
                        </div>

                        {/* Add fields for password change if needed, with careful handling */}
                        {/*
                        <div className="form-group">
                            <label htmlFor="password">New Password (optional):</label>
                            <input type="password" id="password" name="password" onChange={handleInputChange} />
                        </div>
                        <div className="form-group">
                            <label htmlFor="password_confirmation">Confirm New Password:</label>
                            <input type="password" id="password_confirmation" name="password_confirmation" onChange={handleInputChange} />
                        </div>
                        */}

                        <div className="button-group">
                            <button type="submit" className="confirm-button save-user-button">
                                Save Changes
                            </button>
                            <button type="button" className="cancel-button" onClick={handleCancelClick}>
                                Cancel
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        );
    }


    // --- EXISTING RENDER LOGIC FOR ARCHIVE/RESTORE ---
    if (type === "archive" || type === "restore") {
        const action = type === "archive" ? "Archive" : "Restore";
        const itemsToAction = Array.isArray(selectedUsers) ? selectedUsers : [];
        const message = `Are you sure you want to ${action.toLowerCase()} ${itemsToAction.length} user(s)?`;

        if (itemsToAction.length === 0 && type !== 'edit' && type !== 'add') { // Added condition to avoid warning for edit/add
            console.warn("UserManagement confirmation modal rendered with no selected users for archive/restore.");
        }

        return (
            <div className={`${type}-modal-overlay`} onClick={handleCancelClick}>
                <div className={`${type}-modal`} onClick={e => e.stopPropagation()}>
                    <h3>Confirm {action}</h3>
                    {externalError && <p className="error-message" style={{ color: 'red' }}>{externalError}</p>}
                    <p>{message}</p>
                    {itemsToAction.length > 0 && itemsToAction.length <= 5 && (
                         <ul style={{maxHeight: '100px', overflowY: 'auto', fontSize: '0.9em', margin: '10px 0', paddingLeft: '20px'}}>
                            {itemsToAction.map(u => <li key={u.id}>{u.username} ({u.email})</li>)}
                         </ul>
                    )}
                    {itemsToAction.length > 5 && (
                         <p style={{fontSize: '0.9em', color: '#555'}}>(Action applies to {itemsToAction.length} selected users)</p>
                    )}
                    <div className="button-group">
                        <button className="confirm-button" onClick={handleConfirmClick}>
                            {action}
                        </button>
                        <button className="cancel-button" onClick={handleCancelClick}>
                            Cancel
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return null; // Should not be reached if type is one of the handled ones
};

export default UserManagement;