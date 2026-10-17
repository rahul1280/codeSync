import axios from 'axios';
import { API_BASE_URL } from '../utils/constants';

const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.response.use(
  (response) => {
    // If backend wrapped response in envelope { success: true, data: ... }, unwrap it
    if (response?.data && response.data.success !== undefined && response.data.data !== undefined) {
      return {
        ...response,
        data: response.data.data
      };
    }
    return response;
  },
  (error) => {
    if (error.response && error.response.status === 401) {
      // Don't auto-redirect if checking auth or on login/register pages
      const currentPath = window.location.pathname;
      const isAuthCheck = error.config.url.includes('/auth/me');
      const isAuthPage = currentPath === '/login' || currentPath === '/register' || currentPath === '/';

      if (!isAuthCheck && !isAuthPage) {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default api;
