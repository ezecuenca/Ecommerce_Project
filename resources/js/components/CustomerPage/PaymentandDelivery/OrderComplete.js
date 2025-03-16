// File path: resources/js/components/CustomerPage/PaymentandDelivery/OrderComplete.js
import React from "react";
import { useLocation, useNavigate } from "react-router-dom";


const OrderComplete = () => {
    const location = useLocation();
    const navigate = useNavigate();

    // Generate a random order number (replace with real ID from backend if available)
    const orderNumber = `#${Math.floor(100000 + Math.random() * 900000).toString()}`;

    const handleTrackOrder = () => {
        navigate("/customer/my-orders"); // Placeholder path
    };

    const handleContinueShopping = () => {
        navigate("/customer"); // Homepage route
    };

    return (
        <div className="order-complete">
            <div className="order-complete-content">
                <div className="confirmation-icon"></div> {/* Placeholder for icon */}
                <div className="confirmation-text">
                    <h1>ORDER SUCCESSFUL</h1>
                    <h2>Thank you for your order!</h2>
                    <p>Order number is <span className="order-number">{orderNumber}</span></p>
                    <p>You can track your order in "My Order" section</p>
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