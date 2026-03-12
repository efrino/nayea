import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';

const AuthContext = createContext({});

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [session, setSession] = useState(null);
    const [loading, setLoading] = useState(true);

    // Login Modal State
    const [loginModal, setLoginModal] = useState({ isOpen: false, onSuccess: null, hint: null });

    useEffect(() => {
        // Get active session
        supabase.auth.getSession().then(({ data: { session } }) => {
            setSession(session);
            setUser(session?.user ?? null);
            setLoading(false);
        });

        // Listen for auth state changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange(
            (_event, session) => {
                setSession(session);
                setUser(session?.user ?? null);
                setLoading(false);
            }
        );

        return () => {
            subscription.unsubscribe();
        };
    }, []);

    const login = async (email, password) => {
        const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password,
        });
        return { data, error };
    };

    const logout = async () => {
        const { error } = await supabase.auth.signOut();
        return { error };
    };

    // Open modal and store the callback to run after login
    const openLoginModal = useCallback((onSuccess = null, hint = null) => {
        setLoginModal({ isOpen: true, onSuccess, hint });
    }, []);

    // Close modal
    const closeLoginModal = useCallback(() => {
        setLoginModal({ isOpen: false, onSuccess: null, hint: null });
    }, []);

    // Called by LoginModal after successful login — closes modal & runs deferred action
    const handleModalLoginSuccess = useCallback((callback) => {
        closeLoginModal();
        if (callback) {
            // Small delay ensures auth state propagates before action runs
            setTimeout(() => callback(), 150);
        }
    }, [closeLoginModal]);

    const value = {
        session,
        user,
        loading,
        login,
        logout,
        loginModal,
        openLoginModal,
        closeLoginModal,
        handleModalLoginSuccess,
    };

    return (
        <AuthContext.Provider value={value}>
            {!loading && children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    return useContext(AuthContext);
};
