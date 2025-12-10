import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../context/useAuthHook'; 
import Spinner from '../Spinner/Spinner'; // Importa o componente Spinner

const ProtectedRoute = ({ children, roles }) => {
  const { isAuthenticated, userRole, loading } = useAuth();

  if (loading) {
    return <Spinner />; 
  }

  if (!isAuthenticated) {
    // Usuário não autenticado, redireciona para a página de login
    return <Navigate to="/login" replace />;
  }

  if (roles && roles.length > 0 && !roles.includes(userRole)) {
    // Usuário autenticado, mas sem o papel necessário
    // Redireciona para uma página de "acesso negado" ou dashboard padrão
    // Por enquanto, redireciona para a home, mas uma página 403 seria melhor
    return <Navigate to="/" replace />; 
  }

  return children;
};

export default ProtectedRoute;
