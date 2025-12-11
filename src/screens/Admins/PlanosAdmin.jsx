import { useEffect, useState } from "react";
import Sidebar from "../../Components/Sidebar/Sidebar";
import styles from "./PlanosAdmin.module.css";
import { Edit, Trash2, Plus, Users, Calendar } from "lucide-react";
import { api } from "../../auth";

function PlanosAdmin() {

  const [planos, setPlanos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [modal, setModal] = useState(false);
  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState({
    nome: "",
    periodo: "mensal",
    preco: "",
    duracaoDias: "",
    beneficios: "",
  });

  const periodosOptions = [
    { label: "Mensal", key: "mensal", icon: "📅", color: "#7c3aed" },
    { label: "Trimestral", key: "trimestral", icon: "📊", color: "#2563eb" },
    { label: "Semestral", key: "semestral", icon: "📈", color: "#059669" },
    { label: "Anual", key: "anual", icon: "🏆", color: "#dc2626" },
  ];

  // Agrupar planos por período
  const planosPorPeriodo = periodosOptions.reduce((acc, periodo) => {
    acc[periodo.key] = planos.filter(p => p.periodo === periodo.key);
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
      setModal(false);
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

        {error && <div className={styles.error}>{error}</div>}
        {loading && <div className={styles.loading}>Carregando...</div>}

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
                    style={{ borderLeftColor: periodoInfo.color }}
                  >
                    <span className={styles.periodoIcon}>{periodoInfo.icon}</span>
                    <h2 className={styles.periodoTitle}>{periodoInfo.label}</h2>
                    <span className={styles.periodoCount}>
                      {planosNoPeriodo.length} {planosNoPeriodo.length === 1 ? 'plano' : 'planos'}
                    </span>
                  </div>

                  <div className={styles.cardsGrid}>
                    {planosNoPeriodo.map((plano) => (
                      <div key={plano.id} className={styles.planoCard}>
                        <div className={styles.cardHeader}>
                          <h3 className={styles.planoNome}>{plano.nome}</h3>
                          <div className={styles.planoBadge} style={{ backgroundColor: periodoInfo.color }}>
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
                  onClick={() => setModal(false)}
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