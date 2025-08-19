import axios from 'axios';

const API_BASE_URL = '/api';

export const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000, // 10 seconds timeout
  headers: {
    'Content-Type': 'application/json',
  },
});

// Optional: Add interceptors for centralized error handling or logging
api.interceptors.request.use(
  (config) => {
    // You can modify the request config here (e.g., add an auth token)
    console.log(`🚀 Sending request to: ${config.url}`);
    return config;
  },
  (error) => {
    console.error('❌ Request error:', error);
    return Promise.reject(error);
  }
);

api.interceptors.response.use(
  (response) => {
    // You can process successful responses here
    console.log(`✅ Received response from: ${response.config.url}`);
    return response;
  },
  async (error) => {
    // Centralized error handling for all API calls
    console.error(`❌ API Error on ${error.config?.url || 'unknown endpoint'}:`, error.response?.data || error.message);
    
    // You can customize the error message here
    const errorMessage = error.response?.data?.detail || 'An unexpected error occurred. Please try again later.';
    
    // Return a rejected promise with the error
    return Promise.reject(new Error(errorMessage));
  }
);

export default api;
