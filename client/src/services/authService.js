import api from './api';

export const authService = {
  checkExists: async ({ phone, email, identifier }) => {
    const params = new URLSearchParams();
    if (phone) params.append('phone', phone);
    if (email) params.append('email', email);
    if (identifier) params.append('identifier', identifier);
    const response = await api.get(`/auth/check-exists?${params.toString()}`);
    return response.data;
  },

  login: async (credentials) => {
    const response = await api.post('/auth/login', credentials);
    return response.data;
  },

  register: async (formData) => {
    let payload = formData;
    if (!(formData instanceof FormData) && typeof formData === 'object') {
      payload = new FormData();
      Object.entries(formData).forEach(([key, value]) => {
        if (value !== null && value !== undefined) {
          payload.append(key, value);
        }
      });
    }
    const response = await api.post('/auth/signup', payload, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return response.data;
  },

  googleLogin: async (idToken, role = 'donor') => {
    const response = await api.post('/auth/google', { token: idToken, role });
    return response.data;
  },

  getMe: async () => {
    const response = await api.get('/auth/me');
    return response.data;
  },

  verifyUser: async (id) => {
    const response = await api.patch(`/auth/verify/${id}`);
    return response.data;
  }
};

export default authService;
