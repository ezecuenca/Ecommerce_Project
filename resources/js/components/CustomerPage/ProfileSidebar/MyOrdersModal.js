import React from "react";
import moment from 'moment';
import { FaSpinner, FaClock, FaCheckCircle, FaTimesCircle, FaTruck } from "react-icons/fa";

const getStatusInfo = (status) => {
    switch (status?.toLowerCase()) {
        case 'pending': return { text: 'Pending', className: 'pending', icon: <FaClock /> };
        case 'processing': return { text: 'Processing', className: 'processing', icon: <FaSpinner className="spinner"/> };
        case 'shipped': return { text: 'On Delivery', className: 'on-delivery', icon: <FaTruck /> };
        case 'delivered': return { text: 'Completed', className: 'completed', icon: <FaCheckCircle /> };
        case 'cancelled': return { text: 'Cancelled', className: 'canceled', icon: <FaTimesCircle /> };
        default: return { text: status || 'Unknown', className: 'unknown', icon: <FaClock /> };
    }
};

const MyOrdersModal = ({ type, order, onConfirm, onClose, isLoading }) => {

    if (!order) return null;

    if (type === 'cancel') {
        return (
            <div className="modal-overlay" onClick={onClose}>
                <div className="modal-content cancel-modal-content" onClick={e => e.stopPropagation()}>
                    <h2>Are you sure you want to cancel your order?</h2>
                    <p>Order #{order.id} will be cancelled.</p>
                    <p>This action cannot be undone.</p>
                    <div className="modal-actions">
                        <button className="confirm-btn" onClick={onConfirm} disabled={isLoading}>
                            {isLoading ? <FaSpinner className="spinner" /> : 'Confirm Cancel'}
                        </button>
                        <button className="cancel-btn" onClick={onClose} disabled={isLoading}>
                            Keep Order
                        </button>
                    </div>
                </div>
            </div>
        );
    } else if (type === 'details') {
        const statusInfo = getStatusInfo(order.status);
        const orderDetailsArray = order.order_details;
        const detailsExist = Array.isArray(orderDetailsArray) && orderDetailsArray.length > 0;

        return (
            <div className="modal-overlay" onClick={onClose}>
                <div className="modal-content order-details-modal" onClick={e => e.stopPropagation()}>
                    <h2>Order Details</h2>
                    <button className="close-modal-btn" onClick={onClose}>×</button>
                    <div className="order-summary">
                        <p><strong>Order #:</strong> {order.id || 'N/A'}</p>
                        <p><strong>Date:</strong> {moment(order.order_date || order.created_at).isValid() ? moment(order.order_date || order.created_at).format('MMMM DD, YYYY hh:mm A') : 'N/A'}</p>
                        <p><strong>Status:</strong> <span className={`status-badge ${statusInfo.className}`}>{statusInfo.text}</span></p>
                        <p><strong>Tracking #:</strong> {order.shipping?.tracking_number || 'N/A'}</p>
                        <p><strong>Shipping Method:</strong> {order.shipping?.shipping_method || 'N/A'}</p>
                        <p><strong>Shipping Address:</strong> {order.shipping?.shipping_address || 'N/A'}</p>
                        <p><strong>Contact:</strong> {order.shipping?.contact_number || 'N/A'}</p>
                    </div>
                    <h3>Items Ordered:</h3>
                    <div className="order-items-list">
                        {detailsExist ? (
                            orderDetailsArray.map((detail) => {
                                const productName = detail?.product?.product_name;
                                const price = parseFloat(detail?.price || 0);
                                const quantity = detail?.quantity || 0;
                                const imageUrl = detail?.product?.image_url;

                                return (
                                    <div className="order-item-detail" key={detail?.id || `detail-${productName}`}>
                                        <div className="item-detail-img">
                                            {imageUrl ? (
                                                <img src={imageUrl} alt={productName || 'Product'} />
                                            ) : (
                                                <div className="placeholder-img"></div>
                                            )}
                                        </div>
                                        <div className="item-detail-info">
                                            <span className="item-detail-name">{productName || `Product ID: ${detail?.product_id || 'Unknown'}`}</span>
                                            <span className="item-detail-qty-price">Qty: {quantity} x ₱{price.toFixed(2)}</span>
                                        </div>
                                        <span className="item-detail-total">₱{(price * quantity).toFixed(2)}</span>
                                    </div>
                                );
                            })
                        ) : (
                            <p>No item details available.</p>
                        )}
                    </div>
                     <div className="modal-actions" style={{ justifyContent: 'flex-end', marginTop: '20px' }}>
                         <button className="cancel-btn" onClick={onClose}>Close</button>
                     </div>
                </div>
            </div>
        );
    }

    return null;
};

export default MyOrdersModal;