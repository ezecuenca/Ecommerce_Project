import React, { useState, useEffect } from "react";

const CategoryManagement = ({ type, category, selectedCategories, name, onClose, onConfirm, onSave }) => {
    const [localName, setLocalName] = useState(name || "");
    const [error, setError] = useState("");

    useEffect(() => {
        console.log("CategoryManagement rendered with type:", type, "category:", category, "name:", name, "selectedCategories:", selectedCategories);
        if (type === "edit" && category) {
            setLocalName(category.name || "");
            console.log("Initializing edit for category:", category);
        } else if (type === "add") {
            setLocalName("");
            console.log("Initializing add for new category");
        }
    }, [type, category, name, selectedCategories]);

    const validateName = (name) => {
        return name.trim().length > 0; // Simple validation for category name
    };

    const handleNameChange = (e) => setLocalName(e.target.value);

    const handleSave = () => {
        if (type === "edit") {
            if (!category) {
                alert("No category selected for editing.");
                return;
            }

            if (!validateName(localName)) {
                setError("Category name is required.");
                return;
            }

            setError("");
            const updatedCategory = {
                ...category,
                name: localName.trim(),
                updatedAt: new Date().toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: '2-digit' }),
            };
            console.log("Saving updated category:", updatedCategory);
            onSave(updatedCategory);
            onClose();
        } else if (type === "add") {
            if (!validateName(localName)) {
                setError("Category name is required.");
                return;
            }

            setError("");
            const newCategory = {
                id: Date.now(),
                name: localName.trim(),
                createdAt: new Date().toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: '2-digit' }),
                updatedAt: new Date().toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: '2-digit' }),
                isArchived: false,
            };
            console.log("Saving new category:", newCategory);
            onSave(newCategory);
            onClose();
        }
    };

    const handleConfirm = () => {
        console.log("Confirming action - type:", type, "selectedCategories:", selectedCategories);
        if (type === "delete") {
            if (!selectedCategories || selectedCategories.length === 0) {
                alert("Please select at least one category to delete.");
                return;
            }
            console.log("Confirming delete for categories:", selectedCategories);
            onConfirm(selectedCategories);
            onClose();
        } else if (type === "restore") {
            if (!selectedCategories || selectedCategories.length === 0) {
                alert("Please select at least one category to restore.");
                return;
            }
            console.log("Confirming restore for categories:", selectedCategories);
            onConfirm(selectedCategories);
            onClose();
        }
    };

    const handleCancel = () => {
        console.log("Closing modal for type:", type);
        onClose();
    };

    if (type === "edit" || type === "add") {
        const title = type === "edit" ? `Edit Category: ${category?.name || "Category"}` : "Add New Category";
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
    } else if (type === "delete" || type === "restore") {
        const title = type === "delete" ? "Confirm Delete" : "Confirm Restore";
        const message = type === "delete"
            ? `Are you sure you want to delete ${selectedCategories.length} category(ies)?`
            : `Are you sure you want to restore ${selectedCategories.length} category(ies)?`;

        return (
            <div className={`${type === "delete" ? "delete" : "restore"}-modal-overlay`} onClick={handleCancel} data-testid={`${type}-overlay`}>
                <div className={`${type === "delete" ? "delete" : "restore"}-modal`} onClick={e => e.stopPropagation()} data-testid={`${type}-modal`}>
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

export default CategoryManagement;