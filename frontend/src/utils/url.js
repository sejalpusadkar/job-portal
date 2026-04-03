// Single source of truth:
// Set this in Vercel as REACT_APP_API_BASE_URL=https://<your-railway-domain>
// Keep it as the origin only (no trailing /api).
export const API_BASE_URL = (process.env.REACT_APP_API_BASE_URL || '').trim().replace(/\/+$/, '');

export const resolveBackendOrigin = () => {
    if (API_BASE_URL) return API_BASE_URL;

    // Local fallback for dev when env isn't provided.
    const { protocol, hostname, origin } = window.location;
    if (hostname === 'localhost' || hostname === '127.0.0.1') return `${protocol}//${hostname}:8080`;
    return origin;
};

export const resolveUploadUrl = (url) => {
    const u = (url || '').trim();
    if (!u) return '';
    if (u.startsWith('/uploads/')) return `${resolveBackendOrigin()}${u}`;
    return u;
};
