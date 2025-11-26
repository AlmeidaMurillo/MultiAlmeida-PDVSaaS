import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  FaUser,
  FaLock,
  FaEye,
  FaEyeSlash,
  FaMoon,
  FaSun,
} from "react-icons/fa";
import { auth } from "../../auth";
import styles from "./Login.module.css";
import Spinner from "../../Components/Spinner/Spinner"; // Importar o Spinner

function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [mostrarSenha, setMostrarSenha] = useState(false);
  const [theme, setTheme] = useState(localStorage.getItem("theme") || "dark");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true); // Estado de verificação

  useEffect(() => {
    // Redireciona usuários logados (não-admins) para a página inicial.
    const checkAndRedirect = async () => {
      await auth.update(); // Garante que o estado de autenticação está atualizado
      const papel = auth.getPapel();
      if (papel && papel !== 'admin') {
        navigate('/');
        // A navegação já desmonta o componente, não precisa mudar o estado.
      } else {
        // Se não houver redirecionamento, permite a renderização da página.
        setIsCheckingAuth(false);
      }
    };
    checkAndRedirect();
  }, [navigate]);

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("theme", theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === "dark" ? "light" : "dark"));
  };

  const toggleSenha = () => setMostrarSenha((prev) => !prev);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      await auth.login(email, senha);
      
      const locationState = location.state;
      if (locationState?.from === "/carrinho" || locationState?.planId) {
        navigate("/carrinho", { state: locationState });
      } else {
        navigate("/");
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
    } finally {
      setLoading(false);
    }
  };


  const handleRegistroClick = (e) => {
    e.preventDefault();
    const { planId, periodo } = location.state || {};
    if (planId && periodo) {
      navigate(`/registro?planId=${planId}&periodo=${periodo}`);
    } else {
      navigate('/registro');
    }
  };

  // Enquanto a verificação estiver ocorrendo, exibe o spinner.
  if (isCheckingAuth) {
    return <Spinner />;
  }

  return (
    <div className={styles.loginPage}>
      <header className={styles.headerTop}>
        <div className={styles.logoContainer} onClick={() => navigate("/")}>
          <div className={styles.logo}>MultiAlmeida</div>
          <h2 className={styles.subtitle}>ERP SaaS PDV</h2>
        </div>

        <div className={styles.actionsContainer}>
          <button className={styles.iconButton} onClick={toggleTheme}>
            {theme === "dark" ? <FaSun /> : <FaMoon />}
          </button>
        </div>
      </header>

      <main className={styles.mainContent}>
        <section className={styles.hero}>
          <div className={styles.heroContent}>
            <h1 className={styles.heroTitle}>
              Acesse sua Conta
            </h1>
            <p className={styles.heroSubtitle}>
              Entre no painel para gerenciar sua empresa com eficiência.
            </p>

            <div className={styles.loginForm}>
              <form className={styles.form} onSubmit={handleLogin}>
                <div className={styles.inputWrapper}>
                  <FaUser className={styles.inputIcon} />
                  <input
                    type="email"
                    placeholder="E-mail"
                    className={styles.input}
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
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
                    required
                  />
                  <span
                    onClick={toggleSenha}
                    className={styles.eyeIcon}
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
                Não tem conta? <a href="#" onClick={handleRegistroClick}>Registre-se</a>
              </p>
            </div>
          </div>


        </section>
      </main>
    </div>
  );
}

export default Login;