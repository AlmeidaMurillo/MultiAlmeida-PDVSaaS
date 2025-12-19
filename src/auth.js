import axios from "axios";

const baseURL = "https://multialmeida-pdvsaas-backend-production.up.railway.app";

export const api = axios.create({
  baseURL,
  withCredentials: true,
});

let authState = {
  user: null,
  token: null,
  isAuthenticated: false,
  initialized: false,
};

const listeners = new Set();
let initializingPromise = null;
let sessionCheckInterval = null;
let sessionCheckFailureCount = 0;
const MAX_SESSION_CHECK_FAILURES = 10;
let rateLimitBackoff = false;
let backoffUntil = 0;
function notify() {
  listeners.forEach((fn) => fn(authState));
}


function decodeToken(token) {
  try {
    return JSON.parse(atob(token.split(".")[1]));
  } catch {
    return null;
  }
}

function isTokenExpired(payload) {
  return !payload || payload.exp * 1000 < Date.now();
}

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

  authState.user = payload;
  authState.token = token;
  authState.isAuthenticated = true;
  
  api.defaults.headers.common["Authorization"] = `Bearer ${token}`;
  
  startSessionCheck();
  
  notify();
}

async function checkSessionActive() {
  try {
    const response = await api.get('/api/auth/has-refresh');
    rateLimitBackoff = false;
    backoffUntil = 0;
    return response.data.sessionActive === true;
  } catch (error) {
    console.warn('⚠️ Erro ao verificar sessão:', {
      status: error.response?.status,
      message: error.message
    });
    
    if (error.response?.status === 429) {
      console.warn('⚠️ Rate limit atingido. Pausando verificações por 15 minutos.');
      rateLimitBackoff = true;
      backoffUntil = Date.now() + (15 * 60 * 1000);
      return 'rate_limit';
    }
    
    if (error.response?.status >= 500 || !error.response) {
      console.warn('⚠️ Erro temporário de rede/servidor. Sessão mantida.');
      return 'temp_error';
    }
    
    if (error.response?.status === 401 || error.response?.status === 403) {
      console.warn('❌ Sessão invalidada pelo servidor.');
      return false;
    }
    
    console.warn('⚠️ Erro desconhecido. Sessão mantida.');
    return 'unknown_error';
  }
}

function startSessionCheck() {
  if (sessionCheckInterval) {
    clearInterval(sessionCheckInterval);
  }

  sessionCheckInterval = setInterval(async () => {
    if (!authState.isAuthenticated) {
      stopSessionCheck();
      return;
    }

    if (rateLimitBackoff && Date.now() < backoffUntil) {
      console.log('⏸️ Verificação pausada devido ao rate limit');
      return;
    }

    const isActive = await checkSessionActive();
    
    if (typeof isActive === 'string') {
      console.log(`⚠️ Verificação de sessão retornou: ${isActive} (não conta como falha)`);
      return;
    }
    
    if (isActive === false) {
      sessionCheckFailureCount++;
      console.warn(`⚠️ Falha na verificação de sessão (${sessionCheckFailureCount}/${MAX_SESSION_CHECK_FAILURES})`);
      
      if (sessionCheckFailureCount >= MAX_SESSION_CHECK_FAILURES) {
        console.error('❌ Limite de falhas atingido. Encerrando sessão.');
        
        stopSessionCheck();
        alert('⚠️ Sua sessão foi encerrada. Por favor, faça login novamente.');
        
        try {
          await api.post('/api/auth/logout');
        } catch (error) {
          console.error('Erro ao fazer logout no servidor:', error);
        }
        
        clearAuth();
        window.location.replace('/');
      }
    } else if (isActive === true) {
      if (sessionCheckFailureCount > 0) {
        console.log(`✅ Sessão verificada com sucesso. Resetando contador de falhas (era ${sessionCheckFailureCount})`);
        sessionCheckFailureCount = 0;
      }
    }
  }, 600000);
}

function stopSessionCheck() {
  if (sessionCheckInterval) {
    clearInterval(sessionCheckInterval);
    sessionCheckInterval = null;
  }
  sessionCheckFailureCount = 0;
  rateLimitBackoff = false;
  backoffUntil = 0;
}

