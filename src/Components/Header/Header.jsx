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
import { auth } from "../../auth";
import api from "../../auth";

function Header() {
  const navigate = useNavigate();

  // O estado agora é um reflexo do estado do serviço `auth`
  const [theme, setTheme] = useState(() => localStorage.getItem("theme") || "dark");
  const [isLoggedIn, setIsLoggedIn] = useState(() => auth.isAuthenticated());
  const [user, setUser] = useState(() => auth.getUser());
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [isSubscriptionActive, setIsSubscriptionActive] = useState(false);
  const [isSubscriptionExpired, setIsSubscriptionExpired] = useState(false);

  useEffect(() => {
    // Sincroniza o estado no mount (o `auth.init` já rodou)
    setIsLoggedIn(auth.isAuthenticated());
    setUser(auth.getUser());
  }, []);

  useEffect(() => {
    async function checkSubscription() {
      if (auth.isLoggedInCliente()) {
        try {
          const { data } = await api.get('/api/auth/status');
          setIsSubscriptionActive(data.isSubscriptionActive);
          setIsSubscriptionExpired(data.isSubscriptionExpired);
        } catch (error) {
          console.error("Erro ao verificar assinatura:", error);
        }
      }
    }

    checkSubscription();
  }, [isLoggedIn]);

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
    if (!auth.isAuthenticated()) {
      navigate('/login');
      return;
    }

    if (auth.isAdmin()) {
      navigate("/dashboardadmin");
      return;
    }

    if (auth.isLoggedInCliente()) {
      try {
        const { data } = await api.get('/api/auth/status');
        if (data.isSubscriptionActive || data.isSubscriptionExpired) {
          navigate("/dashboardcliente");
        } else {
          alert("Você precisa ter uma assinatura ativa ou vencida para acessar o painel.");
        }
      } catch (error) {
        console.error("Erro ao verificar status da assinatura:", error);
        alert("Não foi possível verificar o status da sua assinatura. Tente novamente.");
      }
    }
  };

  const handleCarrinhoClick = () => {
    if (auth.isAdmin()) {
      // Se for admin, redireciona diretamente para /login para que possa logar como usuário
      navigate("/login", { replace: false });
    } else if (auth.isAuthenticated()) {
      // Se for um cliente autenticado, vai para o carrinho
      navigate("/carrinho", { replace: false });
    } else {
      // Se não estiver autenticado, vai para o login
      navigate("/login", { replace: false });
    }
  };

  const handleLogout = () => {
    auth.logout(); // O logout agora lida com o redirecionamento
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

          {isLoggedIn ? (
            <>
              {(isSubscriptionActive || isSubscriptionExpired || auth.isAdmin()) && (
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
              {isLoggedIn ? (
                <div className={styles.mobileUserInfo}>
                  <div className={styles.mobileUserAvatar}>
                    {userName ? userName.charAt(0).toUpperCase() : "U"}
                  </div>
                  <div className={styles.userInfoText}>
                    <h3 className={styles.mobileUserName}>
                      {userName}{" "}
                      <span className={styles.mobileUserEmail}>{userEmail}</span>
                    </h3>
                    {user?.papel && (
                      <p className={styles.mobileUserPapel}>{user.papel}</p>
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
              {isLoggedIn ? (
                (isSubscriptionActive || isSubscriptionExpired || auth.isAdmin()) && (
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

            {isLoggedIn && (
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
