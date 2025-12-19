import { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  FaMoon,
  FaSun,
  FaShoppingCart,
  FaSignInAlt,
  FaSignOutAlt,
  FaTachometerAlt,
  FaBars,
  FaTimes,
  FaUser,
  FaCog,
  FaCheckCircle,
  FaExclamationCircle,
} from "react-icons/fa";
import styles from "./Header.module.css";
import { auth, api } from "../../auth";

function Header() {
  const navigate = useNavigate();
  const location = useLocation();
  const dropdownRef = useRef(null);

  const isAuthenticated = auth.isAuthenticated();
  const user = auth.getUser();
  const userRole = auth.getRole();

  const [theme, setTheme] = useState(() => localStorage.getItem("theme") || "dark");
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [isSubscriptionActive, setIsSubscriptionActive] = useState(false);
  const [isSubscriptionExpired, setIsSubscriptionExpired] = useState(false);
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);
  const [cartItemCount, setCartItemCount] = useState(0);

  // Função para carregar quantidade de itens no carrinho
  const loadCartItemCount = async () => {
    try {
      const { data } = await api.get('/api/carrinho');
      const totalItems = data.itens?.reduce((sum, item) => sum + (item.quantidade || 0), 0) || 0;
      setCartItemCount(totalItems);
    } catch (error) {
      console.error("Erro ao carregar carrinho:", error);
      setCartItemCount(0);
    }
  };

  useEffect(() => {
    async function checkSubscription() {
      if (userRole === 'usuario') {
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
      loadCartItemCount();
    } else {
      setIsSubscriptionActive(false);
      setIsSubscriptionExpired(false);
      setCartItemCount(0);
    }
  }, [isAuthenticated, userRole]);

  useEffect(() => {
    if (!isAuthenticated) return;

    const interval = setInterval(() => {
      loadCartItemCount();
    }, 2000);

    return () => clearInterval(interval);
  }, [isAuthenticated]);

  // Fechar dropdown ao clicar fora
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsProfileDropdownOpen(false);
      }
    }

    if (isProfileDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isProfileDropdownOpen]);

  // Fechar dropdown ao mudar de rota
  useEffect(() => {
    setIsProfileDropdownOpen(false);
  }, [location.pathname]);

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

  const toggleProfileDropdown = () => {
    setIsProfileDropdownOpen(!isProfileDropdownOpen);
  };

  const handleProfileClick = () => {
    navigate('/perfil');
    setIsProfileDropdownOpen(false);
  };

  const handleLogoutClick = () => {
    auth.logout();
    setIsProfileDropdownOpen(false);
  };

  const handleLogout = () => {
    auth.logout();
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
          <button
            className={styles.iconButton}
            onClick={toggleTheme}
            title={theme === "dark" ? "Modo Claro" : "Modo Escuro"}
            aria-label="Alternar tema"
          >
            {theme === "dark" ? <FaSun /> : <FaMoon />}
          </button>

          <button
            className={styles.iconButton}
            onClick={handleCarrinhoClick}
            title="Carrinho de Compras"
            aria-label="Carrinho"
          >
            <FaShoppingCart />
            {cartItemCount > 0 && (
              <span className={styles.cartBadge}>{cartItemCount > 99 ? '99+' : cartItemCount}</span>
            )}
          </button>

          {isAuthenticated ? (
            <>
              {(isSubscriptionActive || isSubscriptionExpired || userRole === 'admin') && (
                <button
                  className={styles.painelButton}
                  onClick={handlePainelClick}
                  title="Acessar Painel"
                >
                  <FaTachometerAlt /> Painel
                </button>
              )}

              <div className={styles.profileWrapper} ref={dropdownRef}>
                <div
                  className={`${styles.profileContainer} ${isProfileDropdownOpen ? styles.active : ''}`}
                  onClick={toggleProfileDropdown}
                >
                  <div className={styles.profileCircle}>
                    {userName ? userName.charAt(0).toUpperCase() : "U"}
                    {userRole === 'usuario' && (
                      <span className={`${styles.statusIndicator} ${isSubscriptionActive ? styles.statusActive : styles.statusExpired}`}>
                        {isSubscriptionActive ? <FaCheckCircle /> : <FaExclamationCircle />}
                      </span>
                    )}
                  </div>
                  <div className={styles.profileInfo}>
                    <span className={styles.profileName}>{userName}</span>
                    <span className={styles.profileEmail}>{userEmail}</span>
                  </div>
                </div>

                {isProfileDropdownOpen && (
                  <div className={styles.profileDropdown}>
                    <div className={styles.dropdownHeader}>
                      <div className={styles.dropdownAvatar}>
                        {userName ? userName.charAt(0).toUpperCase() : "U"}
                      </div>
                      <div className={styles.dropdownUserInfo}>
                        <strong>{userName}</strong>
                        <small>{userEmail}</small>
                        <span className={styles.dropdownRole}>
                          {userRole === 'admin' ? 'Administrador' : 'Cliente'}
                        </span>
                      </div>
                    </div>
                    <div className={styles.dropdownDivider}></div>
                    {(isSubscriptionActive || isSubscriptionExpired || userRole === 'admin') && (
                      <button className={styles.dropdownItem} onClick={handleProfileClick}>
                        <FaUser /> Meu Perfil
                      </button>
                    )}
                    {userRole === 'usuario' && (
                      <div className={styles.subscriptionStatus}>
                        {isSubscriptionActive ? (
                          <span className={styles.statusActive}>
                            <FaCheckCircle /> Assinatura Ativa
                          </span>
                        ) : isSubscriptionExpired ? (
                          <span className={styles.statusExpired}>
                            <FaExclamationCircle /> Assinatura Vencida
                          </span>
                        ) : (
                          <span className={styles.statusInactive}>
                            <FaExclamationCircle /> Sem Assinatura
                          </span>
                        )}
                      </div>
                    )}
                    <div className={styles.dropdownDivider}></div>
                    <button className={styles.dropdownItem} onClick={handleLogoutClick}>
                      <FaSignOutAlt /> Sair
                    </button>
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
              {isAuthenticated ? (
                <div className={styles.mobileUserInfo}>
                  <div className={styles.mobileUserAvatar}>
                    {userName ? userName.charAt(0).toUpperCase() : "U"}
                  </div>
                  <div className={styles.userInfoText}>
                    <div className={styles.userInfoLine}>{userName}</div>
                    <div className={styles.userInfoLine}>{userEmail}</div>
                    {userRole && (
                      <div className={styles.mobileUserPapel}>
                        {userRole === 'admin' ? 'Administrador' : 'Cliente'}
                      </div>
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
              {isAuthenticated && userRole === 'usuario' && (
                <div className={styles.mobileSubscriptionBanner}>
                  {isSubscriptionActive ? (
                    <div className={styles.bannerActive}>
                      <FaCheckCircle />
                      <div>
                        <strong>Assinatura Ativa</strong>
                        <small>Acesso completo ao sistema</small>
                      </div>
                    </div>
                  ) : isSubscriptionExpired ? (
                    <div className={styles.bannerExpired}>
                      <FaExclamationCircle />
                      <div>
                        <strong>Assinatura Vencida</strong>
                        <small>Renove para continuar usando</small>
                      </div>
                    </div>
                  ) : (
                    <div className={styles.bannerInactive}>
                      <FaExclamationCircle />
                      <div>
                        <strong>Sem Assinatura</strong>
                        <small>Adquira um plano</small>
                      </div>
                    </div>
                  )}
                </div>
              )}

              <div className={styles.menuSection}>
                <span className={styles.menuSectionTitle}>Navegação</span>
                {isAuthenticated ? (
                  (isSubscriptionActive || isSubscriptionExpired || userRole === 'admin') && (
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
                <button className={styles.mobileSidebarItem} onClick={() => { handleCarrinhoClick(); toggleMobileSidebar(); }}>
                  <FaShoppingCart />
                  <span>Carrinho</span>
                  {cartItemCount > 0 && (
                    <span className={styles.mobileBadge}>{cartItemCount}</span>
                  )}
                </button>
              </div>

              <div className={styles.menuSection}>
                <span className={styles.menuSectionTitle}>Configurações</span>
                <button className={styles.mobileSidebarItem} onClick={() => { toggleTheme(); toggleMobileSidebar(); }}>
                  {theme === "dark" ? <FaSun /> : <FaMoon />}
                  <span>Tema {theme === "dark" ? "Claro" : "Escuro"}</span>
                </button>
                {isAuthenticated && (isSubscriptionActive || isSubscriptionExpired || userRole === 'admin') && (
                  <button className={styles.mobileSidebarItem} onClick={() => { navigate('/perfil'); toggleMobileSidebar(); }}>
                    <FaUser />
                    <span>Meu Perfil</span>
                  </button>
                )}
              </div>
            </div>

            {isAuthenticated && (
              <div className={styles.mobileSidebarFooter}>
                <button className={styles.logoutButton} onClick={handleLogout}>
                  <FaSignOutAlt />
                  <span>Sair da Conta</span>
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