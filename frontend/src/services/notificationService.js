import API from './api';

export const listNotifications = (unreadOnly = false) =>
    API.get(`notifications?unreadOnly=${unreadOnly ? 'true' : 'false'}`);

export const markNotificationRead = (id) => API.post(`notifications/${id}/read`);

export const markAllNotificationsRead = () => API.post('notifications/read-all');

