// src/components/Admin/ReviewManagement.js (or appropriate path)

import React, { useState, useEffect } from "react";
import { FaSpinner } from "react-icons/fa";

const ReviewManagement = ({
    type, 
    reviewData, 
    selectedReviews = [], 
    onClose,
    onSave, 
    onConfirm, 
    externalError,
    isSubmitting: parentIsSubmitting 
}) => {
    const [localRating, setLocalRating] = useState(0);
    const [localReviewText, setLocalReviewText] = useState("");
    const [internalError, setInternalError] = useState("");

   
    const productNameForDisplay = (type === "edit" && reviewData)
        ? (reviewData.productName || 'Product N/A') 
        : 'Product';

    useEffect(() => {
        if (externalError) { setInternalError(externalError); }
        else { setInternalError(""); }
    }, [externalError, type]);

    useEffect(() => {
        if (type === "edit" && reviewData) {
            setLocalRating(reviewData.rating !== null && reviewData.rating !== undefined ? reviewData.rating : 0);
            setLocalReviewText(reviewData.review_text || "");
            if (!externalError) setInternalError("");
        } else {
            setLocalRating(0);
            setLocalReviewText("");
            if (!externalError && (type === "archiveConfirm" || type === "restoreConfirm")) {
                 setInternalError("");
            }
        }
    }, [type, reviewData, externalError]);

    const validateRating = (value) => {
        const numValue = parseFloat(value);
        if (isNaN(numValue) || value === null || value === undefined || String(value).trim() === '') return false;
        if (numValue < 0 || numValue > 5) return false;
        const decimalPart = Math.abs(numValue % 1);
        return decimalPart === 0 || decimalPart === 0.5;
    };

    const handleRatingChange = (e) => {
        setLocalRating(e.target.value);
        if (internalError.includes("Rating")) setInternalError("");
    };

    const handleReviewChange = (e) => {
        const value = e.target.value;
        setLocalReviewText(value);
        if (value.length <= 1000) {
            if (internalError.includes("Review text cannot exceed")) setInternalError("");
        } else { setInternalError("Review text cannot exceed 1000 characters."); }
        if (internalError.includes("Review text cannot be empty") && value.trim()) setInternalError("");
    };

    const handleInternalSave = () => {
        setInternalError("");
        let currentError = "";
        if (!validateRating(localRating)) { currentError += "Rating must be 0.0-5.0 in 0.5 increments. "; }
        if (!localReviewText.trim()) { currentError += "Review text cannot be empty. "; }
        else if (localReviewText.length > 1000) { currentError += "Review text > 1000 characters. "; }

        if (currentError) { setInternalError(currentError.trim()); return; }
        if (onSave) onSave({ rating: parseFloat(localRating), reviewText: localReviewText.trim() });
    };

    const handleInternalConfirm = () => { 
        if (onConfirm && Array.isArray(selectedReviews) && selectedReviews.length > 0) {
            onConfirm(selectedReviews);
        } else { setInternalError("Cannot confirm action: Invalid selection or handler missing."); }
    };

    if (type === "edit") {
        const title = `Edit Review for ${productNameForDisplay}`;
        return (
            <div className="edit-modal-overlay" onClick={parentIsSubmitting ? undefined : onClose}>
                <div className="edit-modal" onClick={e => e.stopPropagation()}>
                    <h3 className="edit-modal-header">{title}</h3>
                    {internalError && <p className="error-message modal-error" style={{color: 'red', textAlign: 'center', marginBottom: '10px'}}>{internalError}</p>}
                    <div className="edit-form">
                         <div className="form-group">
                            <label className="edit-form-label">Product:</label>
                            <input type="text" value={productNameForDisplay} className="review-input" readOnly disabled/>
                         </div>
                         <div className="form-group">
                             <label className="edit-form-label">Rating (0.0–5.0):</label>
                             <input type="number" step="0.5" min="0" max="5" value={localRating} onChange={handleRatingChange} className="review-input" placeholder="e.g., 4.5" disabled={parentIsSubmitting}/>
                         </div>
                         <div className="form-group">
                            <label className="edit-form-label">Review:</label>
                            <textarea value={localReviewText} onChange={handleReviewChange} className="review-input" placeholder="Enter review text" rows="4" maxLength="1000" disabled={parentIsSubmitting}/>
                         </div>
                         <div className="button-group modal-actions">
                            <button className="save-button" onClick={handleInternalSave} disabled={parentIsSubmitting}>
                                {parentIsSubmitting ? <FaSpinner className="spinner-btn"/> : 'Save Changes'}
                            </button>
                            <button className="cancel-button" onClick={onClose} disabled={parentIsSubmitting}>Cancel</button>
                         </div>
                    </div>
                </div>
            </div>
        );
    } else if (type === "archiveConfirm" || type === "restoreConfirm") {
        const itemsArray = Array.isArray(selectedReviews) ? selectedReviews : [];
        const count = itemsArray.length;
        const actionVerb = type === 'archiveConfirm' ? 'archive' : 'restore';
        const title = `Confirm ${actionVerb.charAt(0).toUpperCase() + actionVerb.slice(1)}`;
        const message = `Are you sure you want to ${actionVerb} ${count} review(s)?`;

        return (
            <div className="modal-overlay confirm-modal-overlay" onClick={parentIsSubmitting ? undefined : onClose}>
                <div className="modal-content confirm-modal" onClick={e => e.stopPropagation()}>
                    <h3 className="modal-header">{title}</h3>
                    {internalError && <p className="error-message modal-error" style={{color: 'red', textAlign: 'center', marginBottom: '10px'}}>{internalError}</p>}
                    <p>{message}</p>
            
                    <div className="button-group modal-actions">
                        <button
                            className={`save-button ${actionVerb}-button`}
                            onClick={handleInternalConfirm}
                            disabled={parentIsSubmitting || count === 0}
                        >
                            {parentIsSubmitting ? <FaSpinner className="spinner-btn"/> : actionVerb.charAt(0).toUpperCase() + actionVerb.slice(1)}
                        </button>
                        <button className="cancel-button" onClick={onClose} disabled={parentIsSubmitting}>Cancel</button>
                    </div>
                </div>
            </div>
        );
    }
    return null; 
};

export default ReviewManagement;