import React, { createContext, useState, useCallback, useEffect, useContext } from 'react';
import Axios from 'axios';
// Correct the import path if AuthContext is not in the parent directory
import { AuthContext } from '../../AuthContext'; // Assuming AuthContext is two levels up

const API_BASE_URL = "http://localhost:8000/api";

const CartContext = createContext({
    cartItemCount: 0,
    fetchCartCount: async () => {}, // Provide a default no-op function
    isLoadingCount: true,
});

export const CartProvider = ({ children }) => {
    const [cartItemCount, setCartItemCount] = useState(0);
    const [isLoadingCount, setIsLoadingCount] = useState(true);
    // Use context, provide default value if context is not yet available during initial render
    const authContext = useContext(AuthContext);
    const user = authContext?.user;
    const authLoading = authContext?.loading ?? true; // Default to true if context is missing initially

    const fetchCartCount = useCallback(async () => {
        // Don't fetch if auth is still loading initial user OR if user is definitely null (logged out)
        if (authLoading || !user) {
            // Only reset count if we know the user is logged out (auth check finished)
            if (!authLoading && !user) {
                setCartItemCount(0);
            }
            setIsLoadingCount(false);
            return;
        }

        setIsLoadingCount(true);
        try {
            const token = localStorage.getItem("access_token");
            if (!token) {
                setCartItemCount(0);
                // This warning might be noisy if user logs out, consider removing if needed
                // console.warn("CartContext: No token found even though user object exists.");
                setIsLoadingCount(false);
                return;
            }

            const response = await Axios.get(`${API_BASE_URL}/cart`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Accept': 'application/json'
                }
            });

            if (Array.isArray(response.data)) {
                setCartItemCount(response.data.length);
            } else if (response.data && typeof response.data.total !== 'undefined') {
                 setCartItemCount(response.data.total);
            } else {
                console.error("Invalid cart data received in CartContext:", response.data);
                setCartItemCount(0);
            }
        } catch (error) {
             // Avoid logging expected 401s when logged out or token expires silently
            if (!(error.response?.status === 401)) {
                console.error("Error fetching cart count in CartContext:", error);
            }
            setCartItemCount(0);
            if (error.response?.status === 401) {
                 // Logged out or invalid token - this is expected in some scenarios
                 // console.warn("CartContext: Unauthorized fetching cart count. Token might be invalid.");
                 // Maybe trigger AuthContext logout if needed: authContext?.logout();
            }
        } finally {
            setIsLoadingCount(false);
        }
    }, [user, authLoading]); // Dependencies remain the same

    useEffect(() => {
        fetchCartCount();
    }, [fetchCartCount]);

    // Ensure value object is stable or memoized if performance becomes an issue
    const value = {
        cartItemCount,
        fetchCartCount,
        isLoadingCount,
    };

    return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};

export const useCart = () => {
    const context = useContext(CartContext);
    // Add check if context is used outside of provider
    if (context === undefined) {
        throw new Error('useCart must be used within a CartProvider');
    }
    return context;
};