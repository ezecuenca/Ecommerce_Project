import React from "react";

const OrdersManagement = ({ type, orderId, orderDetails, viewType, onClose, shippingDetails }) => { // Removed onConfirm and selectedOrders props

    const handleCancel = () => {
        onClose();
    };

    return (
        <div className="OrdersManagement">
            <div className="modal-overlay" onClick={onClose}>
                <div className="modal-content" onClick={e => e.stopPropagation()}>
                    <div className="modal-header">
                        <h3 className="modal-title">Details for Order ID: {shippingDetails.id || orderId || "N/A"}</h3>
                        <button className="modal-close-button" onClick={onClose}>
                            ×
                        </button>
                    </div>
                    <table className="modal-table">
                        <thead>
                            <tr>
                                <th>Product</th>
                                <th>Quantity</th>
                                <th>Price</th>
                            </tr>
                        </thead>
                        <tbody>
                            {orderDetails && orderDetails.length > 0 ? (
                                orderDetails.map((detail, index) => (
                                    <tr key={index}>
                                        <td className="modal-product-cell">
                                            <img src={detail.image} alt={`${detail.productName} Icon`} className="modal-product-icon" />
                                            <span className="modal-product-name">{detail.productName}</span>
                                        </td>
                                        <td className="modal-quantity">{detail.quantity}</td>
                                        <td className="modal-price">{detail.price}</td>
                                    </tr>
                                ))
                             ) : (
                                 <tr><td colSpan="3">No item details available.</td></tr>
                             )}
                        </tbody>
                    </table>
                    <div className="shipping-details">
                        <h4 className="shipping-details-header">Shipping Details</h4>
                        <p><strong>Address:</strong> {shippingDetails.shippingAddress || "N/A"}</p>
                        <p><strong>Method:</strong> {shippingDetails.shippingMethod || "N/A"}</p>
                        <p><strong>Shipping Date:</strong> {shippingDetails.shippingDate || "N/A"}</p>
                         <p><strong>Tracking:</strong> {shippingDetails.trackingNumber || "N/A"}</p>
                         <p><strong>Shipping Status:</strong> {shippingDetails.shippingStatus || "N/A"}</p>
                    </div>
                     <div className="button-group">
                         <button className="cancel-button" onClick={onClose}>Close</button>
                      </div>

                </div>
            </div>
        </div>
    );
};

export default OrdersManagement;