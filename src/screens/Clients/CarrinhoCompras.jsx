import React, { useState, useEffect, useCallback } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  FaArrowLeft,
  FaShoppingCart,
  FaTrash,
} from "react-icons/fa";
import styles from "./CarrinhoCompras.module.css";
import Header from "../../Components/Header/Header";
import { auth, api } from "../../auth";

function CarrinhoCompras() {
  const location = useLocation();
  const navigate = useNavigate();
  const { planId, periodo } = location.state || {};

  const [itensCarrinho, setItensCarrinho] = useState([]);
  const [planos, setPlanos] = useState([]);

  const [error, setError] = useState("");
  const [cupom, setCupom] = useState("");
  const [cupomAplicado, setCupomAplicado] = useState(null);
  const [cupomValidando, setCupomValidando] = useState(false);
  const [cupomErro, setCupomErro] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (itensCarrinho.length > 0 && itensCarrinho[0].cupom_codigo) {
      const item = itensCarrinho[0];
      const valorTotal = itensCarrinho.reduce((total, i) => {
        return total + (Number(i.preco || 0) * i.quantidade);
      }, 0);
      
      setCupomAplicado({
        codigo: item.cupom_codigo,
        tipo: item.cupom_tipo,
        valor: item.cupom_valor,
        desconto: item.cupom_desconto,
        valor_original: valorTotal,
        valor_desconto: item.cupom_desconto,
        valor_final_compra: valorTotal - item.cupom_desconto,
        valor_final: valorTotal - item.cupom_desconto
      });
    } else {
      setCupomAplicado(null);
    }
  }, [itensCarrinho]);

  const carregarPlanos = useCallback(async () => {
    try {
      const response = await api.get("/api/planos?grouped=true"); 
      setPlanos(response.data.planos || []);
    } catch (err) {
      console.error("Erro ao carregar planos:", err);
      setError("Erro ao carregar planos disponíveis");
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
    if (!auth.isAuthenticated()) {
        navigate("/login", { state: { from: "/carrinho", planId, periodo } });
        return; 
    }

    carregarPlanos();
    carregarCarrinho();

    if (planId && periodo) {
      const adicionarAoCarrinho = async () => {
        try {
          await api.post("/api/carrinho", { planoId: planId, periodo });
          carregarCarrinho();
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
    setIsLoading(true);
    setError("");
    try {
      await api.delete(`/api/carrinho/${itemId}`);
      await api.post("/api/carrinho", { planoId: novoPlanoId, periodo: novoPeriodo });
      await carregarCarrinho();
    } catch (err) {
      console.error("Erro ao alterar plano/período:", err);
      const mensagemErro = err.response?.data?.error || "Erro ao alterar plano/período";
      setError(mensagemErro);
      alert(`Erro: ${mensagemErro}`);
    } finally {
      setIsLoading(false);
    }
  };

  const aplicarCupom = async () => {
    if (!cupom.trim()) return;
    
    setCupomValidando(true);
    setCupomErro("");
    
    try {
      const response = await api.post("/api/carrinho/cupom", {
        codigo: cupom.trim()
      });
      
      if (response.data.cupom) {
        setCupomAplicado({
          codigo: response.data.cupom.codigo,
          tipo: response.data.cupom.tipo,
          valor: response.data.cupom.valor,
          desconto: response.data.cupom.desconto,
          valor_original: response.data.cupom.valor_original,
          valor_desconto: response.data.cupom.valor_desconto,
          valor_final_compra: response.data.cupom.valor_final_compra,
          valor_final: response.data.cupom.valor_final
        });
        setCupom("");
        setCupomErro("");
        // Recarrega o carrinho para pegar os dados atualizados
        await carregarCarrinho();
      }
    } catch (err) {
      console.error("Erro ao aplicar cupom:", err);
      setCupomErro(err.response?.data?.error || "Cupom inválido");
      setCupomAplicado(null);
    } finally {
      setCupomValidando(false);
    }
  };

  const removerCupom = async () => {
    try {
      await api.delete("/api/carrinho/cupom");
      setCupomAplicado(null);
      setCupomErro("");
      // Recarrega o carrinho para limpar os dados do cupom
      await carregarCarrinho();
    } catch (err) {
      console.error("Erro ao remover cupom:", err);
    }
  };

  const handleContinuar = async () => {
    if (itensCarrinho.length === 0) return;
    setIsLoading(true);
    setError("");

    try {
      const response = await api.post("/api/payments/initiate");
      const { paymentId } = response.data;
      if (paymentId) {
        navigate(`/payment/${paymentId}`, { state: { fromCart: true } });
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

  const calcularTotal = useCallback(() => {
    const subtotal = itensCarrinho.reduce((total, item) => {
      const preco = Number(item.preco || 0) * item.quantidade;
      return total + preco;
    }, 0);
    
    if (cupomAplicado && cupomAplicado.valor_final !== undefined) {
      return cupomAplicado.valor_final;
    }
    
    return subtotal;
  }, [itensCarrinho, cupomAplicado]);

  return (
    <div className={styles.container}>
      <Header />

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
                const periodoInfo = {
                  id: item.plano_id,
                  preco: item.preco,
                  duracaoDias: item.duracao_dias,
                  beneficios: item.beneficios
                };
                


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
                            <label className={styles.selectLabel}>Período</label>
                            <select
                              className={styles.periodoSelect}
                              value={item.periodo}
                              onChange={(e) => {
                                const novoPeriodo = e.target.value;
                                if (!novoPeriodo) return;
                                
                                let planoParaUsar = planos.find(p => p.nome === item.nome);
                                let novoPeriodoInfo = planoParaUsar ? planoParaUsar[novoPeriodo] : null;
                                
                                if (!novoPeriodoInfo) {
                                  planoParaUsar = planos.find(p => p[novoPeriodo]);
                                  novoPeriodoInfo = planoParaUsar ? planoParaUsar[novoPeriodo] : null;
                                }
                                
                                if (novoPeriodoInfo) {
                                  alterarPlanoPeriodo(item.id, novoPeriodoInfo.id, novoPeriodo);
                                } else {
                                  alert(`Nenhum plano disponível para o período ${novoPeriodo}. Verifique se há planos cadastrados.`);
                                }
                              }}
                              disabled={isLoading}
                            >
                              <option value="">Selecione um período</option>
                              <option value="mensal">Mensal</option>
                              <option value="trimestral">Trimestral</option>
                              <option value="semestral">Semestral</option>
                              <option value="anual">Anual</option>
                            </select>
                            <label className={styles.selectLabel}>Plano ({item.periodo})</label>
                            <select
                              className={styles.planoSelect}
                              value={item.nome || ''}
                              onChange={(e) => {
                                const novoPlanoNome = e.target.value;
                                if (!novoPlanoNome) return;
                                
                                const novoPlano = planos.find(p => p.nome === novoPlanoNome);
                                
                                if (novoPlano) {
                                  const novoPeriodoInfo = novoPlano[item.periodo];
                                  
                                  if (novoPeriodoInfo) {
                                    alterarPlanoPeriodo(item.id, novoPeriodoInfo.id, item.periodo);
                                  } else {
                                    alert(`O plano ${novoPlanoNome} não possui período ${item.periodo}. Escolha outro período.`);
                                  }
                                } else {
                                  alert('Plano não encontrado. Tente recarregar a página.');
                                }
                              }}
                              disabled={isLoading}
                            >
                              <option value="">Selecione um plano</option>
                              {planos
                                .filter(p => p[item.periodo])
                                .map((p) => (
                                  <option key={p.nome} value={p.nome}>
                                    {p.nome} - R$ {p[item.periodo]?.preco?.toFixed(2) || '0.00'}
                                  </option>
                                ))}
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

              <div className={styles.banner}>
                <h3>💎 Upgrade para plano anual e ganhe mais!</h3>
                <p>Economize até 40% com planos anuais e ganhe um domínio grátis</p>
              </div>
            </div>

            <div className={styles.summary}>
              <div className={styles.summaryCard}>
                <h2 className={styles.summaryHeader}>Resumo do Pedido</h2>
                <div className={styles.summaryContent}>
                  {itensCarrinho.map((item) => {
                    const subtotal = (item.preco || 0) * item.quantidade;

                    return (
                      <div key={item.id} className={styles.summaryItem}>
                        <span className={styles.summaryItemLabel}>
                          {item.nome || 'Plano'} ({item.periodo})
                        </span>
                        <span className={styles.summaryItemValue}>R${subtotal.toFixed(2)}</span>
                      </div>
                    );
                  })}

                  <div className={styles.cupom}>
                    <h4>Cupom de Desconto</h4>
                    <div className={styles.cupomInputGroup}>
                      <input
                        type="text"
                        placeholder="Digite seu cupom"
                        value={cupom}
                        onChange={(e) => {
                          setCupom(e.target.value.toUpperCase());
                          setCupomErro("");
                        }}
                        onKeyPress={(e) => {
                          if (e.key === 'Enter' && cupom.trim()) {
                            aplicarCupom();
                          }
                        }}
                        className={styles.cupomInput}
                        disabled={cupomValidando}
                      />
                      <button
                        className={styles.cupomButton}
                        onClick={aplicarCupom}
                        disabled={!cupom.trim() || cupomValidando}
                      >
                        {cupomValidando ? "Validando..." : "Aplicar"}
                      </button>
                    </div>
                    {cupomErro && (
                      <div className={styles.cupomErro}>
                        ⚠️ {cupomErro}
                      </div>
                    )}
                    {cupomAplicado && (
                      <div className={styles.cupomAplicado}>
                        <div className={styles.cupomInfo}>
                          <span className={styles.cupomSuccess}>✓ Cupom "{cupomAplicado.codigo}" aplicado!</span>
                          <span className={styles.cupomDesconto}>
                            {cupomAplicado.tipo === 'percentual' 
                              ? `${cupomAplicado.valor || 0}% de desconto` 
                              : `R$ ${(cupomAplicado.valor || 0).toFixed(2)} de desconto`}
                          </span>
                        </div>
                        <button
                          className={styles.removerCupomButton}
                          onClick={removerCupom}
                          title="Remover cupom"
                        >
                          ✕
                        </button>
                      </div>
                    )}
                  </div>

                  {cupomAplicado && (
                    <>
                      <div className={styles.summaryItem}>
                        <span className={styles.summaryItemLabel}>Subtotal</span>
                        <span className={styles.summaryItemValue}>R${cupomAplicado.valor_original.toFixed(2)}</span>
                      </div>
                      <div className={styles.summaryItem} style={{ color: 'var(--success-color)' }}>
                        <span className={styles.summaryItemLabel}>Desconto ({cupomAplicado.codigo})</span>
                        <span className={styles.summaryItemValue}>-R${(cupomAplicado.valor_desconto || cupomAplicado.desconto).toFixed(2)}</span>
                      </div>
                      <div className={styles.summaryItem} style={{ fontWeight: '700', color: 'var(--primary-color)' }}>
                        <span className={styles.summaryItemLabel}>Valor Final da Compra</span>
                        <span className={styles.summaryItemValue}>R${(cupomAplicado.valor_final_compra || cupomAplicado.valor_final).toFixed(2)}</span>
                      </div>
                    </>
                  )}

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

export default CarrinhoCompras;

