import React, { useState, useEffect, useRef } from "react";
import { FaEdit, FaTrash, FaUndo } from "react-icons/fa"; // Added FaUndo for Restore
import CategoryManagement from "./CategoryManagement"; // Assume a similar CategoryManagement component

const CategoryList = () => {
    const [checkedRows, setCheckedRows] = useState({});
    const [isSelectAll, setIsSelectAll] = useState(false);
    const [viewType, setViewType] = useState("active"); // Categories can now have active/archived views
    const [managementModalOpen, setManagementModalOpen] = useState(false);
    const [managementType, setManagementType] = useState("");
    const [selectedCategory, setSelectedCategory] = useState(null);
    const [name, setName] = useState("");
    const [error, setError] = useState("");
    const [forceUpdate, setForceUpdate] = useState(0);
    const [currentPage, setCurrentPage] = useState(1);
    const [searchQuery, setSearchQuery] = useState("");
    const itemsPerPage = 5; // Match CustomerList pagination

    const [initialCategories, setInitialCategories] = useState([
        { id: 1, name: "Men", createdAt: "11/21/24", updatedAt: "11/21/24", isArchived: false },
        { id: 2, name: "Women", createdAt: "11/21/24", updatedAt: "11/21/24", isArchived: false },
        { id: 3, name: "Unisex", createdAt: "11/21/24", updatedAt: "11/21/24", isArchived: false },
        // Added an archived category for testing
        { id: 4, name: "Kids", createdAt: "11/21/24", updatedAt: "11/21/24", isArchived: true },
    ]);

    const [categories, setCategories] = useState(initialCategories);
    const tableRef = useRef(null);

    useEffect(() => {
        const savedCategories = localStorage.getItem("categories");
        let updatedCategories = [...initialCategories];
        if (savedCategories) {
            try {
                updatedCategories = JSON.parse(savedCategories).map(category => ({
                    ...category,
                    isArchived: category.isArchived !== undefined ? category.isArchived : false,
                    createdAt: category.createdAt || new Date().toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: '2-digit' }),
                    updatedAt: category.updatedAt || new Date().toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: '2-digit' }),
                }));
                console.log("Loaded categories from localStorage:", updatedCategories);
            } catch (error) {
                console.error("Error parsing categories from localStorage:", error);
                updatedCategories = [...initialCategories];
                localStorage.setItem("categories", JSON.stringify(updatedCategories));
            }
        } else {
            console.log("Initialized with static categories:", initialCategories);
            localStorage.setItem("categories", JSON.stringify(initialCategories));
        }
        setCategories(updatedCategories);
        setInitialCategories(updatedCategories);
        setCheckedRows({});
        setIsSelectAll(false);
    }, []);

    const getCurrentData = () => {
        if (!categories || categories.length === 0) {
            console.warn("No categories data available, returning empty array.");
            return [];
        }
        let filteredCategories = categories.filter(category => category.isArchived === (viewType === "archived"));
        if (searchQuery.trim()) {
            filteredCategories = filteredCategories.filter(category =>
                category.name.toLowerCase().includes(searchQuery.toLowerCase())
            );
        }
        return filteredCategories;
    };

    const currentData = getCurrentData();
    const totalPages = Math.ceil(currentData.length / itemsPerPage);
    const currentItems = currentData.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    );

    const handleSelectAll = (e) => {
        const isChecked = e.target.checked;
        setIsSelectAll(isChecked);
        const newCheckedRows = {};
        if (isChecked) {
            currentItems.forEach((_, index) => {
                newCheckedRows[index] = true;
            });
            if (tableRef.current) {
                tableRef.current.querySelectorAll('.category-checkbox').forEach(checkbox => checkbox.checked = true);
            }
        } else {
            if (tableRef.current) {
                tableRef.current.querySelectorAll('.category-checkbox').forEach(checkbox => checkbox.checked = false);
            }
        }
        setCheckedRows(newCheckedRows);
    };

    const handleRowCheckbox = (index, e) => {
        const isChecked = e.target.checked;
        setCheckedRows((prev) => ({
            ...prev,
            [index]: isChecked,
        }));
        const allChecked = currentItems.length ===
            (tableRef.current ? Array.from(tableRef.current.querySelectorAll('.category-checkbox')).filter(cb => cb.checked).length : 0);
        setIsSelectAll(allChecked);
    };

    const handleDelete = (categoryToDelete = null) => {
        console.log("Attempting to delete - viewType:", viewType, "categoryToDelete:", categoryToDelete, "checkedRows:", checkedRows);
        const selectedIndices = Object.keys(checkedRows)
            .filter(index => checkedRows[index])
            .map(index => parseInt(index, 10));

        if (categoryToDelete) {
            if (viewType !== "active") {
                alert("You can only delete from Active Categories.");
                return;
            }
            setManagementType("delete");
            setSelectedCategory([categoryToDelete]);
            setManagementModalOpen(true);
            return;
        }

        const selectedCount = selectedIndices.length;
        if (selectedCount < 1) {
            alert("Please select at least one category to delete.");
            return;
        }

        if (viewType !== "active") {
            alert("You can only delete from Active Categories.");
            return;
        }

        setManagementType("delete");
        setSelectedCategory(getSelectedCategories());
        setManagementModalOpen(true);
    };

    const handleRestore = (categoryToRestore = null) => {
        console.log("Attempting to restore - viewType:", viewType, "categoryToRestore:", categoryToRestore, "checkedRows:", checkedRows);
        const selectedIndices = Object.keys(checkedRows)
            .filter(index => checkedRows[index])
            .map(index => parseInt(index, 10));

        if (categoryToRestore) {
            if (viewType !== "archived") {
                alert("You can only restore from Archived Categories.");
                return;
            }
            console.log("Opening restore modal for single category:", categoryToRestore);
            setManagementType("restore");
            setSelectedCategory([categoryToRestore]);
            setManagementModalOpen(true);
            return;
        }

        const selectedCount = selectedIndices.length;
        if (selectedCount < 1) {
            alert("Please select at least one category to restore.");
            return;
        }

        if (viewType !== "archived") {
            alert("You can only restore from Archived Categories.");
            return;
        }

        console.log("Opening restore modal for multiple categories:", getSelectedCategories());
        setManagementType("restore");
        setSelectedCategory(getSelectedCategories());
        setManagementModalOpen(true);
    };

    const handleAdd = () => {
        console.log("Current viewType:", viewType, "Opening Add modal");
        setManagementType("add");
        setName("");
        setSelectedCategory(null);
        setManagementModalOpen(true);
    };

    const handleEdit = (category) => {
        console.log("Opening edit for category:", category);
        setSelectedCategory(category);
        setName(category.name || "");
        setManagementType("edit");
        setManagementModalOpen(true);
    };

    const validateName = (name) => {
        return name.trim().length > 0; // Simple validation for category name
    };

    const handleNameChange = (e) => setName(e.target.value);

    const handleSearchChange = (e) => {
        setSearchQuery(e.target.value);
        setCurrentPage(1);
    };

    const handleSaveEditOrAdd = (newOrUpdatedCategory) => {
        if (managementType === "edit") {
            if (!selectedCategory) {
                alert("No category selected for editing.");
                return;
            }

            if (!validateName(newOrUpdatedCategory.name)) {
                setError("Category name is required.");
                return;
            }

            setError("");
            const updatedCategories = categories.map(c =>
                c.id === selectedCategory.id ? { ...newOrUpdatedCategory, id: selectedCategory.id, createdAt: selectedCategory.createdAt, isArchived: selectedCategory.isArchived } : c
            );
            setCategories(updatedCategories);
            setInitialCategories(updatedCategories);
            localStorage.setItem("categories", JSON.stringify(updatedCategories));
            setManagementModalOpen(false);
            setSelectedCategory(null);
            setName("");
            console.log("Edited category, updated categories:", updatedCategories);
            setForceUpdate(prev => prev + 1);
        } else if (managementType === "add") {
            if (!validateName(newOrUpdatedCategory.name)) {
                setError("Category name is required.");
                return;
            }

            setError("");
            const newCategory = {
                id: Date.now(),
                name: newOrUpdatedCategory.name.trim(),
                createdAt: new Date().toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: '2-digit' }),
                updatedAt: new Date().toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: '2-digit' }),
                isArchived: false, // New categories are active by default
            };
            const updatedCategories = [newCategory, ...categories];
            setCategories(updatedCategories);
            setInitialCategories(updatedCategories);
            localStorage.setItem("categories", JSON.stringify(updatedCategories));
            setManagementModalOpen(false);
            setName("");
            console.log("Added new category, updated categories:", updatedCategories);
            setForceUpdate(prev => prev + 1);
            setCurrentPage(1);
        }
    };

    const handleConfirmDeleteOrRestore = (items) => {
        console.log("Confirming action - managementType:", managementType, "items:", items);
        if (managementType === "delete") {
            const updatedCategories = categories.map(category => {
                if (Array.isArray(items)) {
                    if (items.some(item => item.id === category.id)) {
                        return { ...category, isArchived: true, updatedAt: new Date().toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: '2-digit' }) };
                    }
                } else {
                    if (items.id === category.id) {
                        return { ...category, isArchived: true, updatedAt: new Date().toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: '2-digit' }) };
                    }
                }
                return category;
            });
            setCategories(updatedCategories);
            setInitialCategories(updatedCategories);
            setCheckedRows({});
            setIsSelectAll(false);
            if (tableRef.current && viewType === "active") {
                tableRef.current.querySelectorAll('.category-checkbox').forEach(checkbox => checkbox.checked = false);
            }
            setManagementModalOpen(false);
            if (currentData.length === 0) {
                setCurrentPage(1);
            }
            setForceUpdate(prev => prev + 1);
            localStorage.setItem("categories", JSON.stringify(updatedCategories));
            console.log("Categories after delete:", updatedCategories);
        } else if (managementType === "restore") {
            const updatedCategories = categories.map(category => {
                if (Array.isArray(items)) {
                    if (items.some(item => item.id === category.id)) {
                        return { ...category, isArchived: false, updatedAt: new Date().toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: '2-digit' }) };
                    }
                } else {
                    if (items.id === category.id) {
                        return { ...category, isArchived: false, updatedAt: new Date().toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: '2-digit' }) };
                    }
                }
                return category;
            });
            setCategories(updatedCategories);
            setInitialCategories(updatedCategories);
            setCheckedRows({});
            setIsSelectAll(false);
            if (tableRef.current && viewType === "archived") {
                tableRef.current.querySelectorAll('.category-checkbox').forEach(checkbox => checkbox.checked = false);
            }
            setManagementModalOpen(false);
            if (currentData.length === 0) {
                setCurrentPage(1);
            }
            setForceUpdate(prev => prev + 1);
            localStorage.setItem("categories", JSON.stringify(updatedCategories));
            console.log("Categories after restore:", updatedCategories);
        }
    };

    const handleCloseManagement = () => {
        setManagementModalOpen(false);
        setManagementType("");
        setSelectedCategory(null);
        setName("");
        setError("");
    };

    const getSelectedCategories = () => {
        const selectedIndices = Object.keys(checkedRows)
            .filter(index => checkedRows[index])
            .map(index => parseInt(index, 10));
        return selectedIndices.map(index => currentItems[index]);
    };

    // Update checkedCount to count any checked rows (at least 1 enables Delete)
    const checkedCount = Object.keys(checkedRows).filter(index => checkedRows[index]).length;

    return (
        <div className="CategoryList">
            <h2 className="categories-header">{viewType === "active" ? "Active Categories" : "Archived Categories"}</h2>
            <div className="table-container">
                <div className="table-header-actions">
                    <div className="search-bar">
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={handleSearchChange}
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
                                    disabled={checkedCount < 2} // Enable when at least one checkbox is checked
                                >
                                    Delete
                                </button>
                            </>
                        )}
                        {viewType === "archived" && (
                            <button
                                className="restore-button"
                                onClick={() => handleRestore()}
                                disabled={checkedCount < 2}
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
                            Active Categories
                        </button>
                        <button
                            className={`view-button ${viewType === "archived" ? "active" : ""}`}
                            onClick={() => setViewType("archived")}
                        >
                            Archived Categories
                        </button>
                    </div>
                </div>
                <table ref={tableRef} className="categories-table">
                    <thead>
                        <tr className="table-header-row">
                            <th className="table-header">
                                <input type="checkbox" className="category-checkbox" checked={isSelectAll} onChange={handleSelectAll} />
                            </th>
                            <th className="table-header categories-action-column">Action</th>
                            <th className="table-header">Category</th>
                            <th className="table-header">Created At</th>
                            <th className="table-header">Updated At</th>
                        </tr>
                    </thead>
                    <tbody>
                        {currentItems.length > 0 ? (
                            currentItems.map((category, index) => (
                                <tr className="table-row" key={category.id + index + forceUpdate}>
                                    <td className="table-cell">
                                        <input type="checkbox" className="category-checkbox" onChange={(e) => handleRowCheckbox(index, e)} />
                                    </td>
                                    <td className="table-cell categories-action-column">
                                        <div className="action-buttons">
                                            {viewType === "active" ? (
                                                <>
                                                    <FaEdit className="edit-icon" size={20} onClick={() => handleEdit(category)} />
                                                    <FaTrash className="delete-icon" size={20} onClick={() => handleDelete(category)} />
                                                </>
                                            ) : (
                                                <FaUndo className="restore-icon" size={20} onClick={() => handleRestore(category)} />
                                            )}
                                        </div>
                                    </td>
                                    <td className="table-cell">{category.name}</td>
                                    <td className="table-cell">{category.createdAt}</td>
                                    <td className="table-cell">{category.updatedAt}</td>
                                </tr>
                            ))
                        ) : (
                            <tr className="table-row">
                                <td colSpan="5" className="table-cell" style={{ textAlign: "center", padding: "20px", backgroundColor: "#f9f9f9" }}>
                                    {categories.length === 0
                                        ? "No categories available. Please check your data or refresh the page."
                                        : viewType === "active"
                                        ? "No active categories match your search."
                                        : "No archived categories match your search."}
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
                <CategoryManagement
                    type={managementType}
                    category={managementType === "edit" || managementType === "add" ? selectedCategory : (managementType === "restore" || managementType === "delete" && !Array.isArray(selectedCategory) ? selectedCategory : null)}
                    selectedCategories={managementType === "restore" || managementType === "delete" ? (selectedCategory || getSelectedCategories()) : []}
                    name={name}
                    onClose={handleCloseManagement}
                    onConfirm={handleConfirmDeleteOrRestore}
                    onSave={handleSaveEditOrAdd}
                />
            )}
        </div>
    );
};

export default CategoryList;