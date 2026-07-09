import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
});

api.interceptors.request.use((config) => {
  const user = JSON.parse(localStorage.getItem('user') || 'null');
  if (user?.id) {
    config.headers['X-User-Id'] = user.id;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('user');
      window.dispatchEvent(new Event('auth:logout'));
    }
    return Promise.reject(error);
  }
);

export default api;

export const authApi = {
  googleLogin: (credential, role = 'student') =>
    api.post('/auth/google', { credential, role }),
  getMe: () => api.get('/auth/me'),
  registerTutor: (data) => api.post('/auth/register-tutor', data),
  upload: (file) => {
    const form = new FormData();
    form.append('file', file);
    return api.post('/auth/upload', form);
  },
};

export const coursesApi = {
  list: (search) => api.get('/courses/', { params: { search } }),
  get: (id) => api.get(`/courses/${id}`),
  buy: (id) => api.post(`/courses/${id}/buy`),
  myCourses: () => api.get('/courses/my-courses'),
  markProgress: (courseId, materialId, completed) =>
    api.post(`/courses/${courseId}/progress/${materialId}`, { completed }),
  getCommunity: (courseId, params) => api.get(`/courses/${courseId}/community`, { params }),
  getCommunityTopic: (courseId, topicId) => api.get(`/courses/${courseId}/community/${topicId}`),
  createTopic: (courseId, data) => api.post(`/courses/${courseId}/community`, data),
  getProjects: (courseId) => api.get(`/courses/${courseId}/projects`),
  createProject: (courseId, data) => api.post(`/courses/${courseId}/projects`, data),
  toggleLike: (projectId) => api.post(`/courses/projects/${projectId}/like`),
  addComment: (projectId, content) =>
    api.post(`/courses/projects/${projectId}/comments`, { content }),
};

export const tutorApi = {
  listCourses: () => api.get('/tutor/courses'),
  createCourse: (data) => api.post('/tutor/courses', data),
  getCourse: (id) => api.get(`/tutor/courses/${id}`),
  updateCourse: (id, data) => api.put(`/tutor/courses/${id}`, data),
  createTopic: (courseId, data) => api.post(`/tutor/courses/${courseId}/community`, data),
  getSales: () => api.get('/tutor/sales'),
  requestWithdraw: (amount) => api.post('/tutor/withdraw', { amount }),
  listWithdraws: () => api.get('/tutor/withdraw'),
};

export const settingsApi = {
  getHomepage: () => api.get('/settings/homepage'),
};

export const adminApi = {
  dashboard: () => api.get('/admin/dashboard'),
  listUsers: (search) => api.get('/admin/users', { params: { search } }),
  updateUser: (id, data) => api.put(`/admin/users/${id}`, data),
  listTutors: (search) => api.get('/admin/tutors', { params: { search } }),
  updateTutor: (id, data) => api.put(`/admin/tutors/${id}`, data),
  listCourses: (search) => api.get('/admin/courses', { params: { search } }),
  updateCourse: (id, data) => api.put(`/admin/courses/${id}`, data),
  listSales: (params) => api.get('/admin/sales', { params }),
  updateSale: (id, data) => api.put(`/admin/sales/${id}`, data),
  listWithdraws: (status) => api.get('/admin/withdraws', { params: { status } }),
  updateWithdraw: (id, data) => api.put(`/admin/withdraws/${id}`, data),
  listCommunity: (search) => api.get('/admin/community', { params: { search } }),
  deleteTopic: (id) => api.delete(`/admin/community/${id}`),
  getHomepageSettings: () => api.get('/admin/homepage-settings'),
  updateHomepageSettings: (data) => api.put('/admin/homepage-settings', data),
};
