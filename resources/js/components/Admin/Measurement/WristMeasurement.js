import React, { useState, useEffect, useRef } from "react";
import { FaEdit, FaTrash, FaUndo } from "react-icons/fa";
import MeasurementManagement from "./MeasurementManagement";
import Axios from "axios";

const WristMeasurement = () => {
    const [checkedRows, setCheckedRows] = useState({});
    const [isSelectAll, setIsSelectAll] = useState(false);
    const [viewType, setViewType] = useState("active");
    const [managementModalOpen, setManagementModalOpen] = useState(false);
    const [managementType, setManagementType] = useState("");
    const [selectedMeasurement, setSelectedMeasurement] = useState(null);
    const [error, setError] = useState("");
    const [forceUpdate, setForceUpdate] = useState(0);
    const [currentPage, setCurrentPage] = useState(1);
    const [searchQuery, setSearchQuery] = useState("");
    const [isLoading, setIsLoading] = useState(true);
    const itemsPerPage = 5;

    const [measurements, setMeasurements] = useState([]);
    const tableRef = useRef(null);

    useEffect(() => {
        const fetchMeasurements = async () => {
            try {
                console.log("Fetching wrist measurements...");
                const response = await Axios.get("http://localhost:8000/api/wrist-measurements");
                console.log("API Response:", response.data);
                const fetchedMeasurements = response.data.map(measurement => {
                    const mappedMeasurement = {
                        id: measurement.id,
                        measurement: measurement.measurement,
                        createdAt: new Date(measurement.created_at).toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: '2-digit' }),
                        updatedAt: new Date(measurement.updated_at).toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: '2-digit' }),
                        isArchived: parseInt(measurement.status, 10) === 0,
                    };
                    console.log(`Measurement ${measurement.measurement}: status=${measurement.status}, isArchived=${mappedMeasurement.isArchived}`);
                    return mappedMeasurement;
                });
                setMeasurements(fetchedMeasurements);
                console.log("Updated measurements state:", fetchedMeasurements);
                setCheckedRows({});
                setIsSelectAll(false);
            } catch (error) {
                console.error("Error fetching wrist measurements:", error);
                if (error.response) {
                    console.log("Response data:", error.response.data);
                    console.log("Response status:", error.response.status);
                    const errorMessage = error.response.data.errors
                        ? Object.values(error.response.data.errors).flat().join(" ")
                        : "Failed to load wrist measurements.";
                    setError(errorMessage);
                } else if (error.request) {
                    console.log("No response received:", error.request);
                    setError("No response from server while fetching wrist measurements. Please try again.");
                } else {
                    console.log("Error message:", error.message);
                    setError(`Error fetching wrist measurements: ${error.message}`);
                }
            } finally {
                setIsLoading(false);
            }
        };

        fetchMeasurements();
    }, [forceUpdate]);

    const getCurrentData = () => {
        if (!measurements || measurements.length === 0) {
            console.warn("No measurements data available, returning empty array.");
            return [];
        }
        console.log(`Filtering measurements for viewType=${viewType}`);
        let filteredMeasurements = measurements.filter(measurement => {
            const shouldInclude = measurement.isArchived === (viewType === "archived");
            console.log(`Measurement ${measurement.measurement}: isArchived=${measurement.isArchived}, shouldInclude=${shouldInclude}`);
            return shouldInclude;
        });
        if (searchQuery.trim()) {
            filteredMeasurements = filteredMeasurements.filter(measurement =>
                measurement.measurement.toLowerCase().includes(searchQuery.toLowerCase())
            );
        }
        console.log(`Filtered measurements:`, filteredMeasurements.map(measurement => measurement.measurement));
        return filteredMeasurements;
    };

    const currentData = getCurrentData();
    const totalPages = Math.ceil(currentData.length / itemsPerPage);
    const currentItems = currentData.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    );

    const handleSelectAll = (e) => {
        try {
            const isChecked = e.target.checked;
            setIsSelectAll(isChecked);
            const newCheckedRows = {};
            if (isChecked) {
                currentItems.forEach((_, index) => {
                    newCheckedRows[index] = true;
                });
                if (tableRef.current) {
                    tableRef.current.querySelectorAll('.measurement-checkbox').forEach(checkbox => (checkbox.checked = true));
                }
            } else {
                if (tableRef.current) {
                    tableRef.current.querySelectorAll('.measurement-checkbox').forEach(checkbox => (checkbox.checked = false));
                }
            }
            setCheckedRows(newCheckedRows);
        } catch (error) {
            console.error("Error in handleSelectAll:", error);
        }
    };

    const handleRowCheckbox = (index, e) => {
        try {
            const isChecked = e.target.checked;
            setCheckedRows((prev) => ({
                ...prev,
                [index]: isChecked,
            }));
            const allChecked = currentItems.length ===
                (tableRef.current ? Array.from(tableRef.current.querySelectorAll('.measurement-checkbox')).filter(cb => cb.checked).length : 0);
            setIsSelectAll(allChecked);
        } catch (error) {
            console.error("Error in handleRowCheckbox:", error);
        }
    };

    const handleDelete = (measurementToDelete = null) => {
        try {
            const selectedIndices = Object.keys(checkedRows)
                .filter(index => checkedRows[index])
                .map(index => parseInt(index, 10));

            if (measurementToDelete) {
                if (viewType !== "active") {
                    alert("You can only archive from Active Wrist Measurements.");
                    return;
                }
                setManagementType("delete");
                setSelectedMeasurement([measurementToDelete]);
                setManagementModalOpen(true);
                return;
            }

            const selectedCount = selectedIndices.length;
            if (selectedCount < 1) {
                alert("Please select at least one measurement to archive.");
                return;
            }

            if (viewType !== "active") {
                alert("You can only archive from Active Wrist Measurements.");
                return;
            }

            setManagementType("delete");
            setSelectedMeasurement(getSelectedMeasurements());
            setManagementModalOpen(true);
        } catch (error) {
            console.error("Error in handleDelete:", error);
        }
    };

    const handleRestore = (measurementToRestore = null) => {
        try {
            const selectedIndices = Object.keys(checkedRows)
                .filter(index => checkedRows[index])
                .map(index => parseInt(index, 10));

            if (measurementToRestore) {
                if (viewType !== "archived") {
                    alert("You can only restore from Archived Wrist Measurements.");
                    return;
                }
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

            setManagementType("restore");
            setSelectedMeasurement(getSelectedMeasurements());
            setManagementModalOpen(true);
        } catch (error) {
            console.error("Error in handleRestore:", error);
        }
    };

    const handleAdd = () => {
        try {
            setManagementType("add");
            setSelectedMeasurement(null);
            setManagementModalOpen(true);
        } catch (error) {
            console.error("Error in handleAdd:", error);
        }
    };

    const handleEdit = (measurement) => {
        try {
            setSelectedMeasurement(measurement);
            setManagementType("edit");
            setManagementModalOpen(true);
        } catch (error) {
            console.error("Error in handleEdit:", error);
        }
    };

    const handleSearchChange = (e) => {
        try {
            setSearchQuery(e.target.value);
            setCurrentPage(1);
        } catch (error) {
            console.error("Error in handleSearchChange:", error);
        }
    };

    const handleConfirmDeleteOrRestore = async (items) => {
        if (!items?.length) {
            alert(`Please select at least one measurement to ${managementType === "delete" ? "archive" : "restore"}.`);
            return;
        }
        try {
            const measurementIds = items.map(item => item.id);
            console.log(`Measurement IDs to ${managementType}:`, measurementIds);

            if (!measurementIds.every(id => Number.isInteger(id) && id > 0)) {
                throw new Error("Invalid measurement IDs detected. All IDs must be positive integers.");
            }

            if (managementType === "delete") {
                console.log("Sending archive request with data:", { data: { ids: measurementIds } });
                await Axios.put('http://localhost:8000/api/wrist-measurements/archive', { data: { ids: measurementIds } });
            } else if (managementType === "restore") {
                console.log("Sending restore request with data:", { data: { ids: measurementIds } });
                await Axios.put('http://localhost:8000/api/wrist-measurements/restore', { data: { ids: measurementIds } });
            }
            console.log(`Successfully ${managementType === "delete" ? "archived" : "restored"} measurements. Triggering re-fetch...`);
            setMeasurements([]); // Clear measurements before re-fetch
            setIsLoading(true); // Show loading state
            setForceUpdate(prev => prev + 1); // Trigger re-fetch
            setCheckedRows({});
            setIsSelectAll(false);
            if (tableRef.current) {
                tableRef.current.querySelectorAll('.measurement-checkbox').forEach(checkbox => (checkbox.checked = false));
            }
            setManagementModalOpen(false);
            if (currentData.length <= itemsPerPage) setCurrentPage(1);
        } catch (error) {
            console.error(`Error ${managementType === "delete" ? "archiving" : "restoring"} measurements:`, error);
            if (error.response) {
                console.log("Response data:", error.response.data);
                console.log("Response status:", error.response.status);
                const errorMessage = error.response.data.errors
                    ? Object.values(error.response.data.errors).flat().join(" ")
                    : `Failed to ${managementType === "delete" ? "archive" : "restore"} measurements.`;
                setError(errorMessage);
            } else if (error.request) {
                console.log("No response received:", error.request);
                setError(`No response from server while ${managementType === "delete" ? "archiving" : "restoring"} measurements. Please try again.`);
            } else {
                console.log("Error message:", error.message);
                setError(`Error ${managementType === "delete" ? "archiving" : "restoring"} measurements: ${error.message}`);
            }
            setIsLoading(false);
        }
    };

    const handleCloseManagement = () => {
        try {
            setManagementModalOpen(false);
            setManagementType("");
            setSelectedMeasurement(null);
            setError("");
        } catch (error) {
            console.error("Error in handleCloseManagement:", error);
        }
    };

    const getSelectedMeasurements = () => {
        try {
            const selectedIndices = Object.keys(checkedRows)
                .filter(index => checkedRows[index])
                .map(index => parseInt(index, 10));
            return selectedIndices.map(index => currentItems[index]);
        } catch (error) {
            console.error("Error in getSelectedMeasurements:", error);
            return [];
        }
    };

    const checkedCount = Object.keys(checkedRows).filter(index => checkedRows[index]).length;

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
                                        onClick={() => handleDelete()}
                                        disabled={checkedCount < 2}
                                    >
                                        Archive
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
            )}
            {managementModalOpen && (
                <MeasurementManagement
                    type={managementType}
                    measurement={managementType === "edit" || managementType === "add" ? selectedMeasurement : (managementType === "restore" || managementType === "delete" && !Array.isArray(selectedMeasurement) ? selectedMeasurement : null)}
                    selectedMeasurements={managementType === "restore" || managementType === "delete" ? (selectedMeasurement || getSelectedMeasurements()) : []}
                    onClose={handleCloseManagement}
                    onConfirm={handleConfirmDeleteOrRestore}
                    onSave={() => {
                        setMeasurements([]); // Clear measurements before re-fetch
                        setIsLoading(true); // Show loading state
                        setForceUpdate(prev => prev + 1); // Trigger re-fetch
                    }}
                />
            )}
        </div>
    );
};

export default WristMeasurement;