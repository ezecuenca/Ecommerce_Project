import React, { useState, useEffect } from "react";

const RolesManagement = ({ type, role, selectedRoles, name, onClose, onConfirm, onSave }) => {
    const [localName, setLocalName] = useState(name || "");
    const [error, setError] = useState("");

    useEffect(() => {
        console.log("RolesManagement rendered with type:", type, "role:", role, "name:", name, "selectedRoles:", selectedRoles);
        if (type === "edit" && role) {
            setLocalName(role.name || "");
            console.log("Initializing edit for role:", role);
        } else if (type === "add") {
            setLocalName("");
            console.log("Initializing add for new role");
        }
    }, [type, role, name, selectedRoles]);

    const validateName = (name) => {
        return name.trim().length > 0; // Simple validation for role name
    };

    const handleNameChange = (e) => setLocalName(e.target.value);

    const handleSave = () => {
        if (type === "edit") {
            if (!role) {
                alert("No role selected for editing.");
                return;
            }

            if (!validateName(localName)) {
                setError("Role name is required.");
                return;
            }

            setError("");
            const updatedRole = {
                ...role,
                name: localName.trim(),
                updatedAt: new Date().toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: '2-digit' }),
            };
            console.log("Saving updated role:", updatedRole);
            onSave(updatedRole);
            onClose();
        } else if (type === "add") {
            if (!validateName(localName)) {
                setError("Role name is required.");
                return;
            }

            setError("");
            const newRole = {
                id: Date.now(),
                name: localName.trim(),
                createdAt: new Date().toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: '2-digit' }),
                updatedAt: new Date().toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: '2-digit' }),
                isArchived: false, // New roles are active by default
            };
            console.log("Saving new role:", newRole);
            onSave(newRole);
            onClose();
        }
    };

    const handleConfirm = () => {
        console.log("Confirming action - type:", type, "selectedRoles:", selectedRoles);
        if (type === "delete") {
            if (!selectedRoles || selectedRoles.length === 0) {
                alert("Please select at least one role to delete.");
                return;
            }
            console.log("Confirming delete for roles:", selectedRoles);
            onConfirm(selectedRoles);
            onClose();
        } else if (type === "restore") {
            if (!selectedRoles || selectedRoles.length === 0) {
                alert("Please select at least one role to restore.");
                return;
            }
            console.log("Confirming restore for roles:", selectedRoles);
            onConfirm(selectedRoles);
            onClose();
        }
    };

    const handleCancel = () => {
        console.log("Closing modal for type:", type);
        onClose();
    };

    if (type === "edit" || type === "add") {
        const title = type === "edit" ? `Edit Role: ${role?.name || "Role"}` : "Add New Role";
        return (
            <div className="RolesManagement">
                <div className="edit-modal-overlay" onClick={handleCancel}>
                    <div className="edit-modal" onClick={e => e.stopPropagation()}>
                        <h3 className="edit-modal-header">{title}</h3>
                        {error && <p className="error-message">{error}</p>}
                        <div className="edit-form">
                            <label className="edit-form-label">Role Name:</label>
                            <input
                                type="text"
                                value={localName}
                                onChange={handleNameChange}
                                className="role-input"
                                placeholder="Enter role name"
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
    } else if (type === "delete" || type === "restore") {
        const title = type === "delete" ? "Confirm Delete" : "Confirm Restore";
        const message = type === "delete"
            ? `Are you sure you want to delete ${selectedRoles.length} role(s)?`
            : `Are you sure you want to restore ${selectedRoles.length} role(s)?`;

        return (
            <div className={`${type === "delete" ? "delete" : "restore"}-modal-overlay`} onClick={handleCancel} data-testid={`${type}-overlay`}>
                <div className={`${type === "delete" ? "delete" : "restore"}-modal`} onClick={e => e.stopPropagation()} data-testid={`${type}-modal`}>
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

export default RolesManagement;