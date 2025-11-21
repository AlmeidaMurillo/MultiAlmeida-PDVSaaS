 import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
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
  const location = useLocation();
  const navigate = useNavigate();
  const { planId, periodo } = location.state || {};

  const [theme, setTheme] = useState(localStorage.getItem("theme") || "dark");

  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userName, setUserName] = useState("");
  const [userEmail, setUserEmail] = useState("");
  const [showUserModal, setShowUserModal] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  const [loading, setLoading] = useState(false);
  const [paymentData, setPaymentData] = useState(null);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);

  const copyToClipboard = async () => {
    if (paymentData && paymentData.pixCode) {
      try {
        await navigator.clipboard.writeText(paymentData.pixCode);
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
    if (isLoggedIn) {
      navigate("/dashboard");
    } else {
      navigate("/login");
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
    setShowUserModal(false);
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
        navigate("/login", { state: { from: "/carrinho", planId, periodo } });
      }
    };
    checkAuth();
  }, [navigate, planId, periodo]);

  useEffect(() => {
    if (isLoggedIn && planId && periodo) {
      const initiatePayment = async () => {
        try {
          setLoading(true);
          const response = await api.post("/api/payments/initiate", { planId, periodo });
          setPaymentData(response.data);
        } catch (err) {
          console.error("Erro ao iniciar pagamento:", err);
          setError("Erro ao iniciar pagamento");
        } finally {
          setLoading(false);
        }
      };
      initiatePayment();
    }
  }, [isLoggedIn, planId, periodo]);


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
                <div className={styles.profileCircle} onClick={() => setShowUserModal(!showUserModal)}>
                  {userName ? userName.charAt(0).toUpperCase() : "U"}
                </div>

                {showUserModal && (
                  <div className={styles.userModalOverlay} onClick={() => setShowUserModal(false)}>
                    <div className={styles.userModal} onClick={(e) => e.stopPropagation()}>
                      <button className={styles.modalCloseButton} onClick={() => setShowUserModal(false)}>
                        <FaTimes />
                      </button>
                      <div className={styles.modalHeader}>
                        <div className={styles.modalUserAvatar}>
                          {userName ? userName.charAt(0).toUpperCase() : "U"}
                        </div>
                        <div className={styles.modalUserInfo}>
                          <h3 className={styles.modalUserName}>{userName}</h3>
                          <p className={styles.modalUserEmail}>{userEmail}</p>
                        </div>
                      </div>
                      <div className={styles.modalBody}>
                        <button
                          className={`${styles.modalButton} ${styles.modalButtonPrimary}`}
                          onClick={() => navigate("/dashboard")}
                        >
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="24"
                            height="24"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          >
                            <path d="M12 20V10" />
                            <path d="M18 20V4" />
                            <path d="M6 20V16" />
                          </svg>
                          <span>Ver Painel</span>
                        </button>
                        <button
                          className={`${styles.modalButton} ${styles.modalButtonSecondary}`}
                          onClick={handleLogout}
                        >
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="24"
                            height="24"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          >
                            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                            <polyline points="16 17 21 12 16 7" />
                            <line x1="21" y1="12" x2="9" y2="12" />
                          </svg>
                          <span>Sair</span>
                        </button>
                      </div>
                    </div>
                  </div>
                )}
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
        {loading && <div className={styles.loading}>Iniciando pagamento...</div>}
        {error && <div className={styles.error}>{error}</div>}
        {paymentData && (
          <div className={styles.paymentContainer}>
            <h1 className={styles.title}>Pagamento PIX</h1>
            <div className={styles.paymentDetails}>
              <div className={styles.planInfo}>
                <h2>Plano: {paymentData.plan.nome} - {paymentData.plan.periodo}</h2>
                <p>Preço: R$ {paymentData.plan.preco.toFixed(2)}</p>
                <p>Duração: {paymentData.plan.duracaoDias} dias</p>
                <ul>
                  {paymentData.plan.beneficios.map((beneficio, i) => (
                    <li key={i}>{beneficio}</li>
                  ))}
                </ul>
              </div>
              <div className={styles.userInfo}>
                <h2>Usuário: {paymentData.user.nome}</h2>
                <p>Email: {paymentData.user.email}</p>
                <p>Data de Criação: {new Date(paymentData.dataCriacao).toLocaleString()}</p>
              </div>
              <div className={styles.qrSection}>
                <h2>QR Code PIX</h2>
                <img src={paymentData.qrCode} alt="QR Code PIX" className={styles.qrCode} />
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
