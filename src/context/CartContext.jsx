import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useAuth } from './AuthContext';
import { getCartItems, addToCart as apiAddToCart, removeFromCart as apiRemoveFromCart, updateCartItemQuantity, clearCart as apiClearCart } from '../services/api';

const CartContext = createContext();

export function CartProvider({ children }) {
    const { session } = useAuth();
    const user = session?.user;

    const [cartItems, setCartItems] = useState([]);
    const [loadingCart, setLoadingCart] = useState(true);

    const fetchCart = useCallback(async () => {
        if (!user) {
            setCartItems([]);
            setLoadingCart(false);
            return;
        }
        setLoadingCart(true);
        const { data, error } = await getCartItems(user.id);
        if (!error && data) {
            setCartItems(data);
        }
        setLoadingCart(false);
    }, [user]);

    // Initial fetch and listen for auth changes
    useEffect(() => {
        fetchCart();
    }, [fetchCart]);

    // Listen to custom event to trigger cart refresh from other components
    useEffect(() => {
        const handleCartUpdate = () => fetchCart();
        window.addEventListener('cart_updated', handleCartUpdate);
        return () => window.removeEventListener('cart_updated', handleCartUpdate);
    }, [fetchCart]);


    const addToCart = async (product, quantity = 1, selectedColor = null) => {
        if (!user) {
            console.warn('User must be logged in to add to cart');
            return { error: new Error('User must be logged in') };
        }
        const { data, error } = await apiAddToCart(user.id, product.id, quantity, selectedColor);
        if (!error) {
            fetchCart();
        }
        return { data, error };
    };

    const removeFromCart = async (cartItemId) => {
        const { error } = await apiRemoveFromCart(cartItemId);
        if (!error) {
            fetchCart();
        }
    };

    const updateQuantity = async (cartItemId, newQuantity) => {
        if (newQuantity < 1) return;
        const { error } = await updateCartItemQuantity(cartItemId, newQuantity);
        if (!error) {
            fetchCart();
        }
    };

    const clearCart = async () => {
        if (!user) return;
        const { error } = await apiClearCart(user.id);
        if (!error) {
            setCartItems([]);
            fetchCart();
        }
    };

    const getCartTotal = () => {
        return cartItems.reduce((total, item) => {
            // Because getCartItems joins products: select('*, product:products(*)')
            if (item.product) {
                return total + (item.product.price * item.quantity);
            }
            return total;
        }, 0);
    };

    const getCartCount = () => {
        return cartItems.reduce((count, item) => count + item.quantity, 0);
    };

    const value = {
        cartItems,
        loadingCart,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        getCartTotal,
        getCartCount
    };

    return (
        <CartContext.Provider value={value}>
            {children}
        </CartContext.Provider>
    );
}

export function useCart() {
    const context = useContext(CartContext);
    if (!context) {
        throw new Error('useCart must be used within a CartProvider');
    }
    return context;
}
