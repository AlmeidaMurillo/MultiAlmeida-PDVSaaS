import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  FaMoon,
  FaSun,
  FaFacebook,
  FaInstagram,
  FaLinkedin,
  FaTwitter,
  FaShoppingCart,
  FaSignInAlt,
  FaTachometerAlt,
} from "react-icons/fa";
import { FiMail, FiPhone, FiMapPin } from "react-icons/fi";
import styles from "./LandingPage.module.css";
import api from "../../auth";
import { auth } from "../../auth";

function LandingPage() {
  const navigate = useNavigate();

  const [theme, setTheme] = useState(localStorage.getItem("theme") || "dark");
  const [periodoSelecionado, setPeriodoSelecionado] = useState("mensal");
  const [planos, setPlanos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userName, setUserName] = useState("");
  const [userEmail, setUserEmail] = useState("");
  const [showUserModal, setShowUserModal] = useState(false);

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("theme", theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === "dark" ? "light" : "dark"));
  };

  const handlePainelClick = () => {
    if (isLoggedIn) {
      navigate("/dashboard");
    } else {
      navigate("/login");
    }
  };

  const handleAssinar = (planId) => {
    if (auth.isLoggedInCliente()) {
      navigate("/carrinho", { state: { planId, periodo: periodoSelecionado } });
    } else {
      navigate("/login", { state: { planId, periodo: periodoSelecionado } });
    }
  };

  const handleCarrinhoClick = () => {
    if (auth.isLoggedInCliente()) {
      navigate("/carrinho");
    } else {
      navigate("/login", { state: { from: "/carrinho" } });
    }
  };

  const handleLogout = async () => {
    await auth.logout();
    setIsLoggedIn(false);
    setUserName("");
    setUserEmail("");
    setShowUserModal(false);
  };

  const carregarPlanos = useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      const response = await api.get("/api/planos");
      const todosPlanos = response.data.planos || [];

      const planosFiltrados = [];
      todosPlanos.forEach((planoGrupo) => {
        const periodo = planoGrupo[periodoSelecionado];
        const nome = planoGrupo.nome;

        if (periodo && periodo.beneficios && periodo.beneficios.length > 0) {
          planosFiltrados.push({
            id: periodo.id,
            nome: nome,
            periodo: periodoSelecionado,
            preco: Number(periodo.preco),
            duracaoDias: periodo.duracaoDias,
            beneficios: periodo.beneficios,
          });
        }
      });

      setPlanos(planosFiltrados);
    } catch (err) {
      console.error("Erro ao carregar planos:", err);
      setError("Erro ao carregar planos");
    } finally {
      setLoading(false);
    }
  }, [periodoSelecionado]);

  useEffect(() => {
    carregarPlanos();
  }, [carregarPlanos]);

  useEffect(() => {
    const checkAuth = async () => {
      await auth.update();
      setIsLoggedIn(auth.isLoggedInCliente());
      if (auth.isLoggedInCliente()) {
        try {
          const userDetails = await auth.getUserDetails();
          setUserName(userDetails.nome);
          setUserEmail(userDetails.email);
        } catch (err) {
          console.error("Erro ao carregar detalhes do usuário:", err);
        }
      }
    };
    checkAuth();
  }, []);

  return (
    <div className={styles.landingPage}>
      <header className={styles.headerTop}>
        <div className={styles.logoContainer}>
          <div className={styles.logo}>MultiAlmeida</div>
          <h2 className={styles.subtitle}>ERP SaaS PDV</h2>
        </div>

        <div className={styles.actionsContainer}>
          <button className={styles.iconButton} onClick={toggleTheme}>
            {theme === "dark" ? <FaSun /> : <FaMoon />}
          </button>
          <button className={styles.iconButton} onClick={handleCarrinhoClick}>
            <FaShoppingCart />
          </button>
          {isLoggedIn ? (
            <>
              <button className={styles.painelButton} onClick={handlePainelClick}>
                <FaTachometerAlt /> Painel
              </button>
              <div className={styles.profileContainer}>
                <div className={styles.profileCircle} onClick={() => setShowUserModal(!showUserModal)}>
                  {userName ? userName.charAt(0).toUpperCase() : "U"}
                </div>

                {showUserModal && (
                  <div className={styles.userModalOverlay} onClick={() => setShowUserModal(false)}>
                    <div className={styles.userModal} onClick={(e) => e.stopPropagation()}>
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
                          className={`${styles.modalButton} ${styles.modalButtonPrimary}`}
                          onClick={() => navigate("/dashboard")}
                        >
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="24"
                            height="24"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          >
                            <path d="M12 20V10" />
                            <path d="M18 20V4" />
                            <path d="M6 20V16" />
                          </svg>
                          <span>Ver Painel</span>
                        </button>
                        <button
                          className={`${styles.modalButton} ${styles.modalButtonSecondary}`}
                          onClick={handleLogout}
                        >
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="24"
                            height="24"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          >
                            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                            <polyline points="16 17 21 12 16 7" />
                            <line x1="21" y1="12" x2="9" y2="12" />
                          </svg>
                          <span>Sair</span>
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </>
          ) : (
            <button className={styles.loginButton} onClick={() => navigate("/login")}>
              <FaSignInAlt /> Login
            </button>
          )}
        </div>
      </header>

      <main className={styles.mainContent}>
        <section className={styles.hero}>
          <div className={styles.heroContent}>
            <h1 className={styles.heroTitle}>
              A Solução Definitiva para o seu Ponto de Venda
            </h1>
            <p className={styles.heroSubtitle}>
              Gerencie seu negócio com eficiência. Controle vendas, estoque,
              finanças e muito mais em uma plataforma moderna, intuitiva e
              integrada.
            </p>
            <button
              className={styles.loginButton}
              onClick={() => navigate("/login")}
            >
              Comece Agora
            </button>
          </div>

          <div className={styles.heroImage}>
            <div className={styles.mockup}>
              <svg
                width="100%"
                height="100%"
                viewBox="0 0 400 300"
                preserveAspectRatio="xMidYMid slice"
                xmlns="http://www.w3.org/2000/svg"
              >
                <defs>
                  <linearGradient
                    id="grad1"
                    x1="0%"
                    y1="0%"
                    x2="100%"
                    y2="100%"
                  >
                    <stop
                      offset="0%"
                      style={{ stopColor: "var(--hover-bg)", stopOpacity: 1 }}
                    />
                    <stop
                      offset="100%"
                      style={{ stopColor: "var(--active-bg)", stopOpacity: 1 }}
                    />
                  </linearGradient>
                  <filter id="blur">
                    <feGaussianBlur in="SourceGraphic" stdDeviation="5" />
                  </filter>
                </defs>
                <rect width="100%" height="100%" fill="url(#grad1)" />
                <circle
                  cx="50"
                  cy="50"
                  r="100"
                  fill="rgba(255,255,255,0.1)"
                  filter="url(#blur)"
                />
                <circle
                  cx="350"
                  cy="250"
                  r="80"
                  fill="rgba(255,255,255,0.08)"
                  filter="url(#blur)"
                />
                <path
                  d="M-50 150 Q 150 0, 250 150 T 450 150"
                  stroke="rgba(255,255,255,0.2)"
                  strokeWidth="2"
                  fill="none"
                />
                <path
                  d="M-50 200 Q 200 300, 450 200"
                  stroke="rgba(255,255,255,0.15)"
                  strokeWidth="2"
                  fill="none"
                />
              </svg>
            </div>
          </div>
        </section>

        <section className={styles.planos}>
          <h2 className={styles.sectionTitle}>Escolha o Plano Ideal</h2>
          <p className={styles.sectionSubtitle}>
            Planos flexíveis que se adaptam ao crescimento da sua empresa. Sem
            taxas escondidas.
          </p>

          <div className={styles.periodoSelector}>
            <label htmlFor="periodo">Período de Cobrança:</label>
            <select
              id="periodo"
              value={periodoSelecionado}
              onChange={(e) => setPeriodoSelecionado(e.target.value)}
              className={styles.select}
            >
              <option value="mensal">Mensal</option>
              <option value="trimestral">Trimestral</option>
              <option value="semestral">Semestral</option>
              <option value="anual">Anual</option>
            </select>
          </div>

          {loading && <p>Carregando planos...</p>}
          {error && <p className={styles.error}>{error}</p>}

          <div className={styles.planosGrid}>
            {planos.map((plano) => (
              <div key={plano.id} className={styles.planoCard}>
                <h3>{plano.nome}</h3>
                <div className={styles.preco}>
                  <span className={styles.cifrao}>R$</span>
                  <span className={styles.valor}>
                    {plano.preco.toFixed(2).replace(".", ",")}
                  </span>
                  <span className={styles.periodo}>/{periodoSelecionado}</span>
                </div>
                <div className={styles.duracao}>
                  Acesso por {plano.duracaoDias} dias
                </div>
                <ul className={styles.beneficiosList}>
                  {plano.beneficios.map((beneficio, i) => (
                    <li key={i}>
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="24"
                        height="24"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <polyline points="20 6 9 17 4 12"></polyline>
                      </svg>
      
                      <span>{beneficio}</span>
                    </li>
                  ))}
                </ul>
                <button
                  className={styles.planoButton}
                  onClick={() => handleAssinar(plano.id)}
                >
                  Assinar Agora
                </button>
              </div>
            ))}
          </div>
        </section>

        <section className={styles.contato}>
          <h2 className={styles.sectionTitle}>Fale Conosco</h2>
          <p className={styles.sectionSubtitle}>
            Tem alguma dúvida? Nossa equipe está pronta para ajudar você a
            crescer.
          </p>

          <div className={styles.contatoContent}>
            <div className={styles.contatoInfo}>
              <div className={styles.contatoDetalhes}>
                <p>
                  <FiMail /> <span>contato@multialmeida.com</span>
                </p>
                <p>
                  <FiPhone /> <span>(11) 9999-9999</span>
                </p>
                <p>
                  <FiMapPin /> <span>São Paulo, SP</span>
                </p>
              </div>
            </div>

            <div className={styles.redesSociais}>
              <h3>Nossas Redes</h3>
              <div className={styles.redesIcons}>
                <a
                  href="#"
                  className={styles.redeIcon}
                  aria-label="Facebook"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <FaFacebook />
                </a>
                <a
                  href="#"
                  className={styles.redeIcon}
                  aria-label="Instagram"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <FaInstagram />
                </a>
                <a
                  href="#"
                  className={styles.redeIcon}
                  aria-label="LinkedIn"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <FaLinkedin />
                </a>
                <a
                  href="#"
                  className={styles.redeIcon}
                  aria-label="Twitter"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <FaTwitter />
                </a>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}

export default LandingPage;
