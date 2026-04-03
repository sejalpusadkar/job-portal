import API from './api';

export const getAllJobs = () => API.get('jobs');
export const getJobById = (id) => API.get(`jobs/${id}`);
