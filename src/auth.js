import axios from 'axios';

// --- Configuração da Instância Axios ---
// Em desenvolvimento: usa o proxy do Vite (http://localhost:5174/api → http://localhost:5174/api via proxy → backend)
// Em produção: usa a URL completa do backend
const baseURL = import.meta.env.VITE_API_URL || (
  import.meta.env.DEV 
    ? '' // Em dev, usa URLs relativas que serão proxyadas pelo Vite
    : 'https://multialmeida-pdvsaas-backend-production.up.railway.app'
);

console.log('📍 API baseURL:', baseURL || '(usando URLs relativas via proxy Vite)');
console.log('🌍 DEV mode:', import.meta.env.DEV);

export const api = axios.create({
  baseURL: baseURL,
  withCredentials: true, // Essencial para enviar cookies (como o refresh token)
});


// --- Estado de Autenticação em Memória ---
let authState = {
  user: null,
  isAuthenticated: false,
  accessToken: null,
  _isInitialized: false,
};

// --- Funções Auxiliares ---
const listeners = new Set();

function notifyListeners() {
  listeners.forEach(listener => listener(authState));
}

function decodeJwtPayload(token) {
  try {
    if (typeof token !== 'string') {
      console.error("Token não é uma string:", typeof token, token);
      return null;
    }
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
  const wasAuthenticated = authState.isAuthenticated;

  if (accessToken && typeof accessToken === 'string') {
    const decodedUser = decodeJwtPayload(accessToken);
    if (decodedUser && decodedUser.exp * 1000 > Date.now()) {
      authState.user = decodedUser;
      authState.isAuthenticated = true;
      authState.accessToken = accessToken;
      api.defaults.headers.common['Authorization'] = `Bearer ${accessToken}`;
    } else {
      console.warn("Token expirado ou inválido");
      authState.user = null;
      authState.isAuthenticated = false;
      authState.accessToken = null;
      delete api.defaults.headers.common['Authorization'];
    }
  } else {
    authState.user = null;
    authState.isAuthenticated = false;
    authState.accessToken = null;
    delete api.defaults.headers.common['Authorization'];
  }

  if (wasAuthenticated !== authState.isAuthenticated) {
    notifyListeners();
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

export function initAxiosInterceptor({ onLogout, onTokenRefreshSuccess }) {
  api.interceptors.response.use(
    (response) => response,
    async (error) => {
      const originalRequest = error.config;

      if (originalRequest.url.includes('/api/auth/login') || originalRequest.url.includes('/api/auth/refresh')) {
        console.log('⏭️ [Interceptor] Pulando interceptor para:', originalRequest.url);
        return Promise.reject(error);
      }

      if (error.response?.status !== 401 || originalRequest._retry) {
        console.log('⏭️ [Interceptor] Status não é 401 ou request já foi retentado. Status:', error.response?.status, 'Retry:', originalRequest._retry);
        return Promise.reject(error);
      }

      console.log('🔄 [Interceptor] Recebido erro 401 para:', originalRequest.url, 'Tentando refresh...');

      if (isRefreshing) {
        console.log('⏳ [Interceptor] Já está fazendo refresh, aguardando fila...');
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then(token => {
            console.log('✅ [Interceptor] Token de fila recebido, retentando request');
            originalRequest.headers['Authorization'] = 'Bearer ' + token;
            return api(originalRequest);
          })
          .catch(err => {
            console.error('❌ [Interceptor] Erro na fila:', err);
            return Promise.reject(err);
          });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        console.log('🔄 [Interceptor] Fazendo POST /api/auth/refresh');
        const { data } = await api.post('/api/auth/refresh');
        console.log('✅ [Interceptor] Refresh bem-sucedido, novo token recebido');
        updateAuthState(data.accessToken);
        onTokenRefreshSuccess(data.accessToken);
        
        originalRequest.headers['Authorization'] = 'Bearer ' + data.accessToken;
        processQueue(null, data.accessToken);
        
        console.log('🔄 [Interceptor] Retentando request original:', originalRequest.url);
        return api(originalRequest);
      } catch (refreshError) {
        console.error('❌ [Interceptor] Erro no refresh:', refreshError.response?.status);
        processQueue(refreshError, null);
        onLogout();
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }
  );

  api.interceptors.request.use(config => {
      const hasCookie = document.cookie.length > 0;
      const authHeader = config.headers.Authorization ? '✅ Sim' : '❌ Não';
      
      console.log('📤 Request interceptor:', {
        url: config.url,
        withCredentials: config.withCredentials,
        cookies: hasCookie ? `${document.cookie.split(';').length} cookies` : 'nenhum cookie',
        authHeader: authHeader,
      });
      
      if (authState.accessToken) {
          config.headers.Authorization = `Bearer ${authState.accessToken}`;
          console.log('✅ Authorization header adicionado ao request');
      }
      return config;
  });

  return api;
}


// --- Serviço de Autenticação Exportado ---
export const auth = {
  subscribe(callback) {
    listeners.add(callback);
    return () => listeners.delete(callback);
  },

  async init() {
    try {
      // Sempre tenta fazer refresh. Se não houver cookie válido, o backend retorna 401/403
      // Cookies httpOnly não são acessíveis via JavaScript, então sempre tentamos
      console.log("🔄 [Init] Tentando refresh do token...");
      console.log("🔄 [Init] withCredentials:", api.defaults.withCredentials);
      
      try {
        const { data } = await api.post('/api/auth/refresh');
        console.log("✅ [Init] Token refreshed com sucesso durante init");
        console.log("✅ [Init] AccessToken recebido:", data.accessToken ? 'Sim' : 'Não');
        updateAuthState(data.accessToken);
      } catch (refreshError) {
        if (refreshError.response?.status === 401 || refreshError.response?.status === 403) {
          console.log("ℹ️ [Init] Nenhum refresh token válido encontrado. Usuário não autenticado.");
          console.log("ℹ️ [Init] Status do erro:", refreshError.response?.status);
          updateAuthState(null);
        } else {
          throw refreshError;
        }
      }
    } catch (error) {
      console.error("❌ [Init] Erro ao inicializar autenticação:", error);
      if (error.response) {
        console.error("❌ [Init] Status do erro:", error.response.status);
        console.error("❌ [Init] Dados do erro:", error.response.data);
      } else if (error.request) {
        console.error("❌ [Init] Nenhuma resposta recebida:", error.request);
      } else {
        console.error("❌ [Init] Erro de configuração da requisição:", error.message);
      }
      updateAuthState(null);
    } finally {
      authState._isInitialized = true;
      notifyListeners();
      console.log("✅ [Init] Autenticação inicializada, estado:", {
        isAuthenticated: authState.isAuthenticated,
        hasUser: !!authState.user,
        hasAccessToken: !!authState.accessToken,
      });
    }
  },

  isInitialized: () => authState._isInitialized,

  async _silentLogout() {
    try {
      await api.post('/api/auth/logout');
    } catch (error) {
      console.error("Erro no logout do servidor, mas o cliente será deslogado:", error);
    } finally {
      updateAuthState(null);
    }
  },

  async login(email, senha) {
    try {
      console.log("🔐 [Login] Tentando fazer login com email:", email);
      const { data } = await api.post('/api/auth/login', { email, senha });
      console.log('✅ [Login] Login bem-sucedido');
      console.log('✅ [Login] AccessToken recebido:', data.accessToken ? 'Sim' : 'Não');
      updateAuthState(data.accessToken);
      console.log('✅ [Login] Estado atualizado:', {
        isAuthenticated: authState.isAuthenticated,
        hasUser: !!authState.user,
        papel: authState.user?.papel,
      });
      return { user: authState.user, role: authState.user?.papel };
    } catch (error) {
      console.error('❌ [Login] Erro no login:', error.response?.data || error.message);
      throw error;
    }
  },

  async criarConta(nome, email, senha) {
    const { data } = await api.post('/api/criar-conta', { nome, email, senha });
    updateAuthState(data.accessToken);
    return { user: authState.user, role: authState.user?.papel }; // Retorna o usuário e o papel do estado atualizado
  },

  async logout() {
    await this._silentLogout();
    window.location.href = '/';
  },
  
  isAuthenticated: () => authState.isAuthenticated,
  getUser: () => authState.user,
  getPapel: () => authState.user?.papel,
  isAdmin: () => authState.user?.papel === 'admin',
  isLoggedInCliente: () => authState.user?.papel === 'usuario',

  hasActiveOrExpiredSubscription() {
      return this.isLoggedInCliente();
  },

  async getCurrentUser() {
    // Retorna o usuário atual do authState, útil para AuthContext
    return { user: authState.user, role: authState.user?.papel };
  },

  async getUserDetails() {
    const { data } = await api.get('/api/auth/user-details');
    return data;
  },

  async updateUserDetails(userData) {
    const { data } = await api.put('/api/auth/user-details', userData);
    return data;
  },

  async changePassword(senhaData) {
    const { data } = await api.put('/api/auth/change-password', senhaData);
    return data;
  },

  async alterarPlano(planoData) {
    const { data } = await api.post('/api/auth/alterar-plano', planoData);
    return data;
  }
};

// NÃO chamar auth.init() aqui - será chamado pelo AuthContext
// Exporta o objeto auth e a instância api para uso em outros módulos
// Não exportamos default api pois já o exportamos como named export e initAxiosInterceptor já retorna a instância configurada.
// Se App.jsx ou outro lugar precisar da instância de axios configurada, deve usar initAxiosInterceptor.
// Default export should be avoided if named exports are sufficient.