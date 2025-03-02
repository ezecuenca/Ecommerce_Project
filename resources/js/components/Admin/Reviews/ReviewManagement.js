import React, { useState, useEffect } from "react";

const ReviewManagement = ({ type, review, selectedReviews, productName, rating, reviewText, onClose, onConfirm, onSave }) => {
    const [localRating, setLocalRating] = useState(rating || 0);
    const [localReviewText, setLocalReviewText] = useState(reviewText || "");
    const [localProductName, setLocalProductName] = useState(productName || "");
    const [error, setError] = useState("");

    // Initialize state with review data for edit or add
    useEffect(() => {
        if (type === "edit" && review) {
            setLocalRating(review.rating || 0);
            setLocalReviewText(review.review || "");
            setLocalProductName(review.productName || "");
            console.log("Initializing edit for review:", review);
        } else if (type === "add") {
            setLocalRating(0);
            setLocalReviewText("");
            setLocalProductName("");
            console.log("Initializing add for new review");
        }
    }, [type, review]);

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
            setLocalRating("");
            setError("");
            return;
        }
        const numValue = parseFloat(value);
        if (validateRating(numValue)) {
            setLocalRating(numValue);
            setError("");
        } else {
            setError("Rating must be a whole number or half number (e.g., 0.0, 0.5, 1.0, ..., 5.0).");
        }
    };

    const handleReviewChange = (e) => {
        const value = e.target.value;
        console.log("Review input changed to:", value);
        setLocalReviewText(value);
    };

    const handleProductNameChange = (e) => {
        const value = e.target.value;
        console.log("Product name input changed to:", value);
        setLocalProductName(value);
    };

    const handleSave = () => {
        if (type === "edit") {
            if (!review) {
                alert("No review selected for editing.");
                return;
            }

            if (!validateRating(localRating)) {
                setError("Rating must be a whole number or half number (e.g., 0.0, 0.5, 1.0, ..., 5.0).");
                return;
            }

            if (localReviewText.length > 1000) {
                setError("Review text is too long (max 1000 characters).");
                return;
            }

            if (!localProductName.trim()) {
                setError("Product name is required.");
                return;
            }

            setError("");
            const updatedReview = { 
                productName: localProductName.trim(), 
                rating: parseFloat(localRating), 
                review: localReviewText, 
                updatedAt: new Date().toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: '2-digit' }),
                isArchived: false,
                createdAt: review.createdAt // Preserve the original createdAt for edits
            };
            console.log("Saving updated review:", updatedReview);
            onSave(updatedReview);
            onClose();
        } else if (type === "add") {
            if (!localProductName.trim()) {
                setError("Product name is required.");
                return;
            }

            if (!validateRating(localRating)) {
                setError("Rating must be a whole number or half number (e.g., 0.0, 0.5, 1.0, ..., 5.0).");
                return;
            }

            if (localReviewText.length > 1000) {
                setError("Review text is too long (max 1000 characters).");
                return;
            }

            setError("");
            const newReview = {
                productName: localProductName.trim(),
                rating: parseFloat(localRating),
                review: localReviewText,
                createdAt: new Date().toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: '2-digit' }),
                updatedAt: new Date().toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: '2-digit' }),
                isArchived: false
            };
            console.log("Saving new review:", newReview);
            onSave(newReview); // Pass the new review object directly to onSave
            onClose();
        }
    };

    const handleConfirm = () => {
        if (type === "delete") {
            if (!selectedReviews || selectedReviews.length === 0) {
                alert("Please select at least one review to delete.");
                return;
            }
            onConfirm(selectedReviews);
            onClose();
        } else if (type === "restore") {
            if (!selectedReviews || selectedReviews.length === 0) {
                alert("Please select at least one review to restore.");
                return;
            }
            onConfirm(selectedReviews);
            onClose();
        }
    };

    const handleCancel = () => {
        if (type === "edit" || type === "add") {
            console.log(`Canceling ${type} for review:`, review || "new review");
        } else if (type === "delete" || type === "restore") {
            console.log(`Canceling ${type} for selected reviews:`, selectedReviews);
        }
        onClose();
    };

    if (type === "edit" || type === "add") {
        const title = type === "edit" ? `Edit Review for ${review?.productName}` : "Add New Review";
        return (
            <div className="edit-modal-overlay" onClick={handleCancel}>
                <div className="edit-modal" onClick={e => e.stopPropagation()}>
                    <h3 className="edit-modal-header">{title}</h3>
                    {error && <p className="error-message">{error}</p>}
                    <div className="edit-form">
                        <label className="edit-form-label">Product Name:</label>
                        <input
                            type="text"
                            value={localProductName}
                            onChange={handleProductNameChange}
                            className="review-input"
                            placeholder="Enter product name"
                            style={{ cursor: "text", pointerEvents: "auto", userSelect: "text" }}
                        />
                        <label className="edit-form-label">Rating (0.0–5.0, half steps only):</label>
                        <input
                            type="number"
                            step="0.5"
                            value={localRating === "" ? "" : localRating}
                            onChange={handleRatingChange}
                            className="rating-input"
                            placeholder="Enter rating (e.g., 0.0, 0.5, 1.0, ..., 5.0)"
                            min="0"
                            max="5"
                            style={{ cursor: "text", pointerEvents: "auto", userSelect: "text" }}
                        />
                        <label className="edit-form-label">Review:</label>
                        <textarea
                            value={localReviewText}
                            onChange={handleReviewChange}
                            className="review-input"
                            placeholder="Enter review text"
                            style={{ cursor: "text", pointerEvents: "auto", userSelect: "text" }}
                        />
                        <div className="button-group">
                            <button className="save-button" onClick={handleSave}>Save</button>
                            <button className="cancel-button" onClick={handleCancel}>Cancel</button>
                        </div>
                    </div>
                </div>
            </div>
        );
    } else if (type === "delete" || type === "restore") {
        const title = type === "delete" ? "Confirm Delete" : "Confirm Restore";
        const message = type === "delete" 
            ? `Are you sure you want to delete ${Array.isArray(selectedReviews) ? selectedReviews.length : 1} review(s)?`
            : `Are you sure you want to restore ${selectedReviews.length} review(s)?`;

        return (
            <div className={`${type}-modal-overlay`} onClick={handleCancel} style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                <div className={`${type}-modal`} onClick={e => e.stopPropagation()} style={{ position: 'relative', margin: 'auto' }}>
                    <h3>{title}</h3>
                    <p>{message}</p>
                    <div className="button-group">
                        <button className="save-button" onClick={handleConfirm}>
                            {type === "delete" ? "Delete" : "Restore"}
                        </button>
                        <button className="cancel-button" onClick={handleCancel}>Cancel</button>
                    </div>
                </div>
            </div>
        );
    }

    return null;
};

export default ReviewManagement;