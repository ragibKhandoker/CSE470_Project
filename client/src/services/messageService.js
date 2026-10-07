import api from './api';

export const messageService = {
  sendAdminMessage: async ({ receiver_id, message_text }) => {
    const response = await api.post('/messages/admin', { receiver_id, message_text });
    return response.data;
  },

  getAdminInbox: async () => {
    const response = await api.get('/messages/admin-inbox');
    return response.data;
  },

  sendMessage: async ({ receiver_id, food_post_id = null, message_text }) => {
    const response = await api.post('/messages', {
      receiver_id,
      food_post_id,
      message_text
    });
    return response.data;
  },

  getConversation: async (userId, foodPostId = null) => {
    const params = foodPostId ? { food_post_id: foodPostId } : {};
    const response = await api.get(`/messages/conversation/${userId}`, { params });
    return response.data;
  }
};

export default messageService;
