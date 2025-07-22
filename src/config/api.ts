// API Configuration
const API_BASE_URL = import.meta.env.PROD 
  ? 'https://your-flask-api-url.com/api'  // Replace with your deployed Flask API URL
  : '/api'; // Local development uses Vite proxy

export const API_ENDPOINTS = {
  LOGIN: `${API_BASE_URL}/login`,
  DEVICES: `${API_BASE_URL}/devices`,
  ANALYTICS: `${API_BASE_URL}/analytics`,
  DASHBOARD_STATS: `${API_BASE_URL}/dashboard-stats`,
  PREDICTIVE_MAINTENANCE: `${API_BASE_URL}/predictive-maintenance`,
  DEVICE_TYPES: `${API_BASE_URL}/device-types`,
};

export default API_BASE_URL;