import React, { useState, useEffect, useContext } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import Axios from 'axios';
import { useCart } from "../ShoppingCart/CartContext";
import { AuthContext } from "../../AuthContext"; // Adjust path if needed
import { FaEdit, FaSpinner } from "react-icons/fa";

// --- Formatting Helpers (remain the same) ---
const formatCardNumber = (value) => { const cleaned = value?.replace(/\D/g, ''); const formatted = cleaned?.match(/.{1,4}/g)?.join(' ').substring(0, 19) || ''; return formatted; };
const formatExpiryDate = (value) => { const cleaned = value?.replace(/\D/g, '') || ''; let formatted = cleaned; if (cleaned.length > 2) { formatted = `${cleaned.substring(0, 2)}/${cleaned.substring(2, 4)}`; } return formatted.substring(0, 5); };
const formatCvv = (value) => { return value?.replace(/\D/g, '').substring(0, 4) || ''; };
// --- End Formatting Helpers ---


// --- Loading Component (Example) ---
const LoadingIndicator = ({ message = "Loading..." }) => (
    <div className="payment-confirmation" style={{ padding: '20px', textAlign: 'center', minHeight: '200px', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
        <p>{message}</p>
    </div>
);


const PaymentConfirmation = () => {
    // --- State Hooks ---
    const [availablePaymentMethods, setAvailablePaymentMethods] = useState([]);
    const [paymentLoading, setPaymentLoading] = useState(true);
    const [paymentError, setPaymentError] = useState(null); // Error for fetching payment methods
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
    const [profileError, setProfileError] = useState(null); // Error for profile fetch
    const [error, setError] = useState(null); // <<<< ----- ADD THIS LINE BACK - General error state (for placing order, validation etc.)

    // --- Router Hooks ---
    const location = useLocation();
    const navigate = useNavigate();

    // --- Context Hooks ---
    const { fetchCartCount } = useCart();
    const { user, loading: authLoading } = useContext(AuthContext);

    // --- Get Items from Navigation State ---
    const initialItems = location.state?.itemsToCheckout || [];
    const [cartItems] = useState(initialItems);


    // --- Effect to Fetch Profile Data (Optional Pre-fill) ---
    useEffect(() => {
        if (!authLoading && user) {
            const fetchProfileData = async () => {
                setProfileError(null);
                try {
                    const token = localStorage.getItem("access_token");
                    if (!token) throw new Error("Auth token not found.");
                    const response = await Axios.get(`http://localhost:8000/api/user/me`, { headers: { 'Authorization': `Bearer ${token}`, 'Accept': 'application/json', } });
                    const profile = response.data?.user?.profile;
                    if (profile) {
                        setContactNumber(profile.contact_no || "");
                        // setRegion(profile.region || ""); // etc.
                    } else { console.warn("[PaymentConfirmation] Profile data missing in API response."); }
                } catch (err) {
                    console.error("[PaymentConfirmation] Failed to fetch profile data:", err);
                    setProfileError("Could not load your profile information. Please check connection or fill details manually.");
                }
            };
            fetchProfileData();
        } else if (!authLoading && !user) { navigate('/login'); }
    }, [user, authLoading, navigate]);


    // --- Effect to Redirect if No Items ---
    useEffect(() => {
        if (initialItems.length === 0) { navigate('/customer/cart', { replace: true }); }
    }, [initialItems, navigate]);


    // --- Effect to Fetch Payment Methods ---
    useEffect(() => {
        const fetchPaymentMethods = async () => {
            setPaymentLoading(true); setPaymentError(null);
            try {
                const response = await Axios.get('http://localhost:8000/api/payment-methods');
                if (Array.isArray(response.data) && response.data.length > 0) {
                    setAvailablePaymentMethods(response.data); setSelectedPaymentMethod(response.data[0]);
                } else {
                    setAvailablePaymentMethods([]); setSelectedPaymentMethod(null);
                    console.warn("No available payment methods found from API."); setPaymentError("No payment methods are currently available.");
                }
            } catch (err) {
                console.error("Error fetching payment methods:", err);
                setPaymentError(`Failed to load payment options: ${err.response?.data?.message || err.message}`);
                setAvailablePaymentMethods([]); setSelectedPaymentMethod(null);
            } finally { setPaymentLoading(false); }
        };
        fetchPaymentMethods();
    }, []);


    // --- Calculations ---
    const shippingCost = shippingMethod === "Expedite Shipping" ? 250.00 : 95.00;
    const subtotal = cartItems.reduce((total, item) => total + (parseFloat(item.product?.price || 0) * Math.max(0, item.quantity || 0)), 0);
    const totalPrice = subtotal + shippingCost;

    // --- Form Input Handlers ---
    const handleCardNumberChange = (e) => { setCardNumber(formatCardNumber(e.target.value)); };
    const handleExpiryDateChange = (e) => { setExpiryDate(formatExpiryDate(e.target.value)); };
    const handleCvvChange = (e) => { setCvv(formatCvv(e.target.value)); };


    // --- Place Order Handler (Authenticated Action) ---
    const handlePlaceOrder = async () => {
        // Check Auth
        if (authLoading || !user) { alert("Authentication error. Please log in again."); return; }

        // Basic Form Validation
        setError(null); // Clear general error
        if (!selectedPaymentMethod) { setError("Please select a payment method."); return; }
        if (!contactNumber.trim()) { setError("Please enter a contact number."); return; }
        if (!region.trim()) { setError("Please enter a region."); return; }
        if (!city.trim()) { setError("Please enter a city."); return; }
        if (!streetAddress.trim()) { setError("Please enter a street address."); return; }
        if (!postalCode.trim()) { setError("Please enter a postal code."); return; }

        // Payment Specific Validation
        let paymentDetails = {};
        if (selectedPaymentMethod.method_name === "Credit Card") {
            const cleanedCardNumber = cardNumber.replace(/\s/g, '');
            if (cleanedCardNumber.length < 13 || cleanedCardNumber.length > 19 || !/^\d+$/.test(cleanedCardNumber)) { setError("Please enter a valid card number (13-19 digits)."); return; }
            if (!cardHolder.trim()) { setError("Please enter the cardholder name."); return; }
            if (!expiryDate.match(/^(0[1-9]|1[0-2])\/?([0-9]{4}|[0-9]{2})$/)) { setError("Please enter a valid expiry date (MM/YY or MM/YYYY)."); return; }
            if (cvv.length < 3 || cvv.length > 4 || !/^\d+$/.test(cvv)) { setError("Please enter a valid CVV (3 or 4 digits)."); return; }
            paymentDetails = { card_number_last4: cleanedCardNumber.slice(-4), cardholder_name: cardHolder, expiration_date: expiryDate, };
         }

        // Prepare Order Data
        setIsPlacingOrder(true);
        const fullShippingAddress = `${streetAddress}, ${city}, ${postalCode}, ${region}, ${country}`;
        const orderData = {
            items: cartItems.map(item => ({ product_id: item.product.id, quantity: item.quantity, price: parseFloat(item.product.price || 0) })),
            subtotal: subtotal, total_price: totalPrice, shipping_method: shippingMethod,
            shipping_address: fullShippingAddress, shipping_cost: shippingCost, contact_number: contactNumber,
            payment_method_id: selectedPaymentMethod.id, payment_amount: totalPrice,
            payment_details: paymentDetails
        };

        // Make Authenticated API Call
        try {
            const token = localStorage.getItem("access_token");
            if (!token) throw new Error("Authentication token not found.");
            const response = await Axios.post( 'http://localhost:8000/api/orders', orderData,
                { headers: { 'Authorization': `Bearer ${token}`, 'Accept': 'application/json', 'Content-Type': 'application/json' } }
            );
            const createdOrder = response.data.order;
            fetchCartCount();
            navigate("/customer/order-complete", { state: { order: createdOrder }, replace: true });
        } catch (err) {
            console.error("[PaymentConfirmation] Error placing order:", err.response || err.message || err);
            let errorMsg = `Failed to place order.`;
            if (err.response) {
                 errorMsg += ` ${err.response.data?.message || err.response.statusText}`;
                 if (err.response.data?.errors) { errorMsg += ` Details: ${JSON.stringify(err.response.data.errors)}`; }
                 if(err.response.status === 401) errorMsg += " Please log in again.";
            } else if (err.request) { errorMsg += ` Could not connect to the server.`; } else { errorMsg += ` ${err.message}`; }
            setError(errorMsg); // Set general error state
        } finally { setIsPlacingOrder(false); }
    };


    // --- Initial Loading/Redirect Checks ---
    if (authLoading) return <LoadingIndicator message="Loading user information..." />;
    if (!user || initialItems.length === 0) return <LoadingIndicator message="Redirecting..." />;
    // Removed the general error check here - let it render below the header

    // --- Render Main Content ---
    return (
        <div className="payment-confirmation">
            <div className="header-wrapper"><h1>Payment Confirmation</h1></div>

            {/* Display ALL error messages prominently */}
            {error && <p className="error-message general-error" style={{color: 'red', textAlign: 'center', marginBottom: '15px'}}>{error}</p>}
            {profileError && <p className="warning-message profile-warning" style={{color: 'orange', textAlign: 'center', marginBottom: '15px'}}>{profileError}</p>}
            {paymentError && !paymentLoading && <p className="error-message payment-error" style={{color: 'red', textAlign: 'center', marginBottom: '15px'}}>Payment Error: {paymentError}</p>}


            <div className="payment-layout">
                {/* Left Column: Payment and Delivery Details */}
                <div className="payment-left">
                    {/* Payment Method Section */}
                    <div className="payment-method-section">
                         <div className="payment-method-header">
                            <h2>Payment method</h2>
                            <div className="payment-options">
                                {paymentLoading && <p>Loading payment options...</p>}
                                {/* Display error only if loading is done */}
                                {/* {!paymentLoading && paymentError && <p style={{color: 'red'}}>{paymentError}</p>} */}
                                {!paymentLoading && !paymentError && availablePaymentMethods.length === 0 && <p>No payment methods available.</p>}
                                {!paymentLoading && !paymentError && availablePaymentMethods.map(method => (
                                    <button key={method.id} className={`payment-option ${selectedPaymentMethod?.id === method.id ? "selected" : ""}`} onClick={() => setSelectedPaymentMethod(method)} disabled={isPlacingOrder}>
                                        {method.method_name}
                                    </button>
                                ))}
                            </div>
                        </div>
                        {/* Credit Card Form (Conditional) */}
                        {selectedPaymentMethod?.method_name === "Credit Card" && (
                            <div className="credit-card-form">
                                <label>Card Number</label><input type="text" value={cardNumber} onChange={handleCardNumberChange} placeholder="0000 0000 0000 0000" maxLength="19" inputMode="numeric" pattern="[\d ]{16,19}" disabled={isPlacingOrder}/>
                                <label>Card Holder</label><input type="text" value={cardHolder} onChange={(e) => setCardHolder(e.target.value)} placeholder="Juan Dela Cruz" disabled={isPlacingOrder}/>
                                <div className="expiry-cvv">
                                    <div><label>Expiration Date</label><input type="text" value={expiryDate} onChange={handleExpiryDateChange} placeholder="MM/YY" maxLength="5" inputMode="numeric" pattern="\d{2}\/\d{2}" disabled={isPlacingOrder}/></div>
                                    <div><label>CVV</label><input type="text" value={cvv} onChange={handleCvvChange} placeholder="CVV" maxLength="4" inputMode="numeric" pattern="\d{3,4}" disabled={isPlacingOrder}/></div>
                                </div>
                            </div>
                        )}
                    </div> {/* End Payment Method Section */}

                    {/* Delivery Header and Section */}
                    <div className="header-wrapper delivery-header"><h2>Delivery</h2></div>
                     <div className="delivery-section-wrapper">
                        <div className="shipping-method-section">
                            <div className="shipping-method-header">
                                <h2>Shipping method</h2>
                                <div className="shipping-options">
                                    <button className={`shipping-option ${shippingMethod === "Standard Shipping" ? "selected" : ""}`} onClick={() => setShippingMethod("Standard Shipping")} disabled={isPlacingOrder}>Standard Shipping</button>
                                    <button className={`shipping-option ${shippingMethod === "Expedite Shipping" ? "selected" : ""}`} onClick={() => setShippingMethod("Expedite Shipping")} disabled={isPlacingOrder}>Expedite Shipping</button>
                                </div>
                            </div>
                        </div>
                        <div className="delivery-section">
                            <h3>Shipping Information</h3>
                            <div className="delivery-form">
                                <label>Contact Number</label><input type="tel" value={contactNumber} onChange={(e) => setContactNumber(e.target.value)} placeholder="e.g., 09171234567" disabled={isPlacingOrder}/>
                                <label>Country</label><select value={country} onChange={(e) => setCountry(e.target.value)} disabled={isPlacingOrder}><option value="Philippines">Philippines</option></select>
                                <label>Region</label><input type="text" value={region} onChange={(e) => setRegion(e.target.value)} placeholder="Region" disabled={isPlacingOrder}/>
                                <label>City</label><input type="text" value={city} onChange={(e) => setCity(e.target.value)} placeholder="City / Municipality" disabled={isPlacingOrder}/>
                                <label>Street Address</label><input type="text" value={streetAddress} onChange={(e) => setStreetAddress(e.target.value)} placeholder="House No., Street Name, Barangay" disabled={isPlacingOrder}/>
                                <label>Postal Code</label><input type="text" value={postalCode} onChange={(e) => setPostalCode(e.target.value)} placeholder="Postal Code" disabled={isPlacingOrder}/>
                            </div>
                        </div>
                    </div> {/* End Delivery Section Wrapper */}

                    {/* Place Order Button */}
                    <button className="place-order-btn" onClick={handlePlaceOrder} disabled={paymentLoading || !selectedPaymentMethod || isPlacingOrder || authLoading}>
                        {isPlacingOrder ? <FaSpinner className="spinner" /> : 'Place order'}
                    </button>

                </div> {/* End Payment Left Column */}


                {/* Right Column: Price Details */}
                <div className="payment-right">
                    <div className="price-details">
                        <h2>Price details</h2>
                        {Array.isArray(cartItems) && cartItems.map((item) => (
                            <div key={item.id || item.product?.id} className="price-item">
                                <div className="item-info"> <span className="item-name">{item.product?.product_name || 'Product Name Missing'}</span> <span className="item-price-calc">₱{parseFloat(item.product?.price || 0).toFixed(2)} x {item.quantity}</span> </div>
                                <span className="item-total-price">₱{(parseFloat(item.product?.price || 0) * item.quantity).toFixed(2)}</span>
                            </div>
                        ))}
                        <hr style={{margin: '10px 0'}}/>
                        <div className="price-item"> <span>Shipping</span> <span>₱{shippingCost.toFixed(2)}</span> </div>
                        <div className="price-total"> <span>Total (PHP)</span> <span>₱{totalPrice.toFixed(2)}</span> </div>
                    </div>
                </div> {/* End Payment Right Column */}

            </div> {/* End Payment Layout */}
        </div> // End Payment Confirmation Div
    );
};

export default PaymentConfirmation;