import React, { useState, useEffect, useRef, useCallback } from "react";
import { FaEdit, FaTrash, FaUndo, FaSpinner } from "react-icons/fa";
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
    } catch (error) { console.error(`Axios Error: ${method.toUpperCase()} ${url}`, error.response?.data || error.message); throw error; }
};

const formatDate = (dateString) => { if (!dateString) return "N/A"; return moment(dateString).isValid() ? moment(dateString).format('MMMM D, YYYY') : "Invalid Date"; };
const formatTime = (dateString) => { if (!dateString) return "N/A"; return moment(dateString).isValid() ? moment(dateString).format('h:mm A') : "Invalid Time"; };

const UserList = () => {
    const [users, setUsers] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [fetchError, setFetchError] = useState("");
    const [actionError, setActionError] = useState("");
    const [checkedRows, setCheckedRows] = useState({});
    const [isSelectAll, setIsSelectAll] = useState(false);
    const [viewType, setViewType] = useState("active");
    const [managementModalOpen, setManagementModalOpen] = useState(false);
    const [managementType, setManagementType] = useState("");
    const [selectedUsers, setSelectedUsers] = useState([]);
    const [forceUpdate, setForceUpdate] = useState(0);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [searchQuery, setSearchQuery] = useState("");
    const itemsPerPage = 5;
    const tableRef = useRef(null);

    const fetchUsers = useCallback(async () => {
        setIsLoading(true); setFetchError(""); setCheckedRows({}); setIsSelectAll(false);
        try {
            const response = await makeAuthenticatedRequest('get', `${API_BASE_URL}/users`, null, {
                params: { page: currentPage, per_page: itemsPerPage, status: viewType, search: searchQuery || undefined }
            });
            if (response.data?.data && typeof response.data.last_page !== 'undefined') {
                const formattedUsers = response.data.data.map(user => {
                    let roleName = 'N/A';
                    if (user.role?.name) { roleName = user.role.name; }
                    else if (user.role_name) { roleName = user.role_name; }
                    else if (user.role_id === 1) { roleName = 'Admin'; }
                    else if (user.role_id === 2) { roleName = 'Customer'; }
                    return { ...user, isArchived: user.status === 0, roleName, createdAtDate: formatDate(user.created_at), createdAtTime: formatTime(user.created_at), updatedAtDate: formatDate(user.updated_at), updatedAtTime: formatTime(user.updated_at) };
                });
                setUsers(formattedUsers); setTotalPages(response.data.last_page || 1);
                 if (response.data.current_page > response.data.last_page && response.data.last_page > 0) { setCurrentPage(response.data.last_page); }
                 else if (response.data.total === 0 && currentPage > 1) { setCurrentPage(1); }
            } else { setFetchError("Received invalid user data format."); setUsers([]); setTotalPages(1); }
        } catch (err) { const msg = err.message?.startsWith("Unauth") ? "Unauth." : (err.response?.data?.message || err.message || 'Failed.'); setFetchError(msg); setUsers([]); setTotalPages(1);
        } finally { setIsLoading(false); }
    }, [currentPage, itemsPerPage, viewType, searchQuery]);

    useEffect(() => { fetchUsers(); }, [fetchUsers, forceUpdate]);

    const handleSelectAll = (e) => { const iC = e.target.checked; setIsSelectAll(iC); const nR = {}; if (iC) users.forEach(u => { nR[u.id] = true; }); setCheckedRows(nR); };
    const handleRowCheckbox = (userId, e) => { const iC = e.target.checked; setCheckedRows(p => { const u = { ...p, [userId]: iC }; const aC = users.length>0 && users.every(usr=>u[usr.id]); setIsSelectAll(aC); return u; }); };
    const getSelectedUserIds = () => Object.keys(checkedRows).filter(id=>checkedRows[id]).map(id=>parseInt(id, 10));
    const getSelectedUsers = (sU = null) => { if (sU) return [sU]; const sIds = getSelectedUserIds(); console.log(`Getting users based on checked IDs:`, sIds); const sel = users.filter(u => sIds.includes(u.id)); console.log(`Found ${sel.length} users.`); return sel; };

    const handleArchiveAction = (uTA = null) => { const sI = getSelectedUsers(uTA); console.log(`Archive Clicked. Single User: ${!!uTA}. Found: ${sI.length}`); if (viewType !== "active") return; if (sI.length === 0) { alert("Select user(s) to archive."); return; } setManagementType("archive"); setSelectedUsers(sI); setActionError(""); setManagementModalOpen(true); };
    const handleRestoreAction = (uTR = null) => { const sI = getSelectedUsers(uTR); console.log(`Restore Clicked. Single User: ${!!uTR}. Found: ${sI.length}`); if (viewType !== "archived") return; if (sI.length === 0) { alert("Select user(s) to restore."); return; } setManagementType("restore"); setSelectedUsers(sI); setActionError(""); setManagementModalOpen(true); };
    const handleSearchChange = (e) => { setSearchQuery(e.target.value); setCurrentPage(1); };
    const handleCloseManagement = () => { setManagementModalOpen(false); setManagementType(""); setSelectedUsers([]); setActionError(""); };

    const handleConfirmArchiveOrRestore = async (items) => {
        setActionError("");
        if (!items || items.length === 0) { setActionError("No users selected."); return; }

        const userIds = items.map(item => item.id);
        const action = managementType === "archive" ? "archive" : "restore";
        const url = `${API_BASE_URL}/users/${action}`;

        try {
            console.log(`Attempting to ${action} users. Payload:`, { ids: userIds });
            await makeAuthenticatedRequest('put', url, { ids: userIds });

            alert(`Users ${action}d successfully.`);
            handleCloseManagement();
            setForceUpdate(prev => prev + 1);

        } catch (err) {
            console.error(`Error ${action}ing users:`, err);
            let message = `Failed to ${action} users.`;

            if (err.response) {
                console.error("Error response data:", err.response.data);
                if (err.response.status === 400 && err.response.data.errors) {
                    const validationErrors = err.response.data.errors;
                    const firstErrorKey = Object.keys(validationErrors).find(key => key.startsWith('ids'));
                    const specificError = firstErrorKey ? validationErrors[firstErrorKey][0] : null;
                    message = specificError || err.response.data.message || 'Invalid input provided.';
                } else if (err.response.data?.message) {
                     message = err.response.data.message;
                } else if (err.message?.startsWith("Unauthenticated")) {
                     message = "Unauthenticated.";
                } else {
                     message = `Request failed with status ${err.response.status}.`;
                }
            } else if (err.message?.startsWith("Unauthenticated")) { message = "Unauthenticated."; }
             else if (err.request) { message = "Network error."; }
             else { message = `Unexpected error: ${err.message}`; }

            setActionError(message);
        } finally {
        }
    };

    const checkedCount = getSelectedUserIds().length;

    return (
        <div className="users-container">
            <h2 className="users-header">{viewType === "active" ? "Users" : "Archived Users"}</h2>
            {fetchError && !isLoading && <p className="error-message" style={{ color: 'red', margin: '10px 0' }}>{fetchError}</p>}

            <div className="table-container">
                <div className="table-header-actions">
                    <div className="search-bar"> <input type="text" value={searchQuery} onChange={handleSearchChange} placeholder="Search Username, Email, Role..." className="search-input" disabled={isLoading} /> </div>
                    <div className="button-group" style={{ marginLeft: 'auto' }}>
                        {viewType === "active" && ( <button className="delete-button" onClick={() => handleArchiveAction()} disabled={checkedCount === 0 || isLoading} title="Archive selected users"> Archive </button> )}
                        {viewType === "archived" && ( <button className="restore-button" onClick={() => handleRestoreAction()} disabled={checkedCount === 0 || isLoading}> Restore </button> )}
                    </div>
                    <div className="view-toggle"> <button className={`view-button ${viewType === "active" ? "active" : ""}`} onClick={() => { setViewType("active"); setCurrentPage(1); }} disabled={isLoading}> Active Users </button> <button className={`view-button ${viewType === "archived" ? "active" : ""}`} onClick={() => { setViewType("archived"); setCurrentPage(1); }} disabled={isLoading}> Archived Users </button> </div>
                </div>

                <table ref={tableRef} className={`users-table ${viewType}`}>
                     <thead> <tr className="table-header-row"> <th className="table-header"> <input type="checkbox" className="user-checkbox" checked={isSelectAll} onChange={handleSelectAll} disabled={isLoading || users.length === 0}/> </th> <th className="table-header users-action-column">Action</th> <th className="table-header">Username</th> <th className="table-header">Email</th> <th className="table-header">Status</th> <th className="table-header">Role</th> <th className="table-header">Created At</th> <th className="table-header">Updated At</th> </tr> </thead>
                    <tbody>
                        {isLoading ? ( <tr><td colSpan="8" style={{ textAlign: 'center', padding: '20px', fontStyle: 'italic' }}><FaSpinner className="spinner" /> Loading...</td></tr> )
                        : fetchError ? ( <tr><td colSpan="8" style={{ textAlign: 'center', padding: '20px', color: 'red' }}>Error: {fetchError}</td></tr> )
                        : users.length === 0 ? ( <tr className="table-row"> <td colSpan="8" className="table-cell" style={{ textAlign: "center", padding: "20px" }}> {searchQuery ? "No users match search." : "No users available."} </td> </tr> )
                        : ( users.map((user) => (
                                <tr className={`table-row ${viewType === "archived" ? 'view-type="archived"' : ''}`} key={user.id}>
                                    <td className="table-cell"> <input type="checkbox" className="user-checkbox" checked={!!checkedRows[user.id]} onChange={(e) => handleRowCheckbox(user.id, e)} disabled={isLoading}/> </td>
                                    <td className="table-cell users-action-column"> <div className="action-buttons"> {viewType === "active" ? ( <FaTrash className="delete-icon" title="Archive User" size={20} onClick={() => handleArchiveAction(user)} /> ) : ( <FaUndo className="restore-icon" title="Restore User" size={20} onClick={() => handleRestoreAction(user)} /> )} </div> </td>
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
                        <button onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))} disabled={currentPage === 1 || isLoading} className="table-pagination-button"> Previous </button>
                        {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => ( <button key={page} onClick={() => setCurrentPage(page)} className={currentPage === page ? "table-pagination-button active" : "table-pagination-button"} disabled={isLoading}> {page} </button> ))}
                        <button onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))} disabled={currentPage === totalPages || isLoading} className="table-pagination-button"> Next </button>
                    </div>
                )}
            </div>

            {managementModalOpen && (managementType === 'archive' || managementType === 'restore') && (
                <UserManagement
                    type={managementType}
                    user={null}
                    selectedUsers={selectedUsers}
                    onClose={handleCloseManagement}
                    onConfirm={handleConfirmArchiveOrRestore}
                    externalError={actionError}
                />
            )}
        </div>
    );
};

export default UserList;