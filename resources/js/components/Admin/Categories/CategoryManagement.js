import React, { useState, useEffect } from "react";

const CategoryManagement = ({ type, category, selectedCategories, name, onClose, onConfirm, onSave, externalError }) => {
    const [internalError, setInternalError] = useState("");
    const [localName, setLocalName] = useState("");

    useEffect(() => {
        setInternalError("");
        if (type === "edit" && category) {
            setLocalName(category.category_name || "");
        } else if (type === "add") {
            setLocalName("");
        }
    }, [type, category]);

    const handleNameChange = (e) => {
        setLocalName(e.target.value);
        if (internalError) {
            setInternalError("");
        }
    };

    const handleSave = () => {
        const trimmedName = localName.trim();
        if (!trimmedName) {
            setInternalError("Category name is required.");
            return;
        }
        setInternalError("");

        if (type === "edit" && !category?.id) {
            setInternalError("Cannot save edit: Invalid category selected.");
            return;
        }

        const categoryData = { category_name: trimmedName };
        onSave(categoryData);
    };

    const handleConfirm = () => {
        if (!Array.isArray(selectedCategories) || selectedCategories.length === 0) {
            setInternalError(`No categories selected to ${type}.`);
            return;
        }
        setInternalError("");
        onConfirm(selectedCategories);
    };

    const handleCancel = () => {
        onClose();
    };

    if (type === "edit" || type === "add") {
        const title = type === "edit" ? `Edit Category: ${category?.category_name || "..."}` : "Add New Category";
        return (
            <div className="modal-overlay" onClick={handleCancel}>
                <div className="modal-content" onClick={e => e.stopPropagation()}>
                    <h3 className="modal-header">{title}</h3>
                    <div className="edit-form">
                        {internalError && <p className="error-message" style={{ color: 'orange', marginBottom: '10px' }}>{internalError}</p>}
                        {externalError && <p className="error-message" style={{ color: 'red', marginBottom: '10px' }}>Error: {externalError}</p>}
                        <label className="edit-form-label">Category Name:</label>
                        <input
                            type="text"
                            value={localName}
                            onChange={handleNameChange}
                            className="category-input"
                            placeholder="Enter category name"
                            aria-required="true"
                            aria-invalid={!!internalError || !!externalError}
                        />
                        <div className="button-group modal-footer">
                            <button className="save-button confirm-button" onClick={handleSave}>Save</button>
                            <button className="cancel-button" onClick={handleCancel}>Cancel</button>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    else if (type === "archive" || type === "restore") {
        const action = type === "archive" ? "Delete" : "Restore";
        const count = Array.isArray(selectedCategories) ? selectedCategories.length : 0;
        const categoryNoun = count === 1 ? "category" : "categories";
        const message = `Are you sure you want to ${action.toLowerCase()} ${count} ${categoryNoun}?`;

        return (
            <div className="modal-overlay" onClick={handleCancel} data-testid={`${type}-overlay`}>
                <div className="modal-content" onClick={e => e.stopPropagation()} data-testid={`${type}-modal`}>
                    <h3 className="modal-header">Confirm {action}</h3>
                    <p style={{ margin: '20px 0' }}>{message}</p>
                    {externalError && <p className="error-message" style={{ color: 'red', marginBottom: '10px' }}>Error: {externalError}</p>}
                    {internalError && <p className="error-message" style={{ color: 'orange', marginBottom: '10px' }}>{internalError}</p>}
                    <div className="button-group modal-footer">
                        <button className="confirm-button" onClick={handleConfirm} disabled={count === 0}>{action}</button>
                        <button className="cancel-button" onClick={handleCancel}>Cancel</button>
                    </div>
                </div>
            </div>
        );
    }

    return null;
};

export default CategoryManagement;