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
      const url = error.config?.url || '';
      if (
        typeof window !== 'undefined' && 
        !url.includes('/auth/login') && 
        !url.includes('/auth/register') &&
        !url.includes('/auth/forgot-password') &&
        !url.includes('/auth/reset-password') &&
        !url.includes('/usuario/') &&
        // Chamadas ao /plano/* logo após criar conta ou entrar podem falhar com 401
        // por uma corrida entre o cookie de sessão sendo aplicado e a chamada seguinte.
        // Forçar logout aqui derrubava o usuário de volta para /auth no meio do cadastro
        // do imóvel. As telas que usam essas chamadas já tratam falha localmente
        // (fallback para localStorage + toast), então deixamos o erro seguir sem deslogar.
        !url.includes('/plano/')
      ) {
        Cookies.remove('user');
        window.location.href = '/auth';
      }
    }
    return Promise.reject(error);
  }
);

export default api;
