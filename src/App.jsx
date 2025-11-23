import { Suspense, lazy, useEffect, useState } from "react";
import { Routes, Route, Navigate, useLocation } from "react-router-dom";
import ScrollToTop from "./Components/Scroll/ScrollToTop";
import { auth } from "./auth";
import Spinner from "./Components/Spinner/Spinner";

// Lazy loading das páginas
const LandingPage = lazy(() => import("./screens/Clients/LandingPage"));
const LoginAdmin = lazy(() => import("./screens/Admins/LoginAdmin"));
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
  const [loadingAuth, setLoadingAuth] = useState(true);
  const location = useLocation(); 
  const [showSpinner, setShowSpinner] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setShowSpinner(false);
    }, 3000);

    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    // On app start: check token expiration and clear if expired to avoid 401 errors before login
    const clearExpiredToken = () => {
      const token = localStorage.getItem("jwt_token");
      const userType = localStorage.getItem("user_type");
      if (token) {
        try {
          const base64Url = token.split('.')[1];
          const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
          const jsonPayload = decodeURIComponent(
            atob(base64)
              .split('')
              .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
              .join('')
          );
          const decoded = JSON.parse(jsonPayload);
          if (decoded.exp && decoded.exp * 1000 < Date.now()) {
            // Token expired - clear localStorage tokens
            localStorage.removeItem("jwt_token");
            localStorage.removeItem("user_type");
          }
        } catch (e) {
          // Malformed token - clear localStorage tokens
          console.error("Malformed token:", e);
          localStorage.removeItem("jwt_token");
          localStorage.removeItem("user_type");
        }
      }
      if (!userType) {
        localStorage.removeItem("user_type");
      }
    };

    clearExpiredToken();

    const initAuth = async () => {
      await auth.update();
      setLoadingAuth(false);
    };
    initAuth();
  }, []);

  if (loadingAuth || showSpinner) return <Spinner />;

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
          <Route path="/loginadmin" element={<LoginAdmin />} />
          <Route path="/carrinho" element={<CarrinhoCompras />} />

          {/* Rotas protegidas de admin */}
          <Route
            path="/dashboardadmin"
            element={auth.isAdmin() ? <DashboardAdmin /> : <Navigate to="/loginadmin" />}
          />
          <Route
            path="/empresasadmin"
            element={auth.isAdmin() ? <EmpresasAdmin /> : <Navigate to="/loginadmin" />}
          />
          <Route
            path="/planosadmin"
            element={auth.isAdmin() ? <PlanosAdmin /> : <Navigate to="/loginadmin" />}
          />

          {/* Rotas protegidas de cliente */}
          <Route
            path="/dashboard"
            element={auth.isLoggedInCliente() ? <DashboardCliente /> : <Navigate to="/login" />}
          />
        </Routes>
      </Suspense>
    </>
  );
}

export default App;
