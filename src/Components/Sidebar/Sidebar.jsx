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
  FaMoon,
  FaSun,
  FaDollarSign,
  FaBell,
  FaTimes,
  FaSignOutAlt,
} from "react-icons/fa";
import styles from "./Sidebar.module.css";
import { auth } from "../../auth";

// ===== Componente de item do menu =====
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

// ===== Sidebar principal =====
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
  const [userName, setUserName] = useState("");
  const [userEmail, setUserEmail] = useState("");
  // Removed unused isLoggedIn state to fix ESLint warning
  const [showUserModal, setShowUserModal] = useState(false);

  const [userType, setUserType] = useState(null);

  const handleLogout = async () => {
    await auth.logout();
    setUserName("");
    setUserEmail("");
    setShowUserModal(false);
    setUserType(null);
    navigate("/");
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

  useEffect(() => {
    const user = auth.getUser();
    if (user) {
      setUserName(user.nome);
      setUserEmail(user.email);
      setUserType(user.papel);
    } else {
      setUserName("");
      setUserEmail("");
      setUserType(null);
    }
  }, []);
  
  // Removed sync useEffect related to isLoggedIn state

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
        setIsCollapsed(true);
      }
    },
    [navigate]
  );

  const handleDollarClick = () => {
    // Implementar lógica para o clique no ícone de dólar
    console.log("Ícone de dólar clicado!");
  };

  const handleBellClick = () => {
    // Implementar lógica para o clique no ícone de sino
    console.log("Ícone de sino clicado!");
  };

  // Menu definitions for admin and usuario (client)
  const adminMenuItems = [
    { icon: <FaHome />, label: "Dashboard", path: "/dashboardadmin" },
    { icon: <FaUser />, label: "Empresas", path: "/empresasadmin" },
    { icon: <FaDollarSign />, label: "Planos e Assinaturas", path: "/planosadmin" },
    { icon: <FaMoneyBillWave />, label: "Vendas/Transações", path: "/vendas" },
    { icon: <FaFileInvoiceDollar />, label: "Faturamento Mensal", path: "/faturamento" },
    { icon: <FaClock />, label: "Pagamentos Pendentes", path: "/pendentes" },
    { icon: <FaCheckCircle />, label: "Pagamentos Recebidos", path: "/recebidos" },
    { icon: <FaChartBar />, label: "Relatórios", path: "/relatorios" },
    { icon: <FaBell />, label: "Notificações", path: "/notificacoes" },
    { icon: <FaHeadset />, label: "Suporte", path: "/suporte" },
    { icon: <FaUserCircle />, label: "Perfil/Admin", path: "/perfil" },
    { icon: <FaBars />, label: "Logs do Sistema", path: "/logs" },
    { icon: <FaChartBar />, label: "Configurações Avançadas", path: "/configuracoes" },
  ];

  const usuarioMenuItems = [
    { icon: <FaHome />, label: "Dashboard", path: "/dashboardcliente" },
    { icon: <FaUser />, label: "Meu Perfil", path: "/perfilcliente" },
    { icon: <FaMoneyBillWave />, label: "Meus Pedidos", path: "/meuspedidos" },
    { icon: <FaBell />, label: "Notificações", path: "/notificacoes" },
    { icon: <FaHeadset />, label: "Suporte", path: "/suporte" },
    { icon: <FaChartBar />, label: "Faturamento", path: "/faturamentocliente" },
  ];

  const menuItems = userType === 'admin' ? adminMenuItems : usuarioMenuItems;

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

          <div className={styles.profileCircle} onClick={() => setShowUserModal(!showUserModal)}>
            {userName ? userName.charAt(0).toUpperCase() : <FaUser size={20} />}
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
                    <p className={styles.modalUserPapel}>{userType}</p>
                    <p className={styles.modalUserEmail}>{userEmail}</p>
                  </div>
                </div>
                <div className={styles.modalBody}>
                  <button
                    className={`${styles.modalButton} ${styles.modalButtonSecondary}`}
                    onClick={handleLogout}
                  >
                    <FaSignOutAlt />
                    <span>Sair</span>
                  </button>
                </div>
              </div>
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
                    if (window.innerWidth <= 768) setMobileOpen(false);
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
        </main>
      </div>
    </>
  );
}

export default Sidebar;
