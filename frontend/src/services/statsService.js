import API from './api';

export const getCandidateStats = () => API.get('candidate/stats');

export const getRecruiterStats = () => API.get('recruiter/stats');

