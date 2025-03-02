import React, { useState, useEffect, useRef } from "react"; // Already using useRef
import { FaEdit, FaTrash, FaUndo } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import ReviewManagement from "./ReviewManagement"; // Import the updated component

const Reviews = () => {
    const [activeCheckedRows, setActiveCheckedRows] = useState({}); // Separate state for active table checkboxes, initialized empty
    const [activeIsSelectAll, setActiveIsSelectAll] = useState(false); // Separate state for active table "Select All"
    const [archivedCheckedRows, setArchivedCheckedRows] = useState({}); // Separate state for archived table checkboxes, initialized empty
    const [archivedIsSelectAll, setArchivedIsSelectAll] = useState(false); // Separate state for archived table "Select All"
    const [viewType, setViewType] = useState("active"); // "active" or "archived"
    const [managementModalOpen, setManagementModalOpen] = useState(false); // State for the management modal (edit, delete, restore, or add)
    const [managementType, setManagementType] = useState(""); // "edit", "delete", "restore", or "add"
    const [selectedReview, setSelectedReview] = useState(null); // State for the review being edited, deleted, restored, or added
    const [rating, setRating] = useState(0); // Local state for rating (used in save/add)
    const [reviewText, setReviewText] = useState(""); // Local state for review text (used in save/add)
    const [productName, setProductName] = useState(""); // New state for product name (used in add)
    const [error, setError] = useState(""); // State for validation errors
    const [forceUpdate, setForceUpdate] = useState(0); // New state for forcing re-render

    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 5;

    // Static initial data for reviews as of February 28, 2025 (now mutable state)
    const [initialReviews, setInitialReviews] = useState([
        { productName: "Product Name 1", rating: 5.0, review: "Product Review 1", createdAt: "11/21/24", updatedAt: "02/28/25", isArchived: false },
        { productName: "Product Name 2", rating: 5.0, review: "Product Review 2", createdAt: "11/21/24", updatedAt: "02/28/25", isArchived: false },
        { productName: "Product Name 3", rating: 4.5, review: "Product Review 3", createdAt: "11/21/24", updatedAt: "02/28/25", isArchived: false },
        { productName: "Product Name 4", rating: 2.0, review: "Product Review 4", createdAt: "11/21/24", updatedAt: "02/28/25", isArchived: false },
        { productName: "Product Name 5", rating: 1.0, review: "Product Review 5", createdAt: "11/21/24", updatedAt: "02/28/25", isArchived: false },
        { productName: "Product Name 6", rating: 3.0, review: "Product Review 6", createdAt: "11/21/24", updatedAt: "02/28/25", isArchived: false },
        { productName: "Product Name 7", rating: 4.0, review: "Product Review 7", createdAt: "11/21/24", updatedAt: "02/28/25", isArchived: false },
        { productName: "Product Name 8", rating: 0.0, review: "Product Review 8", createdAt: "11/21/24", updatedAt: "02/28/25", isArchived: false },
    ]);

    // State to manage all reviews with isArchived flag (sync with initialReviews)
    const [reviews, setReviews] = useState(initialReviews);

    const navigate = useNavigate();

    // Ref to store the table element for DOM manipulation
    const tableRef = useRef(null);

    // Use static data only, load from localStorage if available, sync reviews with initialReviews on mount, and set all reviews as active
    useEffect(() => {
        const savedReviews = localStorage.getItem("reviews");
        if (savedReviews) {
            const parsedReviews = JSON.parse(savedReviews);
            // Set all reviews to isArchived: false on load
            const activeReviews = parsedReviews.map(review => ({
                ...review,
                isArchived: false,
                updatedAt: new Date().toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: '2-digit' })
            }));
            setInitialReviews(activeReviews);
            setReviews(activeReviews);
            console.log("Loaded and activated reviews from localStorage:", activeReviews);
        } else {
            console.log("Using static reviews data as of February 28, 2025, all set as active:", initialReviews);
            setInitialReviews(initialReviews);
            setReviews(initialReviews);
            localStorage.setItem("reviews", JSON.stringify(initialReviews));
        }
        setActiveCheckedRows({}); // Ensure active checkboxes start empty
        setActiveIsSelectAll(false); // Ensure active "Select All" starts unchecked
        setArchivedCheckedRows({}); // Ensure archived checkboxes start empty
        setArchivedIsSelectAll(false); // Ensure archived "Select All" starts unchecked
    }, []);

    const getCurrentData = () => {
        return reviews.filter(review => review.isArchived === (viewType === "archived"));
    };

    const currentData = getCurrentData();
    const totalPages = Math.ceil(currentData.length / itemsPerPage);
    const currentItems = currentData.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    );

    const handleSelectAll = (e) => {
        const isChecked = e.target.checked;
        if (viewType === "active") {
            setActiveIsSelectAll(isChecked);
            const newCheckedRows = {};
            if (isChecked) {
                currentItems.forEach((_, index) => {
                    newCheckedRows[index] = true;
                });
                // Use ref to target only active table checkboxes
                if (tableRef.current) {
                    tableRef.current.querySelectorAll('.review-checkbox').forEach(checkbox => checkbox.checked = true);
                }
            } else {
                // Use ref to target only active table checkboxes
                if (tableRef.current) {
                    tableRef.current.querySelectorAll('.review-checkbox').forEach(checkbox => checkbox.checked = false);
                }
            }
            setActiveCheckedRows(newCheckedRows);
            console.log("Active checked rows updated (static data):", newCheckedRows);
        } else if (viewType === "archived") {
            setArchivedIsSelectAll(isChecked);
            const newCheckedRows = {};
            if (isChecked) {
                currentItems.forEach((_, index) => {
                    newCheckedRows[index] = true;
                });
                // Use ref to target only archived table checkboxes
                if (tableRef.current) {
                    tableRef.current.querySelectorAll('.review-checkbox').forEach(checkbox => checkbox.checked = true);
                }
            } else {
                // Use ref to target only archived table checkboxes
                if (tableRef.current) {
                    tableRef.current.querySelectorAll('.review-checkbox').forEach(checkbox => checkbox.checked = false);
                }
            }
            setArchivedCheckedRows(newCheckedRows);
            console.log("Archived checked rows updated (static data):", newCheckedRows);
        }
    };

    const handleRowCheckbox = (index, e) => {
        const isChecked = e.target.checked;
        if (viewType === "active") {
            setActiveCheckedRows((prev) => ({
                ...prev,
                [index]: isChecked,
            }));
            const allChecked = currentItems.length === 
                (tableRef.current ? Array.from(tableRef.current.querySelectorAll('.review-checkbox')).filter(cb => cb.checked).length : 0);
            setActiveIsSelectAll(allChecked);
            console.log("Active row checkbox updated (static data), index:", index, "Checked:", isChecked);
        } else if (viewType === "archived") {
            setArchivedCheckedRows((prev) => ({
                ...prev,
                [index]: isChecked,
            }));
            const allChecked = currentItems.length === 
                (tableRef.current ? Array.from(tableRef.current.querySelectorAll('.review-checkbox')).filter(cb => cb.checked).length : 0);
            setArchivedIsSelectAll(allChecked);
            console.log("Archived row checkbox updated (static data), index:", index, "Checked:", isChecked);
        }
    };

    const handleDelete = (reviewToDelete = null) => {
        const selectedIndices = viewType === "active" ? Object.keys(activeCheckedRows)
            .filter(index => activeCheckedRows[index])
            .map(index => parseInt(index, 10)) : [];

        if (reviewToDelete) {
            // Individual delete via icon
            if (viewType !== "active") {
                alert("You can only delete from Active Reviews.");
                return;
            }
            setManagementType("delete");
            setSelectedReview([reviewToDelete]); // Wrap in array for consistency with bulk delete in ReviewManagement
            setManagementModalOpen(true);
            return;
        }

        // Bulk delete via button
        const selectedCount = selectedIndices.length;
        if (selectedCount < 2) { // Require at least 2 manually checked items
            return; // Do nothing, button is disabled unless 2 or more are selected
        }

        if (viewType !== "active") {
            alert("You can only delete from Active Reviews.");
            return;
        }

        setManagementType("delete");
        setSelectedReview(getSelectedReviews()); // Use getSelectedReviews for bulk delete
        setManagementModalOpen(true);
    };

    const handleRestore = (reviewToRestore = null) => {
        const selectedIndices = viewType === "archived" ? Object.keys(archivedCheckedRows)
            .filter(index => archivedCheckedRows[index])
            .map(index => parseInt(index, 10)) : [];

        if (reviewToRestore) {
            // Individual restore via icon
            if (viewType !== "archived") {
                alert("You can only restore from Archived Reviews.");
                return;
            }
            setManagementType("restore");
            setSelectedReview([reviewToRestore]); // Wrap in array for consistency with bulk restore in ReviewManagement
            setManagementModalOpen(true);
            return;
        }

        // Bulk restore via button (including Select All or manual selection)
        const selectedCount = selectedIndices.length;
        if (selectedCount < 2) { // Require at least 2 manually checked items
            return; // Do nothing, button is disabled unless 2 or more are selected
        }

        if (viewType !== "archived") {
            alert("You can only restore from Archived Reviews.");
            return;
        }

        setManagementType("restore");
        setSelectedReview(getSelectedReviews()); // Use getSelectedReviews for bulk restore
        setManagementModalOpen(true);
    };

    const handleAdd = () => {
        if (viewType !== "active") {
            alert("You can only add reviews to Active Reviews.");
            return;
        }
        setManagementType("add");
        setProductName(""); // Reset product name for new review
        setRating(0); // Reset rating for new review
        setReviewText(""); // Reset review text for new review
        setSelectedReview(null); // Clear any selected review
        setManagementModalOpen(true);
    };

    const handleEdit = (review) => {
        setSelectedReview(review);
        setRating(review.rating || 0);
        setReviewText(review.review || "");
        setProductName(review.productName || ""); // Set product name for editing
        setManagementType("edit");
        setManagementModalOpen(true);
        console.log("Opening edit for review:", review);
    };

    const validateRating = (value) => {
        const numValue = parseFloat(value) || 0;
        if (isNaN(numValue)) return false;
        if (numValue < 0 || numValue > 5) return false;
        const decimalPart = numValue % 1;
        return decimalPart === 0 || decimalPart === 0.5;
    };

    const handleRatingChange = (e) => {
        const value = e.target.value;
        console.log("Rating input changed to:", value);
        if (value === "") {
            setRating("");
            setError("");
            return;
        }
        const numValue = parseFloat(value);
        if (validateRating(numValue)) {
            setRating(numValue);
            setError("");
        } else {
            setError("Rating must be a whole number or half number (e.g., 0.0, 0.5, 1.0, ..., 5.0).");
        }
    };

    const handleReviewChange = (e) => {
        const value = e.target.value;
        console.log("Review input changed to:", value);
        setReviewText(value);
    };

    const handleProductNameChange = (e) => {
        const value = e.target.value;
        console.log("Product name input changed to:", value);
        setProductName(value);
    };

    const handleSaveEditOrAdd = (newOrUpdatedReview) => {
        if (managementType === "edit") {
            if (!selectedReview) {
                alert("No review selected for editing.");
                return;
            }

            if (!validateRating(rating)) {
                setError("Rating must be a whole number or half number (e.g., 0.0, 0.5, 1.0, ..., 5.0).");
                return;
            }

            if (reviewText.length > 1000) {
                setError("Review text is too long (max 1000 characters).");
                return;
            }

            if (!productName.trim()) {
                setError("Product name is required.");
                return;
            }

            setError("");
            const updatedReviews = initialReviews.map(item =>
                item.productName === selectedReview.productName ? { ...newOrUpdatedReview, productName: productName.trim(), rating: parseFloat(rating), review: reviewText, updatedAt: new Date().toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: '2-digit' }), isArchived: false, createdAt: item.createdAt } : item
            );
            setInitialReviews(updatedReviews); // Update static initialReviews
            setReviews(updatedReviews); // Sync reviews state with initialReviews
            setManagementModalOpen(false);
            setSelectedReview(null);
            setRating(0);
            setReviewText("");
            setProductName("");
            localStorage.setItem("reviews", JSON.stringify(updatedReviews));
            console.log("Edited reviews (static data), updated reviews:", updatedReviews);
            // Force re-render to update the table with the edited review
            setForceUpdate(prev => prev + 1); // Increment forceUpdate to trigger re-render
        } else if (managementType === "add") {
            if (!productName.trim()) {
                setError("Product name is required.");
                return;
            }

            if (!validateRating(rating)) {
                setError("Rating must be a whole number or half number (e.g., 0.0, 0.5, 1.0, ..., 5.0).");
                return;
            }

            if (reviewText.length > 1000) {
                setError("Review text is too long (max 1000 characters).");
                return;
            }

            setError("");
            const newReview = {
                productName: productName.trim(),
                rating: parseFloat(rating),
                review: reviewText,
                createdAt: new Date().toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: '2-digit' }),
                updatedAt: new Date().toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: '2-digit' }),
                isArchived: false
            };
            const updatedReviews = [newReview, ...initialReviews.filter(r => !r.isArchived)]; // Add to static initialReviews, preserving existing active reviews
            setInitialReviews(updatedReviews); // Update static initialReviews
            setReviews(updatedReviews); // Sync reviews state with initialReviews
            setManagementModalOpen(false);
            setProductName("");
            setRating(0);
            setReviewText("");
            localStorage.setItem("reviews", JSON.stringify(updatedReviews));
            console.log("Added new review (static data), updated reviews:", updatedReviews);
            // Force re-render to update the table with the new review
            setForceUpdate(prev => prev + 1); // Increment forceUpdate to trigger re-render
            setCurrentPage(1); // Reset to page 1 to show the new review at the top
        }
    };

    const handleConfirmDeleteOrRestore = (items) => {
        if (managementType === "delete") {
            const updatedReviews = initialReviews.map(review => {
                if (Array.isArray(items)) {
                    // Bulk or individual delete (items is an array)
                    if (items.some(item => item.productName === review.productName)) {
                        return { ...review, isArchived: true, updatedAt: new Date().toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: '2-digit' }) };
                    }
                } else {
                    // Handle individual delete (items is a single review object, though not expected here)
                    if (items.productName === review.productName) {
                        return { ...review, isArchived: true, updatedAt: new Date().toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: '2-digit' }) };
                    }
                }
                return review;
            });
            setInitialReviews(updatedReviews); // Update static initialReviews
            setReviews(updatedReviews); // Sync reviews state with initialReviews
            // Reset active table checkboxes after deletion
            setActiveCheckedRows({});
            setActiveIsSelectAll(false);
            // Use ref to target only active table checkboxes
            if (tableRef.current && viewType === "active") {
                tableRef.current.querySelectorAll('.review-checkbox').forEach(checkbox => checkbox.checked = false);
            }
            setManagementModalOpen(false);
            if (currentData.length === 0) {
                setCurrentPage(1);
            }
            console.log("Deleted reviews (static data), updated reviews:", updatedReviews);
            setForceUpdate(prev => prev + 1); // Force re-render after deletion
        } else if (managementType === "restore") {
            const updatedReviews = initialReviews.map(review => {
                if (Array.isArray(items)) {
                    // Bulk restore
                    if (items.some(item => item.productName === review.productName)) {
                        return { ...review, isArchived: false, updatedAt: new Date().toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: '2-digit' }) };
                    }
                } else {
                    // Individual restore (items is a single review object)
                    if (items.productName === review.productName) {
                        return { ...review, isArchived: false, updatedAt: new Date().toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: '2-digit' }) };
                    }
                }
                return review;
            });
            setInitialReviews(updatedReviews); // Update static initialReviews
            setReviews(updatedReviews); // Sync reviews state with initialReviews
            // Reset archived table checkboxes after restoration
            setArchivedCheckedRows({});
            setArchivedIsSelectAll(false);
            // Use ref to target only archived table checkboxes
            if (tableRef.current && viewType === "archived") {
                tableRef.current.querySelectorAll('.review-checkbox').forEach(checkbox => checkbox.checked = false);
            }
            setManagementModalOpen(false);
            if (currentData.length === 0) {
                setCurrentPage(1);
            }
            console.log("Restored reviews (static data), updated reviews:", updatedReviews);
            setForceUpdate(prev => prev + 1); // Force re-render after restoration
        }

        localStorage.setItem("reviews", JSON.stringify(initialReviews)); // Persist updated static data
    };

    const handleCloseManagement = () => {
        setManagementModalOpen(false);
        setManagementType("");
        setSelectedReview(null);
        setRating(0);
        setReviewText("");
        setProductName("");
        setError("");
        console.log("Closed management modal");
    };

    // Get selected reviews for delete or restore confirmation
    const getSelectedReviews = () => {
        const selectedIndices = viewType === "active" ? Object.keys(activeCheckedRows)
            .filter(index => activeCheckedRows[index])
            .map(index => parseInt(index, 10)) : Object.keys(archivedCheckedRows)
            .filter(index => archivedCheckedRows[index])
            .map(index => parseInt(index, 10));
        return selectedIndices.map(index => currentItems[index]);
    };

    // Get the appropriate isSelectAll and checked count state based on viewType
    const isSelectAll = viewType === "active" ? activeIsSelectAll : archivedIsSelectAll;
    const checkedCount = viewType === "active" ? Object.keys(activeCheckedRows).filter(index => activeCheckedRows[index]).length : Object.keys(archivedCheckedRows).filter(index => archivedCheckedRows[index]).length;

    return (
        <div className="reviews-container">
            <h2 className="reviews-header">{viewType === "active" ? "Customer Reviews" : "Archived Reviews"}</h2> {/* Breadcrumbs-like header, renamed for consistency */}

            <div className="table-container">
                <div className="table-header-actions">
                    <div className="search-bar">
                        <input
                            type="text"
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
                                    disabled={checkedCount < 2} // Disable unless 2 or more items are checked
                                >
                                    Delete
                                </button>
                            </>
                        )}
                        {viewType === "archived" && (
                            <button 
                                className="restore-button" 
                                onClick={() => handleRestore()}
                                disabled={checkedCount < 2} // Disable unless 2 or more items are checked
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
                            Active Reviews
                        </button>
                        <button
                            className={`view-button ${viewType === "archived" ? "active" : ""}`}
                            onClick={() => setViewType("archived")}
                        >
                            Archived Reviews
                        </button>
                    </div>
                </div>
                <table ref={tableRef} className={`reviews-table ${viewType === "archived" ? 'view-type="archived"' : 'view-type="active"'}`}>
                    <thead>
                        <tr className="table-header-row">
                            <th className="table-header">
                                <input type="checkbox" className="review-checkbox" checked={isSelectAll} onChange={handleSelectAll} />
                            </th>
                            <th className="table-header reviews-action-column">Action</th>
                            <th className="table-header">Product Name</th>
                            <th className="table-header">Rating</th>
                            <th className="table-header">Review</th>
                            <th className="table-header">Created at</th>
                            <th className="table-header">Updated at</th>
                        </tr>
                    </thead>
                    <tbody>
                        {currentItems.length > 0 ? (
                            currentItems.map((item, index) => (
                                <tr className={`table-row ${viewType === "archived" ? 'view-type="archived"' : ''}`} key={item.productName + index + forceUpdate}> {/* Use forceUpdate in key for re-render */}
                                    <td className="table-cell">
                                        <input type="checkbox" className="review-checkbox" onChange={(e) => handleRowCheckbox((currentPage - 1) * itemsPerPage + index, e)} />
                                    </td>
                                    <td className="table-cell reviews-action-column">
                                        <div className="action-buttons">
                                            {viewType === "active" ? (
                                                <>
                                                    <FaEdit className="edit-icon" size={20} onClick={() => handleEdit(item)} />
                                                    <FaTrash className="delete-icon" size={20} onClick={() => handleDelete(item)} />
                                                </>
                                            ) : (
                                                <>
                                                    <FaUndo className="restore-icon" size={20} onClick={() => handleRestore(item)} />
                                                    <button className="restore-button" onClick={() => handleRestore()}></button> {/* Removed "Restore" text, kept button for bulk action */}
                                                </>
                                            )}
                                        </div>
                                    </td>
                                    <td className="table-cell">{item.productName}</td>
                                    <td className="table-cell">{item.rating}</td>
                                    <td className="table-cell">{item.review}</td>
                                    <td className="table-cell">{item.createdAt}</td>
                                    <td className="table-cell">{item.updatedAt}</td>
                                </tr>
                            ))
                        ) : (
                            <tr className="table-row">
                                <td colSpan="7" className="table-cell" style={{ textAlign: "center", padding: "20px", backgroundColor: "#f9f9f9" }}>
                                    {viewType === "active" ? "No reviews available." : "No archived reviews available."}
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
                <ReviewManagement
                    type={managementType}
                    review={managementType === "edit" || managementType === "add" ? selectedReview : (managementType === "restore" && !Array.isArray(selectedReview) ? selectedReview : null)}
                    selectedReviews={managementType === "delete" || (managementType === "restore" && Array.isArray(selectedReview)) ? (selectedReview || getSelectedReviews()) : []}
                    productName={productName} // Pass product name for add/edit
                    rating={rating} // Pass rating for add/edit
                    reviewText={reviewText} // Pass review text for add/edit
                    onClose={handleCloseManagement}
                    onConfirm={handleConfirmDeleteOrRestore}
                    onSave={handleSaveEditOrAdd} // Use updated handler for both edit and add
                />
            )}
        </div>
    );
};

export default Reviews;