function clearAuth() {
  stopSessionCheck();
  
  authState = {
    user: null,
    token: null,
    isAuthenticated: false,
    initialized: authState.initialized,
  };
  
  delete api.defaults.headers.common["Authorization"];
  
  try {
    localStorage.clear();
    
    sessionStorage.clear();
    
    document.cookie.split(";").forEach((c) => {
      document.cookie = c
        .replace(/^ +/, "")
        .replace(/=.*/, `=;expires=${new Date(0).toUTCString()};path=/`);
    });
    
    if (api.defaults.headers) {
      Object.keys(api.defaults.headers.common || {}).forEach(key => {
        delete api.defaults.headers.common[key];
      });
    }
  } catch (err) {
    console.error('Erro ao limpar rastros:', err);
  }
  
  notify();
}

let refreshing = false;
let requestQueue = [];

function processQueue(error, token = null) {
  requestQueue.forEach((p) => (error ? p.reject(error) : p.resolve(token)));
  requestQueue = [];
}

export function setupInterceptors() {
  api.interceptors.response.use(
    (response) => response,
    async (error) => {
      const originalRequest = error.config;
      
      if (
        originalRequest.url?.includes("/auth/login") ||
        originalRequest.url?.includes("/auth/refresh") ||
        originalRequest._retry ||
        error.response?.status !== 401
      ) {
        return Promise.reject(error);
      }

      originalRequest._retry = true;

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

  api.interceptors.request.use((config) => {
    if (authState.token) {
      config.headers.Authorization = `Bearer ${authState.token}`;
    }
    return config;
  });
}

export const auth = {
  subscribe(callback) {
    listeners.add(callback);
    return () => listeners.delete(callback);
  },

  async init() {
    if (initializingPromise) {
      console.log('🔄 Inicialização já em andamento, aguardando...');
      return initializingPromise;
    }

    if (authState.initialized) {
      return;
    }
    
    
    initializingPromise = (async () => {
      try {
        const { data: check } = await api.get("/api/auth/has-refresh");
        
        if (check.hasRefresh && check.sessionActive) {
          const { data } = await api.post("/api/auth/refresh");
          setAuth(data.accessToken);
        } else {
          clearAuth();
        }
      } catch (error) {
        console.error('❌ Erro ao inicializar auth:', {
          status: error.response?.status,
          message: error.message,
          url: error.config?.url
        });
        
        if (error.response?.status === 429) {
          console.warn('⚠️ Rate limit temporário. Aguarde alguns minutos.');
          authState.initialized = true;
        } else {
          clearAuth();
        }
      } finally {
        authState.initialized = true;
        initializingPromise = null;
        notify();
      }
    })();

    return initializingPromise;
  },

  async login(email, senha) {
    const { data } = await api.post("/api/auth/login", { email, senha });
    setAuth(data.accessToken);
    return authState.user;
  },

  async criarConta(nome, email, senha) {
    const { data } = await api.post("/api/criar-conta", { nome, email, senha });
    setAuth(data.accessToken);
    return authState.user;
  },

  async logout() {
    try {
      await api.post("/api/auth/logout");
    } catch (error) {
      console.error('Erro ao fazer logout no servidor:', error);
    } finally {
      clearAuth();
      
      await new Promise(resolve => setTimeout(resolve, 100));
      
      window.location.replace("/");
    }
  },

  isAuthenticated: () => authState.isAuthenticated,
  isInitialized: () => authState.initialized,
  getUser: () => authState.user,
  getRole: () => authState.user?.papel,
  isAdmin: () => authState.user?.papel === "admin",
  isCliente: () => authState.user?.papel === "usuario",

  getUserDetails: () => api.get("/api/auth/user-details").then((r) => r.data),
  updateUserDetails: (data) => api.put("/api/auth/user-details", data).then((r) => r.data),
  changePassword: (data) => api.put("/api/auth/change-password", data).then((r) => r.data),
  alterarPlano: (data) => api.post("/api/auth/alterar-plano", data).then((r) => r.data),
  
  api,
};
