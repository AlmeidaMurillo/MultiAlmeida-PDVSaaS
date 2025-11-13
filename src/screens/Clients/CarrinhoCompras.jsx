import React, { useState, useEffect, useCallback } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { FaMoon, FaSun, FaArrowLeft } from "react-icons/fa";
import api from "../../auth";
import styles from "./CarrinhoCompras.module.css";

export default function CarrinhoCompras() {
  const location = useLocation();
  const navigate = useNavigate();
  const { planId, periodo } = location.state || {};

  const [theme, setTheme] = useState(localStorage.getItem("theme") || "dark");
  const [planos, setPlanos] = useState([]);
  const [planoSelecionado, setPlanoSelecionado] = useState(planId || "");
  const [periodoSelecionado, setPeriodoSelecionado] = useState(periodo || "mensal");


  const [cupom, setCupom] = useState("");
  const [cupomAplicado, setCupomAplicado] = useState(false);
  const [descontoCupom, setDescontoCupom] = useState(0);

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("theme", theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === "dark" ? "light" : "dark"));
  };

  const carregarPlanos = useCallback(async () => {
    try {
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
    }
  }, [periodoSelecionado]);

  useEffect(() => {
    carregarPlanos();
  }, [carregarPlanos]);

  const planoAtual = planos.find(p => p.id === planoSelecionado);

  const handleContinuar = () => {
    navigate("/payment", { state: { planId: planoSelecionado, periodo: periodoSelecionado } });
  };

  const aplicarCupom = () => {
    if (cupom.toUpperCase() === "DESC10") {
      setDescontoCupom((planoAtual?.preco || 0) * 0.1);
      setCupomAplicado(true);
    } else {
      setDescontoCupom(0);
      setCupomAplicado(false);
    }
  };

  const totalFinal = (planoAtual?.preco || 0) - descontoCupom;

  return (
    <div className={styles.container}>
      {/* HeaderTop */}
      <header className={styles.headerTop}>
        <div className={styles.logoContainer}>
          <div className={styles.logo}>MultiAlmeida</div>
          <h2 className={styles.subtitle}>ERP SaaS PDV</h2>
        </div>

        <div className={styles.actionsContainer}>
          <button className={styles.iconButton} onClick={toggleTheme}>
            {theme === "dark" ? <FaSun /> : <FaMoon />}
          </button>
        </div>
      </header>

      {/* Header */}
      <div className={styles.header}>
        <div className={styles.headerContent}>
          <div className={styles.headerLeft}>
            <button className={styles.backButton} onClick={() => navigate(-1)}><FaArrowLeft /></button>
            <div>
              <h1 className={styles.title}>Seu Carrinho</h1>
              <p className={styles.subtitle}>Revise seus itens antes de continuar</p>
            </div>
          </div>
          <div className={styles.badge}>
            1 item
          </div>
        </div>
      </div>

      {/* Conteúdo */}
      <div className={styles.content}>
        {planoAtual ? (
          <div className={styles.grid}>
            <div className={styles.itemsList}>
              <div className={styles.itemsHeader}>
                <h2>Itens no Carrinho</h2>
                <p>Gerencie seus produtos e veja os descontos aplicados</p>
              </div>

              <div className={styles.itemCard}>
                <div className={styles.itemFlex}>
                  <div className={styles.itemInfo}>
                    <div className={styles.itemHeader}>
                      <div>
                        <h3 className={styles.itemTitle}>{planoAtual.nome}</h3>
                        <p className={styles.itemDescription}>Plano {planoAtual.periodo}</p>
                      </div>
                    </div>
                    <div className={styles.badgeContainer}>
                      <div>Duração: {planoAtual.duracaoDias} dias</div>
                    </div>
                    <ul>
                      {planoAtual.beneficios.map((beneficio, i) => (
                        <li key={i}>{beneficio}</li>
                      ))}
                    </ul>
                  </div>
                  <div className={styles.itemPrice}>
                    <p className={styles.itemPriceValue}>R${planoAtual.preco.toFixed(2)}</p>
                  </div>
                </div>
              </div>

              {/* Seleção de Plano e Período */}
              <div className={styles.selecao}>
                <h3>Alterar Plano</h3>
                <div className={styles.selecaoGrid}>
                  <div>
                    <label>Período:</label>
                    <select
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
                  <div>
                    <label>Plano:</label>
                    <select
                      value={planoSelecionado}
                      onChange={(e) => setPlanoSelecionado(e.target.value)}
                      className={styles.select}
                    >
                      {planos.map((plano) => (
                        <option key={plano.id} value={plano.id}>
                          {plano.nome} - R${plano.preco.toFixed(2)}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Banner */}
              <div className={styles.banner}>
                <h3>💎 Upgrade para plano anual e ganhe mais!</h3>
                <p>Economize até 40% com planos anuais e ganhe um domínio grátis</p>
              </div>
            </div>

            {/* Resumo */}
            <div className={styles.summary}>
              <div className={styles.summaryCard}>
                <h2 className={styles.summaryHeader}>Resumo do Pedido</h2>
                <div className={styles.summaryContent}>
                  <div className={styles.summaryItem}>
                    <span className={styles.summaryItemLabel}>{planoAtual.nome} ({planoAtual.periodo})</span>
                    <span className={styles.summaryItemValue}>R${planoAtual.preco.toFixed(2)}</span>
                  </div>

                  <div className={styles.cupom}>
                    <div className={styles.cupomInputGroup}>
                      <input
                        type="text"
                        placeholder="Digite o cupom"
                        value={cupom}
                        onChange={(e) => setCupom(e.target.value.toUpperCase())}
                      />
                      <button onClick={aplicarCupom}>Aplicar</button>
                    </div>
                    {cupomAplicado && descontoCupom > 0 && <div className={styles.cupomAplicado}>Cupom aplicado! -R${descontoCupom.toFixed(2)}</div>}
                  </div>

                  <div className={styles.totalFinal}>Total: R${totalFinal.toFixed(2)}</div>

                  <button className={styles.checkoutButton} onClick={handleContinuar}>Continuar para Pagamento</button>
                  <div className={styles.garantia}>30 dias para pedir reembolso</div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className={styles.empty}>
            <h2>Seu carrinho está vazio</h2>
            <p>Adicione produtos ao carrinho para continuar</p>
            <button onClick={() => navigate("/")}>Explorar Planos</button>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className={styles.footer}>
        <div className={styles.footerContent}>
          <div className={styles.footerSection}>
            <div className={styles.footerIcon}>🔒</div>
            <h3>Pagamento Seguro</h3>
            <p>Transações criptografadas e protegidas</p>
            <ul className={styles.featureList}>
              <li>SSL 256-bit</li>
              <li>Proteção PCI DSS</li>
              <li>Certificado de segurança</li>
            </ul>
          </div>
          <div className={styles.footerSection}>
            <div className={styles.footerIcon}>💳</div>
            <h3>Várias Formas de Pagamento</h3>
            <p>Cartão, PIX, boleto e mais</p>
            <ul className={styles.featureList}>
              <li>Cartão de crédito/débito</li>
              <li>PIX instantâneo</li>
              <li>Boleto bancário</li>
            </ul>
          </div>
          <div className={styles.footerSection}>
            <div className={styles.footerIcon}>⚡</div>
            <h3>Ativação Instantânea</h3>
            <p>Comece a usar imediatamente</p>
            <ul className={styles.featureList}>
              <li>Configuração automática</li>
              <li>Suporte 24/7</li>
              <li>Garantia de uptime</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
