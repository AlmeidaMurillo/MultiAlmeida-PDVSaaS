import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { FaFacebook, FaInstagram, FaLinkedin, FaTwitter } from "react-icons/fa";
import { FiMail, FiPhone, FiMapPin } from "react-icons/fi";
import styles from "./LandingPage.module.css";
import Header from "../../Components/Header/Header";
import { auth, api } from "../../auth";

function LandingPage() {
  const navigate = useNavigate();

  const [periodoSelecionado, setPeriodoSelecionado] = useState("mensal");
  const [planos, setPlanos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleAssinar = (planId) => {
    if (auth.isAuthenticated()) {
      navigate("/carrinho", { state: { planId, periodo: periodoSelecionado } });
    } else {
      navigate("/login", { state: { planId, periodo: periodoSelecionado } });
    }
  };

  const carregarPlanos = useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      // Solicita planos agrupados do backend
      const response = await api.get("/api/planos?grouped=true"); 
      const todosPlanosAgrupados = response.data.planos || [];

      // Filtra e formata os planos para o período selecionado
      const planosFiltrados = [];
      todosPlanosAgrupados.forEach((planoGrupo) => {
        const periodoData = planoGrupo[periodoSelecionado];
        if (planoGrupo.nome && periodoData && periodoData.beneficios && periodoData.beneficios.length > 0) {
          planosFiltrados.push({
            id: periodoData.id, // O ID agora é do plano específico do período
            nome: planoGrupo.nome,
            periodo: periodoSelecionado,
            preco: Number(periodoData.preco),
            duracaoDias: periodoData.duracaoDias,
            beneficios: periodoData.beneficios,
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
    </div>
  );
}

export default LandingPage;
