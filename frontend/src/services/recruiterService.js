import API from './api';

export const listMyJobs = () => API.get('recruiter/jobs');
export const createJob = (payload) => API.post('recruiter/jobs', payload);
export const updateJob = (jobId, payload) => API.put(`recruiter/jobs/${jobId}`, payload);
export const deleteJob = (jobId) => API.delete(`recruiter/jobs/${jobId}`);

export const getMatchedCandidates = (jobId) =>
    API.get(`recruiter/jobs/${jobId}/matched-candidates`);

export const getJobApplications = (jobId) => API.get(`recruiter/jobs/${jobId}/applications`);

export const updateApplicationStatus = (applicationId, status) =>
    API.put(`recruiter/applications/${applicationId}/status`, { status });

export const emailCandidate = (applicationId, subject, message) =>
    API.post(`recruiter/applications/${applicationId}/email`, { subject, message });

export const getRecruiterNotifications = () => API.get('recruiter/notifications');

export const getCandidateProfileForRecruiter = (candidateUserId) =>
    API.get(`recruiter/candidates/${candidateUserId}/profile`);

export const uploadJobAttachment = (file) => {
    const fd = new FormData();
    fd.append('file', file);
    return API.post('recruiter/job-attachment', fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
    });
};
