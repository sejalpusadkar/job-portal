import API from './api';

export const getRecruiterPublicProfile = (recruiterUserId) =>
    API.get(`recruiters/${recruiterUserId}/profile`);

export const getRecruiterPublicJobs = (recruiterUserId) =>
    API.get(`recruiters/${recruiterUserId}/jobs`);

export const getRecruiterPublicPosts = (recruiterUserId) =>
    API.get(`recruiters/${recruiterUserId}/posts`);

