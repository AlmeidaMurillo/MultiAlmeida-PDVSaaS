import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { FaUser, FaLock, FaEye, FaEyeSlash, FaMoon, FaSun } from "react-icons/fa";
import { auth } from "../../auth";
import styles from "./Login.module.css";

function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [mostrarSenha, setMostrarSenha] = useState(false);
  const [inputFocused, setInputFocused] = useState(false);
  const [theme, setTheme] = useState(localStorage.getItem("theme") || "dark");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("theme", theme);
  }, [theme]);

  const toggleTema = () => {
    setTheme((prev) => (prev === "dark" ? "light" : "dark"));
  };

  const toggleSenha = () => setMostrarSenha((prev) => !prev);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      await auth.loginUsuario(email, senha);
      const locationState = location.state;
      if (locationState?.planId) {
        navigate("/carrinho", { state: locationState });
      } else {
        navigate("/dashboard");
      }
    } catch (err) {
      console.error("Erro no login:", err);
      if (err && err.response) {
        if (err.response.status === 400 && err.response.data?.errors?.length > 0) {
          setError(err.response.data.errors[0].msg);
        } else if (err.response.status === 401 && err.response.data?.error) {
          setError(err.response.data.error);
        } else {
          setError("Erro ao fazer login");
        }
      } else {
        setError("Erro ao fazer login");
      }
      localStorage.removeItem("token");
      localStorage.removeItem("empresas");
      localStorage.removeItem("empresaAtual");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const handleResize = () => {
      const isKeyboardOpen = window.innerHeight < 500;
      setInputFocused(isKeyboardOpen);
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return (
    <div className={`${styles.loginContainer} ${inputFocused ? styles.keyboardOpen : ""}`}>
      <div className={styles.themeToggle} onClick={toggleTema}>
        {theme === "dark" ? <FaSun /> : <FaMoon />}
      </div>

      <div className={styles.loginBox}>
        <h1 className={styles.companyName}>MultiAlmeida</h1>
        <h1 className={styles.title}>PDV SaaS</h1>
        <h2 className={styles.subtitle}>Painel Cliente</h2>

        <p className={styles.subtitle}>
          Acesse sua conta para gerenciar sua empresa
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

          {error && <p className={styles.error}>{error}</p>}

          <button type="submit" className={styles.button} disabled={loading}>
            {loading ? "Entrando..." : "Entrar"}
          </button>
        </form>

        <p className={styles.registroLink}>
          Não tem conta? <a href="#" onClick={(e) => { e.preventDefault(); navigate(`/registro?planId=${location.state?.planId || ''}&periodo=${location.state?.periodo || 'mensal'}`); }}>Registre-se</a>
        </p>
      </div>

      <footer className={styles.footer}>
        <p className={styles.rights}>
          © {new Date().getFullYear()} <strong>MultiAlmeida</strong>. Todos os direitos reservados.
        </p>
      </footer>
    </div>
  );
}


export default Login;