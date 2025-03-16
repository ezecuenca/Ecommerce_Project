import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

const Cart = () => {
    const [cartItems, setCartItems] = useState([
        { id: 1, name: "Product 1", description: "Description", price: 33.9, quantity: 1, selected: false },
        { id: 2, name: "Product 2", description: "Description", price: 14.9, quantity: 1, selected: false },
        { id: 3, name: "Product 3", description: "Description", price: 16.9, quantity: 1, selected: false },
    ]);

    const [selectAll, setSelectAll] = useState(false);
    const navigate = useNavigate();

    const handleIncrease = (id) => {
        setCartItems(
            cartItems.map((item) =>
                item.id === id ? { ...item, quantity: item.quantity + 1 } : item
            )
        );
    };

    const handleDecrease = (id) => {
        setCartItems(
            cartItems.map((item) =>
                item.id === id && item.quantity > 1 ? { ...item, quantity: item.quantity - 1 } : item
            )
        );
    };

    const handleRemove = (id) => {
        setCartItems(cartItems.filter((item) => item.id !== id));
    };

    const handleSelectAll = () => {
        const newSelectAll = !selectAll;
        setSelectAll(newSelectAll);
        setCartItems(cartItems.map((item) => ({ ...item, selected: newSelectAll })));
    };

    const handleSelectItem = (id) => {
        const updatedItems = cartItems.map((item) =>
            item.id === id ? { ...item, selected: !item.selected } : item
        );
        setCartItems(updatedItems);
        setSelectAll(updatedItems.every((item) => item.selected));
    };

    const totalPrice = cartItems?.length
        ? cartItems.reduce((total, item) => total + item.price * item.quantity, 0).toFixed(2)
        : "0.00";

    if (!cartItems || cartItems.length === 0) {
        return (
            <div className="cart-page">
                <div className="cart-header-container">
                    <h1>
                        <span className="cart-title">Cart</span>{" "}
                        <span className="cart-count">0</span>
                    </h1>
                </div>
                <div className="empty-cart-message">
                    <hr />
                    <p>Your cart is empty.</p>
                </div>
                <Link to="/customer/products" className="empty-cart-back-to-shopping">
                    ← Back to shopping
                </Link>
            </div>
        );
    }

    return (
        <div className="cart-page">
            <div className="cart-header-container">
                <h1>
                    <span className="cart-title">Cart</span>{" "}
                    <span className="cart-count">{cartItems.length}</span>
                </h1>
            </div>
            <div className="cart-table">
                <div className="cart-header">
                    <input
                        type="checkbox"
                        checked={selectAll}
                        onChange={handleSelectAll}
                        className="select-all-checkbox"
                    />
                    <span className="item-header">Item</span>
                    <span>Price</span>
                    <span>Quantity</span>
                    <span>Total Price</span>
                    <span></span>
                </div>
                {cartItems.map((item) => (
                    <div key={item.id} className="cart-item">
                        <input
                            type="checkbox"
                            checked={item.selected}
                            onChange={() => handleSelectItem(item.id)}
                            className="item-checkbox"
                        />
                        <div className="item-details">
                            <div className="image-placeholder">Image</div>
                            <div>
                                <h3>{item.name}</h3>
                                <p>{item.description}</p>
                            </div>
                        </div>
                        <span className="item-price">${item.price.toFixed(2)}</span>
                        <div className="quantity-controls">
                            <button onClick={() => handleDecrease(item.id)} className="quantity-btn">-</button>
                            <span className="quantity-value">{item.quantity}</span>
                            <button onClick={() => handleIncrease(item.id)} className="quantity-btn">+</button>
                        </div>
                        <span className="item-total">${(item.price * item.quantity).toFixed(2)}</span>
                        <button onClick={() => handleRemove(item.id)} className="remove-btn">×</button>
                    </div>
                ))}
            </div>
            <div className="cart-footer">
                <Link to="/customer/products" className="back-to-shopping">
                    ← Back to shopping
                </Link>
                <div className="total-section">
                    <span className="total-price-label">Total Price:</span>{" "}
                    <span className="total-price-value">${totalPrice}</span>
                    <button
                        className="checkout-btn"
                        onClick={() => navigate("/customer/payment-confirmation")} 
                    >
                        Check out
                    </button>
                </div>
            </div>
        </div>
    );
};

export default Cart;