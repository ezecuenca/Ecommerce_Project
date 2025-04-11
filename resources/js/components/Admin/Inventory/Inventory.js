import React, { useState, useEffect, useRef, useCallback } from "react";
import { FaEdit, FaTrash, FaUndo } from "react-icons/fa";
import InventoryManagement from "./InventoryManagement";
import Axios from "axios";

const API_BASE_URL = "http://localhost:8000/api";

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

    const makeAuthenticatedRequest = async (method, url, data = null, config = {}) => {
        const token = localStorage.getItem("access_token");
        if (!token) { throw new Error("Unauthenticated: No token found."); }
        const headers = {
            'Authorization': `Bearer ${token}`,
            'Accept': 'application/json',
            ...(method !== 'get' && data ? { 'Content-Type': 'application/json' } : {}),
            ...(config.headers || {}),
        };
        const fullConfig = { ...config, headers };
        switch (method.toLowerCase()) {
            case 'get': return Axios.get(url, fullConfig);
            case 'post': return Axios.post(url, data, fullConfig);
            case 'put': return Axios.put(url, data, fullConfig);
            case 'delete': return Axios.delete(url, fullConfig);
            default: throw new Error(`Unsupported method: ${method}`);
        }
    };

    const formatDate = (dateString) => {
        if (!dateString) return "N/A";
        try { const date = new Date(dateString); date.setHours(date.getHours() + timeZoneOffset); return date.toLocaleDateString("en-US", { year: 'numeric', month: 'long', day: 'numeric' }); } catch (e) { console.error("Error formatting date:", dateString, e); return "Invalid Date"; }
    };
    const formatTime = (dateString) => {
        if (!dateString) return "N/A";
        try { const date = new Date(dateString); date.setHours(date.getHours() + timeZoneOffset); return date.toLocaleTimeString("en-US", { hour: 'numeric', minute: 'numeric', hour12: true }); } catch (e) { console.error("Error formatting time:", dateString, e); return "Invalid Time"; }
    };

    const fetchInventory = useCallback(async () => {
        setIsLoading(true);
        setError("");
        try {
            const response = await makeAuthenticatedRequest('get', `${API_BASE_URL}/inventories`, null, {
                params: { page: currentPage, per_page: itemsPerPage, status: viewType }
            });

            if (response.data && response.data.data) {
                const formattedData = response.data.data.map((item) => ({
                    id: item.id, productName: item.product_name, stock: item.stocks, price: `₱ ${parseFloat(item.price).toFixed(2)}`, quantitySold: item.quantity_sold, totalAmount: `₱ ${parseFloat(item.total_amount).toFixed(2)}`, isArchived: item.status === 0, createdAtDate: formatDate(item.created_at), createdAtTime: formatTime(item.created_at), updatedAtDate: formatDate(item.updated_at), updatedAtTime: formatTime(item.updated_at), imageUrl: item.product?.image_url,
                }));
                setInventoryData(formattedData);
                setTotalPages(response.data.last_page || 1);
            } else {
                setError("Invalid data received from the server.");
                setInventoryData([]); setTotalPages(1);
            }
        } catch (error) {
            const errorMessage = error.message.startsWith("Unauthenticated") ? "Unauthenticated." : (error.response?.data?.message || error.message || 'Failed to load inventory.');
            setError(errorMessage);
            setInventoryData([]); setTotalPages(1);
        } finally {
            setIsLoading(false);
        }
    }, [viewType, currentPage, itemsPerPage]);

    useEffect(() => {
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
        const selectedIndices = Object.keys(checkedRows).filter((key) => checkedRows[key]).map(key => parseInt(key.split('-')[1], 10));
        const selectedItemsById = Object.keys(checkedRows).filter(key => checkedRows[key]).map(key => key.split('-')[0]);

        if (itemToDelete) { setManagementType("delete"); setSelectedItem([itemToDelete]); setManagementModalOpen(true); return; }

        if (selectedItemsById.length < 1) { alert("Please select at least one item to delete."); return; }
        const itemsToAction = inventoryData.filter(item => selectedItemsById.includes(String(item.id)));
        setManagementType("delete"); setSelectedItem(itemsToAction); setManagementModalOpen(true);
    };
    const handleRestore = (itemToRestore = null) => {
         if (viewType !== "archived") { alert("You can only restore from Archived Inventory."); return; }
         const selectedItemsById = Object.keys(checkedRows).filter(key => checkedRows[key]).map(key => key.split('-')[0]);
         if (itemToRestore) { setManagementType("restore"); setSelectedItem([itemToRestore]); setManagementModalOpen(true); return; }
         if (selectedItemsById.length < 1) { alert("Please select at least one item to restore."); return; }
         const itemsToAction = inventoryData.filter(item => selectedItemsById.includes(String(item.id)));
         setManagementType("restore"); setSelectedItem(itemsToAction); setManagementModalOpen(true);
    };

    const handleStockChange = (e) => { setStock(parseInt(e.target.value, 10) || 0); };

    const handleSaveEdit = async (newStock) => {
        if (!selectedItem) { alert("No item selected for editing."); return; }
        const itemToEdit = Array.isArray(selectedItem) ? selectedItem[0] : selectedItem;
        if (!itemToEdit) { alert("Invalid item selected."); return; }
        setIsLoading(true);
        try {
            await makeAuthenticatedRequest('put', `${API_BASE_URL}/inventories/${itemToEdit.id}/stocks`, { stocks: newStock });
            alert("Stocks updated successfully.");
            await fetchInventory();
        } catch (error) {
             const errorMessage = error.message.startsWith("Unauthenticated") ? "Unauthenticated." : (error.response?.data?.message || error.message || 'Failed to update stocks.');
             setError(errorMessage);
        } finally {
            setIsLoading(false);
            handleCloseManagement();
        }
    };

    const handleConfirmDeleteOrRestore = async (items) => {
        if (!items || items.length === 0) { alert("No items selected."); return; }
        const itemIds = items.map((item) => item.id);
        setIsLoading(true);
        try {
            const actionUrlSuffix = managementType === "delete" ? "/inventories/archive" : "/inventories/restore";
            const successMessage = managementType === "delete" ? "archived" : "restored";
            await makeAuthenticatedRequest('put', `${API_BASE_URL}${actionUrlSuffix}`, { ids: itemIds });
            alert(`Inventory records ${successMessage} successfully.`);
            await fetchInventory();
        } catch (error) {
             const errorMessage = error.message.startsWith("Unauthenticated") ? "Unauthenticated." : (error.response?.data?.message || error.message || `Failed to ${managementType} inventory.`);
             setError(errorMessage);
        } finally {
            setIsLoading(false);
            handleCloseManagement();
        }
    };

    const handleCloseManagement = () => {
        setManagementModalOpen(false); setSelectedItem(null); setStock(0); setManagementType(""); setCheckedRows({}); setIsSelectAll(false);
    };

    const handleSelectAll = (e) => {
        const isChecked = e.target.checked; setIsSelectAll(isChecked);
        const newCheckedRows = {};
        if (isChecked) { currentItems.forEach((item, index) => { newCheckedRows[`${item.id}-${index}`] = true; }); }
        setCheckedRows(newCheckedRows);
    };

    const handleRowCheckbox = (item, index, e) => {
        const isChecked = e.target.checked;
        const key = `${item.id}-${index}`;
        setCheckedRows((prev) => ({ ...prev, [key]: isChecked }));
        const currentKeys = currentItems.map((itm, idx) => `${itm.id}-${idx}`);
        const nextCheckedState = { ...checkedRows, [key]: isChecked };
        const allChecked = currentKeys.length > 0 && currentKeys.every(k => nextCheckedState[k]);
        setIsSelectAll(allChecked);
    };

    const checkedCount = Object.keys(checkedRows).filter((key) => checkedRows[key]).length;

    return (
        <div className="Inventory">
            <h2 className="h2"> {viewType === "active" ? "Active Inventory" : "Archived Inventory"} </h2>
            {error && <p className="error-message">{error}</p>}
            {isLoading && inventoryData.length === 0 ? ( <p>Loading inventory...</p> ) : (
                <div className="table-container">
                    <div className="inventory-table-header-actions">
                        <div className="search-bar"> <input type="text" placeholder="Search" className="search-input"/> </div>
                        <div className="button-group" style={{ marginLeft: "auto" }}>
                            {viewType === "active" && ( <button className="delete-button" onClick={() => handleDelete()} disabled={checkedCount < 1 || isLoading}> Delete </button> )}
                            {viewType === "archived" && ( <button className="restore-button" onClick={() => handleRestore()} disabled={checkedCount < 1 || isLoading}> Restore </button> )}
                        </div>
                        <div className="view-toggle">
                            <button className={`view-button ${viewType === "active" ? "active" : ""}`} onClick={() => { setViewType("active"); setCurrentPage(1); }} disabled={isLoading}> Active Inventory </button>
                            <button className={`view-button ${viewType === "archived" ? "active" : ""}`} onClick={() => { setViewType("archived"); setCurrentPage(1); }} disabled={isLoading}> Archived Inventory </button>
                        </div>
                    </div>
                    <table ref={tableRef} className="recently-sold">
                    <thead>
                        <tr className="thead">
                            <th className="th"> <input type="checkbox" className="inventory-checkbox" data-is-header="true" checked={isSelectAll} onChange={handleSelectAll} disabled={isLoading || currentItems.length === 0}/> </th>
                            <th className="th">Action</th> <th className="th">Image</th> <th className="th">Product Name</th> <th className="th">Stocks</th> <th className="th">Price</th> <th className="th">Quantity Sold</th> <th className="th">Total Amount</th> <th className="th">Created At</th> <th className="th">Updated At</th>
                        </tr>
                    </thead>
                    <tbody>
                        {isLoading && inventoryData.length > 0 ? ( <tr><td colSpan="10" style={{ textAlign: "center", padding: "20px" }}>Loading data...</td></tr> ) :
                         currentItems.length > 0 ? (
                            currentItems.map((item, index) => (
                                <tr className="tr" key={`${item.id}-${index}`}>
                                    <td className="td"> <input type="checkbox" className="inventory-checkbox" data-index={index} checked={checkedRows[`${item.id}-${index}`] || false} onChange={(e) => handleRowCheckbox(item, index, e)} disabled={isLoading}/> </td>
                                    <td className="td"> <div className="action-buttons"> {viewType === "active" ? ( <> <FaEdit className="edit-icon" size={20} onClick={() => handleEditStocks(item)}/> <FaTrash className="delete-icon" size={20} onClick={() => handleDelete(item)}/> </> ) : ( <FaUndo className="restore-icon" size={20} onClick={() => handleRestore(item)}/> )} </div> </td>
                                    <td className="td"> {item.imageUrl && ( <img src={item.imageUrl} alt={item.productName} style={{ width: "50px", height: "50px", objectFit: "cover" }}/> )} </td>
                                    <td className="td"> {item.productName.replace(/\n/g, " ")} </td>
                                    <td className={`td status ${getStockClass(item.stock)}`}> {formatStock(item.stock)} </td>
                                    <td className="td">{item.price}</td> <td className="td inventory-quantity-sold"> {item.quantitySold} </td> <td className="td inventory-total-amount"> {item.totalAmount} </td>
                                    <td className="td"> {item.createdAtDate}<br /> at {item.createdAtTime} </td> <td className="td"> {item.updatedAtDate}<br /> at {item.updatedAtTime} </td>
                                </tr>
                            ))
                        ) : ( <tr className="tr"> <td colSpan="10" className="td" style={{ textAlign: "center", padding: "20px" }}> No items available. </td> </tr> )}
                    </tbody>
                    </table>
                   {totalPages > 1 && (
                        <div className="inventory-pagination">
                            <button onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))} disabled={currentPage === 1 || isLoading}> Previous </button>
                            {Array.from({ length: totalPages }, (_, i) => i + 1).map( (page) => ( <button key={page} onClick={() => setCurrentPage(page)} className={ currentPage === page ? "active" : "" } disabled={isLoading}> {page} </button> ) )}
                            <button onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))} disabled={currentPage === totalPages || isLoading}> Next </button>
                        </div>
                   )}
                </div>
            )}

            {managementModalOpen && ( <InventoryManagement type={managementType} item={selectedItem} stock={stock} onClose={handleCloseManagement} onSave={handleSaveEdit} onConfirm={handleConfirmDeleteOrRestore} /> )}
        </div>
    );
};

export default Inventory;