import { useEffect, useState } from "react";
import Sidebar from "../../Components/Sidebar/Sidebar";
import styles from "./EmpresasAdmin.module.css";
import { Eye, Edit, Trash2, Building2, Plus, Search } from "lucide-react";
import { api } from "../../auth";
import { IMaskInput } from "react-imask";

function EmpresasAdmin() {
  useEffect(() => {
    document.title = "MultiAlmeida | Empresas Admin";
  }, []);

  const [empresas, setEmpresas] = useState([]);
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState({
    nome: "",
    email: "",
    cnpj: "",
    telefone: "",
    periodo: "",
    plano: "",
    status: "Ativo",
    ownerEmail: "",
  });

  const [busca, setBusca] = useState("");

  const planosCadastro = [
    { nome: "Básico", mensal: { preco: "49.90" }, trimestral: { preco: "139.90" }, semestral: { preco: "269.90" }, anual: { preco: "499.90" } },
    { nome: "Pro", mensal: { preco: "99.90" }, trimestral: { preco: "279.90" }, semestral: { preco: "539.90" }, anual: { preco: "999.90" } },
    { nome: "Premium", mensal: { preco: "149.90" }, trimestral: { preco: "419.90" }, semestral: { preco: "809.90" }, anual: { preco: "1499.90" } },
  ];

  const planosFiltrados = form.periodo
    ? planosCadastro.filter((p) => p[form.periodo].preco !== "0")
    : [];

  function handleChange(e) {
    const { name, value } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  }

  useEffect(() => {
    const load = async () => {
      try {
        const res = await api.get("/api/admin/empresas");
        setEmpresas(res.data.empresas || []);
      } catch (err) {
        console.error("Erro carregando empresas:", err);
      }
    };
    load();
  }, []); 

  async function salvarEmpresa() {
    if (!form.periodo || !form.plano) return alert("Selecione período e plano!");

    try {
      const payload = {
        nome: form.nome,
        email: form.email,
        cnpj: form.cnpj,
        telefone: form.telefone,
        periodo: form.periodo,
        plano: form.plano,
        status: form.status,
        ownerEmail: form.ownerEmail || undefined,
      };

      const res = await api.post("/api/admin/empresas", payload);
      const listRes = await api.get("/api/admin/empresas");
      setEmpresas(listRes.data.empresas || []);

      if (res.data.invitation?.token) {
        alert(
          "Convite criado. Token: " +
            res.data.invitation.token +
            "\nEnvie para o dono da empresa."
        );
      }

      setForm({
        nome: "",
        email: "",
        cnpj: "",
        telefone: "",
        periodo: "",
        plano: "",
        status: "Ativo",
        ownerEmail: "",
      });
      setModal(false);
    } catch (err) {
      console.error("Erro criando empresa:", err);
      alert("Erro ao criar empresa");
    }
  }

  function excluirEmpresa(id) {
    setEmpresas(empresas.filter((emp) => emp.id !== id));
  }

  const empresasFiltradas = empresas.filter((emp) =>
    emp.nome.toLowerCase().includes(busca.toLowerCase())
  );

  return (
    <Sidebar>
      <div className={styles.empresasContent}>
        <div className={styles.titleRow}>
          <h1>
            <Building2 size={24} /> Empresas
          </h1>
          <button className={styles.btnAdd} onClick={() => setModal(true)}>
            <Plus size={18} /> Nova Empresa
          </button>
        </div>

        <div className={styles.searchBox}>
          <Search size={18} />
          <input
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            placeholder="Pesquisar empresa..."
          />
        </div>

        <div className={styles.tableBox}>
          <table>
            <thead>
              <tr>
                <th>Nome</th>
                <th>E-mail</th>
                <th>Telefone</th>
                <th>Período</th>
                <th>Plano</th>
                <th>Vencimento</th>
                <th>Status</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {empresasFiltradas.map((emp) => (
                <tr key={emp.id}>
                  <td>{emp.nome}</td>
                  <td>{emp.email}</td>
                  <td>{emp.telefone}</td>
                  <td>{emp.periodo}</td>
                  <td>{emp.plano}</td>
                  <td>
                    {emp.data_vencimento ? (
                      <div>
                        <div>
                          {new Date(emp.data_vencimento).toLocaleDateString("pt-BR")}
                        </div>
                        {emp.dias_restantes !== undefined &&
                          emp.dias_restantes !== null && (
                            <small
                              style={{
                                color:
                                  emp.dias_restantes < 0
                                    ? "#d32f2f"
                                    : emp.dias_restantes <= 7
                                    ? "#ff9800"
                                    : "#4caf50",
                              }}
                            >
                              {emp.dias_restantes < 0
                                ? `Vencido há ${Math.abs(
                                    emp.dias_restantes
                                  )} dias`
                                : emp.dias_restantes === 0
                                ? "Vence hoje"
                                : `${emp.dias_restantes} dias restantes`}
                            </small>
                          )}
                      </div>
                    ) : (
                      "Sem vencimento"
                    )}
                  </td>
                  <td
                    className={
                      emp.status === "Ativo" ? styles.ativo : styles.pendente
                    }
                  >
                    {emp.status}
                  </td>
                  <td className={styles.actionBtns}>
                    <button>
                      <Eye size={16} />
                    </button>
                    <button>
                      <Edit size={16} />
                    </button>
                    <button onClick={() => excluirEmpresa(emp.id)}>
                      <Trash2 size={16} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {modal && (
          <div className={styles.modalBg}>
            <div className={styles.modal}>
              <h2>Cadastrar Empresa</h2>

              <input
                name="nome"
                value={form.nome}
                onChange={handleChange}
                placeholder="Nome da empresa"
              />
              <input
                name="email"
                value={form.email}
                onChange={handleChange}
                placeholder="E-mail"
              />
              <input
                name="ownerEmail"
                value={form.ownerEmail}
                onChange={handleChange}
                placeholder="E-mail do dono (opcional)"
              />

              <IMaskInput
                mask="00.000.000/0000-00"
                value={form.cnpj}
                onAccept={(value) => setForm((prev) => ({ ...prev, cnpj: value }))}
                placeholder="CNPJ"
                className={styles.input}
              />

              <IMaskInput
                mask="(00) 00000-0000"
                value={form.telefone}
                onAccept={(value) => setForm((prev) => ({ ...prev, telefone: value }))}
                placeholder="Telefone"
                className={styles.input}
              />

              <select name="periodo" value={form.periodo} onChange={handleChange}>
                <option value="">Selecione o período</option>
                <option value="mensal">Mensal</option>
                <option value="trimestral">Trimestral</option>
                <option value="semestral">Semestral</option>
                <option value="anual">Anual</option>
              </select>

              {form.periodo && (
                <select name="plano" value={form.plano} onChange={handleChange}>
                  <option value="">Selecione o plano</option>
                  {planosFiltrados.map((p, i) => (
                    <option key={i} value={p.nome}>
                      {p.nome} — R$ {p[form.periodo].preco}
                    </option>
                  ))}
                </select>
              )}

              <select name="status" value={form.status} onChange={handleChange}>
                <option>Ativo</option>
                <option>Pendente</option>
              </select>

              <div className={styles.modalBtns}>
                <button onClick={salvarEmpresa}>Salvar</button>
                <button
                  className={styles.btnCancel}
                  onClick={() => setModal(false)}
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

export default EmpresasAdmin;