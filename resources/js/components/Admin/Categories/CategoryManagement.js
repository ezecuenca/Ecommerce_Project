import React, { useState, useEffect } from "react";

const CategoryManagement = ({ type, category, selectedCategories, name, onClose, onConfirm, onSave }) => {
    const [localName, setLocalName] = useState(name || "");
    const [error, setError] = useState("");

    useEffect(() => {
        if (type === "edit" && category) {
            setLocalName(category.category_name || "");
        } else if (type === "add") {
            setLocalName("");
        }
    }, [type, category, name]);

    const handleNameChange = (e) => setLocalName(e.target.value);

    const handleSave = () => {
        const trimmedName = localName.trim();
        if (!trimmedName) {
            setError("Category name is required.");
            return;
        }
        setError("");

        if (type === "edit" && !category) {
            setError("No category selected for editing.");
            return;
        }

        const categoryData = { category_name: trimmedName };
        onSave(categoryData);
        onClose();
    };

    const handleConfirm = () => {
        if (!selectedCategories?.length) {
            setError(`Please select at least one category to ${type}.`);
            return;
        }
        setError("");
        onConfirm(selectedCategories);
        onClose();
    };

    const handleCancel = () => onClose();

    if (type === "edit" || type === "add") {
        const title = type === "edit" ? `Edit Category: ${category?.category_name || "Category"}` : "Add New Category";
        return (
            <div className="CategoryManagement">
                <div className="edit-modal-overlay" onClick={handleCancel}>
                    <div className="edit-modal" onClick={e => e.stopPropagation()}>
                        <h3 className="edit-modal-header">{title}</h3>
                        {error && <p className="error-message">{error}</p>}
                        <div className="edit-form">
                            <label className="edit-form-label">Category Name:</label>
                            <input
                                type="text"
                                value={localName}
                                onChange={handleNameChange}
                                className="category-input"
                                placeholder="Enter category name"
                            />
                            <div className="button-group">
                                <button className="save-button" onClick={handleSave}>Save</button>
                                <button className="cancel-button" onClick={handleCancel}>Cancel</button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    } else if (type === "archive" || type === "restore") {
        const action = type === "archive" ? "Delete" : "Restore";
        const message = type === "archive"
            ? `Are you sure you want to delete ${selectedCategories.length} category(ies)?`
            : `Are you sure you want to ${action.toLowerCase()} ${selectedCategories.length} category(ies)?`;

        return (
            <div className="CategoryManagement">
                <div className="confirm-modal-overlay" onClick={handleCancel} data-testid="confirm-overlay">
                    <div className="confirm-modal" onClick={e => e.stopPropagation()} data-testid="confirm-modal">
                        <h3>Confirm {action}</h3>
                        {error && <p className="error-message">{error}</p>}
                        <p>{message}</p>
                        <div className="button-group">
                            <button className="save-button" onClick={handleConfirm}>{action}</button>
                            <button className="cancel-button" onClick={handleCancel}>Cancel</button>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return null;
};

export default CategoryManagement;