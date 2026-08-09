import axios from 'axios';

const api = axios.create({
  //Para o vercel:
  //baseURL: import.meta.env.VITE_API_URL || 'https://homologacaonoteplusbackend.onrender.com'

  //Produção:
  //baseURL: 'https://noteplusbackend.onrender.com'

  // homologação:
  //baseURL: 'https://homologacaonoteplusbackend.onrender.com'

  //Para testes locais:
  baseURL: 'http://localhost:3333'
});

// Isso adiciona o token em toda chamada da API automaticamente
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('@NotePlus:token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;