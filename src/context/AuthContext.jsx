import { useState, useEffect } from 'react';

import { 
  auth, // Importa o objeto auth que contém login, logout, etc.
  initAxiosInterceptor, // Importa a função de inicialização do interceptor
  api as configuredApi // Importa a instância do axios configurada
} from '../auth'; 

import { AuthContext } from './AuthContextSetup'; // Importar o contexto
import Spinner from '../Components/Spinner/Spinner'; // Adicionar esta linha

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const [loading, setLoading] = useState(true);

  // Função para carregar usuário atual
  const loadCurrentUser = async () => {
    try {
      const currentUser = await auth.getCurrentUser();
      setUser(currentUser.user);
      setUserRole(currentUser.role);
    } catch (error) {
      console.error("Erro ao carregar usuário atual:", error);
      setUser(null);
      setUserRole(null);
    }
  };

  useEffect(() => {
    // Aguarda a inicialização do auth antes de carregar o usuário
    const initializeAuth = async () => {
      try {
        console.log("Iniciando autenticação...");
        
        // Configura o interceptor PRIMEIRO, antes de qualquer requisição
        initAxiosInterceptor({ 
          onLogout: () => {
            console.log("🚪 Logout disparado pelo interceptor");
            setUser(null);
            setUserRole(null);
          },
          onTokenRefreshSuccess: () => {
            console.log("✅ Token refreshed successfully.");
          },
        });
        
        // DEPOIS tenta fazer refresh do token
        await auth.init(); 
        console.log("Auth inicializado, carregando usuário...");
        await loadCurrentUser(); 
      } catch (error) {
        console.error("Erro ao inicializar autenticação:", error);
      } finally {
        setLoading(false);
      }
    };

    initializeAuth();
  }, []);

  const login = async (emailOrCredentials, senha) => {
    setLoading(true);
    try {
      // Suporta tanto login(credentials) quanto login(email, senha)
      let email, password;
      
      if (typeof emailOrCredentials === 'object') {
        email = emailOrCredentials.email;
        password = emailOrCredentials.senha || emailOrCredentials.password;
      } else {
        email = emailOrCredentials;
        password = senha;
      }

      const response = await auth.login(email, password);
      setUser(response.user);
      setUserRole(response.role);
      setLoading(false);
      return response;
    } catch (error) {
      setLoading(false);
      throw error;
    }
  };

  const logout = async () => {
    setLoading(true);
    try {
      await auth.logout(); // Usar auth.logout
      setUser(null);
      setUserRole(null);
    } catch (error) {
      console.error("Erro ao fazer logout:", error);
    } finally {
      setLoading(false);
    }
  };

  // Funções de API que são diretamente passadas do auth.js
  const userApi = {
    getUserDetails: auth.getUserDetails, // Usar auth.getUserDetails
    updateUserDetails: auth.updateUserDetails, // Usar auth.updateUserDetails
    changePassword: auth.changePassword, // Usar auth.changePassword
    alterarPlano: auth.alterarPlano, // Usar auth.alterarPlano
  };

  const value = {
    user,
    userRole,
    loading,
    isAuthenticated: !!user, // Adicionar isAuthenticated
    login,
    logout,
    api: configuredApi, // Usar a instância do axios configurada importada
    ...userApi, // Adiciona as funções de API específicas do usuário
  };

  return (
    <AuthContext.Provider value={value}>
      {loading ? <Spinner /> : children}
    </AuthContext.Provider>
  );
};
