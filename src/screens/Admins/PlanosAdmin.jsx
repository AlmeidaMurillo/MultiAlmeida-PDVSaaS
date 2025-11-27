import { useEffect, useState } from "react";
import Sidebar from "../../Components/Sidebar/Sidebar";
import styles from "./PlanosAdmin.module.css";
import { Edit, Trash2, Plus, Users } from "lucide-react";
import axiosInstance from "../../auth";

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
    { label: "Mensal", key: "mensal" },
    { label: "Trimestral", key: "trimestral" },
    { label: "Semestral", key: "semestral" },
    { label: "Anual", key: "anual" },
  ];

  useEffect(() => {
    document.title = "MultiAlmeida | Planos Admin";
    carregarPlanos();
  }, []);

  async function carregarPlanos() {
    try {
      setLoading(true);
      setError("");
      const response = await axiosInstance.get("/api/admin/planos");
      setPlanos(response.data.planos || []);
    } catch (err) {
      console.error("Erro ao carregar planos:", err);
      setError("Erro ao carregar planos");
    } finally {
      setLoading(false);
    }
  }

  function abrirModal(plano, periodoKey) {
    if (plano && periodoKey) {
      setEditId(plano.id);
      const periodoData = plano[periodoKey];
      setForm({
        nome: plano.nome,
        periodo: periodoKey,
        preco: periodoData.preco,
        duracaoDias: periodoData.duracaoDias ? periodoData.duracaoDias.toString() : "",
        beneficios: periodoData.beneficios.join("\n"),
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
        await axiosInstance.put(`/api/admin/planos/${editId}`, payload);
      } else {
        await axiosInstance.post("/api/admin/planos", payload);
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

  async function excluir(planoId, periodo) {
    if (!confirm(`Deseja realmente excluir o período ${periodo}?`)) return;

    try {
      setLoading(true);
      setError("");
      await axiosInstance.delete(`/api/admin/planos/${planoId}?periodo=${periodo}`);
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

        {periodosOptions.map((periodo) => (
          <div key={periodo.key} className={styles.periodoSection}>
            <h2>{periodo.label}</h2>
            <div className={styles.cardsRow}>
              {planos
                .filter((p) => p[periodo.key]?.beneficios?.length > 0)
                .map((plano) => {
                  const pData = plano[periodo.key];
                  return (
                    <div
                      key={`${plano.id}-${periodo.key}`}
                      className={styles.planoCard}
                    >
                      <h3 className={styles.planoNome}>{plano.nome}</h3>
                      <p className={styles.preco}>
                        R$ {pData.preco}/{periodo.label.toLowerCase()}
                      </p>
                      <ul className={styles.beneficiosList}>
                        {pData.beneficios.map((b, i) => (
                          <li key={i}>{b}</li>
                        ))}
                      </ul>
                      <div className={styles.empresasBox}>
                        <Users size={16} /> {plano.empresas} empresas
                      </div>
                      <div className={styles.actions}>
                        <button
                          onClick={() => abrirModal(plano, periodo.key)}
                          disabled={loading}
                        >
                          <Edit size={16} />
                        </button>
                        <button
                          onClick={() => excluir(plano.id, periodo.key)}
                          disabled={loading}
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>
        ))}

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
                disabled={loading}
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