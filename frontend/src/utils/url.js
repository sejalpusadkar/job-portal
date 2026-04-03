export const resolveBackendOrigin = () => {
    // Preferred: set REACT_APP_API_BASE_URL (e.g. https://your-render.onrender.com/api/)
    // We'll infer the backend origin from it.
    const apiBase = process.env.REACT_APP_API_BASE_URL;
    if (apiBase && apiBase.trim()) {
        const trimmed = apiBase.trim().replace(/\/+$/, ''); // remove trailing slashes
        // If it ends with /api, strip it to get the backend origin.
        const withoutApi = trimmed.endsWith('/api') ? trimmed.slice(0, -4) : trimmed;
        return withoutApi.replace(/\/+$/, '');
    }

    const envOrigin = process.env.REACT_APP_BACKEND_ORIGIN;
    if (envOrigin && envOrigin.trim()) return envOrigin.trim().replace(/\/+$/, '');
    const { protocol, hostname, origin } = window.location;
    if (hostname === 'localhost' || hostname === '127.0.0.1') {
        return `${protocol}//${hostname}:8080`;
    }
    return origin;
};

export const resolveUploadUrl = (url) => {
    const u = (url || '').trim();
    if (!u) return '';
    if (u.startsWith('/uploads/')) return `${resolveBackendOrigin()}${u}`;
    return u;
};
