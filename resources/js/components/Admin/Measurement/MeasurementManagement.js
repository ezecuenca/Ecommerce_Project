import React, { useState, useEffect } from "react";
import Axios from "axios";

const MeasurementManagement = ({ type, measurement, selectedMeasurements, onClose, onConfirm, onSave }) => {
    const [localMeasurement, setLocalMeasurement] = useState("");
    const [error, setError] = useState("");

    useEffect(() => {
        if (type === "edit" && measurement) {
            setLocalMeasurement(measurement.measurement || "");
        } else if (type === "add") {
            setLocalMeasurement("");
        }
    }, [type, measurement, selectedMeasurements]);

    const validateMeasurement = (measurement) => {
        return measurement.trim().length > 0;
    };

    const handleMeasurementChange = (e) => setLocalMeasurement(e.target.value);

    const handleSave = async () => {
        if (type === "edit") {
            if (!measurement) {
                alert("No measurement selected for editing.");
                return;
            }

            if (!validateMeasurement(localMeasurement)) {
                setError("Wrist measurement is required.");
                return;
            }

            try {
                await Axios.put(`http://localhost:8000/api/wrist-measurements/${measurement.id}`, {
                    measurement: localMeasurement.trim(),
                });
                onSave(); // Trigger refresh in parent
                onClose();
            } catch (error) {
                console.error("Error updating wrist measurement:", error);
                if (error.response) {
                    console.log("Response data:", error.response.data);
                    console.log("Response status:", error.response.status);
                    const errorMessage = error.response.data.errors
                        ? Object.values(error.response.data.errors).flat().join(" ")
                        : "Failed to update wrist measurement.";
                    setError(errorMessage);
                } else if (error.request) {
                    console.log("No response received:", error.request);
                    setError("No response from server while updating wrist measurement. Please try again.");
                } else {
                    console.log("Error message:", error.message);
                    setError(`Error updating wrist measurement: ${error.message}`);
                }
            }
        } else if (type === "add") {
            if (!validateMeasurement(localMeasurement)) {
                setError("Wrist measurement is required.");
                return;
            }

            try {
                await Axios.post("http://localhost:8000/api/wrist-measurements", {
                    measurement: localMeasurement.trim(),
                });
                onSave(); // Trigger refresh in parent
                onClose();
            } catch (error) {
                console.error("Error adding wrist measurement:", error);
                if (error.response) {
                    console.log("Response data:", error.response.data);
                    console.log("Response status:", error.response.status);
                    const errorMessage = error.response.data.errors
                        ? Object.values(error.response.data.errors).flat().join(" ")
                        : "Failed to add wrist measurement.";
                    setError(errorMessage);
                } else if (error.request) {
                    console.log("No response received:", error.request);
                    setError("No response from server while adding wrist measurement. Please try again.");
                } else {
                    console.log("Error message:", error.message);
                    setError(`Error adding wrist measurement: ${error.message}`);
                }
            }
        }
    };

    const handleConfirm = () => {
        if (type === "delete") {
            if (!selectedMeasurements || selectedMeasurements.length === 0) {
                alert("Please select at least one measurement to archive.");
                return;
            }
            onConfirm(selectedMeasurements);
            onClose();
        } else if (type === "restore") {
            if (!selectedMeasurements || selectedMeasurements.length === 0) {
                alert("Please select at least one measurement to restore.");
                return;
            }
            onConfirm(selectedMeasurements);
            onClose();
        }
    };

    const handleCancel = () => {
        onClose();
    };

    if (type === "edit" || type === "add") {
        const title = type === "edit" ? `Edit Wrist Measurement: ${measurement?.measurement || "Measurement"}` : "Add New Wrist Measurement";
        return (
            <div className="MeasurementManagement">
                <div className="edit-modal-overlay" onClick={handleCancel}>
                    <div className="edit-modal" onClick={e => e.stopPropagation()}>
                        <h3 className="edit-modal-header">{title}</h3>
                        {error && <p className="error-message">{error}</p>}
                        <div className="edit-form">
                            <label className="edit-form-label">Wrist Measurement:</label>
                            <input
                                type="text"
                                value={localMeasurement}
                                onChange={handleMeasurementChange}
                                className="measurement-input"
                                placeholder="Enter wrist measurement (e.g., 6.5 inches)"
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
            ? `Are you sure you want to archive ${selectedMeasurements.length} measurement(s)?`
            : `Are you sure you want to restore ${selectedMeasurements.length} measurement(s)?`;

        return (
            <div className={`${type === "delete" ? "delete" : "restore"}-modal-overlay`} onClick={handleCancel} data-testid={`${type}-overlay`}>
                <div className={`${type === "delete" ? "delete" : "restore"}-modal`} onClick={e => e.stopPropagation()} data-testid={`${type}-modal`}>
                    <h3>{title}</h3>
                    <p>{message}</p>
                    <div className="button-group">
                        <button className="save-button" onClick={handleConfirm}>
                            {type === "delete" ? "Archive" : "Restore"}
                        </button>
                        <button className="cancel-button" onClick={handleCancel}>Cancel</button>
                    </div>
                </div>
            </div>
        );
    }

    return null;
};

export default MeasurementManagement;