import { useEffect, useState } from "react";
import Sidebar from "../../Components/Sidebar/Sidebar";
import styles from "./CuponsAdmin.module.css";
import { Edit, Trash2, Plus, Tag, Calendar, PercentIcon, DollarSign, CheckCircle, XCircle, Search } from "lucide-react";
import { api } from "../../auth";

function CuponsAdmin() {
  const [cupons, setCupons] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [modal, setModal] = useState(false);
  const [editId, setEditId] = useState(null);
  const [busca, setBusca] = useState("");
  const [form, setForm] = useState({
    codigo: "",
    tipo: "percentual",
    valor: "",
    quantidade_maxima: "",
    data_inicio: "",
    data_fim: "",
    ativo: true,
  });

  useEffect(() => {
    document.title = "MultiAlmeida | Cupons Admin";
    carregarCupons();
  }, []);

  async function carregarCupons() {
    try {
      setLoading(true);
      setError("");
      const response = await api.get("/api/admin/cupons");
      setCupons(response.data || []);
    } catch (err) {
      console.error("Erro ao carregar cupons:", err);
      setError("Erro ao carregar cupons");
    } finally {
      setLoading(false);
    }
  }

  function abrirModal(cupom = null) {
    if (cupom) {
      setEditId(cupom.id);
      setForm({
        codigo: cupom.codigo,
        tipo: cupom.tipo,
        valor: cupom.valor.toString(),
        quantidade_maxima: cupom.quantidade_maxima ? cupom.quantidade_maxima.toString() : "",
        data_inicio: cupom.data_inicio ? new Date(cupom.data_inicio).toISOString().slice(0, 16) : "",
        data_fim: cupom.data_fim ? new Date(cupom.data_fim).toISOString().slice(0, 16) : "",
        ativo: cupom.ativo === 1 || cupom.ativo === true,
      });
    } else {
      setEditId(null);
      setForm({
        codigo: "",
        tipo: "percentual",
        valor: "",
        quantidade_maxima: "",
        data_inicio: "",
        data_fim: "",
        ativo: true,
      });
    }
    setModal(true);
  }

  function fecharModal() {
    setModal(false);
    setEditId(null);
    setError("");
  }

  async function salvarCupom(e) {
    e.preventDefault();
    
    try {
      setError("");
      setLoading(true);

      const dados = {
        codigo: form.codigo.toUpperCase(),
        tipo: form.tipo,
        valor: parseFloat(form.valor),
        quantidade_maxima: form.quantidade_maxima ? parseInt(form.quantidade_maxima) : null,
        data_inicio: form.data_inicio,
        data_fim: form.data_fim,
        ativo: form.ativo,
      };

      if (editId) {
        await api.put(`/api/admin/cupons/${editId}`, dados);
      } else {
        await api.post("/api/admin/cupons", dados);
      }

      await carregarCupons();
      fecharModal();
    } catch (err) {
      console.error("Erro ao salvar cupom:", err);
      setError(err.response?.data?.error || "Erro ao salvar cupom");
    } finally {
      setLoading(false);
    }
  }

  async function deletarCupom(id) {
    if (!confirm("Tem certeza que deseja deletar este cupom?")) return;

    try {
      setError("");
      setLoading(true);
      await api.delete(`/api/admin/cupons/${id}`);
      await carregarCupons();
    } catch (err) {
      console.error("Erro ao deletar cupom:", err);
      setError(err.response?.data?.error || "Erro ao deletar cupom");
    } finally {
      setLoading(false);
    }
  }

  function formatarData(data) {
    if (!data) return "-";
    return new Date(data).toLocaleString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  function formatarValor(tipo, valor) {
    if (tipo === "percentual") {
      return `${valor}%`;
    }
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(valor);
  }

  // Filtrar cupons pela busca
  const cuponsFiltrados = cupons.filter(cupom =>
    cupom.codigo.toLowerCase().includes(busca.toLowerCase()) ||
    cupom.tipo.toLowerCase().includes(busca.toLowerCase())
  );

  const cuponsAtivos = cuponsFiltrados.filter(c => c.ativo === 1 || c.ativo === true);
  const cuponsInativos = cuponsFiltrados.filter(c => c.ativo === 0 || c.ativo === false);

  return (
    <Sidebar>
      <div className={styles.cuponsContent}>
        <div className={styles.titleRow}>
          <h1>Gerenciar Cupons</h1>
          <button
            className={styles.btnAdd}
            onClick={() => abrirModal()}
            disabled={loading}
          >
            <Plus size={18} /> Novo Cupom
          </button>
        </div>

        <div className={styles.searchBox}>
          <Search size={18} />
          <input
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            placeholder="Pesquisar cupons..."
          />
        </div>

        {error && <div className={styles.error}>{error}</div>}
        
        {loading && cupons.length === 0 && (
          <div className={styles.loading}>
            <div className={styles.spinner}></div>
            <p>Carregando cupons...</p>
          </div>
        )}

        {!loading && cupons.length === 0 && (
          <div className={styles.emptyState}>
            <Tag size={48} />
            <p>Nenhum cupom cadastrado ainda</p>
            <button className={styles.btnAddEmpty} onClick={() => abrirModal()}>
              <Plus size={18} /> Criar Primeiro Cupom
            </button>
          </div>
        )}

        {cupons.length > 0 && (
          <div className={styles.statusContainer}>
            {/* Cupons Ativos */}
            {cuponsAtivos.length > 0 && (
              <div className={styles.blocoStatus}>
                <div className={styles.statusHeader}>
                  <span className={styles.statusIcon}>✅</span>
                  <h2 className={styles.statusTitle}>Cupons Ativos</h2>
                  <span className={styles.statusCount} data-status="ativo">
                    {cuponsAtivos.length} {cuponsAtivos.length === 1 ? 'cupom' : 'cupons'}
                  </span>
                </div>

                <div className={styles.cardsGrid}>
                  {cuponsAtivos.map((cupom) => (
                    <div key={cupom.id} className={styles.cupomCard}>
                      <div className={styles.cardHeader}>
                        <h3 className={styles.cupomCodigo}>
                          <Tag size={18} />
                          {cupom.codigo}
                        </h3>
                        <div className={styles.cupomBadge} data-tipo={cupom.tipo}>
                          {cupom.tipo === "percentual" ? "Percentual" : "Valor Fixo"}
                        </div>
                      </div>
                      
                      <div className={styles.descontoContainer}>
                        {cupom.tipo === "percentual" ? (
                          <PercentIcon size={20} className={styles.descontoIcon} />
                        ) : (
                          <DollarSign size={20} className={styles.descontoIcon} />
                        )}
                        <span className={styles.descontoValor}>
                          {formatarValor(cupom.tipo, cupom.valor)}
                        </span>
                      </div>

                      <ul className={styles.infoList}>
                        <li>
                          <Calendar size={14} />
                          <span>Início: {formatarData(cupom.data_inicio)}</span>
                        </li>
                        <li>
                          <Calendar size={14} />
                          <span>Fim: {formatarData(cupom.data_fim)}</span>
                        </li>
                        {cupom.quantidade_maxima && (
                          <li>
                            <Tag size={14} />
                            <span>
                              Usos: {cupom.quantidade_usada || 0}/{cupom.quantidade_maxima}
                            </span>
                          </li>
                        )}
                      </ul>

                      <div className={styles.cardFooter}>
                        <div className={styles.statusBox}>
                          <CheckCircle size={16} />
                          <span>Ativo</span>
                        </div>

                        <div className={styles.actions}>
                          <button
                            className={styles.btnEdit}
                            onClick={() => abrirModal(cupom)}
                            disabled={loading}
                            title="Editar cupom"
                          >
                            <Edit size={16} />
                          </button>
                          <button
                            className={styles.btnDelete}
                            onClick={() => deletarCupom(cupom.id)}
                            disabled={loading}
                            title="Excluir cupom"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Cupons Inativos */}
            {cuponsInativos.length > 0 && (
              <div className={styles.blocoStatus}>
                <div className={styles.statusHeader}>
                  <span className={styles.statusIcon}>❌</span>
                  <h2 className={styles.statusTitle}>Cupons Inativos</h2>
                  <span className={styles.statusCount} data-status="inativo">
                    {cuponsInativos.length} {cuponsInativos.length === 1 ? 'cupom' : 'cupons'}
                  </span>
                </div>

                <div className={styles.cardsGrid}>
                  {cuponsInativos.map((cupom) => (
                    <div key={cupom.id} className={`${styles.cupomCard} ${styles.cardInactive}`}>
                      <div className={styles.cardHeader}>
                        <h3 className={styles.cupomCodigo}>
                          <Tag size={18} />
                          {cupom.codigo}
                        </h3>
                        <div className={styles.cupomBadge} data-tipo={cupom.tipo}>
                          {cupom.tipo === "percentual" ? "Percentual" : "Valor Fixo"}
                        </div>
                      </div>
                      
                      <div className={styles.descontoContainer}>
                        {cupom.tipo === "percentual" ? (
                          <PercentIcon size={20} className={styles.descontoIcon} />
                        ) : (
                          <DollarSign size={20} className={styles.descontoIcon} />
                        )}
                        <span className={styles.descontoValor}>
                          {formatarValor(cupom.tipo, cupom.valor)}
                        </span>
                      </div>

                      <ul className={styles.infoList}>
                        <li>
                          <Calendar size={14} />
                          <span>Início: {formatarData(cupom.data_inicio)}</span>
                        </li>
                        <li>
                          <Calendar size={14} />
                          <span>Fim: {formatarData(cupom.data_fim)}</span>
                        </li>
                        {cupom.quantidade_maxima && (
                          <li>
                            <Tag size={14} />
                            <span>
                              Usos: {cupom.quantidade_usada || 0}/{cupom.quantidade_maxima}
                            </span>
                          </li>
                        )}
                      </ul>

                      <div className={styles.cardFooter}>
                        <div className={styles.statusBox}>
                          <XCircle size={16} />
                          <span>Inativo</span>
                        </div>

                        <div className={styles.actions}>
                          <button
                            className={styles.btnEdit}
                            onClick={() => abrirModal(cupom)}
                            disabled={loading}
                            title="Editar cupom"
                          >
                            <Edit size={16} />
                          </button>
                          <button
                            className={styles.btnDelete}
                            onClick={() => deletarCupom(cupom.id)}
                            disabled={loading}
                            title="Excluir cupom"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Modal */}
        {modal && (
          <div className={styles.modalBg}>
            <div className={styles.modal}>
              <h2>{editId ? `Editar Cupom - ${form.codigo}` : "Novo Cupom"}</h2>
              {error && <div className={styles.modalError}>{error}</div>}

              <input
                placeholder="Código do Cupom"
                value={form.codigo}
                onChange={(e) => setForm({ ...form, codigo: e.target.value.toUpperCase() })}
                disabled={loading}
                maxLength={50}
              />

              <select
                value={form.tipo}
                onChange={(e) => setForm({ ...form, tipo: e.target.value })}
                disabled={loading}
              >
                <option value="percentual">Percentual (%)</option>
                <option value="fixo">Valor Fixo (R$)</option>
              </select>

              <input
                type="number"
                step="0.01"
                min="0"
                max={form.tipo === "percentual" ? "100" : undefined}
                placeholder={`Valor ${form.tipo === "percentual" ? "(%)" : "(R$)"}`}
                value={form.valor}
                onChange={(e) => setForm({ ...form, valor: e.target.value })}
                disabled={loading}
              />

              <input
                type="number"
                min="1"
                placeholder="Quantidade Máxima de Usos (opcional)"
                value={form.quantidade_maxima}
                onChange={(e) => setForm({ ...form, quantidade_maxima: e.target.value })}
                disabled={loading}
              />

              <input
                type="datetime-local"
                value={form.data_inicio}
                onChange={(e) => setForm({ ...form, data_inicio: e.target.value })}
                disabled={loading}
              />

              <input
                type="datetime-local"
                value={form.data_fim}
                onChange={(e) => setForm({ ...form, data_fim: e.target.value })}
                disabled={loading}
              />

              <label className={styles.checkboxLabel}>
                <input
                  type="checkbox"
                  checked={form.ativo}
                  onChange={(e) => setForm({ ...form, ativo: e.target.checked })}
                  disabled={loading}
                />
                <span>Cupom Ativo</span>
              </label>

              <div className={styles.modalBtns}>
                <button type="button" onClick={salvarCupom} disabled={loading}>
                  {loading ? "Salvando..." : "Salvar"}
                </button>
                <button
                  type="button"
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
      </div>
    </Sidebar>
  );
}

export default CuponsAdmin;
