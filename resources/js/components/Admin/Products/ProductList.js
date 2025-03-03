import React, { useState, useEffect, useRef } from "react";
import { FaEdit, FaTrash, FaUndo } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import ProductManagement from "./ProductManagement";

const ProductList = () => {
    const [viewType, setViewType] = useState("active");
    const [activeCheckedRows, setActiveCheckedRows] = useState({});
    const [activeIsSelectAll, setActiveIsSelectAll] = useState(false);
    const [archivedCheckedRows, setArchivedCheckedRows] = useState({});
    const [archivedIsSelectAll, setArchivedIsSelectAll] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const [managementModalOpen, setManagementModalOpen] = useState(false);
    const [managementType, setManagementType] = useState("");
    const [selectedProduct, setSelectedProduct] = useState(null);
    const [searchQuery, setSearchQuery] = useState("");
    const itemsPerPage = 5;

    const navigate = useNavigate();
    const tableRef = useRef(null);

    const initialProducts = [
        { id: 1, name: "Product Name", description: "Product Description", stock: "1x", price: "₱200.12", isArchived: false, image: "watchprod.svg", createdAt: "03/01/25", updatedAt: "03/02/25", category: "Men", color: "Black", wristMeasurement: "18cm" },
        { id: 2, name: "Product Name", description: "Product Description", stock: "1x", price: "₱143.06", isArchived: false, image: "watchprod.svg", createdAt: "03/01/25", updatedAt: "03/02/25", category: "Women", color: "Silver", wristMeasurement: "16cm" },
        { id: 3, name: "Product Name", description: "Product Description", stock: "2x", price: "₱310.22", isArchived: false, image: "watchprod.svg", createdAt: "03/01/25", updatedAt: "03/02/25", category: "Unisex", color: "Gold", wristMeasurement: "20cm" },
        { id: 4, name: "Product Name", description: "Product Description", stock: "1x", price: "₱176.54", isArchived: false, image: "watchprod.svg", createdAt: "03/01/25", updatedAt: "03/02/25", category: "Men", color: "Blue", wristMeasurement: "19cm" },
        { id: 5, name: "Product Name", description: "Product Description", stock: "1x", price: "₱200.12", isArchived: false, image: "watchprod.svg", createdAt: "03/01/25", updatedAt: "03/02/25", category: "Women", color: "Rose Gold", wristMeasurement: "17cm" },
        { id: 6, name: "Product Name", description: "Product Description", stock: "1x", price: "₱143.06", isArchived: false, image: "watchprod.svg", createdAt: "03/01/25", updatedAt: "03/02/25", category: "Unisex", color: "Black", wristMeasurement: "18cm" },
        { id: 7, name: "Product Name", description: "Product Description", stock: "2x", price: "₱310.22", isArchived: false, image: "watchprod.svg", createdAt: "03/01/25", updatedAt: "03/02/25", category: "Men", color: "Silver", wristMeasurement: "20cm" },
    ];

    const [products, setProducts] = useState(initialProducts);

    useEffect(() => {
        const savedProducts = localStorage.getItem("products");
        if (savedProducts) {
            const parsedProducts = JSON.parse(savedProducts);
            const activeProducts = parsedProducts.map(product => ({
                ...product,
                isArchived: false,
                createdAt: product.createdAt || new Date().toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: '2-digit' }),
                updatedAt: product.updatedAt || new Date().toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: '2-digit' }),
                category: product.category || "Unisex",
                color: product.color || "Black",
                wristMeasurement: product.wristMeasurement || "18cm",
                image: product.image || "watchprod.svg"
            }));
            setProducts(activeProducts);
        } else {
            setProducts(initialProducts);
            localStorage.setItem("products", JSON.stringify(initialProducts));
        }
        setActiveCheckedRows({});
        setActiveIsSelectAll(false);
        setArchivedCheckedRows({});
        setArchivedIsSelectAll(false);
    }, []);

    const getCurrentData = () => {
        let filteredProducts = products.filter(product => product.isArchived === (viewType === "archived"));
        if (searchQuery.trim()) {
            const query = searchQuery.toLowerCase();
            filteredProducts = filteredProducts.filter(product =>
                product.name.toLowerCase().includes(query) ||
                product.description.toLowerCase().includes(query) ||
                product.stock.toLowerCase().includes(query) ||
                product.price.toLowerCase().includes(query) ||
                product.category.toLowerCase().includes(query) ||
                product.color.toLowerCase().includes(query) ||
                product.wristMeasurement.toLowerCase().includes(query) ||
                product.updatedAt.toLowerCase().includes(query)
            );
        }
        return filteredProducts;
    };

    const currentData = getCurrentData();
    const totalPages = Math.ceil(currentData.length / itemsPerPage);
    const currentItems = currentData.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    );

    const handleSelectAll = (e) => {
        const isChecked = e.target.checked;
        if (viewType === "active") {
            setActiveIsSelectAll(isChecked);
            const newCheckedRows = {};
            if (isChecked) {
                currentItems.forEach((_, index) => {
                    newCheckedRows[index] = true;
                });
                if (tableRef.current) {
                    tableRef.current.querySelectorAll('.product-checkbox').forEach(checkbox => checkbox.checked = true);
                }
            } else {
                if (tableRef.current) {
                    tableRef.current.querySelectorAll('.product-checkbox').forEach(checkbox => checkbox.checked = false);
                }
            }
            setActiveCheckedRows(newCheckedRows);
            console.log("Active checked rows updated:", newCheckedRows);
        } else if (viewType === "archived") {
            setArchivedIsSelectAll(isChecked);
            const newCheckedRows = {};
            if (isChecked) {
                currentItems.forEach((_, index) => {
                    newCheckedRows[index] = true;
                });
                if (tableRef.current) {
                    tableRef.current.querySelectorAll('.product-checkbox').forEach(checkbox => checkbox.checked = true);
                }
            } else {
                if (tableRef.current) {
                    tableRef.current.querySelectorAll('.product-checkbox').forEach(checkbox => checkbox.checked = false);
                }
            }
            setArchivedCheckedRows(newCheckedRows);
            console.log("Archived checked rows updated:", newCheckedRows);
        }
    };

    const handleRowCheckbox = (index, e) => {
        const isChecked = e.target.checked;
        if (viewType === "active") {
            setActiveCheckedRows((prev) => ({
                ...prev,
                [index]: isChecked,
            }));
            const allChecked = currentItems.length === 
                (tableRef.current ? Array.from(tableRef.current.querySelectorAll('.product-checkbox')).filter(cb => cb.checked).length : 0);
            setActiveIsSelectAll(allChecked);
            console.log("Active row checkbox updated, index:", index, "Checked:", isChecked);
        } else if (viewType === "archived") {
            setArchivedCheckedRows((prev) => ({
                ...prev,
                [index]: isChecked,
            }));
            const allChecked = currentItems.length === 
                (tableRef.current ? Array.from(tableRef.current.querySelectorAll('.product-checkbox')).filter(cb => cb.checked).length : 0);
            setArchivedIsSelectAll(allChecked);
            console.log("Archived row checkbox updated, index:", index, "Checked:", isChecked);
        }
    };

    const handleDelete = (productToDelete = null) => {
        const selectedIndices = viewType === "active" ? Object.keys(activeCheckedRows)
            .filter(index => activeCheckedRows[index])
            .map(index => parseInt(index, 10)) : [];

        if (productToDelete) {
            if (viewType !== "active") {
                alert("You can only delete from Active Products.");
                return;
            }
            setManagementType("delete");
            setSelectedProduct([productToDelete]);
            setManagementModalOpen(true);
            return;
        }

        const selectedCount = selectedIndices.length;
        if (selectedCount < 2) {
            return;
        }

        if (viewType !== "active") {
            alert("You can only delete from Active Products.");
            return;
        }

        setManagementType("delete");
        setSelectedProduct(getSelectedProducts());
        setManagementModalOpen(true);
    };

    const handleRestore = (productToRestore = null) => {
        const selectedIndices = viewType === "archived" ? Object.keys(archivedCheckedRows)
            .filter(index => archivedCheckedRows[index])
            .map(index => parseInt(index, 10)) : [];

        if (productToRestore) {
            if (viewType !== "archived") {
                alert("You can only restore from Archived Products.");
                return;
            }
            setManagementType("restore");
            setSelectedProduct([productToRestore]);
            setManagementModalOpen(true);
            return;
        }

        const selectedCount = selectedIndices.length;
        if (selectedCount < 2) {
            return;
        }

        if (viewType !== "archived") {
            alert("You can only restore from Archived Products.");
            return;
        }

        setManagementType("restore");
        setSelectedProduct(getSelectedProducts());
        setManagementModalOpen(true);
    };

    const handleAdd = () => {
        if (viewType !== "active") {
            alert("You can only add products to Active Products.");
            return;
        }
        setManagementType("add");
        setSelectedProduct(null);
        setManagementModalOpen(true);
    };

    const handleEdit = (product) => {
        setSelectedProduct(product);
        setManagementType("edit");
        setManagementModalOpen(true);
        console.log("Opening edit for product:", product);
    };

    const handleConfirmDeleteOrRestore = (items) => {
        if (managementType === "delete") {
            const updatedProducts = products.map(product => {
                if (Array.isArray(items)) {
                    if (items.some(item => item.id === product.id)) {
                        return { ...product, isArchived: true, updatedAt: new Date().toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: '2-digit' }) };
                    }
                } else {
                    if (items.id === product.id) {
                        return { ...product, isArchived: true, updatedAt: new Date().toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: '2-digit' }) };
                    }
                }
                return product;
            });
            setProducts(updatedProducts);
            setActiveCheckedRows({});
            setActiveIsSelectAll(false);
            if (tableRef.current && viewType === "active") {
                tableRef.current.querySelectorAll('.product-checkbox').forEach(checkbox => checkbox.checked = false);
            }
            setManagementModalOpen(false);
            if (currentData.length === 0) {
                setCurrentPage(1);
            }
            console.log("Deleted products, updated products:", updatedProducts);
            localStorage.setItem("products", JSON.stringify(updatedProducts));
        } else if (managementType === "restore") {
            const updatedProducts = products.map(product => {
                if (Array.isArray(items)) {
                    if (items.some(item => item.id === product.id)) {
                        return { ...product, isArchived: false, updatedAt: new Date().toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: '2-digit' }) };
                    }
                } else {
                    if (items.id === product.id) {
                        return { ...product, isArchived: false, updatedAt: new Date().toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: '2-digit' }) };
                    }
                }
                return product;
            });
            setProducts(updatedProducts);
            setArchivedCheckedRows({});
            setArchivedIsSelectAll(false);
            if (tableRef.current && viewType === "archived") {
                tableRef.current.querySelectorAll('.product-checkbox').forEach(checkbox => checkbox.checked = false);
            }
            setManagementModalOpen(false);
            if (currentData.length === 0) {
                setCurrentPage(1);
            }
            console.log("Restored products, updated products:", updatedProducts);
            localStorage.setItem("products", JSON.stringify(updatedProducts));
        }
    };

    const handleCloseManagement = () => {
        setManagementModalOpen(false);
        setManagementType("");
        setSelectedProduct(null);
        console.log("Closed management modal");
    };

    const handleSearchChange = (e) => {
        setSearchQuery(e.target.value);
        setCurrentPage(1);
    };

    const getSelectedProducts = () => {
        const selectedIndices = viewType === "active" ? Object.keys(activeCheckedRows)
            .filter(index => activeCheckedRows[index])
            .map(index => parseInt(index, 10)) : Object.keys(archivedCheckedRows)
            .filter(index => archivedCheckedRows[index])
            .map(index => parseInt(index, 10));
        return selectedIndices.map(index => currentItems[index]);
    };

    const isSelectAll = viewType === "active" ? activeIsSelectAll : archivedIsSelectAll;
    const checkedCount = viewType === "active" ? Object.keys(activeCheckedRows).filter(index => activeCheckedRows[index]).length : Object.keys(archivedCheckedRows).filter(index => archivedCheckedRows[index]).length;

    if (!products || products.length === 0) {
        return (
            <div className="products-container">
                <h2 className="products-header">Products</h2>
                <div className="table-container">
                    <p>No products available. Please check your data or refresh the page.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="products-container">
            <h2 className="products-header">{viewType === "active" ? "Active Products" : "Archived Products"}</h2>

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
                                    disabled={checkedCount < 2}
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
                <table ref={tableRef} className={`products-table ${viewType === "archived" ? 'view-type="archived"' : 'view-type="active"'}`}>
                    <thead>
                        <tr className="table-header-row">
                            <th className="table-header">
                                <input type="checkbox" className="product-checkbox" checked={isSelectAll} onChange={handleSelectAll} />
                            </th>
                            <th className="table-header products-action-column">Action</th>
                            <th className="table-header"></th>
                            <th className="table-header product-name-column">Product Name</th>
                            <th className="table-header product-description-column">Description</th>
                            <th className="table-header product-category-column">Category</th>
                            <th className="table-header product-color-column">Color</th>
                            <th className="table-header product-wrist-column">Wrist Measurement</th>
                            <th className="table-header product-stock-column">Stocks</th>
                            <th className="table-header product-price-column">Price</th>
                            <th className="table-header product-created-column">Created At</th>
                            <th className="table-header product-updated-column">Updated At</th>
                        </tr>
                    </thead>
                    <tbody>
                        {currentItems.length > 0 ? currentItems.map((product, index) => (
                            <tr className={`table-row ${viewType === "archived" ? 'view-type="archived"' : ''}`} key={product.id}>
                                <td className="table-cell">
                                    <input type="checkbox" className="product-checkbox" onChange={(e) => handleRowCheckbox(index, e)} />
                                </td>
                                <td className="table-cell products-action-column">
                                    <div className="action-buttons">
                                        {viewType === "active" ? (
                                            <>
                                                <FaEdit className="edit-icon" size={16} onClick={() => handleEdit(product)} />
                                                <FaTrash className="delete-icon" size={16} onClick={() => handleDelete(product)} />
                                            </>
                                        ) : (
                                            <FaUndo className="restore-icon" size={16} onClick={() => handleRestore(product)} />
                                        )}
                                    </div>
                                </td>
                                <td className="table-cell">
                                    <img src={`/images/${product.image || "watchprod.svg"}`} alt={`${product.name} image`} className="product-image" />
                                </td>
                                <td className="table-cell product-name-column">{product.name}</td>
                                <td className="table-cell product-description-column">{product.description}</td>
                                <td className="table-cell product-category-column">{product.category}</td>
                                <td className="table-cell product-color-column">{product.color}</td>
                                <td className="table-cell product-wrist-column">{product.wristMeasurement}</td>
                                <td className="table-cell product-stock-column">{product.stock}</td>
                                <td className="table-cell product-price-column">{product.price}</td>
                                <td className="table-cell product-created-column">{product.createdAt}</td>
                                <td className="table-cell product-updated-column">{product.updatedAt}</td>
                            </tr>
                        )) : (
                            <tr className="table-row">
                                <td colSpan="12" className="table-cell" style={{ textAlign: "center", padding: "20px", backgroundColor: "#f9f9f9" }}>
                                    {viewType === "active" ? "No products available." : "No archived products available."}
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
                <ProductManagement
                    type={managementType}
                    product={managementType === "edit" || managementType === "add" ? selectedProduct : (managementType === "restore" && !Array.isArray(selectedProduct) ? selectedProduct : null)}
                    selectedProducts={managementType === "delete" || (managementType === "restore" && Array.isArray(selectedProduct)) ? (selectedProduct || getSelectedProducts()) : []}
                    onClose={handleCloseManagement}
                    onConfirm={handleConfirmDeleteOrRestore}
                    onSave={(newOrUpdatedProduct) => {
                        if (managementType === "edit") {
                            const updatedProducts = products.map(p => p.id === newOrUpdatedProduct.id ? newOrUpdatedProduct : p);
                            setProducts(updatedProducts);
                            localStorage.setItem("products", JSON.stringify(updatedProducts));
                        } else if (managementType === "add") {
                            const updatedProducts = [{ ...newOrUpdatedProduct, createdAt: newOrUpdatedProduct.createdAt || new Date().toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: '2-digit' }), updatedAt: newOrUpdatedProduct.updatedAt || new Date().toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: '2-digit' }), category: newOrUpdatedProduct.category || "Unisex", color: newOrUpdatedProduct.color || "Black", wristMeasurement: newOrUpdatedProduct.wristMeasurement || "18cm" }, ...products.filter(p => !p.isArchived)];
                            setProducts(updatedProducts);
                            localStorage.setItem("products", JSON.stringify(updatedProducts));
                        }
                        setManagementModalOpen(false);
                        setCurrentPage(1);
                    }}
                />
            )}
        </div>
    );
};

export default ProductList;