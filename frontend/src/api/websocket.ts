import axios from '@/lib/axios';

export const websocketApi = {
  getUserPresence: async (userId: number) => {
    const response = await axios.get(`/api/v1/presence/${userId}`);
    return response.data;
  },

  getBulkPresence: async (userIds: number[]) => {
    const response = await axios.post('/api/v1/presence/bulk', userIds);
    return response.data;
  },
};
