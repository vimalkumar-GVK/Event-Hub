import client from './client';

export const usersApi = {
  getUsers: async () => {
    const response = await client.get('/users');
    return response.data;
  },

  createSubAdmin: async (data: any) => {
    const response = await client.post('/users/sub-admin', data);
    return response.data;
  },

  deleteUser: async (userId: string) => {
    const response = await client.delete(`/users/${userId}`);
    return response.data;
  },

  updateProfile: async (data: any) => {
    const response = await client.put('/users/profile', data);
    return response.data;
  },
};
