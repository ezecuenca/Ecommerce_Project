import React, { useState, useEffect } from "react";

const UserManagement = ({
    type,
    selectedUsers = [],
    onClose,
    onConfirm,
    externalError
}) => {

    useEffect(() => {
    }, [type, externalError]);

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

    if (type === "archive" || type === "restore") {
        const action = type === "archive" ? "Archive" : "Restore";
        const itemsToAction = Array.isArray(selectedUsers) ? selectedUsers : [];
        const message = `Are you sure you want to ${action.toLowerCase()} ${itemsToAction.length} user(s)?`;

        if (itemsToAction.length === 0) {
            console.warn("UserManagement confirmation modal rendered with no selected users.");
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
                        <button className="confirm-button" onClick={handleConfirmClick} >
                            {action}
                        </button>
                        <button className="cancel-button" onClick={handleCancelClick} >
                            Cancel
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return null;
};

export default UserManagement;