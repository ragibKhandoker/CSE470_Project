import api from './api';

export const foodPostService = {
  getAllPosts: async (params) => {
    // TODO: implement API call
    const response = await api.get('/food-posts', { params });
    return response.data;
  },

  getPostById: async (id) => {
    // TODO: implement API call
    const response = await api.get(`/food-posts/${id}`);
    return response.data;
  },

  getMyDonations: async () => {
    // TODO: implement API call
    const response = await api.get('/food-posts/my-donations');
    return response.data;
  },

  createPost: async (postData) => {
    // TODO: implement API call
    const response = await api.post('/food-posts', postData);
    return response.data;
  },

  updatePost: async (id, postData) => {
    // TODO: implement API call
    const response = await api.put(`/food-posts/${id}`, postData);
    return response.data;
  },

  deletePost: async (id) => {
    // TODO: implement API call
    const response = await api.delete(`/food-posts/${id}`);
    return response.data;
  }
};

export default foodPostService;
