import axios from "axios";

/* ============================================
 * AUTH.JS - Sistema de Autenticação Seguro
 * ============================================
 * 
 * 🔒 SEGURANÇA:
 * - Access Token: Armazenado APENAS em memória (não localStorage)
 * - Refresh Token: Armazenado em cookie httpOnly (gerenciado pelo backend)
 * - Proteção contra XSS: Tokens não acessíveis via JavaScript
 * - Proteção contra CSRF: SameSite cookies + withCredentials
 * 
 * ============================================ */

// ============================================
// 1. CONFIGURAÇÃO DA API
// ============================================

const isDev = import.meta.env.DEV;
const baseURL = import.meta.env.VITE_API_URL || 
  (isDev ? "" : "https://multialmeida-pdvsaas-backend-production.up.railway.app");

export const api = axios.create({
  baseURL,
  withCredentials: true, // IMPORTANTE: Cookies httpOnly para tokens seguros
});

// ============================================
// 2. ESTADO DE AUTENTICAÇÃO (EM MEMÓRIA)
// ============================================
// Tokens são armazenados APENAS em memória e cookies httpOnly
// NUNCA em localStorage (vulnerável a XSS)

let authState = {
  user: null,
  token: null,
  isAuthenticated: false,
  initialized: false,
};

const listeners = new Set();
let initializingPromise = null; // Evita múltiplas chamadas simultâneas de init()

// Notifica todos os subscribers sobre mudanças no estado
function notify() {
  listeners.forEach((fn) => fn(authState));
}

// ============================================
// 3. FUNÇÕES AUXILIARES
// ============================================

// Decodifica JWT payload
function decodeToken(token) {
  try {
    return JSON.parse(atob(token.split(".")[1]));
  } catch {
    return null;
  }
}

// Verifica se token está expirado
function isTokenExpired(payload) {
  return !payload || payload.exp * 1000 < Date.now();
}

// Atualiza o estado de autenticação
function setAuth(token) {
  if (!token) {
    clearAuth();
    return;
  }

  const payload = decodeToken(token);
  if (isTokenExpired(payload)) {
    clearAuth();
    return;
  }

  // Armazena apenas em memória (não em localStorage)
  authState.user = payload;
  authState.token = token;
  authState.isAuthenticated = true;
  
  // Define header Authorization para todas as requisições
  api.defaults.headers.common["Authorization"] = `Bearer ${token}`;
  
  notify();
}

// Limpa o estado de autenticação
function clearAuth() {
  authState = {
    user: null,
    token: null,
    isAuthenticated: false,
    initialized: authState.initialized,
  };
  
  // Remove header Authorization
  delete api.defaults.headers.common["Authorization"];
  
  notify();
}

// ============================================
// 4. INTERCEPTOR DE REFRESH TOKEN
// ============================================

let refreshing = false;
let requestQueue = [];

function processQueue(error, token = null) {
  requestQueue.forEach((p) => (error ? p.reject(error) : p.resolve(token)));
  requestQueue = [];
}

// Configura interceptores do Axios
export function setupInterceptors() {
  // Interceptor de resposta para tratar 401 e fazer refresh
  api.interceptors.response.use(
    (response) => response,
    async (error) => {
      const originalRequest = error.config;
      
      // Não tenta refresh em rotas de autenticação ou se já tentou
      if (
        originalRequest.url?.includes("/auth/login") ||
        originalRequest.url?.includes("/auth/refresh") ||
        originalRequest._retry ||
        error.response?.status !== 401
      ) {
        return Promise.reject(error);
      }

      originalRequest._retry = true;

      // Se já está fazendo refresh, adiciona à fila
      if (refreshing) {
        return new Promise((resolve, reject) => {
          requestQueue.push({ resolve, reject });
        }).then((token) => {
          originalRequest.headers.Authorization = `Bearer ${token}`;
          return api(originalRequest);
        });
      }

      refreshing = true;

      try {
        const { data } = await api.post("/api/auth/refresh");
        setAuth(data.accessToken);
        processQueue(null, data.accessToken);
        
        originalRequest.headers.Authorization = `Bearer ${data.accessToken}`;
        return api(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError, null);
        clearAuth();
        window.location.href = "/login";
        return Promise.reject(refreshError);
      } finally {
        refreshing = false;
      }
    }
  );

  // Interceptor de requisição para adicionar token
  api.interceptors.request.use((config) => {
    if (authState.token) {
      config.headers.Authorization = `Bearer ${authState.token}`;
    }
    return config;
  });
}

// ============================================
// 5. API DE AUTENTICAÇÃO
// ============================================

export const auth = {
  // Sistema de subscribers para mudanças no estado
  subscribe(callback) {
    listeners.add(callback);
    return () => listeners.delete(callback);
  },

  // Inicializa autenticação usando apenas cookies httpOnly
  async init() {
    // Se já está inicializando, retorna a promise existente (evita chamadas duplicadas)
    if (initializingPromise) {
      return initializingPromise;
    }

    // Se já foi inicializado, não faz nada
    if (authState.initialized) {
      return;
    }
    
    initializingPromise = (async () => {
      try {
        const { data: check } = await api.get("/api/auth/has-refresh");
        
        if (check.hasRefresh) {
          const { data } = await api.post("/api/auth/refresh");
          setAuth(data.accessToken);
        } else {
          clearAuth();
        }
      } catch (error) {
        console.error('Erro na inicialização da autenticação:', error.message);
        clearAuth();
      } finally {
        authState.initialized = true;
        initializingPromise = null;
        notify();
      }
    })();

    return initializingPromise;
  },

  // Login
  async login(email, senha) {
    const { data } = await api.post("/api/auth/login", { email, senha });
    setAuth(data.accessToken);
    return authState.user;
  },

  // Criar conta
  async criarConta(nome, email, senha) {
    const { data } = await api.post("/api/criar-conta", { nome, email, senha });
    setAuth(data.accessToken);
    return authState.user;
  },

  // Logout
  async logout() {
    try {
      await api.post("/api/auth/logout");
    } finally {
      clearAuth();
      window.location.href = "/";
    }
  },

  // Getters
  isAuthenticated: () => authState.isAuthenticated,
  isInitialized: () => authState.initialized,
  getUser: () => authState.user,
  getRole: () => authState.user?.papel,
  isAdmin: () => authState.user?.papel === "admin",
  isCliente: () => authState.user?.papel === "usuario",

  // APIs de usuário
  getUserDetails: () => api.get("/api/auth/user-details").then((r) => r.data),
  updateUserDetails: (data) => api.put("/api/auth/user-details", data).then((r) => r.data),
  changePassword: (data) => api.put("/api/auth/change-password", data).then((r) => r.data),
  alterarPlano: (data) => api.post("/api/auth/alterar-plano", data).then((r) => r.data),
};
