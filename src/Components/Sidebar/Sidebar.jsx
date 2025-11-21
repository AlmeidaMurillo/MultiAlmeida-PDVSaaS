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
  const [isLoggedIn, setIsLoggedIn] = useState(!!localStorage.getItem("jwt_token"));
  const [showUserModal, setShowUserModal] = useState(false);

  const handleLogout = async () => {
    await auth.logout();
    setIsLoggedIn(false);
    setUserName("");
    setUserEmail("");
    setShowUserModal(false);
    navigate("/"); // Redirect to landing page after logout
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
    if (isLoggedIn) {
      const fetchUser = async () => {
        try {
          const user = await auth.getUserDetails();
          setUserName(user.nome);
          setUserEmail(user.email);
        } catch (error) {
          console.error('Erro ao buscar usuário:', error);
        }
      };
      fetchUser();
    }
  }, [isLoggedIn]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === "dark" ? "light" : "dark"));
  };

  useEffect(() => {
    const sidebar = sidebarRef.current;
    if (!sidebar) return;

    const updateOverflow = () => {
      const needsScroll = sidebar.scrollHeight > sidebar.clientHeight;
      sidebar.style.overflowY = needsScroll ? "auto" : "hidden";
    };

    const resizeObserver = new ResizeObserver(updateOverflow);
    resizeObserver.observe(sidebar);

    window.addEventListener("resize", updateOverflow);
    updateOverflow();

    return () => {
      resizeObserver.disconnect();
      window.removeEventListener("resize", updateOverflow);
    };
  }, []);

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

  const menuItems = [
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
          <h2 className={styles.subtitle}>PDV SaaS</h2>
        </div>

        <div className={styles.iconsContainer}>
          <button className={styles.iconButton} onClick={toggleTheme}>
            {theme === "dark" ? <FaSun /> : <FaMoon />}
          </button>

          <div className={styles.iconWrapper}>
            <FaDollarSign />
            <span className={`${styles.badge} ${styles.red}`}>0</span>
          </div>

          <div className={styles.iconWrapper}>
            <FaBell />
            <span className={`${styles.badge} ${styles.black}`}>0</span>
          </div>

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
          <nav>
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
          className={`${styles.pageContent} ${
            !isMobile && isCollapsed ? styles.collapsed : ""
          }`}
        >
          {children}
        </main>
      </div>
    </>
  );
}

export default Sidebar;
