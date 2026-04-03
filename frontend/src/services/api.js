import axios from 'axios';

// In dev, CRA proxy (package.json "proxy") can forward /api -> backend,
// which avoids CORS and "wrong port" issues.
// IMPORTANT: Keep a trailing slash so axios joins paths correctly:
// baseURL '/api/' + 'auth/register' -> '/api/auth/register' (NOT '/apiauth/register')
const normalizeApiBase = (v) => {
    const raw = (v || '').trim();
    if (!raw) return '/api/';

    // If user provides only the origin (e.g. https://...up.railway.app),
    // automatically append /api/.
    const withoutTrailing = raw.replace(/\/+$/, '');
    if (withoutTrailing.endsWith('/api')) return `${withoutTrailing}/`;
    return `${withoutTrailing}/api/`;
};

const API_BASE_URL = normalizeApiBase(process.env.REACT_APP_API_BASE_URL);

const API = axios.create({
    baseURL: API_BASE_URL,
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
                localStorage.clear();
                window.location.href = '/login';
            }
        }
        return Promise.reject(error);
    }
);

export default API;
