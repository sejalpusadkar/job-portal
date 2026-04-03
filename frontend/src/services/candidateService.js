import API from './api';

// Fetch the candidate's profile
export const getProfile = () => API.get('candidate/profile');

// Update the candidate's profile
export const updateProfile = (profileData) => API.put('candidate/profile', profileData);

// Get jobs matched to this candidate (with match scores)
export const getMatchedJobs = () => API.get('candidate/matched-jobs');

// Get all applications submitted by this candidate
export const getApplications = () => API.get('candidate/applications');

// Apply for a specific job
export const applyForJob = (jobId) => API.post(`candidate/apply/${jobId}`);

export const uploadProfilePhoto = (file) => {
    const form = new FormData();
    form.append('file', file);
    return API.post('candidate/profile-photo', form, {
        headers: { 'Content-Type': 'multipart/form-data' },
    });
};

export const uploadResume = (file) => {
    const form = new FormData();
    form.append('file', file);
    return API.post('candidate/resume', form, {
        headers: { 'Content-Type': 'multipart/form-data' },
    });
};

export const listCertificates = () => API.get('candidate/certificates');

export const uploadCertificates = (files) => {
    const form = new FormData();
    (files || []).forEach((f) => form.append('files', f));
    return API.post('candidate/certificates', form, {
        headers: { 'Content-Type': 'multipart/form-data' },
    });
};

export const deleteCertificate = (certificateId) => API.delete(`candidate/certificates/${certificateId}`);

export const getApplicationDetail = (applicationId) => API.get(`candidate/applications/${applicationId}`);
