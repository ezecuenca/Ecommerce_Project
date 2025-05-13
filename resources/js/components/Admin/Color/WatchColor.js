import React, { useState, useEffect, useRef, useCallback } from "react";
import { FaEdit, FaTrash, FaUndo, FaSpinner } from "react-icons/fa";
import WatchColorManagement from "./WatchColorManagement";
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

const formatDateTime = (dateString) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    if (isNaN(date.getTime())) {
        return "Invalid Date";
    }
    return date.toLocaleString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: 'numeric',
        minute: 'numeric',
        hour12: true,
    });
};

const WatchColorList = () => {
    const [colors, setColors] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [fetchError, setFetchError] = useState("");
    const [actionError, setActionError] = useState("");
    const [checkedRows, setCheckedRows] = useState({});
    const [isSelectAll, setIsSelectAll] = useState(false);
    const [viewType, setViewType] = useState("active");
    const [managementModalOpen, setManagementModalOpen] = useState(false);
    const [managementType, setManagementType] = useState("");
    const [selectedColorForAction, setSelectedColorForAction] = useState(null);
    const [name, setName] = useState("");
    const [forceUpdate, setForceUpdate] = useState(0);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [searchQuery, setSearchQuery] = useState("");
    const tableRef = useRef(null);
    const itemsPerPage = 5;

    const fetchColors = useCallback(async () => {
        setIsLoading(true);
        setFetchError("");
        setCheckedRows({});
        setIsSelectAll(false);
        console.log(`Fetching colors: page=${currentPage}, status=${viewType}, search=${searchQuery}, per_page=${itemsPerPage}`);

        try {
            const response = await makeAuthenticatedRequest('get', `${API_BASE_URL}/watch_colors`, null, {
                params: {
                    page: currentPage,
                    per_page: itemsPerPage,
                    status: viewType,
                    search: searchQuery || undefined,
                }
            });

            console.log("Watch Colors API Response Structure:", response.data);

            if (response.data?.data && typeof response.data.last_page !== 'undefined') {
                 console.log(`Received ${response.data.data.length} colors for page ${response.data.current_page} of ${response.data.last_page}`);
                setColors(response.data.data);
                setTotalPages(response.data.last_page || 1);
                if (response.data.current_page > response.data.last_page && response.data.last_page > 0) {
                } else if (response.data.total === 0 && currentPage > 1) {
                     setCurrentPage(1);
                }
            } else {
                 console.warn("Received non-paginated or unexpected data structure:", response.data);
                 setColors([]);
                 setTotalPages(1);
                 setCurrentPage(1);
                 setFetchError("Received invalid data format.");
            }
        } catch (error) {
            console.error("Error fetching colors:", error);
            const message = error.message?.startsWith("Unauth") ? "Authentication failed. Please log in again." : (error.response?.data?.message || error.message || 'Failed to load colors.');
            setFetchError(message);
            setColors([]);
            setTotalPages(1);
        } finally {
            setIsLoading(false);
        }
    }, [currentPage, itemsPerPage, viewType, searchQuery]);

    useEffect(() => {
        fetchColors();
    }, [fetchColors, forceUpdate]);

    const handleSelectAll = (e) => {
        const isChecked = e.target.checked;
        setIsSelectAll(isChecked);
        const newCheckedRows = {};
        colors.forEach(color => {
            newCheckedRows[color.id] = isChecked;
        });
        setCheckedRows(newCheckedRows);
    };

    const handleRowCheckbox = (color, e) => {
        const isChecked = e.target.checked;
        setCheckedRows(prev => {
            const updated = { ...prev, [color.id]: isChecked };
            const allCurrentChecked = colors.length > 0 && colors.every(c => updated[c.id]);
            setIsSelectAll(allCurrentChecked);
            return updated;
        });
    };

    const getSelectedColorIds = () => Object.keys(checkedRows).filter(id => checkedRows[id]).map(id => parseInt(id, 10));
    const getSelectedItems = (singleItem = null) => {
        if (singleItem) return [singleItem];
        const selectedIds = getSelectedColorIds();
        return colors.filter(color => selectedIds.includes(color.id));
    };

    const handleArchive = (colorToArchive = null) => {
        const selectedItems = getSelectedItems(colorToArchive);
        console.log('Items selected for archive:', selectedItems);
        if (viewType !== "active") { alert("You can only archive from Active Colors."); return; }
        if (selectedItems.length === 0) { alert("Please select at least one color to archive."); return; }
        setManagementType("archive");
        setSelectedColorForAction(selectedItems);
        setActionError("");
        setManagementModalOpen(true);
    };

    const handleRestore = (colorToRestore = null) => {
        const selectedItems = getSelectedItems(colorToRestore);
        if (viewType !== "archived") { alert("You can only restore from Archived Colors."); return; }
        if (selectedItems.length === 0) { alert("Please select at least one color to restore."); return; }
        setManagementType("restore");
        setSelectedColorForAction(selectedItems);
        setActionError("");
        setManagementModalOpen(true);
    };

    const handleAdd = () => {
        setManagementType("add");
        setSelectedColorForAction(null);
        setName("");
        setActionError("");
        setManagementModalOpen(true);
    };

    const handleEdit = (color) => {
        setManagementType("edit");
        setSelectedColorForAction(color);
        setName(color.color_name || "");
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
        setSelectedColorForAction(null);
        setName("");
        setActionError("");
    };

    const handleSaveEditOrAdd = async (newOrUpdatedColorData) => {
        if (!newOrUpdatedColorData?.color_name?.trim()) {
            setActionError("Color name is required.");
            return;
        }
        setActionError("");
        setIsLoading(true);

        try {
            let response;
            if (managementType === "edit") {
                if (!selectedColorForAction?.id) throw new Error("No color selected for editing.");
                response = await makeAuthenticatedRequest(
                    'put',
                    `${API_BASE_URL}/watch_colors/${selectedColorForAction.id}`,
                    { color_name: newOrUpdatedColorData.color_name.trim() }
                );
                alert("Color updated successfully!");
            } else if (managementType === "add") {
                response = await makeAuthenticatedRequest(
                    'post',
                    `${API_BASE_URL}/watch_colors`,
                    { color_name: newOrUpdatedColorData.color_name.trim() }
                );
                alert("Color added successfully!");
            }
            handleCloseManagement();
            setForceUpdate(prev => prev + 1);
        } catch (error) {
            console.error(`Error ${managementType}ing color:`, error);
            const message = error.message?.startsWith("Unauth") ? "Authentication failed." : (error.response?.data?.message || error.message || `Failed to ${managementType} color.`);
            setActionError(message);
        } finally {
             setIsLoading(false);
        }
    };

    const handleConfirmArchiveOrRestore = async (items) => {
        if (!items?.length) {
            alert(`Please select at least one color to ${managementType}.`);
            return;
        }
        setActionError("");
        setIsLoading(true);

        const colorIds = items.map(item => item.id);
        const action = managementType;
        const url = `${API_BASE_URL}/watch_colors/${action}`;
        const payload = { data: { ids: colorIds } };

        console.log(`Attempting to ${action} colors with IDs:`, colorIds);
        console.log(`Sending payload:`, payload);

        try {
            await makeAuthenticatedRequest('put', url, payload);

            alert(`Colors ${action}d successfully.`);
            handleCloseManagement();
            setForceUpdate(prev => prev + 1);
        } catch (error) {
            console.error(`Error during ${action}:`, error.response?.data || error.message, error);
            const message = error.message?.startsWith("Unauth") ? "Authentication failed." : (error.response?.data?.message || error.message || `Failed to ${action} colors.`);
            setActionError(message);
        } finally {
            setIsLoading(false);
        }
    };

    const checkedCount = getSelectedColorIds().length;

    return (
        <div className="WatchColor">
            <div className="colors-container">
                <h2 className="colors-header">{viewType === "active" ? "Watch Colors" : "Archived Colors"}</h2>
                {fetchError && !isLoading && <p className="error-message" style={{ color: 'red', margin: '10px 0' }}>{fetchError}</p>}

                <div className="table-container">
                    <div className="table-header-actions">
                        <div className="search-bar">
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={handleSearchChange}
                                placeholder="Search Color Name..."
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
                                        title="Archive selected colors"
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
                                    title="Restore selected colors"
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
                                Active Colors
                            </button>
                            <button
                                className={`view-button ${viewType === "archived" ? "active" : ""}`}
                                onClick={() => handleViewChange("archived")}
                                disabled={isLoading}
                            >
                                Archived Colors
                            </button>
                        </div>
                    </div>

                    <table ref={tableRef} className={`colors-table ${viewType}`}>
                        <thead>
                            <tr className="table-header-row">
                                <th className="table-header checkbox-column">
                                    <input
                                        type="checkbox"
                                        className="color-checkbox header-checkbox"
                                        checked={isSelectAll}
                                        onChange={handleSelectAll}
                                        disabled={isLoading || colors.length === 0}
                                    />
                                </th>
                                <th className="table-header colors-action-column">Action</th>
                                <th className="table-header">Color Name</th>
                                <th className="table-header">Created At</th>
                                <th className="table-header">Updated At</th>
                            </tr>
                        </thead>
                        <tbody>
                            {isLoading ? (
                                <tr><td colSpan="5" style={{ textAlign: 'center', padding: '20px', fontStyle: 'italic' }}><FaSpinner className="spinner" /> Loading...</td></tr>
                            ) : fetchError ? (
                                <tr><td colSpan="5" style={{ textAlign: 'center', padding: '20px', color: 'grey' }}>Could not load data.</td></tr>
                            ) : colors.length === 0 ? (
                                <tr className="table-row">
                                    <td colSpan="5" className="table-cell" style={{ textAlign: "center", padding: "20px" }}>
                                        {searchQuery ? "No colors match your search." : (viewType === 'active' ? "No active colors found." : "No archived colors found.")}
                                    </td>
                                </tr>
                            ) : (
                                colors.map(color => (
                                    <tr className={`table-row ${color.status === 0 ? 'archived-row' : 'active-row'}`} key={color.id}>
                                        <td className="table-cell checkbox-column">
                                            <input
                                                type="checkbox"
                                                className="color-checkbox row-checkbox"
                                                checked={!!checkedRows[color.id]}
                                                onChange={e => handleRowCheckbox(color, e)}
                                                disabled={isLoading}
                                            />
                                        </td>
                                        <td className="table-cell colors-action-column">
                                            <div className="action-buttons">
                                                {viewType === "active" ? (
                                                    <>
                                                        <FaEdit className="edit-icon action-icon" title="Edit Color" size={18} onClick={() => handleEdit(color)} />
                                                        <FaTrash className="delete-icon action-icon" title="Archive Color" size={18} onClick={() => handleArchive(color)} />
                                                    </>
                                                ) : (
                                                    <FaUndo className="restore-icon action-icon" title="Restore Color" size={18} onClick={() => handleRestore(color)} />
                                                )}
                                            </div>
                                        </td>
                                        <td className="table-cell">{color.color_name}</td>
                                        <td className="table-cell">{formatDateTime(color.created_at)}</td>
                                        <td className="table-cell">{formatDateTime(color.updated_at)}</td>
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
                    <WatchColorManagement
                        type={managementType}
                        color={managementType === "edit" ? selectedColorForAction : null}
                        selectedColors={managementType === "archive" || managementType === "restore" ? selectedColorForAction : []}
                        name={name}
                        onClose={handleCloseManagement}
                        onConfirm={handleConfirmArchiveOrRestore}
                        onSave={handleSaveEditOrAdd}
                        externalError={actionError}
                    />
                )}
            </div>
        </div>
    );
};

export default WatchColorList;