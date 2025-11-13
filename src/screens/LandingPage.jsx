import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  FaMoon,
  FaSun,
  FaFacebook,
  FaInstagram,
  FaLinkedin,
  FaTwitter,
} from "react-icons/fa";
import styles from "./LandingPage.module.css";
import api from "../auth";

function LandingPage() {
  const navigate = useNavigate();

  const [theme, setTheme] = useState(localStorage.getItem("theme") || "dark");
  const [periodoSelecionado, setPeriodoSelecionado] = useState("mensal");
  const [planos, setPlanos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("theme", theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === "dark" ? "light" : "dark"));
  };

  const handlePainelClick = () => {
    navigate("/login");
  };

  const handleAssinar = (planId) => {
    navigate("/login", { state: { planId, periodo: periodoSelecionado } });
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

  return (
    <div className={styles.landingPage}>
      <header className={styles.headerTop}>
        <div className={styles.logoContainer}>
          <div className={styles.logo}>MultiAlmeida</div>
          <h2 className={styles.subtitle}>ERP SaaS PDV</h2>
        </div>

        <div className={styles.actionsContainer}>
          <button className={styles.painelButton} onClick={handlePainelClick}>
            Painel
          </button>

          <button className={styles.iconButton} onClick={toggleTheme}>
            {theme === "dark" ? <FaSun /> : <FaMoon />}
          </button>
        </div>
      </header>

      <main className={styles.mainContent}>
        <section className={styles.hero}>
          <div className={styles.heroContent}>
            <h1 className={styles.heroTitle}>Sistema ERP SaaS PDV Completo</h1>
            <p className={styles.heroSubtitle}>
              Gerencie seu negócio com eficiência. Controle vendas, estoque,
              finanças e muito mais em uma plataforma moderna e intuitiva.
            </p>
          </div>

          <div className={styles.heroImage}>
            <div className={styles.mockup}>
              <img
                src="https://img.freepik.com/vetores-premium/conexao-de-conceito-de-link-minimalista-de-link-infinito-de-vetor-de-logotipo_790567-270.jpg"
                alt="Sistema ERP SaaS Ponto De Vendas"
                className={styles.mockupImage}
              />
            </div>
          </div>
        </section>

        <section className={styles.planos}>
          <h2 className={styles.sectionTitle}>Escolha seu Plano</h2>

          <div className={styles.periodoSelector}>
            <label htmlFor="periodo">Período:</label>
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
                    {plano.preco.toFixed(2)}
                  </span>
                  <span className={styles.periodo}>/{periodoSelecionado}</span>
                </div>
                <div className={styles.duracao}>
                  {plano.duracaoDias} dias de acesso
                </div>
                <ul>
                  {plano.beneficios.map((beneficio, i) => (
                    <li key={i}>{beneficio}</li>
                  ))}
                </ul>
                <button
                  className={styles.planoButton}
                  onClick={() => handleAssinar(plano.id)}
                >
                  Assinar
                </button>
              </div>
            ))}
          </div>
        </section>

        <section className={styles.contato}>
          <h2 className={styles.sectionTitle}>Entre em Contato</h2>

          <div className={styles.contatoContent}>
            <div className={styles.contatoInfo}>
              <h3>MultiAlmeida ERP SaaS Ponto De Vendas</h3>
              <p>
                Transformando a gestão de negócios com tecnologia de ponta.
              </p>
              <div className={styles.contatoDetalhes}>
                <p>
                  <strong>Email:</strong> contato@multialmeida.com
                </p>
                <p>
                  <strong>Telefone:</strong> (11) 9999-9999
                </p>
                <p>
                  <strong>Endereço:</strong> São Paulo, SP
                </p>
              </div>
            </div>

            <div className={styles.redesSociais}>
              <h3>Redes Sociais</h3>
              <div className={styles.redesIcons}>
                <a href="#" className={styles.redeIcon}>
                  <FaFacebook />
                </a>
                <a href="#" className={styles.redeIcon}>
                  <FaInstagram />
                </a>
                <a href="#" className={styles.redeIcon}>
                  <FaLinkedin />
                </a>
                <a href="#" className={styles.redeIcon}>
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
