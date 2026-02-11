import axios from 'axios';

const axiosClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5500',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token if available
axiosClient.interceptors.request.use(
  (config) => {
    // Add auth token from localStorage if available
    const token = localStorage.getItem('auth_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle errors
axiosClient.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error) => {
    // Just pass through errors without auto-clearing auth
    // Let individual components handle 401 errors appropriately
    return Promise.reject(error);
  }
);

export default axiosClient;
