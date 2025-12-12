import React, { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import Sidebar from "../../Components/Sidebar/Sidebar";
import styles from "./Perfil.module.css";
import { auth, api } from "../../auth";
import {
  FaCamera,
  FaKey,
  FaUserEdit,
  FaBuilding,
  FaExchangeAlt,
  FaSignOutAlt,
  FaUser,
  FaTimes,
} from "react-icons/fa";

function Perfil() {
  const navigate = useNavigate();

  const [dadosUsuario, setDadosUsuario] = useState({
    nome: "",
    email: "",
    telefone: "",
    cpf: "",
    permissao: "",
    fotoPerfil: "",
  });
  const [dadosEmpresa, setDadosEmpresa] = useState({
    nome: "",
    cnpj: "",
    endereco: "",
  });
  const [dadosPlano, setDadosPlano] = useState({
    nome: "Nenhum",
    periodo: "N/A",
    preco: 0,
    duracao_dias: 0,
    beneficios: [],
    quantidade_empresas: 0,
    data_assinatura: null,
    data_vencimento: null,
    status: "inativo",
    diasRestantes: 0,
    percentualDias: 100,
  });

  const [mostrarModalSenha, setMostrarModalSenha] = useState(false);
  const [mostrarModalPlano, setMostrarModalPlano] = useState(false);
  const [mostrarModalDados, setMostrarModalDados] = useState(false);
  const [mostrarModalEmpresa, setMostrarModalEmpresa] = useState(false);
  const [mostrarModalFoto, setMostrarModalFoto] = useState(false);

  const [planosDisponiveis, setPlanosDisponiveis] = useState([]);
  
  // Estados para os modais de senha
  const [senha, setSenha] = useState({
    atual: "",
    nova: "",
    confirmacao: ""
  });

  // Estados para os modais de plano
  const [novoPlano, setNovoPlano] = useState({
    periodo: "",
    planoNome: ""
  });

  // Estados locais para edição de dados
  const [dadosLocaisUsuario, setDadosLocaisUsuario] = useState(dadosUsuario);
  const [dadosLocaisEmpresa, setDadosLocaisEmpresa] = useState(dadosEmpresa);

  const calcularDiasRestantes = (dataVencimento, duracao_dias) => {
    if (!dataVencimento) return { dias: 0, percentual: 0 };
    const hoje = new Date();
    const vencimento = new Date(dataVencimento);
    const diasRestantes = Math.ceil((vencimento - hoje) / (1000 * 60 * 60 * 24));
    const percentual = Math.max(0, Math.min(100, (diasRestantes / duracao_dias) * 100));
    return { dias: Math.max(0, diasRestantes), percentual };
  };

  const fetchUserDetails = useCallback(async () => {
    try {
      const data = await auth.getUserDetails();
      if (data) {
        setDadosUsuario({
          nome: data.nome || "",
          email: data.email || "",
          telefone: data.telefone || "",
          cpf: data.cpf || "",
          permissao: data.papel || "",
          fotoPerfil: data.fotoPerfil || "",
        });
        setDadosLocaisUsuario({
          nome: data.nome || "",
          email: data.email || "",
          telefone: data.telefone || "",
          cpf: data.cpf || "",
          permissao: data.papel || "",
          fotoPerfil: data.fotoPerfil || "",
        });

        if (data.empresa) {
          setDadosEmpresa({
            nome: data.empresa.nome || "",
            cnpj: data.empresa.cnpj || "",
            endereco: data.empresa.endereco || "",
          });
          setDadosLocaisEmpresa({
            nome: data.empresa.nome || "",
            cnpj: data.empresa.cnpj || "",
            endereco: data.empresa.endereco || "",
          });
        }

        if (data.assinaturas && data.assinaturas.length > 0) {
          const assinatura = data.assinaturas[0];
          
          let beneficios = [];
          if (assinatura.beneficios) {
            try {
              beneficios = typeof assinatura.beneficios === 'string' 
                ? JSON.parse(assinatura.beneficios) 
                : assinatura.beneficios;
            } catch {
              beneficios = [];
            }
          }

          const { dias, percentual } = calcularDiasRestantes(assinatura.data_vencimento, assinatura.duracao_dias);

          setDadosPlano({
            nome: assinatura.plano_nome || "Plano",
            periodo: assinatura.periodo || "N/A",
            preco: assinatura.preco || 0,
            duracao_dias: assinatura.duracao_dias || 0,
            beneficios: beneficios,
            quantidade_empresas: assinatura.quantidade_empresas || 0,
            data_assinatura: assinatura.data_assinatura ? new Date(assinatura.data_assinatura).toLocaleDateString('pt-BR') : "N/A",
            data_vencimento: assinatura.data_vencimento ? new Date(assinatura.data_vencimento).toLocaleDateString('pt-BR') : "N/A",
            status: assinatura.status || "inativo",
            diasRestantes: dias,
            percentualDias: percentual,
          });
        } else {
          setDadosPlano({
            nome: "Nenhum",
            periodo: "N/A",
            preco: 0,
            duracao_dias: 0,
            beneficios: [],
            quantidade_empresas: 0,
            data_assinatura: null,
            data_vencimento: null,
            status: "inativo",
          });
        }
      }
    } catch (error) {
      if (error.response && error.response.status === 401) {
        navigate('/login');
      }
    }
  }, [navigate]);

  const fetchPlanos = useCallback(async () => {
    try {
      const response = await api.get("/api/planos?grouped=true"); 
      const todosPlanos = response.data.planos || [];
      setPlanosDisponiveis(todosPlanos);
    } catch {
      setPlanosDisponiveis([]);
    }
  }, []);

  useEffect(() => {
    fetchUserDetails();
    fetchPlanos();
  }, [fetchUserDetails, fetchPlanos]);

  const handleFotoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setDadosUsuario({ ...dadosUsuario, fotoPerfil: reader.result });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleLogout = async () => {
    await auth.logout();
  };

  // Handlers para Modal Editar Dados Usuário
  const handleChangeDadosUsuario = (e) => {
    setDadosLocaisUsuario({ ...dadosLocaisUsuario, [e.target.name]: e.target.value });
  };

  const handleSubmitDadosUsuario = async () => {
    try {
      await auth.updateUserDetails(dadosLocaisUsuario);
      alert('Dados pessoais atualizados com sucesso!');
      setMostrarModalDados(false);
      fetchUserDetails();
    } catch (error) {
      alert('Falha ao atualizar dados pessoais. Tente novamente.', error);
    }
  };

  // Handlers para Modal Editar Dados Empresa
  const handleChangeDadosEmpresa = (e) => {
    setDadosLocaisEmpresa({ ...dadosLocaisEmpresa, [e.target.name]: e.target.value });
  };

  const handleSubmitDadosEmpresa = async () => {
    try {
      await auth.updateUserDetails({ ...dadosUsuario, empresa: dadosLocaisEmpresa });
      alert('Dados da empresa atualizados com sucesso!');
      setMostrarModalEmpresa(false);
      fetchUserDetails();
    } catch (error) {
      alert('Falha ao atualizar dados da empresa. Tente novamente.', error);
    }
  };

  // Handlers para Modal Alterar Senha
  const handleChangeSenha = (e) => {
    setSenha({ ...senha, [e.target.name]: e.target.value });
  };

  const handleSubmitSenha = async () => {
    if (!senha.atual || !senha.nova || !senha.confirmacao) {
      alert('Preencha todos os campos de senha');
      return;
    }

    if (senha.nova !== senha.confirmacao) {
      alert('A nova senha e a confirmação não coincidem');
      return;
    }

    if (senha.nova.length < 6) {
      alert('A nova senha deve ter no mínimo 6 caracteres');
      return;
    }

    try {
      await auth.changePassword({
        senhaAtual: senha.atual,
        novaSenha: senha.nova
      });
      alert('Senha alterada com sucesso!');
      setMostrarModalSenha(false);
      setSenha({ atual: "", nova: "", confirmacao: "" });
    } catch (error) {
      alert('Erro ao alterar senha. Verifique a senha atual.', error);
    }
  };

  // Handlers para Modal Alterar Plano
  const planoSelecionado = React.useMemo(() => {
    const planoGrupo = planosDisponiveis.find(p => p.nome === novoPlano.planoNome);
    if (planoGrupo && novoPlano.periodo) {
      return {
        ...planoGrupo,
        ...planoGrupo[novoPlano.periodo]
      };
    }
    return null;
  }, [novoPlano.planoNome, novoPlano.periodo, planosDisponiveis]);

  const handleSubmitPlano = async () => {
    if (!novoPlano.periodo || !novoPlano.planoNome) {
      alert('Selecione um período e um plano');
      return;
    }

    try {
      const planoSelecionadoGrupo = planosDisponiveis.find(p => p.nome === novoPlano.planoNome);
      if (!planoSelecionadoGrupo) {
        alert('Plano não encontrado');
        return;
      }

      const periodoInfo = planoSelecionadoGrupo[novoPlano.periodo];
      if (!periodoInfo || !periodoInfo.id) {
        alert('Período não disponível para este plano');
        return;
      }

      await auth.alterarPlano({
        planoId: periodoInfo.id,
        periodo: novoPlano.periodo
      });
      alert('Plano alterado com sucesso!');
      setMostrarModalPlano(false);
      setNovoPlano({ periodo: "", planoNome: "" });
      fetchUserDetails();
    } catch (error) {
      alert('Erro ao alterar plano. Tente novamente.', error);
    }
  };

  // Modal Inline - Editar Dados Usuário
  const ModalEditarDadosUsuario = () => {
    if (!mostrarModalDados) return null;
    return (
      <div className={styles.modalOverlay}>
        <div className={styles.modalContent}>
          <h2>Editar Dados Pessoais</h2>
          <input 
            type="text" 
            className={styles.modalInput} 
            placeholder="Nome" 
            name="nome"
            value={dadosLocaisUsuario.nome} 
            onChange={handleChangeDadosUsuario} 
          />
          <input 
            type="email" 
            className={styles.modalInput} 
            placeholder="Email" 
            name="email"
            value={dadosLocaisUsuario.email} 
            onChange={handleChangeDadosUsuario} 
          />
          <input 
            type="text" 
            className={styles.modalInput} 
            placeholder="Telefone" 
            name="telefone"
            value={dadosLocaisUsuario.telefone} 
            onChange={handleChangeDadosUsuario} 
          />
          <input 
            type="text" 
            className={styles.modalInput} 
            placeholder="CPF" 
            name="cpf"
            value={dadosLocaisUsuario.cpf} 
            onChange={handleChangeDadosUsuario} 
          />
          <div className={styles.modalButtons}>
            <button className={styles.btn} onClick={handleSubmitDadosUsuario}>Salvar</button>
            <button className={styles.btnCancel} onClick={() => setMostrarModalDados(false)}>Cancelar</button>
          </div>
        </div>
      </div>
    );
  };

  // Modal Inline - Editar Dados Empresa
  const ModalEditarDadosEmpresa = () => {
    if (!mostrarModalEmpresa) return null;
    return (
      <div className={styles.modalOverlay} onClick={() => setMostrarModalEmpresa(false)}>
        <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
          <h2>Editar Dados da Empresa</h2>
          <input 
            type="text" 
            className={styles.modalInput} 
            placeholder="Nome da Empresa" 
            name="nome"
            value={dadosLocaisEmpresa.nome} 
            onChange={handleChangeDadosEmpresa} 
          />
          <input 
            type="text" 
            className={styles.modalInput} 
            placeholder="CNPJ" 
            name="cnpj"
            value={dadosLocaisEmpresa.cnpj} 
            onChange={handleChangeDadosEmpresa} 
          />
          <input 
            type="text" 
            className={styles.modalInput} 
            placeholder="Endereço" 
            name="endereco"
            value={dadosLocaisEmpresa.endereco} 
            onChange={handleChangeDadosEmpresa} 
          />
          <div className={styles.modalButtons}>
            <button className={styles.btn} onClick={handleSubmitDadosEmpresa}>Salvar</button>
            <button className={styles.btnCancel} onClick={() => setMostrarModalEmpresa(false)}>Cancelar</button>
          </div>
        </div>
      </div>
    );
  };

  // Modal Inline - Alterar Senha
  const ModalAlterarSenha = () => {
    if (!mostrarModalSenha) return null;
    return (
      <div className={styles.modalOverlay} onClick={() => setMostrarModalSenha(false)}>
        <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
          <h2>Alterar Senha</h2>
          <input 
            type="password" 
            placeholder="Senha atual" 
            className={styles.modalInput}
            name="atual"
            value={senha.atual}
            onChange={handleChangeSenha}
          />
          <input 
            type="password" 
            placeholder="Nova senha" 
            className={styles.modalInput}
            name="nova"
            value={senha.nova}
            onChange={handleChangeSenha}
          />
          <input 
            type="password" 
            placeholder="Confirmar senha" 
            className={styles.modalInput}
            name="confirmacao"
            value={senha.confirmacao}
            onChange={handleChangeSenha}
          />
          <div className={styles.modalButtons}>
            <button className={styles.btn} onClick={handleSubmitSenha}>Salvar</button>
            <button className={styles.btnCancel} onClick={() => setMostrarModalSenha(false)}>Cancelar</button>
          </div>
        </div>
      </div>
    );
  };

  // Modal Inline - Alterar Plano
  const ModalAlterarPlano = () => {
    if (!mostrarModalPlano) return null;
    return (
      <div className={styles.modalOverlay} onClick={() => setMostrarModalPlano(false)}>
        <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
          <h2>Alterar Plano</h2>
          <label className={styles.modalLabel}>Selecione o Plano:</label>
          <select 
            className={styles.modalInput}
            value={novoPlano.planoNome}
            onChange={(e) => setNovoPlano({ ...novoPlano, planoNome: e.target.value })}
          >
            <option value="">-- Selecione um plano --</option>
            {planosDisponiveis.map((plano) => (
              <option key={plano.nome} value={plano.nome}>
                {plano.nome}
              </option>
            ))}
          </select>

          <label className={styles.modalLabel}>Selecione o Período:</label>
          <select 
            className={styles.modalInput}
            value={novoPlano.periodo}
            onChange={(e) => setNovoPlano({ ...novoPlano, periodo: e.target.value })}
            disabled={!novoPlano.planoNome}
          >
            <option value="">-- Selecione o período --</option>
            {planoSelecionado && planoSelecionado.mensal && (
              <option value="mensal">
                Mensal - R$ {planoSelecionado.mensal.preco?.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </option>
            )}
            {planoSelecionado && planoSelecionado.trimestral && (
              <option value="trimestral">
                Trimestral - R$ {planoSelecionado.trimestral.preco?.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </option>
            )}
            {planoSelecionado && planoSelecionado.semestral && (
              <option value="semestral">
                Semestral - R$ {planoSelecionado.semestral.preco?.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </option>
            )}
            {planoSelecionado && planoSelecionado.anual && (
              <option value="anual">
                Anual - R$ {planoSelecionado.anual.preco?.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </option>
            )}
          </select>

          <div className={styles.modalButtons}>
            <button className={styles.btn} onClick={handleSubmitPlano}>Alterar</button>
            <button className={styles.btnCancel} onClick={() => { setMostrarModalPlano(false); setNovoPlano({ periodo: "", planoNome: "" }); }}>Cancelar</button>
          </div>
        </div>
      </div>
    );
  };

  // Modal Inline - Visualizar Foto
  const ModalVisualizarFoto = () => {
    if (!mostrarModalFoto) return null;
    return (
      <div className={styles.modalOverlay} onClick={() => setMostrarModalFoto(false)}>
        <div className={styles.modalContent}>
          <button 
            className={styles.closeButton}
            onClick={() => setMostrarModalFoto(false)}
          >
            <FaTimes />
          </button>
          <img 
            src={dadosUsuario.fotoPerfil || "https://via.placeholder.com/300"} 
            alt="Foto de Perfil" 
            className={styles.fullImage} 
          />
        </div>
      </div>
    );
  };

  return (
    <div className={styles.perfilContainer}>
      <Sidebar />
      <div className={styles.mainContent}>
        <h1>Meu Perfil</h1>
        <div className={styles.profileSection}>
          <div className={styles.profileHeader}>
            <div className={styles.profileImageContainer}>
              <img
                src={dadosUsuario.fotoPerfil || "https://via.placeholder.com/150"}
                alt="Foto de Perfil"
                className={styles.profileImage}
                onClick={() => setMostrarModalFoto(true)}
              />
              <button className={styles.cameraIcon} onClick={() => document.getElementById('fileInput').click()}>
                <FaCamera />
              </button>
              <input
                type="file"
                id="fileInput"
                style={{ display: 'none' }}
                onChange={handleFotoChange}
                accept="image/*"
              />
            </div>
            <h2>{dadosUsuario.nome}</h2>
            <p>{dadosUsuario.email}</p>
          </div>
          <div className={styles.profileActions}>
            <button onClick={() => setMostrarModalDados(true)}>
              <FaUserEdit /> Editar Dados Pessoais
            </button>
            <button onClick={() => setMostrarModalSenha(true)}>
              <FaKey /> Alterar Senha
            </button>
            {dadosUsuario.permissao === 'usuario' && (
              <>
                <button onClick={() => setMostrarModalEmpresa(true)}>
                  <FaBuilding /> Editar Dados da Empresa
                </button>
                <button onClick={() => setMostrarModalPlano(true)}>
                  <FaExchangeAlt /> Alterar Plano
                </button>
              </>
            )}
            <button onClick={handleLogout} className={styles.logoutButton}>
              <FaSignOutAlt /> Sair
            </button>
          </div>
        </div>

        {dadosUsuario.permissao === 'usuario' && (
          <div className={styles.planSection}>
            <h3>Meu Plano</h3>
            <p>Plano: {dadosPlano.nome}</p>
            <p>Status: {dadosPlano.status}</p>
            {dadosPlano.data_vencimento && <p>Vencimento: {dadosPlano.data_vencimento}</p>}
            {dadosPlano.diasRestantes > 0 && <p>Dias Restantes: {dadosPlano.diasRestantes}</p>}
            <div className={styles.progressBarContainer}>
              <div
                className={styles.progressBar}
                style={{ width: `${dadosPlano.percentualDias}%` }}
              ></div>
            </div>
            <h4>Benefícios:</h4>
            <ul>
              {dadosPlano.beneficios.map((beneficio, index) => (
                <li key={index}>{beneficio}</li>
              ))}
            </ul>
          </div>
        )}

        {/* Renderizar os modais */}
        <ModalEditarDadosUsuario />
        <ModalEditarDadosEmpresa />
        <ModalAlterarSenha />
        <ModalAlterarPlano />
        <ModalVisualizarFoto />
      </div>
    </div>
  );
}

export default Perfil;