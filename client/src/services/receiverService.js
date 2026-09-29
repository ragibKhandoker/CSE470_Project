import api from './api';

export const receiverService = {
  submitFoodRequest: async (requestData) => {
    // TODO: implement API call
    const response = await api.post('/food-requests', requestData);
    return response.data;
  },

  getMyRequests: async () => {
    // TODO: implement API call
    const response = await api.get('/food-requests/my-requests');
    return response.data;
  }
};

export default receiverService;
