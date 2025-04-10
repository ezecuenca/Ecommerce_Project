// Cart.js
import React, { useState, useEffect, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import Axios from 'axios';
import { useCart } from "./CartContext";

const getCurrentUserId = () => {
    return 1;
};

const Cart = () => {
    const [cartItems, setCartItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [selectAll, setSelectAll] = useState(false);
    const navigate = useNavigate();
    const { fetchCartCount } = useCart();

    const fetchCartItems = useCallback(async () => {
        setError('');
        try {
            const profileId = getCurrentUserId();
            if (!profileId) throw new Error("User not identified.");
            const response = await Axios.get(`http://localhost:8000/api/cart/${profileId}`);
            if (!Array.isArray(response.data)) { console.error("API did not return an array for cart items:", response.data); throw new Error("Invalid data format received from server."); }
            // Maintain selection state if items already exist
            const currentSelectionState = cartItems.reduce((acc, item) => { acc[item.id] = item.selected; return acc; }, {});
            const updatedItems = response.data.map(item => ({ ...item, selected: currentSelectionState[item.id] ?? false }));
            setCartItems(updatedItems);
        } catch (err) {
            console.error("Error fetching cart items:", err);
            setError(`Failed to load cart items. ${err.response?.data?.message || err.message}`);
            setCartItems([]);
        } finally { if (loading) setLoading(false); }
    // }, [loading, cartItems]); // Depend on cartItems to preserve selection state
    }, [loading]); // Simplier dependency if selection preservation not strictly needed on every fetch

    useEffect(() => { setLoading(true); fetchCartItems(); }, []); // Fetch only on mount

    const updateCartItemQuantity = async (cartItemId, newQuantity) => {
        const originalCartItems = [...cartItems];
        setCartItems(prev => prev.map(item => item.id === cartItemId ? { ...item, quantity: newQuantity } : item));
        try {
            await Axios.put(`http://localhost:8000/api/cart/${cartItemId}`, { quantity: newQuantity });
            fetchCartCount();
        } catch (err) {
            console.error("Error updating cart quantity:", err);
            alert(`Failed to update quantity: ${err.response?.data?.message || err.message}`);
            setCartItems(originalCartItems);
        }
    };

    const handleIncrease = (cartItemId) => {
        const item = cartItems.find(i => i.id === cartItemId);
        if (item) updateCartItemQuantity(cartItemId, item.quantity + 1);
    };

    const handleDecrease = (cartItemId) => {
        const item = cartItems.find(i => i.id === cartItemId);
        if (item && item.quantity > 1) updateCartItemQuantity(cartItemId, item.quantity - 1);
        else if (item && item.quantity === 1) handleRemove(cartItemId);
    };

    const handleRemove = async (cartItemId) => {
        const originalCartItems = [...cartItems];
        setCartItems(prev => prev.filter(item => item.id !== cartItemId));
        try {
            await Axios.delete(`http://localhost:8000/api/cart/${cartItemId}`);
            fetchCartCount();
        } catch (err) {
            console.error("Error removing cart item:", err);
            alert(`Failed to remove item: ${err.response?.data?.message || err.message}`);
            setCartItems(originalCartItems);
        }
    };

    const handleSelectAll = () => {
        const newSelectAll = !selectAll; setSelectAll(newSelectAll);
        setCartItems(prev => prev.map(item => ({ ...item, selected: newSelectAll })));
    };

    const handleSelectItem = (id) => {
        const updatedItems = cartItems.map(item => item.id === id ? { ...item, selected: !item.selected } : item);
        setCartItems(updatedItems);
        setSelectAll(updatedItems.length > 0 && updatedItems.every(item => item.selected));
    };

    const totalPrice = cartItems?.length ? cartItems.reduce((total, item) => total + (parseFloat(item.product?.price || 0) * item.quantity), 0).toFixed(2) : "0.00";

    // --- Updated Checkout Handler ---
    const handleCheckout = () => {
        const selectedItems = cartItems.filter(item => item.selected);
        if (selectedItems.length === 0) {
            alert("Please select items to check out.");
            return;
        }
        // Navigate and pass selected items in state
        navigate("/customer/payment-confirmation", { state: { itemsToCheckout: selectedItems } });
    };
    // --- End Updated Checkout Handler ---


    if (loading) return <div className="cart-page"><p>Loading cart...</p></div>;
    if (error) return <div className="cart-page"><p className="error-message" style={{color: 'red'}}>{error}</p></div>;
    if (!cartItems || cartItems.length === 0) return (
        <div className="cart-page">
            <div className="cart-header-container"><h1><span className="cart-title">Cart</span> <span className="cart-count">0</span></h1></div>
            <div className="empty-cart-message"><hr /><p>Your cart is empty.</p></div>
            <Link to="/customer/products" className="empty-cart-back-to-shopping">← Back to shopping</Link>
        </div>
    );

    return (
        <div className="cart-page">
            <div className="cart-header-container"><h1><span className="cart-title">Cart</span> <span className="cart-count">{cartItems.length}</span></h1></div>
            <div className="cart-table">
                 <div className="cart-header">
                    <input type="checkbox" checked={selectAll} onChange={handleSelectAll} className="select-all-checkbox" disabled={cartItems.length === 0}/>
                    <span className="item-header">Item</span><span>Price</span><span>Quantity</span><span>Total Price</span><span></span>
                </div>
                {cartItems.map((item) => (
                    <div key={item.id} className="cart-item">
                        <input type="checkbox" checked={item.selected ?? false} onChange={() => handleSelectItem(item.id)} className="item-checkbox"/>
                        <div className="item-details">
                             <Link to={`/customer/products/${item.product?.id}`} className="image-placeholder-link">
                                <div className="image-placeholder">{item.product?.image_url ? (<img src={item.product.image_url} alt={item.product.product_name} width="50" height="50" style={{ objectFit: 'cover' }} />) : ("Image")}</div>
                            </Link>
                            <div><h3>{item.product?.product_name || 'Product Name Missing'}</h3></div>
                        </div>
                        <span className="item-price">₱{(parseFloat(item.product?.price || 0)).toFixed(2)}</span>
                        <div className="quantity-controls">
                            <button onClick={() => handleDecrease(item.id)} className="quantity-btn">-</button>
                            <span className="quantity-value">{item.quantity}</span>
                            <button onClick={() => handleIncrease(item.id)} className="quantity-btn">+</button>
                        </div>
                        <span className="item-total">₱{(parseFloat(item.product?.price || 0) * item.quantity).toFixed(2)}</span>
                        <button onClick={() => handleRemove(item.id)} className="remove-btn">×</button>
                    </div>
                ))}
            </div>
            <div className="cart-footer">
                <Link to="/customer/products" className="back-to-shopping">← Back to shopping</Link>
                <div className="total-section">
                    <span className="total-price-label">Total Price:</span> <span className="total-price-value">₱{totalPrice}</span>
                     {/* Update onClick to call handleCheckout */}
                     <button className="checkout-btn" onClick={handleCheckout} disabled={cartItems.filter(i => i.selected).length === 0}>Check out</button>
                </div>
            </div>
        </div>
    );
};
export default Cart;