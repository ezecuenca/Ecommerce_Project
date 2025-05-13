import React, { useState, useEffect, useRef, useCallback } from "react";
import { FaEdit, FaTrash, FaUndo, FaSpinner } from "react-icons/fa";
import MeasurementManagement from "./MeasurementManagement";
import Axios from 'axios';
import moment from 'moment';

const API_BASE_URL = "http://localhost:8000/api";

const makeAuthenticatedRequest = async (method, url, data = null, config = {}) => {
    const token = localStorage.getItem("access_token");
    if (!token) {
        console.error("Auth token not found. Please log in.");
        throw new Error("Unauthenticated: No token found.");
    }
    const headers = {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/json',
        ...(!(data instanceof FormData) && data ? { 'Content-Type': 'application/json' } : {}),
        ...(config.headers || {}),
    };
    if (data instanceof FormData) {
        delete headers['Content-Type'];
    }
    const fullConfig = { ...config, headers };

    try {
        switch (method.toLowerCase()) {
            case 'get': return await Axios.get(url, fullConfig);
            case 'post': return await Axios.post(url, data, fullConfig);
            case 'put': return await Axios.put(url, data, fullConfig);
            case 'delete': return await Axios.delete(url, fullConfig);
            default: throw new Error(`Unsupported Axios method: ${method}`);
        }
    } catch (error) {
        console.error(`Axios Error: ${method.toUpperCase()} ${url}`, error.response?.data || error.message, error);
        throw error;
    }
};

const formatDate = (dateString) => { if (!dateString) return "N/A"; return moment(dateString).isValid() ? moment(dateString).format('MMMM D, YYYY') : "Invalid Date"; };
const formatTime = (dateString) => { if (!dateString) return "N/A"; return moment(dateString).isValid() ? moment(dateString).format('h:mm A') : "Invalid Time"; };

