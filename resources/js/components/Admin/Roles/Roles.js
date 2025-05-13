import React, { useState, useEffect, useRef, useCallback } from "react";
import { FaEdit, FaTrash, FaUndo, FaSpinner } from "react-icons/fa";
import RolesManagement from "./RolesManagement";
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

const Roles = () => {
    const [roles, setRoles] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [fetchError, setFetchError] = useState("");
    const [actionError, setActionError] = useState("");
    const [checkedRows, setCheckedRows] = useState({});
    const [isSelectAll, setIsSelectAll] = useState(false);
    const [viewType, setViewType] = useState("active");
    const [managementModalOpen, setManagementModalOpen] = useState(false);
    const [managementType, setManagementType] = useState("");
    const [selectedRoleForAction, setSelectedRoleForAction] = useState(null);
    const [name, setName] = useState("");
    const [forceUpdate, setForceUpdate] = useState(0);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [searchQuery, setSearchQuery] = useState("");
    const tableRef = useRef(null);
    const itemsPerPage = 5;

    const fetchRoles = useCallback(async () => {
        setIsLoading(true);
        setFetchError("");
        setCheckedRows({});
        setIsSelectAll(false);
        console.log(`Fetching roles: page=${currentPage}, status=${viewType}, search=${searchQuery}, per_page=${itemsPerPage}`);

        try {
            const response = await makeAuthenticatedRequest('get', `${API_BASE_URL}/roles`, null, {
                params: {
                    page: currentPage,
                    per_page: itemsPerPage,
                    status: viewType,
                    search: searchQuery || undefined,
                }
            });

            console.log("Roles API Response Structure:", response.data);

            if (response.data?.data && typeof response.data.last_page !== 'undefined') {
                 console.log(`Received ${response.data.data.length} roles for page ${response.data.current_page} of ${response.data.last_page}`);
                setRoles(response.data.data);
                setTotalPages(response.data.last_page || 1);
                if (response.data.current_page > response.data.last_page && response.data.last_page > 0) {
                } else if (response.data.total === 0 && currentPage > 1) {
                     setCurrentPage(1);
                }
            } else {
                 console.warn("Received non-paginated or unexpected data structure:", response.data);
                 setRoles([]);
                 setTotalPages(1);
                 setCurrentPage(1);
                 setFetchError("Received invalid data format from server.");
            }
        } catch (error) {
            console.error("Error fetching roles:", error);
            const message = error.message?.startsWith("Unauth") ? "Authentication failed. Please log in again." : (error.response?.data?.message || error.message || 'Failed to load roles.');
            setFetchError(message);
            setRoles([]);
            setTotalPages(1);
        } finally {
            setIsLoading(false);
        }
    }, [currentPage, itemsPerPage, viewType, searchQuery]);

    useEffect(() => {
        fetchRoles();
    }, [fetchRoles, forceUpdate]);

    const handleSelectAll = (e) => {
        const isChecked = e.target.checked;
        setIsSelectAll(isChecked);
        const newCheckedRows = {};
        roles.forEach(r => { newCheckedRows[r.id] = isChecked; });
        setCheckedRows(newCheckedRows);
    };

    const handleRowCheckbox = (role, e) => {
        const isChecked = e.target.checked;
        setCheckedRows(prev => {
            const updated = { ...prev, [role.id]: isChecked };
            const allCurrentChecked = roles.length > 0 && roles.every(r => updated[r.id]);
            setIsSelectAll(allCurrentChecked);
            return updated;
        });
    };

    const getSelectedRoleIds = () => Object.keys(checkedRows).filter(id => checkedRows[id]).map(id => parseInt(id, 10));
    const getSelectedItems = (singleItem = null) => {
        if (singleItem) return [singleItem];
        const selectedIds = getSelectedRoleIds();
        return roles.filter(r => selectedIds.includes(r.id));
    };

    const handleArchive = (itemToArchive = null) => {
        const selectedItems = getSelectedItems(itemToArchive);
        if (viewType !== "active") { alert("You can only archive from Active Roles."); return; }
        if (selectedItems.length === 0) { alert("Please select at least one role to archive."); return; }
        setManagementType("archive");
        setSelectedRoleForAction(selectedItems);
        setActionError("");
        setManagementModalOpen(true);
    };

    const handleRestore = (itemToRestore = null) => {
        const selectedItems = getSelectedItems(itemToRestore);
        if (viewType !== "archived") { alert("You can only restore from Archived Roles."); return; }
        if (selectedItems.length === 0) { alert("Please select at least one role to restore."); return; }
        setManagementType("restore");
        setSelectedRoleForAction(selectedItems);
        setActionError("");
        setManagementModalOpen(true);
    };

    const handleAdd = () => {
        setManagementType("add");
        setSelectedRoleForAction(null);
        setName("");
        setActionError("");
        setManagementModalOpen(true);
    };

    const handleEdit = (role) => {
        if (viewType !== 'active' || role.status !== 1) {
             alert("Only active roles can be edited.");
             return;
         }
        setManagementType("edit");
        setSelectedRoleForAction(role);
        setName(role.role_name || "");
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
        setSelectedRoleForAction(null);
        setName("");
        setActionError("");
    };

    const handleSaveEditOrAdd = async (newOrUpdatedData) => {
        if (!newOrUpdatedData?.role_name?.trim()) {
            setActionError("Role name is required.");
            return;
        }
        setActionError("");
        setIsLoading(true);

        try {
            let response;
            if (managementType === "edit") {
                if (!selectedRoleForAction?.id) throw new Error("No role selected for editing.");
                response = await makeAuthenticatedRequest(
                    'put',
                    `${API_BASE_URL}/roles/${selectedRoleForAction.id}`,
                    { role_name: newOrUpdatedData.role_name.trim() }
                );
                alert("Role updated successfully!");
            } else if (managementType === "add") {
                response = await makeAuthenticatedRequest(
                    'post',
                    `${API_BASE_URL}/roles`,
                    { role_name: newOrUpdatedData.role_name.trim() }
                );
                alert("Role added successfully!");
            }
            handleCloseManagement();
            setForceUpdate(prev => prev + 1);
        } catch (error) {
            console.error(`Error ${managementType}ing role:`, error);
             const message = error.message?.startsWith("Unauth") ? "Authentication failed." :
                            (error.response?.data?.errors ? JSON.stringify(error.response.data.errors) :
                            (error.response?.data?.message || error.message || `Failed to ${managementType} role.`));
            setActionError(message);
        } finally {
             setIsLoading(false);
        }
    };

    const handleConfirmArchiveOrRestore = async (items) => {
        if (!items?.length) {
            alert(`Please select at least one role to ${managementType}.`);
            return;
        }
        const protectedIds = [1, 2];
        const attemptedActionOnProtected = items.some(item => protectedIds.includes(item.id));
        if (attemptedActionOnProtected) {
            alert("Cannot archive or restore the default Admin or Customer roles.");
            return;
        }

        setActionError("");
        setIsLoading(true);

        const roleIds = items.map(item => item.id);
        const action = managementType;
        const url = `${API_BASE_URL}/roles/${action}`;
        const payload = { ids: roleIds };

        console.log(`Attempting to ${action} roles with IDs:`, roleIds);
        console.log(`Sending payload:`, payload);

        try {
            await makeAuthenticatedRequest('put', url, payload);

            alert(`Roles ${action}d successfully.`);
            handleCloseManagement();
            setForceUpdate(prev => prev + 1);
        } catch (error) {
            console.error(`Error during ${action}:`, error.response?.data || error.message, error);
            const message = error.message?.startsWith("Unauth") ? "Authentication failed." : (error.response?.data?.message || error.message || `Failed to ${action} roles.`);
            setActionError(message);
        } finally {
            setIsLoading(false);
        }
    };

    const checkedCount = getSelectedRoleIds().length;

    return (
        <div className="Roles role-container">
            <h2 className="roles-header">{viewType === "active" ? "Roles" : "Archived Roles"}</h2>
            {fetchError && !isLoading && <p className="error-message" style={{ color: 'red', margin: '10px 0' }}>{fetchError}</p>}

            <div className="table-container">
                <div className="table-header-actions">
                    <div className="search-bar">
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={handleSearchChange}
                            placeholder="Search Role Name..."
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
                                    title="Archive selected roles"
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
                                title="Restore selected roles"
                            >
                                Restore ({checkedCount})
                            </button>
                        )}
                    </div>
                    <div className="view-toggle">
                        <button
                            className={`view-button ${viewType === "active" ? "active" : ""}`}
                            onClick={() => handleViewChange("active")}
                            disabled={isLoading}
                        >
                            Active Roles
                        </button>
                        <button
                            className={`view-button ${viewType === "archived" ? "active" : ""}`}
                            onClick={() => handleViewChange("archived")}
                            disabled={isLoading}
                        >
                            Archived Roles
                        </button>
                    </div>
                </div>

                <table ref={tableRef} className={`roles-table ${viewType}`}>
                    <thead>
                        <tr className="table-header-row">
                            <th className="table-header checkbox-column">
                                <input
                                    type="checkbox"
                                    className="role-checkbox header-checkbox"
                                    checked={isSelectAll}
                                    onChange={handleSelectAll}
                                    disabled={isLoading || roles.length === 0}
                                />
                            </th>
                            <th className="table-header roles-action-column">Action</th>
                            <th className="table-header">Role Name</th>
                            <th className="table-header">Created At</th>
                            <th className="table-header">Updated At</th>
                        </tr>
                    </thead>
                    <tbody>
                        {isLoading ? (
                            <tr><td colSpan="5" style={{ textAlign: 'center', padding: '20px', fontStyle: 'italic' }}><FaSpinner className="spinner" /> Loading...</td></tr>
                        ) : fetchError ? (
                            <tr><td colSpan="5" style={{ textAlign: 'center', padding: '20px', color: 'grey' }}>Could not load data.</td></tr>
                        ) : roles.length === 0 ? (
                            <tr className="table-row">
                                <td colSpan="5" className="table-cell" style={{ textAlign: "center", padding: "20px" }}>
                                    {searchQuery ? "No roles match your search." : (viewType === 'active' ? "No active roles found." : "No archived roles found.")}
                                </td>
                            </tr>
                        ) : (
                            roles.map(role => (
                                <tr className={`table-row ${role.status === 0 ? 'archived-row' : 'active-row'}`} key={role.id}>
                                    <td className="table-cell checkbox-column">
                                        <input
                                            type="checkbox"
                                            className="role-checkbox row-checkbox"
                                            checked={!!checkedRows[role.id]}
                                            onChange={e => handleRowCheckbox(role, e)}
                                            disabled={isLoading || [1, 2].includes(role.id)}
                                        />
                                    </td>
                                    <td className="table-cell roles-action-column">
                                        <div className="action-buttons">
                                            {![1, 2].includes(role.id) ? (
                                                viewType === "active" ? (
                                                    <>
                                                        <FaEdit className="edit-icon action-icon" title="Edit Role" size={18} onClick={() => handleEdit(role)} />
                                                        <FaTrash className="delete-icon action-icon" title="Archive Role" size={18} onClick={() => handleArchive(role)} />
                                                    </>
                                                ) : (
                                                    <FaUndo className="restore-icon action-icon" title="Restore Role" size={18} onClick={() => handleRestore(role)} />
                                                )
                                            ) : (
                                                 <span title="Default roles cannot be modified">--</span>
                                            )}
                                        </div>
                                    </td>
                                    <td className="table-cell">{role.role_name}</td>
                                    <td className="table-cell">{formatDate(role.created_at)}<br/><span style={{fontSize:'0.8em', color:'#666'}}>at {formatTime(role.created_at)}</span></td>
                                    <td className="table-cell">{formatDate(role.updated_at)}<br/><span style={{fontSize:'0.8em', color:'#666'}}>at {formatTime(role.updated_at)}</span></td>
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
                <RolesManagement
                    type={managementType}
                    role={managementType === "edit" ? selectedRoleForAction : null}
                    selectedRoles={managementType === "archive" || managementType === "restore" ? selectedRoleForAction : []}
                    name={name}
                    onClose={handleCloseManagement}
                    onConfirm={handleConfirmArchiveOrRestore}
                    onSave={handleSaveEditOrAdd}
                    externalError={actionError}
                />
            )}
        </div>
    );
};

export default Roles;