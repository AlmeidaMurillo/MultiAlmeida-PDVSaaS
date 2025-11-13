import { useState, useEffect } from "react";
import { useSearchParams, useNavigate, useLocation } from "react-router-dom";
import { FaUser, FaLock, FaEye, FaEyeSlash, FaMoon, FaSun } from "react-icons/fa";
import { auth } from "../../auth";
import styles from "./Registro.module.css";

function Registro() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const planIdFromUrl = searchParams.get("planId");
  const periodoFromUrl = searchParams.get("periodo");

  const [nomeUsuario, setNomeUsuario] = useState("");
  const [emailUsuario, setEmailUsuario] = useState("");
  const [senhaUsuario, setSenhaUsuario] = useState("");
  const [confirmarSenha, setConfirmarSenha] = useState("");

  const [mostrarSenhaUsuario, setMostrarSenhaUsuario] = useState(false);
  const [mostrarSenhaConfirmar, setMostrarSenhaConfirmar] = useState(false);
  const [inputFocused, setInputFocused] = useState(false);
  const [theme, setTheme] = useState(localStorage.getItem("theme") || "dark");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("theme", theme);
  }, [theme]);


  useEffect(() => {
    const planId = searchParams.get("planId");
    const periodo = searchParams.get("periodo");

    if (!planId || !periodo) {
      navigate("/");

    }
  }, [searchParams, navigate]);


  const location = useLocation();

  useEffect(() => {
    setNomeUsuario("");
    setEmailUsuario("");
    setSenhaUsuario("");
    setConfirmarSenha("");
    setInputFocused(false);
    setMostrarSenhaUsuario(false);
    setMostrarSenhaConfirmar(false);
    setError("");
  }, [location.key]);

  const toggleTema = () => {
    setTheme((prev) => (prev === "dark" ? "light" : "dark"));
  };

  const toggleSenhaUsuario = () => setMostrarSenhaUsuario((prev) => !prev);
  const toggleSenhaConfirmar = () => setMostrarSenhaConfirmar((prev) => !prev);

  useEffect(() => {
    const handleResize = () => {
      const isKeyboardOpen = window.innerHeight < 500;
      setInputFocused(isKeyboardOpen);
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const validarDados = () => {
    if (!nomeUsuario || !emailUsuario || !senhaUsuario) {
      setError("Nome, email e senha do usuário são obrigatórios");
      return false;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(emailUsuario)) {
      setError("Email inválido");
      return false;
    }

    if (senhaUsuario !== confirmarSenha) {
      setError("As senhas não coincidem");
      return false;
    }

    if (senhaUsuario.length < 6) {
      setError("A senha deve ter no mínimo 6 caracteres");
      return false;
    }

    const senhaRegex = /^(?=.*[A-Za-z])(?=.*\d)/;
    if (!senhaRegex.test(senhaUsuario)) {
      setError("A senha deve conter pelo menos uma letra e um número");
      return false;
    }

    return true;
  };

  const handleProximo = async () => {
    if (loading) return;

    if (validarDados()) {
      setError("");
      setLoading(true);

      try {
        const response = await auth.criarConta(nomeUsuario, emailUsuario, senhaUsuario);
        console.log("Conta criada com sucesso:", response);

        navigate("/carrinho", {
          state: {
            planId: planIdFromUrl,
            periodo: periodoFromUrl,
          },
        });
      } catch (err) {
        console.error("Erro ao criar conta:", err);
        if (err?.response) {
          if (err.response.status === 409) {
            setError("Email já cadastrado");
          } else if (err.response.data?.errors) {
            setError(err.response.data.errors.map((e) => e.msg).join(", "));
          } else {
            setError(err.response.data?.error || "Erro ao criar conta");
          }
        } else {
          setError("Erro ao criar conta");
        }
      } finally {
        setLoading(false);
      }
    }
  };

  return (
    <div className={`${styles.registroContainer} ${inputFocused ? styles.keyboardOpen : ""}`}>
      <div className={styles.themeToggle} onClick={toggleTema}>
        {theme === "dark" ? <FaSun /> : <FaMoon />}
      </div>

      <div className={styles.registroBox}>
        <h1 className={styles.companyName}>MultiAlmeida</h1>
        <h1 className={styles.title}>PDV SaaS</h1>
        <h2 className={styles.subtitle}>Criar Conta</h2>
        <p className={styles.subtitle}>Preencha os dados para criar sua conta e empresa</p>

        <div className={styles.form}>
          <h3 className={styles.sectionTitle}>Dados do Responsável</h3>

          <div className={styles.inputWrapper}>
            <FaUser className={styles.inputIcon} />
            <input
              type="text"
              placeholder="Nome Completo *"
              className={styles.input}
              value={nomeUsuario}
              onChange={(e) => setNomeUsuario(e.target.value)}
              onFocus={() => setInputFocused(true)}
              onBlur={() => setInputFocused(false)}
              required
            />
          </div>

          <div className={styles.inputWrapper}>
            <FaUser className={styles.inputIcon} />
            <input
              type="email"
              placeholder="Email *"
              className={styles.input}
              value={emailUsuario}
              onChange={(e) => setEmailUsuario(e.target.value)}
              onFocus={() => setInputFocused(true)}
              onBlur={() => setInputFocused(false)}
              required
            />
          </div>

          <div className={styles.inputWrapper}>
            <FaLock className={styles.inputIcon} />
            <input
              type={mostrarSenhaUsuario ? "text" : "password"}
              placeholder="Senha *"
              className={styles.input}
              value={senhaUsuario}
              onChange={(e) => setSenhaUsuario(e.target.value)}
              onFocus={() => setInputFocused(true)}
              onBlur={() => setInputFocused(false)}
              required
            />
            <button type="button" onClick={toggleSenhaUsuario} className={styles.eyeIcon}>
              {mostrarSenhaUsuario ? <FaEyeSlash /> : <FaEye />}
            </button>
          </div>

          <div className={styles.inputWrapper}>
            <FaLock className={styles.inputIcon} />
            <input
              type={mostrarSenhaConfirmar ? "text" : "password"}
              placeholder="Confirmar Senha *"
              className={styles.input}
              value={confirmarSenha}
              onChange={(e) => setConfirmarSenha(e.target.value)}
              onFocus={() => setInputFocused(true)}
              onBlur={() => setInputFocused(false)}
              required
            />
            <button type="button" onClick={toggleSenhaConfirmar} className={styles.eyeIcon}>
              {mostrarSenhaConfirmar ? <FaEyeSlash /> : <FaEye />}
            </button>
          </div>

          {error && <p className={styles.error}>{error}</p>}

          <button type="button" onClick={handleProximo} className={styles.button} disabled={loading}>
            {loading ? "Criando conta..." : "Próximo"}
          </button>
        </div>
      </div>

      <footer className={styles.footer}>
        <p className={styles.rights}>
          © {new Date().getFullYear()} <strong>MultiAlmeida</strong>. Todos os direitos reservados.
        </p>
      </footer>
    </div>
  );
}

export default Registro;