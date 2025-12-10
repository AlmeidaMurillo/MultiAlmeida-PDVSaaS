import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  FaMoon,
  FaSun,
  FaShoppingCart,
  FaSignInAlt,
  FaSignOutAlt,
  FaTachometerAlt,
  FaBars,
  FaTimes,
} from "react-icons/fa";
import styles from "./Header.module.css";
import { useAuth } from "../../context/useAuthHook"; // Importa o hook useAuth

function Header() {
  const navigate = useNavigate();
  const { isAuthenticated, user, userRole, logout, api } = useAuth(); // Usa o hook useAuth

  const [theme, setTheme] = useState(() => localStorage.getItem("theme") || "dark");
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [isSubscriptionActive, setIsSubscriptionActive] = useState(false);
  const [isSubscriptionExpired, setIsSubscriptionExpired] = useState(false);

  useEffect(() => {
    async function checkSubscription() {
      if (userRole === 'usuario') { // Usar userRole do useAuth
        try {
          const { data } = await api.get('/api/auth/status');
          setIsSubscriptionActive(data.isSubscriptionActive);
          setIsSubscriptionExpired(data.isSubscriptionExpired);
        } catch (error) {
          console.error("Erro ao verificar assinatura:", error);
        }
      }
    }

    if (isAuthenticated) {
      checkSubscription();
    } else {
      setIsSubscriptionActive(false);
      setIsSubscriptionExpired(false);
    }
  }, [isAuthenticated, userRole, api]); // Dependências atualizadas

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("theme", theme);
  }, [theme]);

  useEffect(() => {
    if (isMobileSidebarOpen) {
      document.body.classList.add("modal-open");
    } else {
      document.body.classList.remove("modal-open");
    }
  }, [isMobileSidebarOpen]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === "dark" ? "light" : "dark"));
  };

  const handlePainelClick = async () => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }

    if (userRole === 'admin') { // Usar userRole do useAuth
      navigate("/dashboardadmin");
      return;
    }

    if (userRole === 'usuario') { // Usar userRole do useAuth
      // Não precisa fazer a chamada de API novamente aqui se o estado já está sendo atualizado pelo useEffect
      if (isSubscriptionActive || isSubscriptionExpired) {
        navigate("/dashboardcliente");
      } else {
        alert("Você precisa ter uma assinatura ativa ou vencida para acessar o painel.");
      }
    }
  };

  const handleCarrinhoClick = () => {
    if (userRole === 'admin') { // Usar userRole do useAuth
      // Se for admin, redireciona diretamente para /login para que possa logar como usuário
      navigate("/login", { replace: false });
    } else if (isAuthenticated) {
      // Se for um cliente autenticado, vai para o carrinho
      navigate("/carrinho", { replace: false });
    } else {
      // Se não estiver autenticado, vai para o login
      navigate("/login", { replace: false });
    }
  };

  const handleLogout = () => {
    logout(); // Chama o logout do useAuth hook
  };

  const toggleMobileSidebar = () => {
    setIsMobileSidebarOpen(!isMobileSidebarOpen);
  };

  const userName = user?.nome || "";
  const userEmail = user?.email || "";

  return (
    <>
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

          {isAuthenticated ? (
            <>
              {(isSubscriptionActive || isSubscriptionExpired || userRole === 'admin') && ( // Usar userRole do useAuth
                <button className={styles.painelButton} onClick={handlePainelClick}>
                  <FaTachometerAlt /> Painel
                </button>
              )}
              <div className={styles.profileContainer} onClick={toggleMobileSidebar}>
                <div className={styles.profileCircle}>
                  {userName ? userName.charAt(0).toUpperCase() : "U"}
                </div>
                <div className={styles.profileInfo}>
                  <span className={styles.profileName}>{userName}</span>
                  <span className={styles.profileEmail}>{userEmail}</span>
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
              {isAuthenticated ? (
                <div className={styles.mobileUserInfo}>
                  <div className={styles.mobileUserAvatar}>
                    {userName ? userName.charAt(0).toUpperCase() : "U"}
                  </div>
                  <div className={styles.userInfoText}>
                    <div className={styles.userInfoLine}>{userName}</div>
                    <div className={styles.userInfoLine}>{userEmail}</div>
                    {userRole && ( // Usar userRole do useAuth
                      <div className={styles.mobileUserPapel}>{userRole}</div>
                    )}
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
              {isAuthenticated ? (
                (isSubscriptionActive || isSubscriptionExpired || userRole === 'admin') && ( // Usar userRole do useAuth
                  <button className={styles.mobileSidebarItem} onClick={() => { handlePainelClick(); toggleMobileSidebar(); }}>
                    <FaTachometerAlt />
                    <span>Painel</span>
                  </button>
                )
              ) : (
                <button className={styles.mobileSidebarItem} onClick={() => { navigate("/login"); toggleMobileSidebar(); }}>
                  <FaSignInAlt />
                  <span>Login</span>
                </button>
              )}
            </div>

            {isAuthenticated && (
              <div className={styles.mobileSidebarFooter}>
                <button className={styles.mobileSidebarItem} onClick={handleLogout}>
                  <FaSignOutAlt />
                  <span>Sair</span>
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}

export default Header;
