import API from './api';

// Use relative paths so axios baseURL '/api/' is always applied.
export const getMetrics = () => API.get('admin/metrics');
export const getPendingRecruiters = () => API.get('admin/recruiters/pending');
export const approveRecruiter = (userId) => API.post(`admin/recruiters/${userId}/approve`);
export const rejectRecruiter = (userId) => API.post(`admin/recruiters/${userId}/reject`);

export const listUsers = () => API.get('admin/users');
export const deleteUser = (userId) => API.delete(`admin/users/${userId}`);

export const listJobs = (limit = 50) => API.get(`admin/jobs?limit=${limit}`);
export const listApplications = (limit = 50) => API.get(`admin/applications?limit=${limit}`);
