import axios from 'axios';

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

const client = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 45000,
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

/* =========================================================
   NEARBY INDUSTRIAL INFRASTRUCTURE
========================================================= */

export const fetchInfrastructure = async (
  latitude,
  longitude,
  radius_km = 10
) => {
  const response = await client.get('/infrastructure', {
    params: {
      latitude,
      longitude,
      radius_km,
    },
  });

  return response.data;
};

/* =========================================================
   AI PREDICTION
========================================================= */

export const predictThermalSource = async (features) => {
  const response = await client.post('/predict', features);
  return response.data;
};

export const validateFirmsApiKey = async (map_key) => {
  const response = await client.get('/firms/validate', {
    params: { map_key }
  });
  return response.data;
};

export default client;