const WristMeasurement = () => {
    const [measurements, setMeasurements] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [fetchError, setFetchError] = useState("");
    const [actionError, setActionError] = useState("");
    const [checkedRows, setCheckedRows] = useState({});
    const [isSelectAll, setIsSelectAll] = useState(false);
    const [viewType, setViewType] = useState("active");
    const [managementModalOpen, setManagementModalOpen] = useState(false);
    const [managementType, setManagementType] = useState("");
    const [selectedMeasurementForAction, setSelectedMeasurementForAction] = useState(null);
    const [measurementValue, setMeasurementValue] = useState("");
    const [forceUpdate, setForceUpdate] = useState(0);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [searchQuery, setSearchQuery] = useState("");
    const tableRef = useRef(null);
    const itemsPerPage = 5;

    const fetchMeasurements = useCallback(async () => {
        setIsLoading(true);
        setFetchError("");
        setCheckedRows({});
        setIsSelectAll(false);
        console.log(`Fetching measurements: page=${currentPage}, status=${viewType}, search=${searchQuery}, per_page=${itemsPerPage}`);

        try {
            const response = await makeAuthenticatedRequest('get', `${API_BASE_URL}/wrist_measurements`, null, {
                params: {
                    page: currentPage,
                    per_page: itemsPerPage,
                    status: viewType,
                    search: searchQuery || undefined,
                }
            });

            console.log("Wrist Measurements API Response Structure:", response.data);

            if (response.data?.data && typeof response.data.last_page !== 'undefined') {
                 console.log(`Received ${response.data.data.length} measurements for page ${response.data.current_page} of ${response.data.last_page}`);
                setMeasurements(response.data.data);
                setTotalPages(response.data.last_page || 1);
                if (response.data.current_page > response.data.last_page && response.data.last_page > 0) {
                } else if (response.data.total === 0 && currentPage > 1) {
                     setCurrentPage(1);
                }
            } else {
                 console.warn("Received non-paginated or unexpected data structure:", response.data);
                 setMeasurements([]);
                 setTotalPages(1);
                 setCurrentPage(1);
                 setFetchError("Received invalid data format.");
            }
        } catch (error) {
            console.error("Error fetching measurements:", error);
            const message = error.message?.startsWith("Unauth") ? "Authentication failed. Please log in again." : (error.response?.data?.message || error.message || 'Failed to load wrist measurements.');
            setFetchError(message);
            setMeasurements([]);
            setTotalPages(1);
        } finally {
            setIsLoading(false);
        }
    }, [currentPage, itemsPerPage, viewType, searchQuery]);

    useEffect(() => {
        fetchMeasurements();
    }, [fetchMeasurements, forceUpdate]);

    const handleSelectAll = (e) => {
        const isChecked = e.target.checked;
        setIsSelectAll(isChecked);
        const newCheckedRows = {};
        measurements.forEach(m => { newCheckedRows[m.id] = isChecked; });
        setCheckedRows(newCheckedRows);
    };

    const handleRowCheckbox = (measurement, e) => {
        const isChecked = e.target.checked;
        setCheckedRows(prev => {
            const updated = { ...prev, [measurement.id]: isChecked };
            const allCurrentChecked = measurements.length > 0 && measurements.every(m => updated[m.id]);
            setIsSelectAll(allCurrentChecked);
            return updated;
        });
    };

    const getSelectedMeasurementIds = () => Object.keys(checkedRows).filter(id => checkedRows[id]).map(id => parseInt(id, 10));
    const getSelectedItems = (singleItem = null) => {
        if (singleItem) return [singleItem];
        const selectedIds = getSelectedMeasurementIds();
        return measurements.filter(m => selectedIds.includes(m.id));
    };

    const handleArchive = (itemToArchive = null) => {
        const selectedItems = getSelectedItems(itemToArchive);
        if (viewType !== "active") { alert("You can only archive from Active Measurements."); return; }
        if (selectedItems.length === 0) { alert("Please select at least one measurement to archive."); return; }
        setManagementType("archive");
        setSelectedMeasurementForAction(selectedItems);
        setActionError("");
        setManagementModalOpen(true);
    };

    const handleRestore = (itemToRestore = null) => {
        const selectedItems = getSelectedItems(itemToRestore);
        if (viewType !== "archived") { alert("You can only restore from Archived Measurements."); return; }
        if (selectedItems.length === 0) { alert("Please select at least one measurement to restore."); return; }
        setManagementType("restore");
        setSelectedMeasurementForAction(selectedItems);
        setActionError("");
        setManagementModalOpen(true);
    };

    const handleAdd = () => {
        setManagementType("add");
        setSelectedMeasurementForAction(null);
        setMeasurementValue("");
        setActionError("");
        setManagementModalOpen(true);
    };

    const handleEdit = (measurement) => {
        setManagementType("edit");
        setSelectedMeasurementForAction(measurement);
        setMeasurementValue(measurement.measurement || "");
        setActionError("");
        setManagementModalOpen(true);
    };

    const handleSearchChange = (e) => {
        setSearchQuery(e.target.value);
        setCurrentPage(1);
    };

    const handleViewChange = (newViewType) => {
        if (newViewType !== viewType) {
            setViewType(newViewType);
            setCurrentPage(1);
            setCheckedRows({});
            setIsSelectAll(false);
        }
    };

    const handleCloseManagement = () => {
        setManagementModalOpen(false);
        setManagementType("");
        setSelectedMeasurementForAction(null);
        setMeasurementValue("");
        setActionError("");
    };

    const handleSaveEditOrAdd = async (newOrUpdatedData) => {
        if (!newOrUpdatedData?.measurement?.trim()) {
            setActionError("Measurement value is required.");
            return;
        }
        setActionError("");
        setIsLoading(true);

        try {
            let response;
            if (managementType === "edit") {
                if (!selectedMeasurementForAction?.id) throw new Error("No measurement selected for editing.");
                response = await makeAuthenticatedRequest(
                    'put',
                    `${API_BASE_URL}/wrist_measurements/${selectedMeasurementForAction.id}`,
                    { measurement: newOrUpdatedData.measurement.trim() }
                );
                alert("Measurement updated successfully!");
            } else if (managementType === "add") {
                response = await makeAuthenticatedRequest(
                    'post',
                    `${API_BASE_URL}/wrist_measurements`,
                    { measurement: newOrUpdatedData.measurement.trim() }
                );
                alert("Measurement added successfully!");
            }
            handleCloseManagement();
            setForceUpdate(prev => prev + 1);
        } catch (error) {
            console.error(`Error ${managementType}ing measurement:`, error);
            const message = error.message?.startsWith("Unauth") ? "Authentication failed." : (error.response?.data?.message || error.message || `Failed to ${managementType} measurement.`);
            setActionError(message);
        } finally {
             setIsLoading(false);
        }
    };

    const handleConfirmArchiveOrRestore = async (items) => {
        if (!items?.length) {
            alert(`Please select at least one measurement to ${managementType}.`);
            return;
        }
        setActionError("");
        setIsLoading(true);

        const measurementIds = items.map(item => item.id);
        const action = managementType;
        const url = `${API_BASE_URL}/wrist_measurements/${action}`;
        const payload = { ids: measurementIds };

        console.log(`Attempting to ${action} measurements with IDs:`, measurementIds);
        console.log(`Sending payload:`, payload);

        try {
            await makeAuthenticatedRequest('put', url, payload);

            alert(`Measurements ${action}d successfully.`);
            handleCloseManagement();
            setForceUpdate(prev => prev + 1);
        } catch (error) {
            console.error(`Error during ${action}:`, error.response?.data || error.message, error);
            const message = error.message?.startsWith("Unauth") ? "Authentication failed." : (error.response?.data?.message || error.message || `Failed to ${action} measurements.`);
            setActionError(message);
        } finally {
            setIsLoading(false);
        }
    };

    const checkedCount = getSelectedMeasurementIds().length;

    return (
        <div className="WristMeasurement measurement-container">
            <h2 className="measurements-header">{viewType === "active" ? "Wrist Measurements" : "Archived Measurements"}</h2>
            {fetchError && !isLoading && <p className="error-message" style={{ color: 'red', margin: '10px 0' }}>{fetchError}</p>}

            <div className="table-container">
                <div className="table-header-actions">
                    <div className="search-bar">
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={handleSearchChange}
                            placeholder="Search Measurement..."
                            className="search-input"
                            disabled={isLoading}
                        />
                    </div>
                    <div className="button-group" style={{ marginLeft: 'auto' }}>
                        {viewType === "active" && (
                            <>
                                <button className="add-button" onClick={handleAdd} disabled={isLoading}>Add</button>
                                <button
                                    className="archive-button"
                                    onClick={() => handleArchive()}
                                    disabled={checkedCount === 0 || isLoading}
                                    title="Archive selected measurements"
                                >
                                    Delete 
                                </button>
                            </>
                        )}
                        {viewType === "archived" && (
                            <button
                                className="restore-button"
                                onClick={() => handleRestore()}
                                disabled={checkedCount === 0 || isLoading}
                                title="Restore selected measurements"
                            >
                                Restore 
                            </button>
                        )}
                    </div>
                    <div className="view-toggle">
                        <button
                            className={`view-button ${viewType === "active" ? "active" : ""}`}
                            onClick={() => handleViewChange("active")}
                            disabled={isLoading}
                        >
                            Active Measurements
                        </button>
                        <button
                            className={`view-button ${viewType === "archived" ? "active" : ""}`}
                            onClick={() => handleViewChange("archived")}
                            disabled={isLoading}
                        >
                            Archived Measurements
                        </button>
                    </div>
                </div>

                <table ref={tableRef} className={`measurements-table ${viewType}`}>
                    <thead>
                        <tr className="table-header-row">
                            <th className="table-header checkbox-column">
                                <input
                                    type="checkbox"
                                    className="measurement-checkbox header-checkbox"
                                    checked={isSelectAll}
                                    onChange={handleSelectAll}
                                    disabled={isLoading || measurements.length === 0}
                                />
                            </th>
                            <th className="table-header measurements-action-column">Action</th>
                            <th className="table-header">Measurement</th>
                            <th className="table-header">Created At</th>
                            <th className="table-header">Updated At</th>
                        </tr>
                    </thead>
                    <tbody>
                        {isLoading ? (
                            <tr><td colSpan="5" style={{ textAlign: 'center', padding: '20px', fontStyle: 'italic' }}><FaSpinner className="spinner" /> Loading...</td></tr>
                        ) : fetchError ? (
                            <tr><td colSpan="5" style={{ textAlign: 'center', padding: '20px', color: 'grey' }}>Could not load data.</td></tr>
                        ) : measurements.length === 0 ? (
                            <tr className="table-row">
                                <td colSpan="5" className="table-cell" style={{ textAlign: "center", padding: "20px" }}>
                                    {searchQuery ? "No measurements match your search." : (viewType === 'active' ? "No active measurements found." : "No archived measurements found.")}
                                </td>
                            </tr>
                        ) : (
                            measurements.map(m => (
                                <tr className={`table-row ${m.status === 0 ? 'archived-row' : 'active-row'}`} key={m.id}>
                                    <td className="table-cell checkbox-column">
                                        <input
                                            type="checkbox"
                                            className="measurement-checkbox row-checkbox"
                                            checked={!!checkedRows[m.id]}
                                            onChange={e => handleRowCheckbox(m, e)}
                                            disabled={isLoading}
                                        />
                                    </td>
                                    <td className="table-cell measurements-action-column">
                                        <div className="action-buttons">
                                            {viewType === "active" ? (
                                                <>
                                                    <FaEdit className="edit-icon action-icon" title="Edit Measurement" size={18} onClick={() => handleEdit(m)} />
                                                    <FaTrash className="delete-icon action-icon" title="Archive Measurement" size={18} onClick={() => handleArchive(m)} />
                                                </>
                                            ) : (
                                                <FaUndo className="restore-icon action-icon" title="Restore Measurement" size={18} onClick={() => handleRestore(m)} />
                                            )}
                                        </div>
                                    </td>
                                    <td className="table-cell">{m.measurement}</td>
                                    <td className="table-cell">{formatDate(m.created_at)}<br/><span style={{fontSize:'0.8em', color:'#666'}}>at {formatTime(m.created_at)}</span></td>
                                    <td className="table-cell">{formatDate(m.updated_at)}<br/><span style={{fontSize:'0.8em', color:'#666'}}>at {formatTime(m.updated_at)}</span></td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>

                {!isLoading && !fetchError && totalPages > 1 && (
                    <div className="table-pagination">
                        <button
                            onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                            disabled={currentPage === 1 || isLoading}
                            className="table-pagination-button"
                        >
                            Previous
                        </button>
                        {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                            <button
                                key={page}
                                onClick={() => setCurrentPage(page)}
                                className={currentPage === page ? "table-pagination-button active" : "table-pagination-button"}
                                disabled={isLoading}
                            >
                                {page}
                            </button>
                        ))}
                        <button
                            onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                            disabled={currentPage === totalPages || isLoading}
                            className="table-pagination-button"
                        >
                            Next
                        </button>
                    </div>
                )}
            </div>

            {managementModalOpen && (
                <MeasurementManagement 
                    type={managementType}
                    measurement={managementType === "edit" ? selectedMeasurementForAction : null}
                    selectedMeasurements={managementType === "archive" || managementType === "restore" ? selectedMeasurementForAction : []}
                    measurementValue={measurementValue} 
                    onClose={handleCloseManagement}
                    onConfirm={handleConfirmArchiveOrRestore}
                    onSave={handleSaveEditOrAdd}
                    externalError={actionError}
                />
            )}
        </div>
    );
};

export default WristMeasurement;