import React, { useState, useEffect, useRef, memo, useCallback } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  FaHome,
  FaUser,
  FaMoneyBillWave,
  FaChartBar,
  FaFileInvoiceDollar,
  FaClock,
  FaCheckCircle,
  FaHeadset,
  FaUserCircle,
  FaBars,
  FaClipboardList,
  FaMoon,
  FaSun,
  FaDollarSign,
  FaBell,
  FaTimes,
  FaSignOutAlt,
  FaTicketAlt,
} from "react-icons/fa";
import styles from "./Sidebar.module.css";
import { auth } from "../../auth";
import Footer from "../Footer/Footer";

const MenuItem = memo(function MenuItem({
  icon,
  label,
  isActive,
  isCollapsed,
  onClick,
}) {
  return (
    <li
      tabIndex={0}
      role="menuitem"
      onClick={onClick}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onClick();
        }
      }}
      className={`${styles.menuLi} ${isActive ? styles.active : ""}`}
    >
      <span className={styles.icon}>{icon}</span>
      {!isCollapsed && <span className={styles.label}>{label}</span>}
    </li>
  );
});

function Sidebar({ children }) {
  const navigate = useNavigate();
  const location = useLocation();
  const sidebarRef = useRef(null);

  const [mobileOpen, setMobileOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(() => {
    const stored = localStorage.getItem("menuCollapsed");
    return stored === "true";
  });

  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  const isAuthenticated = auth.isAuthenticated();
  const user = auth.getUser();
  const userRole = auth.getRole();

  const handleLogout = async () => {
    await auth.logout();
    setIsProfileDropdownOpen(false);
  };

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const [theme, setTheme] = useState(
    localStorage.getItem("theme") || "dark"
  );

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("theme", theme);
  }, [theme]);

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
  
  const toggleTheme = () => {
    setTheme((prev) => (prev === "dark" ? "light" : "dark"));
  };



  useEffect(() => {
    function handleResize() {
      if (window.innerWidth <= 768) {
        setIsCollapsed(true);
      } else {
        const stored = localStorage.getItem("menuCollapsed");
        setIsCollapsed(stored === "true");
      }
    }

    window.addEventListener("resize", handleResize);
    handleResize();
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const toggleSidebar = useCallback(() => {
    if (window.innerWidth <= 768) {
      setMobileOpen((prev) => !prev);
    } else {
      setIsCollapsed((prev) => {
        localStorage.setItem("menuCollapsed", String(!prev));
        return !prev;
      });
    }
  }, []);

  const isActive = useCallback(
    (path) => {
      if (path === "/emprestimos") {
        return (
          location.pathname === "/emprestimos" ||
          location.pathname === "/parcelas"
        );
      }
      return location.pathname === path;
    },
    [location.pathname]
  );

  const handleMenuItemClick = useCallback(
    (path) => {
      navigate(path);
      if (window.innerWidth <= 768) {
        setMobileOpen(false); // Fecha o sidebar mobile ao clicar em um item
      }
    },
    [navigate]
  );

  const handleDollarClick = () => {
    // Implementar lógica futura aqui
  };

  const handleBellClick = () => {
    // Implementar lógica futura aqui
  };

  const adminMenuItems = [
    { icon: <FaHome />, label: "Dashboard", path: "/dashboardadmin" },
    { icon: <FaUser />, label: "Empresas", path: "/empresasadmin" },
    { icon: <FaDollarSign />, label: "Planos e Assinaturas", path: "/planosadmin" },
    { icon: <FaTicketAlt />, label: "Cupons", path: "/cuponsadmin" },
    { icon: <FaMoneyBillWave />, label: "Vendas/Transações", path: "/vendas" },
    { icon: <FaFileInvoiceDollar />, label: "Faturamento Mensal", path: "/faturamento" },
    { icon: <FaClock />, label: "Pagamentos Pendentes", path: "/pendentes" },
    { icon: <FaCheckCircle />, label: "Pagamentos Recebidos", path: "/recebidos" },
    { icon: <FaChartBar />, label: "Relatórios", path: "/relatorios" },
    { icon: <FaBell />, label: "Notificações", path: "/notificacoes" },
    { icon: <FaHeadset />, label: "Suporte", path: "/suporte" },
    { icon: <FaUserCircle />, label: "Perfil/Admin", path: "/perfil" },
    { icon: <FaClipboardList />, label: "Logs do Sistema", path: "/logsadmin" },
    { icon: <FaChartBar />, label: "Configurações Avançadas", path: "/configuracoes" },
  ];

  const usuarioMenuItems = [
    { icon: <FaHome />, label: "Dashboard", path: "/dashboardcliente" },
    { icon: <FaUser />, label: "Meu Perfil", path: "/perfil" },
    { icon: <FaMoneyBillWave />, label: "Meus Pedidos", path: "/meuspedidos" },
    { icon: <FaBell />, label: "Notificações", path: "/notificacoes" },
    { icon: <FaHeadset />, label: "Suporte", path: "/suporte" },
    { icon: <FaChartBar />, label: "Faturamento", path: "/faturamentocliente" },
  ];

  const menuItems = userRole === 'admin' ? adminMenuItems : usuarioMenuItems;
  const userName = user?.nome || "";
  const userEmail = user?.email || "";

  useEffect(() => {
    document.documentElement.classList.add('sidebar-active-page');
    return () => {
      document.documentElement.classList.remove('sidebar-active-page');
    };
  }, []);

  return (
    <>
      <header className={styles.headerTop}>
        <button
          className={styles.menuButton}
          onClick={toggleSidebar}
          aria-label="Toggle menu"
          aria-expanded={!isCollapsed}
          aria-controls="sidebar-navigation"
        >
          <FaBars />
        </button>

        <div className={styles.logoContainer} onClick={() => navigate("/")}>
          <div className={styles.logo}>MultiAlmeida</div>
          <h2 className={styles.subtitle}>ERP PDV SaaS</h2>
        </div>

        <div className={styles.iconsContainer}>
          <button className={styles.iconButton} onClick={toggleTheme}>
            {theme === "dark" ? <FaSun /> : <FaMoon />}
          </button>

          <button className={styles.iconButton} onClick={handleDollarClick}>
            <FaDollarSign />
            <span className={`${styles.badge} ${styles.red}`}>0</span>
          </button>

          <button className={styles.iconButton} onClick={handleBellClick}>
            <FaBell />
            <span className={`${styles.badge} ${styles.black}`}>0</span>
          </button>

          {isAuthenticated && (
            <div className={styles.profileWrapper} ref={dropdownRef}>
              <div 
                className={styles.profileContainer}
                onClick={() => setIsProfileDropdownOpen(!isProfileDropdownOpen)}
              >
                <div className={styles.profileCircle}>
                  {userName ? userName.charAt(0).toUpperCase() : "U"}
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
                  <button className={styles.dropdownItem} onClick={() => { navigate('/perfil'); setIsProfileDropdownOpen(false); }}>
                    <FaUser /> Meu Perfil
                  </button>
                  <div className={styles.dropdownDivider}></div>
                  <button className={styles.dropdownItem} onClick={handleLogout}>
                    <FaSignOutAlt /> Sair
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </header>

      <div className={`${styles.container} ${isCollapsed ? styles.collapsed : ""}`}>
        <aside
          className={`
            ${styles.sidebar} 
            ${!isMobile && isCollapsed ? styles.collapsed : ""} 
            ${isMobile && mobileOpen ? styles.mobileOpen : ""}
          `}
          ref={sidebarRef}
        >
          <nav className={styles.nav}>
            <ul className={styles.menuUl}>
              {menuItems.map(({ icon, label, path }) => (
                <MenuItem
                  key={path}
                  icon={icon}
                  label={label}
                  isCollapsed={window.innerWidth <= 768 ? false : isCollapsed}
                  isActive={isActive(path)}
                  onClick={() => {
                    handleMenuItemClick(path);
                  }}
                />
              ))}
            </ul>
          </nav>
        </aside>

        <main
          className={`${styles.pageContent} ${!isMobile && isCollapsed ? styles.collapsed : ""
            }`}
        >
          {children}
          <Footer />
        </main>
      </div>
    </>
  );
}

export default Sidebar;
