import axios from 'axios';

// URL base da nossa API
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:7000/api';

// Instância do axios com configurações padrão
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Interceptor para adicionar token automaticamente nas requisições
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Interceptor para lidar com erros de resposta
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Se token expirou ou é inválido, redirecionar para login
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Funções para autenticação
export const authAPI = {
  register: (userData) => api.post('/auth/register', userData),
  login: (credentials) => api.post('/auth/login', credentials),
};

// Funções para fichas de personagem
export const characterAPI = {
  create: (characterData) => api.post('/characters', characterData),
  getMyCharacters: () => api.get('/characters/my-characters'),
  getAllCharacters: () => api.get('/characters/all'), // Apenas mestres
  getById: (id) => api.get(`/characters/${id}`),
  update: (id, characterData) => api.put(`/characters/${id}`, characterData),
  delete: (id) => api.delete(`/characters/${id}`)
};

export default api;