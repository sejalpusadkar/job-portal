import API from './api';

export const getPostsFeed = () => API.get('posts');

export const togglePostLike = (postId) => API.post(`posts/${postId}/like`);

export const listPostComments = (postId) => API.get(`posts/${postId}/comments`);

export const addPostComment = (postId, text) => API.post(`posts/${postId}/comments`, { text });

export const sharePost = (postId) => API.post(`posts/${postId}/share`);

