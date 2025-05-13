import React, { useState, useEffect, useRef, useCallback } from "react";
import { FaEdit, FaTrash, FaUndo, FaSpinner } from "react-icons/fa";
import ProductManagement from "./ProductManagement";
import Axios from 'axios';

const API_BASE_URL = "http://localhost:8000/api";

const makeAuthenticatedRequest = async (method, url, data = null, config = {}) => {
    const token = localStorage.getItem("access_token");
    if (!token) {
        console.error("Authentication token not found.");
        throw new Error("Unauthenticated: No token found.");
    }
    const headers = {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/json',
        ...(method.toLowerCase() !== 'get' && data && !(data instanceof FormData) ? { 'Content-Type': 'application/json' } : {}),
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
            case 'patch': return await Axios.patch(url, data, fullConfig);
            case 'delete': return await Axios.delete(url, fullConfig);
            default: throw new Error(`Unsupported Axios method: ${method}`);
        }
    } catch (error) {
         console.error(`Axios Error: ${method.toUpperCase()} ${url}`, error.response?.data || error.message, error);
         throw error;
    }
};

const ProductList = () => {
    const [checkedRows, setCheckedRows] = useState({});
    const [isSelectAll, setIsSelectAll] = useState(false);
    const [viewType, setViewType] = useState("active");
    const [managementModalOpen, setManagementModalOpen] = useState(false);
    const [managementType, setManagementType] = useState("");
    const [selectedProduct, setSelectedProduct] = useState(null);
    const [error, setError] = useState("");
    const [fetchError, setFetchError] = useState("");
    const [forceUpdate, setForceUpdate] = useState(0);
    const [currentPage, setCurrentPage] = useState(1);
    const [searchQuery, setSearchQuery] = useState("");
    const [products, setProducts] = useState([]);
    const [totalPages, setTotalPages] = useState(1);
    const [isLoading, setIsLoading] = useState(true);
    const tableRef = useRef(null);
    const itemsPerPage = 5;

    const formatDate = (dateString) => {
        if (!dateString) return "N/A";
        try { const date = new Date(dateString); return date.toLocaleDateString("en-US", { year: 'numeric', month: 'long', day: 'numeric' }); }
        catch (e) { console.error("Error formatting date:", dateString, e); return "Invalid Date"; }
    };
    const formatTime = (dateString) => {
        if (!dateString) return "N/A";
        try { const date = new Date(dateString); return date.toLocaleTimeString("en-US", { hour: 'numeric', minute: 'numeric', hour12: true }); }
        catch (e) { console.error("Error formatting time:", dateString, e); return "Invalid Time"; }
    };

    const fetchProducts = useCallback(async () => {
        setIsLoading(true);
        setFetchError("");
        setCheckedRows({});
        setIsSelectAll(false);
        try {
            console.log(`[ProductList] Fetching products: page=${currentPage}, status=${viewType}, per_page=${itemsPerPage}`);
            const response = await makeAuthenticatedRequest('get', `${API_BASE_URL}/products`, null, {
                params: { page: currentPage, per_page: itemsPerPage, status: viewType }
            });
            console.log("[ProductList] API Response received:", response.data);

            if (response.data?.data && Array.isArray(response.data.data)) {
                const formattedProducts = response.data.data.map(product => {
                    console.log(`[ProductList] Processing product:`, product);
                    // VVVVVV MODIFIED NORMALIZATION LOGIC VVVVVV
                    const wristObject = product.wristMeasurement || product.wrist_measurement; // Get object regardless of key name
                    const normalizedWristMeasurement = wristObject?.measurement || null; // Safely access 'measurement' property
                    // ^^^^^^ MODIFIED NORMALIZATION LOGIC ^^^^^^
                    return {
                        ...product,
                        // Keep original potentially differently cased object if needed elsewhere
                        category: product.category || null,
                        color: product.color || null,
                        wristMeasurementData: wristObject || null, // Store the object itself if needed for editing
                        // Value used for display
                        wristMeasurementValue: normalizedWristMeasurement,
                        createdAtDate: formatDate(product.created_at),
                        createdAtTime: formatTime(product.created_at),
                        updatedAtDate: formatDate(product.updated_at),
                        updatedAtTime: formatTime(product.updated_at),
                    };
                });
                console.log("[ProductList] Setting products state:", formattedProducts);
                setProducts(formattedProducts);
                setTotalPages(response.data.last_page || 1);

                if (response.data.current_page > response.data.last_page && response.data.last_page > 0) {
                    setCurrentPage(response.data.last_page);
                } else if (response.data.total === 0 && currentPage > 1) {
                     setCurrentPage(1);
                }
            } else {
                 console.warn("[ProductList] Invalid data structure:", response.data);
                 setFetchError("Invalid data format received.");
                 setProducts([]); setTotalPages(1);
            }
        } catch (fetchErr) {
            console.error("[ProductList] Error during fetchProducts:", fetchErr);
            const errorMessage = fetchErr.message?.startsWith("Unauthenticated")
                ? "Authentication error. Please log in again."
                : (fetchErr.response?.data?.message || fetchErr.message || 'Failed to load products.');
            setFetchError(errorMessage);
            setProducts([]); setTotalPages(1);
        } finally {
            setIsLoading(false);
        }
    }, [viewType, currentPage, itemsPerPage]); // Removed makeAuthenticatedRequest if not needed inside directly

    useEffect(() => {
        console.log("[ProductList] useEffect triggered: Fetching products.");
        fetchProducts();
    }, [fetchProducts, forceUpdate]); // Depend on fetchProducts callback

    const getCurrentData = () => {
        if (!Array.isArray(products)) return [];
        let filteredProducts = products;
        if (searchQuery.trim()) {
            const lowerCaseQuery = searchQuery.toLowerCase();
            filteredProducts = products.filter(product => {
                const wristMeasurementValue = product.wristMeasurementValue || ''; // Use the pre-processed string
                return (
                    (product.product_name || '').toLowerCase().includes(lowerCaseQuery) ||
                    (product.description || '').toLowerCase().includes(lowerCaseQuery) ||
                    (product.category?.category_name || '').toLowerCase().includes(lowerCaseQuery) ||
                    (product.color?.color_name || '').toLowerCase().includes(lowerCaseQuery) ||
                    wristMeasurementValue.toLowerCase().includes(lowerCaseQuery) // Search the string value
                );
            });
        }
        return filteredProducts;
    };
    const currentData = getCurrentData();

    const handleSelectAll = (e) => {
        const isChecked = e.target.checked;
        setIsSelectAll(isChecked);
        const newCheckedRows = {};
        currentData.forEach(product => { newCheckedRows[product.id] = isChecked; });
        setCheckedRows(newCheckedRows);
    };
    const handleRowCheckbox = (product, e) => {
        const isChecked = e.target.checked;
        setCheckedRows(prev => {
            const updated = { ...prev, [product.id]: isChecked };
            const allVisibleChecked = currentData.length > 0 && currentData.every(item => updated[item.id]);
            setIsSelectAll(allVisibleChecked);
            return updated;
        });
    };

    const getSelectedItems = (singleItem = null) => {
        if (singleItem) return [singleItem];
        const selectedIds = Object.keys(checkedRows).filter(id => checkedRows[id]);
        return products.filter(product => selectedIds.includes(String(product.id)));
    };

    const handleConfirmDeleteOrRestore = async (items) => {
        setError("");
        if (!items || items.length === 0) {
            setError(`No products selected to ${managementType}.`);
            return;
        }
        const productIds = items.map(item => item.id);
        const action = managementType === "archive" ? "archive" : "restore";
        const url = `${API_BASE_URL}/products/${action}`;

        try {
            console.log(`[ProductList] Attempting to ${action} products:`, productIds);
            await makeAuthenticatedRequest('put', url, { ids: productIds });
            alert(`Products ${action}d successfully.`);
            setForceUpdate(prev => prev + 1);
            setCheckedRows({}); setIsSelectAll(false); handleCloseManagement();

            if (currentData.length === productIds.length && currentPage > 1) {
                 setCurrentPage(1);
            }
        } catch (confirmError) {
            console.error(`[ProductList] Error ${action}ing products:`, confirmError);
            const errorMessage = confirmError.message?.startsWith("Unauthenticated")
                 ? `Authentication error.` : (confirmError.response?.data?.message || confirmError.message || `Failed to ${action}.`);
            setError(errorMessage);
        }
    };

    const handleArchive = (productToArchive = null) => {
        const selectedItems = getSelectedItems(productToArchive);
        if (viewType !== "active") { alert("Can only archive active products."); return; }
        if (selectedItems.length === 0) { alert("Please select one or more products to archive."); return; }
        setManagementType("archive"); setSelectedProduct(selectedItems);
        setError(""); setManagementModalOpen(true);
    };
    const handleRestore = (productToRestore = null) => {
        const selectedItems = getSelectedItems(productToRestore);
        if (viewType !== "archived") { alert("Can only restore archived products."); return; }
        if (selectedItems.length === 0) { alert("Please select one or more products to restore."); return; }
        setManagementType("restore"); setSelectedProduct(selectedItems);
        setError(""); setManagementModalOpen(true);
    };
    const handleAdd = (e) => {
        e.stopPropagation();
        setManagementType("add"); setSelectedProduct(null); setError(""); setManagementModalOpen(true);
    };
    const handleEdit = (product) => {
        if (viewType !== "active") { alert("Can only edit active products."); return; }
        setSelectedProduct(product); setManagementType("edit"); setError(""); setManagementModalOpen(true);
    };
    const handleSearchChange = (e) => {
        setSearchQuery(e.target.value);
        setCurrentPage(1); // Reset page on search change
    };
    const handleViewTypeChange = (newType) => {
         if (viewType !== newType) {
             setViewType(newType);
             setCurrentPage(1);
             setSearchQuery("");
             setForceUpdate(prev => prev + 1); // Trigger fetch for new view
         }
    };
    const handleCloseManagement = () => {
        setManagementModalOpen(false); setManagementType(""); setSelectedProduct(null); setError("");
    };

    const handleSaveEditOrAdd = (savedProductData) => {
        console.log("[ProductList] handleSaveEditOrAdd received:", savedProductData);

        if (!savedProductData || typeof savedProductData.id === 'undefined') {
            console.error("[ProductList] Invalid data from onSave. Triggering refetch.");
            setForceUpdate(prev => prev + 1);
            handleCloseManagement();
            return;
        }

        // VVVVVV MODIFIED NORMALIZATION LOGIC VVVVVV
        const wristObject = savedProductData.wristMeasurement || savedProductData.wrist_measurement; // Get object regardless of key name
        const normalizedWristMeasurement = wristObject?.measurement || null; // Safely access 'measurement' property
        // ^^^^^^ MODIFIED NORMALIZATION LOGIC ^^^^^^

        const formattedSavedProduct = {
            ...savedProductData,
            category: savedProductData.category || null,
            color: savedProductData.color || null,
            wristMeasurementData: wristObject || null, // Store object if needed
            wristMeasurementValue: normalizedWristMeasurement, // Store the string value for rendering
            createdAtDate: formatDate(savedProductData.created_at),
            createdAtTime: formatTime(savedProductData.created_at),
            updatedAtDate: formatDate(savedProductData.updated_at),
            updatedAtTime: formatTime(savedProductData.updated_at),
        };

        setProducts(prevProducts => {
            const existingIndex = prevProducts.findIndex(p => p.id === formattedSavedProduct.id);
            if (existingIndex > -1) {
                console.log(`[ProductList] Updating local state for product ID ${formattedSavedProduct.id}.`);
                const updatedProducts = [...prevProducts];
                updatedProducts[existingIndex] = formattedSavedProduct;
                return updatedProducts;
            } else {
                console.log(`[ProductList] Adding new product ID ${formattedSavedProduct.id} to local state.`);
                // Add to start for visibility, consider sorting/placing based on actual list order if needed
                return [formattedSavedProduct, ...prevProducts].slice(0, itemsPerPage);
            }
        });

        handleCloseManagement();
        // Optional: Force refetch if optimistic update isn't sufficient (e.g., depends on backend sorting)
        // setForceUpdate(prev => prev + 1);
    };

    const checkedCount = Object.values(checkedRows).filter(Boolean).length;

    // --- Table Body Rendering ---
    const renderTableBody = () => {
        if (isLoading && products.length > 0) {
            return (
                <tr>
                    <td colSpan="11" style={{ textAlign: "center", padding: "20px", fontStyle: 'italic', color: '#555' }}>
                        Updating data... <FaSpinner className="spinner" />
                    </td>
                </tr>
            );
        }

        if (currentData.length > 0) {
            return currentData.map(product => (
                <tr className="table-row" key={product.id}>
                    <td className="table-cell checkbox-column">
                        <input
                            type="checkbox"
                            className="product-checkbox row-checkbox"
                            checked={!!checkedRows[product.id]}
                            onChange={(e) => handleRowCheckbox(product, e)}
                            disabled={isLoading}
                        />
                    </td>
                    <td className="table-cell products-action-column">
                        <div className="action-buttons">
                            {viewType === "active" ? (
                                <>
                                    <FaEdit
                                        className="edit-icon action-icon"
                                        title="Edit Product"
                                        size={18}
                                        onClick={() => handleEdit(product)}
                                    />
                                    <FaTrash
                                        className="delete-icon action-icon"
                                        title="Archive Product"
                                        size={18}
                                        onClick={() => handleArchive(product)}
                                    />
                                </>
                            ) : (
                                <FaUndo
                                    className="restore-icon action-icon"
                                    title="Restore Product"
                                    size={18}
                                    onClick={() => handleRestore(product)}
                                />
                            )}
                        </div>
                    </td>
                    <td className="table-cell product-image-column">
                        {product.image_url ? (
                            <img
                                src={product.image_url}
                                alt={product.product_name || 'Product'}
                                className="product-image" // Use the CSS class instead of inline styles
                                onError={(e) => {
                                    console.warn(`Failed to load image: ${product.image_url}`);
                                    e.target.style.display = 'none';
                                }}
                            />
                        ) : (
                            'No Image'
                        )}
                    </td>
                    <td className="table-cell product-name-column">{product.product_name || '-'}</td>
                    <td className="table-cell description-column" title={product.description}>
                        {product.description || '-'}
                    </td>
                    <td className="table-cell product-price-column">
                        ₱ {parseFloat(product.price || 0).toFixed(2)}
                    </td>
                    <td className="table-cell product-category-column">
                        {product.category?.category_name || '-'}
                    </td>
                    <td className="table-cell product-color-column">
                        {product.color?.color_name || '-'}
                    </td>
                    {/* VVVVV Render the pre-processed string value VVVVV */}
                    <td className="table-cell product-wrist-column">
                        {product.wristMeasurementValue || '-'}
                    </td>
                    {/* ^^^^^ Render the pre-processed string value ^^^^^ */}
                    <td className="table-cell product-created-column">
                        {product.createdAtDate}
                        <br />
                        <span style={{ fontSize: '0.8em', color: '#666' }}>
                            at {product.createdAtTime}
                        </span>
                    </td>
                    <td className="table-cell product-updated-column">
                        {product.updatedAtDate}
                        <br />
                        <span style={{ fontSize: '0.8em', color: '#666' }}>
                            at {product.updatedAtTime}
                        </span>
                    </td>
                </tr>
            ));
        }

        // Message when no data matches search or view
        return (
            <tr className="table-row">
                <td colSpan="11" className="table-cell" style={{ textAlign: "center", padding: "20px" }}>
                    {searchQuery ? "No products match your search." : (fetchError ? "Could not load products." : "No products available in this view.")}
                </td>
            </tr>
        );
    };

    // --- Main Render ---
    return (
        <div className="ProductList">
            <h2 className="products-header">{viewType === "active" ? "Active Products" : "Archived Products"}</h2>

            {fetchError && (
                <p className="error-message fetch-error" style={{ color: 'red', margin: '10px 0', border: '1px solid red', padding: '10px' }}>
                    Error: {fetchError} <button onClick={() => setForceUpdate(f => f + 1)} disabled={isLoading}>Retry</button>
                </p>
            )}

            {isLoading && products.length === 0 && !fetchError ? (
                <p style={{ padding: '20px', textAlign: 'center' }}>
                    Loading products... <FaSpinner className="spinner" />
                </p>
            ) : (
                <div className="table-container">
                    {/* Header Actions */}
                    <div className="table-header-actions">
                        <div className="search-bar">
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={handleSearchChange}
                                placeholder="Search Products..."
                                className="search-input"
                                disabled={isLoading}
                            />
                        </div>
                        <div className="button-group" style={{ marginLeft: 'auto' }}>
                            {viewType === "active" && (
                                <>
                                    <button className="add-button" onClick={handleAdd} disabled={isLoading}> Add </button> {/* Shortened Label */}
                                    <button className="delete-button archive-button" onClick={() => handleArchive()} disabled={checkedCount < 1 || isLoading}> Delete </button>
                                </>
                            )}
                            {viewType === "archived" && (
                                <button className="restore-button" onClick={() => handleRestore()} disabled={checkedCount < 1 || isLoading}> Restore </button>
                            )}
                        </div>
                        <div className="view-toggle">
                            <button className={`view-button ${viewType === "active" ? "active" : ""}`} onClick={() => handleViewTypeChange("active")} disabled={isLoading}> Active Products </button>
                            <button className={`view-button ${viewType === "archived" ? "active" : ""}`} onClick={() => handleViewTypeChange("archived")} disabled={isLoading}> Archived Products </button>
                        </div>
                    </div>

                    {/* Table */}
                    <table ref={tableRef} className="products-table">
                        <thead>
                            <tr className="table-header-row">
                                <th className="table-header checkbox-column">
                                    <input type="checkbox" className="product-checkbox header-checkbox" checked={isSelectAll} onChange={handleSelectAll} disabled={currentData.length === 0 || isLoading}/>
                                </th>
                                <th className="table-header products-action-column">Action</th>
                                <th className="table-header product-image-column">Image</th>
                                <th className="table-header product-name-column">Product Name</th>
                                <th className="table-header description-column">Description</th>
                                <th className="table-header product-price-column">Price</th>
                                <th className="table-header product-category-column">Category</th>
                                <th className="table-header product-color-column">Color</th>
                                <th className="table-header product-wrist-column">Wrist Measurement</th>
                                <th className="table-header product-created-column">Created At</th>
                                <th className="table-header product-updated-column">Updated At</th>
                            </tr>
                        </thead>
                        <tbody>
                            {renderTableBody()} {/* Call the function to render body */}
                        </tbody>
                    </table>

                    {/* Pagination */}
                    {totalPages > 1 && !fetchError && (
                        <div className="table-pagination">
                            <button onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))} disabled={currentPage === 1 || isLoading} className="table-pagination-button"> Previous </button>
                            {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                                <button key={page} onClick={() => setCurrentPage(page)} className={currentPage === page ? "table-pagination-button active" : "table-pagination-button"} disabled={isLoading}> {page} </button>
                            ))}
                            <button onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))} disabled={currentPage === totalPages || isLoading} className="table-pagination-button"> Next </button>
                        </div>
                    )}
                </div>
            )}

            {managementModalOpen && (
                <ProductManagement
                    type={managementType}
                    product={managementType === "edit" ? selectedProduct : null}
                    selectedProducts={(managementType === "restore" || managementType === "archive") && Array.isArray(selectedProduct) ? selectedProduct : []}
                    onClose={handleCloseManagement}
                    onConfirm={handleConfirmDeleteOrRestore}
                    onSave={handleSaveEditOrAdd}
                    makeAuthenticatedRequest={makeAuthenticatedRequest}
                    apiBaseUrl={API_BASE_URL}
                    externalError={error}
                />
            )}
        </div>
    );
};

export default ProductList;