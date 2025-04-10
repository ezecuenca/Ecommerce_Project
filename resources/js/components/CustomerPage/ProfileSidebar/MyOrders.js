import React, { useState, useEffect, useCallback } from "react";
import MyOrdersModal from "./MyOrdersModal";
import Axios from 'axios';
import moment from 'moment';
// Added FaCheck, FaUndo, FaThumbsUp
import { FaSpinner, FaClock, FaCheckCircle, FaTimesCircle, FaTruck, FaEye, FaBoxOpen, FaShippingFast, FaUndo, FaThumbsUp, FaCheck } from "react-icons/fa";

// Updated getStatusInfo to handle new user-driven statuses
const getStatusInfo = (status) => { // Now only needs status string
    const lowerCaseStatus = status?.toLowerCase();
    switch (lowerCaseStatus) {
        case 'pending': return { text: 'Pending', className: 'pending', icon: <FaClock /> };
        case 'processing': return { text: 'Processing', className: 'processing', icon: <FaSpinner className="spinner"/> };
        case 'shipped': return { text: 'Shipped', className: 'on-delivery', icon: <FaShippingFast /> };
        case 'delivered': return { text: 'Delivered', className: 'delivered-action', icon: <FaThumbsUp /> }; // Special style/icon
        case 'completed': return { text: 'Completed', className: 'completed', icon: <FaCheckCircle /> };
        case 'cancelled': return { text: 'Cancelled', className: 'canceled', icon: <FaTimesCircle /> };
        case 'return_requested': return { text: 'Return Requested', className: 'processing', icon: <FaUndo /> }; // Use processing style?
        default: return { text: status || 'Unknown', className: 'unknown', icon: <FaClock /> };
    }
};

