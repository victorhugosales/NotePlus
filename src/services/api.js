import axios from 'axios';
import { getToken, limparSessao } from '../utils/authStorage';

// Local sem VITE_API_URL definido cai no backend rodando na máquina do
// dev. Produção e homologação DEVEM setar VITE_API_URL nas env vars do
// Vercel (um valor por ambiente/branch) — sem isso, o build aponta pro
// localhost de quem compilou e a aplicação publicada não funciona.
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3333'
});

// Isso adiciona o token em toda chamada da API automaticamente
api.interceptors.request.use((config) => {
  const token = getToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Se o backend disser que o token é inválido/expirado, limpa a sessão local.
// Assim, na próxima vez que o usuário tentar entrar no /perfil, o RequireAuth
// já não encontra token e manda ele pro /cadastro de novo, em vez de travar em erro.
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      limparSessao();
    }
    return Promise.reject(error);
  }
);

export default api;