import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:5000",
  withCredentials: true,
});

// Interceptor para adicionar o token JWT em cada requisição
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("jwt_token");
    if (token) {
      config.headers["Authorization"] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

let authState = {
  isAdmin: false,
  isCliente: false,
  isSubscriptionActive: false,
  userType: null, // 'admin' or 'usuario'
};

export const auth = {
  update: async () => {
    const token = localStorage.getItem("jwt_token");
    const userType = localStorage.getItem("user_type");
    if (!token) {
      authState = {
        isAdmin: false,
        isCliente: false,
        isSubscriptionActive: false,
        userType: null,
      };
      return;
    }

    try {
      let isAdmin = false;
      let isCliente = false;
      let isSubscriptionActive = false;

      // Only check admin status if user is admin
      if (userType === 'admin') {
        try {
          const adminRes = await api.get("/api/admin/auth/status");
          isAdmin = adminRes.data.isAuthenticated ?? false;
        } catch (adminErr) {
          // 401 is expected for non-admin users, don't log as error
          if (adminErr.response?.status !== 401) {
            console.error("Erro ao verificar status admin:", adminErr);
          }
          isAdmin = false;
        }
      }

      // Check client status if user is usuario
      if (userType === 'usuario') {
        const clienteRes = await api.get("/api/auth/status");
        isCliente = clienteRes.data.isAuthenticated ?? false;
        isSubscriptionActive = clienteRes.data.isSubscriptionActive ?? false;
      }

      authState.isAdmin = isAdmin;
      authState.isCliente = isCliente;
      authState.isSubscriptionActive = isSubscriptionActive;
      authState.userType = userType;
    } catch (err) {
      console.error("Erro ao atualizar autenticação:", err);
      authState = {
        isAdmin: false,
        isCliente: false,
        isSubscriptionActive: false,
        userType: null,
      };
    }
  },

  isAdmin: () => authState.isAdmin,

  isCliente: () => authState.isCliente && authState.isSubscriptionActive,

  isLoggedInCliente: () => authState.isCliente,

  loginAdmin: async (email, senha) => {
    const res = await api.post("/api/admin/login", { email, senha });
    if (!res.data.user) throw new Error("Erro no login admin");
    if (res.data.token) {
      localStorage.setItem("jwt_token", res.data.token);
      localStorage.setItem("user_type", "admin");
    }
    await auth.update();
    return res.data;
  },

  loginUsuario: async (email, senha) => {
    const res = await api.post("/api/login", { email, senha });
    if (res.data.token) {
      localStorage.setItem("jwt_token", res.data.token);
      localStorage.setItem("user_type", "usuario");
    }
    localStorage.removeItem("empresas");
    localStorage.removeItem("empresaAtual");
    await auth.update();
    return res.data;
  },

  criarConta: async (nome, email, senha) => {
    const res = await api.post("/api/criar-conta", { nome, email, senha });
    if (res.data.token) {
      localStorage.setItem("jwt_token", res.data.token);
      localStorage.setItem("user_type", "usuario");
    }
    await auth.update();
    return res.data;
  },

  logout: async () => {
    try {
      await api.post("/api/logout");
    } catch (err) {
      console.error("Erro ao logout:", err);
    }
    localStorage.removeItem("jwt_token"); // Limpa o token
    localStorage.removeItem("user_type");
    localStorage.removeItem("empresas");
    localStorage.removeItem("empresaAtual");
    authState = {
      isAdmin: false,
      isCliente: false,
      isSubscriptionActive: false,
      userType: null,
    };
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
