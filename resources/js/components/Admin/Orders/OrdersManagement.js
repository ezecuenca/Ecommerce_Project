import React from "react";
import { FaUndo } from "react-icons/fa"; // For Restore icon

const OrdersManagement = ({ type, orderId, orderDetails, selectedOrders, viewType, onClose, onConfirm }) => {
    const handleConfirmRestore = () => {
        onConfirm(); // Trigger the restore logic in Orders.js
    };

    const handleCancel = () => {
        onClose();
    };

    if (type === "individual" || type === "bulk") {
        const title = type === "individual" 
            ? `Confirm Restore Order ID: ${orderId || selectedOrders[0]?.id || "Unknown"}` 
            : `Confirm Restore ${selectedOrders.filter(order => order).length} Order(s)`; // Ensure only valid orders are counted
        const message = type === "individual"
            ? `Are you sure you want to restore Order ID ${orderId || selectedOrders[0]?.id || "Unknown"}?`
            : `Are you sure you want to restore ${selectedOrders.filter(order => order).length} order(s)?`;

        return (
            <div className="OrdersManagement">
                <div className="modal-overlay" onClick={onClose}>
                    <div className="modal-content" onClick={e => e.stopPropagation()}>
                        <h3 className="modal-title">{title}</h3>
                        <p>{message}</p>
                        <div className="button-group">
                            <button className="restore-button" onClick={handleConfirmRestore}>
                                Restore
                            </button>
                            <button className="cancel-button" onClick={handleCancel}>
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        );
    } else {
        // Default to showing order details if not a restore confirmation
        return (
            <div className="OrdersManagement">
                <div className="modal-overlay" onClick={onClose}>
                    <div className="modal-content" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3 className="modal-title">Details for Order ID: {orderId}</h3>
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
                                {orderDetails.map((detail, index) => (
                                    <tr key={index}>
                                        <td className="modal-product-cell">
                                            <img src={detail.image} alt={`${detail.productName} Icon`} className="modal-product-icon" />
                                            <span className="modal-product-name">{detail.productName}</span>
                                        </td>
                                        <td className="modal-quantity">{detail.quantity}</td>
                                        <td className="modal-price">{detail.price}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        {/* Add Archive/Restore buttons based on viewType */}
                        {viewType === "active" ? (
                            <div className="button-group">
                                <button className="delete-button" onClick={() => alert(`Order ${orderId} would be archived. Implement archive logic here.`)}>
                                    Archive
                                </button>
                            </div>
                        ) : (
                            <div className="button-group">
                                <button className="restore-button" onClick={() => handleRestore(orderId)}>
                                    Restore
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        );
    }
};

export default OrdersManagement;