import React, { useState, useEffect, useCallback } from "react";
import OrdersManagement from "./OrdersManagement";
import axios from 'axios';

const Orders = () => {
    const [ordersData, setOrdersData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [checkedItems, setCheckedItems] = useState({});
    const [selectAll, setSelectAll] = useState(false);
    const [viewType, setViewType] = useState("active"); // 'active' or 'archived'
    const [managementModalOpen, setManagementModalOpen] = useState(false);
    const [managementType, setManagementType] = useState("");
    const [selectedOrderId, setSelectedOrderId] = useState(null);
    const [selectedOrderDetails, setSelectedOrderDetails] = useState({});
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [searchQuery, setSearchQuery] = useState(""); // <<< ADDED: State for search query
    const itemsPerPage = 5;
    const API_BASE_URL = 'http://127.0.0.1:8000/api';

    const makeAuthenticatedRequest = useCallback(async (method, url, data = null, config = {}) => {
        const token = localStorage.getItem("access_token");
        if (!token) { throw new Error("Unauthenticated: No token found."); }
        const headers = {
            'Authorization': `Bearer ${token}`,
            'Accept': 'application/json',
            ...(method !== 'get' && data ? { 'Content-Type': 'application/json' } : {}),
            ...(config.headers || {}),
        };
        const fullConfig = { ...config, headers };
        try {
            switch (method.toLowerCase()) {
                case 'get': return await axios.get(url, fullConfig);
                case 'post': return await axios.post(url, data, fullConfig);
                case 'put': return await axios.put(url, data, fullConfig);
                case 'delete': return await axios.delete(url, fullConfig);
                default: throw new Error(`Unsupported method: ${method}`);
            }
        } catch (error) { console.error(`Authenticated request failed: ${method.toUpperCase()} ${url}`, error.response || error); throw error; }
    }, []);

    // mapApiOrderToFrontendOrder remains the same
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
            if (lowerCaseShippingStatus === 'delivered' || lowerCaseOrderStatus === 'delivered') return 'Delivered';
            if (lowerCaseShippingStatus === 'shipped' || lowerCaseOrderStatus === 'shipped') return 'Shipped';
            if (lowerCaseOrderStatus === 'processing') return 'Preparing Shipment';
            return "Not Shipped";
        };
        const formatDate = (dateString) => { if (!dateString) return "-"; try { const date = new Date(dateString); const month = String(date.getMonth() + 1).padStart(2, '0'); const day = String(date.getDate()).padStart(2, '0'); const year = String(date.getFullYear()).slice(-2); return `${month}/${day}/${year}`; } catch (e) { return "-"; } };
        const formatPrice = (amount) => { const number = parseFloat(amount); return `₱ ${isNaN(number) ? '0.00' : number.toFixed(2)}`; };

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
        // Clear search on fetch? Maybe not, user might want search to persist.
        // setSearchQuery(""); // Optional: Reset search on manual fetch/view change
        try {
            // Fetch logic doesn't need modification for frontend search
            const response = await makeAuthenticatedRequest('get', `${API_BASE_URL}/orders`, null, {
                 params: { context: 'admin' } // Still fetches all relevant orders
            });

            if (Array.isArray(response.data)) {
                const rawOrders = response.data;
                const mappedOrders = rawOrders.map(mapApiOrderToFrontendOrder);
                setOrdersData(mappedOrders);
            } else {
                 // Handle paginated response structure if API provides it
                 if (response.data && Array.isArray(response.data.data)) {
                     const rawOrders = response.data.data;
                     const mappedOrders = rawOrders.map(mapApiOrderToFrontendOrder);
                     setOrdersData(mappedOrders);
                     // If backend pagination is used, you might need total pages from response
                     // setTotalPages(response.data.last_page || 1);
                 } else {
                     throw new Error("Invalid API response format: Expected an array of orders.");
                 }
            }
        } catch (err) {
            const errorMessage = err.message.startsWith("Unauthenticated") ? "Unauthenticated." : (err.response?.data?.message || err.message || 'Failed to fetch orders.');
            setError(errorMessage);
            setOrdersData([]);
        } finally {
            setLoading(false);
        }
    }, [makeAuthenticatedRequest]); // Keep dependencies minimal if fetch isn't dependent on search query

    useEffect(() => {
        fetchOrders();
    }, [fetchOrders]); // Fetch on initial mount

    // --- Filtering and Pagination Logic ---

    // Filter based on viewType first
    const viewFilteredOrders = ordersData.filter(order => order.isArchived === (viewType === "archived"));

    // Apply search filter (frontend)
    const searchedOrders = viewFilteredOrders.filter(order => {
        if (!searchQuery) return true; // No search query, show all in current view
        const query = searchQuery.toLowerCase().trim();
        if (!query) return true; // Handle empty/whitespace query

        // Check fields for inclusion of the search query
        return (
            order.id.toLowerCase().includes(query) ||
            order.paymentMethod.toLowerCase().includes(query) ||
            // order.total.toLowerCase().includes(query) || // Searching formatted currency might be tricky
            order.status.toLowerCase().includes(query) || // Search frontend status name
            order.shippingStatus.toLowerCase().includes(query) ||
            order.trackingNumber.toLowerCase().includes(query) ||
            order.date.toLowerCase().includes(query)
            // Optionally search product names (can be slow on large orders)
            // (order.orderDetails && order.orderDetails.some(detail =>
            //     detail.productName.toLowerCase().includes(query)
            // ))
        );
    });

    // Update total pages based on searched results
    useEffect(() => {
        const newTotalPages = Math.ceil(searchedOrders.length / itemsPerPage);
        setTotalPages(newTotalPages);
        // Reset page if current page becomes invalid after filtering/searching
        if (currentPage > newTotalPages && newTotalPages > 0) {
             setCurrentPage(newTotalPages); // Go to last available page
        } else if (currentPage === 0 && newTotalPages > 0) {
             setCurrentPage(1); // Ensure page is at least 1
        } else if (searchedOrders.length === 0 && currentPage !== 1) {
             setCurrentPage(1); // Reset to 1 if search yields no results
        }
    // Depend on searchedOrders length and current page for recalculation
    }, [searchedOrders.length, itemsPerPage, currentPage]);

    // Paginate the searched results
    const currentItems = searchedOrders.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    );

    // --- Event Handlers ---

    const handleCheckboxChange = (id) => {
        const key = String(id);
        setCheckedItems((prev) => {
            const newCheckedItems = { ...prev, [key]: !prev[key] };
            // Check if all currently *visible* items (after search/pagination) are selected
            const allVisibleSelected = currentItems.length > 0 && currentItems.every(item => newCheckedItems[String(item.id)]);
            setSelectAll(allVisibleSelected);
            return newCheckedItems;
        });
    };

    const handleSelectAllChange = (e) => {
        const isChecked = e.target.checked;
        setSelectAll(isChecked);
        const newCheckedRows = {};
        if (isChecked) {
            // Select only the items currently visible on the page
            currentItems.forEach((item) => { newCheckedRows[String(item.id)] = true; });
        }
        setCheckedItems(newCheckedRows);
    };

    // Update selectAll state if currentItems change (due to pagination or search)
    useEffect(() => {
        const allVisibleSelectedOnPage = currentItems.length > 0 && currentItems.every(item => checkedItems[String(item.id)]);
        setSelectAll(allVisibleSelectedOnPage);
    }, [currentItems, checkedItems]); // Depend on the items actually shown


    // Status change handler (remains the same logic as previous version)
    const handleStatusChange = async (event, orderId = null) => {
        const newFrontendStatus = event.target.value;
        const visibleCheckedIds = Object.keys(checkedItems).filter(id => checkedItems[id] && currentItems.some(item => String(item.id) === id));
        const selectedIds = orderId ? [String(orderId)] : visibleCheckedIds;

        if (selectedIds.length === 0 || !newFrontendStatus) return;

        let backendStatusToSend; let endpointSuffix; let method = 'put'; let payload = {};
        switch (newFrontendStatus) {
            case 'pending':
                backendStatusToSend = 'pending';
                endpointSuffix = '/status';
                payload = { status: backendStatusToSend };
                break;
            case 'processing':
                backendStatusToSend = 'processing';
                endpointSuffix = '/status';
                payload = { status: backendStatusToSend };
                break;
            case 'on-delivery':
                backendStatusToSend = 'delivered'; // Keep mapping as requested
                endpointSuffix = '/status';
                payload = { status: backendStatusToSend };
                console.warn("Sending 'delivered' status to backend when 'On Delivery' is selected. This is semantically incorrect.");
                break;
            default:
                console.warn("Unhandled status change selection:", newFrontendStatus);
                return;
        }

        const originalOrdersData = [...ordersData];
        setLoading(true);
        try {
            await Promise.all(
                 selectedIds.map(id =>
                     makeAuthenticatedRequest(method, `${API_BASE_URL}/orders/${id}${endpointSuffix}`, payload)
                 )
            );
            alert(`Order status updated successfully!`);
            await fetchOrders();
        } catch (err) {
            const errorMessage = err.message?.startsWith("Unauthenticated")
                ? "Unauthenticated."
                : (err.response?.data?.message || err.message || `Failed to update status.`);
            setError(errorMessage);
            if (orderId && event.target) {
                 const originalFrontendStatus = originalOrdersData.find(o => String(o.id) === orderId)?.status;
                 if (originalFrontendStatus) {
                     event.target.value = originalFrontendStatus;
                 }
            }
        } finally {
            setCheckedItems({});
            setSelectAll(false);
            setLoading(false);
        }
    };

    const handleOrderClick = (orderId) => { const order = ordersData.find(o => o.id === String(orderId)); if (order) { setSelectedOrderId(orderId); setSelectedOrderDetails(order); setManagementModalOpen(true); setManagementType("details"); } else { alert("Could not find order details."); } };
    const handleCloseManagement = () => { setManagementModalOpen(false); setManagementType(""); setSelectedOrderId(null); setSelectedOrderDetails({}); };

    const switchView = (newViewType) => {
         setViewType(newViewType);
         setCurrentPage(1); // Reset page when switching view
         setSearchQuery(""); // <<< ADDED: Clear search when switching view
         setCheckedItems({});
         setSelectAll(false);
         // fetchOrders(); // Fetch might be triggered by viewType change if included in fetchOrders deps
    };

    // <<< ADDED: Handler for search input changes >>>
    const handleSearchChange = (e) => {
        setSearchQuery(e.target.value);
        setCurrentPage(1); // Reset to first page on new search
    };


    // --- Render Logic ---

    if (loading && ordersData.length === 0) { return <div>Loading orders...</div>; }
    if (error && ordersData.length === 0) { return <div style={{ color: 'red' }}>Error: {error} <button onClick={fetchOrders} disabled={loading}>Retry</button></div>; }

    return (
        <div className="Orders">
             <h2 className="h2">{viewType === "active" ? "Active Orders" : "Archived Orders"}</h2>
             {error && ordersData.length > 0 && <p className="error-message" style={{textAlign:'center', marginBottom:'10px'}}>{error}</p>}
             <div className="table-header-actions">
                 {/* VVVVVV UPDATED SEARCH INPUT VVVVVV */}
                 <div className="search-bar">
                     <input
                         type="text"
                         placeholder="Search Orders..." // Updated placeholder
                         className="search-input"
                         value={searchQuery} // Bind value
                         onChange={handleSearchChange} // Add handler
                         disabled={loading} // Disable only during initial load
                     />
                 </div>
                 {/* ^^^^^^ UPDATED SEARCH INPUT ^^^^^^ */}

                 {/* Bulk Update only for Active view, "Cancel" removed */}
                 <div className="button-group" style={{ marginLeft: 'auto' }}> {viewType === "active" && ( <select className="orders-status-dropdown" onChange={(e) => handleStatusChange(e)} disabled={loading || Object.keys(checkedItems).filter(id => checkedItems[id]).length === 0} value=""> <option value="" disabled>Select status</option> <option value="pending">Pending</option> <option value="processing">Processing</option> <option value="on-delivery">On Delivery</option> </select> )} </div>
                 <div className="view-toggle"> <button className={`view-button ${viewType === "active" ? "active" : ""}`} onClick={() => switchView("active")} disabled={loading} > Active Orders </button> <button className={`view-button ${viewType === "archived" ? "active" : ""}`} onClick={() => switchView("archived")} disabled={loading} > Archived Orders </button> </div>
             </div>
             {loading && <div style={{textAlign:'center', padding: '10px'}}>Loading...</div>}

            <div className="table-container">
                <div className="table-header-wrapper">
                    <table className="orders-recently-sold">
                         <thead>
                             <tr className="thead"> <th className="th"> <input type="checkbox" checked={selectAll} onChange={handleSelectAllChange} disabled={loading || currentItems.length === 0}/> </th> <th className="th">Order ID</th> <th className="th">Payment Method</th> <th className="th">Total Amount</th> <th className="th">Status</th> <th className="th">Shipping Status</th> <th className="th">Tracking Number</th> <th className="th">Created At</th> </tr>
                         </thead>
                         <tbody>
                             {/* Use currentItems which is now filtered and paginated */}
                             {!loading && currentItems.length > 0 ? (
                                 currentItems.map((item) => (
                                     <tr key={item.id} className="tr">
                                         <td className="td"> <input type="checkbox" checked={checkedItems[item.id] || false} onChange={() => handleCheckboxChange(item.id)} disabled={loading}/> </td>
                                         <td className="td"> <button className="order-id-button" onClick={() => handleOrderClick(item.id)} disabled={loading}> {item.id} </button> </td>
                                         <td className="td">{item.paymentMethod}</td> <td className="td">{item.total}</td>
                                         {/* Status Column - Logic remains the same */}
                                         <td className="td">
                                             {viewType === "active" ? (
                                                 <select
                                                     className="status-dropdown"
                                                     onChange={(e) => handleStatusChange(e, item.id)}
                                                     value={item.status}
                                                     disabled={loading || ['cancelled', 'completed', 'return_requested'].includes(item.backendStatus)}
                                                 >
                                                     <option value="pending">Pending</option>
                                                     <option value="processing">Processing</option>
                                                     <option value="on-delivery">On Delivery</option>
                                                 </select>
                                             ) : (
                                                 <select
                                                     className="status-dropdown"
                                                     value={item.status}
                                                     disabled={true}
                                                     style={{ appearance: 'none', WebkitAppearance: 'none', MozAppearance: 'none', border:'none', background:'transparent', paddingRight: '0', cursor: 'default' }}
                                                 >
                                                     <option value="pending">Pending</option>
                                                     <option value="processing">Processing</option>
                                                     <option value="on-delivery">On Delivery</option>
                                                     <option value="completed">Completed</option>
                                                     <option value="cancelled">Cancelled</option>
                                                     <option value="return_requested">Return Requested</option>
                                                 </select>
                                             )}
                                         </td>
                                         <td className="td">{item.shippingStatus}</td> <td className="td">{item.trackingNumber}</td> <td className="td">{item.date}</td>
                                     </tr>
                                 ))
                            // Display message if search yields no results
                             ) : !loading && searchQuery ? (
                                 <tr className="tr"> <td colSpan={8} className="td" style={{ textAlign: "center", padding: "20px", backgroundColor: "#f9f9f9" }}> No orders match your search "{searchQuery}". </td> </tr>
                             ) : !loading ? (
                                 <tr className="tr"> <td colSpan={8} className="td" style={{ textAlign: "center", padding: "20px", backgroundColor: "#f9f9f9" }}> No {viewType} orders found. </td> </tr>
                             ) : null }
                         </tbody>
                    </table>
                </div>
                 {/* Pagination controls - totalPages is now based on searchedOrders */}
                 {totalPages > 1 && (
                     <div className="pagination">
                         <button onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))} disabled={loading || currentPage === 1}> Previous </button>
                         {/* Simple pagination buttons - consider more advanced component for many pages */}
                         {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => currentPage - 2 + i) // Show limited page numbers around current
                             .filter(page => page > 0 && page <= totalPages)
                             .map(page => (
                                 <button key={page} onClick={() => setCurrentPage(page)} className={currentPage === page ? "active" : ""} disabled={loading}> {page} </button>
                         ))}
                         {totalPages > 5 && currentPage < totalPages - 2 && <span>...</span>}
                         {totalPages > 5 && currentPage <= totalPages - 3 && <button onClick={() => setCurrentPage(totalPages)} disabled={loading}>{totalPages}</button>}

                         <button onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))} disabled={loading || currentPage === totalPages} > Next </button>
                     </div>
                 )}
            </div>
             {managementModalOpen && ( <OrdersManagement type={managementType} orderId={selectedOrderId} orderDetails={selectedOrderDetails?.orderDetails || []} shippingDetails={selectedOrderDetails || {}} viewType={viewType} onClose={handleCloseManagement} /> )}
        </div>
    );
};

export default Orders;