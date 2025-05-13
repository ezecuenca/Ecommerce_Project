import React, { useState, useEffect, useContext } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import Axios from 'axios';
import { useCart } from "../ShoppingCart/CartContext";
import { AuthContext } from "../../AuthContext";
import { FaSpinner } from "react-icons/fa";
import { Link } from 'react-router-dom';

const formatCardNumber = (value) => { const cleaned = value?.replace(/\D/g, ''); const formatted = cleaned?.match(/.{1,4}/g)?.join(' ').substring(0, 19) || ''; return formatted; };
const formatExpiryDate = (value) => { const cleaned = value?.replace(/\D/g, '') || ''; let formatted = cleaned; if (cleaned.length > 2) { formatted = `${cleaned.substring(0, 2)}/${cleaned.substring(2, 4)}`; } return formatted.substring(0, 5); };
const formatCvv = (value) => { return value?.replace(/\D/g, '').substring(0, 4) || ''; };

const LoadingIndicator = ({ message = "Loading..." }) => (
    <div className="payment-confirmation" style={{ padding: '20px', textAlign: 'center', minHeight: '200px', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
        <p>{message}</p>
    </div>
);

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
    const [profileError, setProfileError] = useState(null);
    const [error, setError] = useState(null);
    const [userAddresses, setUserAddresses] = useState([]);
    const [selectedAddressId, setSelectedAddressId] = useState("");

    const location = useLocation();
    const navigate = useNavigate();
    const { fetchCartCount } = useCart();
    const { user, loading: authLoading } = useContext(AuthContext);
    const initialItems = location.state?.itemsToCheckout || [];
    const [cartItems] = useState(initialItems);

    useEffect(() => {
        if (!authLoading && user) {
            const fetchProfileData = async () => {
                setProfileError(null);
                try {
                    const token = localStorage.getItem("access_token");
                    if (!token) throw new Error("Auth token not found.");
                    const response = await Axios.get(`http://localhost:8000/api/user/profile`, { headers: { 'Authorization': `Bearer ${token}`, 'Accept': 'application/json', } });
                    
                    console.log("[PaymentConfirmation] /api/user/profile response:", JSON.stringify(response.data, null, 2));

                    const fetchedUser = response.data;
                    const profile = fetchedUser?.profile;
                    const allAddresses = Array.isArray(profile?.addresses) ? profile.addresses : [];

                    setUserAddresses(allAddresses);
                    console.log("[PaymentConfirmation] userAddresses state set to:", allAddresses);

                    if (profile) {
                        setContactNumber(profile.contact_no || "");

                        let addressToPreFill = null;
                        if (allAddresses.length > 0) {
                            const defaultAddress = allAddresses.find(addr => addr.is_default === 1 || addr.is_default === true);
                            if (defaultAddress) {
                                addressToPreFill = defaultAddress;
                                console.log("[PaymentConfirmation] Found default address for pre-fill:", addressToPreFill);
                            } else {
                                addressToPreFill = allAddresses[0];
                                console.log("[PaymentConfirmation] No explicit default address, using first address for pre-fill:", addressToPreFill);
                            }
                        }

                        if (addressToPreFill) {
                            setStreetAddress(addressToPreFill.street || "");
                            setCity(addressToPreFill.city || "");
                            setRegion(addressToPreFill.region || "");
                            setPostalCode(addressToPreFill.postal_code || "");
                            setCountry(addressToPreFill.country || "Philippines");
                            if (addressToPreFill.contact_no) {
                                setContactNumber(addressToPreFill.contact_no);
                            }
                            setSelectedAddressId(addressToPreFill.id.toString());
                        } else {
                            setSelectedAddressId("");
                        }
                    } else {
                        console.warn("[PaymentConfirmation] Profile data (response.data.profile) missing in API response from /api/user/profile.");
                        setUserAddresses([]);
                        setSelectedAddressId("");
                    }
                } catch (err) {
                    console.error("[PaymentConfirmation] Failed to fetch profile data from /api/user/profile:", err.response ? err.response.data : err.message, err);
                    setProfileError("Could not load your profile information. Please check connection or fill details manually.");
                    setUserAddresses([]);
                    setSelectedAddressId("");
                }
            };
            fetchProfileData();
        } else if (!authLoading && !user) {
            navigate('/login');
        }
    }, [user, authLoading, navigate]);

    useEffect(() => {
        if (!authLoading && initialItems.length === 0) {
            navigate('/customer/cart', { replace: true });
         }
    }, [initialItems, navigate, authLoading]);

    useEffect(() => {
        const fetchPaymentMethods = async () => {
            setPaymentLoading(true); setPaymentError(null);
            try {
                const response = await Axios.get('http://localhost:8000/api/payment-methods');
                if (Array.isArray(response.data) && response.data.length > 0) {
                    setAvailablePaymentMethods(response.data);
                    const defaultMethod = response.data.find(m => m.method_name === 'Cash on Delivery') || response.data[0];
                    setSelectedPaymentMethod(defaultMethod);
                } else {
                    setAvailablePaymentMethods([]); setSelectedPaymentMethod(null);
                    setPaymentError("No payment methods are currently available.");
                }
            } catch (err) {
                setPaymentError(`Failed to load payment options: ${err.response?.data?.message || err.message}`);
                setAvailablePaymentMethods([]); setSelectedPaymentMethod(null);
            } finally { setPaymentLoading(false); }
        };
        fetchPaymentMethods();
    }, []);

    const shippingCost = shippingMethod === "Expedite Shipping" ? 250.00 : 95.00;
    const subtotal = cartItems.reduce((total, item) => total + (parseFloat(item.product?.price || 0) * Math.max(0, item.quantity || 0)), 0);
    const totalPrice = subtotal + shippingCost;

    const handleCardNumberChange = (e) => { setCardNumber(formatCardNumber(e.target.value)); };
    const handleExpiryDateChange = (e) => { setExpiryDate(formatExpiryDate(e.target.value)); };
    const handleCvvChange = (e) => { setCvv(formatCvv(e.target.value)); };

    const handleAddressSelect = (e) => {
        const addressId = e.target.value;
        setSelectedAddressId(addressId);

        const baseProfileContact = user?.profile?.contact_no || "";

        if (addressId === "") {
            setStreetAddress("");
            setCity("");
            setRegion("");
            setPostalCode("");
            setCountry("Philippines");
            setContactNumber(baseProfileContact);
        } else {
            const selectedAddr = userAddresses.find(addr => addr.id.toString() === addressId);
            if (selectedAddr) {
                setStreetAddress(selectedAddr.street || "");
                setCity(selectedAddr.city || "");
                setRegion(selectedAddr.region || "");
                setPostalCode(selectedAddr.postal_code || "");
                setCountry(selectedAddr.country || "Philippines");
                setContactNumber(selectedAddr.contact_no || baseProfileContact || "");
            }
        }
    };

    const handlePlaceOrder = async () => {
        if (authLoading || !user) { alert("Authentication error. Please log in again."); return; }
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
            if (cleanedCardNumber.length < 13 || cleanedCardNumber.length > 19 || !/^\d+$/.test(cleanedCardNumber)) { setError("Please enter a valid card number (13-19 digits)."); return; }
            if (!cardHolder.trim()) { setError("Please enter the cardholder name."); return; }
            if (!expiryDate.match(/^(0[1-9]|1[0-2])\/?([0-9]{4}|[0-9]{2})$/)) { setError("Please enter a valid expiry date (MM/YY or MM/YYYY)."); return; }
            if (cvv.length < 3 || cvv.length > 4 || !/^\d+$/.test(cvv)) { setError("Please enter a valid CVV (3 or 4 digits)."); return; }
            paymentDetails = { card_number_last4: cleanedCardNumber.slice(-4), cardholder_name: cardHolder, expiration_date: expiryDate, };
         }

        setIsPlacingOrder(true);
        const fullShippingAddress = `${streetAddress}, ${city}, ${postalCode}, ${region}, ${country}`;
        const orderData = {
            items: cartItems.map(item => ({
                product_id: item.product.id,
                quantity: item.quantity,
                price: parseFloat(item.product.price || 0),
                color_id: item.color_id || null,
                wrist_measurement_id: item.wrist_measurement_id || null,
            })),
            subtotal: subtotal,
            total_price: totalPrice,
            shipping_method: shippingMethod,
            shipping_cost: shippingCost,
            address_details: { contact_no: contactNumber, country, region, city, street: streetAddress, postal_code: postalCode },
            shipping_address: fullShippingAddress,
            payment_method_id: selectedPaymentMethod.id,
            payment_amount: totalPrice,
            payment_details: paymentDetails
        };

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
            let errorMsg = `Failed to place order.`;
            if (err.response) {
                 if (err.response.data?.errors) {
                     const firstErrorKey = Object.keys(err.response.data.errors)[0];
                     errorMsg += ` ${err.response.data.errors[firstErrorKey][0]}`;
                 } else { errorMsg += ` ${err.response.data?.message || err.response.statusText}`; }
                 if(err.response.status === 401) errorMsg += " Please log in again.";
            } else if (err.request) { errorMsg += ` Could not connect to the server.`; } else { errorMsg += ` ${err.message}`; }
            setError(errorMsg);
        } finally { setIsPlacingOrder(false); }
    };

    if (authLoading) return <LoadingIndicator message="Loading user information..." />;
    if (!user && !authLoading) return (
        <div className="payment-confirmation" style={{textAlign: 'center', padding: '20px'}}>
             <p>Please <Link to="/login">log in</Link> to proceed with payment.</p>
        </div>
    );
    if (initialItems.length === 0 && !authLoading) return <LoadingIndicator message="No items to checkout. Redirecting..." />;

    return (
        <div className="payment-confirmation">
            <div className="header-wrapper"><h1>Payment Confirmation</h1></div>
            {error && <p className="error-message general-error" style={{color: 'red', textAlign: 'center', marginBottom: '15px'}}>{error}</p>}
            {profileError && <p className="warning-message profile-warning" style={{color: 'orange', textAlign: 'center', marginBottom: '15px'}}>{profileError}</p>}
            {paymentError && !paymentLoading && <p className="error-message payment-error" style={{color: 'red', textAlign: 'center', marginBottom: '15px'}}>Payment Error: {paymentError}</p>}

            <div className="payment-layout">
                <div className="payment-left">
                    <div className="payment-method-section">
                         <div className="payment-method-header">
                            <h2>Payment method</h2>
                            <div className="payment-options">
                                {paymentLoading && <p>Loading payment options...</p>}
                                {!paymentLoading && !paymentError && availablePaymentMethods.length === 0 && <p>No payment methods available.</p>}
                                {!paymentLoading && !paymentError && availablePaymentMethods.map(method => (
                                    <button key={method.id} className={`payment-option ${selectedPaymentMethod?.id === method.id ? "selected" : ""}`} onClick={() => setSelectedPaymentMethod(method)} disabled={isPlacingOrder}>
                                        {method.method_name}
                                    </button>
                                ))}
                            </div>
                        </div>
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
                    </div>

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
                            <div style={{ display: 'flex', alignItems: 'center', marginBottom: '15px', flexWrap: 'wrap' }}>
                                <h3 style={{ marginRight: '15px', marginBottom: '10px', whiteSpace: 'nowrap' }}>Shipping Information</h3>
                                {userAddresses && userAddresses.length > 0 ? (
                                    <select value={selectedAddressId} onChange={handleAddressSelect} disabled={isPlacingOrder}
                                        style={{ padding: '8px 10px', border: '1px solid #ccc', borderRadius: '4px', backgroundColor: 'white', minWidth: '220px', fontSize: '0.9em', marginBottom: '10px' }}>
                                        <option value="">--- Select a saved address ---</option>
                                        {userAddresses.map(addr => (
                                            <option key={addr.id} value={addr.id.toString()}>
                                                {[addr.street, addr.city, addr.postal_code].filter(Boolean).join(', ') || `Address ID: ${addr.id}`}
                                            </option>
                                        ))}
                                    </select>
                                ) : ( !authLoading && user && <span style={{ marginLeft: '10px', fontSize: '0.9em', color: '#777', marginBottom: '10px' }}>No saved addresses found.</span> )}
                            </div>
                            <div className="delivery-form">
                                <label>Contact Number</label><input type="tel" value={contactNumber} onChange={(e) => setContactNumber(e.target.value)} placeholder="e.g., 09171234567" disabled={isPlacingOrder}/>
                                <label>Country</label><select value={country} onChange={(e) => setCountry(e.target.value)} disabled={isPlacingOrder}><option value="Philippines">Philippines</option></select>
                                <label>Region</label><input type="text" value={region} onChange={(e) => setRegion(e.target.value)} placeholder="Region" disabled={isPlacingOrder}/>
                                <label>City</label><input type="text" value={city} onChange={(e) => setCity(e.target.value)} placeholder="City / Municipality" disabled={isPlacingOrder}/>
                                <label>Street Address</label><input type="text" value={streetAddress} onChange={(e) => setStreetAddress(e.target.value)} placeholder="House No., Street Name, Barangay" disabled={isPlacingOrder}/>
                                <label>Postal Code</label><input type="text" value={postalCode} onChange={(e) => setPostalCode(e.target.value)} placeholder="Postal Code" disabled={isPlacingOrder}/>
                            </div>
                        </div>
                    </div>
                    <button className="place-order-btn" onClick={handlePlaceOrder} disabled={paymentLoading || !selectedPaymentMethod || isPlacingOrder || authLoading}>
                        {isPlacingOrder ? <FaSpinner className="spinner" /> : 'Place order'}
                    </button>
                </div>

                <div className="payment-right">
                    <div className="price-details">
                        <h2>Price details</h2>
                        {Array.isArray(cartItems) && cartItems.map((item) => (
                            <div key={item.id || item.product?.id} className="price-item" style={{ marginBottom: '10px' }}>
                                <div className="item-main-info" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                    <div className="item-name-and-price-calc">
                                        <div className="name-and-price-row" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                            <span className="item-name" style={{ fontWeight: 'bold' }}>{item.product?.product_name || 'Product Name Missing'}</span>
                                        </div>
                                        {(item.color_name || item.measurement_name) && (
                                            <div className="item-options-details" style={{ fontSize: '0.85em', color: '#666', marginTop: '2px' }}>
                                                {item.color_name && <span>Color: {item.color_name}</span>}
                                                {item.measurement_name && <span style={{ marginLeft: item.color_name ? '10px' : '0' }}>Size: {item.measurement_name}</span>}
                                            </div>
                                        )}
                                        <div className="price-calc-and-total" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '4px', width: '100%' }}>
                                            <span className="item-price-calc" style={{ fontSize: '0.9em', color: '#555' }}>₱{parseFloat(item.product?.price || 0).toFixed(2)} x {item.quantity}</span>
                                            <span className="item-total-price" style={{ fontWeight: 'bold', whiteSpace: 'nowrap', marginLeft: '10px' }}>₱{(parseFloat(item.product?.price || 0) * item.quantity).toFixed(2)}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                        <hr style={{margin: '10px 0'}}/>
                        <div className="price-item" style={{ display: 'flex', justifyContent: 'space-between' }}> <span>Shipping</span> <span>₱{shippingCost.toFixed(2)}</span> </div>
                        <div className="price-total" style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold', marginTop: '10px', fontSize: '1.1em' }}> <span>Total (PHP)</span> <span>₱{totalPrice.toFixed(2)}</span> </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PaymentConfirmation;