import React, { useState } from "react";
import OrdersManagement from "./OrdersManagement"; // New import for the modal

const Orders = () => {
    const [ordersData, setOrdersData] = useState([
        { 
            id: "123456", 
            paymentMethod: "Cash on Delivery", 
            total: "₱ 200.12", 
            status: "pending", 
            date: "10/03/24",
            orderDetails: [
                { productName: "Product Name 1", quantity: "1x", price: "₱ 100.06", image: "/images/watchprod.svg" },
                { productName: "Product Name 2", quantity: "1x", price: "₱ 100.06", image: "/images/watchprod.svg" },
            ],
            isArchived: false // Added isArchived property for active/archived tracking
        },
        { 
            id: "111209", 
            paymentMethod: "Paypal", 
            total: "₱ 143.06", 
            status: "processing", 
            date: "10/02/24",
            orderDetails: [
                { productName: "Product Name 3", quantity: "2x", price: "₱ 71.53", image: "/images/watchprod.svg" },
            ],
            isArchived: false // Added isArchived property for active/archived tracking
        },
        { 
            id: "433532", 
            paymentMethod: "Card", 
            total: "₱ 310.22", 
            status: "on-delivery", 
            date: "10/01/24",
            orderDetails: [
                { productName: "Product Name 4", quantity: "1x", price: "₱ 155.11", image: "/images/watchprod.svg" },
                { productName: "Product Name 5", quantity: "2x", price: "₱ 155.11", image: "/images/watchprod.svg" },
            ],
            isArchived: false // Added isArchived property for active/archived tracking
        },
        { 
            id: "121212", 
            paymentMethod: "Cash on Delivery", 
            total: "₱ 310.22", 
            status: "completed", 
            date: "09/30/24",
            orderDetails: [
                { productName: "Product Name 6", quantity: "3x", price: "₱ 103.41", image: "/images/watchprod.svg" },
            ],
            isArchived: true // Initially archived as completed
        },
        { 
            id: "121212", 
            paymentMethod: "Paypal", 
            total: "₱ 310.22", 
            status: "pending", 
            date: "09/29/24",
            orderDetails: [
                { productName: "Product Name 7", quantity: "2x", price: "₱ 155.11", image: "/images/watchprod.svg" },
            ],
            isArchived: false // Added isArchived property for active/archived tracking
        },
    ]);

    const [checkedItems, setCheckedItems] = useState({});
    const [selectAll, setSelectAll] = useState(false);

    const [viewType, setViewType] = useState("active"); // New state for Active/Archived toggle
    const [managementModalOpen, setManagementModalOpen] = useState(false);
    const [managementType, setManagementType] = useState(""); // New state to track restore type (bulk or individual)
    const [selectedOrderId, setSelectedOrderId] = useState(null);
    const [selectedOrders, setSelectedOrders] = useState([]); // For bulk restore

    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 5;

    // Filter orders based on viewType (active or archived)
    const getCurrentOrders = () => {
        let filteredOrders = ordersData.filter(order => order.isArchived === (viewType === "archived"));
        return filteredOrders;
    };

    const currentOrders = getCurrentOrders();
    const totalPages = Math.ceil(currentOrders.length / itemsPerPage);
    const currentItems = currentOrders.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    );

    const handleCheckboxChange = (id) => {
        setCheckedItems((prev) => ({
            ...prev,
            [id]: !prev[id],
        }));
        if (Object.values({ ...checkedItems, [id]: !prev[id] }).every((val) => !val)) {
            setSelectAll(false);
        }
        console.log("Checked items after change:", checkedItems); // Debug log
    };

    const handleSelectAllChange = () => {
        const newSelectAll = !selectAll;
        setSelectAll(newSelectAll);
        const newCheckedItems = currentOrders.reduce((acc, item) => ({
            ...acc,
            [item.id]: newSelectAll,
        }), {});
        setCheckedItems(newCheckedItems);
        console.log("Checked items after Select All:", newCheckedItems); // Debug log
    };

    const areAllSelected = currentItems.every((item) => checkedItems[item.id]);

    const handleStatusChange = (event, orderId = null) => {
        const newStatus = event.target.value;
        if (newStatus === "completed") {
            const updatedOrders = ordersData.map((item) => 
                (orderId ? item.id === orderId : checkedItems[item.id]) 
                    ? { ...item, status: newStatus, isArchived: true } 
                    : item
            );
            setOrdersData(updatedOrders);
            setCheckedItems({});
            setSelectAll(false);
        } else if (newStatus && areAllSelected) {
            const updatedOrders = ordersData.map((item) =>
                checkedItems[item.id] ? { ...item, status: newStatus } : item
            );
            setOrdersData(updatedOrders);
            setCheckedItems({});
            setSelectAll(false);
        }
        console.log("Status change - new status:", newStatus, "orderId:", orderId, "checkedItems:", checkedItems); // Debug log
    };

    const handleOrderClick = (orderId) => {
        setSelectedOrderId(orderId);
        setManagementModalOpen(true);
        console.log("Order clicked - orderId:", orderId); // Debug log
    };

    const handleCloseManagement = () => {
        setManagementModalOpen(false);
        setManagementType("");
        setSelectedOrderId(null);
        setSelectedOrders([]);
        console.log("Modal closed"); // Debug log
    };

    const handleRestore = (orderId = null) => {
        if (!orderId && Object.keys(checkedItems).filter(id => checkedItems[id]).length < 1) {
            alert("Please select at least one order to restore.");
            return;
        }
        if (viewType !== "archived") {
            alert("You can only restore from Archived Orders.");
            return;
        }
        // Open modal for confirmation
        setManagementType(orderId ? "individual" : "bulk");
        setSelectedOrderId(orderId ? orderId.toString() : null); // Ensure orderId is a string
        setSelectedOrders(orderId ? [ordersData.find(order => order.id === orderId)] : currentOrders.filter(order => checkedItems[order.id]));
        setManagementModalOpen(true);
        console.log("Restore triggered - orderId:", orderId, "checkedItems:", checkedItems, "selectedOrders:", selectedOrders); // Debug log
    };

    const handleConfirmRestore = () => {
        const selectedOrdersToRestore = managementType === "individual" 
            ? [ordersData.find(order => order.id === selectedOrderId)] 
            : currentOrders.filter(order => checkedItems[order.id]); // Use checkedItems to filter currentOrders for bulk
        console.log("Confirming restore - selectedOrders:", selectedOrdersToRestore, "managementType:", managementType); // Debug log
        const updatedOrders = ordersData.map(order =>
            selectedOrdersToRestore.some(selected => selected.id === order.id) ? { ...order, isArchived: false } : order
        );
        setOrdersData(updatedOrders);
        setCheckedItems({});
        setSelectAll(false);
        handleCloseManagement();
    };

    return (
        <div className="Orders">
            <h2 className="h2">{viewType === "active" ? "Active Orders" : "Archived Orders"}</h2>

            <div className="table-header-actions">
                <div className="search-bar">
                    <input
                        type="text"
                        placeholder="Search"
                        className="search-input"
                    />
                </div>
                <div className="button-group" style={{ marginLeft: 'auto' }}>
                    {viewType === "active" && (
                        <select
                            className="orders-status-dropdown"
                            onChange={handleStatusChange}
                            disabled={!areAllSelected}
                            value=""
                        >
                            <option value="" disabled>Select Status</option>
                            <option value="pending">Pending</option>
                            <option value="processing">Processing</option>
                            <option value="on-delivery">On Delivery</option>
                            <option value="completed">Completed</option>
                        </select>
                    )}
                </div>
                <div className="view-toggle">
                    <button
                        className={`view-button ${viewType === "active" ? "active" : ""}`}
                        onClick={() => setViewType("active")}
                    >
                        Active Orders
                    </button>
                    <button
                        className={`view-button ${viewType === "archived" ? "active" : ""}`}
                        onClick={() => setViewType("archived")}
                    >
                        Archived Orders
                    </button>
                </div>
            </div>

            <div className="table-container">
                <div className="table-header-wrapper">
                    <table className="orders-recently-sold">
                        <thead>
                            <tr className="thead">
                                <th className="th">
                                    <input
                                        type="checkbox"
                                        checked={selectAll}
                                        onChange={handleSelectAllChange}
                                    />
                                </th>
                                <th className="th">Order ID</th>
                                <th className="th">Payment Method</th>
                                <th className="th">Total Amount</th>
                                <th className="th">Status</th>
                                <th className="th">Created At</th>
                            </tr>
                        </thead>
                        <tbody>
                            {currentItems.length > 0 ? (
                                currentItems.map((item, index) => (
                                    <tr key={index} className="tr">
                                        <td className="td">
                                            <input
                                                type="checkbox"
                                                checked={checkedItems[item.id] || false}
                                                onChange={() => handleCheckboxChange(item.id)}
                                            />
                                        </td>
                                        <td className="td">
                                            <button className="order-id-button" onClick={() => handleOrderClick(item.id)}>
                                                {item.id}
                                            </button>
                                        </td>
                                        <td className="td">{item.paymentMethod}</td>
                                        <td className="td">{item.total}</td>
                                        <td className="td">
                                            <select 
                                                className="status-dropdown" 
                                                onChange={(e) => handleStatusChange(e, item.id)}
                                                value={item.status}
                                                disabled={viewType === "archived"} // Disable status changes in Archived view
                                            >
                                                <option value="pending">Pending</option>
                                                <option value="processing">Processing</option>
                                                <option value="on-delivery">On Delivery</option>
                                                <option value="completed">Completed</option>
                                            </select>
                                        </td>
                                        <td className="td">{item.date}</td>
                                    </tr>
                                ))
                            ) : (
                                <tr className="tr">
                                    <td colSpan={6} className="td" style={{ textAlign: "center", padding: "20px", backgroundColor: "#f9f9f9" }}>
                                        {ordersData.length === 0
                                            ? "No orders available. Please check your data or refresh the page."
                                            : viewType === "active"
                                            ? "No active orders match your search."
                                            : "No archived orders match your search."}
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
                <div className="pagination">
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
                <OrdersManagement
                    type={managementType}
                    orderId={selectedOrderId}
                    orderDetails={ordersData.find(order => order.id === selectedOrderId)?.orderDetails || []}
                    selectedOrders={selectedOrders}
                    viewType={viewType} // Pass viewType to OrdersManagement for Delete/Restore logic
                    onClose={handleCloseManagement}
                    onConfirm={handleConfirmRestore}
                />
            )}
        </div>
    );
};

export default Orders;