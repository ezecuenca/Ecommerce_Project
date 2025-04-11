import React, { useState, useEffect } from "react";

const WatchColorManagement = ({ type, color, selectedColors, name, onClose, onConfirm, onSave, externalError }) => {
    const [internalError, setInternalError] = useState("");
    const [localName, setLocalName] = useState("");

    useEffect(() => {
        setInternalError("");
        if (type === "edit" && color) {
            setLocalName(color.color_name || "");
        } else if (type === "add") {
            setLocalName("");
        }
    }, [type, color]);

    const handleNameChange = (e) => {
        setLocalName(e.target.value);
        if (internalError) {
            setInternalError("");
        }
    };

    const handleSave = () => {
        const trimmedName = localName.trim();
        if (!trimmedName) {
            setInternalError("Color name is required.");
            return;
        }
        setInternalError("");

        if (type === "edit" && !color?.id) {
            setInternalError("Cannot save edit: Invalid color selected.");
            return;
        }

        const colorData = { color_name: trimmedName };
        onSave(colorData);
    };

    const handleConfirm = () => {
        if (!Array.isArray(selectedColors) || selectedColors.length === 0) {
            setInternalError(`No colors selected to ${type}.`);
            return;
        }
        setInternalError("");
        onConfirm(selectedColors);
    };

    const handleCancel = () => {
        onClose();
    };

    if (type === "edit" || type === "add") {
        const title = type === "edit" ? `Edit Color: ${color?.color_name || "..."}` : "Add New Color";
        return (
            <div className="modal-overlay" onClick={handleCancel}>
                <div className="modal-content" onClick={e => e.stopPropagation()}>
                    <h3 className="modal-header">{title}</h3>
                    <div className="edit-form">
                        {internalError && <p className="error-message" style={{ color: 'orange', marginBottom: '10px' }}>{internalError}</p>}
                        {externalError && <p className="error-message" style={{ color: 'red', marginBottom: '10px' }}>Error: {externalError}</p>}
                        <label className="edit-form-label">Color Name:</label>
                        <input
                            type="text"
                            value={localName}
                            onChange={handleNameChange}
                            className="color-input"
                            placeholder="Enter color name"
                            aria-required="true"
                            aria-invalid={!!internalError || !!externalError}
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
        const actionVerb = type === "archive" ? "Archive" : "Restore";
        const title = `Confirm ${actionVerb}`;
        const count = Array.isArray(selectedColors) ? selectedColors.length : 0;
        const colorNoun = count === 1 ? "color" : "colors";
        const message = `Are you sure you want to ${actionVerb.toLowerCase()} ${count} ${colorNoun}?`;

        return (
            <div className={`${type}-modal-overlay modal-overlay`} onClick={handleCancel} data-testid={`${type}-overlay`}>
                <div className={`${type}-modal modal-content`} onClick={e => e.stopPropagation()} data-testid={`${type}-modal`}>
                    <h3 className="modal-header">{title}</h3>
                    <p style={{ margin: '20px 0' }}>{message}</p>
                    {externalError && <p className="error-message" style={{ color: 'red', marginBottom: '10px' }}>Error: {externalError}</p>}
                    {internalError && <p className="error-message" style={{ color: 'orange', marginBottom: '10px' }}>{internalError}</p>}
                    <div className="button-group modal-footer">
                        <button className="confirm-button" onClick={handleConfirm} disabled={count === 0}>{actionVerb}</button>
                        <button className="cancel-button" onClick={handleCancel}>Cancel</button>
                    </div>
                </div>
            </div>
        );
    }

    return null;
};

export default WatchColorManagement;