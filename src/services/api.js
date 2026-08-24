import axios from 'axios';

const api = axios.create({
  //Para o vercel:
  baseURL: import.meta.env.VITE_API_URL || 'https://homologacaonoteplusbackend.onrender.com'

  //Produção:
  //baseURL: 'https://noteplusbackend.onrender.com'

  // homologação:
  //baseURL: 'https://homologacaonoteplusbackend.onrender.com'

  //Para testes locais:
  //baseURL: 'http://localhost:3333'
});

// Isso adiciona o token em toda chamada da API automaticamente
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('@NotePlus:token');
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
      localStorage.removeItem('@NotePlus:token');
      localStorage.removeItem('@NotePlus:user');
    }
    return Promise.reject(error);
  }
);

export default api;