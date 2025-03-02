import React, { useState, useEffect } from "react";

const MeasurementManagement = ({ type, measurement, selectedMeasurements, measurementValue, onClose, onConfirm, onSave }) => {
    const [localMeasurement, setLocalMeasurement] = useState(measurementValue || "");
    const [error, setError] = useState("");

    useEffect(() => {
        console.log("MeasurementManagement rendered with type:", type, "measurement:", measurement, "measurementValue:", measurementValue, "selectedMeasurements:", selectedMeasurements);
        if (type === "edit" && measurement) {
            setLocalMeasurement(measurement.measurement || "");
            console.log("Initializing edit for measurement:", measurement);
        } else if (type === "add") {
            setLocalMeasurement("");
            console.log("Initializing add for new measurement");
        }
    }, [type, measurement, measurementValue, selectedMeasurements]);

    const validateMeasurement = (measurement) => {
        return measurement.trim().length > 0; // Simple validation for measurement
    };

    const handleMeasurementChange = (e) => setLocalMeasurement(e.target.value);

    const handleSave = () => {
        if (type === "edit") {
            if (!measurement) {
                alert("No measurement selected for editing.");
                return;
            }

            if (!validateMeasurement(localMeasurement)) {
                setError("Measurement is required.");
                return;
            }

            setError("");
            const updatedMeasurement = {
                ...measurement,
                measurement: localMeasurement.trim(),
                updatedAt: new Date().toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: '2-digit' }),
            };
            console.log("Saving updated measurement:", updatedMeasurement);
            onSave(updatedMeasurement);
            onClose();
        } else if (type === "add") {
            if (!validateMeasurement(localMeasurement)) {
                setError("Measurement is required.");
                return;
            }

            setError("");
            const newMeasurement = {
                id: Date.now(),
                measurement: localMeasurement.trim(),
                createdAt: new Date().toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: '2-digit' }),
                updatedAt: new Date().toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: '2-digit' }),
                isArchived: false, // New measurements are active by default
            };
            console.log("Saving new measurement:", newMeasurement);
            onSave(newMeasurement);
            onClose();
        }
    };

    const handleConfirm = () => {
        console.log("Confirming action - type:", type, "selectedMeasurements:", selectedMeasurements);
        if (type === "delete") {
            if (!selectedMeasurements || selectedMeasurements.length === 0) {
                alert("Please select at least one measurement to delete.");
                return;
            }
            console.log("Confirming delete for measurements:", selectedMeasurements);
            onConfirm(selectedMeasurements);
            onClose();
        } else if (type === "restore") {
            if (!selectedMeasurements || selectedMeasurements.length === 0) {
                alert("Please select at least one measurement to restore.");
                return;
            }
            console.log("Confirming restore for measurements:", selectedMeasurements);
            onConfirm(selectedMeasurements);
            onClose();
        }
    };

    const handleCancel = () => {
        console.log("Closing modal for type:", type);
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
        const title = type === "delete" ? "Confirm Delete" : "Confirm Restore";
        const message = type === "delete"
            ? `Are you sure you want to delete ${selectedMeasurements.length} measurement(s)?`
            : `Are you sure you want to restore ${selectedMeasurements.length} measurement(s)?`;

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

export default MeasurementManagement;