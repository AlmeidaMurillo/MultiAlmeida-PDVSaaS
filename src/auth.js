
import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "https://multialmeida-pdvsaas-backend-production.up.railway.app",
  withCredentials: true, 
});

// Estado de autenticação em memória, inicializado com o token do sessionStorage se existir
let authState = {
  isAdmin: false,
  isCliente: false,
  isSubscriptionActive: false,
  isSubscriptionExpired: false, // Adicionado
  hasActiveOrExpiredSubscription: false, // Adicionado
  hasAnySubscription: false,
  userType: null,
  token: sessionStorage.getItem("jwt_token") || null,
};

// Interceptor para adicionar o token de autorização a cada requisição
api.interceptors.request.use(
  (config) => {
    if (authState.token) {
      config.headers.Authorization = `Bearer ${authState.token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);


export const auth = {
  getTokens: async () => {
    try {
      const res = await api.get("/api/tokens");
      return res.data.sessions || [];
    } catch (err) {
      console.error("Erro ao buscar tokens:", err);
      return [];
    }
  },

  createToken: async () => {
    try {
      const res = await api.post("/api/tokens");
      if (res.data.token) {
        authState.token = res.data.token;
        sessionStorage.setItem("jwt_token", res.data.token);
      }
      return res.data.token || null;
    } catch (err) {
      console.error("Erro ao criar token:", err);
      return null;
    }
  },

  update: async () => {
    try {
      if (!authState.token) {
        auth.clearSession();
        return;
      }
      
      const res = await api.get("/api/auth/status");
      const { 
        isAuthenticated, 
        isSubscriptionActive,
        isSubscriptionExpired, // Adicionado
        hasAnySubscription, 
        papel 
      } = res.data;

      if (!isAuthenticated) {
        auth.clearSession();
        return;
      }

      authState.isAdmin = papel === 'admin';
      authState.isCliente = papel === 'usuario';
      authState.isSubscriptionActive = isSubscriptionActive ?? false;
      authState.isSubscriptionExpired = isSubscriptionExpired ?? false; // Adicionado
      authState.hasAnySubscription = hasAnySubscription ?? false;
      authState.userType = papel;
      // Adicionado
      authState.hasActiveOrExpiredSubscription = (isSubscriptionActive || isSubscriptionExpired) ?? false;

    } catch (err) {
      if (err.response?.status === 401) {
        console.log("Sessão inválida ou expirada, limpando sessão local.");
        auth.clearSession();
      } else {
        console.error("Erro ao atualizar autenticação:", err);
        auth.clearSession();
      }
    }
  },

  clearSession: () => {
    sessionStorage.removeItem("jwt_token");
    authState = {
      isAdmin: false,
      isCliente: false,
      isSubscriptionActive: false,
      isSubscriptionExpired: false, // Adicionado
      hasActiveOrExpiredSubscription: false, // Adicionado
      hasAnySubscription: false,
      userType: null,
      token: null,
    };
    console.log("Sessão local limpa.");
  },

  isAdmin: () => authState.isAdmin,

  hasActiveOrExpiredSubscription: () => authState.hasActiveOrExpiredSubscription, // Adicionado

  isLoggedInCliente: () => authState.isCliente,

  getPapel: () => authState.userType,

  login: async (email, senha) => {
    // Se um usuário já estiver logado, invalida a sessão antiga no backend primeiro.
    if (authState.token) {
      try {
        await api.post("/api/logout");
      } catch (err) {
        console.error("Falha ao deslogar sessão anterior antes de novo login:", err);
      }
    }
    
    // Limpa o estado do frontend para preparar para a nova sessão.
    auth.clearSession();
    
    // Prossegue com a tentativa de login.
    const res = await api.post("/api/login", { email, senha });
    if (!res.data.user) throw new Error("Erro no login");

    // Armazena o novo estado de autenticação.
    authState.token = res.data.token;
    sessionStorage.setItem("jwt_token", res.data.token);
    await auth.update();

    return res.data;
  },

  criarConta: async (nome, email, senha) => {
    // Se um usuário já estiver logado, invalida a sessão antiga no backend primeiro.
    if (authState.token) {
      try {
        await api.post("/api/logout");
      } catch (err) {
        console.error("Falha ao deslogar sessão anterior antes de criar nova conta:", err);
      }
    }

    // Limpa o estado do frontend para preparar para a nova sessão.
    auth.clearSession();
    
    // Prossegue com a tentativa de criar a conta.
    const res = await api.post("/api/criar-conta", { nome, email, senha });
    if (!res.data.user) throw new Error("Erro ao criar conta");

    // Armazena o novo estado de autenticação.
    authState.token = res.data.token;
    sessionStorage.setItem("jwt_token", res.data.token);
    await auth.update();

    return res.data;
  },

  logout: async () => {
    try {
      await api.post("/api/logout");
    } catch (err) {
      console.error("Erro ao fazer logout na API:", err);
    }
    auth.clearSession();
    window.location.href = "/";
  },

  getUserDetails: async () => {
    try {
      const res = await api.get("/api/auth/user-details");
      return res.data;
    } catch (err) {
      console.error("Erro ao buscar detalhes do usuário:", err);
      throw err;
    }
  },
};

export const axiosInstance = api;
export default api;

window.addEventListener('beforeunload', () => {
  const token = sessionStorage.getItem("jwt_token");
  if (token) {
    const data = JSON.stringify({ onClose: true });
    // Use sendBeacon for more reliable data transmission during page unload
    navigator.sendBeacon(`${api.defaults.baseURL}/api/logout`, data);
  }
});
