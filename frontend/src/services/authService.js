import API from './api';

// NOTE: Use relative URLs (no leading slash) so axios always joins with baseURL (/api).
export const register = (userData) => API.post('auth/register', userData);
export const login = (credentials) => API.post('auth/login', credentials);
export const me = () => API.get('auth/me');
export const forgotPassword = (email) => API.post('auth/forgot-password', { email });
export const resetPassword = ({ email, token, newPassword }) =>
    API.post('auth/reset-password', { email, token, newPassword });

export const validateResetToken = ({ email, token }) =>
    API.get(`auth/reset-password/validate`, { params: { email, token } });
