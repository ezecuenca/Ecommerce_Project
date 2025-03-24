import React, { useState, useEffect, useRef } from "react";
import { FaEdit, FaTrash, FaUndo } from "react-icons/fa";
import CategoryManagement from "./CategoryManagement";
import Axios from 'axios';

const CategoryList = () => {
    const [checkedRows, setCheckedRows] = useState({});
    const [isSelectAll, setIsSelectAll] = useState(false);
    const [viewType, setViewType] = useState("active");
    const [managementModalOpen, setManagementModalOpen] = useState(false);
    const [managementType, setManagementType] = useState("");
    const [selectedCategory, setSelectedCategory] = useState(null);
    const [name, setName] = useState("");
    const [error, setError] = useState("");
    const [forceUpdate, setForceUpdate] = useState(0);
    const [currentPage, setCurrentPage] = useState(1);
    const [searchQuery, setSearchQuery] = useState("");
    const [categories, setCategories] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const tableRef = useRef(null);
    const itemsPerPage = 5;

    useEffect(() => {
        const fetchCategories = async () => {
            try {
                const response = await Axios.get('/api/categories');
                console.log("API Response:", response.data);
                setCategories(response.data);
            } catch (error) {
                console.error("Error fetching categories:", error);
                setError("Failed to load categories. Please try again.");
            } finally {
                setIsLoading(false);
            }
        };
        fetchCategories();
    }, []); // Fetch once on mount

    const getCurrentData = () => {
        if (!categories.length) return [];
        let filteredCategories = categories.filter(category => 
            viewType === "active" ? category.status === 1 : category.status === 0
        );
        if (searchQuery.trim()) {
            filteredCategories = filteredCategories.filter(category =>
                category.category_name.toLowerCase().includes(searchQuery.toLowerCase())
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
        currentItems.forEach(category => {
            newCheckedRows[category.id] = isChecked;
        });
        setCheckedRows(newCheckedRows);
        if (tableRef.current) {
            tableRef.current.querySelectorAll('.category-checkbox').forEach(checkbox => {
                checkbox.checked = isChecked;
            });
        }
    };

    const handleRowCheckbox = (category, e) => {
        setCheckedRows(prev => ({
            ...prev,
            [category.id]: e.target.checked
        }));
        setIsSelectAll(currentItems.every(cat => checkedRows[cat.id] || (cat.id === category.id && e.target.checked)));
    };

    const getSelectedItems = (singleItem = null) => {
        if (singleItem) return [singleItem];
        return currentItems.filter(category => checkedRows[category.id]);
    };

    const handleArchive = (categoryToArchive = null) => {
        const selectedItems = getSelectedItems(categoryToArchive);
        if (viewType !== "active") {
            alert("You can only archive from Active Categories.");
            return;
        }
        if (!selectedItems.length) {
            alert("Please select at least one category to archive.");
            return;
        }
        setManagementType("archive");
        setSelectedCategory(selectedItems);
        setManagementModalOpen(true);
    };

    const handleRestore = (categoryToRestore = null) => {
        const selectedItems = getSelectedItems(categoryToRestore);
        if (viewType !== "archived") {
            alert("You can only restore from Archived Categories.");
            return;
        }
        if (!selectedItems.length) {
            alert("Please select at least one category to restore.");
            return;
        }
        setManagementType("restore");
        setSelectedCategory(selectedItems);
        setManagementModalOpen(true);
    };

    const handleAdd = () => {
        setManagementType("add");
        setName("");
        setSelectedCategory(null);
        setManagementModalOpen(true);
    };

    const handleEdit = (category) => {
        setSelectedCategory(category);
        setName(category.category_name || ""); // Match API field
        setManagementType("edit");
        setManagementModalOpen(true);
    };

    const validateName = (name) => name.trim().length > 0;

    const handleNameChange = (e) => setName(e.target.value);

    const handleSearchChange = (e) => {
        setSearchQuery(e.target.value);
        setCurrentPage(1);
    };

    const handleSaveEditOrAdd = async (newOrUpdatedCategory) => {
        if (!validateName(newOrUpdatedCategory.category_name)) { // Match API field
            setError("Category name is required.");
            return;
        }
        setError("");
        try {
            if (managementType === "edit") {
                if (!selectedCategory) throw new Error("No category selected for editing.");
                await Axios.put(`/api/categories/${selectedCategory.id}`, {
                    category_name: newOrUpdatedCategory.category_name,
                    updated_at: new Date().toISOString(),
                    status: 1
                });
            } else if (managementType === "add") {
                await Axios.post('/api/categories', {
                    category_name: newOrUpdatedCategory.category_name,
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString(),
                    status: 1
                });
            }
            const response = await Axios.get('/api/categories');
            setCategories(response.data);
            setManagementModalOpen(false);
            setSelectedCategory(null);
            setName("");
            setForceUpdate(prev => prev + 1);
            setCurrentPage(1);
        } catch (error) {
            console.error(`Error ${managementType}ing category:`, error);
            setError(`Failed to ${managementType} category. Please try again.`);
        }
    };

    const handleConfirmDeleteOrRestore = async (items) => {
        if (!items?.length) {
            alert(`Please select at least one category to ${managementType}.`);
            return;
        }
        try {
            const categoryIds = items.map(item => item.id);
            if (managementType === "archive") {
                await Axios.put('/api/categories/archive', { data: { ids: categoryIds } });
            } else if (managementType === "restore") {
                await Axios.put('/api/categories/restore', { ids: categoryIds }); // Match backend expectation
            }
            const response = await Axios.get('/api/categories');
            setCategories(response.data);
            setCheckedRows({});
            setIsSelectAll(false);
            if (tableRef.current) {
                tableRef.current.querySelectorAll('.category-checkbox').forEach(checkbox => checkbox.checked = false);
            }
            setManagementModalOpen(false);
            if (currentData.length <= itemsPerPage) setCurrentPage(1);
            setForceUpdate(prev => prev + 1);
        } catch (error) {
            console.error(`Error ${managementType}ing categories:`, error);
            setError(`Failed to ${managementType} categories. Please try again.`);
        }
    };

    const handleCloseManagement = () => {
        setManagementModalOpen(false);
        setManagementType("");
        setSelectedCategory(null);
        setName("");
        setError("");
    };

    const checkedCount = Object.values(checkedRows).filter(Boolean).length;

    return (
        <div className="CategoryList">
            <h2 className="categories-header">{viewType === "active" ? "Active Categories" : "Archived Categories"}</h2>
            {error && <p className="error-message">{error}</p>}
            {isLoading ? (
                <p>Loading categories...</p>
            ) : (
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
                                        className="archive-button"
                                        onClick={() => handleArchive()}
                                        disabled={checkedCount < 1}
                                    >
                                        Archive
                                    </button>
                                </>
                            )}
                            {viewType === "archived" && (
                                <button
                                    className="restore-button"
                                    onClick={() => handleRestore()}
                                    disabled={checkedCount < 1}
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
                                currentItems.map(category => (
                                    <tr className="table-row" key={category.id}>
                                        <td className="table-cell">
                                            <input
                                                type="checkbox"
                                                className="category-checkbox"
                                                checked={!!checkedRows[category.id]}
                                                onChange={e => handleRowCheckbox(category, e)}
                                            />
                                        </td>
                                        <td className="table-cell categories-action-column">
                                            <div className="action-buttons">
                                                {viewType === "active" ? (
                                                    <>
                                                        <FaEdit className="edit-icon" size={20} onClick={() => handleEdit(category)} />
                                                        <FaTrash className="archive-icon" size={20} onClick={() => handleArchive(category)} />
                                                    </>
                                                ) : (
                                                    <FaUndo className="restore-icon" size={20} onClick={() => handleRestore(category)} />
                                                )}
                                            </div>
                                        </td>
                                        <td className="table-cell">{category.category_name}</td>
                                        <td className="table-cell">{category.created_at}</td>
                                        <td className="table-cell">{category.updated_at}</td>
                                    </tr>
                                ))
                            ) : (
                                <tr className="table-row">
                                    <td colSpan="5" className="table-cell" style={{ textAlign: "center", padding: "20px", backgroundColor: "#f9f9f9" }}>
                                        {categories.length === 0
                                            ? "No categories available."
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
                            onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                            disabled={currentPage === 1}
                            className="table-pagination-button"
                        >
                            Previous
                        </button>
                        {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                            <button
                                key={page}
                                onClick={() => setCurrentPage(page)}
                                className={currentPage === page ? "table-pagination-button active" : "table-pagination-button"}
                            >
                                {page}
                            </button>
                        ))}
                        <button
                            onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                            disabled={currentPage === totalPages}
                            className="table-pagination-button"
                        >
                            Next
                        </button>
                    </div>
                </div>
            )}
            {managementModalOpen && (
                <CategoryManagement
                    type={managementType}
                    category={managementType === "edit" || managementType === "add" ? selectedCategory : null}
                    selectedCategories={managementType === "restore" || managementType === "archive" ? selectedCategory : []}
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