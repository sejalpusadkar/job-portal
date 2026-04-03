import API from './api';

export const listCandidateInterviews = () => API.get('candidate/interviews');

export const listRecruiterInterviews = () => API.get('recruiter/interviews');

export const scheduleInterview = (payload) => API.post('recruiter/interviews', payload);

