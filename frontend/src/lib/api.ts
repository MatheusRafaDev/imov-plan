import axios from 'axios';
import Cookies from 'js-cookie';

const isBrowser = typeof window !== 'undefined';
const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5179/api';
// Usa o proxy local (/api) se estiver no browser e a URL base for absoluta,
// isso previne bloqueio de cookies de terceiros (ex: Safari) e erros de CORS.
const baseURL = isBrowser && apiUrl.startsWith('http') ? '/api' : apiUrl;

const api = axios.create({
  baseURL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
});

// O interceptor de request não é mais necessário para o token, pois
// o browser enviará o cookie HttpOnly automaticamente (withCredentials: true)

// Interceptor para lidar com erros de resposta
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      if (typeof window !== 'undefined') {
        Cookies.remove('user');
        window.location.href = '/auth';
      }
    }
    return Promise.reject(error);
  }
);

export default api;
