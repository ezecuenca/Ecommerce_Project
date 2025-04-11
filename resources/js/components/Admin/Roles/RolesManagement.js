import React, { useState, useEffect } from "react";

const RolesManagement = ({ type, role, selectedRoles, name, externalError, onClose, onConfirm, onSave }) => {
    const [localName, setLocalName] = useState("");
    const [internalModalError, setInternalModalError] = useState("");

    useEffect(() => {
        setInternalModalError("");
        if (type === "edit" && role) {
            setLocalName(role.role_name || "");
        } else if (type === "add") {
            setLocalName(name || "");
        } else {
            setLocalName("");
        }
    }, [type, role, name]);

    useEffect(() => {
        setInternalModalError(externalError || "");
    }, [externalError]);

    const validateName = (nameToValidate) => {
        return nameToValidate.trim().length > 0;
    };

    const handleNameChange = (e) => {
        setLocalName(e.target.value);
        if (internalModalError) {
             setInternalModalError("");
        }
    };

    const handleSave = () => {
        if (!validateName(localName)) {
            setInternalModalError("Role name is required.");
            return;
        }
        setInternalModalError("");

        let dataToSave = {};
        if (type === "edit") {
             if (!role?.id) {
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
        console.log("Calling parent onSave with data:", dataToSave);
        onSave(dataToSave);
    };

    const handleConfirm = () => {
        if (!Array.isArray(selectedRoles) || selectedRoles.length === 0) {
            alert(`No roles selected for ${type}.`);
            return;
        }
         const protectedIds = [1, 2];
         const attemptedActionOnProtected = selectedRoles.some(item => protectedIds.includes(item.id));
         if (attemptedActionOnProtected) {
             alert("Cannot archive or restore the default Admin or Customer roles.");
             return;
         }

        setInternalModalError("");
        console.log(`Calling parent onConfirm in modal for ${type}:`, selectedRoles);
        onConfirm(selectedRoles);
    };

    const handleCancel = () => {
        onClose();
    };

    if (type === "edit" || type === "add") {
        const title = type === "edit" ? `Edit Role: ${role?.role_name || "..."}` : "Add New Role";
        return (
            <div className="modal-overlay" onClick={handleCancel}>
                <div className="modal-content" onClick={e => e.stopPropagation()}>
                    <h3 className="modal-header">{title}</h3>
                    <div className="edit-form">
                        {internalModalError && <p className="error-message" style={{color: 'red', marginBottom: '10px'}}>{internalModalError}</p>}
                        <label className="edit-form-label">Role Name:</label>
                        <input
                            type="text"
                            value={localName}
                            onChange={handleNameChange}
                            className="role-input"
                            placeholder="Enter role name"
                            autoFocus
                            aria-required="true"
                            aria-invalid={!!internalModalError}
                        />
                        <div className="button-group modal-footer">
                            <button className="save-button confirm-button" onClick={handleSave}>Save</button>
                            <button className="cancel-button" onClick={handleCancel}>Cancel</button>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    else if (type === "archive" || type === "restore") {
        const actionVerb = type === 'archive' ? "Archive" : "Restore";
        const title = `Confirm ${actionVerb}`;
        const count = Array.isArray(selectedRoles) ? selectedRoles.length : 0;
        const roleNoun = count === 1 ? "role" : "roles";
        const message = `Are you sure you want to ${actionVerb.toLowerCase()} ${count} ${roleNoun}?`;
        const modalClass = `${type}-modal modal-content`;
        const overlayClass = `${type}-modal-overlay modal-overlay`;

        return (
            <div className={overlayClass} onClick={handleCancel} data-testid={`${type}-overlay`}>
                <div className={modalClass} onClick={e => e.stopPropagation()} data-testid={`${type}-modal`}>
                    <h3 className="modal-header">{title}</h3>
                    {internalModalError && <p className="error-message" style={{color: 'red', marginBottom: '10px'}}>{internalModalError}</p>}
                    <p style={{ margin: '20px 0' }}>{message}</p>
                    <div className="button-group modal-footer">
                        <button className="confirm-button" onClick={handleConfirm} disabled={count === 0}>
                            {actionVerb}
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