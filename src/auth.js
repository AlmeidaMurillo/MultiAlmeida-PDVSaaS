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
  accessToken: null,
  _isInitialized: false, // Adicionar esta flag
};

// --- Funções Auxiliares ---

const listeners = new Set();

function notifyListeners() {
  // Notifica todos os componentes inscritos sobre a mudança de estado
  listeners.forEach(listener => listener(authState));
}

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
  const wasAuthenticated = authState.isAuthenticated;

  if (accessToken) {
    const decodedUser = decodeJwtPayload(accessToken);
    // Verifica se o token é válido e não expirado
    if (decodedUser && decodedUser.exp * 1000 > Date.now()) {
      authState.user = decodedUser;
      authState.isAuthenticated = true;
      authState.accessToken = accessToken;
      api.defaults.headers.common['Authorization'] = `Bearer ${accessToken}`;
    } else {
      // Se o token for inválido ou expirado, trata como deslogado
      authState.user = null;
      authState.isAuthenticated = false;
      authState.accessToken = null;
      delete api.defaults.headers.common['Authorization'];
    }
  } else {
    // Se nenhum token for fornecido, trata como deslogado
    authState.user = null;
    authState.isAuthenticated = false;
    authState.accessToken = null;
    delete api.defaults.headers.common['Authorization'];
  }

  // Notifica os listeners se o estado de autenticação mudou
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

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Correção: Não interceptar erros em rotas de autenticação sensíveis
    if (originalRequest.url.includes('/api/auth/login') || originalRequest.url.includes('/api/auth/refresh')) {
      return Promise.reject(error);
    }

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
  subscribe(callback) {
    listeners.add(callback);
    // Oferece uma função para cancelar a inscrição
    return () => listeners.delete(callback);
  },

  async init() {
    try {
      const { data } = await api.post('/api/auth/refresh');
      updateAuthState(data.accessToken);
    } catch (error) {
      console.log("Nenhuma sessão ativa encontrada:", error);
      // Garante que o estado seja limpo se o refresh falhar
      updateAuthState(null);
    } finally {
      authState._isInitialized = true;
      // Notifica os listeners que a inicialização terminou
      notifyListeners();
    }
  },

  // Getter para o estado de inicialização
  isInitialized: () => authState._isInitialized,

  // Função interna para limpar a sessão sem redirecionar
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
    // Realiza o login e atualiza o estado
    const { data } = await api.post('/api/auth/login', { email, senha });
    updateAuthState(data.accessToken);
    return authState.user; // Retorna o usuário do estado atualizado
  },

  async criarConta(nome, email, senha) {
    const { data } = await api.post('/api/criar-conta', { nome, email, senha });
    updateAuthState(data.accessToken);
    return authState.user; // Retorna o usuário do estado atualizado
  },

  async logout() {
    await this._silentLogout();
    // Opcional: Redirecionar após o estado ser atualizado e os listeners notificados
    window.location.href = '/';
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

// Inicializa o estado de autenticação ao carregar o módulo
auth.init();

export default api;
