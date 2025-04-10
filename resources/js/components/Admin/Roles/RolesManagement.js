import React, { useState, useEffect } from "react";

const RolesManagement = ({ type, role, selectedRoles, name, error: parentError, onClose, onConfirm, onSave }) => {
    const [localName, setLocalName] = useState("");
    const [localError, setLocalError] = useState("");

    useEffect(() => {
        if (type === "edit" && role) {
            setLocalName(role.role_name || "");
        } else if (type === "add") {
            setLocalName(name || "");
        } else {
            setLocalName("");
        }
        setLocalError("");
    }, [type, role, name]);

     useEffect(() => {
         setLocalError(parentError || "");
     }, [parentError]);

    const validateName = (nameToValidate) => {
        return nameToValidate.trim().length > 0;
    };

    const handleNameChange = (e) => {
        setLocalName(e.target.value);
        if (localError) {
             setLocalError("");
        }
    };

    const handleSave = () => {
        if (!validateName(localName)) {
            setLocalError("Role name is required.");
            return;
        }
        setLocalError("");

        let dataToSave = {};
        if (type === "edit") {
             if (!role) {
                 alert("Error: No role specified for editing.");
                 return;
             }
             dataToSave = {
                 role_name: localName.trim()
             };
        } else if (type === "add") {
             dataToSave = {
                 role_name: localName.trim()
             };
        }
        console.log("Calling onSave with data:", dataToSave);
        onSave(dataToSave);
    };


    const handleConfirm = () => {
        if (type === "archive" || type === "restore") {
            if (!selectedRoles || selectedRoles.length === 0) {
                alert(`No roles selected for ${type}.`);
                return;
            }
            console.log(`Confirming ${type} in modal for:`, selectedRoles);
            onConfirm(selectedRoles);
        }
    };

    const handleCancel = () => {
        onClose();
    };

    if (type === "edit" || type === "add") {
        const title = type === "edit" ? `Edit Role: ${role?.role_name || "Role"}` : "Add New Role";
        return (
            <div className="RolesManagement">
                <div className="edit-modal-overlay" onClick={handleCancel}>
                    <div className="edit-modal" onClick={e => e.stopPropagation()}>
                        <h3 className="edit-modal-header">{title}</h3>
                        {localError && <p className="error-message" style={{color: 'red'}}>{localError}</p>}
                        <div className="edit-form">
                            <label className="edit-form-label">Role Name:</label>
                            <input
                                type="text"
                                value={localName}
                                onChange={handleNameChange}
                                className="role-input"
                                placeholder="Enter role name"
                                autoFocus
                            />
                            <div className="button-group">
                                <button className="save-button" onClick={handleSave}>Save</button>
                                <button className="cancel-button" onClick={handleCancel}>Cancel</button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }
    else if (type === "archive" || type === "restore") {
        const isArchiving = type === 'archive';
        const title = isArchiving ? "Confirm Archive" : "Confirm Restore";
        const message = `Are you sure you want to ${type} ${selectedRoles?.length || 0} role(s)?`;
        const buttonText = isArchiving ? "Delete" : "Restore";
        const modalClass = isArchiving ? "delete-modal" : "restore-modal";
        const overlayClass = isArchiving ? "delete-modal-overlay" : "restore-modal-overlay";

        return (
            <div className={overlayClass} onClick={handleCancel} data-testid={`${type}-overlay`}>
                <div className={modalClass} onClick={e => e.stopPropagation()} data-testid={`${type}-modal`}>
                    <h3>{title}</h3>
                     {localError && <p className="error-message" style={{color: 'red'}}>{localError}</p>}
                    <p>{message}</p>

                    <div className="button-group">
                        <button className="save-button" onClick={handleConfirm}>
                            {buttonText}
                        </button>
                        <button className="cancel-button" onClick={handleCancel}>Cancel</button>
                    </div>
                </div>
            </div>
        );
    }

    return null;
};

export default RolesManagement;