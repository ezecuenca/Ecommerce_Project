import React, { useState, useEffect } from "react";

const WatchColorManagement = ({ type, color, selectedColors, name, onClose, onConfirm, onSave }) => {
    const [localName, setLocalName] = useState(name || "");
    const [error, setError] = useState("");

    useEffect(() => {
        console.log("WatchColorManagement rendered with type:", type, "color:", color, "name:", name, "selectedColors:", selectedColors);
        if (type === "edit" && color) {
            setLocalName(color.name || "");
            console.log("Initializing edit for color:", color);
        } else if (type === "add") {
            setLocalName("");
            console.log("Initializing add for new color");
        }
    }, [type, color, name, selectedColors]);

    const validateName = (name) => {
        return name.trim().length > 0; // Simple validation for color name
    };

    const handleNameChange = (e) => setLocalName(e.target.value);

    const handleSave = () => {
        if (type === "edit") {
            if (!color) {
                alert("No color selected for editing.");
                return;
            }

            if (!validateName(localName)) {
                setError("Color name is required.");
                return;
            }

            setError("");
            const updatedColor = {
                ...color,
                name: localName.trim(),
                updatedAt: new Date().toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: '2-digit' }),
            };
            console.log("Saving updated color:", updatedColor);
            onSave(updatedColor);
            onClose();
        } else if (type === "add") {
            if (!validateName(localName)) {
                setError("Color name is required.");
                return;
            }

            setError("");
            const newColor = {
                id: Date.now(),
                name: localName.trim(),
                createdAt: new Date().toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: '2-digit' }),
                updatedAt: new Date().toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: '2-digit' }),
                isArchived: false, // New colors are active by default
            };
            console.log("Saving new color:", newColor);
            onSave(newColor);
            onClose();
        }
    };

    const handleConfirm = () => {
        console.log("Confirming action - type:", type, "selectedColors:", selectedColors);
        if (type === "delete") {
            if (!selectedColors || selectedColors.length === 0) {
                alert("Please select at least one color to delete.");
                return;
            }
            console.log("Confirming delete for colors:", selectedColors);
            onConfirm(selectedColors);
            onClose();
        } else if (type === "restore") {
            if (!selectedColors || selectedColors.length === 0) {
                alert("Please select at least one color to restore.");
                return;
            }
            console.log("Confirming restore for colors:", selectedColors);
            onConfirm(selectedColors);
            onClose();
        }
    };

    const handleCancel = () => {
        console.log("Closing modal for type:", type);
        onClose();
    };

    if (type === "edit" || type === "add") {
        const title = type === "edit" ? `Edit Color: ${color?.name || "Color"}` : "Add New Color";
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
    } else if (type === "delete" || type === "restore") {
        const title = type === "delete" ? "Confirm Delete" : "Confirm Restore";
        const message = type === "delete"
            ? `Are you sure you want to delete ${selectedColors.length} color(s)?`
            : `Are you sure you want to restore ${selectedColors.length} color(s)?`;

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

export default WatchColorManagement;