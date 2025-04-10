import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import Axios from 'axios';
import { useCart } from "../ShoppingCart/CartContext";
import { FaEdit, FaSpinner } from "react-icons/fa";

const getCurrentUserId = () => {
    return 1;
};

const formatCardNumber = (value) => {
    const cleaned = value?.replace(/\D/g, '');
    const formatted = cleaned?.match(/.{1,4}/g)?.join(' ').substring(0, 19) || '';
    return formatted;
};


const formatExpiryDate = (value) => {
    const cleaned = value?.replace(/\D/g, '') || '';
    let formatted = cleaned;
    if (cleaned.length > 2) {
        formatted = `${cleaned.substring(0, 2)}/${cleaned.substring(2, 4)}`;
    }
    return formatted.substring(0, 5);
};

const formatCvv = (value) => {
    return value?.replace(/\D/g, '').substring(0, 4) || '';
};

const PaymentConfirmation = () => {
    const [availablePaymentMethods, setAvailablePaymentMethods] = useState([]);
    const [paymentLoading, setPaymentLoading] = useState(true);
    const [paymentError, setPaymentError] = useState(null);
    const [selectedPaymentMethod, setSelectedPaymentMethod] = useState(null);
    const [shippingMethod, setShippingMethod] = useState("Standard Shipping");
    const [cardNumber, setCardNumber] = useState("");
    const [cardHolder, setCardHolder] = useState("");
    const [expiryDate, setExpiryDate] = useState("");
    const [cvv, setCvv] = useState("");
    const [country, setCountry] = useState("Philippines");
    const [region, setRegion] = useState("");
    const [city, setCity] = useState("");
    const [streetAddress, setStreetAddress] = useState("");
    const [postalCode, setPostalCode] = useState("");
    const [contactNumber, setContactNumber] = useState("");
    const [isPlacingOrder, setIsPlacingOrder] = useState(false);

    const location = useLocation();
    const itemsToCheckout = location.state?.itemsToCheckout || [];
    const [cartItems, setCartItems] = useState(itemsToCheckout);
    const [error, setError] = useState(null);
    const { fetchCartCount } = useCart();
    const navigate = useNavigate();

    useEffect(() => {
        const fetchProfileData = async () => {
            try {
                console.log("Simulating profile fetch. Set initial state or fetch real data.");
                 // Set only contact number from "profile" for now
                 setContactNumber("09123456789"); // Example placeholder

            } catch (err) {
                console.error("Failed to fetch profile data:", err);
                setError("Could not load profile information.");
            }
        };
        fetchProfileData();
    }, []);


    useEffect(() => {
        if (!itemsToCheckout || itemsToCheckout.length === 0) {
            console.error("No items available for checkout. Redirecting to cart...");
            if (cartItems.length === 0) {
                 navigate('/customer/cart');
             }
        }
    }, [cartItems, itemsToCheckout, navigate]);

    useEffect(() => {
        const fetchPaymentMethods = async () => {
            setPaymentLoading(true);
            setPaymentError(null);
            try {
                const response = await Axios.get('http://localhost:8000/api/payment-methods');
                if (Array.isArray(response.data) && response.data.length > 0) {
                    setAvailablePaymentMethods(response.data);
                    setSelectedPaymentMethod(response.data[0]);
                } else {
                     setAvailablePaymentMethods([]);
                     setSelectedPaymentMethod(null);
                     console.warn("No available payment methods found from API.");
                }
            } catch (err) {
                console.error("Error fetching payment methods:", err);
                setPaymentError(`Failed to load payment options: ${err.response?.data?.message || err.message}`);
                setAvailablePaymentMethods([]);
                setSelectedPaymentMethod(null);
            } finally {
                setPaymentLoading(false);
            }
        };
        fetchPaymentMethods();
    }, []);


    const shippingCost = shippingMethod === "Expedite Shipping" ? 250.00 : 95.00;

    const subtotal = cartItems.reduce((total, item) => {
        const price = parseFloat(item.product?.price || 0);
        return total + (price * item.quantity);
    }, 0);
    const totalPrice = subtotal + shippingCost;

    const handleCardNumberChange = (e) => { setCardNumber(formatCardNumber(e.target.value)); };
    const handleExpiryDateChange = (e) => { setExpiryDate(formatExpiryDate(e.target.value)); };
    const handleCvvChange = (e) => { setCvv(formatCvv(e.target.value)); };


    const handlePlaceOrder = async () => {
        setError(null);
        if (!selectedPaymentMethod) { setError("Please select a payment method."); return; }
        if (!contactNumber.trim()) { setError("Please enter a contact number."); return; }
        if (!region.trim()) { setError("Please enter a region."); return; }
        if (!city.trim()) { setError("Please enter a city."); return; }
        if (!streetAddress.trim()) { setError("Please enter a street address."); return; }
        if (!postalCode.trim()) { setError("Please enter a postal code."); return; }


        let paymentDetails = {};
        if (selectedPaymentMethod.method_name === "Credit Card") {
             const cleanedCardNumber = cardNumber.replace(/\s/g, '');
             if (cleanedCardNumber.length < 13 || cleanedCardNumber.length > 19 || !/^\d+$/.test(cleanedCardNumber)) { setError("Please enter a valid card number."); return; }
             if (!cardHolder.trim()) { setError("Please enter the cardholder name."); return; }
             if (!expiryDate.match(/^(0[1-9]|1[0-2])\/\d{2}$/)) { setError("Please enter a valid expiry date (MM/YY)."); return; }
             if (cvv.length < 3 || cvv.length > 4 || !/^\d+$/.test(cvv)) { setError("Please enter a valid CVV (3 or 4 digits)."); return; }

             paymentDetails = {
                 card_number: cleanedCardNumber,
                 cardholder_name: cardHolder,
                 expiration_date: expiryDate,
                 billing_address: `${streetAddress}, ${city}, ${postalCode}, ${region}, ${country}`
             };
         }


        setIsPlacingOrder(true);
        const fullShippingAddress = `${streetAddress}, ${city}, ${postalCode}, ${region}, ${country}`;
        const orderData = {
            profile_id: getCurrentUserId(),
            items: cartItems.map(item => ({ product_id: item.product.id, quantity: item.quantity, price: parseFloat(item.product.price || 0) })),
            subtotal: subtotal, total_price: totalPrice, shipping_method: shippingMethod,
            shipping_address: fullShippingAddress, shipping_cost: shippingCost, contact_number: contactNumber,
            payment_method_id: selectedPaymentMethod.id, payment_amount: totalPrice,
            payment_details: paymentDetails
        };

        console.log("Placing Order with data for /api/orders:", orderData);

        try {
            const response = await Axios.post('http://localhost:8000/api/orders', orderData);
            const createdOrder = response.data.order;
            console.log("Order placed successfully, response data:", response.data);
            fetchCartCount();
            navigate("/customer/order-complete", { state: { order: createdOrder }, replace: true });
        } catch (err) {
            console.error("Error placing order:", err);
            setError(`Failed to place order. ${err.response?.data?.message || err.message} ${JSON.stringify(err.response?.data?.errors || '')}`);
        } finally {
             setIsPlacingOrder(false);
        }
    };


    if (cartItems.length === 0 && !location.state?.itemsToCheckout) {
        return <p>Loading or Redirecting...</p>;
    }


    if (error && !isPlacingOrder) return <div className="payment-confirmation"><p style={{color: 'red'}}>Error: {error}</p></div>;

    return (
        <div className="payment-confirmation">
            <div className="header-wrapper"><h1>Payment Confirmation</h1></div>
            <div className="payment-layout">
                <div className="payment-left">
                    <div className="payment-method-section">
                        <div className="payment-method-header">
                            <h2>Payment method</h2>
                            <div className="payment-options">
                                {paymentLoading && <p>Loading payment options...</p>}
                                {paymentError && <p style={{color: 'red'}}>{paymentError}</p>}
                                {!paymentLoading && !paymentError && availablePaymentMethods.length === 0 && <p>No payment methods available.</p>}
                                {!paymentLoading && !paymentError && availablePaymentMethods.map(method => (
                                    <button key={method.id} className={`payment-option ${selectedPaymentMethod?.id === method.id ? "selected" : ""}`} onClick={() => setSelectedPaymentMethod(method)}>{method.method_name}</button>
                                ))}
                            </div>
                        </div>
                        {selectedPaymentMethod?.method_name === "Credit Card" && (
                            <div className="credit-card-form">
                                <label>Card Number</label><input type="text" value={cardNumber} onChange={handleCardNumberChange} placeholder="0000 0000 0000 0000" maxLength="19" inputMode="numeric" pattern="[\d ]{16,19}" />
                                <label>Card Holder</label><input type="text" value={cardHolder} onChange={(e) => setCardHolder(e.target.value)} placeholder="Juan Dela Cruz" />
                                <div className="expiry-cvv">
                                    <div><label>Expiration Date</label><input type="text" value={expiryDate} onChange={handleExpiryDateChange} placeholder="MM/YY" maxLength="5" inputMode="numeric" pattern="\d{2}\/\d{2}" /></div>
                                    <div><label>CVV</label><input type="text" value={cvv} onChange={handleCvvChange} placeholder="CVV" maxLength="4" inputMode="numeric" pattern="\d{3,4}"/></div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
                <div className="payment-right">
                    <div className="price-details">
                        <h2>Price details</h2>
                        {Array.isArray(cartItems) && cartItems.map((item) => (
                            <div key={item.id} className="price-item">
                                <div className="item-info">
                                    <span className="item-name">{item.product?.product_name || 'Product Name Missing'}</span>
                                    <span className="item-price-calc">₱{parseFloat(item.product?.price || 0).toFixed(2)} x {item.quantity}</span>
                                </div>
                                <span className="item-total-price">₱{(parseFloat(item.product?.price || 0) * item.quantity).toFixed(2)}</span>
                            </div>
                        ))}
                        <div className="price-item">
                            <span>Shipping</span>
                            <span>₱{shippingCost.toFixed(2)}</span>
                        </div>
                        <div className="price-total">
                            <span>Total (PHP)</span>
                            <span>₱{totalPrice.toFixed(2)}</span>
                        </div>
                    </div>
                </div>
            </div>
            <div className="header-wrapper delivery-header"><h2>Delivery</h2></div>
            <div className="payment-layout">
                <div className="payment-left">
                    <div className="shipping-method-section">
                         <div className="shipping-method-header">
                            <h2>Shipping method</h2>
                            <div className="shipping-options">
                                <button className={`shipping-option ${shippingMethod === "Standard Shipping" ? "selected" : ""}`} onClick={() => setShippingMethod("Standard Shipping")}>Standard Shipping</button>
                                <button className={`shipping-option ${shippingMethod === "Expedite Shipping" ? "selected" : ""}`} onClick={() => setShippingMethod("Expedite Shipping")}>Expedite Shipping</button>
                            </div>
                        </div>
                    </div>
                    <div className="delivery-section">
                        <h3>Shipping Information</h3>
                        <div className="delivery-form">
                             <label>Contact Number</label>
                             <input type="tel" value={contactNumber} onChange={(e) => setContactNumber(e.target.value)} placeholder="e.g., 09171234567"/>
                            <label>Country</label><select value={country} onChange={(e) => setCountry(e.target.value)}><option value="Philippines">Philippines</option></select>
                            <label>Region</label><input type="text" value={region} onChange={(e) => setRegion(e.target.value)} placeholder="Region" />
                            <label>City</label><input type="text" value={city} onChange={(e) => setCity(e.target.value)} placeholder="City / Municipality" />
                            <label>Street Address</label><input type="text" value={streetAddress} onChange={(e) => setStreetAddress(e.target.value)} placeholder="House No., Street Name, Barangay" />
                            <label>Postal Code</label><input type="text" value={postalCode} onChange={(e) => setPostalCode(e.target.value)} placeholder="Postal Code" />
                        </div>
                    </div>
                    <button className="place-order-btn" onClick={handlePlaceOrder} disabled={paymentLoading || !selectedPaymentMethod || isPlacingOrder}>
                        {isPlacingOrder ? <FaSpinner className="spinner" /> : 'Place order'}
                    </button>
                </div>
                <div className="payment-right"></div>
            </div>
        </div>
    );
};

export default PaymentConfirmation;