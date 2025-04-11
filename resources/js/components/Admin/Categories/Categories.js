import React, { useState, useEffect, useRef, useCallback } from "react";
import { FaEdit, FaTrash, FaUndo, FaSpinner } from "react-icons/fa";
import CategoryManagement from "./CategoryManagement";
import Axios from 'axios';
import moment from 'moment';

const API_BASE_URL = "http://localhost:8000/api";

const makeAuthenticatedRequest = async (method, url, data = null, config = {}) => {
    const token = localStorage.getItem("access_token");
    if (!token) {
        console.error("Auth token not found. Please log in.");
        throw new Error("Unauthenticated: No token found.");
    }
    const headers = {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/json',
        ...(!(data instanceof FormData) && data ? { 'Content-Type': 'application/json' } : {}),
        ...(config.headers || {}),
    };
    if (data instanceof FormData) {
        delete headers['Content-Type'];
    }
    const fullConfig = { ...config, headers };

    try {
        switch (method.toLowerCase()) {
            case 'get': return await Axios.get(url, fullConfig);
            case 'post': return await Axios.post(url, data, fullConfig);
            case 'put': return await Axios.put(url, data, fullConfig);
            case 'delete': return await Axios.delete(url, fullConfig);
            default: throw new Error(`Unsupported Axios method: ${method}`);
        }
    } catch (error) {
        console.error(`Axios Error: ${method.toUpperCase()} ${url}`, error.response?.data || error.message, error);
        throw error;
    }
};

const formatDate = (dateString) => { if (!dateString) return "N/A"; return moment(dateString).isValid() ? moment(dateString).format('MMMM D, YYYY') : "Invalid Date"; };
const formatTime = (dateString) => { if (!dateString) return "N/A"; return moment(dateString).isValid() ? moment(dateString).format('h:mm A') : "Invalid Time"; };


