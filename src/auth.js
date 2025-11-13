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
};

export const auth = {
  update: async () => {
    const token = localStorage.getItem("jwt_token");
    if (!token) {
      authState = {
        isAdmin: false,
        isCliente: false,
        isSubscriptionActive: false,
      };
      return;
    }

    try {
      const adminRes = await api.get("/api/admin/auth/status");
      const clienteRes = await api.get("/api/auth/status");

      authState.isAdmin = adminRes.data.isAuthenticated ?? false;
      authState.isCliente = clienteRes.data.isAuthenticated ?? false;
      authState.isSubscriptionActive =
        clienteRes.data.isSubscriptionActive ?? false;
    } catch (err) {
      console.error("Erro ao atualizar autenticação:", err);
      authState = {
        isAdmin: false,
        isCliente: false,
        isSubscriptionActive: false,
      };
    }
  },

  isAdmin: () => authState.isAdmin,

  isCliente: () => authState.isCliente && authState.isSubscriptionActive,

  loginAdmin: async (email, senha) => {
    const res = await api.post("/api/admin/login", { email, senha });
    if (!res.data.user) throw new Error("Erro no login admin");
    if (res.data.token) {
      localStorage.setItem("jwt_token", res.data.token);
    }
    await auth.update();
    return res.data;
  },

  loginUsuario: async (email, senha) => {
    const res = await api.post("/api/login", { email, senha });
    if (res.data.token) {
      localStorage.setItem("jwt_token", res.data.token);
    }
    localStorage.removeItem("empresas");
    localStorage.removeItem("empresaAtual");
    await auth.update();
    return res.data;
  },

  criarConta: async (nome, email, senha) => {
    const res = await api.post("/api/criar-conta", { nome, email, senha });
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
    localStorage.removeItem("empresas");
    localStorage.removeItem("empresaAtual");
    authState = {
      isAdmin: false,
      isCliente: false,
      isSubscriptionActive: false,
    };
    window.location.href = "/login";
  },
};

export const axiosInstance = api;
export default api;
