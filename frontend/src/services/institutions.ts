import client from './client';
import type { Institution } from '../types/user';

export const institutionApi = {
  getAll: async () => {
    const response = await client.get('/institutions');
    return response.data as Institution[];
  },
  getOne: async (id: number) => {
    const response = await client.get(`/institutions/${id}`);
    return response.data as Institution;
  },
  create: async (data: Partial<Institution>) => {
    const response = await client.post('/institutions', data);
    return response.data as Institution;
  },
  update: async (id: number, data: Partial<Institution>) => {
    const response = await client.put(`/institutions/${id}`, data);
    return response.data as Institution;
  },
  delete: async (id: number) => {
    const response = await client.delete(`/institutions/${id}`);
    return response.data;
  },
  getPendingStudents: async () => {
    const response = await client.get('/students/pending');
    return response.data;
  },
  verifyStudent: async (id: number) => {
    const response = await client.post(`/students/${id}/verify`);
    return response.data;
  },
  rejectStudent: async (id: number, reason: string) => {
    const response = await client.post(`/students/${id}/reject`, { reason });
    return response.data;
  }
};
