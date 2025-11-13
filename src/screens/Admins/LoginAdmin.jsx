import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { FaUser, FaLock, FaEye, FaEyeSlash, FaMoon, FaSun } from "react-icons/fa";
import styles from "./LoginAdmin.module.css";
import { auth } from "../../auth";

function LoginAdmin() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [mostrarSenha, setMostrarSenha] = useState(false);
  const [inputFocused, setInputFocused] = useState(false);
  const [theme, setTheme] = useState(
    () => localStorage.getItem("theme") || "dark"
  );

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("theme", theme);
  }, [theme]);

  const toggleTema = () => {
    setTheme((prev) => (prev === "dark" ? "light" : "dark"));
  };

  const toggleSenha = () => setMostrarSenha((prev) => !prev);

  useEffect(() => {
    const handleResize = () => {
      const isKeyboardOpen = window.innerHeight < 500;
      setInputFocused(isKeyboardOpen);
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const handleLogin = async (e) => {
    e.preventDefault();

    try {
      const response = await auth.loginAdmin(email, senha);
      if (response) {
        navigate("/dashboardadmin");
      }
    } catch (error) {
      const getErrorMessage = (err) => {
        if (!err) return "Erro ao fazer login";
        if (typeof err === "string") return err;
        if (err instanceof Error) return err.message;
        const axiosErr = err || {};
        return (
          axiosErr?.response?.data?.error ||
          axiosErr?.response?.data?.message ||
          "Erro ao fazer login"
        );
      };

      alert(getErrorMessage(error));
    }
  };

  return (
    <div
      className={`${styles.loginContainer} ${
        inputFocused ? styles.keyboardOpen : ""
      }`}
    >
      <div className={styles.themeToggle} onClick={toggleTema}>
        {theme === "dark" ? <FaSun /> : <FaMoon />}
      </div>

      <div className={styles.loginBox}>
        <h1 className={styles.companyName}>MultiAlmeida</h1>
        <h1 className={styles.title}>PDV SaaS</h1>
        <h2 className={styles.subtitle}>Painel Administrativo</h2>

        <p className={styles.subtitle}>
          Acesse sua conta para gerenciar os clientes e sistemas
        </p>

        <form className={styles.form} onSubmit={handleLogin}>
          <div className={styles.inputWrapper}>
            <FaUser className={styles.inputIcon} />
            <input
              type="email"
              placeholder="E-mail"
              className={styles.input}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onFocus={() => setInputFocused(true)}
              onBlur={() => setInputFocused(false)}
              required
            />
          </div>

          <div className={styles.inputWrapper}>
            <FaLock className={styles.inputIcon} />
            <input
              type={mostrarSenha ? "text" : "password"}
              placeholder="Senha"
              className={styles.input}
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
              onFocus={() => setInputFocused(true)}
              onBlur={() => setInputFocused(false)}
              required
            />
            <span
              onClick={toggleSenha}
              className={`${styles.eyeIcon} ${styles.eyeIconHover}`}
            >
              {mostrarSenha ? <FaEyeSlash /> : <FaEye />}
            </span>
          </div>

          <button type="submit" className={styles.button}>
            Entrar
          </button>
        </form>
      </div>

      <footer className={styles.footer}>
        <p className={styles.rights}>
          © {new Date().getFullYear()} <strong>MultiAlmeida</strong>. Todos os
          direitos reservados.
        </p>
      </footer>
    </div>
  );
}


export default LoginAdmin;