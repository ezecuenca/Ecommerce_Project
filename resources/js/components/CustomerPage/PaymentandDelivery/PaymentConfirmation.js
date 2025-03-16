// File path: /CustomerPage/PaymentandDelivery/PaymentConfirmation.js
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

const PaymentConfirmation = () => {
    const [paymentMethod, setPaymentMethod] = useState("Credit Card");
    const [cardNumber, setCardNumber] = useState("");
    const [cardHolder, setCardHolder] = useState("");
    const [expiryDate, setExpiryDate] = useState("");
    const [cvv, setCvv] = useState("");
    const [paypalEmail, setPaypalEmail] = useState("");
    const [paypalPassword, setPaypalPassword] = useState("");
    const [paypalName, setPaypalName] = useState("");
    const [paypalAddress, setPaypalAddress] = useState("");
    const [paypalDob, setPaypalDob] = useState("");
    const [country, setCountry] = useState("Philippines");
    const [region, setRegion] = useState("Agusan Del Norte");
    const [city, setCity] = useState("Butuan City");
    const [postalCode, setPostalCode] = useState("8600");

    const cartItems = [
        { name: "Product 1", price: 20, quantity: 2 },
    ];
    const shippingCost = 0.04;
    const totalPrice = cartItems.reduce((total, item) => total + item.price * item.quantity, 0) + shippingCost;

    const navigate = useNavigate();

    const handlePlaceOrder = () => {
        navigate("/customer/order-complete", {
            state: {
                cartItems,
                shippingCost,
                totalPrice,
                paymentMethod,
                shippingInfo: { country, region, city, postalCode },
            },
        });
    };

    return (
        <div className="payment-confirmation">
            <div className="header-wrapper">
                <h1>Payment Confirmation</h1>
            </div>

            <div className="payment-layout">
                <div className="payment-left">
                    <div className="payment-method-section">
                        <div className="payment-method-header">
                            <h2>Payment method</h2>
                            <div className="payment-options">
                                <button
                                    className={`payment-option ${paymentMethod === "Cash On Delivery" ? "selected" : ""}`}
                                    onClick={() => setPaymentMethod("Cash On Delivery")}
                                >
                                    Cash On Delivery
                                </button>
                                <button
                                    className={`payment-option ${paymentMethod === "PayPal" ? "selected" : ""}`}
                                    onClick={() => setPaymentMethod("PayPal")}
                                >
                                    PayPal
                                </button>
                                <button
                                    className={`payment-option ${paymentMethod === "Credit Card" ? "selected" : ""}`}
                                    onClick={() => setPaymentMethod("Credit Card")}
                                >
                                    Credit Card
                                </button>
                            </div>
                        </div>

                        {paymentMethod === "Credit Card" && (
                            <div className="credit-card-form">
                                <label>Card Number</label>
                                <input
                                    type="text"
                                    value={cardNumber}
                                    onChange={(e) => setCardNumber(e.target.value)}
                                    placeholder="9999 9999 9999 9999"
                                />
                                <label>Card Holder</label>
                                <input
                                    type="text"
                                    value={cardHolder}
                                    onChange={(e) => setCardHolder(e.target.value)}
                                    placeholder="PHAM TRAN LAM CAM NGOC"
                                />
                                <div className="expiry-cvv">
                                    <div>
                                        <label>Expiration Date</label>
                                        <input
                                            type="text"
                                            value={expiryDate}
                                            onChange={(e) => setExpiryDate(e.target.value)}
                                            placeholder="MM/YY"
                                        />
                                    </div>
                                    <div>
                                        <label>CVV</label>
                                        <input
                                            type="text"
                                            value={cvv}
                                            onChange={(e) => setCvv(e.target.value)}
                                            placeholder="CVV"
                                        />
                                    </div>
                                </div>
                            </div>
                        )}

                        {paymentMethod === "PayPal" && (
                            <div className="paypal-form">
                                <label>Email Address</label>
                                <input
                                    type="email"
                                    value={paypalEmail}
                                    onChange={(e) => setPaypalEmail(e.target.value)}
                                    placeholder="example@paypal.com"
                                />
                                <label>Password</label>
                                <input
                                    type="password"
                                    value={paypalPassword}
                                    onChange={(e) => setPaypalPassword(e.target.value)}
                                    placeholder="Enter your PayPal password"
                                />
                                <label>Full Name</label>
                                <input
                                    type="text"
                                    value={paypalName}
                                    onChange={(e) => setPaypalName(e.target.value)}
                                    placeholder="Enter your full name"
                                />
                                <label>Address</label>
                                <input
                                    type="text"
                                    value={paypalAddress}
                                    onChange={(e) => setPaypalAddress(e.target.value)}
                                    placeholder="Enter your address"
                                />
                                <div className="paypal-dob">
                                    <div>
                                        <label>Date of Birth</label>
                                        <input
                                            type="text"
                                            value={paypalDob}
                                            onChange={(e) => setPaypalDob(e.target.value)}
                                            placeholder="MM/DD/YYYY"
                                        />
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                <div className="payment-right">
                    <div className="price-details">
                        <h2>Price details</h2>
                        <div className="price-item">
                            <span>${cartItems[0].price} x {cartItems[0].quantity}</span>
                            <span>${(cartItems[0].price * cartItems[0].quantity).toFixed(2)}</span>
                        </div>
                        <div className="price-item">
                            <span>Shipping</span>
                            <span>${shippingCost.toFixed(2)}</span>
                        </div>
                        <div className="price-total">
                            <span>Total (USD)</span>
                            <span>${totalPrice.toFixed(2)}</span>
                        </div>
                    </div>
                </div>
            </div>

            <div className="header-wrapper">
                <h2>Delivery</h2>
            </div>

            <div className="payment-layout">
                <div className="payment-left">
                    <div className="delivery-section">
                        <h3>Shipping Information</h3>
                        <div className="delivery-form">
                            <label>Country</label>
                            <select value={country} onChange={(e) => setCountry(e.target.value)}>
                                <option value="Philippines">Philippines</option>
                            </select>
                            <label>Region</label>
                            <input
                                type="text"
                                value={region}
                                onChange={(e) => setRegion(e.target.value)}
                                placeholder="Agusan Del Norte"
                            />
                            <label>City</label>
                            <input
                                type="text"
                                value={city}
                                onChange={(e) => setCity(e.target.value)}
                                placeholder="Butuan City"
                            />
                            <label>Postal Code</label>
                            <input
                                type="text"
                                value={postalCode}
                                onChange={(e) => setPostalCode(e.target.value)}
                                placeholder="8600"
                            />
                        </div>
                    </div>

                    <button className="place-order-btn" onClick={handlePlaceOrder}>
                        Place order
                    </button>
                </div>

                <div className="payment-right"></div>
            </div>
        </div>
    );
};

export default PaymentConfirmation;