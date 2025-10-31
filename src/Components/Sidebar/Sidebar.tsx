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

interface MenuItemProps {
  icon: React.ReactNode;
  label: string;
  isActive: boolean;
  isCollapsed: boolean;
  onClick: () => void;
}

const MenuItem = memo(function MenuItem({
  icon,
  label,
  isActive,
  isCollapsed,
  onClick,
}: MenuItemProps) {
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

interface SidebarProps {
  children?: React.ReactNode;
  isCollapsed?: boolean;
  setIsCollapsed?: (val: boolean) => void;
}


function Sidebar({ children }: SidebarProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const sidebarRef = useRef<HTMLDivElement | null>(null);
  const [mobileOpen, setMobileOpen] = useState<boolean>(false);

  const [isCollapsed, setIsCollapsed] = useState<boolean>(() => {
    const stored = localStorage.getItem("menuCollapsed");
    return stored === "true";
  });

  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const [theme, setTheme] = useState<"dark" | "light">(
    () => (localStorage.getItem("theme") as "dark" | "light") || "dark"
  );

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("theme", theme);
  }, [theme]);

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
    (path: string) => {
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
    (path: string) => {
      navigate(path);
      if (window.innerWidth <= 768) {
        setIsCollapsed(true);
      }
    },
    [navigate]
  );

  const menuItems = [
    { icon: <FaHome />, label: "Dashboard", path: "/dashboardadmin" }, // Visão geral do sistema
    { icon: <FaUser />, label: "Empresas", path: "/empresasadmin" }, // Gestão de empresas/clientes do sistema
    { icon: <FaDollarSign />, label: "Planos e Assinaturas", path: "/planos" }, // Configuração de planos e preços
    { icon: <FaMoneyBillWave />, label: "Vendas/Transações", path: "/vendas" }, // Histórico de vendas e transações
    { icon: <FaFileInvoiceDollar />, label: "Faturamento Mensal", path: "/faturamento" }, // Receita por período
    { icon: <FaClock />, label: "Pagamentos Pendentes", path: "/pendentes" }, // Contas a receber
    { icon: <FaCheckCircle />, label: "Pagamentos Recebidos", path: "/recebidos" }, // Contas quitadas
    { icon: <FaChartBar />, label: "Relatórios", path: "/relatorios" }, // Gráficos, estatísticas, KPIs
    { icon: <FaBell />, label: "Notificações", path: "/notificacoes" }, // Avisos, alertas do sistema
    { icon: <FaHeadset />, label: "Suporte", path: "/suporte" }, // Chamados de empresas/clientes
    { icon: <FaUserCircle />, label: "Perfil/Admin", path: "/perfil" }, // Configurações do administrador
    { icon: <FaBars />, label: "Logs do Sistema", path: "/logs" }, // Histórico de ações do sistema
    { icon: <FaChartBar />, label: "Configurações Avançadas", path: "/configuracoes" }, // Ajustes gerais do sistema
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

        <div className={styles.logoContainer}>
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

          <div className={styles.profileCircle}>
            <FaUser size={20} />
          </div>
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

        <main className={`${styles.pageContent} ${!isMobile && isCollapsed ? styles.collapsed : ""}`}>
          {children}
        </main>
      </div>
    </>
  );
}

export default Sidebar;
