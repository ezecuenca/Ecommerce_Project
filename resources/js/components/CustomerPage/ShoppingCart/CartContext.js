// File path: resources/js/components/CustomerPage/ShoppingCart/CartContext.js
import React, { createContext, useState, useContext } from "react";

// Create the Cart Context
const CartContext = createContext();

// Create a provider component
export const CartProvider = ({ children }) => {
    const [cartItemCount, setCartItemCount] = useState(0); // Track the number of items

    const addToCart = () => {
        setCartItemCount((prev) => prev + 1); // Increment the item count
    };

    return (
        <CartContext.Provider value={{ cartItemCount, addToCart, setCartItemCount }}>
            {children}
        </CartContext.Provider>
    );
};

// Custom hook to use the Cart Context
export const useCart = () => {
    return useContext(CartContext);
};