import axios from "axios";
import { useAuthStore } from "../stores/authStore.js";

const api = axios.create({
  baseURL: "http://127.0.0.1:5000/api", // bypass Vite proxy issues
  headers: {},
});

// Request interceptor for auth token
api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor for debugging 404s
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 404) {
      console.error(
        "API 404 Error:",
        error.config?.method?.toUpperCase(),
        error.config?.baseURL + error.config?.url,
      );
    }
    return Promise.reject(error);
  },
);

export const symptomApi = api;
export const workoutApi = api;
export const chatApi = api;

export default api;
