import { Suspense, lazy, useEffect, useState } from "react";
import { Routes, Route, Navigate, useLocation } from "react-router-dom";
import ScrollToTop from "./Components/Scroll/ScrollToTop";
import { auth } from "./auth";
import Spinner from "./Components/Spinner/Spinner";

/* FAZER FUNCIONAR A CRIAÇÃO DE PLANOS NO SISTEMA DE ADMIN.
ARRUMAR A RESPONSIVIDADE DAS TELAS DE ADMIN E CLIENTE.

FAZER UMA TELA DE PAGAMENTO RECUSADO OU CANCELADO PARA QUANDO UM PAGAMENTO FOR RECUSADO PELO SISTEMA DE PAGAMENTO OU ALGO ASSIM..
E ARRUMAR A TELA DE SUCESSO TAMBEM.


QUERO QUE AO LOGAR EM ALGUM DISPOSITIVO, QUERO QUE SÓ DESLOGA DO DISPOSITIVO QUE TA LOGADO A CONTA QUANDO, A PESSOA CLICAR EM SAIR OU A SESSAO EXPIRAR, QUERO QUE ISSO SEJA RIGIDO PARA NAO FICAR SESSAO ATIVA LA NO BANCO SENDO QUE ESSA SESSAO QUE TA ATIVA O DISPOSITIVO QUE FOI ATIVO NELA JA ESTA DESLOGADO.

TERMINAR A PARTE DE ALTERAR PLANO NO PERFIL DO CLIENTE.
FAZER UM MÉTODO PARA ALTERAÇÃO DE PLANO, PARA TER QUE FAZER UMA DIFERENÇA DE PAGAMENTO NO VALOR DO PLANO QUE O CLIENTE VAI QUERER
DE ACORDO COM OS DIAS DO PLANO QUE ELE JA TEM ATIVO NO SISTEMA.
NA PARTE DE ALTERAÇÃO DE PLANO, MOSTRAR TODOS OS PLANOS MENOS OQUE O CLIENTE JA ESTA ATIVO NO SISTEMA.

TERMINAR PARTE DE ALTERAÇÃO DE SENHA NO PERFIL DO CLIENTE.
IMPLEMENTAR UMA PARTE DE RECUPERAÇÃO DE SENHA.
ADICIONAR OLHINHO PARA DESOCULTAR E MOSTRAR SENHA NOS CAMPOS DE SENHA.
FAZER UM MÉTODO PARA ENVIAR CÓDIGO DE VERIFICAÇÃO PARA O EMAIL DO USUÁRIO OU NO TELEFONE.

IMPLEMENTAR MAIS COISAS NO CADASTRO DO CLIENTE COMO CPF, TELEFONE, ETC.
ARRUMAR ALGUM MÉTODO PARA SALVAR A FOTO DE PERFIL DO CLIENTE.

VERIFICAR O PORQUE O LOGIN EM VEZ DE ESTAR SE ENCERRANDO EM UM DIA QUE FOI O PRAZO QUE EU COLOQUE LA, ELE ESTA SE ENCERRANDO EM
MENOS DE HORA.


FAZER PARA NAO DEIXAR NADA QUE SEJA FRAGIL NO SISTEMA EXPOSTO COMO POR EXEMPLO AS APIS.


FAZER UM VISUAL NOVO E BEM ATRATIVO E MODERNO E BEM ANIMADO PARA O SISTEMA DEPOIS DE TUDO TERMINADO.

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
const Perfil = lazy(() => import("./screens/Clients/Perfil"));

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
          <Route
            path="/perfil"
            element={auth.isAuthenticated() ? <Perfil /> : <Navigate to="/login" />}
          />
        </Routes>
      </Suspense>
    </>
  );
}
export default App;
