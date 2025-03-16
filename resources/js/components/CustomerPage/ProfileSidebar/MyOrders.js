import React, { useState } from "react";
import MyOrdersModal from "./MyOrdersModal"; // Import the modal component

const MyOrders = () => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedOrder, setSelectedOrder] = useState(null);

    const handleCancelClick = (orderNumber) => {
        setSelectedOrder(orderNumber);
        setIsModalOpen(true);
    };

    const handleConfirmCancel = () => {
        // Add logic to cancel the order here (e.g., API call)
        console.log(`Order ${selectedOrder} canceled`);
        setIsModalOpen(false);
        setSelectedOrder(null);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setSelectedOrder(null);
    };

    return (
        <div className="my-orders">
            <div className="order-section">
                <h1 className="upcoming-orders-header">Upcoming orders</h1>
                <div className="order-list">
                    <div className="order-card">
                        <div className="order-header">
                            <span className="order-number">Order #123456</span>
                        </div>
                        <div className="order-details">
                            <div className="status-container">
                                <span className="track-label">Track Progress</span>
                                <div className="order-status-wrapper">
                                    <span className="clock-icon">🕒</span>
                                    <span className="order-status on-delivery">On Delivery</span>
                                </div>
                            </div>
                        </div>
                        <div className="cancel-button-container">
                            <button
                                className="cancel-btn"
                                onClick={() => handleCancelClick("Order #123456")}
                            >
                                Cancel Order
                            </button>
                        </div>
                    </div>
                    <div className="order-card">
                        <div className="order-header">
                            <span className="order-number">Order #11112</span>
                        </div>
                        <div className="order-details">
                            <div className="status-container">
                                <span className="track-label">Track Progress</span>
                                <div className="order-status-wrapper">
                                    <span className="clock-icon">🕒</span>
                                    <span className="order-status processing">Processing</span>
                                </div>
                            </div>
                        </div>
                        <div className="cancel-button-container">
                            <button
                                className="cancel-btn"
                                onClick={() => handleCancelClick("Order #11112")}
                            >
                                Cancel Order
                            </button>
                        </div>
                    </div>
                </div>
            </div>
            <div className="order-section">
                <h2 className="previous-orders-header">Previous orders</h2>
                <div className="order-list">
                    <div className="order-card">
                        <div className="order-header">
                            <span className="order-number">Order #14256</span>
                            <span className="order-status completed">Completed</span>
                        </div>
                        <div className="order-details">
                            <span className="order-date">September 16, 2020</span>
                            <span className="order-time">01:54 PM</span>
                        </div>
                        <div className="order-products">
                            <div className="product-item">
                                <div className="product-image-placeholder"></div>
                                <span className="product-name">Product 1</span>
                                <span className="quantity">1x</span>
                            </div>
                            <div className="product-item">
                                <div className="product-image-placeholder"></div>
                                <span className="product-name">Product 2</span>
                                <span className="quantity">2x</span>
                            </div>
                            <div className="product-item">
                                <div className="product-image-placeholder"></div>
                                <span className="product-name">Product 3</span>
                                <span className="quantity">3x</span>
                            </div>
                            <button className="view-more-btn">View More</button>
                        </div>
                    </div>
                    <div className="order-card">
                        <div className="order-header">
                            <span className="order-number">Order #32561</span>
                            <span className="order-status canceled">Canceled</span>
                        </div>
                        <div className="order-details">
                            <span className="order-date">August 29, 2020</span>
                            <span className="order-time">02:06 AM</span>
                        </div>
                        <div className="order-products">
                            <div className="product-item">
                                <div className="product-image-placeholder"></div>
                                <span className="product-name">Product 1</span>
                                <span className="quantity">1x</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {isModalOpen && (
                <MyOrdersModal
                    orderNumber={selectedOrder}
                    onConfirm={handleConfirmCancel}
                    onClose={handleCloseModal}
                />
            )}
        </div>
    );
};

export default MyOrders;