import { useState, useEffect } from "react";
import { FaMoon, FaSun, FaSignOutAlt } from "react-icons/fa";
import { auth } from "../../auth";
import styles from "./DashboardCliente.module.css";

function DashboardCliente() {
  const [theme, setTheme] = useState(localStorage.getItem("theme") || "dark");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("theme", theme);
  }, [theme]);

  useEffect(() => {
    setLoading(false);
  }, []);

  const toggleTema = () => {
    setTheme((prev) => (prev === "dark" ? "light" : "dark"));
  };

  const handleLogout = () => {
    auth.logout();
  };

  if (loading) return <div>Carregando...</div>;

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div className={styles.headerLeft}>
          <h1 className={styles.companyName}>MultiAlmeida PDV SaaS</h1>
        </div>

        <div className={styles.headerRight}>
          <button className={styles.iconButton} onClick={toggleTema}>
            {theme === "dark" ? <FaSun /> : <FaMoon />}
          </button>

          <button onClick={handleLogout} className={styles.logoutBtn}>
            <FaSignOutAlt />
          </button>
        </div>
      </header>

      <main className={styles.main}>
        <div className={styles.welcomeCard}>
          <h2>Bem-vindo ao seu Dashboard!</h2>
          <p>Você está acessando o painel do cliente.</p>
        </div>

        <div className={styles.dashboardGrid}>
          <div className={styles.card}>
            <h3>Vendas do Dia</h3>
            <p className={styles.metric}>R$ 0,00</p>
          </div>

          <div className={styles.card}>
            <h3>Produtos em Estoque</h3>
            <p className={styles.metric}>0</p>
          </div>

          <div className={styles.card}>
            <h3>Clientes Cadastrados</h3>
            <p className={styles.metric}>0</p>
          </div>

          <div className={styles.card}>
            <h3>Relatórios</h3>
            <p>Em breve...</p>
          </div>
        </div>
      </main>
    </div>
  );
}

export default DashboardCliente;