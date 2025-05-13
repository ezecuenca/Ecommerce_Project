import React, { useState, useEffect, useRef, useCallback } from "react";
import { FaEdit, FaTrash, FaUndo, FaSpinner } from "react-icons/fa"; // FaSearch icon removed
import UserManagement from "./UserManagement";
import Axios from 'axios';
import moment from 'moment';

const API_BASE_URL = "http://localhost:8000/api";

const makeAuthenticatedRequest = async (method, url, data = null, config = {}) => {
    const token = localStorage.getItem("access_token");
    if (!token) { console.error("Authentication token not found."); throw new Error("Unauthenticated: No token found."); }
    const headers = { 'Authorization': `Bearer ${token}`, 'Accept': 'application/json', ...(!(data instanceof FormData) && data ? { 'Content-Type': 'application/json' } : {}), ...(config.headers || {}), };
    if (data instanceof FormData) { delete headers['Content-Type']; }
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
        console.error(`Axios Error: ${method.toUpperCase()} ${url}`, error.response?.data || error.message, error.response?.status);
        throw error;
    }
};

const formatDate = (dateString) => { if (!dateString) return "N/A"; return moment(dateString).isValid() ? moment(dateString).format('MMMM D, YYYY') : "Invalid Date"; };
const formatTime = (dateString) => { if (!dateString) return "N/A"; return moment(dateString).isValid() ? moment(dateString).format('h:mm A') : "Invalid Time"; };

