import React, { createContext, useState, useCallback, useEffect, useContext } from 'react';
import Axios from 'axios';

const getCurrentUserId = () => {
    return 1;
};

const CartContext = createContext();

export const CartProvider = ({ children }) => {
    const [cartItemCount, setCartItemCount] = useState(0);
    const [isLoadingCount, setIsLoadingCount] = useState(true);

    const fetchCartCount = useCallback(async () => {
        setIsLoadingCount(true);
        try {
            const profileId = getCurrentUserId();
            if (!profileId) {
                setCartItemCount(0);
                return;
            }
            const response = await Axios.get(`http://localhost:8000/api/cart/${profileId}`);
            if (Array.isArray(response.data)) {
                setCartItemCount(response.data.length);
            } else {
                console.error("Invalid cart data received in CartContext:", response.data);
                setCartItemCount(0);
            }
        } catch (error) {
            console.error("Error fetching cart count in CartContext:", error);
            setCartItemCount(0);
        } finally {
            setIsLoadingCount(false);
        }
    }, []);

    useEffect(() => {
        fetchCartCount();
    }, [fetchCartCount]);

    const value = {
        cartItemCount,
        fetchCartCount,
        isLoadingCount,
    };

    return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};

export const useCart = () => {
    return useContext(CartContext);
};