import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  FaUser,
  FaLock,
  FaEye,
  FaEyeSlash,
} from "react-icons/fa";
import { useAuth } from "../../context/useAuthHook"; // Importa o hook useAuth
import styles from "./Login.module.css";
import Spinner from "../../Components/Spinner/Spinner"; // Mantém o Spinner para o estado de loading do form

function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated, userRole, login, loading: authLoading } = useAuth(); // Obtém estados e funções do useAuth

  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [mostrarSenha, setMostrarSenha] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false); // Loading local para o form de login

  // Redirecionamento após login bem-sucedido
  useEffect(() => {
    if (!authLoading && isAuthenticated) {
      const locationState = location.state;
      if (userRole === 'admin') {
        navigate("/dashboardadmin"); // Redireciona admins para o dashboard admin
      } else if (locationState?.from === "/carrinho" || locationState?.planId) {
        navigate("/carrinho", { state: locationState });
      } else {
        navigate("/dashboardcliente"); // Redireciona usuários comuns para o dashboard cliente
      }
    }
  }, [isAuthenticated, userRole, authLoading, navigate, location.state]);

  const toggleSenha = () => setMostrarSenha((prev) => !prev);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      // O login do AuthContext já deve lidar com a sessão existente
      await login(email, senha);
      // A navegação agora é tratada no useEffect acima
    } catch (err) {
      const errorMessage = err.response?.data?.error || "Erro ao fazer login. Verifique suas credenciais.";
      setError(errorMessage);
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

  if (authLoading) {
    return <Spinner />; // Mostra spinner enquanto o AuthContext está carregando
  }

  // Se já autenticado, o useEffect acima já deveria ter redirecionado.
  // Caso contrário, mostra o formulário de login.
  return (
    <div className={styles.loginPage}>
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