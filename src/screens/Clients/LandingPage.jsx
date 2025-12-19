import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { FaFacebook, FaInstagram, FaLinkedin, FaTwitter } from "react-icons/fa";
import { FiMail, FiPhone, FiMapPin } from "react-icons/fi";
import { Calendar, Check } from "lucide-react";
import styles from "./LandingPage.module.css";
import Header from "../../Components/Header/Header";
import Footer from "../../Components/Footer/Footer";
import { auth, api } from "../../auth";

function LandingPage() {
  const navigate = useNavigate();

  const [periodoSelecionado, setPeriodoSelecionado] = useState("mensal");
  const [todosPlanos, setTodosPlanos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    document.title = "MultiAlmeida | ERP SaaS PDV";
  }, []);

  const periodosOptions = [
    { label: "Mensal", key: "mensal", icon: "📅" },
    { label: "Trimestral", key: "trimestral", icon: "📊" },
    { label: "Semestral", key: "semestral", icon: "📈" },
    { label: "Anual", key: "anual", icon: "🏆" },
  ];

  const handleAssinar = (planId) => {
    if (auth.isAuthenticated()) {
      navigate("/carrinho", { state: { planId, periodo: periodoSelecionado } });
    } else {
      navigate("/login", { state: { planId, periodo: periodoSelecionado } });
    }
  };

  const planosFiltrados = todosPlanos.filter(p => p.periodo === periodoSelecionado);
  
  const periodoAtual = periodosOptions.find(p => p.key === periodoSelecionado);

  useEffect(() => {
    const carregarPlanos = async () => {
      try {
        setLoading(true);
        setError("");
        const response = await api.get("/api/planos");
        setTodosPlanos(response.data.planos || []);
      } catch (err) {
        console.error("Erro ao carregar planos:", err);
        setError("Erro ao carregar planos");
      } finally {
        setLoading(false);
      }
    };

    carregarPlanos();
  }, []);

  return (
    <div className={styles.landingPage}>
      <Header />

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
            Planos flexíveis que se adaptam ao crescimento da sua empresa. Sem taxas escondidas.
          </p>

          <div className={styles.periodoSelector}>
            <label htmlFor="periodo-select" className={styles.periodoLabel}>
              <Calendar size={20} />
              <span>Selecione o período:</span>
            </label>
            <select
              id="periodo-select"
              value={periodoSelecionado}
              onChange={(e) => setPeriodoSelecionado(e.target.value)}
              className={styles.periodoSelect}
            >
              {periodosOptions.map((periodo) => (
                <option key={periodo.key} value={periodo.key}>
                  {periodo.icon} {periodo.label}
                </option>
              ))}
            </select>
          </div>

          {loading && (
            <div className={styles.loading}>
              <div className={styles.spinner}></div>
              <p>Carregando planos...</p>
            </div>
          )}

          {error && <p className={styles.error}>{error}</p>}

          {!loading && planosFiltrados.length === 0 && (
            <div className={styles.emptyState}>
              <Calendar size={48} />
              <p>Nenhum plano disponível para o período selecionado</p>
            </div>
          )}

          {!loading && planosFiltrados.length > 0 && periodoAtual && (
            <div className={styles.periodosContainer}>
              <div className={styles.blocoperiodo}>
                <div className={styles.periodoHeader}>
                  <span className={styles.periodoIcon}>{periodoAtual.icon}</span>
                  <h3 className={styles.periodoTitle}>Planos {periodoAtual.label}</h3>
                  <span 
                    className={styles.periodoCount}
                    data-periodo={periodoAtual.key}
                  >
                    {planosFiltrados.length} {planosFiltrados.length === 1 ? 'opção' : 'opções'}
                  </span>
                </div>

                <div className={styles.planosGrid}>
                  {planosFiltrados.map((plano) => (
                    <div key={plano.id} className={styles.planoCard}>
                      <div className={styles.cardHeader}>
                        <h4 className={styles.planoNome}>{plano.nome}</h4>
                        <div 
                          className={styles.planoBadge}
                          data-periodo={periodoAtual.key}
                        >
                          {periodoAtual.label}
                        </div>
                      </div>

                      <div className={styles.preco}>
                        <span className={styles.cifrao}>R$</span>
                        <span className={styles.valor}>
                          {parseFloat(plano.preco).toFixed(2)}
                        </span>
                        <span className={styles.periodo}>/{plano.periodo}</span>
                      </div>

                      <div className={styles.duracao}>
                        <Calendar size={14} />
                        <span>Acesso por {plano.duracao_dias} dias</span>
                      </div>

                      <ul className={styles.beneficiosList}>
                        {plano.beneficios && plano.beneficios.map((beneficio, i) => (
                          <li key={i}>
                            <Check size={18} />
                            <span>{beneficio}</span>
                          </li>
                        ))}
                      </ul>

                      <button
                        className={styles.planoButton}
                        onClick={() => handleAssinar(plano.id)}
                        data-periodo={periodoAtual.key}
                      >
                        Assinar Agora
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
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
                  <FiPhone /> <span>(11) 97054-3189</span>
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
      <Footer />
    </div>
  );
}

export default LandingPage;
