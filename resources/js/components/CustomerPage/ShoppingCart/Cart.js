// Cart.js (Show Total for ALL items)
import React, { useState, useEffect, useCallback, useContext } from "react";
import { Link, useNavigate } from "react-router-dom";
import Axios from 'axios';
import { useCart } from "./CartContext";
import { AuthContext } from "../../AuthContext";

// --- Loading Component (Example) ---
const LoadingIndicator = ({ message = "Loading..." }) => (
    <div className="cart-page" style={{ padding: '20px', textAlign: 'center', minHeight: '200px', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
        <p>{message}</p>
    </div>
);

// --- Main Cart Component ---
const Cart = () => {
    // --- State ---
    const [cartItems, setCartItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [selectAll, setSelectAll] = useState(false);

    // --- Hooks ---
    const navigate = useNavigate();
    const { fetchCartCount } = useCart();
    const { user, loading: authLoading } = useContext(AuthContext);

    // --- Fetch Cart Items (Authenticated - Assumed correct from previous version) ---
    const fetchCartItems = useCallback(async () => {
        if (authLoading || !user) { setLoading(false); if (!authLoading && !user) { setCartItems([]); } return; }
        setError(''); setLoading(true);
        try {
            const token = localStorage.getItem("access_token");
            if (!token) throw new Error("Authentication token not found.");
            const response = await Axios.get(`http://localhost:8000/api/cart`, { headers: { 'Authorization': `Bearer ${token}`, 'Accept': 'application/json', } });
            if (!Array.isArray(response.data)) { throw new Error("Invalid data format received from server."); }
            const currentSelectionState = cartItems.reduce((acc, item) => { acc[item.id] = item.selected; return acc; }, {});
            const updatedItems = response.data.map(item => ({ ...item, selected: currentSelectionState[item.id] ?? false, product: item.product || {} }));
            setCartItems(updatedItems); setError('');
        } catch (err) {
            console.error("[Cart.js] fetchCartItems Error:", err.response || err.message || err);
            let errorMsg = "Failed to load cart items.";
             if (err.response) { errorMsg += ` ${err.response.data?.message || err.response.statusText}`; if(err.response.status === 401) errorMsg += " Please log in again."; }
             else if (err.request) { errorMsg += ` Could not connect to the server.`; } else { errorMsg += ` ${err.message}`; }
            setError(errorMsg); setCartItems([]);
        } finally { setLoading(false); }
    }, [user, authLoading]); // Removed cartItems dependency

    useEffect(() => { fetchCartItems(); }, [fetchCartItems]);

    // --- Other Action Handlers (Update, Remove, etc. - Assumed correct) ---
     const updateCartItemQuantity = async (cartItemId, newQuantity) => { /* ... authenticated PUT request ... */
        const originalCartItems = [...cartItems];
        setCartItems(prev => prev.map(item => item.id === cartItemId ? { ...item, quantity: newQuantity } : item));
        try {
            const token = localStorage.getItem("access_token");
            if (!token) throw new Error("Authentication token not found.");
            await Axios.put( `http://localhost:8000/api/cart/${cartItemId}`, { quantity: newQuantity },
                { headers: { 'Authorization': `Bearer ${token}`, 'Accept': 'application/json', } }
            );
            fetchCartCount();
        } catch (err) { console.error("Error updating cart quantity:", err); alert(`Failed to update quantity: ${err.response?.data?.message || err.message}`); setCartItems(originalCartItems); }
     };
     const handleIncrease = (cartItemId) => { const item = cartItems.find(i => i.id === cartItemId); if (item) updateCartItemQuantity(cartItemId, item.quantity + 1); };
     const handleDecrease = (cartItemId) => { const item = cartItems.find(i => i.id === cartItemId); if (item && item.quantity > 1) updateCartItemQuantity(cartItemId, item.quantity - 1); else if (item && item.quantity === 1) handleRemove(cartItemId); };
     const handleRemove = async (cartItemId) => { /* ... authenticated DELETE request ... */
        const originalCartItems = [...cartItems];
        setCartItems(prev => prev.filter(item => item.id !== cartItemId));
        try {
            const token = localStorage.getItem("access_token");
            if (!token) throw new Error("Authentication token not found.");
            await Axios.delete( `http://localhost:8000/api/cart/${cartItemId}`,
                { headers: { 'Authorization': `Bearer ${token}`, 'Accept': 'application/json', } }
            );
            fetchCartCount();
        } catch (err) { console.error("Error removing cart item:", err); alert(`Failed to remove item: ${err.response?.data?.message || err.message}`); setCartItems(originalCartItems); }
     };
     const handleSelectAll = () => { const newSelectAll = !selectAll; setSelectAll(newSelectAll); setCartItems(prev => prev.map(item => ({ ...item, selected: newSelectAll }))); };
     const handleSelectItem = (id) => { const updatedItems = cartItems.map(item => item.id === id ? { ...item, selected: !item.selected } : item); setCartItems(updatedItems); setSelectAll(updatedItems.length > 0 && updatedItems.every(item => item.selected)); };
     const handleCheckout = () => { const selectedItems = cartItems.filter(item => item.selected); if (selectedItems.length === 0) { alert("Please select items to check out."); return; } navigate("/customer/payment-confirmation", { state: { itemsToCheckout: selectedItems } }); };
    // --- End Other Handlers ---


    // --- Calculate TOTAL for ALL items ---
    const totalAmountAllItems = cartItems.reduce((total, item) => {
        const price = parseFloat(item.product?.price || 0);
        // Ensure quantity is a positive number
        const quantity = Math.max(0, item.quantity || 0);
        return total + (price * quantity);
    }, 0).toFixed(2); // Calculate sum and format to 2 decimal places
    // --- End Total Calculation ---

    // Calculate how many items are selected (for checkout button)
    const selectedItemsCount = cartItems.filter(item => item.selected).length;


    // --- Render Logic ---
    if (authLoading) return <LoadingIndicator message="Loading user information..." />;
    if (!user) return ( /* ... Render "Please log in..." message ... */
         <div className="cart-page">
             <div className="cart-header-container"><h1><span className="cart-title">Cart</span></h1></div>
             <div className="empty-cart-message"><hr /><p>Please <Link to="/login">log in</Link> to view your cart.</p></div>
             <Link to="/customer/products" className="empty-cart-back-to-shopping">← Back to shopping</Link>
         </div>
    );
    if (loading) return <LoadingIndicator message="Loading cart..." />;
    if (error) return <div className="cart-page"><p className="error-message" style={{color: 'red'}}>{error}</p></div>;
    if (!cartItems || cartItems.length === 0) return ( /* ... Render "Your cart is empty." message ... */
        <div className="cart-page">
            <div className="cart-header-container"><h1><span className="cart-title">Cart</span> <span className="cart-count">(0)</span></h1></div>
            <div className="empty-cart-message"><hr /><p>Your cart is empty.</p></div>
            <Link to="/customer/products" className="empty-cart-back-to-shopping">← Back to shopping</Link>
        </div>
    );

    // --- Render Actual Cart Items ---
    return (
         <div className="cart-page">
            <div className="cart-header-container"><h1><span className="cart-title">Cart</span><span className="cart-count">({cartItems.length})</span></h1></div>
            <div className="cart-table">
                 <div className="cart-header">
                    <input type="checkbox" checked={selectAll} onChange={handleSelectAll} className="select-all-checkbox" disabled={cartItems.length === 0}/>
                    <span className="item-header">Item</span><span>Price</span><span>Quantity</span><span>Total Price</span><span></span>
                 </div>
                 {cartItems.map((item) => (
                     <div key={item.id} className="cart-item">
                         <input type="checkbox" checked={item.selected ?? false} onChange={() => handleSelectItem(item.id)} className="item-checkbox"/>
                         <div className="item-details">
                              <Link to={`/customer/products/${item.product?.id}`} className="image-placeholder-link"> <div className="image-placeholder">{item.product?.image_url ? (<img src={item.product.image_url} alt={item.product.product_name} width="50" height="50" style={{ objectFit: 'cover' }} />) : ("No Img")}</div> </Link>
                             <div><h3>{item.product?.product_name || 'Product Name Missing'}</h3></div>
                         </div>
                         <span className="item-price">₱{(parseFloat(item.product?.price || 0)).toFixed(2)}</span>
                         <div className="quantity-controls"> <button onClick={() => handleDecrease(item.id)} className="quantity-btn">-</button> <span className="quantity-value">{item.quantity}</span> <button onClick={() => handleIncrease(item.id)} className="quantity-btn">+</button> </div>
                         <span className="item-total">₱{(parseFloat(item.product?.price || 0) * item.quantity).toFixed(2)}</span>
                         <button onClick={() => handleRemove(item.id)} className="remove-btn" title="Remove item">×</button>
                     </div>
                 ))}
             </div>
             <div className="cart-footer">
                 <Link to="/customer/products" className="back-to-shopping">← Back to shopping</Link>
                 <div className="total-section">
                    {/* --- UPDATED LABEL AND VALUE --- */}
                    <span className="total-price-label">Total Amount:</span>
                    <span className="total-price-value">₱{totalAmountAllItems}</span>
                    {/* --- End Update --- */}
                    <button
                        className="checkout-btn"
                        onClick={handleCheckout}
                        // Disable based on count of *selected* items
                        disabled={selectedItemsCount === 0}
                    >
                        Check out 
                    </button>
                 </div>
             </div>
         </div>
    );
};

export default Cart;