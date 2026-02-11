import AsyncStorage from '@react-native-async-storage/async-storage';
import API_URL from '../config/api';

export const authAPI = {
  login: async (email: string, password: string) => {
    const response = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    return response.json();
  },

  logout: async () => {
    await AsyncStorage.removeItem('authToken');
    await AsyncStorage.removeItem('userId');
  },

  getToken: async () => {
    return await AsyncStorage.getItem('authToken');
  },

  updateProfile: async (data: any) => {
    const token = await AsyncStorage.getItem('authToken');
    const response = await fetch(`${API_URL}/auth/profile`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(data),
    });
    return response.json();
  },

  getProfile: async () => {
    const token = await AsyncStorage.getItem('authToken');
    const response = await fetch(`${API_URL}/auth/me`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`
      },
    });
    return response.json();
  },
};
