import { createContext, useContext, useState, useEffect, useCallback } from 'react';

const AuthContext = createContext();

const API_URL = import.meta.env.VITE_API_URL;
const TOKEN_KEY = 'lupora_token';

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [token, setToken] = useState(() => localStorage.getItem(TOKEN_KEY));
    const [loading, setLoading] = useState(true);
    const [showAuthModal, setShowAuthModal] = useState(false);

    const saveToken = useCallback((newToken) => {
        setToken(newToken);
        if (newToken) {
            localStorage.setItem(TOKEN_KEY, newToken);
        } else {
            localStorage.removeItem(TOKEN_KEY);
        }
    }, []);

    // Validate token on mount
    useEffect(() => {
        const validateToken = async () => {
            if (!token) {
                setLoading(false);
                return;
            }

            try {
                const res = await fetch(`${API_URL}/api/auth/me`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });

                if (res.ok) {
                    const userData = await res.json();
                    setUser(userData);
                } else {
                    saveToken(null);
                    setUser(null);
                }
            } catch {
                saveToken(null);
                setUser(null);
            } finally {
                setLoading(false);
            }
        };
        validateToken();
    }, [token, saveToken]);

    const login = useCallback(async (email, password) => {
        const res = await fetch(`${API_URL}/api/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password }),
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data.message);

        saveToken(data.token);
        setUser(data.user);
        setShowAuthModal(false);
        return data;
    }, [saveToken]);

    const register = useCallback(async (name, email, password) => {
        const res = await fetch(`${API_URL}/api/auth/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, email, password }),
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data.message);

        saveToken(data.token);
        setUser(data.user);
        setShowAuthModal(false);
        return data;
    }, [saveToken]);

    const logout = useCallback(() => {
        saveToken(null);
        setUser(null);
    }, [saveToken]);

    const value = {
        user,
        setUser,
        token,
        loading,
        isAuthenticated: !!user,
        login,
        register,
        logout,
        showAuthModal,
        setShowAuthModal,
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}
