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

function Header() {
  const navigate = useNavigate();

  const [theme, setTheme] = useState(localStorage.getItem("theme") || "dark");
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userName, setUserName] = useState("");
  const [userEmail, setUserEmail] = useState("");
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

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
    return () => {
      document.body.classList.remove("modal-open");
    };
  }, [isMobileSidebarOpen]);

  useEffect(() => {
    const checkAuth = async () => {
      await auth.update();
      const userIsLoggedIn = auth.isLoggedInCliente() || auth.isAdmin();
      setIsLoggedIn(userIsLoggedIn);
      if (userIsLoggedIn) {
        try {
          const userDetails = await auth.getUserDetails();
          setUserName(userDetails.nome);
          setUserEmail(userDetails.email);
        } catch (err) {
          console.error("Erro ao carregar detalhes do usuário:", err);
        }
      }
    };
    checkAuth();
  }, []);

  const toggleTheme = () => {
    setTheme((prev) => (prev === "dark" ? "light" : "dark"));
  };

  const handlePainelClick = async () => {
    await auth.update();

    if (auth.isAdmin()) {
      navigate("/dashboardadmin");
    } else if (auth.isLoggedInCliente()) {
      if (auth.hasActiveOrExpiredSubscription()) {
        navigate("/dashboardcliente");
      } else {
        alert("Você precisa ter uma assinatura ativa ou vencida para acessar o painel.");
      }
    } else {
      navigate('/login');
    }
  };

  const handleCarrinhoClick = () => {
    if (auth.isLoggedInCliente()) {
      navigate("/carrinho");
    } else {
      navigate("/login", { state: { from: "/carrinho" } });
    }
  };

  const handleLogout = async () => {
    await auth.logout();
    setIsLoggedIn(false);
    setUserName("");
    setUserEmail("");
  };

  const toggleMobileSidebar = () => {
    setIsMobileSidebarOpen(!isMobileSidebarOpen);
  };

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
    </>
  );
}

export default Header;
