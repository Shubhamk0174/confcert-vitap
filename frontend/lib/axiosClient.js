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
    // Handle common errors here
    if (error.response?.status === 401) {
      // Handle unauthorized - clear auth data
      console.error('Unauthorized access - clearing auth data');
      
      // Only clear and redirect if not already on auth pages
      if (typeof window !== 'undefined') {
        const currentPath = window.location.pathname;
        const isAuthPage = currentPath.includes('/login') || currentPath.includes('/register');
        
        if (!isAuthPage) {
          // Clear localStorage
          localStorage.removeItem('auth_token');
          localStorage.removeItem('user_data');
          localStorage.removeItem('user_type');
          
          // Clear Supabase session
          try {
            const { supabase } = await import('@/lib/supabase');
            await supabase.auth.signOut();
          } catch (err) {
            console.error('Error signing out:', err);
          }
          
          // Redirect to login
          window.location.replace('/login');
        }
      }
    }
    return Promise.reject(error);
  }
);

export default axiosClient;
