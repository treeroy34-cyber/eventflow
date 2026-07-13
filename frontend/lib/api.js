'use client';
import axios from 'axios';

const api = axios.create({
    baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api',
    headers: { 'Content-Type': 'application/json' },
});

// Attach JWT token from localStorage on every request
api.interceptors.request.use((config) => {
    if (typeof window !== 'undefined') {
        const token = localStorage.getItem('ef_token');
        if (token) config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

// Redirect to /login on 401 responses
api.interceptors.response.use(
    (res) => res,
    (err) => {
        if (err.response?.status === 401 && typeof window !== 'undefined') {
            localStorage.removeItem('ef_token');
            localStorage.removeItem('ef_user');
            localStorage.removeItem('ef_org');
            window.location.href = '/login';
        }
        return Promise.reject(err);
    }
);

export default api;
