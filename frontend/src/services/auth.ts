import client from './client';
import type { User, LoginCredentials, RegisterData } from '../types/user';

export const authApi = {
  login: async (credentials: LoginCredentials) => {
    const response = await client.post('/login', credentials);
    return response.data;
  },

  register: async (data: RegisterData) => {
    const response = await client.post('/register', data);
    return response.data;
  },

  getMe: async () => {
    const response = await client.get('/me');
    return response.data;
  },

  requestOtp: async (phone_number: string) => {
    const response = await client.post('/forgot-password', { phone_number });
    return response.data;
  },

  verifyOtp: async (phone_number: string, otp: string) => {
    const response = await client.post('/verify-otp', { phone_number, otp });
    return response.data;
  },

  resetPassword: async (phone_number: string, otp: string, new_password: string) => {
    const response = await client.post('/reset-password', { phone_number, otp, new_password });
    return response.data;
  },
};
