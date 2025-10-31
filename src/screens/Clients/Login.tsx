import { useState, useEffect } from "react";
import { FaUser, FaLock, FaEye, FaEyeSlash, FaMoon, FaSun } from "react-icons/fa";
import styles from "./Login.module.css";

export default function Login() {
  const [email, setEmail] = useState<string>("");
  const [senha, setSenha] = useState<string>("");
  const [mostrarSenha, setMostrarSenha] = useState<boolean>(false);
  const [inputFocused, setInputFocused] = useState<boolean>(false);
  const [temaEscuro, setTemaEscuro] = useState(true);

  const toggleTema = () => {
    setTemaEscuro(prev => !prev);
    document.body.setAttribute("data-theme", temaEscuro ? "light" : "dark");
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

  return (
    <div className={`${styles.loginContainer} ${inputFocused ? styles.keyboardOpen : ""}`}>
      
      <div className={styles.themeToggle} onClick={toggleTema}>
        {temaEscuro ? <FaSun /> : <FaMoon />}
      </div>

      <div className={styles.loginBox}>
        <h1 className={styles.companyName}>MultiAlmeida</h1>
        <h1 className={styles.title}>PDV SaaS</h1>
        <h2 className={styles.subtitle}>Painel Cliente</h2>

        <p className={styles.subtitle}>
          Acesse sua conta para gerenciar sua empresa
        </p>

        <form className={styles.form}>
          
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
          © {new Date().getFullYear()} <strong>MultiAlmeida</strong>. Todos os direitos reservados.
        </p>
      </footer>
    </div>
  );
}
