import React from "react";
import { useLocation, useNavigate } from "react-router-dom";

const OrderComplete = () => {
    const location = useLocation();
    const navigate = useNavigate();

    const orderState = location.state || {};
    const orderId = orderState.orderId || 'N/A';
    const shippingInfo = orderState.shippingInfo || {};
    const trackingNumber = orderState?.shipping?.tracking_number || 'Processing';

    const handleTrackOrder = () => {
        navigate("/customer/my-orders");
    };

    const handleContinueShopping = () => {
        navigate("/customer/products");
    };

    return (
        <div className="order-complete">
            <div className="order-complete-content">
                <div className="confirmation-icon"></div>
                <div className="confirmation-text">
                    <h1>ORDER SUCCESSFUL</h1>
                    <h2>Thank you for your order!</h2>
                    <p>Tracking number is <span className="order-number">{trackingNumber}</span></p>
                    <p style={{fontSize: '0.9em', color: '#555'}}>Order Reference ID: {orderId}</p>
                    <p>You can track your order in the "My Orders" section.</p>
                </div>
                <div className="buttons">
                    <button className="track-order-btn" onClick={handleTrackOrder}>
                        Track my order
                    </button>
                    <button className="continue-shopping-btn" onClick={handleContinueShopping}>
                        Continue shopping
                    </button>
                </div>
            </div>
        </div>
    );
};

export default OrderComplete;