const MyOrders = () => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalType, setModalType] = useState('');
    const [selectedOrder, setSelectedOrder] = useState(null);
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [actionLoading, setActionLoading] = useState(null); // Store ID of order being actioned

    const API_BASE_URL = 'http://localhost:8000/api';

    const fetchOrders = useCallback(async () => {
        setLoading(true); setError(null);
        try {
            const response = await Axios.get(`${API_BASE_URL}/orders`, { withCredentials: true });
             let rawOrders = [];
             if (response.data && Array.isArray(response.data.data)) { rawOrders = response.data.data; }
             else if (Array.isArray(response.data)){ rawOrders = response.data; }
             else { throw new Error("Invalid data format received"); }
             setOrders(rawOrders);
        } catch (err) {
            console.error("Error fetching orders:", err);
            let errMsg = "Failed to load your orders.";
            if (err.response?.status === 401) { errMsg = "Please log in to view your orders."; }
            else if (err.response?.data?.message) { errMsg = err.response.data.message; }
            else if (err.message) { errMsg = err.message; }
            setError(errMsg);
            setOrders([]);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { fetchOrders(); }, [fetchOrders]);

    // --- Action Handlers ---
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
        setActionLoading(selectedOrder.id); setError(null); // Indicate loading for this order
        try {
            await Axios.put(`${API_BASE_URL}/orders/${selectedOrder.id}/cancel`, {}, { withCredentials: true });
            // Update state optimistically or re-fetch
             setOrders(prevOrders => prevOrders.map(o =>
                 o.id === selectedOrder.id ? { ...o, status: 'cancelled' } : o
             ));
            setIsModalOpen(false); setSelectedOrder(null); setModalType('');
        } catch (err) {
            console.error(`Error cancelling order ${selectedOrder.id}:`, err);
            setError(`Failed to cancel order. ${err.response?.data?.message || err.message}`);
        } finally {
            setActionLoading(null); // Clear loading indicator
        }
    };

    // --- NEW Handler for User Marking as Completed ---
    const handleMarkReceivedClick = async (order) => {
        setActionLoading(order.id); setError(null); // Indicate loading for this order
        try {
             await Axios.put(`${API_BASE_URL}/orders/${order.id}/mark-completed`, {}, { withCredentials: true });
             // Update state optimistically
              setOrders(prevOrders => prevOrders.map(o =>
                  o.id === order.id ? { ...o, status: 'completed' } : o
              ));
             // Optionally show a success message
             // alert("Order marked as received!");
        } catch (err) {
             console.error(`Error marking order ${order.id} as completed:`, err);
             setError(`Failed mark as received. ${err.response?.data?.message || err.message}`);
        } finally {
             setActionLoading(null); // Clear loading indicator
        }
    };

    // --- NEW Handler for User Requesting Return ---
    const handleReturnRequestClick = async (order) => {
        if (!window.confirm("Are you sure you want to request a return/refund for this order?")) { return; }
        setActionLoading(order.id); setError(null); // Indicate loading for this order
        try {
             await Axios.put(`${API_BASE_URL}/orders/${order.id}/request-return`, {}, { withCredentials: true });
             // Update state optimistically
              setOrders(prevOrders => prevOrders.map(o =>
                  o.id === order.id ? { ...o, status: 'return_requested' } : o
              ));
        } catch (err) {
             console.error(`Error requesting return for order ${order.id}:`, err);
             setError(`Failed request return. ${err.response?.data?.message || err.message}`);
        } finally {
             setActionLoading(null); // Clear loading indicator
        }
     };

    const handleCloseModal = () => { setIsModalOpen(false); setSelectedOrder(null); setModalType(''); setError(null); };

    // --- Filtering Logic Updated ---
    const upcomingOrders = Array.isArray(orders) ? orders.filter(order => {
        const status = order.status?.toLowerCase();
        // Stays upcoming if pending, processing, shipped, OR delivered
        return ['pending', 'processing', 'shipped', 'delivered'].includes(status);
    }) : [];

    const previousOrders = Array.isArray(orders) ? orders.filter(order => {
        const status = order.status?.toLowerCase();
         // Moves to previous if completed by user, cancelled, or return requested
        return ['completed', 'cancelled', 'return_requested'].includes(status);
    }) : [];

    const renderOrderCard = (order) => {
        const statusInfo = getStatusInfo(order.status); // Pass only the status string
        const isDelivered = order.status?.toLowerCase() === 'delivered';
        const canCancel = order.status?.toLowerCase() === 'pending' || order.status?.toLowerCase() === 'processing';
        const isLoadingAction = actionLoading === order.id; // Check if action is loading for THIS card

        return (
             <div className="order-card" key={order.id}>
                <div className="order-header"> <span className="order-number">Order #{order.id}</span> </div>
                <div className="order-details">
                     <div className="status-container">
                         {/* Show date/time unless it's delivered awaiting action? Maybe show always */}
                         <div className="date-time-previous">
                              <span className="order-date">{moment(order.order_date || order.created_at).format('MMMM DD, YYYY')}</span>
                              <span className="order-time">{moment(order.order_date || order.created_at).format('hh:mm A')}</span>
                         </div>
                         <div className="order-status-wrapper">
                             <span className="clock-icon">{statusInfo.icon}</span>
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
                     {/* Conditional Buttons */}
                     {canCancel && (
                         <button className="cancel-btn" onClick={() => handleCancelClick(order)} disabled={isLoadingAction}>Cancel Order</button>
                      )}
                     {isDelivered && (
                         <>
                             <button className="confirm-received-btn" onClick={() => handleMarkReceivedClick(order)} disabled={isLoadingAction}>
                                  {isLoadingAction ? <FaSpinner className="spinner"/> : <><FaCheck style={{ marginRight: '5px'}} /> Received</>}
                             </button>
                             <button className="return-refund-btn" onClick={() => handleReturnRequestClick(order)} disabled={isLoadingAction}>
                                 {isLoadingAction ? <FaSpinner className="spinner"/> : <><FaUndo style={{ marginRight: '5px'}} /> Return/Refund</>}
                              </button>
                         </>
                     )}
                     {/* No buttons shown for completed, cancelled, return_requested besides View */}
                 </div>
            </div>
         );
     };

    return (
        <div className="my-orders">
             {error && <div className="error-message" style={{color: 'red', marginBottom: '15px', textAlign: 'center'}}>{error} <button onClick={fetchOrders} disabled={loading || !!actionLoading}>Retry</button></div>}
             {/* Removed global action loading - handled per card */}
            <div className="order-section">
                <h1 className="upcoming-orders-header">My Orders</h1>
                {loading ? ( <p>Loading orders... <FaSpinner className="spinner" /></p> )
                 : upcomingOrders.length > 0 ? ( <div className="order-list">{upcomingOrders.map(order => renderOrderCard(order))}</div> )
                 : ( !error && <p className="no-orders-message">No active orders found.</p> )}
            </div>
            <div className="order-section">
                <h2 className="previous-orders-header">Order History</h2>
                 {loading ? ( <p>Loading orders...</p> )
                 : previousOrders.length > 0 ? ( <div className="order-list">{previousOrders.map(order => renderOrderCard(order))}</div> )
                 : ( !error && <p className="no-orders-message">No previous orders found.</p> )}
            </div>

            {isModalOpen && (
                <MyOrdersModal
                    type={modalType}
                    order={selectedOrder}
                    onConfirm={modalType === 'cancel' ? handleConfirmCancel : null}
                    onClose={handleCloseModal}
                    isLoading={actionLoading === selectedOrder?.id && modalType === 'cancel'} // Show loading in modal only if cancelling this specific order
                />
            )}
        </div>
    );
};

export default MyOrders;