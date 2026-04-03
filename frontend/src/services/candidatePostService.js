import API from './api';

export const createCandidatePost = (payload) => API.post('candidate/posts', payload);

export const listMyCandidatePosts = () => API.get('candidate/posts/me');

export const listCandidatePosts = (candidateUserId) => API.get(`candidates/${candidateUserId}/posts`);

export const uploadCandidatePostImage = (file) => {
    const form = new FormData();
    form.append('file', file);
    return API.post('candidate/posts/image', form, {
        headers: { 'Content-Type': 'multipart/form-data' },
    });
};

