import React, { useState, useEffect, useRef } from "react";
import { FaEdit, FaTrash, FaUndo } from "react-icons/fa"; // Added FaUndo for Restore
import MeasurementManagement from "./MeasurementManagement"; // Assume a similar MeasurementManagement component

const WristMeasurement = () => {
    const [checkedRows, setCheckedRows] = useState({});
    const [isSelectAll, setIsSelectAll] = useState(false);
    const [viewType, setViewType] = useState("active"); // Measurements can now have active/archived views
    const [managementModalOpen, setManagementModalOpen] = useState(false);
    const [managementType, setManagementType] = useState("");
    const [selectedMeasurement, setSelectedMeasurement] = useState(null);
    const [measurement, setMeasurement] = useState("");
    const [error, setError] = useState("");
    const [forceUpdate, setForceUpdate] = useState(0);
    const [currentPage, setCurrentPage] = useState(1);
    const [searchQuery, setSearchQuery] = useState("");
    const itemsPerPage = 5; // Match CategoryList pagination

    const [initialMeasurements, setInitialMeasurements] = useState([
        { id: 1, measurement: "6.5 inches", createdAt: "11/21/24", updatedAt: "11/21/24", isArchived: false },
        { id: 2, measurement: "7.5 inches", createdAt: "11/21/24", updatedAt: "11/21/24", isArchived: false },
        { id: 3, measurement: "8.5 inches", createdAt: "11/21/24", updatedAt: "11/21/24", isArchived: false },
        // Added an archived measurement for testing
        { id: 4, measurement: "9.5 inches", createdAt: "11/21/24", updatedAt: "11/21/24", isArchived: true },
    ]);

    const [measurements, setMeasurements] = useState(initialMeasurements);
    const tableRef = useRef(null);

    useEffect(() => {
        const savedMeasurements = localStorage.getItem("wristMeasurements");
        let updatedMeasurements = [...initialMeasurements];
        if (savedMeasurements) {
            try {
                updatedMeasurements = JSON.parse(savedMeasurements).map(measurement => ({
                    ...measurement,
                    isArchived: measurement.isArchived !== undefined ? measurement.isArchived : false,
                    createdAt: measurement.createdAt || new Date().toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: '2-digit' }),
                    updatedAt: measurement.updatedAt || new Date().toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: '2-digit' }),
                }));
                console.log("Loaded measurements from localStorage:", updatedMeasurements);
            } catch (error) {
                console.error("Error parsing measurements from localStorage:", error);
                updatedMeasurements = [...initialMeasurements];
                localStorage.setItem("wristMeasurements", JSON.stringify(updatedMeasurements));
            }
        } else {
            console.log("Initialized with static measurements:", initialMeasurements);
            localStorage.setItem("wristMeasurements", JSON.stringify(initialMeasurements));
        }
        setMeasurements(updatedMeasurements);
        setInitialMeasurements(updatedMeasurements);
        setCheckedRows({});
        setIsSelectAll(false);
    }, []);

    const getCurrentData = () => {
        if (!measurements || measurements.length === 0) {
            console.warn("No measurements data available, returning empty array.");
            return [];
        }
        let filteredMeasurements = measurements.filter(measurement => measurement.isArchived === (viewType === "archived"));
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
        if (isChecked) {
            currentItems.forEach((_, index) => {
                newCheckedRows[index] = true;
            });
            if (tableRef.current) {
                tableRef.current.querySelectorAll('.measurement-checkbox').forEach(checkbox => checkbox.checked = true);
            }
        } else {
            if (tableRef.current) {
                tableRef.current.querySelectorAll('.measurement-checkbox').forEach(checkbox => checkbox.checked = false);
            }
        }
        setCheckedRows(newCheckedRows);
    };

    const handleRowCheckbox = (index, e) => {
        const isChecked = e.target.checked;
        setCheckedRows((prev) => ({
            ...prev,
            [index]: isChecked,
        }));
        const allChecked = currentItems.length ===
            (tableRef.current ? Array.from(tableRef.current.querySelectorAll('.measurement-checkbox')).filter(cb => cb.checked).length : 0);
        setIsSelectAll(allChecked);
    };

    const handleDelete = (measurementToDelete = null) => {
        console.log("Attempting to delete - viewType:", viewType, "measurementToDelete:", measurementToDelete, "checkedRows:", checkedRows);
        const selectedIndices = Object.keys(checkedRows)
            .filter(index => checkedRows[index])
            .map(index => parseInt(index, 10));

        if (measurementToDelete) {
            if (viewType !== "active") {
                alert("You can only delete from Active Wrist Measurements.");
                return;
            }
            setManagementType("delete");
            setSelectedMeasurement([measurementToDelete]);
            setManagementModalOpen(true);
            return;
        }

        const selectedCount = selectedIndices.length;
        if (selectedCount < 1) {
            alert("Please select at least one measurement to delete.");
            return;
        }

        if (viewType !== "active") {
            alert("You can only delete from Active Wrist Measurements.");
            return;
        }

        setManagementType("delete");
        setSelectedMeasurement(getSelectedMeasurements());
        setManagementModalOpen(true);
    };

    const handleRestore = (measurementToRestore = null) => {
        console.log("Attempting to restore - viewType:", viewType, "measurementToRestore:", measurementToRestore, "checkedRows:", checkedRows);
        const selectedIndices = Object.keys(checkedRows)
            .filter(index => checkedRows[index])
            .map(index => parseInt(index, 10));

        if (measurementToRestore) {
            if (viewType !== "archived") {
                alert("You can only restore from Archived Wrist Measurements.");
                return;
            }
            console.log("Opening restore modal for single measurement:", measurementToRestore);
            setManagementType("restore");
            setSelectedMeasurement([measurementToRestore]);
            setManagementModalOpen(true);
            return;
        }

        const selectedCount = selectedIndices.length;
        if (selectedCount < 1) {
            alert("Please select at least one measurement to restore.");
            return;
        }

        if (viewType !== "archived") {
            alert("You can only restore from Archived Wrist Measurements.");
            return;
        }

        console.log("Opening restore modal for multiple measurements:", getSelectedMeasurements());
        setManagementType("restore");
        setSelectedMeasurement(getSelectedMeasurements());
        setManagementModalOpen(true);
    };

    const handleAdd = () => {
        console.log("Current viewType:", viewType, "Opening Add modal");
        setManagementType("add");
        setMeasurement("");
        setSelectedMeasurement(null);
        setManagementModalOpen(true);
    };

    const handleEdit = (measurement) => {
        console.log("Opening edit for measurement:", measurement);
        setSelectedMeasurement(measurement);
        setMeasurement(measurement.measurement || "");
        setManagementType("edit");
        setManagementModalOpen(true);
    };

    const validateMeasurement = (measurement) => {
        return measurement.trim().length > 0; // Simple validation for measurement
    };

    const handleMeasurementChange = (e) => setMeasurement(e.target.value);

    const handleSearchChange = (e) => {
        setSearchQuery(e.target.value);
        setCurrentPage(1);
    };

    const handleSaveEditOrAdd = (newOrUpdatedMeasurement) => {
        if (managementType === "edit") {
            if (!selectedMeasurement) {
                alert("No measurement selected for editing.");
                return;
            }

            if (!validateMeasurement(newOrUpdatedMeasurement.measurement)) {
                setError("Measurement is required.");
                return;
            }

            setError("");
            const updatedMeasurements = measurements.map(m =>
                m.id === selectedMeasurement.id ? { ...newOrUpdatedMeasurement, id: selectedMeasurement.id, createdAt: selectedMeasurement.createdAt, isArchived: selectedMeasurement.isArchived } : m
            );
            setMeasurements(updatedMeasurements);
            setInitialMeasurements(updatedMeasurements);
            localStorage.setItem("wristMeasurements", JSON.stringify(updatedMeasurements));
            setManagementModalOpen(false);
            setSelectedMeasurement(null);
            setMeasurement("");
            console.log("Edited measurement, updated measurements:", updatedMeasurements);
            setForceUpdate(prev => prev + 1);
        } else if (managementType === "add") {
            if (!validateMeasurement(newOrUpdatedMeasurement.measurement)) {
                setError("Measurement is required.");
                return;
            }

            setError("");
            const newMeasurement = {
                id: Date.now(),
                measurement: newOrUpdatedMeasurement.measurement.trim(),
                createdAt: new Date().toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: '2-digit' }),
                updatedAt: new Date().toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: '2-digit' }),
                isArchived: false, // New measurements are active by default
            };
            const updatedMeasurements = [newMeasurement, ...measurements];
            setMeasurements(updatedMeasurements);
            setInitialMeasurements(updatedMeasurements);
            localStorage.setItem("wristMeasurements", JSON.stringify(updatedMeasurements));
            setManagementModalOpen(false);
            setMeasurement("");
            console.log("Added new measurement, updated measurements:", updatedMeasurements);
            setForceUpdate(prev => prev + 1);
            setCurrentPage(1);
        }
    };

    const handleConfirmDeleteOrRestore = (items) => {
        console.log("Confirming action - managementType:", managementType, "items:", items);
        if (managementType === "delete") {
            const updatedMeasurements = measurements.map(measurement => {
                if (Array.isArray(items)) {
                    if (items.some(item => item.id === measurement.id)) {
                        return { ...measurement, isArchived: true, updatedAt: new Date().toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: '2-digit' }) };
                    }
                } else {
                    if (items.id === measurement.id) {
                        return { ...measurement, isArchived: true, updatedAt: new Date().toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: '2-digit' }) };
                    }
                }
                return measurement;
            });
            setMeasurements(updatedMeasurements);
            setInitialMeasurements(updatedMeasurements);
            setCheckedRows({});
            setIsSelectAll(false);
            if (tableRef.current && viewType === "active") {
                tableRef.current.querySelectorAll('.measurement-checkbox').forEach(checkbox => checkbox.checked = false);
            }
            setManagementModalOpen(false);
            if (currentData.length === 0) {
                setCurrentPage(1);
            }
            setForceUpdate(prev => prev + 1);
            localStorage.setItem("wristMeasurements", JSON.stringify(updatedMeasurements));
            console.log("Measurements after delete:", updatedMeasurements);
        } else if (managementType === "restore") {
            const updatedMeasurements = measurements.map(measurement => {
                if (Array.isArray(items)) {
                    if (items.some(item => item.id === measurement.id)) {
                        return { ...measurement, isArchived: false, updatedAt: new Date().toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: '2-digit' }) };
                    }
                } else {
                    if (items.id === measurement.id) {
                        return { ...measurement, isArchived: false, updatedAt: new Date().toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: '2-digit' }) };
                    }
                }
                return measurement;
            });
            setMeasurements(updatedMeasurements);
            setInitialMeasurements(updatedMeasurements);
            setCheckedRows({});
            setIsSelectAll(false);
            if (tableRef.current && viewType === "archived") {
                tableRef.current.querySelectorAll('.measurement-checkbox').forEach(checkbox => checkbox.checked = false);
            }
            setManagementModalOpen(false);
            if (currentData.length === 0) {
                setCurrentPage(1);
            }
            setForceUpdate(prev => prev + 1);
            localStorage.setItem("wristMeasurements", JSON.stringify(updatedMeasurements));
            console.log("Measurements after restore:", updatedMeasurements);
        }
    };

    const handleCloseManagement = () => {
        setManagementModalOpen(false);
        setManagementType("");
        setSelectedMeasurement(null);
        setMeasurement("");
        setError("");
    };

    const getSelectedMeasurements = () => {
        const selectedIndices = Object.keys(checkedRows)
            .filter(index => checkedRows[index])
            .map(index => parseInt(index, 10));
        return selectedIndices.map(index => currentItems[index]);
    };

    const checkedCount = Object.keys(checkedRows).filter(index => checkedRows[index]).length;

    return (
        <div className="WristMeasurement">
            <h2 className="measurements-header">{viewType === "active" ? "Wrist Measurements" : "Archived Wrist Measurements"}</h2>
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
                                    onClick={() => handleDelete()}
                                    disabled={checkedCount < 2}
                                >
                                    Delete
                                </button>
                            </>
                        )}
                        {viewType === "archived" && (
                            <button
                                className="restore-button"
                                onClick={() => handleRestore()}
                                disabled={checkedCount < 2}
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
                            currentItems.map((measurement, index) => (
                                <tr className="table-row" key={measurement.id + index + forceUpdate}>
                                    <td className="table-cell">
                                        <input type="checkbox" className="measurement-checkbox" onChange={(e) => handleRowCheckbox(index, e)} />
                                    </td>
                                    <td className="table-cell measurements-action-column">
                                        <div className="action-buttons">
                                            {viewType === "active" ? (
                                                <>
                                                    <FaEdit className="edit-icon" size={20} onClick={() => handleEdit(measurement)} />
                                                    <FaTrash className="delete-icon" size={20} onClick={() => handleDelete(measurement)} />
                                                </>
                                            ) : (
                                                <FaUndo className="restore-icon" size={20} onClick={() => handleRestore(measurement)} />
                                            )}
                                        </div>
                                    </td>
                                    <td className="table-cell">{measurement.measurement}</td>
                                    <td className="table-cell">{measurement.createdAt}</td>
                                    <td className="table-cell">{measurement.updatedAt}</td>
                                </tr>
                            ))
                        ) : (
                            <tr className="table-row">
                                <td colSpan="5" className="table-cell" style={{ textAlign: "center", padding: "20px", backgroundColor: "#f9f9f9" }}>
                                    {measurements.length === 0
                                        ? "No wrist measurements available. Please check your data or refresh the page."
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
                        onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                        disabled={currentPage === 1}
                        className="table-pagination-button"
                    >
                        Previous
                    </button>
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                        <button
                            key={page}
                            onClick={() => setCurrentPage(page)}
                            className={currentPage === page ? "table-pagination-button active" : "table-pagination-button"}
                        >
                            {page}
                        </button>
                    ))}
                    <button
                        onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                        disabled={currentPage === totalPages}
                        className="table-pagination-button"
                    >
                        Next
                    </button>
                </div>
            </div>
            {managementModalOpen && (
                <MeasurementManagement
                    type={managementType}
                    measurement={managementType === "edit" || managementType === "add" ? selectedMeasurement : (managementType === "restore" || managementType === "delete" && !Array.isArray(selectedMeasurement) ? selectedMeasurement : null)}
                    selectedMeasurements={managementType === "restore" || managementType === "delete" ? (selectedMeasurement || getSelectedMeasurements()) : []}
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