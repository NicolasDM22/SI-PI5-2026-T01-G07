import axios from 'axios';

// Troque pela URL real da API quando disponível
const BASE_URL = 'https://api.seudominio.com/v1';

export const apiClient = axios.create({
  baseURL: BASE_URL,
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
});

// Injeta o token JWT em todas as requisições
apiClient.interceptors.request.use((config) => {
  // TODO: pegar token do authStore quando API estiver pronta
  // const token = useAuthStore.getState().token;
  // if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Trata erros globalmente
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // TODO: redirecionar para login
    }
    return Promise.reject(error);
  }
);

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

// Simula latência de rede para deixar o mock mais realista
export const mockDelay = () => delay(400 + Math.random() * 300);
