import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  FaMoon,
  FaSun,
  FaShoppingCart,
  FaSignInAlt,
  FaSignOutAlt,
  FaTachometerAlt,
  FaBars,
  FaTimes,
  FaCopy,
  FaCheck,
} from "react-icons/fa";
import { auth } from "../../auth";
import api from "../../auth";
import styles from "./Payment.module.css";

export default function Payment() {
  const { paymentId } = useParams();
  const navigate = useNavigate();

  const [theme, setTheme] = useState(localStorage.getItem("theme") || "dark");

  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userName, setUserName] = useState("");
  const [userEmail, setUserEmail] = useState("");
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  const [loading, setLoading] = useState(true);
  const [paymentData, setPaymentData] = useState(null);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);

  const copyToClipboard = async () => {
    if (paymentData && paymentData.qrCodeText) {
      try {
        await navigator.clipboard.writeText(paymentData.qrCodeText);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch (err) {
        console.error('Erro ao copiar código PIX:', err);
      }
    }
  };

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("theme", theme);
  }, [theme]);



  const toggleTheme = () => {
    setTheme((prev) => (prev === "dark" ? "light" : "dark"));
  };

  const handlePainelClick = () => {
    if (auth.isCliente()) { // Usa a nova lógica que verifica se tem alguma assinatura
      navigate("/dashboard");
    } else {
      // Exibe um alerta personalizado
      alert("Você precisa ter uma assinatura ativa ou uma assinatura anterior associada à sua conta para acessar o painel. Por favor, verifique seus planos ou entre em contato com o suporte para mais informações.");
      // Opcional: Redirecionar para uma página de planos ou de contato
      // navigate("/planos");
    }
  };

  const handleCarrinhoClick = () => {
    if (isLoggedIn) {
      navigate("/carrinho");
    } else {
      navigate("/login");
    }
  };

  const handleLogout = async () => {
    await auth.logout();
    setIsLoggedIn(false);
    setUserName("");
    setUserEmail("");
    navigate("/");
  };

  const toggleMobileSidebar = () => {
    setIsMobileSidebarOpen(!isMobileSidebarOpen);
  };

  useEffect(() => {
    const checkAuth = async () => {
      await auth.update();
      const loggedIn = auth.isLoggedInCliente();
      setIsLoggedIn(loggedIn);
      if (loggedIn) {
        try {
          const userDetails = await auth.getUserDetails();
          setUserName(userDetails.nome);
          setUserEmail(userDetails.email);
        } catch (err) {
          console.error("Erro ao carregar detalhes do usuário:", err);
          await auth.logout();
          setIsLoggedIn(false);
        }
      } else {
        navigate("/login");
      }
    };
    checkAuth();
  }, [navigate]);

  useEffect(() => {
    if (isLoggedIn && paymentId) {
      const fetchPaymentDetails = async () => {
        try {
          setLoading(true);
          const response = await api.get(`/api/payments/${paymentId}`);
          setPaymentData(response.data);
        } catch (err) {
          console.error("Erro ao carregar detalhes do pagamento:", err);
          setError("Erro ao carregar detalhes do pagamento");
        } finally {
          setLoading(false);
        }
      };
      fetchPaymentDetails();
    }
  }, [isLoggedIn, paymentId]);

  useEffect(() => {
    if (!paymentId) return;

    const interval = setInterval(async () => {
      try {
        const response = await api.get(`/api/payments/status/${paymentId}`);
        if (response.data.status === 'aprovado') {
          clearInterval(interval);
          navigate('/payment-success');
        }
      } catch (err) {
        console.error("Erro ao verificar status do pagamento:", err);
      }
    }, 3000); // Poll every 3 seconds

    return () => clearInterval(interval); // Cleanup on unmount
  }, [paymentId, navigate]);


  return (
    <div className={styles.container}>
      <header className={styles.headerTop}>
        <div className={styles.logoContainer} onClick={() => navigate("/")}>
          <div className={styles.logo}>MultiAlmeida</div>
          <h2 className={styles.subtitle}>ERP SaaS PDV</h2>
        </div>

        <div className={styles.actionsContainer}>
          <button className={styles.iconButton} onClick={toggleTheme}>
            {theme === "dark" ? <FaSun /> : <FaMoon />}
          </button>
          <button className={styles.iconButton} onClick={handleCarrinhoClick}>
            <FaShoppingCart />
          </button>
          {isLoggedIn ? (
            <>
              <button className={styles.painelButton} onClick={handlePainelClick}>
                <FaTachometerAlt /> Painel
              </button>
              <div className={styles.profileContainer}>
                <div className={styles.profileCircle} onClick={toggleMobileSidebar}>
                  {userName ? userName.charAt(0).toUpperCase() : "U"}
                </div>
              </div>
            </>
          ) : (
            <button className={styles.loginButton} onClick={() => navigate("/login")}>
              <FaSignInAlt /> Login
            </button>
          )}
        </div>

        <button className={styles.mobileMenuButton} onClick={toggleMobileSidebar}>
          <FaBars />
        </button>
      </header>

      {isMobileSidebarOpen && (
        <div className={styles.mobileSidebarOverlay} onClick={toggleMobileSidebar}>
          <div className={styles.mobileSidebar} onClick={(e) => e.stopPropagation()}>
            <div className={styles.mobileSidebarHeader}>
              {isLoggedIn ? (
                <div className={styles.mobileUserInfo}>
                  <div className={styles.mobileUserAvatar}>
                    {userName ? userName.charAt(0).toUpperCase() : "U"}
                  </div>
                  <div className={styles.userInfoText}>
                    <h3 className={styles.mobileUserName}>{userName}</h3>
                    <p className={styles.mobileUserEmail}>{userEmail}</p>
                  </div>
                </div>
              ) : (
                <h3>Menu</h3>
              )}
              <button className={styles.closeButton} onClick={toggleMobileSidebar}>
                <FaTimes />
              </button>
            </div>

            <div className={styles.mobileSidebarContent}>
              <button className={styles.mobileSidebarItem} onClick={() => { toggleTheme(); toggleMobileSidebar(); }}>
                {theme === "dark" ? <FaSun /> : <FaMoon />}
                <span>Alternar Tema</span>
              </button>
              <button className={styles.mobileSidebarItem} onClick={() => { handleCarrinhoClick(); toggleMobileSidebar(); }}>
                <FaShoppingCart />
                <span>Carrinho</span>
              </button>
              {isLoggedIn ? (
                <button className={styles.mobileSidebarItem} onClick={() => { handlePainelClick(); toggleMobileSidebar(); }}>
                  <FaTachometerAlt />
                  <span>Painel</span>
                </button>
              ) : (
                <button className={styles.mobileSidebarItem} onClick={() => { navigate("/login"); toggleMobileSidebar(); }}>
                  <FaSignInAlt />
                  <span>Login</span>
                </button>
              )}
            </div>

            {isLoggedIn && (
              <div className={styles.mobileSidebarFooter}>
                <button className={styles.mobileSidebarItem} onClick={() => { handleLogout(); toggleMobileSidebar(); }}>
                  <FaSignOutAlt />
                  <span>Sair</span>
                </button>
              </div>
            )}
          </div>
        </div>
      )}



      {/* Payment Content */}
      <div className={styles.content}>
        {loading && <div className={styles.loading}>Carregando dados do pagamento...</div>}
        {error && <div className={styles.error}>{error}</div>}
        {paymentData && (
          <div className={styles.paymentContainer}>
            <h1 className={styles.title}>Pagamento PIX</h1>
            <div className={styles.paymentDetails}>
              <div className={styles.planInfo}>
                <h2>Plano: {paymentData.nomePlano} - {paymentData.periodoPlano}</h2>
                <p>Preço: R$ {Number(paymentData.precoPlano).toFixed(2)}</p>
                <p>Duração: {paymentData.duracaoDiasPlano} dias</p>
              </div>
              <div className={styles.qrSection}>
                <h2>QR Code PIX</h2>
                <img src={`data:image/png;base64,${paymentData.qrCode}`} alt="QR Code PIX" className={styles.qrCode} />
                <button className={styles.copyButton} onClick={copyToClipboard}>
                  {copied ? <FaCheck /> : <FaCopy />} {copied ? "Copiado!" : "Copiar Código PIX"}
                </button>
                <p className={styles.expiration}>
                  Expira em: {new Date(paymentData.expirationTime).toLocaleString()}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
