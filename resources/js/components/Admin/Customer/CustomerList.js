import React, { useState, useEffect, useRef, useCallback } from "react";
import { FaTrash, FaUndo, FaSpinner } from "react-icons/fa";
import CustomerManagement from "./CustomerManagement";
import Axios from 'axios';
import moment from 'moment';

const API_BASE_URL = "http://localhost:8000/api";
const CUSTOMER_ROLE_ID = 2;

const makeAuthenticatedRequest = async (method, url, data = null, config = {}) => {
    const token = localStorage.getItem("access_token");
    if (!token) { console.error("Auth token not found."); throw new Error("Unauthenticated: No token found."); }
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

const CustomerList = () => {
    const [customers, setCustomers] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [fetchError, setFetchError] = useState("");
    const [actionError, setActionError] = useState("");
    const [checkedRows, setCheckedRows] = useState({});
    const [isSelectAll, setIsSelectAll] = useState(false);
    const [viewType, setViewType] = useState("active");
    const [managementModalOpen, setManagementModalOpen] = useState(false);
    const [managementType, setManagementType] = useState("");
    const [selectedCustomers, setSelectedCustomers] = useState([]);
    const [forceUpdate, setForceUpdate] = useState(0);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [searchQuery, setSearchQuery] = useState("");
    const itemsPerPage = 5;
    const tableRef = useRef(null);

    const fetchCustomers = useCallback(async () => {
        setIsLoading(true); setFetchError(""); setCheckedRows({}); setIsSelectAll(false);
        console.log(`Fetching customers: page=${currentPage}, status=${viewType}, search=${searchQuery}`);
        try {
            const response = await makeAuthenticatedRequest('get', `${API_BASE_URL}/users`, null, {
                params: {
                    page: currentPage,
                    per_page: itemsPerPage,
                    status: viewType,
                    search: searchQuery || undefined,
                    role_id: CUSTOMER_ROLE_ID
                }
            });
            console.log("Customers API Response:", response.data);

            if (response.data?.data && typeof response.data.last_page !== 'undefined') {
                const formattedCustomers = response.data.data.map(user => ({
                    id: user.id,
                    name: user.username,
                    email: user.email,
                    address: user.profile?.address || user.address || 'N/A',
                    status: user.status,
                    isArchived: user.status === 0,
                    createdAtDate: formatDate(user.created_at),
                    createdAtTime: formatTime(user.created_at),
                    updatedAtDate: formatDate(user.updated_at),
                    updatedAtTime: formatTime(user.updated_at),
                }));
                setCustomers(formattedCustomers);
                setTotalPages(response.data.last_page || 1);
                 if (response.data.current_page > response.data.last_page && response.data.last_page > 0) { setCurrentPage(response.data.last_page); }
                 else if (response.data.total === 0 && currentPage > 1) { setCurrentPage(1); }
            } else {
                console.warn("Invalid data structure from /users endpoint for customers:", response.data);
                setFetchError("Received invalid customer data format."); setCustomers([]); setTotalPages(1);
            }
        } catch (err) {
            console.error("Error fetching customers:", err);
            const message = err.message?.startsWith("Unauth") ? "Unauth." : (err.response?.data?.message || err.message || 'Failed.');
            setFetchError(message); setCustomers([]); setTotalPages(1);
        } finally { setIsLoading(false); }
    }, [currentPage, itemsPerPage, viewType, searchQuery]);

    useEffect(() => { fetchCustomers(); }, [fetchCustomers, forceUpdate]);

    const handleSelectAll = (e) => { const iC = e.target.checked; setIsSelectAll(iC); const nR = {}; if (iC) customers.forEach(c => { nR[c.id] = true; }); setCheckedRows(nR); };
    const handleRowCheckbox = (customerId, e) => { const iC = e.target.checked; setCheckedRows(p => { const u = { ...p, [customerId]: iC }; const aC = customers.length>0 && customers.every(c=>u[c.id]); setIsSelectAll(aC); return u; }); };
    const getSelectedCustomerIds = () => Object.keys(checkedRows).filter(id=>checkedRows[id]).map(id=>parseInt(id, 10));
    const getSelectedCustomers = (singleCustomer = null) => { if (singleCustomer) return [singleCustomer]; const sIds = getSelectedCustomerIds(); return customers.filter(c => sIds.includes(c.id)); };

    const handleArchiveAction = (customerToArchive = null) => {
        const selectedItems = getSelectedCustomers(customerToArchive);
        if (viewType !== "active") { alert("Can only archive active customers."); return; }
        if (selectedItems.length === 0) { alert("Select customer(s) to archive."); return; }
        setManagementType("archive"); setSelectedCustomers(selectedItems); setActionError(""); setManagementModalOpen(true);
    };
    const handleRestoreAction = (customerToRestore = null) => {
        const selectedItems = getSelectedCustomers(customerToRestore);
        if (viewType !== "archived") { alert("Can only restore archived customers."); return; }
        if (selectedItems.length === 0) { alert("Select customer(s) to restore."); return; }
        setManagementType("restore"); setSelectedCustomers(selectedItems); setActionError(""); setManagementModalOpen(true);
    };
    const handleSearchChange = (e) => { setSearchQuery(e.target.value); setCurrentPage(1); };
    const handleCloseManagement = () => { setManagementModalOpen(false); setManagementType(""); setSelectedCustomers([]); setActionError(""); };

    const handleConfirmArchiveOrRestore = async (items) => {
        setActionError(""); if (!items || items.length === 0) { setActionError("No customers selected."); return; }
        const customerIds = items.map(item => item.id);
        const action = managementType === "archive" ? "archive" : "restore";
        const url = `${API_BASE_URL}/users/${action}`;
        try {
            console.log(`Attempting to ${action} customers (users):`, customerIds);
            await makeAuthenticatedRequest('put', url, { ids: customerIds });
            alert(`Customers ${action}d successfully.`); handleCloseManagement(); setForceUpdate(prev => prev + 1);
        } catch (err) {
            console.error(`Error ${action}ing customers:`, err);
            const message = err.message?.startsWith("Unauth")?"Unauth.":(err.response?.data?.message||err.message||`Failed.`);
            setActionError(message);
        } finally {
        }
    };

    const checkedCount = getSelectedCustomerIds().length;

    return (
        <div className="customers-container">
            <h2 className="customers-header">{viewType === "active" ? "Customers" : "Archived Customers"}</h2>
            {fetchError && !isLoading && <p className="error-message" style={{ color: 'red', margin: '10px 0' }}>{fetchError}</p>}

            <div className="table-container">
                <div className="table-header-actions">
                    <div className="search-bar"> <input type="text" value={searchQuery} onChange={handleSearchChange} placeholder="Search Name, Email, Address..." className="search-input" disabled={isLoading} /> </div>
                    <div className="button-group" style={{ marginLeft: 'auto' }}>
                        {viewType === "active" && ( <button className="delete-button" onClick={() => handleArchiveAction()} disabled={checkedCount === 0 || isLoading} title="Archive selected customers"> Delete </button> )}
                        {viewType === "archived" && ( <button className="restore-button" onClick={() => handleRestoreAction()} disabled={checkedCount === 0 || isLoading}> Restore </button> )}
                    </div>
                    <div className="view-toggle"> <button className={`view-button ${viewType === "active" ? "active" : ""}`} onClick={() => { setViewType("active"); setCurrentPage(1); }} disabled={isLoading}> Active Customers </button> <button className={`view-button ${viewType === "archived" ? "active" : ""}`} onClick={() => { setViewType("archived"); setCurrentPage(1); }} disabled={isLoading}> Archived Customers </button> </div>
                </div>

                <table ref={tableRef} className={`customers-table ${viewType}`}>
                     <thead> <tr className="table-header-row"> <th className="table-header"> <input type="checkbox" className="customer-checkbox" checked={isSelectAll} onChange={handleSelectAll} disabled={isLoading || customers.length === 0}/> </th> <th className="table-header customers-action-column">Action</th> <th className="table-header">Customer Name</th> <th className="table-header">Email</th> <th className="table-header">Status</th> <th className="table-header">Created At</th> <th className="table-header">Updated At</th> </tr> </thead>
                    <tbody>
                        {isLoading ? ( <tr><td colSpan="8" style={{ textAlign: 'center', padding: '20px', fontStyle: 'italic' }}><FaSpinner className="spinner" /> Loading...</td></tr> )
                        : fetchError ? ( <tr><td colSpan="8" style={{ textAlign: 'center', padding: '20px', color: 'red' }}>Error: {fetchError}</td></tr> )
                        : customers.length === 0 ? ( <tr className="table-row"> <td colSpan="8" className="table-cell" style={{ textAlign: "center", padding: "20px" }}> {searchQuery ? "No customers match." : "No customers available."} </td> </tr> )
                        : ( customers.map((customer) => (
                                <tr className={`table-row ${viewType === "archived" ? 'view-type="archived"' : ''}`} key={customer.id}>
                                    <td className="table-cell"> <input type="checkbox" className="customer-checkbox" checked={!!checkedRows[customer.id]} onChange={(e) => handleRowCheckbox(customer.id, e)} disabled={isLoading}/> </td>
                                    <td className="table-cell customers-action-column"> <div className="action-buttons"> {viewType === "active" ? ( <FaTrash className="delete-icon" title="Archive Customer" size={20} onClick={() => handleArchiveAction(customer)} /> ) : ( <FaUndo className="restore-icon" title="Restore Customer" size={20} onClick={() => handleRestoreAction(customer)} /> )} </div> </td>
                                    <td className="table-cell">{customer.name}</td>
                                    <td className="table-cell" title={customer.email}>{customer.email}</td>
                                    <td className={`table-cell status-${customer.isArchived ? "inactive" : "active"}`}> {customer.isArchived ? "Inactive" : "Active"} </td>
                                    <td className="table-cell">{customer.createdAtDate}<br/><span style={{fontSize:'0.8em', color:'#666'}}>at {customer.createdAtTime}</span></td>
                                    <td className="table-cell">{customer.updatedAtDate}<br/><span style={{fontSize:'0.8em', color:'#666'}}>at {customer.updatedAtTime}</span></td>
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
                <CustomerManagement
                    type={managementType}
                    selectedCustomers={selectedCustomers}
                    onClose={handleCloseManagement}
                    onConfirm={handleConfirmArchiveOrRestore}
                    externalError={actionError}
                />
            )}
        </div>
    );
};

export default CustomerList;