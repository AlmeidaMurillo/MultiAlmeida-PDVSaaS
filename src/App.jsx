import { Suspense, lazy, useEffect, useState } from "react";
import { Routes, Route, Navigate, useLocation } from "react-router-dom";
import ScrollToTop from "./Components/Scroll/ScrollToTop";
import { auth, setupInterceptors } from "./auth";
import Spinner from "./Components/Spinner/Spinner";

/* 

COMO EU FAREI AS PERMISSOES QUE ESTAO NOS BENEFICIOS DOS PLANOS FUNCIONAREM COM EXITO? 
TIPO QUERO NA TELA DE PLANOS CLICAR EM UM BOTAO DE PERMISSOES ONDE ABRIRA UM MODAL 
COM TODAS AS PERMISSOES DOS PLANOS DO SISTEMA ONDE EU IREI MARCAR AS CAIXAS DE 
QUAIS PERMISSOES AQUELE PLANO IRA TER, COMO FAREI ISSO? TEM QUE CRIAR ALGO NO BANCO? 
POR ONDE COMEÇAR?

VERIFICAR COMO IREI FAZER A QUESTAO DE AURIZAÇÕES OS PLANOS DO USUARIO PARA ELE CONSEGUIR
USAR APENAS OQUE ESTA DESCRITO NO PLANO DE ASSINATURA DELE.
FAZER MESMA COISA PARA OS FUNCIONARIOS DOS DONOS DAS EMPRESAS, PARA ADMINS CARGOS DE ADMIN DO MEU SISTEMA.

FAZER ALGO TIPO UMA POLITICA DE REGRAS PARA O SISTEMA TIPO TERMOS DE USO E POLITICA DE PRIVACIDADE

FAZER UMA DOCUMENTAÇÃO PARA ABRIR EM CADA PLANO E O USUARIO VER TODOS OS BENEFICIOS DO PLANO CONTRATADO
DE PONTA A PONTA.   

FAZER O STATUS DE QUANDO A ASSINATURA DO USUARIO ESTIVER EXPIRADA, CANCELADA, VENCIDA E ETC NA MODAL DA TELA LANDINGPAGE E NA SIDERBAR DA LANDINGPAGE.


FAZER A TELA CONFIGURACOES AVANCADAS LOGO, QUERO CONTROLAR TODO AS VARIBLES DO SISTEMA POR LA
ONDE IREI MUDAR CONFIGS DE TEMPO DE SESSAO, DE PAGAMENTO, DE TODOS VARIABLES DO .ENV.

FAZER A TELA DE CRIAÇÃO DE CARGOS E PERMISSOES PARA OS FUNCIONARIOS MEUS E DAS EMPRESAS QUE USAM O SISTEMA.
E CONSEGUIR GERENCIAR QUAIS PERMISSOES CADA CARGO PODERÁ USAR NO SISTEMA.

NA ABA DE PLANOS E NA DE CRIAR O PLANO FAZER UMA NOVA IMPLEMENTAÇÃO DE VALOR ANTIGO DO PLANO E NOVO VALOR COM DESCONTO, TIPO MOSTRAR O VALOR ANTIGO RISCADO E AO LADO O NOVO VALOR COM DESCONTO.

*/

const LandingPage = lazy(() => import("./screens/Clients/LandingPage"));
const Registro = lazy(() => import("./screens/Clients/Registro"));
const Login = lazy(() => import("./screens/Clients/Login"));
const CarrinhoCompras = lazy(() => import("./screens/Clients/CarrinhoCompras"));
const DashboardAdmin = lazy(() => import("./screens/Admins/DashboardAdmin"));
const EmpresasAdmin = lazy(() => import("./screens/Admins/EmpresasAdmin"));
const PlanosAdmin = lazy(() => import("./screens/Admins/PlanosAdmin"));
const CuponsAdmin = lazy(() => import("./screens/Admins/CuponsAdmin"));
const Payment = lazy(() => import("./screens/Clients/Payment"));
const PaymentStatus = lazy(() => import("./screens/Clients/PaymentStatus"));
const DashboardCliente = lazy(() => import("./screens/Clients/DashboardCliente"));
const Perfil = lazy(() => import("./screens/Clients/Perfil"));
const PagamentosAdmin = lazy(() => import("./screens/Admins/PagamentosAdmin"));
const LogsAdmin = lazy(() => import("./screens/Admins/LogsAdmin"));

function App() {
  const location = useLocation(); 
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isAuthReady, setIsAuthReady] = useState(false);
  const [isPageTransitioning, setIsPageTransitioning] = useState(false);

  const RequirePaymentContext = ({ children }) => {
    const hasStateFlag = location.state?.fromCart === true;
    const hasPaymentIdParam = /\/payment\/.+/.test(location.pathname);

    if (hasStateFlag && hasPaymentIdParam) {
      return children;
    }
    return <Navigate to="/" replace />;
  };

  const RequirePaymentStatusContext = ({ children }) => {
    const hasStateFlag = location.state?.fromPayment === true;
    if (hasStateFlag) {
      return children;
    }
    return <Navigate to="/" replace />;
  };

  useEffect(() => {
    setupInterceptors();

    const unsubscribe = auth.subscribe((newState) => {
      setIsAuthenticated(newState.isAuthenticated);
      if (newState.initialized) {
        setIsAuthReady(true);
      }
    });

    auth.init().catch(err => {
      console.error('Erro crítico na inicialização:', err);
      setIsAuthReady(true);
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    setIsPageTransitioning(true);
    const timer = setTimeout(() => {
      setIsPageTransitioning(false);
    }, 300);

    return () => clearTimeout(timer);
  }, [location.pathname]);


  if (!isAuthReady || isPageTransitioning) return <Spinner />;

  return (
    <>
      <ScrollToTop />
      <Suspense fallback={<Spinner />}>
        <Routes location={location}>
          <Route path="/" element={<LandingPage />} />
          <Route
            path="/login"
            element={
                <Login />
            }
          />
          <Route
            path="/registro"
            element={
                <Registro />
            }
          />
          <Route path="/payment" element={<Navigate to="/" replace />} />
          <Route
            path="/payment/:paymentId"
            element={
              <RequirePaymentContext>
                <Payment />
              </RequirePaymentContext>
            }
          />
          <Route
            path="/payment-status"
            element={
              <RequirePaymentStatusContext>
                <PaymentStatus />
              </RequirePaymentStatusContext>
            }
          />
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
            path="/cuponsadmin"
            element={isAuthenticated && auth.isAdmin() ? <CuponsAdmin /> : <Navigate to="/login" replace />}
          />
          <Route
            path="/pagamentosadmin"
            element={isAuthenticated && auth.isAdmin() ? <PagamentosAdmin /> : <Navigate to="/login" replace />}
          />
          <Route
            path="/logsadmin"
            element={isAuthenticated && auth.isAdmin() ? <LogsAdmin /> : <Navigate to="/login" replace />}
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
