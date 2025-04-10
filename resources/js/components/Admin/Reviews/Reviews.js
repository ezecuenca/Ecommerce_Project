import React, { useState, useEffect, useRef, useCallback } from "react";
import { FaEdit, FaTrash, FaSearch, FaSpinner, FaUndo, FaArchive } from "react-icons/fa";
import Axios from 'axios';
import ReviewManagement from "./ReviewManagement";
import moment from 'moment';

const getCurrentUserId = () => {
    return 1;
};

const Notification = ({ message, type }) => {
    if (!message) return null;
    const baseStyle = { position: 'fixed', bottom: '20px', left: '50%', transform: 'translateX(-50%)', padding: '10px 20px', borderRadius: '5px', color: 'white', zIndex: 1000, boxShadow: '0 2px 10px rgba(0,0,0,0.2)', };
    const typeStyle = type === 'success' ? { backgroundColor: '#4CAF50' } : { backgroundColor: '#f44336' };
    return (<div style={{ ...baseStyle, ...typeStyle }}>{message}</div>);
};

const Reviews = () => {
    const [reviews, setReviews] = useState([]);
    const [loading, setLoading] = useState(true);
    const [fetchError, setFetchError] = useState(null);
    const [checkedRows, setCheckedRows] = useState({});
    const [isSelectAll, setIsSelectAll] = useState(false);
    const [managementModalOpen, setManagementModalOpen] = useState(false);
    const [managementType, setManagementType] = useState("");
    const [selectedReviewData, setSelectedReviewData] = useState(null);
    const [error, setError] = useState("");
    const [searchQuery, setSearchQuery] = useState('');
    const [viewType, setViewType] = useState("active");
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 5;
    const tableRef = useRef(null);
    const currentUserId = getCurrentUserId();

    const fetchReviews = useCallback(async () => {
        setLoading(true);
        setFetchError(null);
        setCheckedRows({});
        setIsSelectAll(false);
        try {
            const response = await Axios.get(`http://localhost:8000/api/reviews?status=${viewType}`);
            if (Array.isArray(response.data)) {
                 const formattedReviews = response.data.map(review => ({
                     ...review,
                     productName: review.product?.product_name || `Product ${review.product_id}`,
                     userName: review.profile?.name || `User ${review.profile_id}`,
                     isArchived: viewType === 'archived'
                 }));
                setReviews(formattedReviews);
            } else {
                console.error("Invalid API response format for reviews:", response.data);
                setFetchError("Failed to load reviews: Invalid format.");
                setReviews([]);
            }
        } catch (err) {
            console.error("Error fetching reviews:", err);
            setFetchError(`Failed to load reviews: ${err.response?.data?.message || err.message}`);
            setReviews([]);
        } finally {
            setLoading(false);
        }
    }, [viewType]);

    useEffect(() => {
        fetchReviews();
    }, [fetchReviews]);

    const filteredReviews = Array.isArray(reviews) ? reviews.filter(review =>
        (review.productName?.toLowerCase() || '').includes(searchQuery.toLowerCase()) ||
        (review.review_text?.toLowerCase() || '').includes(searchQuery.toLowerCase()) ||
        (review.userName?.toLowerCase() || '').includes(searchQuery.toLowerCase())
    ) : [];

    const totalPages = Math.ceil(filteredReviews.length / itemsPerPage);
    const currentItems = Array.isArray(filteredReviews) ? filteredReviews.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    ) : [];

     useEffect(() => {
        if (currentPage > totalPages && totalPages > 0) {
            setCurrentPage(totalPages);
        } else if (totalPages === 0 && filteredReviews.length === 0) {
             setCurrentPage(1);
        }
        setCheckedRows({});
        setIsSelectAll(false);
    }, [currentPage, totalPages, filteredReviews.length, viewType]);


    const handleSelectAll = (e) => {
        const isChecked = e.target.checked;
        setIsSelectAll(isChecked);
        const newCheckedRows = {};
        if (isChecked) {
            currentItems.forEach(item => { newCheckedRows[item.id] = true; });
        }
        setCheckedRows(newCheckedRows);
    };

    const handleRowCheckbox = (itemId, e) => {
        const isChecked = e.target.checked;
        setCheckedRows(prev => {
            const updated = { ...prev };
            if (isChecked) { updated[itemId] = true; }
             else { delete updated[itemId]; }
            const currentItemIds = currentItems.map(item => item.id);
            const allCurrentChecked = currentItemIds.length > 0 && currentItemIds.every(id => updated[id]);
            setIsSelectAll(allCurrentChecked);
            return updated;
        });
    };

    const getSelectedReviewIds = () => Object.keys(checkedRows).filter(id => checkedRows[id]).map(id => parseInt(id, 10));

    const handleEdit = (review) => {
         if (viewType === 'archived') {
             alert("Cannot edit archived reviews. Please restore first.");
             return;
         }
        setManagementType("edit"); setSelectedReviewData(review); setError(""); setManagementModalOpen(true);
    };

    const handleArchiveRequest = (reviewToArchive = null) => {
        let itemsToArchive;
        if (reviewToArchive) { itemsToArchive = [reviewToArchive]; }
         else {
            const selectedIds = getSelectedReviewIds();
            if (selectedIds.length === 0) { alert("Please select at least one review to archive."); return; }
            itemsToArchive = reviews.filter(r => selectedIds.includes(r.id));
            if (itemsToArchive.length < 1) { alert("No matching reviews found for archiving."); return; }
        }
        setManagementType("archive"); setSelectedReviewData(itemsToArchive); setError(""); setManagementModalOpen(true);
    };

     const handleRestoreRequest = (reviewToRestore = null) => {
        let itemsToRestore;
        if (reviewToRestore) { itemsToRestore = [reviewToRestore]; }
         else {
            const selectedIds = getSelectedReviewIds();
            if (selectedIds.length === 0) { alert("Please select at least one review to restore."); return; }
            itemsToRestore = reviews.filter(r => selectedIds.includes(r.id));
             if (itemsToRestore.length < 1) { alert("No matching reviews found for restoration."); return; }
        }
        setManagementType("restore"); setSelectedReviewData(itemsToRestore); setError(""); setManagementModalOpen(true);
    };

    const handleCloseManagement = () => {
        setManagementModalOpen(false); setManagementType(""); setSelectedReviewData(null); setError("");
    };

    const handleSaveEdit = async (formData) => {
        setError("");
        const url = `http://localhost:8000/api/reviews/${selectedReviewData.id}`;
        const dataToSend = { rating: formData.rating, review_text: formData.reviewText };

        try {
            await Axios.put(url, dataToSend);
            showNotification(`Review updated successfully!`, 'success');
            handleCloseManagement();
            fetchReviews();
        } catch (err) {
            console.error(`Error updating review:`, err);
            const errorMsg = `Failed to update review. ${err.response?.data?.message || err.message}`;
            if (err.response?.data?.errors) { setError(Object.values(err.response.data.errors).flat().join(' ')); }
             else { setError(errorMsg); }
        }
    };

     const handleConfirmArchiveOrRestore = async (itemsToProcess) => {
        setError("");
        const isArchiving = managementType === 'archive';
        const endpoint = isArchiving ? 'archive' : 'restore';
        const url = `http://localhost:8000/api/reviews/${endpoint}`;
        const idsToProcess = itemsToProcess.map(r => r.id);

        if (idsToProcess.length === 0) { handleCloseManagement(); return; }

        try {
            await Axios.put(url, { ids: idsToProcess });
            showNotification(`${idsToProcess.length} review(s) ${isArchiving ? 'archived' : 'restored'} successfully!`, 'success');
            handleCloseManagement();
            fetchReviews();
        } catch (err) {
            console.error(`Error ${isArchiving ? 'archiving' : 'restoring'} review(s):`, err);
            const errorMsg = `Failed to ${isArchiving ? 'archive' : 'restore'} review(s). ${err.response?.data?.message || err.message}`;
            setError(errorMsg);
        }
    };

     const notificationTimeoutRef = useRef(null);
     const [notification, setNotification] = useState({ message: '', type: '' });
     const showNotification = (message, type = 'success', duration = 3000) => {
        if (notificationTimeoutRef.current) clearTimeout(notificationTimeoutRef.current);
        setNotification({ message, type });
        notificationTimeoutRef.current = setTimeout(() => { setNotification({ message: '', type: '' }); notificationTimeoutRef.current = null; }, duration);
     };
     useEffect(() => { return () => { if (notificationTimeoutRef.current) clearTimeout(notificationTimeoutRef.current); }; }, []);


    const checkedCount = getSelectedReviewIds().length;

    return (
        <div className="reviews-container">
             <Notification message={notification.message} type={notification.type} />
            <h2 className="reviews-header">Customer Reviews</h2>

            <div className="table-container">
                <div className="table-header-actions">
                    <div className="search-bar">
                        <input type="text" placeholder="Search by Product, Review, User..." className="search-input" value={searchQuery} onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }} />
                    </div>
                    <div className="button-group" style={{ marginLeft: 'auto' }}>
                        {viewType === 'active' && (
                             <button className="delete-button" onClick={() => handleArchiveRequest()} disabled={checkedCount === 0}>
                                 <FaArchive style={{ marginRight: '5px'}} /> Archive Selected ({checkedCount})
                             </button>
                         )}
                         {viewType === 'archived' && (
                             <button className="restore-button" onClick={() => handleRestoreRequest()} disabled={checkedCount === 0}>
                                 <FaUndo style={{ marginRight: '5px'}} /> Restore Selected ({checkedCount})
                             </button>
                         )}
                    </div>
                     <div className="view-toggle">
                         <button className={`view-button ${viewType === "active" ? "active" : ""}`} onClick={() => setViewType("active")}>Active Reviews</button>
                         <button className={`view-button ${viewType === "archived" ? "active" : ""}`} onClick={() => setViewType("archived")}>Archived Reviews</button>
                     </div>
                </div>
                <table ref={tableRef} className="reviews-table">
                    <thead>
                        <tr className="table-header-row">
                            <th className="table-header checkbox-col"><input type="checkbox" className="review-checkbox" checked={isSelectAll} onChange={handleSelectAll} disabled={currentItems.length === 0}/></th>
                            <th className="table-header action-col">Action</th>
                            <th className="table-header">Product</th>
                             <th className="table-header">User</th>
                            <th className="table-header">Rating</th>
                            <th className="table-header">Review</th>
                            <th className="table-header">Created at</th>
                            <th className="table-header">Updated at</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                             <tr><td colSpan="8" className="table-cell loading-cell"><FaSpinner className="spinner" /> Loading Reviews...</td></tr>
                        ) : fetchError ? (
                             <tr><td colSpan="8" className="table-cell error-cell">{fetchError}</td></tr>
                        ) : currentItems.length > 0 ? (
                            currentItems.map((item) => (
                                <tr className="table-row" key={item.id}>
                                    <td className="table-cell checkbox-col"><input type="checkbox" className="review-checkbox" checked={!!checkedRows[item.id]} onChange={(e) => handleRowCheckbox(item.id, e)}/></td>
                                    <td className="table-cell action-col">
                                        <div className="action-buttons">
                                             {viewType === 'active' ? (
                                                 <>
                                                     <FaEdit className="edit-icon" title="Edit Review" onClick={() => handleEdit(item)} />
                                                     <FaArchive className="delete-icon" title="Archive Review" onClick={() => handleArchiveRequest(item)} />
                                                 </>
                                             ) : (
                                                  <FaUndo className="restore-icon" title="Restore Review" onClick={() => handleRestoreRequest(item)} />
                                             )}
                                        </div>
                                    </td>
                                    <td className="table-cell">{item.productName || 'N/A'}</td>
                                     <td className="table-cell">{item.userName || 'N/A'}</td>
                                    <td className="table-cell">{item.rating?.toFixed(1) || '0.0'}</td>
                                    <td className="table-cell review-text-cell">{item.review_text}</td>
                                    <td className="table-cell">{moment(item.created_at).format('MM/DD/YY hh:mm A')}</td>
                                    <td className="table-cell">{moment(item.updated_at).format('MM/DD/YY hh:mm A')}</td>
                                </tr>
                            ))
                        ) : (
                            <tr className="table-row"><td colSpan="8" className="table-cell no-data-cell">{searchQuery ? `No ${viewType} reviews match your search.` : `No ${viewType} reviews available.`}</td></tr>
                        )}
                    </tbody>
                </table>
                 {totalPages > 1 && (
                     <div className="table-pagination">
                         <button onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))} disabled={currentPage === 1} className="table-pagination-button">Previous</button>
                         {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (<button key={page} onClick={() => setCurrentPage(page)} className={currentPage === page ? "table-pagination-button active" : "table-pagination-button"}>{page}</button>))}
                         <button onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))} disabled={currentPage === totalPages} className="table-pagination-button">Next</button>
                     </div>
                 )}
            </div>

            {managementModalOpen && (
                <ReviewManagement
                    type={managementType}
                    reviewData={managementType === 'edit' ? selectedReviewData : null}
                    selectedReviews={managementType === 'archive' || managementType === 'restore' ? selectedReviewData : []}
                    existingProducts={[]} // Not needed now
                    onClose={handleCloseManagement}
                    onSave={handleSaveEdit}
                    onConfirm={handleConfirmArchiveOrRestore}
                    externalError={error}
                />
            )}
        </div>
    );
};

export default Reviews;