import { useEffect, useState } from "react";
import Sidebar from "../../Components/Sidebar/Sidebar";
import styles from "./PlanosAdmin.module.css";
import { Edit, Trash2, Plus, Users, Calendar, Search, Shield } from "lucide-react";
import { api } from "../../auth";

function PlanosAdmin() {

  const [planos, setPlanos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [modal, setModal] = useState(false);
  const [modalPermissoes, setModalPermissoes] = useState(false);
  const [planoPermissoes, setPlanoPermissoes] = useState(null);
  const [editId, setEditId] = useState(null);
  const [busca, setBusca] = useState("");
  const [form, setForm] = useState({
    nome: "",
    periodo: "mensal",
    preco: "",
    duracaoDias: "",
    beneficios: "",
  });

  // Estado para armazenar permissões de cada plano
  const [permissoesPorPlano, setPermissoesPorPlano] = useState({});

  // Definição de todas as permissões disponíveis no sistema
  const PERMISSOES_SISTEMA = [
    {
      categoria: "Empresas",
      permissoes: [
        { key: "max_empresas", label: "Quantidade máxima de empresas", tipo: "numero", valor: 1 },
        { key: "criar_empresas", label: "Criar novas empresas", tipo: "boolean" },
        { key: "editar_empresas", label: "Editar empresas", tipo: "boolean" },
        { key: "excluir_empresas", label: "Excluir empresas", tipo: "boolean" },
      ]
    },
    {
      categoria: "Funcionários",
      permissoes: [
        { key: "max_funcionarios", label: "Quantidade máxima de funcionários", tipo: "numero", valor: 5 },
        { key: "criar_funcionarios", label: "Criar funcionários", tipo: "boolean" },
        { key: "editar_funcionarios", label: "Editar funcionários", tipo: "boolean" },
        { key: "excluir_funcionarios", label: "Excluir funcionários", tipo: "boolean" },
        { key: "definir_permissoes_funcionarios", label: "Definir permissões de funcionários", tipo: "boolean" },
      ]
    },
    {
      categoria: "Produtos",
      permissoes: [
        { key: "max_produtos", label: "Quantidade máxima de produtos", tipo: "numero", valor: 100 },
        { key: "criar_produtos", label: "Criar produtos", tipo: "boolean" },
        { key: "editar_produtos", label: "Editar produtos", tipo: "boolean" },
        { key: "excluir_produtos", label: "Excluir produtos", tipo: "boolean" },
        { key: "importar_produtos", label: "Importar produtos em lote", tipo: "boolean" },
        { key: "exportar_produtos", label: "Exportar produtos", tipo: "boolean" },
      ]
    },
    {
      categoria: "Vendas",
      permissoes: [
        { key: "realizar_vendas", label: "Realizar vendas", tipo: "boolean" },
        { key: "cancelar_vendas", label: "Cancelar vendas", tipo: "boolean" },
        { key: "aplicar_descontos", label: "Aplicar descontos", tipo: "boolean" },
        { key: "max_desconto_percentual", label: "Desconto máximo (%)", tipo: "numero", valor: 10 },
        { key: "vendas_a_prazo", label: "Vendas a prazo", tipo: "boolean" },
      ]
    },
    {
      categoria: "Estoque",
      permissoes: [
        { key: "controle_estoque", label: "Controle de estoque", tipo: "boolean" },
        { key: "ajustar_estoque", label: "Ajustar estoque manualmente", tipo: "boolean" },
        { key: "alertas_estoque_baixo", label: "Alertas de estoque baixo", tipo: "boolean" },
        { key: "transferencia_estoque", label: "Transferência entre estoques", tipo: "boolean" },
      ]
    },
    {
      categoria: "Relatórios",
      permissoes: [
        { key: "relatorios_basicos", label: "Relatórios básicos", tipo: "boolean" },
        { key: "relatorios_avancados", label: "Relatórios avançados", tipo: "boolean" },
        { key: "relatorios_personalizados", label: "Relatórios personalizados", tipo: "boolean" },
        { key: "exportar_relatorios", label: "Exportar relatórios (PDF/Excel)", tipo: "boolean" },
        { key: "relatorios_financeiros", label: "Relatórios financeiros", tipo: "boolean" },
      ]
    },
    {
      categoria: "Financeiro",
      permissoes: [
        { key: "contas_pagar", label: "Contas a pagar", tipo: "boolean" },
        { key: "contas_receber", label: "Contas a receber", tipo: "boolean" },
        { key: "fluxo_caixa", label: "Fluxo de caixa", tipo: "boolean" },
        { key: "conciliacao_bancaria", label: "Conciliação bancária", tipo: "boolean" },
      ]
    },
    {
      categoria: "Cupons e Promoções",
      permissoes: [
        { key: "criar_cupons", label: "Criar cupons de desconto", tipo: "boolean" },
        { key: "gerenciar_promocoes", label: "Gerenciar promoções", tipo: "boolean" },
        { key: "programa_fidelidade", label: "Programa de fidelidade", tipo: "boolean" },
      ]
    },
    {
      categoria: "Fiscal",
      permissoes: [
        { key: "emitir_nfe", label: "Emitir NF-e", tipo: "boolean" },
        { key: "emitir_nfce", label: "Emitir NFC-e", tipo: "boolean" },
        { key: "emitir_sat", label: "Emitir SAT", tipo: "boolean" },
        { key: "gestao_tributaria", label: "Gestão tributária", tipo: "boolean" },
      ]
    },
    {
      categoria: "Sistema",
      permissoes: [
        { key: "api_access", label: "Acesso à API", tipo: "boolean" },
        { key: "integracao_terceiros", label: "Integrações com terceiros", tipo: "boolean" },
        { key: "suporte_prioritario", label: "Suporte prioritário", tipo: "boolean" },
        { key: "backup_automatico", label: "Backup automático", tipo: "boolean" },
        { key: "personalizacao_interface", label: "Personalização de interface", tipo: "boolean" },
      ]
    },
  ];
 

  const periodosOptions = [
    { label: "Mensal", key: "mensal", icon: "📅", color: "#7c3aed" },
    { label: "Trimestral", key: "trimestral", icon: "📊", color: "#2563eb" },
    { label: "Semestral", key: "semestral", icon: "📈", color: "#059669" },
    { label: "Anual", key: "anual", icon: "🏆", color: "#dc2626" },
  ];

  // Filtrar planos pela busca
  const planosFiltrados = planos.filter(plano => 
    plano.nome.toLowerCase().includes(busca.toLowerCase()) ||
    plano.periodo.toLowerCase().includes(busca.toLowerCase())
  );

  // Agrupar planos por período
  const planosPorPeriodo = periodosOptions.reduce((acc, periodo) => {
    acc[periodo.key] = planosFiltrados.filter(p => p.periodo === periodo.key);
    return acc;
  }, {});

  useEffect(() => {
    document.title = "MultiAlmeida | Planos Admin";
    carregarPlanos();
  }, []);


  async function carregarPlanos() {
    try {
      setLoading(true);
      setError("");
      // Agora o backend retorna a lista plana de planos
      const response = await api.get("/api/admin/planos");
      setPlanos(response.data.planos || []);
    } catch (err) {
      console.error("Erro ao carregar planos:", err);
      setError("Erro ao carregar planos");
    } finally {
      setLoading(false);
    }
  }

  function abrirModal(plano = null) {
    if (plano) {
      setEditId(plano.id);
      setForm({
        nome: plano.nome,
        periodo: plano.periodo,
        preco: plano.preco ? plano.preco.toString() : "",
        duracaoDias: plano.duracao_dias ? plano.duracao_dias.toString() : "",
        beneficios: plano.beneficios ? plano.beneficios.join("\n") : "",
      });
    } else {
      setEditId(null);
      setForm({
        nome: "",
        periodo: "mensal",
        preco: "",
        duracaoDias: "",
        beneficios: "",
      });
    }
    setModal(true);
  }

  function fecharModal() {
    setModal(false);
  }

  function abrirModalPermissoes(plano) {
    setPlanoPermissoes(plano);
    
    // Inicializa as permissões se não existirem
    if (!permissoesPorPlano[plano.id]) {
      const permissoesIniciais = {};
      PERMISSOES_SISTEMA.forEach(cat => {
        cat.permissoes.forEach(perm => {
          if (perm.tipo === "boolean") {
            permissoesIniciais[perm.key] = false;
          } else if (perm.tipo === "numero") {
            permissoesIniciais[perm.key] = { ativo: false, valor: perm.valor || 0 };
          }
        });
      });
      setPermissoesPorPlano({
        ...permissoesPorPlano,
        [plano.id]: permissoesIniciais
      });
    }
    
    setModalPermissoes(true);
  }

  function fecharModalPermissoes() {
    setModalPermissoes(false);
    setPlanoPermissoes(null);
  }

  function alterarPermissao(key, value) {
    if (!planoPermissoes) return;
    
    setPermissoesPorPlano({
      ...permissoesPorPlano,
      [planoPermissoes.id]: {
        ...permissoesPorPlano[planoPermissoes.id],
        [key]: value
      }
    });
  }

  function salvarPermissoes() {
    // Aqui você pode enviar para o backend se quiser
    console.log("Permissões salvas:", permissoesPorPlano[planoPermissoes.id]);
    alert("Permissões salvas com sucesso!");
    fecharModalPermissoes();
  }

  async function salvar() {
    try {
      setLoading(true);
      setError("");

      const lista = form.beneficios.split("\n").filter((b) => b.trim() !== "");

      const payload = {
        nome: form.nome,
        periodo: form.periodo,
        preco: form.preco,
        duracaoDias: Number(form.duracaoDias),
        beneficios: lista,
      };

      if (editId) {
        await api.put(`/api/admin/planos/${editId}`, payload);
      } else {
        await api.post("/api/admin/planos", payload);
      }

      await carregarPlanos();
      fecharModal();
    } catch (err) {
      console.error("Erro ao salvar plano:", err);
      setError(err?.response?.data?.error || "Erro ao salvar plano");
    } finally {
      setLoading(false);
    }
  }

  async function excluir(planoId) { // Remove o parâmetro 'periodo'
    if (!confirm(`Deseja realmente excluir o plano?`)) return;

    try {
      setLoading(true);
      setError("");
      await api.delete(`/api/admin/planos/${planoId}`); // Remove o query param 'periodo'
      await carregarPlanos();
    } catch (err) {
      console.error("Erro ao excluir:", err);
      setError(err?.response?.data?.error || "Erro ao excluir");
    } finally {
      setLoading(false);
    }
  }
 

  return (
    <Sidebar>
      <div className={styles.planosContent}>
        <div className={styles.titleRow}>
          <h1>Gerenciar Planos</h1>
          <button
            className={styles.btnAdd}
            onClick={() => abrirModal()}
            disabled={loading}
          >
            <Plus size={18} /> Novo Plano
          </button>
        </div>

        <div className={styles.searchBox}>
          <Search size={18} />
          <input
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            placeholder="Pesquisar planos..."
          />
        </div>

        {error && <div className={styles.error}>{error}</div>}
        {loading && (
          <div className={styles.loading}>
            <div className={styles.spinner}></div>
            <p>Carregando planos...</p>
          </div>
        )}

        {!loading && planos.length === 0 && (
          <div className={styles.emptyState}>
            <Calendar size={48} />
            <p>Nenhum plano cadastrado ainda</p>
            <button className={styles.btnAddEmpty} onClick={() => abrirModal()}>
              <Plus size={18} /> Criar Primeiro Plano
            </button>
          </div>
        )}

        {planos.length > 0 && (
          <div className={styles.periodosContainer}>
            {periodosOptions.map((periodoInfo) => {
              const planosNoPeriodo = planosPorPeriodo[periodoInfo.key];
              if (planosNoPeriodo.length === 0) return null;

              return (
                <div key={periodoInfo.key} className={styles.blocoperiodo}>
                  <div 
                    className={styles.periodoHeader}
                  >
                    <span className={styles.periodoIcon}>{periodoInfo.icon}</span>
                    <h2 className={styles.periodoTitle}>{periodoInfo.label}</h2>
                    <span 
                      className={styles.periodoCount}
                      data-periodo={periodoInfo.key}
                    >
                      {planosNoPeriodo.length} {planosNoPeriodo.length === 1 ? 'plano' : 'planos'}
                    </span>
                  </div>

                  <div className={styles.cardsGrid}>
                    {planosNoPeriodo.map((plano) => (
                      <div key={plano.id} className={styles.planoCard}>
                        <div className={styles.cardHeader}>
                          <h3 className={styles.planoNome}>{plano.nome}</h3>
                          <div 
                            className={styles.planoBadge}
                            data-periodo={periodoInfo.key}
                          >
                            {periodoInfo.label}
                          </div>
                        </div>
                        
                        <div className={styles.precoContainer}>
                          <span className={styles.precoCifrao}>R$</span>
                          <span className={styles.precoValor}>
                            {parseFloat(plano.preco).toFixed(2)}
                          </span>
                          <span className={styles.precoPeriodo}>/{periodoInfo.key}</span>
                        </div>

                        <div className={styles.duracaoInfo}>
                          <Calendar size={14} />
                          <span>{plano.duracao_dias} dias de acesso</span>
                        </div>

                        <ul className={styles.beneficiosList}>
                          {plano.beneficios && plano.beneficios.map((b, i) => (
                            <li key={i}>{b}</li>
                          ))}
                        </ul>

                        <div className={styles.cardFooter}>
                          <div className={styles.empresasBox}>
                            <Users size={16} />
                            <span>{plano.quantidade_empresas || 0} empresas</span>
                          </div>
                          <div className={styles.actions}>
                            <button
                              className={styles.btnEdit}
                              onClick={() => abrirModal(plano)}
                              disabled={loading}
                              title="Editar plano"
                            >
                              <Edit size={16} />
                            </button>
                            <button
                              className={styles.btnPermissoes}
                              onClick={() => abrirModalPermissoes(plano)}
                              disabled={loading}
                              title="Gerenciar permissões"
                            >
                              <Shield size={16} />
                            </button>
                            <button
                              className={styles.btnDelete}
                              onClick={() => excluir(plano.id)}
                              disabled={loading}
                              title="Excluir plano"
                            >
                              <Trash2 size={16} />
                            </button>
                            
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {modal && (
          <div className={styles.modalBg}>
            <div className={styles.modal}>
              <h2>{editId ? `Editar Plano - ${form.nome}` : "Novo Plano"}</h2>
              {error && <div className={styles.modalError}>{error}</div>}

              <input
                placeholder="Nome do plano"
                value={form.nome}
                onChange={(e) => setForm({ ...form, nome: e.target.value })}
                disabled={loading}
              />

              <select
                value={form.periodo}
                onChange={(e) => setForm({ ...form, periodo: e.target.value })}
                disabled={loading || editId} // Não permite alterar o período em edição para simplificar
              >
                {periodosOptions.map((p) => (
                  <option key={p.key} value={p.key}>
                    {p.label}
                  </option>
                ))}
              </select>

              <input
                placeholder="Preço"
                value={form.preco}
                onChange={(e) => setForm({ ...form, preco: e.target.value })}
                disabled={loading}
              />

              <input
                type="number"
                placeholder="Duração em dias"
                value={form.duracaoDias}
                onChange={(e) =>
                  setForm({ ...form, duracaoDias: e.target.value })
                }
                disabled={loading}
              />

              <textarea
                rows={6}
                placeholder="Benefícios (1 por linha)"
                value={form.beneficios}
                onChange={(e) =>
                  setForm({ ...form, beneficios: e.target.value })
                }
                disabled={loading}
              />

              <div className={styles.modalBtns}>
                <button onClick={salvar} disabled={loading}>
                  {loading ? "Salvando..." : "Salvar"}
                </button>
                <button
                  className={styles.btnCancel}
                  onClick={fecharModal}
                  disabled={loading}
                >
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Modal de Permissões */}
        {modalPermissoes && planoPermissoes && (
          <div className={styles.modalBg}>
            <div className={styles.modalPermissoes}>
              <div className={styles.modalPermissoesHeader}>
                <div>
                  <h2>Permissões do Plano</h2>
                  <p className={styles.planoNomeModal}>
                    {planoPermissoes.nome} - {planoPermissoes.periodo}
                  </p>
                </div>
                <button 
                  className={styles.btnFecharModal}
                  onClick={fecharModalPermissoes}
                  disabled={loading}
                >
                  ✕
                </button>
              </div>

              <div className={styles.permissoesContent}>
                {PERMISSOES_SISTEMA.map((categoria) => (
                  <div key={categoria.categoria} className={styles.categoriaPermissoes}>
                    <h3 className={styles.categoriaTitulo}>
                      <span className={styles.categoriaIcon}>📋</span>
                      {categoria.categoria}
                    </h3>
                    
                    <div className={styles.permissoesGrid}>
                      {categoria.permissoes.map((perm) => {
                        const valorAtual = permissoesPorPlano[planoPermissoes.id]?.[perm.key];
                        
                        return (
                          <div key={perm.key} className={styles.permissaoItem}>
                            {perm.tipo === "boolean" ? (
                              <label className={styles.permissaoLabel}>
                                <div className={styles.checkboxWrapper}>
                                  <input
                                    type="checkbox"
                                    checked={!!valorAtual}
                                    onChange={(e) => alterarPermissao(perm.key, e.target.checked)}
                                    className={styles.permissaoCheckbox}
                                  />
                                  <span className={styles.checkmark}></span>
                                </div>
                                <span className={styles.permissaoTexto}>{perm.label}</span>
                              </label>
                            ) : (
                              <div className={styles.permissaoComValor}>
                                <label className={styles.permissaoLabel}>
                                  <div className={styles.checkboxWrapper}>
                                    <input
                                      type="checkbox"
                                      checked={!!valorAtual?.ativo}
                                      onChange={(e) => alterarPermissao(perm.key, {
                                        ...valorAtual,
                                        ativo: e.target.checked
                                      })}
                                      className={styles.permissaoCheckbox}
                                    />
                                    <span className={styles.checkmark}></span>
                                  </div>
                                  <span className={styles.permissaoTexto}>{perm.label}</span>
                                </label>
                                {valorAtual?.ativo && (
                                  <input
                                    type="number"
                                    min="0"
                                    value={valorAtual?.valor || 0}
                                    onChange={(e) => alterarPermissao(perm.key, {
                                      ...valorAtual,
                                      valor: parseInt(e.target.value) || 0
                                    })}
                                    className={styles.numeroInputInline}
                                    placeholder="0"
                                  />
                                )}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>

              <div className={styles.modalPermissoesBtns}>
                <button 
                  onClick={salvarPermissoes} 
                  disabled={loading}
                  className={styles.btnSalvarPermissoes}
                >
                  {loading ? "Salvando..." : "Salvar Permissões"}
                </button>
                <button
                  className={styles.btnCancelarPermissoes}
                  onClick={fecharModalPermissoes}
                  disabled={loading}
                >
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        )}

        
      </div>
    </Sidebar>
  );
}


export default PlanosAdmin;