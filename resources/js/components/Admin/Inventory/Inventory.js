import React, { useState, useEffect, useRef } from "react";
import { FaEdit, FaTrash, FaUndo } from "react-icons/fa";
import InventoryManagement from "./InventoryManagement";
import Axios from "axios";

Axios.defaults.baseURL = "http://localhost:8000";

const Inventory = () => {
    const [inventoryData, setInventoryData] = useState([]);
    const [viewType, setViewType] = useState("active");
    const [managementModalOpen, setManagementModalOpen] = useState(false);
    const [managementType, setManagementType] = useState("");
    const [selectedItem, setSelectedItem] = useState(null);
    const [stock, setStock] = useState(0);
    const [checkedRows, setCheckedRows] = useState({});
    const [isSelectAll, setIsSelectAll] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState("");
    const itemsPerPage = 5;
    const tableRef = useRef(null);

   const timeZoneOffset = 8;

    const formatDate = (dateString) => {
        if (!dateString) return "N/A";
        try {
            const date = new Date(dateString);
             date.setHours(date.getHours() + timeZoneOffset);
            return date.toLocaleDateString("en-US", { year: 'numeric', month: 'long', day: 'numeric' });
        } catch (e) { console.error("Error formatting date:", dateString, e); return "Invalid Date"; }
    };

    const formatTime = (dateString) => {
        if (!dateString) return "N/A";
        try {
            const date = new Date(dateString);
            date.setHours(date.getHours() + timeZoneOffset);
            return date.toLocaleTimeString("en-US", { hour: 'numeric', minute: 'numeric', hour12: true });
        } catch (e) { console.error("Error formatting time:", dateString, e); return "Invalid Time"; }
    };

    useEffect(() => {
        const fetchInventory = async () => {
            try {
                setIsLoading(true);
                setError("");
                const response = await Axios.get("/api/inventories", {
                    params: { page: currentPage, per_page: itemsPerPage, status: viewType }
                });

                if (response.data && response.data.data) {
                    const formattedData = response.data.data.map((item) => ({
                        id: item.id,
                        productName: item.product_name,
                        stock: item.stocks,
                        price: `₱ ${parseFloat(item.price).toFixed(2)}`,
                        // profit data mapping removed
                        quantitySold: item.quantity_sold,
                        totalAmount: `₱ ${parseFloat(item.total_amount).toFixed(2)}`,
                        isArchived: item.status === 0,
                        createdAtDate: formatDate(item.created_at),
                        createdAtTime: formatTime(item.created_at),
                        updatedAtDate: formatDate(item.updated_at),
                        updatedAtTime: formatTime(item.updated_at),
                        imageUrl: item.product?.image_url,
                    }));
                    setInventoryData(formattedData);
                    setTotalPages(response.data.last_page || 1);
                } else {
                    setError("Invalid data received from the server.");
                    setInventoryData([]); setTotalPages(1);
                }
            } catch (error) {
                setError(`Failed to load inventory: ${error.response?.data?.message || error.message}`);
                setInventoryData([]); setTotalPages(1);
            } finally {
                setIsLoading(false);
            }
        };

        fetchInventory();
        setCheckedRows({});
        setIsSelectAll(false);
    }, [viewType, currentPage]);

    const getCurrentData = () => {
        if (!inventoryData || inventoryData.length === 0) return [];
        return inventoryData;
    };

    const currentData = getCurrentData();
    const currentItems = currentData;

    const formatStock = (stockValue) => stockValue > 0 ? stockValue : "Out of stock";
    const getStockClass = (stockValue) => stockValue > 0 ? "in-stock" : "out-stock";

    const handleEditStocks = (item) => {
        if (viewType !== "active") { alert("You can only edit stocks from Active Inventory."); return; }
        setManagementType("edit"); setSelectedItem(item); setStock(item.stock || 0); setManagementModalOpen(true);
    };

    const handleDelete = (itemToDelete = null) => {
        if (viewType !== "active") { alert("You can only delete from Active Inventory."); return; }
        const selectedIndices = Object.keys(checkedRows).filter((index) => checkedRows[index]).map((index) => parseInt(index, 10));
        if (itemToDelete) { setManagementType("delete"); setSelectedItem([itemToDelete]); setManagementModalOpen(true); return; }
        const selectedCount = selectedIndices.length;
        if (selectedCount < 1) { alert("Please select at least one item to delete."); return; }
        setManagementType("delete"); setSelectedItem(currentItems.filter((_, index) => selectedIndices.includes(index))); setManagementModalOpen(true);
    };

    const handleRestore = (itemToRestore = null) => {
        if (viewType !== "archived") { alert("You can only restore from Archived Inventory."); return; }
        const selectedIndices = Object.keys(checkedRows).filter((index) => checkedRows[index]).map((index) => parseInt(index, 10));
        if (itemToRestore) { setManagementType("restore"); setSelectedItem([itemToRestore]); setManagementModalOpen(true); return; }
        const selectedCount = selectedIndices.length;
        if (selectedCount < 1) { alert("Please select at least one item to restore."); return; }
        setManagementType("restore"); setSelectedItem(currentItems.filter((_, index) => selectedIndices.includes(index))); setManagementModalOpen(true);
    };

    const handleStockChange = (e) => { setStock(parseInt(e.target.value, 10) || 0); };

    const handleSaveEdit = async (newStock) => {
        if (!selectedItem) { alert("No item selected for editing."); return; }
        try {
            await Axios.put(`/api/inventories/${selectedItem.id}/stocks`, { stocks: newStock });
            const response = await Axios.get("/api/inventories", { params: { page: currentPage, per_page: itemsPerPage, status: viewType } });
            if (response.data && response.data.data) {
                const formattedData = response.data.data.map((item) => ({
                    id: item.id,
                    productName: item.product_name,
                    stock: item.stocks,
                    price: `₱ ${parseFloat(item.price).toFixed(2)}`,
                    // profit data mapping removed
                    quantitySold: item.quantity_sold,
                    totalAmount: `₱ ${parseFloat(item.total_amount).toFixed(2)}`,
                    isArchived: item.status === 0,
                    createdAtDate: formatDate(item.created_at),
                    createdAtTime: formatTime(item.created_at),
                    updatedAtDate: formatDate(item.updated_at),
                    updatedAtTime: formatTime(item.updated_at),
                    imageUrl: item.product?.image_url,
                }));
                setInventoryData(formattedData); setTotalPages(response.data.last_page || 1);
            } else { setError("Invalid data received after update."); }
            alert("Stocks updated successfully.");
        } catch (error) { setError(`Failed to update stocks: ${error.response?.data?.message || error.message}`);
        } finally { handleCloseManagement(); }
    };

    const handleConfirmDeleteOrRestore = async (items) => {
        if (!items || items.length === 0) { alert("No items selected."); return; }
        const itemIds = items.map((item) => item.id);
        try {
            const actionUrl = managementType === "delete" ? "/api/inventories/archive" : "/api/inventories/restore";
            const successMessage = managementType === "delete" ? "archived" : "restored";
            await Axios.put(actionUrl, { ids: itemIds });
            alert(`Inventory records ${successMessage} successfully.`);
            const response = await Axios.get("/api/inventories", { params: { page: currentPage, per_page: itemsPerPage, status: viewType } });
            if (response.data && response.data.data) {
                const formattedData = response.data.data.map((item) => ({
                    id: item.id,
                    productName: item.product_name,
                    stock: item.stocks,
                    price: `₱ ${parseFloat(item.price).toFixed(2)}`,
                    // profit data mapping removed
                    quantitySold: item.quantity_sold,
                    totalAmount: `₱ ${parseFloat(item.total_amount).toFixed(2)}`,
                    isArchived: item.status === 0,
                    createdAtDate: formatDate(item.created_at),
                    createdAtTime: formatTime(item.created_at),
                    updatedAtDate: formatDate(item.updated_at),
                    updatedAtTime: formatTime(item.updated_at),
                    imageUrl: item.product?.image_url,
                }));
                setInventoryData(formattedData); setTotalPages(response.data.last_page || 1);
            } else { setError("Invalid data received after action."); }
        } catch (error) { setError(`Failed to ${managementType} inventory: ${error.response?.data?.message || error.message}`);
        } finally { handleCloseManagement(); }
    };

    const handleCloseManagement = () => {
        setManagementModalOpen(false); setSelectedItem(null); setStock(0); setManagementType(""); setCheckedRows({}); setIsSelectAll(false);
    };

    const handleSelectAll = (e) => {
        const isChecked = e.target.checked; setIsSelectAll(isChecked);
        const newCheckedRows = {};
        if (isChecked) { currentItems.forEach((_, index) => { newCheckedRows[index] = true; }); }
        setCheckedRows(newCheckedRows);
    };

    const handleRowCheckbox = (index, e) => {
        const isChecked = e.target.checked;
        setCheckedRows((prev) => ({ ...prev, [index]: isChecked }));
        const currentCheckboxes = tableRef.current?.querySelectorAll(".inventory-checkbox:not([data-is-header='true'])") || [];
        const numberChecked = Array.from(currentCheckboxes).filter(cb => cb.checked).length;
        setIsSelectAll(numberChecked === currentItems.length && currentItems.length > 0);
    };

    useEffect(() => { // Update select all state if currentItems change
        const currentCheckboxes = tableRef.current?.querySelectorAll(".inventory-checkbox:not([data-is-header='true'])") || [];
        const numberChecked = Array.from(currentCheckboxes).filter(cb => checkedRows[cb.dataset.index]).length;
        setIsSelectAll(numberChecked === currentItems.length && currentItems.length > 0);
    }, [currentItems, checkedRows]);

    const checkedCount = Object.keys(checkedRows).filter((index) => checkedRows[index]).length;

    return (
        <div className="Inventory">
            <h2 className="h2"> {viewType === "active" ? "Active Inventory" : "Archived Inventory"} </h2>
            {error && <p className="error-message">{error}</p>}
            {isLoading ? ( <p>Loading inventory...</p> ) : (
                <div className="table-container">
                    <div className="inventory-table-header-actions">
                        <div className="search-bar"> <input type="text" placeholder="Search" className="search-input"/> </div>
                        <div className="button-group" style={{ marginLeft: "auto" }}>
                            {viewType === "active" && ( <button className="delete-button" onClick={() => handleDelete()} disabled={checkedCount < 1}> Delete </button> )}
                            {viewType === "archived" && ( <button className="restore-button" onClick={() => handleRestore()} disabled={checkedCount < 1}> Restore </button> )}
                        </div>
                        <div className="view-toggle">
                            <button className={`view-button ${viewType === "active" ? "active" : ""}`} onClick={() => setViewType("active")}> Active Inventory </button>
                            <button className={`view-button ${viewType === "archived" ? "active" : ""}`} onClick={() => setViewType("archived")}> Archived Inventory </button>
                        </div>
                    </div>
                    <table ref={tableRef} className="recently-sold">
                    <thead>
                        <tr className="thead">
                            <th className="th"> <input type="checkbox" className="inventory-checkbox" data-is-header="true" checked={isSelectAll} onChange={handleSelectAll}/> </th>
                            <th className="th">Action</th>
                            <th className="th">Image</th>
                            <th className="th">Product Name</th>
                            <th className="th">Stocks</th>
                            <th className="th">Price</th>
                            <th className="th">Quantity Sold</th>
                            <th className="th">Total Amount</th> {/* Reverted Header */}
                            {/* Profit Header Removed */}
                            <th className="th">Created At</th>
                            <th className="th">Updated At</th>
                        </tr>
                    </thead>
                    <tbody>
                        {currentItems.length > 0 ? (
                            currentItems.map((item, index) => (
                                <tr className="tr" key={item.id}>
                                    <td className="td"> <input type="checkbox" className="inventory-checkbox" data-index={index} checked={checkedRows[index] || false} onChange={(e) => handleRowCheckbox(index, e)}/> </td>
                                    <td className="td">
                                        <div className="action-buttons">
                                            {viewType === "active" ? ( <> <FaEdit className="edit-icon" size={20} onClick={() => handleEditStocks(item)}/> <FaTrash className="delete-icon" size={20} onClick={() => handleDelete(item)}/> </> )
                                            : ( <FaUndo className="restore-icon" size={20} onClick={() => handleRestore(item)}/> )}
                                        </div>
                                    </td>
                                    <td className="td"> {item.imageUrl && ( <img src={item.imageUrl} alt={item.productName} style={{ width: "50px", height: "50px", objectFit: "cover" }}/> )} </td>
                                    <td className="td"> {item.productName.replace(/\n/g, " ")} </td>
                                    <td className={`td status ${getStockClass(item.stock)}`}> {formatStock(item.stock)} </td>
                                    <td className="td">{item.price}</td>
                                    <td className="td inventory-quantity-sold"> {item.quantitySold} </td>
                                    <td className="td inventory-total-amount"> {item.totalAmount} </td> {/* This shows Gross Sales */}
                                    {/* Profit Cell Removed */}
                                    <td className="td"> {item.createdAtDate}<br /> at {item.createdAtTime} </td>
                                    <td className="td"> {item.updatedAtDate}<br /> at {item.updatedAtTime} </td>
                                </tr>
                            ))
                        ) : (
                            <tr className="tr">
                                <td colSpan="10" className="td" style={{ textAlign: "center", padding: "20px" }}> {/* Corrected colspan */}
                                    No items available.
                                </td>
                            </tr>
                        )}
                    </tbody>
                    </table>
                    <div className="inventory-pagination">
                        <button onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))} disabled={currentPage === 1}> Previous </button>
                        {Array.from({ length: totalPages }, (_, i) => i + 1).map( (page) => ( <button key={page} onClick={() => setCurrentPage(page)} className={ currentPage === page ? "active" : "" }> {page} </button> ) )}
                        <button onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))} disabled={currentPage === totalPages}> Next </button>
                    </div>
                </div>
            )}

            {managementModalOpen && (
                <InventoryManagement
                    type={managementType} item={selectedItem} stock={stock} onClose={handleCloseManagement} onSave={handleSaveEdit} onConfirm={handleConfirmDeleteOrRestore}
                />
            )}
        </div>
    );
};

export default Inventory;