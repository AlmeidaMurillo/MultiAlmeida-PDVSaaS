import React, { useState, useEffect, useCallback } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  FaMoon,
  FaSun,
  FaArrowLeft,
  FaShoppingCart,
  FaTrash,
  FaSignInAlt,
  FaSignOutAlt,
  FaTachometerAlt,
  FaBars,
  FaTimes,
} from "react-icons/fa";
import api from "../../auth";
import { auth } from "../../auth";
import styles from "./CarrinhoCompras.module.css";

export default function CarrinhoCompras() {
  const location = useLocation();
  const navigate = useNavigate();
  const { planId, periodo } = location.state || {};

  const [theme, setTheme] = useState(localStorage.getItem("theme") || "dark");
  const [itensCarrinho, setItensCarrinho] = useState([]);
  const [planos, setPlanos] = useState([]);

  const [error, setError] = useState("");
  const [cupom, setCupom] = useState("");
  const [cupomAplicado, setCupomAplicado] = useState(null);

  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userName, setUserName] = useState("");
  const [userEmail, setUserEmail] = useState("");
  const [showUserModal, setShowUserModal] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

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

  const handleCarrinhoClick = () => {
    // Already on the cart page
  };

  const handleLogout = async () => {
    await auth.logout();
    setIsLoggedIn(false);
    setUserName("");
    setUserEmail("");
    setShowUserModal(false);
    navigate("/"); // Redirect to landing page after logout
  };

  const toggleMobileSidebar = () => {
    setIsMobileSidebarOpen(!isMobileSidebarOpen);
  };

  useEffect(() => {
    const checkAuth = async () => {
      await auth.update();
      const loggedIn = auth.isLoggedInCliente();
      setIsLoggedIn(loggedIn);
      if (loggedIn) {
        try {
          const userDetails = await auth.getUserDetails();
          setUserName(userDetails.nome);
          setUserEmail(userDetails.email);
        } catch (err) {
          console.error("Erro ao carregar detalhes do usuário:", err);
          // Handle error, maybe logout
          await auth.logout();
          setIsLoggedIn(false);
        }
      } else {
        navigate("/login", { state: { from: "/carrinho", planId, periodo } });
      }
    };
    checkAuth();
  }, [navigate, planId, periodo]);

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
    if (isLoggedIn && planId && periodo) {
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
  }, [planId, periodo, carregarCarrinho, isLoggedIn]);

  useEffect(() => {
    if (isLoggedIn) {
      carregarPlanos();
      carregarCarrinho();
    }
  }, [carregarPlanos, carregarCarrinho, isLoggedIn]);

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

  const handleContinuar = () => {
    if (itensCarrinho.length > 0) {
      const firstItem = itensCarrinho[0];
      const plano = planos.find(p => p.mensal?.id === firstItem.plano_id || p.trimestral?.id === firstItem.plano_id || p.semestral?.id === firstItem.plano_id || p.anual?.id === firstItem.plano_id);
      const periodoInfo = plano ? plano[firstItem.periodo] : null;
      if (periodoInfo) {
        navigate("/payment", { state: { planId: periodoInfo.id, periodo: firstItem.periodo } });
      }
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
      <header className={styles.headerTop}>
        <div className={styles.logoContainer} onClick={() => navigate("/")}>
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
                      <button className={styles.modalCloseButton} onClick={() => setShowUserModal(false)}>
                        <FaTimes />
                      </button>
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

        <button className={styles.mobileMenuButton} onClick={toggleMobileSidebar}>
          <FaBars />
        </button>
      </header>

      {isMobileSidebarOpen && (
        <div className={styles.mobileSidebarOverlay} onClick={toggleMobileSidebar}>
          <div className={styles.mobileSidebar} onClick={(e) => e.stopPropagation()}>
            <div className={styles.mobileSidebarHeader}>
              {isLoggedIn ? (
                <div className={styles.mobileUserInfo}>
                  <div className={styles.mobileUserAvatar}>
                    {userName ? userName.charAt(0).toUpperCase() : "U"}
                  </div>
                  <div className={styles.userInfoText}>
                    <h3 className={styles.mobileUserName}>{userName}</h3>
                    <p className={styles.mobileUserEmail}>{userEmail}</p>
                  </div>
                </div>
              ) : (
                <h3>Menu</h3>
              )}
              <button className={styles.closeButton} onClick={toggleMobileSidebar}>
                <FaTimes />
              </button>
            </div>

            <div className={styles.mobileSidebarContent}>
              <button className={styles.mobileSidebarItem} onClick={() => { toggleTheme(); toggleMobileSidebar(); }}>
                {theme === "dark" ? <FaSun /> : <FaMoon />}
                <span>Alternar Tema</span>
              </button>
              <button className={styles.mobileSidebarItem} onClick={() => { handleCarrinhoClick(); toggleMobileSidebar(); }}>
                <FaShoppingCart />
                <span>Carrinho</span>
              </button>
              {isLoggedIn ? (
                <button className={styles.mobileSidebarItem} onClick={() => { handlePainelClick(); toggleMobileSidebar(); }}>
                  <FaTachometerAlt />
                  <span>Painel</span>
                </button>
              ) : (
                <button className={styles.mobileSidebarItem} onClick={() => { navigate("/login"); toggleMobileSidebar(); }}>
                  <FaSignInAlt />
                  <span>Login</span>
                </button>
              )}
            </div>

            {isLoggedIn && (
              <div className={styles.mobileSidebarFooter}>
                <button className={styles.mobileSidebarItem} onClick={() => { handleLogout(); toggleMobileSidebar(); }}>
                  <FaSignOutAlt />
                  <span>Sair</span>
                </button>
              </div>
            )}
          </div>
        </div>
      )}

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

                  <button className={styles.checkoutButton} onClick={handleContinuar}>
                    Continuar para Pagamento
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
