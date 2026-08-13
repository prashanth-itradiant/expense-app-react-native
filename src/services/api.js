import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { API_URL } from '@env';

export const AUTH_TOKEN_KEY = 'expensedesk.authToken';

const attachToken = async config => {
  const token = await AsyncStorage.getItem(AUTH_TOKEN_KEY);
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
};

const api = axios.create({ baseURL: API_URL, timeout: 30000 });
api.interceptors.request.use(attachToken);
axios.interceptors.request.use(attachToken);

export const saveAuthToken = token =>
  AsyncStorage.setItem(AUTH_TOKEN_KEY, token);
export const clearAuthToken = () => AsyncStorage.removeItem(AUTH_TOKEN_KEY);
export const getAuthToken = () => AsyncStorage.getItem(AUTH_TOKEN_KEY);
export default api;
