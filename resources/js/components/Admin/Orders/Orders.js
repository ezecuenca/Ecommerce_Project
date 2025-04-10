import React, { useState, useEffect, useCallback } from "react";
import OrdersManagement from "./OrdersManagement";
import axios from 'axios';

const Orders = () => {
    const [ordersData, setOrdersData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [checkedItems, setCheckedItems] = useState({});
    const [selectAll, setSelectAll] = useState(false);
    const [viewType, setViewType] = useState("active");
    const [managementModalOpen, setManagementModalOpen] = useState(false);
    // managementType is now only for 'details' or potentially other non-restore actions
    const [managementType, setManagementType] = useState("");
    const [selectedOrderId, setSelectedOrderId] = useState(null);
    // selectedOrders only needed if viewing details of multiple? For now, just one detail view.
    // const [selectedOrders, setSelectedOrders] = useState([]); // Might remove if only single view
    const [selectedOrderDetails, setSelectedOrderDetails] = useState({}); // For modal details

    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 5;

    const API_BASE_URL = 'http://127.0.0.1:8000/api';

    const mapApiOrderToFrontendOrder = (apiOrder) => {
        const getFrontendStatus = (apiStatus) => {
            if (!apiStatus) return 'pending';
            const lowerCaseStatus = apiStatus.toLowerCase();
            switch(lowerCaseStatus) {
                case 'pending': return 'pending';
                case 'processing': return 'processing';
                case 'shipped': return 'on-delivery';
                case 'delivered': return 'completed';
                case 'completed': return 'completed';
                case 'cancelled': return 'cancelled';
                case 'return_requested': return 'return_requested';
                default: return lowerCaseStatus;
            }
        };

        const getShippingStatus = (orderStatus, shippingApiStatus) => {
            const lowerCaseOrderStatus = orderStatus?.toLowerCase();
            const lowerCaseShippingStatus = shippingApiStatus?.toLowerCase();
            if (lowerCaseOrderStatus === 'completed') return 'Delivered & Confirmed';
            if (lowerCaseOrderStatus === 'cancelled') return 'Cancelled';
            if (lowerCaseOrderStatus === 'return_requested') return 'Return Requested';
            if (lowerCaseShippingStatus === 'delivered') return 'Delivered';
            if (lowerCaseShippingStatus === 'shipped') return 'Shipped';
            if (lowerCaseOrderStatus === 'processing') return 'Preparing Shipment';
            return "Not Shipped";
        };

        const formatDate = (dateString) => {
            if (!dateString) return "-";
            try {
                const date = new Date(dateString);
                const month = String(date.getMonth() + 1).padStart(2, '0');
                const day = String(date.getDate()).padStart(2, '0');
                const year = String(date.getFullYear()).slice(-2);
                return `${month}/${day}/${year}`;
            } catch (e) { return "-"; }
        };

        const formatPrice = (amount) => {
           const number = parseFloat(amount);
           return `₱ ${isNaN(number) ? '0.00' : number.toFixed(2)}`;
        };

        const backendStatus = apiOrder.status?.toLowerCase();
        const frontendStatus = getFrontendStatus(backendStatus);
        const isArchived = backendStatus === 'completed' || backendStatus === 'cancelled' || backendStatus === 'return_requested';

        return {
            id: String(apiOrder.id),
            paymentMethod: apiOrder.payment?.payment_method?.method_name || "N/A",
            total: formatPrice(apiOrder.total_amount),
            status: frontendStatus,
            backendStatus: backendStatus,
            date: formatDate(apiOrder.order_date),
            orderDetails: apiOrder.order_details?.map(detail => ({
                productName: detail.product?.product_name || `Product ID: ${detail.product_id}`,
                quantity: `${detail.quantity}x`,
                price: formatPrice(detail.price),
                image: detail.product?.image_url || "/images/default-product.svg"
            })) || [],
            shippingStatus: getShippingStatus(apiOrder.status, apiOrder.shipping?.shipping_status),
            trackingNumber: apiOrder.shipping?.tracking_number || "-",
            shippingAddress: apiOrder.shipping?.shipping_address || "N/A",
            shippingMethod: apiOrder.shipping?.shipping_method || "N/A",
            shippingDate: formatDate(apiOrder.shipping?.shipping_date),
            isArchived: isArchived,
        };
    };

    const fetchOrders = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const response = await axios.get(`${API_BASE_URL}/orders?context=admin`, {
                headers: { 'Accept': 'application/json' },
            });
            const rawOrders = response.data.data || response.data;
            if (Array.isArray(rawOrders)) {
                const mappedOrders = rawOrders.map(mapApiOrderToFrontendOrder);
                setOrdersData(mappedOrders);
            } else {
                 setError("Received invalid data format from server.");
                 setOrdersData([]);
            }
        } catch (err) {
            const errorMessage = err.response?.data?.message || err.message || 'Failed to fetch orders.';
            setError(errorMessage);
            setOrdersData([]);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchOrders();
    }, [fetchOrders]);

    const getCurrentOrders = () => {
        return ordersData.filter(order => order.isArchived === (viewType === "archived"));
    };

    const currentOrders = getCurrentOrders();
    const totalPages = Math.ceil(currentOrders.length / itemsPerPage);
    const currentItems = currentOrders.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

    const handleCheckboxChange = (id) => {
        setCheckedItems((prev) => {
            const newCheckedItems = { ...prev, [id]: !prev[id] };
            const allVisibleSelected = currentItems.every(item => newCheckedItems[item.id]);
            setSelectAll(allVisibleSelected && currentItems.length > 0);
            return newCheckedItems;
        });
    };

    const handleSelectAllChange = () => {
        const newSelectAll = !selectAll;
        setSelectAll(newSelectAll);
        const newCheckedItems = currentItems.reduce((acc, item) => ({
            ...acc,
            [item.id]: newSelectAll,
        }), { ...checkedItems });
        if (!newSelectAll) {
            currentItems.forEach(item => { delete newCheckedItems[item.id]; });
        }
        setCheckedItems(newCheckedItems);
    };

    useEffect(() => {
        const allVisibleSelected = currentItems.length > 0 && currentItems.every(item => checkedItems[item.id]);
        setSelectAll(allVisibleSelected);
    }, [currentItems, checkedItems]);

    const handleStatusChange = async (event, orderId = null) => {
        const newFrontendStatus = event.target.value;
        const selectedIds = orderId ? [orderId] : Object.keys(checkedItems).filter(id => checkedItems[id]);

        if (selectedIds.length === 0 || !newFrontendStatus) return;

        let backendStatusToSend;
        switch (newFrontendStatus) {
            case 'pending': backendStatusToSend = 'pending'; break;
            case 'processing': backendStatusToSend = 'processing'; break;
            case 'on-delivery': backendStatusToSend = 'shipped'; break;
            case 'completed': backendStatusToSend = 'delivered'; break;
            case 'cancelled': backendStatusToSend = 'cancelled'; break;
            default: return;
        }

        if (backendStatusToSend === 'cancelled') {
            if (!window.confirm(`Are you sure you want to cancel ${selectedIds.length} order(s)?`)) {
                if (orderId && event.target) event.target.value = ordersData.find(o => o.id === orderId)?.status || '';
                return;
            }
            setLoading(true);
            try {
                await Promise.all(selectedIds.map(id =>
                    axios.put(`${API_BASE_URL}/orders/${id}/cancel`, {}, { headers: { 'Accept': 'application/json' } })
                ));
                alert('Order(s) cancelled successfully!');
                await fetchOrders();
            } catch (err) {
                alert(err.response?.data?.message || 'Failed to cancel order(s).');
                if (orderId && event.target) event.target.value = ordersData.find(o => o.id === orderId)?.status || '';
            } finally {
                setCheckedItems({});
                setSelectAll(false);
                setLoading(false);
            }
            return;
        }

        setLoading(true);
        try {
            await Promise.all(selectedIds.map(id =>
                axios.put(`${API_BASE_URL}/orders/${id}/status`,
                { status: backendStatusToSend },
                { headers: { 'Accept': 'application/json', 'Content-Type': 'application/json' } }
                )
            ));
            alert(`Order status(es) updated to "${backendStatusToSend}" successfully!`);
            await fetchOrders();
        } catch (err) {
            alert(err.response?.data?.message || `Failed to update status to "${backendStatusToSend}".`);
             if (orderId && event.target) {
                  const originalFrontendStatus = ordersData.find(o => o.id === orderId)?.status;
                  if (originalFrontendStatus) event.target.value = originalFrontendStatus;
             }
        } finally {
            setCheckedItems({});
            setSelectAll(false);
            setLoading(false);
        }
    };

    const handleOrderClick = (orderId) => {
        const order = ordersData.find(o => o.id === orderId);
        if (order) {
             setSelectedOrderId(orderId);
             // setSelectedOrders([order]); // Store the whole order object for the modal
             setSelectedOrderDetails(order); // Use a dedicated state for modal details
             setManagementModalOpen(true);
             setManagementType("details");
        } else {
             alert("Could not find order details.");
        }
    };

    const handleCloseManagement = () => {
        setManagementModalOpen(false);
        setManagementType("");
        setSelectedOrderId(null);
        setSelectedOrderDetails({}); // Clear details state
    };

    // REMOVED handleRestore and handleConfirmRestore functions

    if (loading && ordersData.length === 0) {
         return <div>Loading orders...</div>;
    }

    if (error) {
        return <div style={{ color: 'red' }}>Error: {error} <button onClick={fetchOrders}>Retry</button></div>;
    }

    return (
        <div className="Orders">
            <h2 className="h2">{viewType === "active" ? "Active Orders" : "Archived Orders"}</h2>
            <div className="table-header-actions">
                <div className="search-bar">
                    <input type="text" placeholder="Search (Not Implemented)" className="search-input" disabled/>
                </div>
                <div className="button-group" style={{ marginLeft: 'auto' }}>
                     {viewType === "active" && (
                         <select
                             className="orders-status-dropdown"
                             onChange={(e) => handleStatusChange(e)}
                             disabled={loading || Object.keys(checkedItems).filter(id => checkedItems[id]).length === 0}
                             value=""
                         >
                             <option value="" disabled>Bulk Update Status</option>
                             <option value="pending">Pending</option>
                             <option value="processing">Processing</option>
                             <option value="on-delivery">On Delivery</option>
                             <option value="completed">Completed</option>
                             <option value="cancelled">Cancel Selected</option>
                         </select>
                     )}
                     {/* REMOVED Restore button */}
                 </div>
                <div className="view-toggle">
                    <button
                        className={`view-button ${viewType === "active" ? "active" : ""}`}
                        onClick={() => { setViewType("active"); setCurrentPage(1); setCheckedItems({}); setSelectAll(false); }}
                        disabled={loading} > Active Orders </button>
                    <button
                        className={`view-button ${viewType === "archived" ? "active" : ""}`}
                        onClick={() => { setViewType("archived"); setCurrentPage(1); setCheckedItems({}); setSelectAll(false); }}
                        disabled={loading} > Archived Orders </button>
                </div>
            </div>
            {loading && <div>Processing...</div>}
            <div className="table-container">
                <div className="table-header-wrapper">
                    <table className="orders-recently-sold">
                        <thead>
                            <tr className="thead">
                                <th className="th"> <input type="checkbox" checked={selectAll} onChange={handleSelectAllChange} disabled={loading || currentItems.length === 0}/> </th>
                                <th className="th">Order ID</th>
                                <th className="th">Payment Method</th>
                                <th className="th">Total Amount</th>
                                <th className="th">Status</th>
                                <th className="th">Shipping Status</th>
                                <th className="th">Tracking Number</th>
                                <th className="th">Created At</th>
                            </tr>
                        </thead>
                        <tbody>
                            {currentItems.length > 0 ? (
                                currentItems.map((item) => (
                                    <tr key={item.id} className="tr">
                                        <td className="td"> <input type="checkbox" checked={checkedItems[item.id] || false} onChange={() => handleCheckboxChange(item.id)} disabled={loading}/> </td>
                                        <td className="td"> <button className="order-id-button" onClick={() => handleOrderClick(item.id)} disabled={loading}> {item.id} </button> </td>
                                        <td className="td">{item.paymentMethod}</td>
                                        <td className="td">{item.total}</td>
                                        <td className="td">
                                             <select
                                                 className="status-dropdown"
                                                 onChange={(e) => handleStatusChange(e, item.id)}
                                                 value={item.status}
                                                 disabled={loading || viewType === "archived" || ['cancelled', 'completed', 'return_requested'].includes(item.backendStatus)}
                                             >
                                                 <option value="pending">Pending</option>
                                                 <option value="processing">Processing</option>
                                                 <option value="on-delivery">On Delivery</option>
                                                 <option value="completed">Completed</option>
                                                 <option value="cancelled">Cancel</option>
                                             </select>
                                         </td>
                                        <td className="td">{item.shippingStatus}</td>
                                        <td className="td">{item.trackingNumber}</td>
                                        <td className="td">{item.date}</td>
                                    </tr>
                                ))
                            ) : (
                                <tr className="tr">
                                    <td colSpan={8} className="td" style={{ textAlign: "center", padding: "20px", backgroundColor: "#f9f9f9" }}>
                                        {loading ? "Loading..." : (ordersData.length === 0 && !error ? "No orders found." : `No ${viewType} orders match.`)}
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
                <div className="pagination">
                     <button onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))} disabled={loading || currentPage === 1}> Previous </button>
                     {totalPages > 0 && Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                         <button key={page} onClick={() => setCurrentPage(page)} className={currentPage === page ? "active" : ""} disabled={loading}> {page} </button>
                     ))}
                     <button onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))} disabled={loading || currentPage === totalPages || totalPages === 0} > Next </button>
                 </div>
            </div>
             {managementModalOpen && (
                 <OrdersManagement
                     type={managementType} // Now only 'details'
                     orderId={selectedOrderId}
                     // Pass necessary details directly from the selectedOrderDetails state
                     orderDetails={selectedOrderDetails?.orderDetails || []}
                     shippingDetails={selectedOrderDetails || {}}
                    // selectedOrders={selectedOrders} // Likely not needed anymore
                     viewType={viewType}
                     onClose={handleCloseManagement}
                     // onConfirm prop removed
                 />
             )}
        </div>
    );
};

export default Orders;