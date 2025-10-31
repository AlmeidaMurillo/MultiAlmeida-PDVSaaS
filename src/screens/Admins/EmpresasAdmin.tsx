import { useEffect, useState } from "react";
import Sidebar from "../../Components/Sidebar/Sidebar";
import styles from "./EmpresasAdmin.module.css";
import { Eye, Edit, Trash2, Building2, Plus } from "lucide-react";
import { IMaskInput } from "react-imask";

export default function EmpresasAdmin() {
    useEffect(() => {
        document.title = "MultiAlmeida | Empresas Admin";
    }, []);

    const [empresas, setEmpresas] = useState([
        { id: 1, nome: "Mercado Bom Preço", email: "contato@bompreco.com", cnpj: "12.345.678/0001-10", telefone: "(11) 99999-2222", plano: "Premium", status: "Ativo" },
        { id: 2, nome: "Padaria Doce Pão", email: "vendas@docepao.com", cnpj: "98.765.432/0001-55", telefone: "(11) 98888-2111", plano: "Básico", status: "Pendente" },
    ]);

    const [modal, setModal] = useState(false);
    const [form, setForm] = useState({
        nome: "",
        email: "",
        cnpj: "",
        telefone: "",
        plano: "Básico",
        status: "Ativo",
    });

    function handleChange(e) {
        setForm({ ...form, [e.target.name]: e.target.value });
    }

    function salvarEmpresa() {
        setEmpresas([...empresas, { id: Date.now(), ...form }]);
        setForm({ nome: "", email: "", cnpj: "", telefone: "", plano: "Básico", status: "Ativo" });
        setModal(false);
    }

    function excluirEmpresa(id) {
        setEmpresas(empresas.filter(emp => emp.id !== id));
    }

    return (
        <Sidebar>
            <div className={styles.empresasContent}>
                <div className={styles.titleRow}>
                    <h1><Building2 size={24} /> Empresas</h1>
                    <button className={styles.btnAdd} onClick={() => setModal(true)}>
                        <Plus size={18} /> Nova Empresa
                    </button>
                </div>

                <div className={styles.tableBox}>
                    <table>
                        <thead>
                            <tr>
                                <th>Nome</th>
                                <th>E-mail</th>
                                <th>CNPJ</th>
                                <th>Telefone</th>
                                <th>Plano</th>
                                <th>Status</th>
                                <th>Ações</th>
                            </tr>
                        </thead>
                        <tbody>
                            {empresas.map(emp => (
                                <tr key={emp.id}>
                                    <td>{emp.nome}</td>
                                    <td>{emp.email}</td>
                                    <td>{emp.cnpj}</td>
                                    <td>{emp.telefone}</td>
                                    <td>{emp.plano}</td>
                                    <td className={emp.status === "Ativo" ? styles.ativo : styles.pendente}>{emp.status}</td>
                                    <td className={styles.actionBtns}>
                                        <button><Eye size={16} /></button>
                                        <button><Edit size={16} /></button>
                                        <button onClick={() => excluirEmpresa(emp.id)}><Trash2 size={16} /></button>
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

                            <input name="nome" value={form.nome} onChange={handleChange} placeholder="Nome da empresa" />
                            <input name="email" value={form.email} onChange={handleChange} placeholder="E-mail" />

                            <IMaskInput
                                mask="00.000.000/0000-00"
                                value={form.cnpj}
                                onAccept={(value: string) => setForm({ ...form, cnpj: value })}
                                placeholder="CNPJ"
                                className={styles.input}
                            />

                            <IMaskInput
                                mask="(00) 00000-0000"
                                value={form.telefone}
                                onAccept={(value: string) => setForm({ ...form, telefone: value })}
                                placeholder="Telefone"
                                className={styles.input}
                            />

                            <select name="plano" value={form.plano} onChange={handleChange}>
                                <option>Básico</option>
                                <option>Premium</option>
                            </select>

                            <select name="status" value={form.status} onChange={handleChange}>
                                <option>Ativo</option>
                                <option>Pendente</option>
                            </select>

                            <div className={styles.modalBtns}>
                                <button onClick={salvarEmpresa}>Salvar</button>
                                <button className={styles.btnCancel} onClick={() => setModal(false)}>Cancelar</button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </Sidebar>
    );
}
