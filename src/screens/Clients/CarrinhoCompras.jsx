import React, { useState, useEffect, useCallback } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  FaArrowLeft,
  FaShoppingCart,
  FaTrash,
} from "react-icons/fa";
import api from "../../auth";
import { auth } from "../../auth";
import styles from "./CarrinhoCompras.module.css";
import Header from "../../Components/Header/Header";

export default function CarrinhoCompras() {
  const location = useLocation();
  const navigate = useNavigate();
  const { planId, periodo } = location.state || {};

  const [itensCarrinho, setItensCarrinho] = useState([]);
  const [planos, setPlanos] = useState([]);

  const [error, setError] = useState("");
  const [cupom, setCupom] = useState("");
  const [cupomAplicado, setCupomAplicado] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const carregarPlanos = useCallback(async () => {
    try {
      const response = await api.get("/api/planos");
      setPlanos(response.data.planos || []);
    } catch (err) {
      console.error("Erro ao carregar planos:", err);
    }
  }, []);

  const carregarCarrinho = useCallback(async () => {
    try {
      setError("");
      const response = await api.get("/api/carrinho");
      setItensCarrinho(response.data.itens || []);
    } catch (err) {
      console.error("Erro ao carregar carrinho:", err);
      setError("Erro ao carregar carrinho");
    }
  }, []);

  useEffect(() => {
    // A verificação agora é síncrona. Se não estiver autenticado, redireciona para o login.
    if (!auth.isAuthenticated()) {
      navigate("/login", { state: { from: "/carrinho", planId, periodo } });
      return; // Interrompe a execução do hook
    }

    // Se autenticado, carrega os dados.
    carregarPlanos();
    carregarCarrinho();

    if (planId && periodo) {
      const adicionarAoCarrinho = async () => {
        try {
          await api.post("/api/carrinho", { planoId: planId, periodo });
          carregarCarrinho(); // Recarrega o carrinho após adicionar o item
        } catch (err) {
          console.error("Erro ao adicionar ao carrinho:", err);
        }
      };
      adicionarAoCarrinho();
    }
  }, [navigate, planId, periodo, carregarCarrinho, carregarPlanos]);

  const removerItem = async (itemId) => {
    try {
      await api.delete(`/api/carrinho/${itemId}`);
      carregarCarrinho();
    } catch (err) {
      console.error("Erro ao remover item:", err);
      setError("Erro ao remover item");
    }
  };

  const alterarPlanoPeriodo = async (itemId, novoPlanoId, novoPeriodo) => {
    try {
      await api.delete(`/api/carrinho/${itemId}`);
      await api.post("/api/carrinho", { planoId: novoPlanoId, periodo: novoPeriodo });
      carregarCarrinho();
    } catch (err) {
      console.error("Erro ao alterar plano/período:", err);
      setError("Erro ao alterar plano/período");
    }
  };

  const aplicarCupom = () => {
    if (cupom.trim()) {
      setCupomAplicado(cupom.trim());
      setCupom("");
    }
  };

  const removerCupom = () => {
    setCupomAplicado(null);
  };

  const handleContinuar = async () => {
    if (itensCarrinho.length === 0) return;
    setIsLoading(true);
    setError("");

    try {
      // O backend agora lê o carrinho, então não precisamos enviar dados
      const response = await api.post("/api/payments/initiate");
      const { paymentId } = response.data;
      if (paymentId) {
        navigate(`/payment/${paymentId}`);
      } else {
        setError("Não foi possível iniciar o pagamento. Tente novamente.");
      }
    } catch (err) {
      console.error("Erro ao iniciar pagamento:", err);
      setError(
        err.response?.data?.message ||
          "Erro ao iniciar pagamento. Verifique seu carrinho e tente novamente."
      );
    } finally {
      setIsLoading(false);
    }
  };

  const calcularTotal = () => {
    return itensCarrinho.reduce((total, item) => {
      const planoInfo = planos.find(p => p[item.periodo] && p[item.periodo].id === item.plano_id);
      const preco = planoInfo ? Number(planoInfo[item.periodo].preco) * item.quantidade : 0;
      return total + preco;
    }, 0);
  };

  return (
    <div className={styles.container}>
      <Header />

      {/* Header */}
      <div className={styles.header}>
        <div className={styles.headerContent}>
          <div className={styles.headerLeft}>
            <button className={styles.backButton} onClick={() => navigate("/")}><FaArrowLeft /></button>
            <div className={styles.titleContainer}>
              <h1 className={styles.title}>Seu Carrinho</h1>
              <p className={styles.subtitle1}>Revise seus itens antes de continuar</p>
            </div>
          </div>
          <div className={styles.badge}>
            {itensCarrinho.length} {itensCarrinho.length === 1 ? 'item' : 'itens'}
          </div>
        </div>
      </div>

      {/* Conteúdo */}
      <div className={styles.content}>
        {error && <div className={styles.error}>{error}</div>}

        {itensCarrinho.length > 0 ? (
          <div className={styles.grid}>
            <div className={styles.itemsList}>
              <div className={styles.itemsHeader}>
                <h2>Itens no Carrinho</h2>
                <p>Gerencie seus produtos e veja os descontos aplicados</p>
              </div>

              {itensCarrinho.map((item) => {
                const plano = planos.find(p => p.mensal?.id === item.plano_id || p.trimestral?.id === item.plano_id || p.semestral?.id === item.plano_id || p.anual?.id === item.plano_id);
                const periodoInfo = plano ? plano[item.periodo] : null;

                return (
                  <div key={item.id} className={styles.itemCard}>
                    <div className={styles.itemFlex}>
                      <div className={styles.itemInfo}>
                        <button
                          className={styles.removeButton}
                          onClick={() => removerItem(item.id)}
                        >
                          <FaTrash />
                        </button>
                        <div className={styles.itemHeader}>
                          <div className={styles.selectsContainer}>
                            <label className={styles.selectLabel}>Plano</label>
                            <select
                              className={styles.planoSelect}
                              value={plano?.nome || ''}
                              onChange={(e) => {
                                const novoPlanoNome = e.target.value;
                                const novoPlano = planos.find(p => p.nome === novoPlanoNome);
                                if (novoPlano) {
                                  const novoPeriodoInfo = novoPlano[item.periodo];
                                  if (novoPeriodoInfo) {
                                    alterarPlanoPeriodo(item.id, novoPeriodoInfo.id, item.periodo);
                                  }
                                }
                              }}
                            >
                              {planos.map((p) => (
                                <option key={p.nome} value={p.nome}>
                                  {p.nome}
                                </option>
                              ))}
                            </select>
                            <label className={styles.selectLabel}>Período</label>
                            <select
                              className={styles.periodoSelect}
                              value={item.periodo}
                              onChange={(e) => {
                                const novoPeriodo = e.target.value;
                                const novoPeriodoInfo = plano ? plano[novoPeriodo] : null;
                                if (novoPeriodoInfo) {
                                  alterarPlanoPeriodo(item.id, novoPeriodoInfo.id, novoPeriodo);
                                }
                              }}
                            >
                              {plano?.mensal && (
                                <option value="mensal">
                                  Mensal - R$ {plano.mensal.preco.toFixed(2)}
                                </option>
                              )}
                              {plano?.trimestral && (
                                <option value="trimestral">
                                  Trimestral - R$ {plano.trimestral.preco.toFixed(2)}
                                </option>
                              )}
                              {plano?.semestral && (
                                <option value="semestral">
                                  Semestral - R$ {plano.semestral.preco.toFixed(2)}
                                </option>
                              )}
                              {plano?.anual && (
                                <option value="anual">
                                  Anual - R$ {plano.anual.preco.toFixed(2)}
                                </option>
                              )}
                            </select>

                          </div>
                        </div>
                        <div className={styles.badgeContainer}>
                          <div>Duração: {periodoInfo?.duracaoDias || 0} dias</div>
                        </div>
                        {periodoInfo?.beneficios && (
                          <ul className={styles.beneficiosList}>
                            {periodoInfo.beneficios.map((beneficio, i) => (
                              <li key={i}>{beneficio}</li>
                            ))}
                          </ul>
                        )}
                      </div>
                      <div className={styles.itemPrice}>
                        <p className={styles.itemPriceValue}>
                          R${((periodoInfo?.preco || 0) * item.quantidade).toFixed(2)}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}

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
                  {itensCarrinho.map((item) => {
                    const planoInfo = planos.find(p => p[item.periodo] && p[item.periodo].id === item.plano_id);
                    const periodoInfo = planoInfo ? planoInfo[item.periodo] : null;
                    const subtotal = (periodoInfo?.preco || 0) * item.quantidade;

                    return (
                      <div key={item.id} className={styles.summaryItem}>
                        <span className={styles.summaryItemLabel}>
                          {planoInfo?.nome || 'Plano'} ({item.periodo})
                        </span>
                        <span className={styles.summaryItemValue}>R${subtotal.toFixed(2)}</span>
                      </div>
                    );
                  })}

                  {/* Campo Cupom */}
                  <div className={styles.cupom}>
                    <h4>Cupom de Desconto</h4>
                    <div className={styles.cupomInputGroup}>
                      <input
                        type="text"
                        placeholder="Digite seu cupom"
                        value={cupom}
                        onChange={(e) => setCupom(e.target.value)}
                        className={styles.cupomInput}
                      />
                      <button
                        className={styles.cupomButton}
                        onClick={aplicarCupom}
                        disabled={!cupom.trim()}
                      >
                        Aplicar
                      </button>
                    </div>
                    {cupomAplicado && (
                      <div className={styles.cupomAplicado}>
                        <span>🎉 Cupom "{cupomAplicado}" aplicado!</span>
                        <button
                          className={styles.removerCupomButton}
                          onClick={removerCupom}
                        >
                          ✕
                        </button>
                      </div>
                    )}
                  </div>

                  <div className={styles.totalFinal}>Total: R${calcularTotal().toFixed(2)}</div>

                  <button
                    className={styles.checkoutButton}
                    onClick={handleContinuar}
                    disabled={isLoading}
                  >
                    {isLoading ? "Processando..." : "Continuar para Pagamento"}
                  </button>
                  <div className={styles.garantia}>30 dias para pedir reembolso</div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className={styles.empty}>
            <div className={styles.emptyIcon}>
              <FaShoppingCart size={48} />
            </div>
            <h2>Seu carrinho está vazio</h2>
            <p>Adicione produtos ao carrinho para continuar</p>
            <button className={styles.explorarButton} onClick={() => navigate("/")}>Explorar Planos</button>
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
