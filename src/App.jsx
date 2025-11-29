import { Suspense, lazy, useEffect, useState } from "react";
import { Routes, Route, Navigate, useLocation } from "react-router-dom";
import ScrollToTop from "./Components/Scroll/ScrollToTop";
import { auth } from "./auth";
import Spinner from "./Components/Spinner/Spinner";

/* FAZER FUNCIONAR A CRIAÇÃO DE PLANOS NO SISTEMA DE ADMIN, 
ARRUMAR AS BARRA DE ROLAGENS DUPLICADAS VER O PORQUE AS VEZES NAO ESTA APARECENDO A BARRA DE ROLAGEM DA SIDEBAR E 
ARRUMAR A RESPONSIVIDADE DAS TELAS DE ADMIN E CLIENTE.

FAZER UMA TELA DE PAGAMENTO RECUSADO OU CANCELADO PARA QUANDO UM PAGAMENTO FOR RECUSADO PELO SISTEMA DE PAGAMENTO OU ALGO ASSIM..

*/

// Lazy loading das páginas
const LandingPage = lazy(() => import("./screens/Clients/LandingPage"));
const Registro = lazy(() => import("./screens/Clients/Registro"));
const Login = lazy(() => import("./screens/Clients/Login"));
const CarrinhoCompras = lazy(() => import("./screens/Clients/CarrinhoCompras"));
const DashboardAdmin = lazy(() => import("./screens/Admins/DashboardAdmin"));
const EmpresasAdmin = lazy(() => import("./screens/Admins/EmpresasAdmin"));
const PlanosAdmin = lazy(() => import("./screens/Admins/PlanosAdmin"));
const Payment = lazy(() => import("./screens/Clients/Payment"));
const PaymentSuccess = lazy(() => import("./screens/Clients/PaymentSuccess"));
const DashboardCliente = lazy(() => import("./screens/Clients/DashboardCliente"));

function App() {
  const location = useLocation(); 
  const [isAuthReady, setIsAuthReady] = useState(false); // Novo estado para controle do spinner

  useEffect(() => {
    // Verifica se o módulo de autenticação já está inicializado
    if (auth.isInitialized()) {
      setIsAuthReady(true);
    } else {
      // Se não estiver, pode-se adicionar um mecanismo de escuta se o 'auth' tivesse um
      // Por enquanto, uma verificação única após a montagem é suficiente
      // dado que auth.init() é chamado no carregamento do módulo.
      // Poderíamos adicionar um pequeno delay aqui para garantir que o init() em auth.js
      // tenha tido tempo de executar, embora ele seja síncrono.
      setIsAuthReady(true); // Assumimos que auth.init() já rodou ao carregar o módulo
    }
  }, []);

  if (!isAuthReady) return <Spinner />;

  return (
    <>
      <ScrollToTop />
      <Suspense fallback={<Spinner />}>
        <Routes location={location} key={location.key}>
          {/* Rotas públicas */}
          <Route path="/" element={<LandingPage key={location.key} />} />
          <Route path="/login" element={<Login />} />
          <Route path="/registro" element={<Registro key={location.key} />} />
          <Route path="/payment/:paymentId" element={<Payment />} />
          <Route path="/payment-success" element={<PaymentSuccess />} />
          <Route 
            path="/carrinho" 
            element={<CarrinhoCompras />} 
          />

          {/* Rotas protegidas de admin */}
          <Route
            path="/dashboardadmin"
            element={auth.isAdmin() ? <DashboardAdmin /> : <Navigate to="/login" />}
          />
          <Route
            path="/empresasadmin"
            element={auth.isAdmin() ? <EmpresasAdmin /> : <Navigate to="/login" />}
          />
          <Route
            path="/planosadmin"
            element={auth.isAdmin() ? <PlanosAdmin /> : <Navigate to="/login" />}
          />

          {/* Rotas protegidas de cliente */}
          <Route
            path="/dashboardcliente" // Rota corrigida
            element={auth.isLoggedInCliente() ? <DashboardCliente /> : <Navigate to="/login" />}
          />
        </Routes>
      </Suspense>
    </>
  );
}
export default App;
