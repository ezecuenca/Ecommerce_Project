import React, { useState, useEffect } from "react";
import Axios from "axios";

const WatchColorManagement = ({ type, color, selectedColors, name, onClose, onConfirm, onSave }) => {
    const [localName, setLocalName] = useState(name || "");
    const [error, setError] = useState("");

    useEffect(() => {
        if (type === "edit" && color) {
            setLocalName(color.name || "");
        } else if (type === "add") {
            setLocalName("");
        }
    }, [type, color, name, selectedColors]);

    const validateName = (name) => {
        return name.trim().length > 0;
    };

    const handleNameChange = (e) => setLocalName(e.target.value);

    const handleSave = async () => {
        if (type === "edit") {
            if (!color) {
                alert("No color selected for editing.");
                return;
            }

            if (!validateName(localName)) {
                setError("Color name is required.");
                return;
            }

            try {
                await Axios.put(`http://localhost:8000/api/watch-colors/${color.id}`, {
                    color_name: localName.trim(),
                });
                onSave(); // Trigger refresh in parent
                onClose();
            } catch (error) {
                console.error("Error updating watch color:", error);
                if (error.response) {
                    console.log("Response data:", error.response.data);
                    console.log("Response status:", error.response.status);
                    const errorMessage = error.response.data.errors
                        ? Object.values(error.response.data.errors).flat().join(" ")
                        : "Failed to update watch color.";
                    setError(errorMessage);
                } else if (error.request) {
                    console.log("No response received:", error.request);
                    setError("No response from server while updating watch color. Please try again.");
                } else {
                    console.log("Error message:", error.message);
                    setError(`Error updating watch color: ${error.message}`);
                }
            }
        } else if (type === "add") {
            if (!validateName(localName)) {
                setError("Color name is required.");
                return;
            }

            try {
                await Axios.post("http://localhost:8000/api/watch-colors", {
                    color_name: localName.trim(),
                });
                onSave(); // Trigger refresh in parent
                onClose();
            } catch (error) {
                console.error("Error adding watch color:", error);
                if (error.response) {
                    console.log("Response data:", error.response.data);
                    console.log("Response status:", error.response.status);
                    const errorMessage = error.response.data.errors
                        ? Object.values(error.response.data.errors).flat().join(" ")
                        : "Failed to add watch color.";
                    setError(errorMessage);
                } else if (error.request) {
                    console.log("No response received:", error.request);
                    setError("No response from server while adding watch color. Please try again.");
                } else {
                    console.log("Error message:", error.message);
                    setError(`Error adding watch color: ${error.message}`);
                }
            }
        }
    };

    const handleConfirm = () => {
        if (type === "delete") {
            if (!selectedColors || selectedColors.length === 0) {
                alert("Please select at least one color to archive.");
                return;
            }
            onConfirm(selectedColors);
            onClose();
        } else if (type === "restore") {
            if (!selectedColors || selectedColors.length === 0) {
                alert("Please select at least one color to restore.");
                return;
            }
            onConfirm(selectedColors);
            onClose();
        }
    };

    const handleCancel = () => {
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
        const title = type === "delete" ? "Confirm Archive" : "Confirm Restore";
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