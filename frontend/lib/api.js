'use client';
import axios from 'axios';

export const getBaseURL = () => {
    if (typeof window !== 'undefined') {
        const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
        if (isLocalhost) {
            return process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
        }
        return '/api';
    }
    return '/api';
};

const api = axios.create({
    headers: { 'Content-Type': 'application/json' },
});

// Attach baseURL dynamically and attach JWT token from localStorage on every request
api.interceptors.request.use((config) => {
    if (!config.baseURL) {
        config.baseURL = getBaseURL();
    }
    if (typeof window !== 'undefined') {
        const token = localStorage.getItem('ef_token');
        if (token) config.headers.Authorization = `Bearer ${token}`;
    }
    // Delete Content-Type for FormData so axios/browser automatically adds multipart/form-data boundary
    if (typeof FormData !== 'undefined' && config.data instanceof FormData) {
        if (config.headers) {
            delete config.headers['Content-Type'];
        }
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
