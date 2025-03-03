import React, { useState, useEffect, useRef } from "react";
import { FaEdit, FaTrash, FaUndo } from "react-icons/fa";
import InventoryManagement from "./InventoryManagement";

const Inventory = () => {
    const initialInventoryData = [
        { productName: "Product Name 1", stock: 50, price: "₱ 200.12", profit: "₱ 2000.12", quantitySold: 10, totalAmount: "₱ 2001.20", isArchived: false, createdAt: "03/01/25", updatedAt: "03/02/25" },
        { productName: "Product Name 2", stock: 0, price: "₱ 143.06", profit: "₱ 2000.12", quantitySold: 5, totalAmount: "₱ 715.30", isArchived: false, createdAt: "03/01/25", updatedAt: "03/02/25" },
        { productName: "Product Name 3", stock: 30, price: "₱ 310.22", profit: "₱ 2000.12", quantitySold: 15, totalAmount: "₱ 4653.30", isArchived: false, createdAt: "03/01/25", updatedAt: "03/02/25" },
        { productName: "Product Name 4", stock: 0, price: "₱ 200.12", profit: "₱ 2000.12", quantitySold: 8, totalAmount: "₱ 1600.96", isArchived: false, createdAt: "03/01/25", updatedAt: "03/02/25" },
        { productName: "Product Name 5", stock: 20, price: "₱ 143.06", profit: "₱ 2000.12", quantitySold: 12, totalAmount: "₱ 1716.72", isArchived: false, createdAt: "03/01/25", updatedAt: "03/02/25" },
        { productName: "Product Name 6", stock: 0, price: "₱ 310.22", profit: "₱ 2000.12", quantitySold: 7, totalAmount: "₱ 2171.54", isArchived: false, createdAt: "03/01/25", updatedAt: "03/02/25" },
    ];

    const [inventoryData, setInventoryData] = useState(initialInventoryData);
    const [viewType, setViewType] = useState("active");
    const [managementModalOpen, setManagementModalOpen] = useState(false);
    const [managementType, setManagementType] = useState("");
    const [selectedItem, setSelectedItem] = useState(null);
    const [stock, setStock] = useState(0);
    const [checkedRows, setCheckedRows] = useState({});
    const [isSelectAll, setIsSelectAll] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 5;
    const tableRef = useRef(null);

    useEffect(() => {
        const savedInventory = localStorage.getItem("inventoryItems");
        if (savedInventory) {
            const parsedInventory = JSON.parse(savedInventory).map(item => ({
                ...item,
                isArchived: item.isArchived !== undefined ? item.isArchived : false,
                createdAt: item.createdAt || new Date().toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: '2-digit' }),
                updatedAt: item.updatedAt || new Date().toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: '2-digit' }),
            }));
            setInventoryData(parsedInventory);
        }
        setCheckedRows({});
        setIsSelectAll(false);
    }, [viewType]);

    const getCurrentData = () => {
        if (!inventoryData || inventoryData.length === 0) {
            return [];
        }
        return inventoryData.filter(item => item.isArchived === (viewType === "archived"));
    };

    const currentData = getCurrentData();
    const totalPages = Math.ceil(currentData.length / itemsPerPage);
    const currentItems = currentData.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    );

    const formatStock = (stock) => {
        return stock > 0 ? stock : "Out of stock";
    };

    const getStockClass = (stock) => {
        return stock > 0 ? "in-stock" : "out-stock";
    };

    const handleEdit = (item) => {
        if (viewType !== "active") {
            alert("You can only edit from Active Inventory.");
            return;
        }
        setManagementType("edit");
        setSelectedItem(item);
        setStock(item.stock || 0);
        setManagementModalOpen(true);
    };

    const handleDelete = (itemToDelete = null) => {
        if (viewType !== "active") {
            alert("You can only delete from Active Inventory.");
            return;
        }
        const selectedIndices = Object.keys(checkedRows)
            .filter(index => checkedRows[index])
            .map(index => parseInt(index, 10));

        if (itemToDelete) {
            setManagementType("delete");
            setSelectedItem(itemToDelete);
            setManagementModalOpen(true);
            return;
        }

        const selectedCount = selectedIndices.length;
        if (selectedCount < 1) {
            alert("Please select at least one item to delete.");
            return;
        }

        setManagementType("delete");
        setSelectedItem(currentItems.filter((_, index) => selectedIndices.includes(index)));
        setManagementModalOpen(true);
    };

    const handleRestore = (itemToRestore = null) => {
        if (viewType !== "archived") {
            alert("You can only restore from Archived Inventory.");
            return;
        }
        const selectedIndices = Object.keys(checkedRows)
            .filter(index => checkedRows[index])
            .map(index => parseInt(index, 10));

        if (itemToRestore) {
            setManagementType("restore");
            setSelectedItem(itemToRestore);
            setManagementModalOpen(true);
            return;
        }

        const selectedCount = selectedIndices.length;
        if (selectedCount < 1) {
            alert("Please select at least one item to restore.");
            return;
        }

        setManagementType("restore");
        setSelectedItem(currentItems.filter((_, index) => selectedIndices.includes(index)));
        setManagementModalOpen(true);
    };

    const handleStockChange = (e) => {
        const value = parseInt(e.target.value, 10) || 0;
        setStock(value);
    };

    const handleSaveEdit = (newStock) => {
        if (selectedItem) {
            const updatedInventory = inventoryData.map(item =>
                item.productName === selectedItem.productName ? { ...item, stock: newStock, isArchived: false, updatedAt: new Date().toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: '2-digit' }) } : item
            );
            setInventoryData(updatedInventory);
            localStorage.setItem("inventoryItems", JSON.stringify(updatedInventory));
            setManagementModalOpen(false);
            setSelectedItem(null);
            setStock(0);
            setManagementType("");
            setCheckedRows({});
            setIsSelectAll(false);
        }
    };

    const handleConfirmDeleteOrRestore = (items) => {
        if (managementType === "delete") {
            const updatedInventory = inventoryData.map(item => {
                if (Array.isArray(items)) {
                    if (items.some(selected => selected.productName === item.productName)) {
                        return { ...item, isArchived: true, updatedAt: new Date().toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: '2-digit' }) };
                    }
                } else {
                    if (items.productName === item.productName) {
                        return { ...item, isArchived: true, updatedAt: new Date().toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: '2-digit' }) };
                    }
                }
                return item;
            });
            setInventoryData(updatedInventory);
            localStorage.setItem("inventoryItems", JSON.stringify(updatedInventory));
            setManagementModalOpen(false);
            setSelectedItem(null);
            setManagementType("");
            setCheckedRows({});
            setIsSelectAll(false);
        } else if (managementType === "restore") {
            const updatedInventory = inventoryData.map(item => {
                if (Array.isArray(items)) {
                    if (items.some(selected => selected.productName === item.productName)) {
                        return { ...item, isArchived: false, updatedAt: new Date().toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: '2-digit' }) };
                    }
                } else {
                    if (items.productName === item.productName) {
                        return { ...item, isArchived: false, updatedAt: new Date().toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: '2-digit' }) };
                    }
                }
                return item;
            });
            setInventoryData(updatedInventory);
            localStorage.setItem("inventoryItems", JSON.stringify(updatedInventory));
            setManagementModalOpen(false);
            setSelectedItem(null);
            setManagementType("");
            setCheckedRows({});
            setIsSelectAll(false);
        }
    };

    const handleCloseManagement = () => {
        setManagementModalOpen(false);
        setSelectedItem(null);
        setStock(0);
        setManagementType("");
        setCheckedRows({});
        setIsSelectAll(false);
    };

    const handleSelectAll = (e) => {
        const isChecked = e.target.checked;
        setIsSelectAll(isChecked);
        const newCheckedRows = {};
        if (isChecked) {
            currentItems.forEach((_, index) => {
                newCheckedRows[index] = true;
            });
            if (tableRef.current) {
                tableRef.current.querySelectorAll('.inventory-checkbox').forEach(checkbox => checkbox.checked = true);
            }
        } else {
            if (tableRef.current) {
                tableRef.current.querySelectorAll('.inventory-checkbox').forEach(checkbox => checkbox.checked = false);
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
            (tableRef.current ? Array.from(tableRef.current.querySelectorAll('.inventory-checkbox')).filter(cb => cb.checked).length : 0);
        setIsSelectAll(allChecked);
    };

    const checkedCount = Object.keys(checkedRows).filter(index => checkedRows[index]).length;

    return (
        <div className="Inventory">
            <h2 className="h2">{viewType === "active" ? "Inventory" : "Archived Inventory"}</h2>

            <div className="table-container">
                <div className="inventory-table-header-actions">
                    <div className="search-bar">
                        <input type="text" placeholder="Search" className="search-input" />
                    </div>
                    <div className="button-group" style={{ marginLeft: 'auto' }}>
                        {viewType === "active" && (
                            <button
                                className="delete-button"
                                onClick={() => handleDelete()}
                                disabled={checkedCount < 2} 
                            >
                                Delete
                            </button>
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
                            Active Inventory
                        </button>
                        <button
                            className={`view-button ${viewType === "archived" ? "active" : ""}`}
                            onClick={() => setViewType("archived")}
                        >
                            Archived Inventory
                        </button>
                    </div>
                </div>
                <table ref={tableRef} className="recently-sold">
                    <thead>
                        <tr className="thead">
                            <th className="th">
                                <input type="checkbox" className="inventory-checkbox" checked={isSelectAll} onChange={handleSelectAll} />
                            </th>
                            <th className="th">Action</th>
                            <th className="th">Product Name</th>
                            <th className="th">Status</th>
                            <th className="th">Price</th>
                            <th className="th">Quantity Sold</th>
                            <th className="th">Total Amount</th>
                            <th className="th">Profit</th>
                            <th className="th">Created At</th>
                            <th className="th">Updated At</th>
                        </tr>
                    </thead>
                    <tbody>
                        {currentItems.length > 0 ? (
                            currentItems.map((item, index) => (
                                <tr className="tr" key={index}>
                                    <td className="td">
                                        <input type="checkbox" className="inventory-checkbox" onChange={(e) => handleRowCheckbox(index, e)} />
                                    </td>
                                    <td className="td">
                                        <div className="action-buttons">
                                            {viewType === "active" ? (
                                                <>
                                                    <FaEdit
                                                        className="edit-icon"
                                                        size={20}
                                                        onClick={() => handleEdit(item)}
                                                    />
                                                    <FaTrash
                                                        className="delete-icon"
                                                        size={20}
                                                        onClick={() => handleDelete(item)}
                                                    />
                                                </>
                                            ) : (
                                                <FaUndo
                                                    className="restore-icon"
                                                    size={20}
                                                    onClick={() => handleRestore(item)}
                                                />
                                            )}
                                        </div>
                                    </td>
                                    <td className="td">{item.productName.replace(/\n/g, ' ')}</td>
                                    <td className={`td status ${getStockClass(item.stock)}`}>
                                        {formatStock(item.stock)}
                                    </td>
                                    <td className="td">{item.price}</td>
                                    <td className="td inventory-quantity-sold">{item.quantitySold}</td>
                                    <td className="td inventory-total-amount">{item.totalAmount}</td>
                                    <td className="td">{item.profit}</td>
                                    <td className="td">{item.createdAt}</td>
                                    <td className="td">{item.updatedAt}</td>
                                </tr>
                            ))
                        ) : (
                            <tr className="tr">
                                <td colSpan="10" className="td">No items available.</td>
                            </tr>
                        )}
                    </tbody>
                </table>
                <div className="inventory-pagination">
                    <button
                        onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                        disabled={currentPage === 1}
                    >
                        Previous
                    </button>
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                        <button
                            key={page}
                            onClick={() => setCurrentPage(page)}
                            className={currentPage === page ? "active" : ""}
                        >
                            {page}
                        </button>
                    ))}
                    <button
                        onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                        disabled={currentPage === totalPages}
                    >
                        Next
                    </button>
                </div>
            </div>

            {managementModalOpen && (
                <InventoryManagement
                    type={managementType}
                    item={selectedItem}
                    stock={stock}
                    onClose={handleCloseManagement}
                    onSave={handleSaveEdit}
                    onConfirm={handleConfirmDeleteOrRestore}
                />
            )}
        </div>
    );
};

export default Inventory;