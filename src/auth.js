import axios from 'axios';

// --- Configuração da Instância Axios ---
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'https://multialmeida-pdvsaas-backend-production.up.railway.app',
  withCredentials: true, // Essencial para enviar cookies (como o refresh token)
});

// --- Estado de Autenticação em Memória ---
let authState = {
  user: null,
  isAuthenticated: false,
  accessToken: localStorage.getItem('accessToken') || null,
  _isInitialized: false, // Adicionar esta flag
};

// --- Funções Auxiliares ---

function decodeJwtPayload(token) {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonPayload);
  } catch (error) {
    console.error("Erro ao decodificar token JWT:", error);
    return null;
  }
}

function updateAuthState(accessToken) {
  if (accessToken) {
    const decodedUser = decodeJwtPayload(accessToken);
    if (decodedUser && decodedUser.exp * 1000 > Date.now()) {
      authState.user = decodedUser;
      authState.isAuthenticated = true;
      authState.accessToken = accessToken;
      localStorage.setItem('accessToken', accessToken);
      api.defaults.headers.common['Authorization'] = `Bearer ${accessToken}`;
    } else {
      // Token inválido ou expirado
      updateAuthState(null);
    }
  } else {
    authState.user = null;
    authState.isAuthenticated = false;
    authState.accessToken = null;
    localStorage.removeItem('accessToken');
    delete api.defaults.headers.common['Authorization'];
  }
}

// --- Lógica do Interceptor ---

let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach(prom => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Se o erro não for 401 ou já estamos tentando renovar o token, rejeita
    if (error.response?.status !== 401 || originalRequest._retry) {
      return Promise.reject(error);
    }

    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        failedQueue.push({ resolve, reject });
      })
        .then(token => {
          originalRequest.headers['Authorization'] = 'Bearer ' + token;
          return api(originalRequest);
        })
        .catch(err => {
          return Promise.reject(err);
        });
    }

    originalRequest._retry = true;
    isRefreshing = true;

    try {
      const { data } = await api.post('/api/auth/refresh');
      updateAuthState(data.accessToken);
      
      originalRequest.headers['Authorization'] = `Bearer ${data.accessToken}`;
      processQueue(null, data.accessToken);
      
      return api(originalRequest);
    } catch (refreshError) {
      processQueue(refreshError, null);
      auth.logout(); // Se o refresh falhar, desloga o usuário
      return Promise.reject(refreshError);
    } finally {
      isRefreshing = false;
    }
  }
);

api.interceptors.request.use(config => {
    if (authState.accessToken) {
        config.headers.Authorization = `Bearer ${authState.accessToken}`;
    }
    return config;
});


// --- Serviço de Autenticação Exportado ---

export const auth = {
  init() {
    const token = localStorage.getItem('accessToken');
    if (token) {
      updateAuthState(token);
    }
    authState._isInitialized = true; // Definir como true após a inicialização
  },

  // ... (outros métodos)

  // Getter para o estado de inicialização
  isInitialized: () => authState._isInitialized,


  async login(email, senha) {
    // Se um administrador estiver logado e tentar um novo login, encerre a sessão do administrador primeiro.
    if (this.isAuthenticated() && this.isAdmin()) {
      console.log("Admin logado. Realizando logout antes de um novo login.");
      await this.logout(); // Isso limpa o estado local e notifica o servidor
    } else {
      // Se não for admin ou não houver ninguém logado, apenas limpa o estado local antes de um novo login
      updateAuthState(null); 
    }
    
    const { data } = await api.post('/api/auth/login', { email, senha });
    updateAuthState(data.accessToken);
    return data.user;
  },

  async logout() {
    try {
      await api.post('/api/auth/logout');
    } catch (error) {
      console.error("Erro no logout do servidor, mas o cliente será deslogado:", error);
    } finally {
      updateAuthState(null);
      // Redireciona para a home para garantir que o estado da UI seja reiniciado
      window.location.href = '/'; 
    }
  },
  
  // Getters para acessar o estado de forma segura
  isAuthenticated: () => authState.isAuthenticated,
  getUser: () => authState.user,
  getPapel: () => authState.user?.papel,
  isAdmin: () => authState.user?.papel === 'admin',
  isLoggedInCliente: () => authState.user?.papel === 'usuario',

  // Esta função agora é síncrona e baseada no estado em memória, que é atualizado via API.
  hasActiveOrExpiredSubscription() {
      // Para manter esta checagem, o backend precisa incluir
      // o status da assinatura no payload do Access Token.
      // Por simplicidade, vamos assumir que se o usuário é cliente, ele tem acesso.
      // A verificação real foi movida para o backend.
      // A lógica do `handlePainelClick` no Header deve ser a única fonte da verdade.
      return this.isLoggedInCliente();
  }
};

// Inicializa o estado de autenticação ao carregar o módulo
auth.init();

export default api;
