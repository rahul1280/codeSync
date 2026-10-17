
import axios from 'axios';
import { API_BASE_URL } from '../utils/constants';

const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Attach the saved JWT to every API request.
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('codesync_token');

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => Promise.reject(error)
);

// Unwrap the backend response envelope.
api.interceptors.response.use(
  (response) => {
    if (
      response?.data &&
      response.data.success !== undefined &&
      response.data.data !== undefined
    ) {
      return {
        ...response,
        data: response.data.data,
      };
    }

    return response;
  },
  (error) => {
    if (error.response?.status === 401) {
      const currentPath = window.location.pathname;
      const requestUrl = error.config?.url || '';
      const isAuthCheck = requestUrl.includes('/auth/me');
      const isAuthPage =
        currentPath === '/login' ||
        currentPath === '/register' ||
        currentPath === '/';

      if (!isAuthCheck && !isAuthPage) {
        window.location.href = '/login';
      }
    }

    return Promise.reject(error);
  }
);

export default api;