const CategoryList = () => {
    const [categories, setCategories] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [fetchError, setFetchError] = useState("");
    const [actionError, setActionError] = useState("");
    const [checkedRows, setCheckedRows] = useState({});
    const [isSelectAll, setIsSelectAll] = useState(false);
    const [viewType, setViewType] = useState("active");
    const [managementModalOpen, setManagementModalOpen] = useState(false);
    const [managementType, setManagementType] = useState("");
    const [selectedCategoryForAction, setSelectedCategoryForAction] = useState(null);
    const [name, setName] = useState("");
    const [forceUpdate, setForceUpdate] = useState(0);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [searchQuery, setSearchQuery] = useState("");
    const tableRef = useRef(null);
    const itemsPerPage = 5;

    const fetchCategories = useCallback(async () => {
        setIsLoading(true);
        setFetchError("");
        setCheckedRows({});
        setIsSelectAll(false);
        console.log(`Fetching categories: page=${currentPage}, status=${viewType}, search=${searchQuery}, per_page=${itemsPerPage}`);

        try {
            const response = await makeAuthenticatedRequest('get', `${API_BASE_URL}/categories`, null, {
                params: {
                    page: currentPage,
                    per_page: itemsPerPage,
                    status: viewType,
                    search: searchQuery || undefined,
                }
            });

            console.log("API Response Structure:", response.data);

            if (response.data?.data && typeof response.data.last_page !== 'undefined') {
                 console.log(`Received ${response.data.data.length} categories for page ${response.data.current_page} of ${response.data.last_page}`);
                setCategories(response.data.data);
                setTotalPages(response.data.last_page || 1);
                if (response.data.current_page > response.data.last_page && response.data.last_page > 0) {

                } else if (response.data.total === 0 && currentPage > 1) {
                     setCurrentPage(1);
                }
            } else {
                 console.warn("Received non-paginated or unexpected data structure:", response.data);
                 if(Array.isArray(response.data)) {
                    setCategories(response.data);
                    setTotalPages(1);
                    setCurrentPage(1);
                 } else {
                    setCategories([]);
                    setTotalPages(1);
                    setCurrentPage(1);
                    setFetchError("Received invalid data format.");
                 }
            }
        } catch (error) {
            console.error("Error fetching categories:", error);
            const message = error.message?.startsWith("Unauth") ? "Authentication failed. Please log in again." : (error.response?.data?.message || error.message || 'Failed to load categories.');
            setFetchError(message);
            setCategories([]);
            setTotalPages(1);
        } finally {
            setIsLoading(false);
        }
    }, [currentPage, itemsPerPage, viewType, searchQuery]);

    useEffect(() => {
        fetchCategories();
    }, [fetchCategories, forceUpdate]);


    const handleSelectAll = (e) => {
        const isChecked = e.target.checked;
        setIsSelectAll(isChecked);
        const newCheckedRows = {};
        categories.forEach(category => {
            newCheckedRows[category.id] = isChecked;
        });
        setCheckedRows(newCheckedRows);
    };

    const handleRowCheckbox = (category, e) => {
        const isChecked = e.target.checked;
        setCheckedRows(prev => {
            const updated = { ...prev, [category.id]: isChecked };
            const allCurrentChecked = categories.length > 0 && categories.every(cat => updated[cat.id]);
            setIsSelectAll(allCurrentChecked);
            return updated;
        });
    };

    const getSelectedCategoryIds = () => Object.keys(checkedRows).filter(id => checkedRows[id]).map(id => parseInt(id, 10));
    const getSelectedItems = (singleItem = null) => {
        if (singleItem) return [singleItem];
        const selectedIds = getSelectedCategoryIds();
        return categories.filter(category => selectedIds.includes(category.id));
    };



    const handleArchive = (categoryToArchive = null) => {
        const selectedItems = getSelectedItems(categoryToArchive);
        console.log('Items selected for archive:', selectedItems);
        if (viewType !== "active") { alert("You can only archive from Active Categories."); return; }
        if (selectedItems.length === 0) { alert("Please select at least one category to archive."); return; }
        setManagementType("archive");
        setSelectedCategoryForAction(selectedItems);
        setActionError("");
        setManagementModalOpen(true);
    };

    const handleRestore = (categoryToRestore = null) => {
        const selectedItems = getSelectedItems(categoryToRestore);
        if (viewType !== "archived") { alert("You can only restore from Archived Categories."); return; }
        if (selectedItems.length === 0) { alert("Please select at least one category to restore."); return; }
        setManagementType("restore");
        setSelectedCategoryForAction(selectedItems);
        setActionError("");
        setManagementModalOpen(true);
    };

    const handleAdd = () => {
        setManagementType("add");
        setSelectedCategoryForAction(null);
        setName("");
        setActionError("");
        setManagementModalOpen(true);
    };

    const handleEdit = (category) => {
        setManagementType("edit");
        setSelectedCategoryForAction(category);
        setName(category.category_name || "");
        setActionError("");
        setManagementModalOpen(true);
    };

    const handleSearchChange = (e) => {
        setSearchQuery(e.target.value);
        setCurrentPage(1);
    };

    const handleViewChange = (newViewType) => {
        if (newViewType !== viewType) {
            setViewType(newViewType);
            setCurrentPage(1);
            setCheckedRows({});
            setIsSelectAll(false);
        }
    };


    const handleCloseManagement = () => {
        setManagementModalOpen(false);
        setManagementType("");
        setSelectedCategoryForAction(null);
        setName("");
        setActionError("");
    };

    const handleSaveEditOrAdd = async (newOrUpdatedCategoryData) => {
        if (!newOrUpdatedCategoryData?.category_name?.trim()) {
            setActionError("Category name is required.");
            return;
        }
        setActionError("");
        setIsLoading(true);

        try {
            let response;
            if (managementType === "edit") {
                if (!selectedCategoryForAction?.id) throw new Error("No category selected for editing.");
                response = await makeAuthenticatedRequest(
                    'put',
                    `${API_BASE_URL}/categories/${selectedCategoryForAction.id}`,
                    { category_name: newOrUpdatedCategoryData.category_name.trim() }
                );
                alert("Category updated successfully!");
            } else if (managementType === "add") {
                response = await makeAuthenticatedRequest(
                    'post',
                    `${API_BASE_URL}/categories`,
                    { category_name: newOrUpdatedCategoryData.category_name.trim() }
                );
                alert("Category added successfully!");
            }
            handleCloseManagement();
            setForceUpdate(prev => prev + 1);
        } catch (error) {
            console.error(`Error ${managementType}ing category:`, error);
            const message = error.message?.startsWith("Unauth") ? "Authentication failed." : (error.response?.data?.message || error.message || `Failed to ${managementType} category.`);
            setActionError(message);
        } finally {
             setIsLoading(false);
        }
    };

    const handleConfirmArchiveOrRestore = async (items) => {
        if (!items?.length) {
            alert(`Please select at least one category to ${managementType}.`);
            return;
        }
        setActionError("");
        setIsLoading(true);

        const categoryIds = items.map(item => item.id);
        const action = managementType;
        const url = `${API_BASE_URL}/categories/${action}`;
        const payload = { data: { ids: categoryIds } }; 

        console.log(`Attempting to ${action} categories with IDs:`, categoryIds);
        console.log(`Sending payload:`, payload);

        try {
            await makeAuthenticatedRequest('put', url, payload);

            alert(`Categories ${action}d successfully.`);
            handleCloseManagement();

            setForceUpdate(prev => prev + 1);
        } catch (error) {
            console.error(`Error during ${action}:`, error.response?.data || error.message, error);
            const message = error.message?.startsWith("Unauth") ? "Authentication failed." : (error.response?.data?.message || error.message || `Failed to ${action} categories.`);
            setActionError(message);
        } finally {
            setIsLoading(false);
        }
    };

    const checkedCount = getSelectedCategoryIds().length;


    return (
        <div className="CategoryList category-container">
            <h2 className="categories-header">{viewType === "active" ? "Categories" : "Archived Categories"}</h2>
            {fetchError && !isLoading && <p className="error-message" style={{ color: 'red', margin: '10px 0' }}>{fetchError}</p>}

            <div className="table-container">
                 {/* Header Actions */}
                <div className="table-header-actions">
                    <div className="search-bar">
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={handleSearchChange}
                            placeholder="Search Category Name..."
                            className="search-input"
                            disabled={isLoading}
                        />
                    </div>
                    <div className="button-group" style={{ marginLeft: 'auto' }}>
                        {viewType === "active" && (
                            <>
                                <button className="add-button" onClick={handleAdd} disabled={isLoading}>Add Category</button>
                                <button
                                    className="archive-button"
                                    onClick={() => handleArchive()}
                                    disabled={checkedCount === 0 || isLoading}
                                    title="Archive selected categories"
                                >
                                    Archive 
                                </button>
                            </>
                        )}
                        {viewType === "archived" && (
                            <button
                                className="restore-button"
                                onClick={() => handleRestore()}
                                disabled={checkedCount === 0 || isLoading}
                                title="Restore selected categories"
                            >
                                Restore 
                            </button>
                        )}
                    </div>
                    <div className="view-toggle">
                        <button
                            className={`view-button ${viewType === "active" ? "active" : ""}`}
                            onClick={() => handleViewChange("active")}
                            disabled={isLoading}
                        >
                            Active Categories
                        </button>
                        <button
                            className={`view-button ${viewType === "archived" ? "active" : ""}`}
                            onClick={() => handleViewChange("archived")}
                            disabled={isLoading}
                        >
                            Archived Categories
                        </button>
                    </div>
                </div>

                {/* Category Table */}
                <table ref={tableRef} className={`categories-table ${viewType}`}>
                    <thead>
                        <tr className="table-header-row">
                            <th className="table-header checkbox-column">
                                <input
                                    type="checkbox"
                                    className="category-checkbox header-checkbox"
                                    checked={isSelectAll}
                                    onChange={handleSelectAll}
                                    disabled={isLoading || categories.length === 0}
                                />
                            </th>
                            <th className="table-header categories-action-column">Action</th>
                            <th className="table-header">Category Name</th>
                            <th className="table-header">Created At</th>
                            <th className="table-header">Updated At</th>
                        </tr>
                    </thead>
                    <tbody>
                        {isLoading ? (
                            <tr><td colSpan="5" style={{ textAlign: 'center', padding: '20px', fontStyle: 'italic' }}><FaSpinner className="spinner" /> Loading...</td></tr>
                        ) : fetchError ? (
                             <tr><td colSpan="5" style={{ textAlign: 'center', padding: '20px', color: 'grey' }}>Could not load data.</td></tr>
                        ) : categories.length === 0 ? (
                            <tr className="table-row">
                                <td colSpan="5" className="table-cell" style={{ textAlign: "center", padding: "20px" }}>
                                    {searchQuery ? "No categories match your search." : (viewType === 'active' ? "No active categories found." : "No archived categories found.")}
                                </td>
                            </tr>
                        ) : (
                            categories.map(category => (
                                <tr className={`table-row ${category.status === 0 ? 'archived-row' : 'active-row'}`} key={category.id}>
                                    <td className="table-cell checkbox-column">
                                        <input
                                            type="checkbox"
                                            className="category-checkbox row-checkbox"
                                            checked={!!checkedRows[category.id]}
                                            onChange={e => handleRowCheckbox(category, e)}
                                            disabled={isLoading}
                                        />
                                    </td>
                                    <td className="table-cell categories-action-column">
                                        <div className="action-buttons">
                                            {viewType === "active" ? (
                                                <>
                                                    <FaEdit className="edit-icon action-icon" title="Edit Category" size={18} onClick={() => handleEdit(category)} />
                                                    <FaTrash className="delete-icon action-icon" title="Archive Category" size={18} onClick={() => handleArchive(category)} />
                                                </>
                                            ) : (
                                                <FaUndo className="restore-icon action-icon" title="Restore Category" size={18} onClick={() => handleRestore(category)} />
                                            )}
                                        </div>
                                    </td>
                                    <td className="table-cell">{category.category_name}</td>
                                    <td className="table-cell">{formatDate(category.created_at)}<br/><span style={{fontSize:'0.8em', color:'#666'}}>at {formatTime(category.created_at)}</span></td>
                                    <td className="table-cell">{formatDate(category.updated_at)}<br/><span style={{fontSize:'0.8em', color:'#666'}}>at {formatTime(category.updated_at)}</span></td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
                 {!isLoading && !fetchError && totalPages > 1 && (
                    <div className="table-pagination">
                        <button
                            onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                            disabled={currentPage === 1 || isLoading}
                            className="table-pagination-button"
                        >
                            Previous
                        </button>
                        {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                            <button
                                key={page}
                                onClick={() => setCurrentPage(page)}
                                className={currentPage === page ? "table-pagination-button active" : "table-pagination-button"}
                                disabled={isLoading}
                            >
                                {page}
                            </button>
                        ))}
                        <button
                            onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                            disabled={currentPage === totalPages || isLoading}
                            className="table-pagination-button"
                        >
                            Next
                        </button>
                    </div>
                )}
            </div>

            {/* Management Modal */}
            {managementModalOpen && (
                <CategoryManagement
                    type={managementType}
                    category={managementType === "edit" ? selectedCategoryForAction : null}
                    selectedCategories={managementType === "archive" || managementType === "restore" ? selectedCategoryForAction : []}
                    name={name}
                    onClose={handleCloseManagement}
                    onConfirm={handleConfirmArchiveOrRestore}
                    onSave={handleSaveEditOrAdd}
                    externalError={actionError}
                />
            )}
        </div>
    );
};

export default CategoryList;