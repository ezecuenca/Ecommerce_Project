import React, { useState, useEffect } from "react";

const ReviewManagement = ({ type, reviewData, existingProducts = [], onClose, onSave, onConfirmDelete, externalError }) => {
    const [localRating, setLocalRating] = useState(0);
    const [localReviewText, setLocalReviewText] = useState("");
    const [localProductId, setLocalProductId] = useState('');
    const [error, setError] = useState("");

     const uniqueProducts = Array.isArray(existingProducts) ? Array.from(new Map(existingProducts.map(item => [item.id, item])).values()) : [];


    useEffect(() => {
        setError(externalError || "");
    }, [externalError]);

    useEffect(() => {
        if (type === "edit" && reviewData) {
            setLocalRating(reviewData.rating || 0);
            setLocalReviewText(reviewData.review_text || "");
            setLocalProductId(reviewData.product_id || '');
            setError("");
        } else if (type === "add") {
            setLocalRating(0);
            setLocalReviewText("");
            setLocalProductId('');
            setError("");
        } else {
            setLocalRating(0);
            setLocalReviewText("");
            setLocalProductId('');
            setError("");
        }
    }, [type, reviewData]);


    const validateRating = (value) => {
        const numValue = parseFloat(value);
        if (isNaN(numValue) || value === null || value === undefined || value === '') return false;
        if (numValue < 0 || numValue > 5) return false;
        const decimalPart = Math.abs(numValue % 1);
        return decimalPart === 0 || decimalPart === 0.5;
    };

    const handleRatingChange = (e) => {
        const value = e.target.value;
         setLocalRating(value);
         if (value === "" || validateRating(value)) {
             setError("");
         } else {
             setError("Rating must be a number from 0.0 to 5.0 in 0.5 increments.");
         }
    };

    const handleReviewChange = (e) => {
        const value = e.target.value;
        setLocalReviewText(value);
        if (value.length <= 1000) {
             setError(prev => prev.includes("Review text") ? "" : prev);
        } else {
             setError("Review text cannot exceed 1000 characters.");
        }
    };

     const handleProductChange = (e) => {
         setLocalProductId(e.target.value);
         if(e.target.value) {
             setError(prev => prev.includes("Product") ? "" : prev);
         }
     };


    const handleInternalSave = () => {
        setError("");
        let currentError = "";

        if (type === 'add' && !localProductId) {
             currentError = "Please select a product. ";
        }
        if (!validateRating(localRating)) {
            currentError += "Rating must be a number from 0.0 to 5.0 in 0.5 increments. ";
        }
        if (!localReviewText.trim()) {
            currentError += "Review text cannot be empty. ";
        } else if (localReviewText.length > 1000) {
            currentError += "Review text cannot exceed 1000 characters. ";
        }

        if (currentError) {
            setError(currentError.trim());
            return;
        }

        const dataToSave = {
            rating: parseFloat(localRating), 
            reviewText: localReviewText.trim(),
            productId: localProductId,
        };
        onSave(dataToSave);
    };

    const handleInternalConfirm = () => {
        onConfirmDelete(reviewData);
    };


    if (type === "edit" || type === "add") {
        const title = type === "edit" ? `Edit Review for ${reviewData?.productName || 'Product'}` : "Add New Review";
        return (
            <div className="edit-modal-overlay" onClick={onClose}>
                <div className="edit-modal" onClick={e => e.stopPropagation()}>
                    <h3 className="edit-modal-header">{title}</h3>
                    {error && <p className="error-message">{error}</p>}
                    <div className="edit-form">
                        {type === 'add' && (
                            <>
                                <label className="edit-form-label">Product:</label>
                                <select value={localProductId} onChange={handleProductChange} className="review-input">
                                     <option value="" disabled>-- Select Product --</option>
                                     {uniqueProducts.map(product => (<option key={product.id} value={product.id}>{product.name} (ID: {product.id})</option>))}
                                </select>
                            </>
                        )}
                         {type === 'edit' && (
                             <>
                                 <label className="edit-form-label">Product:</label>
                                 <input type="text" value={reviewData?.productName || ''} className="review-input" readOnly disabled/>
                             </>
                         )}
                        <label className="edit-form-label">Rating (0.0–5.0):</label>
                        <input type="number" step="0.5" min="0" max="5" value={localRating} onChange={handleRatingChange} className="review-input" placeholder="e.g., 4.5"/>
                        <label className="edit-form-label">Review:</label>
                        <textarea value={localReviewText} onChange={handleReviewChange} className="review-input" placeholder="Enter review text" rows="4" maxLength="1000"/>
                        <div className="button-group">
                            <button className="save-button" onClick={handleInternalSave}>Save</button>
                            <button className="cancel-button" onClick={onClose}>Cancel</button>
                        </div>
                    </div>
                </div>
            </div>
        );
    } else if (type === "delete") {
        const itemsArray = Array.isArray(reviewData) ? reviewData : [reviewData].filter(Boolean); // Ensure array and filter null/undefined
        const count = itemsArray.length;
        const title = `Confirm Delete`;
        const message = `Are you sure you want to delete ${count} review(s)? This action cannot be undone.`;

        return (
            <div className="delete-modal-overlay" onClick={onClose}>
                <div className="delete-modal" onClick={e => e.stopPropagation()}>
                    <h3>{title}</h3>
                    {error && <p className="error-message">{error}</p>}
                    <p>{message}</p>
                     {count > 0 && count <= 5 && (
                        <ul>
                             {itemsArray.map(item => item ? <li key={item.id}>{item.review_text?.substring(0, 50)}... (Product: {item.productName})</li> : null)}
                        </ul>
                     )}
                    <div className="button-group">
                        <button className="save-button confirm-delete-button" onClick={handleInternalConfirm}>Delete</button>
                        <button className="cancel-button" onClick={onClose}>Cancel</button>
                    </div>
                </div>
            </div>
        );
    }

    return null;
};

export default ReviewManagement;