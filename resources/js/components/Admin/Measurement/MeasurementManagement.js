import React, { useState, useEffect } from "react";

const MeasurementManagement = ({ type, measurement, selectedMeasurements, measurementValue, onClose, onConfirm, onSave }) => {
    const [localMeasurement, setLocalMeasurement] = useState(measurementValue || "");
    const [error, setError] = useState("");

    useEffect(() => {
        if (type === "edit" && measurement) {
            setLocalMeasurement(measurement.measurement || "");
        } else if (type === "add") {
            setLocalMeasurement("");
        }
    }, [type, measurement, measurementValue]);

    const handleMeasurementChange = (e) => setLocalMeasurement(e.target.value);

    const handleSave = () => {
        const trimmedMeasurement = localMeasurement.trim();
        if (!trimmedMeasurement) {
            setError("Wrist measurement is required.");
            return;
        }
        setError("");

        if (type === "edit" && !measurement) {
            setError("No wrist measurement selected for editing.");
            return;
        }

        const measurementData = { measurement: trimmedMeasurement };
        onSave(measurementData);
        onClose();
    };

    const handleConfirm = () => {
        if (!selectedMeasurements?.length) {
            setError(`Please select at least one wrist measurement to ${type}.`);
            return;
        }
        setError("");
        onConfirm(selectedMeasurements);
        onClose();
    };

    const handleCancel = () => onClose();

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
                                placeholder="Enter wrist measurement"
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
        const action = type === "archive" ? "Archive" : "Restore";
        const message = `Are you sure you want to ${action.toLowerCase()} ${selectedMeasurements.length} wrist measurement(s)?`;

        return (
            <div className="MeasurementManagement">
                <div className="action-modal-overlay" onClick={handleCancel} data-testid={`${type}-overlay`}>
                    <div className="action-modal" onClick={e => e.stopPropagation()} data-testid={`${type}-modal`}>
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

export default MeasurementManagement;