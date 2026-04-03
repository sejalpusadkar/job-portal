import API from './api';

export const getRecruiterProfile = () => API.get('recruiter/profile');

export const updateRecruiterProfile = (payload) => API.put('recruiter/profile', payload);

export const uploadRecruiterPhoto = (file) => {
    const form = new FormData();
    form.append('file', file);
    return API.post('recruiter/profile-photo', form, {
        headers: { 'Content-Type': 'multipart/form-data' },
    });
};

export const createRecruiterPost = (caption, file) => {
    const form = new FormData();
    form.append('caption', caption || '');
    if (file) form.append('file', file);
    return API.post('recruiter/posts', form, {
        headers: { 'Content-Type': 'multipart/form-data' },
    });
};

