import { Suspense, lazy, useEffect, useState } from "react";
import { Routes, Route, Navigate, useLocation } from "react-router-dom";
import ScrollToTop from "./Components/Scroll/ScrollToTop";
import { auth, setupInterceptors } from "./auth";
import Spinner from "./Components/Spinner/Spinner";

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
const Perfil = lazy(() => import("./screens/Clients/Perfil"));

function App() {
  const location = useLocation(); 
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isAuthReady, setIsAuthReady] = useState(false);

  useEffect(() => {
    // Configura interceptores do axios
    setupInterceptors();

    // Subscribe para mudanças no estado de autenticação
    const unsubscribe = auth.subscribe((newState) => {
      setIsAuthenticated(newState.isAuthenticated);
      if (newState.initialized) {
        setIsAuthReady(true);
      }
    });

    // Inicializa autenticação
    auth.init();

    return () => unsubscribe();
  }, []);

  if (!isAuthReady) return <Spinner />;

  return (
    <>
      <ScrollToTop />
      <Suspense fallback={<Spinner />}>
        <Routes location={location}>
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<Login />} />
          <Route path="/registro" element={<Registro />} />
          <Route path="/payment/:paymentId" element={<Payment />} />
          <Route path="/payment-success" element={<PaymentSuccess />} />
          <Route path="/carrinho" element={<CarrinhoCompras />} />

          <Route
            path="/dashboardadmin"
            element={isAuthenticated && auth.isAdmin() ? <DashboardAdmin /> : <Navigate to="/login" replace />}
          />
          <Route
            path="/empresasadmin"
            element={isAuthenticated && auth.isAdmin() ? <EmpresasAdmin /> : <Navigate to="/login" replace />}
          />
          <Route
            path="/planosadmin"
            element={isAuthenticated && auth.isAdmin() ? <PlanosAdmin /> : <Navigate to="/login" replace />}
          />

          <Route
            path="/dashboardcliente"
            element={isAuthenticated && auth.isCliente() ? <DashboardCliente /> : <Navigate to="/login" replace />}
          />
          <Route
            path="/perfil"
            element={isAuthenticated ? <Perfil /> : <Navigate to="/login" replace />}
          />
        </Routes>
      </Suspense>
    </>
  );
}
export default App;