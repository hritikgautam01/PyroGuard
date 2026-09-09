import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

const client = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 15000,
});

export const fetchHealth = async () => {
  const response = await client.get('/health');
  return response.data;
};

export const fetchDetections = async (params = {}) => {
  const response = await client.get('/detections', { params });
  return response.data;
};

export const fetchStats = async () => {
  const response = await client.get('/stats');
  return response.data;
};

export const predictThermalSource = async (features) => {
  const response = await client.post('/predict', features);
  return response.data;
};

export default client;
