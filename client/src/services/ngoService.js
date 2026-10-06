import api from './api';

export const ngoService = {
  registerNgo: async (ngoData) => {
    // TODO: implement API call
    const response = await api.post('/ngos/register', ngoData);
    return response.data;
  },

  getNgoProfile: async () => {
    // TODO: implement API call
    const response = await api.get('/ngos/profile');
    return response.data;
  },

  requestCollection: async (collectionData) => {
    // TODO: implement API call
    const response = await api.post('/collection-requests', collectionData);
    return response.data;
  },

  getMyCollections: async () => {
    // TODO: implement API call
    const response = await api.get('/collection-requests/my-requests');
    return response.data;
  },

  logServing: async (servingData) => {
    // TODO: implement API call
    const response = await api.post('/serving-logs', servingData);
    return response.data;
  }
};

export default ngoService;
