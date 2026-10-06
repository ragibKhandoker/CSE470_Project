import api from './api';

export const adminService = {
  getStats: async () => {
    // TODO: implement API call
    const response = await api.get('/admin/stats');
    return response.data;
  },

  getUsers: async () => {
    // TODO: implement API call
    const response = await api.get('/admin/users');
    return response.data;
  },

  getNgoQueue: async () => {
    // TODO: implement API call
    const response = await api.get('/admin/ngo-queue');
    return response.data;
  },

  verifyNgo: async (ngoId, decision) => {
    // TODO: implement API call
    const response = await api.patch(`/admin/ngo-verify/${ngoId}`, { decision });
    return response.data;
  },

  getBotAlerts: async () => {
    // TODO: implement API call
    const response = await api.get('/admin/bot-alerts');
    return response.data;
  }
};

export default adminService;
