import { createContext, useContext, useReducer, useEffect, useCallback } from 'react';
import { cartFetch } from '../utils/api';
import { useAuth } from './AuthContext';

const CartContext = createContext();

const initialState = {
    items: [],
    totalItems: 0,
    totalPrice: 0,
    loading: false,
};

function cartReducer(state, action) {
    switch (action.type) {
        case 'SET_CART':
            return {
                ...state,
                items: action.payload.items,
                totalItems: action.payload.totalItems,
                totalPrice: action.payload.totalPrice,
                loading: false,
            };
        case 'SET_LOADING':
            return { ...state, loading: action.payload };
        case 'UPDATE_TOTAL':
            return { ...state, totalItems: action.payload };
        case 'CLEAR_CART':
            return { ...initialState };
        default:
            return state;
    }
}

export function CartProvider({ children }) {
    const [state, dispatch] = useReducer(cartReducer, initialState);
    const { isAuthenticated, user, loading: authLoading } = useAuth();

    const fetchCart = useCallback(async () => {
        if (!isAuthenticated) return;
        try {
            dispatch({ type: 'SET_LOADING', payload: true });
            const data = await cartFetch('/api/cart');
            dispatch({ type: 'SET_CART', payload: data });
        } catch (error) {
            console.error('Failed to fetch cart:', error);
            dispatch({ type: 'SET_LOADING', payload: false });
        }
    }, [isAuthenticated]);

    // Fetch cart when auth state or user changes (handles user switch)
    useEffect(() => {
        if (authLoading) return;
        if (isAuthenticated) {
            fetchCart();
        } else {
            dispatch({ type: 'CLEAR_CART' });
        }
    }, [isAuthenticated, authLoading, fetchCart, user?.id]);

    const addToCart = useCallback(async (productId, quantity = 1) => {
        const data = await cartFetch('/api/cart/add', {
            method: 'POST',
            body: JSON.stringify({ productId, quantity }),
        });
        dispatch({ type: 'UPDATE_TOTAL', payload: data.totalItems });
        await fetchCart();
        return data;
    }, [fetchCart]);

    const updateQuantity = useCallback(async (productId, quantity) => {
        const data = await cartFetch('/api/cart/update', {
            method: 'PUT',
            body: JSON.stringify({ productId, quantity }),
        });
        dispatch({ type: 'UPDATE_TOTAL', payload: data.totalItems });
        await fetchCart();
        return data;
    }, [fetchCart]);

    const removeFromCart = useCallback(async (productId) => {
        const data = await cartFetch(`/api/cart/remove/${productId}`, {
            method: 'DELETE',
        });
        dispatch({ type: 'UPDATE_TOTAL', payload: data.totalItems });
        await fetchCart();
        return data;
    }, [fetchCart]);

    const clearCart = useCallback(async () => {
        await cartFetch('/api/cart/clear', { method: 'DELETE' });
        dispatch({ type: 'SET_CART', payload: { items: [], totalItems: 0, totalPrice: 0 } });
    }, []);

    const value = {
        ...state,
        addToCart,
        updateQuantity,
        removeFromCart,
        clearCart,
        refreshCart: fetchCart,
    };

    return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
    const context = useContext(CartContext);
    if (!context) {
        throw new Error('useCart must be used within a CartProvider');
    }
    return context;
}
