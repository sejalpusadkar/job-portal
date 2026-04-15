import React, { createContext, useState, useContext, useEffect } from 'react';
import { me } from '../services/authService';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let mounted = true;
        const boot = async () => {
            const token = localStorage.getItem('token');
            const storedUser = localStorage.getItem('user');

            // If we have a stored user but no token, treat it as logged out (prevents "ghost sessions").
            if (!token && storedUser) {
                localStorage.removeItem('user');
            }

            // Optimistic UI: show stored user immediately (if token exists) while we validate with /auth/me.
            if (token && storedUser) {
                try {
                    const parsed = JSON.parse(storedUser);
                    if (mounted) setUser(parsed);
                } catch {
                    // ignore
                }
            }

            if (!token) {
                if (mounted) {
                    setUser(null);
                    setLoading(false);
                }
                return;
            }

            try {
                const res = await me();
                const d = res?.data;
                if (mounted && d?.id) {
                    const nextUser = {
                        id: d.id,
                        email: d.email,
                        role: d.role,
                        recruiterApproved: !!d.recruiterApproved,
                    };
                    localStorage.setItem('user', JSON.stringify(nextUser));
                    setUser(nextUser);
                }
            } catch (err) {
                // Only clear session when the backend explicitly says the token is invalid.
                // If backend is temporarily down/restarting, keep the session to avoid random logouts.
                const status = err?.response?.status;
                if (status === 401 || status === 403) {
                    localStorage.removeItem('token');
                    localStorage.removeItem('user');
                    if (mounted) setUser(null);
                }
            } finally {
                if (mounted) setLoading(false);
            }
        };

        boot();
        return () => {
            mounted = false;
        };
    }, []);

    const login = (userData, token) => {
        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify(userData));
        setUser(userData);
    };

    const updateUser = (partial) => {
        setUser((prev) => {
            const next = { ...(prev || {}), ...(partial || {}) };
            localStorage.setItem('user', JSON.stringify(next));
            return next;
        });
    };

    const logout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setUser(null);
        window.location.href = '/login';
    };

    return (
        <AuthContext.Provider value={{ user, login, updateUser, logout, loading }}>
            {children}
        </AuthContext.Provider>
    );
};
