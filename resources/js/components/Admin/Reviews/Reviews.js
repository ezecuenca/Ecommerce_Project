// src/components/Admin/Reviews.js

import React, { useState, useEffect, useRef, useCallback } from "react";
import { FaEdit, FaTrash, FaUndo, FaSpinner } from "react-icons/fa";
import Axios from 'axios';
import ReviewManagement from "./ReviewManagement"; // Ensure this path is correct
import moment from 'moment';

const API_BASE_URL = "http://localhost:8000/api"; // Adjust if needed

// --- Notification Component ---
const Notification = ({ message, type }) => {
    if (!message) return null;
    const baseStyle = { position: 'fixed', bottom: '20px', left: '50%', transform: 'translateX(-50%)', padding: '10px 20px', borderRadius: '5px', color: 'white', zIndex: 1000, boxShadow: '0 2px 10px rgba(0,0,0,0.2)', transition: 'opacity 0.5s ease-in-out', opacity: 1 };
    const typeStyle = type === 'success' ? { backgroundColor: '#4CAF50' } : { backgroundColor: '#f44336' };
    return (<div style={{ ...baseStyle, ...typeStyle }}>{message}</div>);
};

// --- Authenticated Request Helper ---
const makeAuthenticatedRequest = async (method, url, data = null, config = {}) => {
    const token = localStorage.getItem("access_token");
    if (!token) {
        console.error("Authentication token not found in localStorage for key 'access_token'.");
        throw new Error("Unauthenticated: No token found.");
    }
    const headers = {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/json',
        ...(!(data instanceof FormData) && data && method.toLowerCase() !== 'get' ? { 'Content-Type': 'application/json' } : {}),
        ...(config.headers || {}),
    };
    if (data instanceof FormData) delete headers['Content-Type'];
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

// --- Reviews Component ---
const Reviews = () => {
    // --- State ---
    const [reviews, setReviews] = useState([]);
    const [loading, setLoading] = useState(true);
    const [fetchError, setFetchError] = useState(null);
    const [checkedRows, setCheckedRows] = useState({});
    const [isSelectAll, setIsSelectAll] = useState(false);
    const [managementModalOpen, setManagementModalOpen] = useState(false);
    const [managementType, setManagementType] = useState("");
    const [selectedReviewData, setSelectedReviewData] = useState(null);
    const [modalError, setModalError] = useState("");
    const [searchQuery, setSearchQuery] = useState('');
    const [viewType, setViewType] = useState("active");
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const itemsPerPage = 5;
    const notificationTimeoutRef = useRef(null);
    const [notification, setNotification] = useState({ message: '', type: '' });

    // --- Utility Functions ---
    const showNotification = (message, type = 'success', duration = 3000) => {
        if (notificationTimeoutRef.current) clearTimeout(notificationTimeoutRef.current);
        setNotification({ message, type });
        notificationTimeoutRef.current = setTimeout(() => {
            setNotification({ message: '', type: '' });
            notificationTimeoutRef.current = null;
        }, duration);
    };

    // Cleanup notification timeout on unmount
    useEffect(() => { return () => { if (notificationTimeoutRef.current) clearTimeout(notificationTimeoutRef.current); }; }, []);

    // --- Data Fetching ---
    const fetchReviews = useCallback(async () => {
        setLoading(true);
        setFetchError(null);

        const validatedParams = {
            status: viewType === 'active' || viewType === 'archived' ? viewType : 'active',
            page: Math.max(1, parseInt(currentPage, 10) || 1),
            per_page: itemsPerPage,
            search: typeof searchQuery === 'string' ? searchQuery.trim() : '',
        };
        if (!validatedParams.search) {
            delete validatedParams.search;
        }

        console.log("Fetching reviews with params:", validatedParams);

        try {
            const response = await makeAuthenticatedRequest('get', `${API_BASE_URL}/reviews`, null, {
                params: validatedParams
            });

            console.log("API Response for /reviews:", response);

            let rawReviewsArray = [];
            let responseCurrentPage = validatedParams.page;
            let responseTotalPages = 1;

            if (response?.data) {
                if (Array.isArray(response.data.data) && typeof response.data.last_page === 'number') {
                    rawReviewsArray = response.data.data;
                    responseCurrentPage = response.data.current_page || validatedParams.page;
                    responseTotalPages = response.data.last_page || 1;
                    console.log("Processing paginated response structure.");
                } else if (Array.isArray(response.data)) {
                    rawReviewsArray = response.data;
                    console.warn("Processing direct array response structure.");
                    responseTotalPages = 1;
                    responseCurrentPage = 1;
                } else {
                    throw new Error("Invalid response structure.");
                }

                setReviews(rawReviewsArray);
                setCurrentPage(responseCurrentPage);
                setTotalPages(responseTotalPages);

            } else {
                throw new Error("Empty response from server.");
            }
        } catch (err) {
            console.error("Error fetching reviews:", err);
            if (err.response && err.response.status === 400 && err.response.data?.message === 'Invalid request parameters.') {
                const errorDetails = err.response.data.errors ? Object.entries(err.response.data.errors).map(([field, messages]) => `${field}: ${messages.join(', ')}`).join('; ') : 'Check request parameters.';
                setFetchError(`Failed to load reviews: Invalid parameters sent (${errorDetails})`);
            } else {
                const errorMessage = err.message.startsWith("Unauthenticated") ? "Unauthenticated: Please log in." : (err.response?.data?.message || err.message || 'Failed to load reviews.');
                setFetchError(errorMessage);
            }
            setReviews([]);
            setTotalPages(1);
            setCurrentPage(1);
        } finally {
            setLoading(false);
        }
    }, [viewType, currentPage, itemsPerPage, searchQuery]);

    // Fetch reviews on initial load and when dependencies change
    useEffect(() => { fetchReviews(); }, [fetchReviews]);

    // Clear selections when changing view or page
    useEffect(() => { setCheckedRows({}); setIsSelectAll(false); }, [viewType, currentPage]);

    // --- Checkbox Handling ---
    const currentItems = reviews;

    const handleSelectAll = (e) => {
        const isChecked = e.target.checked;
        setIsSelectAll(isChecked);
        const newCheckedRows = {};
        if (isChecked && currentItems.length > 0) {
            currentItems.forEach(item => { if (item && item.id) newCheckedRows[item.id] = true; });
        }
        setCheckedRows(newCheckedRows);
    };

    const handleRowCheckbox = (itemId, e) => {
        const isChecked = e.target.checked;
        setCheckedRows(prev => {
            const updated = { ...prev };
            if (isChecked) { updated[itemId] = true; }
            else { delete updated[itemId]; }
            const currentItemIds = currentItems.map(item => item.id).filter(id => id !== null && id !== undefined);
            const allCurrentChecked = currentItemIds.length > 0 && currentItemIds.every(id => updated[id]);
            setIsSelectAll(allCurrentChecked);
            return updated;
        });
    };

    const getSelectedReviewIds = () => Object.keys(checkedRows).filter(id => checkedRows[id]).map(id => parseInt(id, 10));
    const checkedCount = getSelectedReviewIds().length;

    // --- Action Handlers ---
    const handleEdit = (review) => {
        if (viewType === 'archived') {
            showNotification("Cannot edit archived reviews. Please restore first.", 'error'); return;
        }
        setManagementType("edit"); setSelectedReviewData(review); setModalError(""); setManagementModalOpen(true);
    };

    const initiateConfirmation = (items, actionType) => {
        if (!items || items.length === 0) {
            showNotification(`Please select items to ${actionType.replace('Confirm', '')}.`, 'error'); return;
        }
        setManagementType(actionType);
        setSelectedReviewData(items);
        setModalError("");
        setManagementModalOpen(true);
    };

    const handleBulkAction = () => {
        const selectedIds = getSelectedReviewIds();
        if (selectedIds.length === 0) {
            showNotification(`Please select reviews.`, 'error'); return;
        }
        const itemsToProcess = reviews.filter(r => r && r.id && selectedIds.includes(r.id));
        if (itemsToProcess.length === 0) {
            showNotification(`Selected reviews not found in current view.`, 'error'); return;
        }
        const actionType = viewType === 'active' ? 'archiveConfirm' : 'restoreConfirm';
        initiateConfirmation(itemsToProcess, actionType);
    };

    const handleCloseManagement = () => {
        setManagementModalOpen(false); setManagementType(""); setSelectedReviewData(null); setModalError("");
    };

    const handleSaveEdit = async (formData) => {
        setModalError("");
        if (!selectedReviewData || !selectedReviewData.id) {
            setModalError("Invalid review data for edit."); return;
        }
        const url = `${API_BASE_URL}/reviews/${selectedReviewData.id}`;
        const dataToSend = { rating: formData.rating, review_text: formData.reviewText };
        setLoading(true);
        try {
            await makeAuthenticatedRequest('put', url, dataToSend);
            showNotification(`Review updated successfully!`, 'success');
            handleCloseManagement();
            fetchReviews();
        } catch (err) {
            const errorMessage = err.message.startsWith("Unauthenticated") ? `Unauthenticated.` : (err.response?.data?.message || `Failed to update review.`);
            setModalError(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    const handleConfirmAction = async (itemsToProcess) => {
        setModalError("");
        const actionVerb = managementType === 'archiveConfirm' ? 'archive' : 'restore';
        let successCount = 0;
        let lastError = null;
        setLoading(true);

        for (const item of itemsToProcess) {
            if (!item || !item.id) continue;
            try {
                if (managementType === 'archiveConfirm') {
                    await makeAuthenticatedRequest('delete', `${API_BASE_URL}/reviews/${item.id}`);
                } else if (managementType === 'restoreConfirm') {
                    await makeAuthenticatedRequest('put', `${API_BASE_URL}/reviews/${item.id}/restore`);
                }
                successCount++;
            } catch (err) {
                console.error(`Error ${actionVerb}ing review ${item.id}:`, err);
                lastError = err;
            }
        }
        setLoading(false);

        if (successCount > 0) {
            showNotification(`${successCount} review(s) ${actionVerb}d successfully!`, 'success');
        }
        if (lastError) {
            const errorMessage = lastError.message.startsWith("Unauthenticated") ? `Unauthenticated.` : (lastError.response?.data?.message || `Failed to ${actionVerb} some items.`);
            setModalError(errorMessage);
            if (successCount < itemsToProcess.length) showNotification(errorMessage, 'error');
        }

        handleCloseManagement();
        fetchReviews();
        setCheckedRows({});
        setIsSelectAll(false);
    };

    // --- Render ---
    return (
        <div className="reviews-container">
            <Notification message={notification.message} type={notification.type} />
            <h2 className="reviews-header">Customer Reviews</h2>

            <div className="table-container">
                {/* Header Actions */}
                <div className="table-header-actions">
                    <div className="search-bar">
                        <input
                            type="text" placeholder="Search..." className="search-input"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            onKeyDown={(e) => { if (e.key === 'Enter') { setCurrentPage(1); fetchReviews(); } }}
                        />
                    </div>
                    <div className="button-group" style={{ marginLeft: 'auto' }}>
                        {viewType === 'active' ? (
                            <button className="archive-button" onClick={handleBulkAction} disabled={checkedCount === 0 || loading}>
                                Delete
                            </button>
                        ) : (
                            <button className="restore-button" onClick={handleBulkAction} disabled={checkedCount === 0 || loading}>
                                Restore
                            </button>
                        )}
                    </div>
                    <div className="view-toggle">
                        <button className={`view-button ${viewType === "active" ? "active" : ""}`} onClick={() => {setViewType("active"); setCurrentPage(1); setSearchQuery('');}} disabled={loading}>Active Reviews</button>
                        <button className={`view-button ${viewType === "archived" ? "active" : ""}`} onClick={() => {setViewType("archived"); setCurrentPage(1); setSearchQuery('');}} disabled={loading}>Archived Reviews</button>
                    </div>
                </div>

                {/* Fetch Error Display */}
                {fetchError && <div className="error-message" style={{ color: 'red', margin: '10px 0', textAlign: 'center' }}>{fetchError}</div>}

                {/* Table */}
                <div className="table-responsive">
                    <table className="reviews-table">
                        <thead>
                            <tr className="table-header-row">
                                <th className="table-header checkbox-col"><input type="checkbox" className="review-checkbox" checked={isSelectAll} onChange={handleSelectAll} disabled={currentItems.length === 0 || loading} /></th>
                                <th className="table-header action-col">Action</th>
                                <th className="table-header product-col">Product</th>
                                <th className="table-header user-col">User</th>
                                <th className="table-header rating-col">Rating</th>
                                <th className="table-header review-text-col">Review</th>
                                <th className="table-header date-col">Created At</th>
                                <th className="table-header date-col">Updated At</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr><td colSpan="8" className="table-cell loading-cell" style={{textAlign: 'center', padding: '20px'}}><FaSpinner className="spinner" /> Loading...</td></tr>
                            ) : currentItems.length > 0 ? (
                                currentItems.map((item) => (
                                    <tr className="table-row" key={item.id}>
                                        <td className="table-cell checkbox-col"><input type="checkbox" className="review-checkbox" checked={!!checkedRows[item.id]} onChange={(e) => handleRowCheckbox(item.id, e)} disabled={loading} /></td>
                                        <td className="table-cell action-col">
                                            <div className="action-buttons">
                                                {viewType === 'active' ? (
                                                    <>
                                                        <FaEdit className="action-icon edit-icon" title="Edit Review" onClick={() => !loading && handleEdit(item)} />
                                                        <FaTrash className="action-icon archive-icon" title="Archive Review" onClick={() => !loading && initiateConfirmation([item], 'archiveConfirm')} />
                                                    </>
                                                ) : (
                                                    <FaUndo className="action-icon restore-icon" title="Restore Review" onClick={() => !loading && initiateConfirmation([item], 'restoreConfirm')} />
                                                )}
                                            </div>
                                        </td>
                                        <td className="table-cell product-col" title={item.productName}>{item.productName || 'N/A'}</td>
                                        <td className="table-cell user-col" title={item.userName}>{item.userName || 'N/A'}</td>
                                        <td className="table-cell rating-col">{item.rating !== null && item.rating !== undefined ? Number(item.rating).toFixed(1) : 'N/A'}</td>
                                        <td className="table-cell review-text-col" title={item.review_text}>
                                            <div className="review-text-content">{item.review_text || 'N/A'}</div>
                                        </td>
                                        <td className="table-cell date-col">
                                            {item.created_at ? (
                                                <div>
                                                    {moment(item.created_at).format('MMMM D, YYYY')}<br />
                                                    {moment(item.created_at).format('[at] hh:mm A')}
                                                </div>
                                            ) : 'N/A'}
                                        </td>
                                        <td className="table-cell date-col">
                                            {item.updated_at ? (
                                                <div>
                                                    {moment(item.updated_at).format('MMMM D, YYYY')}<br />
                                                    {moment(item.updated_at).format('[at] hh:mm A')}
                                                </div>
                                            ) : 'N/A'}
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr><td colSpan="8" className="table-cell no-data-cell" style={{textAlign: 'center', padding: '20px'}}>{searchQuery ? `No ${viewType} reviews match search.` : `No ${viewType} reviews.`}</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                {totalPages > 1 && !loading && (
                    <div className="table-pagination">
                        <button onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))} disabled={currentPage === 1 || loading} className="table-pagination-button">Previous</button>
                        <span className="page-info"> Page {currentPage} of {totalPages} </span>
                        <button onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))} disabled={currentPage === totalPages || loading} className="table-pagination-button">Next</button>
                    </div>
                )}
            </div>

            {/* Management Modal */}
            {managementModalOpen && (
                <ReviewManagement
                    type={managementType}
                    reviewData={managementType === 'edit' ? selectedReviewData : null}
                    selectedReviews={managementType.endsWith('Confirm') ? selectedReviewData : []}
                    onClose={handleCloseManagement}
                    onSave={handleSaveEdit}
                    onConfirm={handleConfirmAction}
                    externalError={modalError}
                    isSubmitting={loading}
                />
            )}
        </div>
    );
};

export default Reviews;