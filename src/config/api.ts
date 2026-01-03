// API Configuration
// In development, we use Vite's proxy ('') to hit the local backend (http://localhost:5000)
// In production, we use the Render URL or the provided environment variable
export const API_BASE_URL = import.meta.env.MODE === 'production'
  ? (import.meta.env.VITE_API_URL || 'https://emi-pro-app.onrender.com')
  : ''; // Empty string = uses Vite proxy in dev

export const getApiUrl = (endpoint: string) => {
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint.slice(1) : endpoint;
  return API_BASE_URL ? `${API_BASE_URL}/${cleanEndpoint}` : `/${cleanEndpoint}`;
};
