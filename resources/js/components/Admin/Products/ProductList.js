import React, { useState, useEffect, useRef } from "react";
import { FaEdit, FaTrash, FaUndo } from "react-icons/fa";
import ProductManagement from "./ProductManagement";
import Axios from 'axios';

const ProductList = () => {
    const [checkedRows, setCheckedRows] = useState({});
    const [isSelectAll, setIsSelectAll] = useState(false);
    const [viewType, setViewType] = useState("active");
    const [managementModalOpen, setManagementModalOpen] = useState(false);
    const [managementType, setManagementType] = useState("");
    const [selectedProduct, setSelectedProduct] = useState(null);
    const [error, setError] = useState("");
    const [forceUpdate, setForceUpdate] = useState(0);
    const [currentPage, setCurrentPage] = useState(1);
    const [searchQuery, setSearchQuery] = useState("");
    const [products, setProducts] = useState([]);
    const [totalPages, setTotalPages] = useState(1);
    const [isLoading, setIsLoading] = useState(true);
    const tableRef = useRef(null);
    const itemsPerPage = 5;

    useEffect(() => {
        console.log("ProductList component mounted");
    }, []);

    useEffect(() => {
        console.log("State changed:", {
            managementModalOpen,
            managementType,
            selectedProduct,
        });
    }, [managementModalOpen, managementType, selectedProduct]);

    useEffect(() => {
        const fetchProducts = async () => {
            try {
                console.log("Fetching products from /api/products...", {
                    page: currentPage,
                    per_page: itemsPerPage,
                    status: viewType,
                });
                const response = await Axios.get('/api/products', {
                    params: {
                        page: currentPage,
                        per_page: itemsPerPage,
                        status: viewType,
                    },
                });
                console.log("API Response:", response.data);
                console.log("Setting products:", response.data.data || []);
                setProducts(response.data.data || []);
                setTotalPages(response.data.last_page || 1);
            } catch (error) {
                console.error("Error fetching products:", error);
                console.error("Error response:", error.response?.data);
                console.error("Error status:", error.response?.status);
                setError(`Failed to load products: ${error.response?.data?.message || error.message}`);
                setProducts([]);
            } finally {
                setIsLoading(false);
            }
        };
        fetchProducts();
    }, [viewType, currentPage, forceUpdate]);

    const getCurrentData = () => {
        console.log("products:", products);
        console.log("viewType:", viewType);
        console.log("searchQuery:", searchQuery);

        if (!products || products.length === 0) {
            console.warn("No products data available, returning empty array.");
            return [];
        }

        let filteredProducts = products;

        if (searchQuery.trim()) {
            filteredProducts = filteredProducts.filter(product =>
                product.product_name.toLowerCase().includes(searchQuery.toLowerCase())
            );
        }

        console.log("filteredProducts:", filteredProducts);
        return filteredProducts;
    };

    const currentData = getCurrentData();

    const handleSelectAll = (e) => {
        const isChecked = e.target.checked;
        setIsSelectAll(isChecked);
        const newCheckedRows = {};
        currentData.forEach(product => {
            newCheckedRows[product.id] = isChecked;
        });
        setCheckedRows(newCheckedRows);
        if (tableRef.current) {
            tableRef.current.querySelectorAll('.product-checkbox').forEach(checkbox => {
                checkbox.checked = isChecked;
            });
        }
    };

    const handleRowCheckbox = (product, e) => {
        setCheckedRows(prev => ({
            ...prev,
            [product.id]: e.target.checked
        }));
        setIsSelectAll(currentData.every(item => checkedRows[item.id] || (item.id === product.id && e.target.checked)));
    };

    const getSelectedItems = (singleItem = null) => {
        if (singleItem) return [singleItem];
        return currentData.filter(product => checkedRows[product.id]);
    };

    const handleArchive = (productToArchive = null) => {
        console.log("Attempting to archive - viewType:", viewType, "productToArchive:", productToArchive, "checkedRows:", checkedRows);
        const selectedItems = getSelectedItems(productToArchive);
        if (viewType !== "active") {
            alert("You can only archive from Active Products.");
            return;
        }
        if (!selectedItems.length) {
            alert("Please select at least one product to archive.");
            return;
        }
        setManagementType("archive");
        setSelectedProduct(selectedItems);
        setManagementModalOpen(true);
    };

    const handleRestore = (productToRestore = null) => {
        console.log("Attempting to restore - viewType:", viewType, "productToRestore:", productToRestore, "checkedRows:", checkedRows);
        const selectedItems = getSelectedItems(productToRestore);
        if (viewType !== "archived") {
            alert("You can only restore from Archived Products.");
            return;
        }
        if (!selectedItems.length) {
            alert("Please select at least one product to restore.");
            return;
        }
        setManagementType("restore");
        setSelectedProduct(selectedItems);
        setManagementModalOpen(true);
    };

    const handleAdd = (e) => {
        e.stopPropagation(); // Prevent event bubbling
        console.log("Add button clicked!");
        console.log("Current viewType:", viewType, "Opening Add modal");
        setManagementType("add");
        setSelectedProduct(null);
        setManagementModalOpen(true);
        console.log("State updated:", {
            managementType: "add",
            selectedProduct: null,
            managementModalOpen: true,
        });
    };

    const handleEdit = (product) => {
        console.log("Opening edit for product:", product);
        setSelectedProduct(product);
        setManagementType("edit");
        setManagementModalOpen(true);
    };

    const handleSearchChange = (e) => {
        setSearchQuery(e.target.value);
        setCurrentPage(1);
    };

    const handleConfirmDeleteOrRestore = async (items) => {
        console.log("Confirming action - managementType:", managementType, "items:", items);
        if (!items?.length) {
            setError(`Please select at least one product to ${managementType}.`);
            return;
        }
        try {
            const productIds = items.map(item => parseInt(item.id, 10));
            console.log("productIds after mapping:", productIds);
            console.log(`${managementType} payload:`, { ids: productIds });

            if (managementType === "archive") {
                const response = await Axios.put('/api/products/archive', { ids: productIds }, {
                    headers: {
                        'Content-Type': 'application/json',
                    },
                });
                console.log("Archive response:", response.data);
            } else if (managementType === "restore") {
                const response = await Axios.put('/api/products/restore', { ids: productIds }, {
                    headers: {
                        'Content-Type': 'application/json',
                    },
                });
                console.log("Restore response:", response.data);
            }
            setForceUpdate(prev => prev + 1);
            setCheckedRows({});
            setIsSelectAll(false);
            if (tableRef.current) {
                tableRef.current.querySelectorAll('.product-checkbox').forEach(checkbox => checkbox.checked = false);
            }
            setManagementModalOpen(false);
            if (currentData.length <= itemsPerPage) setCurrentPage(1);
        } catch (error) {
            console.error(`Error ${managementType}ing products:`, error);
            console.error("Error response data:", error.response?.data);
            console.error("Error status:", error.response?.status);
            setError(`Failed to ${managementType} products: ${JSON.stringify(error.response?.data) || error.message}`);
        }
    };

    const handleCloseManagement = () => {
        setManagementModalOpen(false);
        setManagementType("");
        setSelectedProduct(null);
        setError("");
    };

    const handleSaveEditOrAdd = () => {
        console.log("Saving product, re-fetching products...");
        setForceUpdate(prev => prev + 1);
        setManagementModalOpen(false);
        setManagementType("");
        setSelectedProduct(null);
    };

    const checkedCount = Object.values(checkedRows).filter(Boolean).length;

    return (
        <div className="ProductList">
            <h2 className="products-header">{viewType === "active" ? "Active Products" : "Archived Products"}</h2>
            {error && <p className="error-message">{error}</p>}
            {isLoading ? (
                <p>Loading products...</p>
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
                                        className="delete-button"
                                        onClick={() => handleArchive()}
                                        disabled={checkedCount < 1}
                                    >
                                        Delete
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
                                Active Products
                            </button>
                            <button
                                className={`view-button ${viewType === "archived" ? "active" : ""}`}
                                onClick={() => setViewType("archived")}
                            >
                                Archived Products
                            </button>
                        </div>
                    </div>
                    <table ref={tableRef} className="products-table">
                        <thead>
                            <tr className="table-header-row">
                                <th className="table-header">
                                    <input type="checkbox" className="product-checkbox" checked={isSelectAll} onChange={handleSelectAll} />
                                </th>
                                <th className="table-header products-action-column">Action</th>
                                <th className="table-header">Product Name</th>
                                <th className="table-header">Description</th>
                                <th className="table-header">Category</th>
                                <th className="table-header">Color</th>
                                <th className="table-header">Wrist Measurement</th>
                                <th className="table-header">Stock</th>
                                <th className="table-header">Price</th>
                                <th className="table-header">Created At</th>
                                <th className="table-header">Updated At</th>
                            </tr>
                        </thead>
                        <tbody>
                            {currentData.length > 0 ? (
                                currentData.map(product => (
                                    <tr className="table-row" key={product.id}>
                                        <td className="table-cell">
                                            <input
                                                type="checkbox"
                                                className="product-checkbox"
                                                checked={!!checkedRows[product.id]}
                                                onChange={e => handleRowCheckbox(product, e)}
                                            />
                                        </td>
                                        <td className="table-cell products-action-column">
                                            <div className="action-buttons">
                                                {viewType === "active" ? (
                                                    <>
                                                        <FaEdit className="edit-icon" size={20} onClick={() => handleEdit(product)} />
                                                        <FaTrash className="delete-icon" size={20} onClick={() => handleArchive(product)} />
                                                    </>
                                                ) : (
                                                    <FaUndo className="restore-icon" size={20} onClick={() => handleRestore(product)} />
                                                )}
                                            </div>
                                        </td>
                                        <td className="table-cell">{product.product_name}</td>
                                        <td className="table-cell">{product.description || '-'}</td>
                                        <td className="table-cell">{product.category || '-'}</td>
                                        <td className="table-cell">{product.color || '-'}</td>
                                        <td className="table-cell">{product.wrist_measurement || '-'}</td>
                                        <td className="table-cell">{product.stock}</td>
                                        <td className="table-cell">{product.price}</td>
                                        <td className="table-cell">{product.created_at}</td>
                                        <td className="table-cell">{product.updated_at}</td>
                                    </tr>
                                ))
                            ) : (
                                <tr className="table-row">
                                    <td colSpan="11" className="table-cell" style={{ textAlign: "center", padding: "20px", backgroundColor: "#f9f9f9" }}>
                                        {products.length === 0
                                            ? "No products available."
                                            : viewType === "active"
                                            ? "No active products match your search."
                                            : "No archived products match your search."}
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
                <div>
                    {console.log("Rendering ProductManagement modal with type:", managementType)}
                    <ProductManagement
                        type={managementType}
                        product={managementType === "edit" || managementType === "add" ? selectedProduct : null}
                        selectedProducts={managementType === "restore" || managementType === "archive" ? selectedProduct : []}
                        onClose={handleCloseManagement}
                        onConfirm={handleConfirmDeleteOrRestore}
                        onSave={handleSaveEditOrAdd}
                    />
                </div>
            )}
        </div>
    );
};

export default ProductList;