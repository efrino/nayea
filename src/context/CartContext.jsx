import { createContext, useContext, useState, useEffect } from 'react';

const CartContext = createContext();

export function CartProvider({ children }) {
    // Try to load cart from local storage on initial mount
    const [cartItems, setCartItems] = useState(() => {
        try {
            const savedCart = localStorage.getItem('nayea_cart');
            return savedCart ? JSON.parse(savedCart) : [];
        } catch (error) {
            console.warn('Failed to load cart from local storage', error);
            return [];
        }
    });

    // Save cart to local storage whenever it changes
    useEffect(() => {
        try {
            localStorage.setItem('nayea_cart', JSON.stringify(cartItems));
        } catch (error) {
            console.warn('Failed to save cart to local storage', error);
        }
    }, [cartItems]);

    const addToCart = (product, quantity = 1) => {
        setCartItems(prevItems => {
            const existingItem = prevItems.find(item => item.id === product.id);

            if (existingItem) {
                // If product already exists, just update quantity (don't exceed stock)
                const newQuantity = existingItem.quantity + quantity;
                const boundedQuantity = Math.min(newQuantity, product.stock);

                return prevItems.map(item =>
                    item.id === product.id ? { ...item, quantity: boundedQuantity } : item
                );
            } else {
                // Format product for cart
                const cartProduct = {
                    id: product.id,
                    name: product.name,
                    price: product.price,
                    image: product.image_url || 'https://via.placeholder.com/200x200?text=No+Image',
                    stock: product.stock,
                    is_preorder: product.is_preorder,
                    quantity: Math.min(quantity, product.stock)
                };
                return [...prevItems, cartProduct];
            }
        });
    };

    const removeFromCart = (id) => {
        setCartItems(prevItems => prevItems.filter(item => item.id !== id));
    };

    const updateQuantity = (id, newQuantity) => {
        setCartItems(prevItems =>
            prevItems.map(item => {
                if (item.id === id) {
                    // Ensure quantity is between 1 and available stock
                    const validQuantity = Math.max(1, Math.min(newQuantity, item.stock));
                    return { ...item, quantity: validQuantity };
                }
                return item;
            })
        );
    };

    const clearCart = () => {
        setCartItems([]);
    };

    const getCartTotal = () => {
        return cartItems.reduce((total, item) => total + (item.price * item.quantity), 0);
    };

    const getCartCount = () => {
        return cartItems.reduce((count, item) => count + item.quantity, 0);
    };

    const value = {
        cartItems,
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
