// MyOrders.js (Corrected with Authentication)
import React, { useState, useEffect, useCallback, useContext } from "react"; // Added useContext
import { Link } from 'react-router-dom'; // Import Link for login prompt
import MyOrdersModal from "./MyOrdersModal"; // Assuming path is correct
import Axios from 'axios';
import moment from 'moment';
import { FaSpinner, FaClock, FaCheckCircle, FaTimesCircle, FaShippingFast, FaEye, FaUndo, FaThumbsUp, FaCheck } from "react-icons/fa";
import { AuthContext } from "../../AuthContext"; // <<<< IMPORT AuthContext (Adjust path)

// --- Loading Component (Example) ---
const LoadingIndicator = ({ message = "Loading..." }) => (
    <div className="my-orders" style={{ padding: '20px', textAlign: 'center', minHeight: '200px', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
        <p>{message} <FaSpinner className="spinner" /></p>
    </div>
);

// VVVVVV MODIFIED getStatusInfo VVVVVV
const getStatusInfo = (status) => {
    const lowerCaseStatus = status?.toLowerCase();
    switch (lowerCaseStatus) {
        case 'pending': return { text: 'Pending', className: 'pending', icon: <FaClock /> };
        case 'processing': return { text: 'Processing', className: 'processing', icon: <FaSpinner className="spinner"/> };
        case 'shipped': return { text: 'Shipped', className: 'on-delivery', icon: <FaShippingFast /> };
        // Change display text for 'delivered' status
        case 'delivered': return { text: 'On Delivery', className: 'delivered-action', icon: <FaShippingFast /> }; // Changed text to 'On Delivery', kept className/icon for button logic
        case 'completed': return { text: 'Completed', className: 'completed', icon: <FaCheckCircle /> };
        case 'cancelled': return { text: 'Cancelled', className: 'canceled', icon: <FaTimesCircle /> };
        case 'return_requested': return { text: 'Return Requested', className: 'processing', icon: <FaUndo /> };
        default: return { text: status || 'Unknown', className: 'unknown', icon: <FaClock /> };
    }
};
// ^^^^^^ MODIFIED getStatusInfo ^^^^^^

const MyOrders = () => {
    // --- State ---
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalType, setModalType] = useState('');
    const [selectedOrder, setSelectedOrder] = useState(null);
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true); // Loading state for fetching orders
    const [error, setError] = useState(null);
    const [actionLoading, setActionLoading] = useState(null); // Store ID of order being actioned

    // --- Context ---
    const { user, loading: authLoading } = useContext(AuthContext); // Get user/auth state

    const API_BASE_URL = 'http://localhost:8000/api';

    // --- Fetch Orders (Authenticated) ---
    const fetchOrders = useCallback(async () => {
        // Guard: Wait for auth, ensure user logged in
        if (authLoading || !user) {
            setLoading(false);
            if (!authLoading && !user) setOrders([]); // Clear if known logged out
            return;
        }

        setLoading(true); setError(null);
        console.log("[MyOrders] Fetching orders..."); // DEBUG
        try {
            const token = localStorage.getItem("access_token");
            if (!token) throw new Error("Auth token not found.");

            // Call API with Auth Header
            const response = await Axios.get(`${API_BASE_URL}/orders`, {
                 headers: {
                     'Authorization': `Bearer ${token}`,
                     'Accept': 'application/json',
                 }
                 // Removed withCredentials: true - typically not needed with Bearer tokens
            });
            console.log("[MyOrders] API response:", response.data); // DEBUG

             // Handle both paginated and direct array responses
             let rawOrders = [];
             if (response.data && Array.isArray(response.data.data)) { // Paginated?
                 rawOrders = response.data.data;
             } else if (Array.isArray(response.data)){ // Direct array?
                 rawOrders = response.data;
             } else {
                 console.error("[MyOrders] Invalid data format received:", response.data);
                 throw new Error("Invalid data format received");
             }
             setOrders(rawOrders);

        } catch (err) {
            console.error("[MyOrders] Error fetching orders:", err.response || err.message || err);
            let errMsg = "Failed to load your orders.";
            if (err.response?.status === 401) { errMsg = "Please log in to view your orders."; }
            else if (err.response?.data?.message) { errMsg = err.response.data.message; }
            else if (err.message) { errMsg = err.message; }
            setError(errMsg);
            setOrders([]);
        } finally {
            setLoading(false);
        }
    }, [user, authLoading]); // Depend on auth state

    // Trigger fetch on mount and when auth state changes
    useEffect(() => { fetchOrders(); }, [fetchOrders]);


    // --- Action Handlers (Now Authenticated) ---

    // Function to get token for actions
    const getAuthHeaders = () => {
        const token = localStorage.getItem("access_token");
        if (!token) {
            setError("Authentication error. Please log in again.");
            throw new Error("Auth token not found."); // Stop action
        }
        return {
            'Authorization': `Bearer ${token}`,
            'Accept': 'application/json',
        };
    };

    const handleCancelClick = (order) => {
        if (order.status?.toLowerCase() !== 'pending' && order.status?.toLowerCase() !== 'processing') {
            alert(`Cannot cancel order with status: ${order.status}`); return;
        }
        setSelectedOrder(order); setModalType('cancel'); setIsModalOpen(true);
    };

     const handleViewDetailsClick = (order) => {
         setSelectedOrder(order); setModalType('details'); setIsModalOpen(true);
     };

    const handleConfirmCancel = async () => {
        if (!selectedOrder) return;
        setActionLoading(selectedOrder.id); setError(null);
        try {
            const headers = getAuthHeaders(); // Get token/headers
            await Axios.put(`${API_BASE_URL}/orders/${selectedOrder.id}/cancel`, {}, { headers }); // Pass headers
            // Optimistic UI update
            setOrders(prevOrders => prevOrders.map(o => o.id === selectedOrder.id ? { ...o, status: 'cancelled' } : o ));
            setIsModalOpen(false); setSelectedOrder(null); setModalType('');
            // Optionally re-fetch for consistency: await fetchOrders();
        } catch (err) {
            console.error(`Error cancelling order ${selectedOrder.id}:`, err.response || err.message || err);
            setError(`Failed to cancel order. ${err.response?.data?.message || err.message}`);
        } finally { setActionLoading(null); }
    };

    const handleMarkReceivedClick = async (order) => {
        setActionLoading(order.id); setError(null);
        try {
            const headers = getAuthHeaders(); // Get token/headers
             await Axios.put(`${API_BASE_URL}/orders/${order.id}/mark-completed`, {}, { headers }); // Pass headers
             // Optimistic UI update
             setOrders(prevOrders => prevOrders.map(o => o.id === order.id ? { ...o, status: 'completed' } : o ));
             // Optionally re-fetch for consistency: await fetchOrders();
        } catch (err) {
             console.error(`Error marking order ${order.id} as completed:`, err.response || err.message || err);
             setError(`Failed mark as received. ${err.response?.data?.message || err.message}`);
        } finally { setActionLoading(null); }
    };

    const handleReturnRequestClick = async (order) => {
        if (!window.confirm("Are you sure you want to request a return/refund for this order?")) { return; }
        setActionLoading(order.id); setError(null);
        try {
            const headers = getAuthHeaders(); // Get token/headers
             await Axios.put(`${API_BASE_URL}/orders/${order.id}/request-return`, {}, { headers }); // Pass headers
             // Optimistic UI update
             setOrders(prevOrders => prevOrders.map(o => o.id === order.id ? { ...o, status: 'return_requested' } : o ));
             // Optionally re-fetch for consistency: await fetchOrders();
        } catch (err) {
             console.error(`Error requesting return for order ${order.id}:`, err.response || err.message || err);
             setError(`Failed request return. ${err.response?.data?.message || err.message}`);
        } finally { setActionLoading(null); }
     };

    const handleCloseModal = () => { setIsModalOpen(false); setSelectedOrder(null); setModalType(''); setError(null); };

    // --- Filtering Logic (remains the same) ---
    const upcomingOrders = Array.isArray(orders) ? orders.filter(order => {
        const status = order.status?.toLowerCase();
        // 'delivered' items still show buttons, so they are considered "upcoming" actions for the user
        return ['pending', 'processing', 'shipped', 'delivered'].includes(status);
    }) : [];
    const previousOrders = Array.isArray(orders) ? orders.filter(order => {
        const status = order.status?.toLowerCase();
        // Only truly finished/inactive orders go here
        return ['completed', 'cancelled', 'return_requested'].includes(status);
    }) : [];


    // --- Render Order Card (uses updated getStatusInfo) ---
    const renderOrderCard = (order) => {
        // getStatusInfo now returns { text: 'On Delivery', ... } for 'delivered' status
        const statusInfo = getStatusInfo(order.status);
        // This condition remains the same - triggers buttons when backend status is 'delivered'
        const isDelivered = order.status?.toLowerCase() === 'delivered';
        const canCancel = order.status?.toLowerCase() === 'pending' || order.status?.toLowerCase() === 'processing';
        const isLoadingAction = actionLoading === order.id;

        return (
             <div className="order-card" key={order.id}>
                <div className="order-header"> <span className="order-number">Order #{order.id}</span> </div>
                <div className="order-details">
                     <div className="status-container">
                         <div className="date-time-previous">
                              <span className="order-date">{moment(order.order_date || order.created_at).format('MMMM DD, YYYY')}</span>
                              <span className="order-time">{moment(order.order_date || order.created_at).format('hh:mm A')}</span>
                         </div>
                         <div className="order-status-wrapper">
                             <span className="clock-icon">{statusInfo.icon}</span>
                             {/* Displays 'On Delivery' text when status is 'delivered' */}
                             <span className={`order-status ${statusInfo.className}`}>{statusInfo.text}</span>
                         </div>
                     </div>
                 </div>
                 <div className="order-total-amount">
                     <span className="total-amount-label">Total Amount:</span>
                     <span className="total-amount-value">₱{parseFloat(order.total_amount || 0).toFixed(2)}</span>
                 </div>
                 <div className="order-card-actions">
                      <button className="view-details-btn" onClick={() => handleViewDetailsClick(order)} disabled={isLoadingAction}> <FaEye style={{ marginRight: '5px'}} /> View </button>
                     {canCancel && ( <button className="cancel-btn" onClick={() => handleCancelClick(order)} disabled={isLoadingAction}>Cancel Order</button> )}
                     {/* Buttons appear based on isDelivered which still checks for backend 'delivered' status */}
                     {isDelivered && (
                         <>
                             <button className="confirm-received-btn" onClick={() => handleMarkReceivedClick(order)} disabled={isLoadingAction}> {isLoadingAction ? <FaSpinner className="spinner"/> : <><FaCheck style={{ marginRight: '5px'}} /> Received</>} </button>
                             <button className="return-refund-btn" onClick={() => handleReturnRequestClick(order)} disabled={isLoadingAction}> {isLoadingAction ? <FaSpinner className="spinner"/> : <><FaUndo style={{ marginRight: '5px'}} /> Return/Refund</>} </button>
                         </>
                     )}
                 </div>
            </div>
         );
     };

     // --- Render Logic ---

    // Handle initial auth loading
    if (authLoading) return <LoadingIndicator message="Loading user information..." />;

    // Handle not logged in (after auth check)
     if (!user) return (
          <div className="my-orders" style={{textAlign: 'center', padding: '20px'}}>
              <p>Please <Link to="/login">log in</Link> to view your orders.</p>
          </div>
     );

     // Handle loading orders state
     if (loading) return <LoadingIndicator message="Loading your orders..." />;


    // Render main content
    return (
        <div className="my-orders">
             {error && <div className="error-message" style={{color: 'red', marginBottom: '15px', textAlign: 'center'}}>{error} <button onClick={fetchOrders} disabled={loading || !!actionLoading}>Retry</button></div>}

            <div className="order-section">
                <h1 className="upcoming-orders-header">My Orders</h1>
                 {/* Check loading state *before* checking upcomingOrders length */}
                 {!loading && upcomingOrders.length === 0 && !error && <p className="no-orders-message">No active orders found.</p>}
                 {!loading && upcomingOrders.length > 0 && <div className="order-list">{upcomingOrders.map(renderOrderCard)}</div>}
            </div>

            <div className="order-section">
                <h2 className="previous-orders-header">Order History</h2>
                {/* Check loading state *before* checking previousOrders length */}
                 {!loading && previousOrders.length === 0 && !error && <p className="no-orders-message">No previous orders found.</p>}
                 {!loading && previousOrders.length > 0 && <div className="order-list">{previousOrders.map(renderOrderCard)}</div>}
            </div>

            {/* Modal (remains the same) */}
            {isModalOpen && (
                <MyOrdersModal
                    type={modalType}
                    order={selectedOrder}
                    onConfirm={modalType === 'cancel' ? handleConfirmCancel : null}
                    onClose={handleCloseModal}
                    isLoading={actionLoading === selectedOrder?.id && modalType === 'cancel'}
                />
            )}
        </div>
    );
};

export default MyOrders;