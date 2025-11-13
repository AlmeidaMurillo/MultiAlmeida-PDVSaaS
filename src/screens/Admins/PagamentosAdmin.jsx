import { useEffect, useState } from "react";
import Sidebar from "../../Components/Sidebar/Sidebar";
import styles from "./PagamentosAdmin.module.css";
import { Eye, CheckCircle, XCircle, Clock, Search, CreditCard } from "lucide-react";
import api from "../../auth";

function PagamentosAdmin() {
  const [pagamentos, setPagamentos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busca, setBusca] = useState("");
  const [filtroStatus, setFiltroStatus] = useState("todos");

  useEffect(() => {
    document.title = "MultiAlmeida | Pagamentos Admin";
    carregarPagamentos();
  }, []);

  const carregarPagamentos = async () => {
    try {
      setLoading(true);
      const res = await api.get("/api/admin/pagamentos");
      setPagamentos(res.data.pagamentos || []);
    } catch (err) {
      console.error("Erro carregando pagamentos:", err);
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case "approved":
        return <CheckCircle size={16} color="#4caf50" />;
      case "rejected":
        return <XCircle size={16} color="#f44336" />;
      case "cancelled":
        return <XCircle size={16} color="#ff9800" />;
      default:
        return <Clock size={16} color="#ff9800" />;
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case "approved":
        return "Aprovado";
      case "rejected":
        return "Rejeitado";
      case "cancelled":
        return "Cancelado";
      default:
        return "Pendente";
    }
  };

  const pagamentosFiltrados = pagamentos.filter((pag) => {
    const matchBusca =
      pag.empresa_nome?.toLowerCase().includes(busca.toLowerCase()) ||
      pag.usuario_nome?.toLowerCase().includes(busca.toLowerCase()) ||
      pag.mercadopago_id?.toLowerCase().includes(busca.toLowerCase());

    const matchStatus = filtroStatus === "todos" || pag.status === filtroStatus;

    return matchBusca && matchStatus;
  });

  const totalAprovados = pagamentos.filter((p) => p.status === "approved").length;
  const totalPendentes = pagamentos.filter((p) => p.status === "pending").length;
  const totalRejeitados = pagamentos.filter((p) => p.status === "rejected").length;
  const valorTotal = pagamentos
    .filter((p) => p.status === "approved")
    .reduce((sum, p) => sum + p.valor, 0);

  return (
    <Sidebar>
      <div className={styles.pagamentosContent}>
        <div className={styles.titleRow}>
          <h1>
            <CreditCard size={24} /> Pagamentos
          </h1>
        </div>

        <div className={styles.stats}>
          <div className={styles.statCard}>
            <h3>Total Aprovados</h3>
            <p className={styles.aprovado}>{totalAprovados}</p>
          </div>
          <div className={styles.statCard}>
            <h3>Pendentes</h3>
            <p className={styles.pendente}>{totalPendentes}</p>
          </div>
          <div className={styles.statCard}>
            <h3>Rejeitados</h3>
            <p className={styles.rejeitado}>{totalRejeitados}</p>
          </div>
          <div className={styles.statCard}>
            <h3>Faturamento</h3>
            <p className={styles.faturamento}>R$ {valorTotal.toFixed(2)}</p>
          </div>
        </div>

        <div className={styles.filters}>
          <div className={styles.searchBox}>
            <Search size={18} />
            <input
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              placeholder="Buscar por empresa, usuário ou ID..."
              className={styles.searchInput}
            />
          </div>

          <select
            value={filtroStatus}
            onChange={(e) => setFiltroStatus(e.target.value)}
            className={styles.filterSelect}
          >
            <option value="todos">Todos os status</option>
            <option value="pending">Pendentes</option>
            <option value="approved">Aprovados</option>
            <option value="rejected">Rejeitados</option>
            <option value="cancelled">Cancelados</option>
          </select>
        </div>

        <div className={styles.tableBox}>
          {loading ? (
            <div className={styles.loading}>Carregando pagamentos...</div>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>ID Mercado Pago</th>
                  <th>Empresa</th>
                  <th>Usuário</th>
                  <th>Plano</th>
                  <th>Valor</th>
                  <th>Status</th>
                  <th>Data</th>
                  <th>Ações</th>
                </tr>
              </thead>
              <tbody>
                {pagamentosFiltrados.map((pag) => (
                  <tr key={pag.id}>
                    <td>{pag.mercadopago_id}</td>
                    <td>{pag.empresa_nome || "N/A"}</td>
                    <td>{pag.usuario_nome || "N/A"}</td>
                    <td>{pag.plano_nome || "N/A"}</td>
                    <td>R$ {pag.valor.toFixed(2)}</td>
                    <td className={styles.statusCell}>
                      {getStatusIcon(pag.status)}
                      <span className={styles.statusText}>
                        {getStatusText(pag.status)}
                      </span>
                    </td>
                    <td>{new Date(pag.data_criacao).toLocaleDateString("pt-BR")}</td>
                    <td className={styles.actionBtns}>
                      <button title="Ver detalhes">
                        <Eye size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {!loading && pagamentosFiltrados.length === 0 && (
            <div className={styles.noResults}>Nenhum pagamento encontrado.</div>
          )}
        </div>
      </div>
    </Sidebar>
  );
}

export default PagamentosAdmin;