const UserList = () => {
    const [users, setUsers] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [fetchError, setFetchError] = useState("");
    const [actionError, setActionError] = useState("");
    const [checkedRows, setCheckedRows] = useState({});
    const [isSelectAll, setIsSelectAll] = useState(false);
    const [viewType, setViewType] = useState("active");
    const [managementModalOpen, setManagementModalOpen] = useState(false);
    const [managementType, setManagementType] = useState("");
    const [selectedUsers, setSelectedUsers] = useState([]);
    const [currentUserForEdit, setCurrentUserForEdit] = useState(null);
    const [forceUpdate, setForceUpdate] = useState(0);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);

    // Search related state - these were part of the search implementation
    const [searchInput, setSearchInput] = useState("");
    const [searchQuery, setSearchQuery] = useState("");
    const searchTimeoutRef = useRef(null);

    const itemsPerPage = 5;
    const tableRef = useRef(null);

    const fetchUsers = useCallback(async () => {
        setIsLoading(true); setFetchError(""); setCheckedRows({}); setIsSelectAll(false);
        try {
            const response = await makeAuthenticatedRequest('get', `${API_BASE_URL}/users`, null, {
                // Pass the searchQuery to the backend
                params: { page: currentPage, per_page: itemsPerPage, status: viewType, search: searchQuery || undefined }
            });
            if (response.data?.data && typeof response.data.last_page !== 'undefined') {
                const formattedUsers = response.data.data.map(user => {
                    let roleName = 'N/A';
                    // Backend should ideally send the role name with the user data,
                    // especially after an update. If 'user.role' is the eager-loaded relationship:
                    if (user.role && (user.role.name || user.role.role_name)) { // Check for common role name properties
                        roleName = user.role.name || user.role.role_name;
                    }
                    // Fallback if backend only sends role_id directly on user object
                    else if (user.role_id === 1) { roleName = 'Admin'; }
                    else if (user.role_id === 2) { roleName = 'Customer'; }
                    // Add other role_id mappings if necessary
                    return { ...user, isArchived: user.status === 0, roleName, createdAtDate: formatDate(user.created_at), createdAtTime: formatTime(user.created_at), updatedAtDate: formatDate(user.updated_at), updatedAtTime: formatTime(user.updated_at) };
                });
                setUsers(formattedUsers); setTotalPages(response.data.last_page || 1);
                 if (response.data.current_page > response.data.last_page && response.data.last_page > 0) { setCurrentPage(response.data.last_page); }
                 else if (response.data.total === 0 && currentPage > 1) { setCurrentPage(1); }
            } else { setFetchError("Received invalid user data format."); setUsers([]); setTotalPages(1); }
        } catch (err) { const msg = err.message?.startsWith("Unauth") ? "Unauth." : (err.response?.data?.message || err.message || 'Failed.'); setFetchError(msg); setUsers([]); setTotalPages(1);
        } finally { setIsLoading(false); }
    }, [currentPage, itemsPerPage, viewType, searchQuery]); // searchQuery is a dependency

    useEffect(() => {
        fetchUsers();
    }, [fetchUsers, forceUpdate]); // forceUpdate will trigger re-fetch

    // Search input change handler with debounce
    const handleSearchInputChange = (e) => {
        const value = e.target.value;
        setSearchInput(value); // Update visual input immediately

        if (searchTimeoutRef.current) {
            clearTimeout(searchTimeoutRef.current);
        }
        searchTimeoutRef.current = setTimeout(() => {
            setSearchQuery(value); // Update the actual query term
            setCurrentPage(1);     // Reset to page 1 for new search
        }, 500); // 500ms debounce
    };

    // Function to trigger search explicitly (e.g., on Enter if input is focused)
    const triggerSearchOnEnter = (e) => {
        if (e.key === 'Enter') {
            if (searchTimeoutRef.current) {
                clearTimeout(searchTimeoutRef.current);
            }
            setSearchQuery(searchInput); // Use the current input value
            setCurrentPage(1);
        }
    };


    const handleSelectAll = (e) => { const iC = e.target.checked; setIsSelectAll(iC); const nR = {}; if (iC) users.forEach(u => { nR[u.id] = true; }); setCheckedRows(nR); };
    const handleRowCheckbox = (userId, e) => { const iC = e.target.checked; setCheckedRows(p => { const u = { ...p, [userId]: iC }; const aC = users.length>0 && users.every(usr=>u[usr.id]); setIsSelectAll(aC); return u; }); };
    const getSelectedUserIds = () => Object.keys(checkedRows).filter(id=>checkedRows[id]).map(id=>parseInt(id, 10));
    const getSelectedUsersForBulkAction = (sU = null) => { if (sU) return [sU]; const sIds = getSelectedUserIds(); const sel = users.filter(u => sIds.includes(u.id)); return sel; };

    const handleArchiveAction = (uTA = null) => { const sI = getSelectedUsersForBulkAction(uTA); if (viewType !== "active") return; if (sI.length === 0) { alert("Select user(s) to archive."); return; } setManagementType("archive"); setSelectedUsers(sI); setActionError(""); setManagementModalOpen(true); };
    const handleRestoreAction = (uTR = null) => { const sI = getSelectedUsersForBulkAction(uTR); if (viewType !== "archived") return; if (sI.length === 0) { alert("Select user(s) to restore."); return; } setManagementType("restore"); setSelectedUsers(sI); setActionError(""); setManagementModalOpen(true); };

    const handleEditAction = (userToEdit) => {
        console.log("[UserList] Edit action for user:", userToEdit);
        setManagementType("edit");
        setCurrentUserForEdit(userToEdit);
        setSelectedUsers([]);
        setActionError("");
        setManagementModalOpen(true);
    };

    const handleCloseManagement = () => { setManagementModalOpen(false); setManagementType(""); setSelectedUsers([]); setCurrentUserForEdit(null); setActionError(""); };

    const handleConfirmArchiveOrRestore = async (items) => {
        setActionError("");
        setIsSubmitting(true);
        if (!items || items.length === 0) { setActionError("No users selected."); setIsSubmitting(false); return; }
        const userIds = items.map(item => item.id);
        const action = managementType === "archive" ? "archive" : "restore";
        const url = `${API_BASE_URL}/users/${action}`;
        try {
            console.log(`[UserList] Attempting to ${action} users. Payload:`, { ids: userIds });
            await makeAuthenticatedRequest('put', url, { ids: userIds });
            alert(`Users ${action}d successfully.`);
            handleCloseManagement();
            setForceUpdate(prev => prev + 1);
        } catch (err) {
            console.error(`[UserList] Error ${action}ing users:`, err);
            let message = `Failed to ${action} users.`;
            if (err.response) {
                if (err.response.status === 400 && err.response.data.errors) { const validationErrors = err.response.data.errors; const firstErrorKey = Object.keys(validationErrors).find(key => key.startsWith('ids')); const specificError = firstErrorKey ? validationErrors[firstErrorKey][0] : null; message = specificError || err.response.data.message || 'Invalid input provided.';
                } else if (err.response.data?.message) { message = err.response.data.message;
                } else if (err.response.status === 401 || err.message?.startsWith("Unauthenticated")) { message = "Authentication failed. Please log in again.";
                } else { message = `Request failed: ${err.response.data?.message || `Status ${err.response.status}`}`; }
            } else if (err.message?.startsWith("Unauthenticated")) { message = "Authentication failed. No token found.";
            } else if (err.request) { message = "Network error. Could not reach server.";
            } else { message = `Unexpected error: ${err.message}`; }
            setActionError(message);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleSaveUser = async (userDataFromModal, type, userIdToUpdate = null) => {
        if (type !== 'edit' || !userIdToUpdate) {
            console.error("[UserList] handleSaveUser called with invalid type or missing userId for edit.");
            setActionError("Invalid operation for saving user.");
            return;
        }
        setActionError("");
        setIsSubmitting(true);
        const dataToUpdate = {
            username: userDataFromModal.username,
            email: userDataFromModal.email,
            role_id: userDataFromModal.role_id,
        };
        Object.keys(dataToUpdate).forEach(key => {
            if (dataToUpdate[key] === undefined || dataToUpdate[key] === '') {
                 if (key === 'username' || key === 'email') delete dataToUpdate[key];
            }
        });
        if ('role_id' in userDataFromModal && userDataFromModal.role_id !== '') { // Only send role_id if it's selected
            dataToUpdate.role_id = userDataFromModal.role_id;
        } else if ('role_id' in userDataFromModal && userDataFromModal.role_id === '') {
            // If role_id is explicitly set to empty (e.g. "-- Select Role --"),
            // decide if you want to send it as null/empty or omit it.
            // Backend validation should catch it if role_id is required.
            // For now, let's assume an empty role_id means no change or backend handles it.
            // If your backend requires role_id, the UserManagement modal should enforce selection.
            // delete dataToUpdate.role_id; // Option: Don't send if empty
        }


        console.log("[UserList] Data being sent to backend for update:", JSON.stringify(dataToUpdate));
        const url = `${API_BASE_URL}/users/${userIdToUpdate}`;
        try {
            const response = await makeAuthenticatedRequest('put', url, dataToUpdate);
            alert(`User '${response.data?.user?.username || 'ID: ' + userIdToUpdate}' updated successfully.`);
            handleCloseManagement();
            setForceUpdate(prev => prev + 1); // This should trigger fetchUsers
        } catch (err) {
            console.error(`[UserList] Error updating user ${userIdToUpdate}:`, err);
            let message = `Failed to update user.`;
             if (err.response) {
                if (err.response.status === 422 && err.response.data.errors) {
                    const validationErrors = err.response.data.errors;
                    message = "Validation failed: " + Object.keys(validationErrors)
                        .map(key => `${key}: ${validationErrors[key].join(', ')}`)
                        .join('; ');
                } else if (err.response.data?.message) {
                    message = err.response.data.message;
                } else if (err.response.status === 401 || err.message?.startsWith("Unauthenticated")) {
                    message = "Authentication failed. Please log in again.";
                } else if (err.response.status === 403) {
                    message = err.response.data.message || "You are not authorized to perform this action.";
                }
                 else { message = `Server error: ${err.response.data?.message || `Status ${err.response.status}`}`; }
            } else if (err.message?.startsWith("Unauthenticated")) { message = "Authentication failed. No token found.";
            } else if (err.request) { message = "Network error. Could not reach server.";
            } else { message = `Unexpected error: ${err.message}`; }
            setActionError(message);
        } finally {
            setIsSubmitting(false);
        }
    };

    const checkedCount = getSelectedUserIds().length;

    return (
        <div className="users-container">
            <h2 className="users-header">{viewType === "active" ? "Users" : "Archived Users"}</h2>
            {fetchError && !isLoading && <p className="error-message" style={{ color: 'red', margin: '10px 0' }}>{fetchError}</p>}

            <div className="table-container">
                <div className="table-header-actions">
                    <div className="search-bar">
                        <input
                            type="text"
                            value={searchInput}
                            onChange={handleSearchInputChange}
                            onKeyPress={triggerSearchOnEnter} // Trigger search on Enter key
                            placeholder="Search Username, Email, Role..."
                            className="search-input"
                            disabled={isLoading || isSubmitting}
                        />
                        {/* Search Icon Button Removed Here */}
                    </div>
                    <div className="button-group" style={{ marginLeft: 'auto' }}>
                        {viewType === "active" && ( <button className="delete-button" onClick={() => handleArchiveAction()} disabled={checkedCount === 0 || isLoading || isSubmitting} title="Archive selected users"> Delete </button> )}
                        {viewType === "archived" && ( <button className="restore-button" onClick={() => handleRestoreAction()} disabled={checkedCount === 0 || isLoading || isSubmitting}> Restore </button> )}
                    </div>
                    <div className="view-toggle"> <button className={`view-button ${viewType === "active" ? "active" : ""}`} onClick={() => { setViewType("active"); setCurrentPage(1); setSearchQuery(''); setSearchInput(''); }} disabled={isLoading || isSubmitting}> Active Users </button> <button className={`view-button ${viewType === "archived" ? "active" : ""}`} onClick={() => { setViewType("archived"); setCurrentPage(1); setSearchQuery(''); setSearchInput(''); }} disabled={isLoading || isSubmitting}> Archived Users </button> </div>
                </div>

                <table ref={tableRef} className={`users-table ${viewType}`}>
                     <thead> <tr className="table-header-row"> <th className="table-header"> <input type="checkbox" className="user-checkbox" checked={isSelectAll} onChange={handleSelectAll} disabled={isLoading || users.length === 0 || isSubmitting}/> </th> <th className="table-header users-action-column">Action</th> <th className="table-header">Username</th> <th className="table-header">Email</th> <th className="table-header">Status</th> <th className="table-header">Role</th> <th className="table-header">Created At</th> <th className="table-header">Updated At</th> </tr> </thead>
                    <tbody>
                        {isLoading ? ( <tr><td colSpan="8" style={{ textAlign: 'center', padding: '20px', fontStyle: 'italic' }}><FaSpinner className="spinner" /> Loading...</td></tr> )
                        : fetchError ? ( <tr><td colSpan="8" style={{ textAlign: 'center', padding: '20px', color: 'red' }}>Error: {fetchError}</td></tr> )
                        : users.length === 0 ? ( <tr className="table-row"> <td colSpan="8" className="table-cell" style={{ textAlign: "center", padding: "20px" }}> {searchQuery ? "No users match search criteria." : "No users available."} </td> </tr> )
                        : ( users.map((user) => (
                                <tr className={`table-row ${viewType === "archived" ? 'view-type="archived"' : ''}`} key={user.id}>
                                    <td className="table-cell"> <input type="checkbox" className="user-checkbox" checked={!!checkedRows[user.id]} onChange={(e) => handleRowCheckbox(user.id, e)} disabled={isLoading || isSubmitting}/> </td>
                                    <td className="table-cell users-action-column">
                                        <div className="action-buttons">
                                            {viewType === "active" ? (
                                                <>
                                                    <FaEdit
                                                        className="edit-icon"
                                                        title="Edit User"
                                                        size={20}
                                                        onClick={() => !isSubmitting && handleEditAction(user)}
                                                        style={{ marginRight: '10px', cursor: isSubmitting ? 'not-allowed' : 'pointer', opacity: isSubmitting ? 0.5 : 1 }}
                                                    />
                                                    <FaTrash
                                                        className="delete-icon"
                                                        title="Archive User"
                                                        size={20}
                                                        onClick={() => !isSubmitting && handleArchiveAction(user)}
                                                        style={{cursor: isSubmitting ? 'not-allowed' : 'pointer', opacity: isSubmitting ? 0.5 : 1}}
                                                    />
                                                </>
                                            ) : (
                                                <FaUndo
                                                    className="restore-icon"
                                                    title="Restore User"
                                                    size={20}
                                                    onClick={() => !isSubmitting && handleRestoreAction(user)}
                                                    style={{cursor: isSubmitting ? 'not-allowed' : 'pointer', opacity: isSubmitting ? 0.5 : 1}}
                                                />
                                            )}
                                        </div>
                                    </td>
                                    <td className="table-cell">{user.username}</td>
                                    <td className="table-cell">{user.email}</td>
                                    <td className={`table-cell status-${user.isArchived ? "inactive" : "active"}`}> {user.isArchived ? "Inactive" : "Active"} </td>
                                    <td className="table-cell">{user.roleName}</td>
                                    <td className="table-cell">{user.createdAtDate}<br/><span style={{fontSize:'0.8em', color:'#666'}}>at {user.createdAtTime}</span></td>
                                    <td className="table-cell">{user.updatedAtDate}<br/><span style={{fontSize:'0.8em', color:'#666'}}>at {user.updatedAtTime}</span></td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
                {!isLoading && !fetchError && totalPages > 1 && (
                    <div className="table-pagination">
                        <button onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))} disabled={currentPage === 1 || isLoading || isSubmitting} className="table-pagination-button"> Previous </button>
                        {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => ( <button key={page} onClick={() => setCurrentPage(page)} className={currentPage === page ? "table-pagination-button active" : "table-pagination-button"} disabled={isLoading || isSubmitting}> {page} </button> ))}
                        <button onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))} disabled={currentPage === totalPages || isLoading || isSubmitting} className="table-pagination-button"> Next </button>
                    </div>
                )}
            </div>

            {managementModalOpen && (managementType === 'archive' || managementType === 'restore' || managementType === 'edit') && (
                <UserManagement
                    type={managementType}
                    user={managementType === 'edit' ? currentUserForEdit : null}
                    selectedUsers={managementType !== 'edit' ? selectedUsers : []}
                    onClose={handleCloseManagement}
                    onConfirm={managementType !== 'edit' ? handleConfirmArchiveOrRestore : null}
                    onSave={managementType === 'edit' ? handleSaveUser : null}
                    externalError={actionError}
                    isSubmitting={isSubmitting}
                />
            )}
        </div>
    );
};

export default UserList;