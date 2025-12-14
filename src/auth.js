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

// Sempre usa a URL do Railway (em desenvolvimento e produção)
const baseURL = import.meta.env.VITE_API_URL || "https://multialmeida-pdvsaas-backend-production.up.railway.app";

console.log('🌐 Configuração da API:', {
  baseURL,
  withCredentials: true
});

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
let sessionCheckInterval = null; // Intervalo de verificação de sessão
let sessionCheckFailureCount = 0; // Contador de falhas consecutivas
const MAX_SESSION_CHECK_FAILURES = 5; // Número de falhas antes de deslogar (tolerante)
let rateLimitBackoff = false; // Flag para pausar verificações temporárias em caso de rate limit
let backoffUntil = 0; // Timestamp até quando deve esperar em caso de backoff

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
  
  // Inicia verificação periódica de sessão (a cada 5 minutos)
  // Sistema inteligente com backoff automático em caso de rate limit
  startSessionCheck();
  
  notify();
}

// Verifica se a sessão ainda está ativa no servidor
async function checkSessionActive() {
  try {
    const response = await api.get('/api/auth/has-refresh');
    // Reset backoff se requisição foi bem sucedida
    rateLimitBackoff = false;
    backoffUntil = 0;
    return response.data.sessionActive === true;
  } catch (error) {
    // Se erro for rate limit (429), ativa backoff por 10 minutos
    if (error.response?.status === 429) {
      rateLimitBackoff = true;
      backoffUntil = Date.now() + (10 * 60 * 1000);
      return 'rate_limit';
    }
    
    // Se erro for de rede ou servidor temporário, não desloga
    if (error.response?.status >= 500 || !error.response) {
      return 'temp_error';
    }
    
    // Se erro for 401/403, sessão foi realmente invalidada
    if (error.response?.status === 401 || error.response?.status === 403) {
      return false;
    }
    
    return 'unknown_error';
  }
}

// Inicia verificação periódica de sessão (a cada 5 minutos)
function startSessionCheck() {
  // Limpa intervalo anterior se existir
  if (sessionCheckInterval) {
    clearInterval(sessionCheckInterval);
  }

  // Verifica a cada 5 minutos (300 segundos)
  // Isso resulta em apenas 3 requisições por janela de 15 min (3% do limite de 100)
  sessionCheckInterval = setInterval(async () => {
    // Só verifica se estiver autenticado
    if (!authState.isAuthenticated) {
      stopSessionCheck();
      return;
    }

    // Se estiver em backoff por rate limit, pula esta verificação
    if (rateLimitBackoff && Date.now() < backoffUntil) {
      return;
    }

    const isActive = await checkSessionActive();
    
    // Se retornou string (rate_limit, temp_error, unknown_error), não conta como falha
    if (typeof isActive === 'string') {
      return; // Não incrementa contador de falhas
    }
    
    // Se retornou false, é uma falha real
    if (isActive === false) {
      sessionCheckFailureCount++;
      
      // Só desloga após múltiplas falhas consecutivas (5 falhas)
      if (sessionCheckFailureCount >= MAX_SESSION_CHECK_FAILURES) {
        
        // Sessão foi invalidada (login em outro dispositivo ou expirada)
        stopSessionCheck();
        alert('⚠️ Sua sessão foi encerrada porque você fez login em outro dispositivo.');
        
        try {
          await api.post('/api/auth/logout');
        } catch (error) {
          console.error('Erro ao fazer logout no servidor:', error);
          // Ignora erro ao limpar token
        }
        
        clearAuth();
        window.location.replace('/');
      }
    } else if (isActive === true) {
      // Reseta contador de falhas se verificação foi bem-sucedida
      if (sessionCheckFailureCount > 0) {
        sessionCheckFailureCount = 0;
      }
    }
  }, 300000); // 5 minutos (300 segundos) - apenas 3 requisições por janela de 15min
}

// Para a verificação periódica
function stopSessionCheck() {
  if (sessionCheckInterval) {
    clearInterval(sessionCheckInterval);
    sessionCheckInterval = null;
  }
  sessionCheckFailureCount = 0; // Reseta contador
  rateLimitBackoff = false; // Reseta backoff
  backoffUntil = 0; // Reseta timestamp
}

// Limpa o estado de autenticação e TODOS os rastros
function clearAuth() {
  // Para verificação de sessão (se estiver rodando)
  stopSessionCheck();
  
  authState = {
    user: null,
    token: null,
    isAuthenticated: false,
    initialized: authState.initialized,
  };
  
  // Remove header Authorization
  delete api.defaults.headers.common["Authorization"];
  
  // 🧹 LIMPEZA COMPLETA - Remove TODOS os rastros
  try {
    // Limpa localStorage completamente
    localStorage.clear();
    
    // Limpa sessionStorage
    sessionStorage.clear();
    
    // Tenta limpar cookies via JavaScript (mesmo httpOnly cookies)
    document.cookie.split(";").forEach((c) => {
      document.cookie = c
        .replace(/^ +/, "")
        .replace(/=.*/, `=;expires=${new Date(0).toUTCString()};path=/`);
    });
    
    // Limpa cache do axios
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
      console.log('🔄 Inicialização já em andamento, aguardando...');
      return initializingPromise;
    }

    // Se já foi inicializado, não faz nada
    if (authState.initialized) {
      console.log('✅ Auth já inicializado');
      return;
    }
    
    console.log('🚀 Iniciando autenticação...');
    
    initializingPromise = (async () => {
      try {
        console.log('🔍 Verificando refresh token no servidor...');
        const { data: check } = await api.get("/api/auth/has-refresh");
        console.log('📋 Resultado da verificação:', check);
        console.log('📋 Detalhes:', {
          hasRefresh: check.hasRefresh,
          sessionActive: check.sessionActive,
          typeof_hasRefresh: typeof check.hasRefresh,
          typeof_sessionActive: typeof check.sessionActive
        });
        
        if (check.hasRefresh && check.sessionActive) {
          console.log('✅ Sessão válida encontrada, renovando access token...');
          const { data } = await api.post("/api/auth/refresh");
          setAuth(data.accessToken);
          console.log('✅ Auth inicializado com sucesso');
        } else {
          console.log('❌ Nenhuma sessão válida encontrada');
          console.log('❌ Motivo:', {
            hasRefresh: check.hasRefresh,
            sessionActive: check.sessionActive
          });
          clearAuth();
        }
      } catch (error) {
        console.error('❌ Erro ao inicializar auth:', {
          status: error.response?.status,
          message: error.message,
          url: error.config?.url
        });
        
        // Se for erro 429, não desloga - marca como inicializado e continua
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
        console.log('🏁 Inicialização finalizada');
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

  // Logout com limpeza TOTAL
  async logout() {
    try {
      // Chama o backend para desativar a sessão e limpar cookie
      await api.post("/api/auth/logout");
    } catch (error) {
      console.error('Erro ao fazer logout no servidor:', error);
      // Continua com a limpeza local mesmo se o servidor falhar
    } finally {
      // Limpa TUDO localmente
      clearAuth();
      
      // Aguarda um momento para garantir limpeza
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Redireciona para home forçando reload completo
      window.location.replace("/");
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
  
  // Exporta API para uso externo
  api,
};
