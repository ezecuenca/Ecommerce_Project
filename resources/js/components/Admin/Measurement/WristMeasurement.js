import React, { useState, useEffect, useRef } from "react";
import { FaEdit, FaTrash, FaUndo } from "react-icons/fa";
import MeasurementManagement from "./MeasurementManagement";
import Axios from 'axios';

const WristMeasurement = () => {
    const [checkedRows, setCheckedRows] = useState({});
    const [isSelectAll, setIsSelectAll] = useState(false);
    const [viewType, setViewType] = useState("active");
    const [managementModalOpen, setManagementModalOpen] = useState(false);
    const [managementType, setManagementType] = useState("");
    const [selectedMeasurement, setSelectedMeasurement] = useState(null);
    const [measurement, setMeasurement] = useState("");
    const [error, setError] = useState("");
    const [forceUpdate, setForceUpdate] = useState(0);
    const [currentPage, setCurrentPage] = useState(1);
    const [searchQuery, setSearchQuery] = useState("");
    const [measurements, setMeasurements] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const tableRef = useRef(null);
    const itemsPerPage = 5;

    useEffect(() => {
        const fetchMeasurements = async () => {
            try {
                const response = await Axios.get('/api/wrist_measurements');
                console.log("API Response:", response.data);
                setMeasurements(response.data);
            } catch (error) {
                console.error("Error fetching wrist measurements:", error);
                setError("Failed to load wrist measurements. Please try again.");
            } finally {
                setIsLoading(false);
            }
        };
        fetchMeasurements();
    }, []);

    const getCurrentData = () => {
        if (!measurements.length) return [];
        let filteredMeasurements = measurements.filter(measurement => 
            viewType === "active" ? measurement.status === 1 : measurement.status === 0
        );
        if (searchQuery.trim()) {
            filteredMeasurements = filteredMeasurements.filter(measurement =>
                measurement.measurement.toLowerCase().includes(searchQuery.toLowerCase())
            );
        }
        return filteredMeasurements;
    };

    const currentData = getCurrentData();
    const totalPages = Math.ceil(currentData.length / itemsPerPage);
    const currentItems = currentData.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    );

    const handleSelectAll = (e) => {
        const isChecked = e.target.checked;
        setIsSelectAll(isChecked);
        const newCheckedRows = {};
        currentItems.forEach(measurement => {
            newCheckedRows[measurement.id] = isChecked;
        });
        setCheckedRows(newCheckedRows);
        if (tableRef.current) {
            tableRef.current.querySelectorAll('.measurement-checkbox').forEach(checkbox => {
                checkbox.checked = isChecked;
            });
        }
    };

    const handleRowCheckbox = (measurement, e) => {
        setCheckedRows(prev => ({
            ...prev,
            [measurement.id]: e.target.checked
        }));
        setIsSelectAll(currentItems.every(item => checkedRows[item.id] || (item.id === measurement.id && e.target.checked)));
    };

    const getSelectedItems = (singleItem = null) => {
        if (singleItem) return [singleItem];
        return currentItems.filter(measurement => checkedRows[measurement.id]);
    };

    const handleArchive = (measurementToArchive = null) => {
        const selectedItems = getSelectedItems(measurementToArchive);
        if (viewType !== "active") {
            alert("You can only archive from Active Wrist Measurements.");
            return;
        }
        if (!selectedItems.length) {
            alert("Please select at least one wrist measurement to archive.");
            return;
        }
        setManagementType("archive");
        setSelectedMeasurement(selectedItems);
        setManagementModalOpen(true);
    };

    const handleRestore = (measurementToRestore = null) => {
        const selectedItems = getSelectedItems(measurementToRestore);
        if (viewType !== "archived") {
            alert("You can only restore from Archived Wrist Measurements.");
            return;
        }
        if (!selectedItems.length) {
            alert("Please select at least one wrist measurement to restore.");
            return;
        }
        setManagementType("restore");
        setSelectedMeasurement(selectedItems);
        setManagementModalOpen(true);
    };

    const handleAdd = () => {
        setManagementType("add");
        setMeasurement("");
        setSelectedMeasurement(null);
        setManagementModalOpen(true);
    };

    const handleEdit = (measurement) => {
        setSelectedMeasurement(measurement);
        setMeasurement(measurement.measurement || "");
        setManagementType("edit");
        setManagementModalOpen(true);
    };

    const validateMeasurement = (measurement) => measurement.trim().length > 0;

    const handleMeasurementChange = (e) => setMeasurement(e.target.value);

    const handleSearchChange = (e) => {
        setSearchQuery(e.target.value);
        setCurrentPage(1);
    };

    const handleSaveEditOrAdd = async (newOrUpdatedMeasurement) => {
        if (!validateMeasurement(newOrUpdatedMeasurement.measurement)) {
            setError("Wrist measurement is required.");
            return;
        }
        setError("");
        try {
            if (managementType === "edit") {
                if (!selectedMeasurement) throw new Error("No wrist measurement selected for editing.");
                await Axios.put(`/api/wrist_measurements/${selectedMeasurement.id}`, {
                    measurement: newOrUpdatedMeasurement.measurement,
                    updated_at: new Date().toISOString(),
                    status: 1
                });
            } else if (managementType === "add") {
                await Axios.post('/api/wrist_measurements', {
                    measurement: newOrUpdatedMeasurement.measurement,
                    created_at: new Date().toISOString(),
                    status: 1
                });
            }
            const response = await Axios.get('/api/wrist_measurements');
            setMeasurements(response.data);
            setManagementModalOpen(false);
            setSelectedMeasurement(null);
            setMeasurement("");
            setForceUpdate(prev => prev + 1);
            setCurrentPage(1);
        } catch (error) {
            console.error(`Error ${managementType}ing wrist measurement:`, error);
            setError(`Failed to ${managementType} wrist measurement. Please try again.`);
        }
    };

    const handleConfirmDeleteOrRestore = async (items) => {
        if (!items?.length) {
            alert(`Please select at least one wrist measurement to ${managementType}.`);
            return;
        }
        try {
            const measurementIds = items.map(item => item.id);
            console.log(`${managementType} payload:`, managementType === "archive" ? { data: { ids: measurementIds } } : { ids: measurementIds });
            if (managementType === "archive") {
                const response = await Axios.put('/api/wrist_measurements/archive', { data: { ids: measurementIds } });
                console.log("Archive response:", response.data);
            } else if (managementType === "restore") {
                const response = await Axios.put('/api/wrist_measurements/restore', { ids: measurementIds });
                console.log("Restore response:", response.data);
            }
            const response = await Axios.get('/api/wrist_measurements');
            setMeasurements(response.data);
            setCheckedRows({});
            setIsSelectAll(false);
            if (tableRef.current) {
                tableRef.current.querySelectorAll('.measurement-checkbox').forEach(checkbox => checkbox.checked = false);
            }
            setManagementModalOpen(false);
            if (currentData.length <= itemsPerPage) setCurrentPage(1);
            setForceUpdate(prev => prev + 1);
        } catch (error) {
            console.error(`Error ${managementType}ing wrist measurements:`, error.response?.data || error.message);
            setError(`Failed to ${managementType} wrist measurements: ${error.response?.data?.errors ? JSON.stringify(error.response.data.errors) : error.message}`);
        }
    };

    const handleCloseManagement = () => {
        setManagementModalOpen(false);
        setManagementType("");
        setSelectedMeasurement(null);
        setMeasurement("");
        setError("");
    };

    const checkedCount = Object.values(checkedRows).filter(Boolean).length;

    return (
        <div className="WristMeasurement">
            <h2 className="measurements-header">{viewType === "active" ? "Active Wrist Measurements" : "Archived Wrist Measurements"}</h2>
            {error && <p className="error-message">{error}</p>}
            {isLoading ? (
                <p>Loading wrist measurements...</p>
            ) : (
                <div className="table-container">
                    <div className="table-header-actions">
                        <div className="search-bar">
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={handleSearchChange}
                                placeholder="Search"
                                className="search-input"
                            />
                        </div>
                        <div className="button-group" style={{ marginLeft: 'auto' }}>
                            {viewType === "active" && (
                                <>
                                    <button className="add-button" onClick={handleAdd}>Add</button>
                                    <button
                                        className="delete-button"
                                        onClick={() => handleArchive()}
                                        disabled={checkedCount < 1}
                                    >
                                        Delete
                                    </button>
                                </>
                            )}
                            {viewType === "archived" && (
                                <button
                                    className="restore-button"
                                    onClick={() => handleRestore()}
                                    disabled={checkedCount < 1}
                                >
                                    Restore
                                </button>
                            )}
                        </div>
                        <div className="view-toggle">
                            <button
                                className={`view-button ${viewType === "active" ? "active" : ""}`}
                                onClick={() => setViewType("active")}
                            >
                                Active Wrist Measurements
                            </button>
                            <button
                                className={`view-button ${viewType === "archived" ? "active" : ""}`}
                                onClick={() => setViewType("archived")}
                            >
                                Archived Wrist Measurements
                            </button>
                        </div>
                    </div>
                    <table ref={tableRef} className="measurements-table">
                        <thead>
                            <tr className="table-header-row">
                                <th className="table-header">
                                    <input type="checkbox" className="measurement-checkbox" checked={isSelectAll} onChange={handleSelectAll} />
                                </th>
                                <th className="table-header measurements-action-column">Action</th>
                                <th className="table-header">Wrist Measurement</th>
                                <th className="table-header">Created At</th>
                                <th className="table-header">Updated At</th>
                            </tr>
                        </thead>
                        <tbody>
                            {currentItems.length > 0 ? (
                                currentItems.map(measurement => (
                                    <tr className="table-row" key={measurement.id}>
                                        <td className="table-cell">
                                            <input
                                                type="checkbox"
                                                className="measurement-checkbox"
                                                checked={!!checkedRows[measurement.id]}
                                                onChange={e => handleRowCheckbox(measurement, e)}
                                            />
                                        </td>
                                        <td className="table-cell measurements-action-column">
                                            <div className="action-buttons">
                                                {viewType === "active" ? (
                                                    <>
                                                        <FaEdit className="edit-icon" size={20} onClick={() => handleEdit(measurement)} />
                                                        <FaTrash className="delete-icon" size={20} onClick={() => handleArchive(measurement)} />
                                                    </>
                                                ) : (
                                                    <FaUndo className="restore-icon" size={20} onClick={() => handleRestore(measurement)} />
                                                )}
                                            </div>
                                        </td>
                                        <td className="table-cell">{measurement.measurement}</td>
                                        <td className="table-cell">{measurement.created_at}</td>
                                        <td className="table-cell">{measurement.updated_at}</td>
                                    </tr>
                                ))
                            ) : (
                                <tr className="table-row">
                                    <td colSpan="5" className="table-cell" style={{ textAlign: "center", padding: "20px", backgroundColor: "#f9f9f9" }}>
                                        {measurements.length === 0
                                            ? "No wrist measurements available."
                                            : viewType === "active"
                                            ? "No active wrist measurements match your search."
                                            : "No archived wrist measurements match your search."}
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                    <div className="table-pagination">
                        <button
                            onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                            disabled={currentPage === 1}
                            className="table-pagination-button"
                        >
                            Previous
                        </button>
                        {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                            <button
                                key={page}
                                onClick={() => setCurrentPage(page)}
                                className={currentPage === page ? "table-pagination-button active" : "table-pagination-button"}
                            >
                                {page}
                            </button>
                        ))}
                        <button
                            onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                            disabled={currentPage === totalPages}
                            className="table-pagination-button"
                        >
                            Next
                        </button>
                    </div>
                </div>
            )}
            {managementModalOpen && (
                <MeasurementManagement
                    type={managementType}
                    measurement={managementType === "edit" || managementType === "add" ? selectedMeasurement : null}
                    selectedMeasurements={managementType === "restore" || managementType === "archive" ? selectedMeasurement : []}
                    measurementValue={measurement}
                    onClose={handleCloseManagement}
                    onConfirm={handleConfirmDeleteOrRestore}
                    onSave={handleSaveEditOrAdd}
                />
            )}
        </div>
    );
};

export default WristMeasurement;