// API Configuration
// This file centralizes the API URL configuration for all components

export const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3002';

// Helper function for authenticated fetch requests
export const authFetch = async (endpoint, options = {}) => {
  const token = localStorage.getItem('token');
  const headers = {
    ...options.headers,
    'Authorization': `Bearer ${token}`
  };

  return fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers
  });
};

// Helper function for regular fetch requests
export const apiFetch = async (endpoint, options = {}) => {
  return fetch(`${API_URL}${endpoint}`, options);
};

export default API_URL;
