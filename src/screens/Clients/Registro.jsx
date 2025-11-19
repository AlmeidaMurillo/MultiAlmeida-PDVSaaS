import { useState, useEffect } from "react";
import { useSearchParams, useNavigate, Link } from "react-router-dom";
import {
  FaUser,
  FaEnvelope,
  FaLock,
  FaEye,
  FaEyeSlash,
  FaMoon,
  FaSun,
} from "react-icons/fa";
import { auth } from "../../auth";
import styles from "./Registro.module.css"; 

function Registro() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const planIdFromUrl = searchParams.get("planId");
  const periodoFromUrl = searchParams.get("periodo");

  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [confirmarSenha, setConfirmarSenha] = useState("");

  const [mostrarSenha, setMostrarSenha] = useState(false);
  const [mostrarConfirmarSenha, setMostrarConfirmarSenha] = useState(false);

  const [theme, setTheme] = useState(localStorage.getItem("theme") || "dark");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("theme", theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === "dark" ? "light" : "dark"));
  };

  const toggleSenha = () => setMostrarSenha((prev) => !prev);
  const toggleConfirmarSenha = () => setMostrarConfirmarSenha((prev) => !prev);

  const validarDados = () => {
    if (!nome || !email || !senha) {
      setError("Nome, e-mail e senha são obrigatórios.");
      return false;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError("Formato de e-mail inválido.");
      return false;
    }
    if (senha !== confirmarSenha) {
      setError("As senhas não coincidem.");
      return false;
    }
    if (senha.length < 6) {
      setError("A senha deve ter no mínimo 6 caracteres.");
      return false;
    }
    const senhaRegex = /^(?=.*[A-Za-z])(?=.*\d)/;
    if (!senhaRegex.test(senha)) {
      setError("A senha deve conter letras e números.");
      return false;
    }
    return true;
  };

  const handleRegistro = async (e) => {
    e.preventDefault();
    if (!validarDados()) return;

    setLoading(true);
    setError("");

    try {
      await auth.criarConta(nome, email, senha);

      // Após criar a conta, faz login automaticamente
      await auth.loginUsuario(email, senha);

      if (planIdFromUrl && periodoFromUrl) {
        navigate("/carrinho", {
          state: {
            planId: planIdFromUrl,
            periodo: periodoFromUrl,
          },
        });
      } else {
        navigate("/");
      }
    } catch (err) {
      console.error("Erro no registro:", err);
      if (err?.response) {
        if (err.response.status === 409) {
          setError("Este e-mail já está cadastrado.");
        } else if (err.response.data?.errors) {
          setError(err.response.data.errors.map((e) => e.msg).join(", "));
        } else {
          setError(err.response.data?.error || "Ocorreu um erro ao criar a conta.");
        }
      } else {
        setError("Não foi possível conectar ao servidor.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.registroPage}>
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
            <h1 className={styles.heroTitle}>Crie sua Conta</h1>
            <p className={styles.heroSubtitle}>
              Comece a gerenciar seu negócio de forma simples e eficaz.
            </p>

            <div className={styles.registroForm}>
              <form className={styles.form} onSubmit={handleRegistro}>
                <div className={styles.inputWrapper}>
                  <FaUser className={styles.inputIcon} />
                  <input
                    type="text"
                    placeholder="Nome Completo"
                    className={styles.input}
                    value={nome}
                    onChange={(e) => setNome(e.target.value)}
                    required
                  />
                </div>
                <div className={styles.inputWrapper}>
                  <FaEnvelope className={styles.inputIcon} />
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
                  <span onClick={toggleSenha} className={styles.eyeIcon}>
                    {mostrarSenha ? <FaEyeSlash /> : <FaEye />}
                  </span>
                </div>
                <div className={styles.inputWrapper}>
                  <FaLock className={styles.inputIcon} />
                  <input
                    type={mostrarConfirmarSenha ? "text" : "password"}
                    placeholder="Confirmar Senha"
                    className={styles.input}
                    value={confirmarSenha}
                    onChange={(e) => setConfirmarSenha(e.target.value)}
                    required
                  />
                  <span onClick={toggleConfirmarSenha} className={styles.eyeIcon}>
                    {mostrarConfirmarSenha ? <FaEyeSlash /> : <FaEye />}
                  </span>
                </div>

                {error && <p className={styles.error}>{error}</p>}

                <button
                  type="submit"
                  className={styles.button}
                  disabled={loading}
                >
                  {loading ? "Criando conta..." : "Criar Conta"}
                </button>
              </form>

              <p className={styles.registroLink}>
                Já tem uma conta? <Link to="/login">Faça login</Link>
              </p>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}

export default Registro;