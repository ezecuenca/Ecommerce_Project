import React, { useState, useEffect } from "react";

const WatchColorManagement = ({ type, color, selectedColors, name, onClose, onConfirm, onSave }) => {
    const [localName, setLocalName] = useState(name || "");
    const [error, setError] = useState("");

    useEffect(() => {
        if (type === "edit" && color) {
            setLocalName(color.color_name || "");
        } else if (type === "add") {
            setLocalName("");
        }
    }, [type, color, name]);

    const handleNameChange = (e) => setLocalName(e.target.value);

    const handleSave = () => {
        const trimmedName = localName.trim();
        if (!trimmedName) {
            setError("Color name is required.");
            return;
        }
        setError("");

        if (type === "edit" && !color) {
            setError("No color selected for editing.");
            return;
        }

        const colorData = { color_name: trimmedName };
        onSave(colorData);
        onClose();
    };

    const handleConfirm = () => {
        if (!selectedColors?.length) {
            setError(`Please select at least one color to ${type}.`);
            return;
        }
        setError("");
        onConfirm(selectedColors);
        onClose();
    };

    const handleCancel = () => onClose();

    if (type === "edit" || type === "add") {
        const title = type === "edit" ? `Edit Color: ${color?.color_name || "Color"}` : "Add New Color";
        return (
            <div className="WatchColorManagement">
                <div className="edit-modal-overlay" onClick={handleCancel}>
                    <div className="edit-modal" onClick={e => e.stopPropagation()}>
                        <h3 className="edit-modal-header">{title}</h3>
                        {error && <p className="error-message">{error}</p>}
                        <div className="edit-form">
                            <label className="edit-form-label">Color Name:</label>
                            <input
                                type="text"
                                value={localName}
                                onChange={handleNameChange}
                                className="color-input"
                                placeholder="Enter color name"
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
    } else if (type === "archive" || type === "restore") {
        const action = type === "archive" ? "Delete" : "Restore";
        const message = `Are you sure you want to ${action.toLowerCase()} ${selectedColors.length} color(s)?`;

        return (
            <div className="WatchColorManagement">
                <div className={`${type}-modal-overlay`} onClick={handleCancel} data-testid={`${type}-overlay`}>
                    <div className={`${type}-modal`} onClick={e => e.stopPropagation()} data-testid={`${type}-modal`}>
                        <h3>Confirm {action}</h3>
                        {error && <p className="error-message">{error}</p>}
                        <p>{message}</p>
                        <div className="button-group">
                            <button className="save-button" onClick={handleConfirm}>{action}</button>
                            <button className="cancel-button" onClick={handleCancel}>Cancel</button>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return null;
};

export default WatchColorManagement;