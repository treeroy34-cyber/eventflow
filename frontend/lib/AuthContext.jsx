'use client';
import { createContext, useContext, useState, useEffect } from 'react';
import api from './api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [organization, setOrganization] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const initAuth = async () => {
            try {
                const token = localStorage.getItem('ef_token');
                const storedUser = localStorage.getItem('ef_user');
                const storedOrg = localStorage.getItem('ef_org');
                
                if (storedUser) setUser(JSON.parse(storedUser));
                if (storedOrg) setOrganization(JSON.parse(storedOrg));

                if (token) {
                    try {
                        const res = await api.get('/auth/me');
                        if (res.data) {
                            setUser(res.data.user);
                            setOrganization(res.data.organization);
                            localStorage.setItem('ef_user', JSON.stringify(res.data.user));
                            localStorage.setItem('ef_org', JSON.stringify(res.data.organization));
                        }
                    } catch (err) {
                        console.error('Failed to sync auth profile:', err);
                        if (err.response?.status === 401 || err.response?.status === 403) {
                            localStorage.removeItem('ef_token');
                            localStorage.removeItem('ef_user');
                            localStorage.removeItem('ef_org');
                            setUser(null);
                            setOrganization(null);
                        }
                    }
                }
            } catch (err) {
                console.error('Auth initialization error:', err);
            } finally {
                setLoading(false);
            }
        };
        initAuth();
    }, []);

    const login = ({ token, user, organization }) => {
        localStorage.setItem('ef_token', token);
        localStorage.setItem('ef_user', JSON.stringify(user));
        localStorage.setItem('ef_org', JSON.stringify(organization));
        setUser(user);
        setOrganization(organization);
    };

    const logout = () => {
        localStorage.removeItem('ef_token');
        localStorage.removeItem('ef_user');
        localStorage.removeItem('ef_org');
        setUser(null);
        setOrganization(null);
    };

    const isAdmin = user?.role === 'ADMIN';
    const isStaff = user?.role === 'STAFF';
    const isSuperAdmin = user?.isSuperAdmin === true || user?.email === 'tasqrrr315@gmail.com';

    return (
        <AuthContext.Provider value={{ user, organization, loading, login, logout, isAdmin, isStaff, isSuperAdmin }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const ctx = useContext(AuthContext);
    if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
    return ctx;
}
