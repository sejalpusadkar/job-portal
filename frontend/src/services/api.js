import axios from 'axios';
import { API_BASE_URL } from '../utils/url';

// IMPORTANT: Keep a trailing slash so axios joins paths correctly:
// baseURL `${API_BASE_URL}/api/` + 'auth/register' -> `${API_BASE_URL}/api/auth/register`
const API_ROOT = API_BASE_URL ? `${API_BASE_URL.replace(/\/+$/, '')}/api/` : '/api/';

const API = axios.create({
    baseURL: API_ROOT,
    headers: { 'Content-Type': 'application/json' },
});

// Attach token to every request if it exists
API.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    const url = (config.url || '').toString();
    const isAuthEndpoint = url.includes('/auth/') || url.startsWith('auth/') || url.includes('auth/');
    const isPublicAuthEndpoint =
        isAuthEndpoint &&
        (url.includes('auth/login') ||
            url.includes('auth/register') ||
            url.includes('auth/forgot-password') ||
            url.includes('auth/reset-password') ||
            url.includes('auth/ping'));

    // Attach token to all non-public endpoints.
    // Important: /auth/me needs the token, otherwise dashboards overwrite user with nulls and redirect back to /login.
    if (token && (!isAuthEndpoint || !isPublicAuthEndpoint)) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

// Handle 401 Unauthorized responses
API.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            // Only force-logout when we *expected* to be authenticated.
            // Otherwise, login/register invalid credentials would refresh the page
            // and clear the user's typed input.
            const token = localStorage.getItem('token');
            const url = (error.config?.url || '').toString();
            const path = window.location?.pathname || '';
            const isAuthEndpoint =
                url.includes('/auth/') || url.startsWith('auth/') || url.includes('auth/');
            const isPublicAuthEndpoint =
                isAuthEndpoint &&
                (url.includes('auth/login') ||
                    url.includes('auth/register') ||
                    url.includes('auth/forgot-password') ||
                    url.includes('auth/reset-password') ||
                    url.includes('auth/ping'));

            if (token && (!isAuthEndpoint || !isPublicAuthEndpoint)) {
                // Avoid nuking unrelated localStorage keys and avoid redirect loops.
                localStorage.removeItem('token');
                localStorage.removeItem('user');
                if (path !== '/login') window.location.href = '/login';
            }
        }
        return Promise.reject(error);
    }
);

export default API;
