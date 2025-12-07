import React, { useEffect, useState, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import Sidebar from "../../Components/Sidebar/Sidebar";
import styles from "./Perfil.module.css";
import { auth } from "../../auth";
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

  // Estados para senha
  const [senha, setSenha] = useState({
    atual: "",
    nova: "",
    confirmacao: ""
  });

  // Estados para plano
  const [planosDisponiveis, setPlanosDisponiveis] = useState([]);
  const [novoPlano, setNovoPlano] = useState({
    periodo: "",
    planoNome: ""
  });

  // Função para calcular dias restantes
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

        if (data.empresa) {
          setDadosEmpresa({
            nome: data.empresa.nome || "",
            cnpj: data.empresa.cnpj || "",
            endereco: data.empresa.endereco || "",
          });
        }

        // Processar dados do plano
        if (data.assinaturas && data.assinaturas.length > 0) {
          const assinatura = data.assinaturas[0];
          
          // Parsear benefícios se for string JSON
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
          // Se não houver assinatura, resetar dados
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
      console.error("Erro ao buscar dados do usuário:", error);
      if (error.response && error.response.status === 401) {
        navigate('/login');
      }
    }
  }, [navigate]);

  useEffect(() => {
    fetchUserDetails();
    fetchPlanos();
  }, [fetchUserDetails]);

  const fetchPlanos = async () => {
    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/api/planos`
      );
      const data = await response.json();
      console.log("Resposta de planos:", data);
      // A API retorna { planos: [...] }
      const planosArray = data.planos || data || [];
      console.log("Planos extraídos:", planosArray);
      setPlanosDisponiveis(planosArray);
    } catch (error) {
      console.error("Erro ao buscar planos:", error);
      setPlanosDisponiveis([]);
    }
  };

  const handleUpdateUserData = async () => {
    try {
      await auth.updateUserDetails({ ...dadosUsuario, empresa: dadosEmpresa });
      setMostrarModalDados(false);
      setMostrarModalEmpresa(false);
      alert('Dados atualizados com sucesso!');
    } catch (error) {
      console.error("Erro ao atualizar dados:", error);
      alert('Falha ao atualizar dados. Tente novamente.');
    }
  };

  const handleChangeSenha = async () => {
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
      setMostrarModalSenha(false);
      setSenha({ atual: "", nova: "", confirmacao: "" });
      alert('Senha alterada com sucesso!');
    } catch (error) {
      console.error("Erro ao alterar senha:", error);
      alert('Erro ao alterar senha. Verifique a senha atual.');
    }
  };

  const handleAlterarPlano = async () => {
    if (!novoPlano.periodo || !novoPlano.planoNome) {
      alert('Selecione um período e um plano');
      return;
    }

    try {
      const planoSelecionado = planosDisponiveis.find(p => p.nome === novoPlano.planoNome);
      if (!planoSelecionado) {
        alert('Plano não encontrado');
        return;
      }

      const periodoInfo = planoSelecionado[novoPlano.periodo];
      if (!periodoInfo) {
        alert('Período não disponível para este plano');
        return;
      }

      await auth.alterarPlano({
        planoId: periodoInfo.id,
        periodo: novoPlano.periodo
      });
      setMostrarModalPlano(false);
      setNovoPlano({ periodo: "", planoNome: "" });
      fetchUserDetails();
      alert('Plano alterado com sucesso!');
    } catch (error) {
      console.error("Erro ao alterar plano:", error);
      alert('Erro ao alterar plano. Tente novamente.');
    }
  };

  const planoSelecionado = useMemo(() => {
    return planosDisponiveis.find(p => p.nome === novoPlano.planoNome);
  }, [novoPlano.planoNome, planosDisponiveis]);

  // Debug
  useEffect(() => {
    console.log("Planos disponíveis:", planosDisponiveis);
    console.log("Novo plano selecionado:", novoPlano);
    console.log("Plano encontrado:", planoSelecionado);
  }, [planosDisponiveis, novoPlano, planoSelecionado]);

  const handleFotoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setDadosUsuario({ ...dadosUsuario, fotoPerfil: reader.result });
        // Here you would also call an API to upload the photo
      };
      reader.readAsDataURL(file);
    }
  };

  const handleLogout = async () => {
    await auth.logout();
    navigate("/");
  };

  const renderModais = () => (
    <>
      {mostrarModalSenha && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalContent}>
            <h2>Alterar Senha</h2>
            <input 
              type="password" 
              placeholder="Senha atual" 
              className={styles.modalInput}
              value={senha.atual}
              onChange={(e) => setSenha({ ...senha, atual: e.target.value })}
            />
            <input 
              type="password" 
              placeholder="Nova senha" 
              className={styles.modalInput}
              value={senha.nova}
              onChange={(e) => setSenha({ ...senha, nova: e.target.value })}
            />
            <input 
              type="password" 
              placeholder="Confirmar senha" 
              className={styles.modalInput}
              value={senha.confirmacao}
              onChange={(e) => setSenha({ ...senha, confirmacao: e.target.value })}
            />
            <div className={styles.modalButtons}>
              <button className={styles.btn} onClick={handleChangeSenha}>Salvar</button>
              <button className={styles.btnCancel} onClick={() => setMostrarModalSenha(false)}>Cancelar</button>
            </div>
          </div>
        </div>
      )}
      {mostrarModalPlano && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalContent}>
            <h2>Alterar Plano</h2>
            
            {/* Select de Plano */}
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

            {/* Select de Período */}
            <label className={styles.modalLabel}>Selecione o Período:</label>
            <select 
              className={styles.modalInput}
              value={novoPlano.periodo}
              onChange={(e) => setNovoPlano({ ...novoPlano, periodo: e.target.value })}
              disabled={!novoPlano.planoNome}
            >
              <option value="">-- Selecione o período --</option>
              {planoSelecionado?.mensal && (
                <option value="mensal">
                  Mensal - R$ {planoSelecionado.mensal.preco?.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </option>
              )}
              {planoSelecionado?.trimestral && (
                <option value="trimestral">
                  Trimestral - R$ {planoSelecionado.trimestral.preco?.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </option>
              )}
              {planoSelecionado?.semestral && (
                <option value="semestral">
                  Semestral - R$ {planoSelecionado.semestral.preco?.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </option>
              )}
              {planoSelecionado?.anual && (
                <option value="anual">
                  Anual - R$ {planoSelecionado.anual.preco?.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </option>
              )}
            </select>

            <div className={styles.modalButtons}>
              <button className={styles.btn} onClick={handleAlterarPlano}>Alterar</button>
              <button className={styles.btnCancel} onClick={() => { setMostrarModalPlano(false); setNovoPlano({ periodo: "", planoNome: "" }); }}>Cancelar</button>
            </div>
          </div>
        </div>
      )}
      {mostrarModalDados && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalContent}>
            <h2>Editar Dados Pessoais</h2>
            <input type="text" className={styles.modalInput} placeholder="Nome" value={dadosUsuario.nome} onChange={(e) => setDadosUsuario({ ...dadosUsuario, nome: e.target.value })} />
            <input type="email" className={styles.modalInput} placeholder="Email" value={dadosUsuario.email} onChange={(e) => setDadosUsuario({ ...dadosUsuario, email: e.target.value })} />
            <input type="text" className={styles.modalInput} placeholder="Telefone" value={dadosUsuario.telefone} onChange={(e) => setDadosUsuario({ ...dadosUsuario, telefone: e.target.value })} />
            <input type="text" className={styles.modalInput} placeholder="CPF" value={dadosUsuario.cpf} onChange={(e) => setDadosUsuario({ ...dadosUsuario, cpf: e.target.value })} />
            <div className={styles.modalButtons}>
              <button className={styles.btn} onClick={handleUpdateUserData}>Salvar</button>
              <button className={styles.btnCancel} onClick={() => setMostrarModalDados(false)}>Cancelar</button>
            </div>
          </div>
        </div>
      )}
      {mostrarModalEmpresa && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalContent}>
            <h2>Editar Dados da Empresa</h2>
            <input type="text" className={styles.modalInput} placeholder="Nome da Empresa" value={dadosEmpresa.nome} onChange={(e) => setDadosEmpresa({ ...dadosEmpresa, nome: e.target.value })} />
            <input type="text" className={styles.modalInput} placeholder="CNPJ" value={dadosEmpresa.cnpj} onChange={(e) => setDadosEmpresa({ ...dadosEmpresa, cnpj: e.target.value })} />
            <input type="text" className={styles.modalInput} placeholder="Endereço" value={dadosEmpresa.endereco} onChange={(e) => setDadosEmpresa({ ...dadosEmpresa, endereco: e.target.value })} />
            <div className={styles.modalButtons}>
              <button className={styles.btn} onClick={handleUpdateUserData}>Salvar</button>
              <button className={styles.btnCancel} onClick={() => setMostrarModalEmpresa(false)}>Cancelar</button>
            </div>
          </div>
        </div>
      )}
      {mostrarModalFoto && (
        <div className={styles.modalOverlay} onClick={() => setMostrarModalFoto(false)}>
          <div className={styles.modalContentFoto} onClick={e => e.stopPropagation()}>
            <button className={styles.closeButton} onClick={() => setMostrarModalFoto(false)}>
              <FaTimes />
            </button>
            {dadosUsuario.fotoPerfil ? (
              <img src={dadosUsuario.fotoPerfil} alt="Foto Ampliada" className={styles.fotoAmpliada} />
            ) : (
              <FaUser className={styles.userIconGrande} />
            )}
          </div>
        </div>
      )}
    </>
  );

  const conteudo = (
    <div className={styles.perfilContainer}>
      <div className={styles.leftPanel}>
        <div className={styles.fotoPerfil} onClick={() => setMostrarModalFoto(true)} tabIndex={0} role="button" aria-label="Abrir foto do perfil">
          {dadosUsuario.fotoPerfil ? (
            <img src={dadosUsuario.fotoPerfil} alt="Foto de Perfil" />
          ) : (
            <FaUser className={styles.userIcon} />
          )}
        </div>
        <label className={styles.uploadLabel}>
          <input type="file" accept="image/*" onChange={handleFotoChange} />
          <FaCamera className={styles.icon} /> Alterar Foto de Perfil
        </label>
        <div className={styles.btnGroup}>
          <button className={styles.btn} onClick={() => setMostrarModalSenha(true)}>
            <FaKey className={styles.icon} /> Alterar Senha
          </button>
          <button className={styles.btn} onClick={() => setMostrarModalPlano(true)}>
            <FaExchangeAlt className={styles.icon} /> Alterar Plano
          </button>
          <button className={styles.btn} onClick={() => setMostrarModalDados(true)}>
            <FaUserEdit className={styles.icon} /> Editar Dados
          </button>
          {dadosUsuario.permissao === 'admin' && (
            <button className={styles.btn} onClick={() => setMostrarModalEmpresa(true)}>
              <FaBuilding className={styles.icon} /> Editar Empresa
            </button>
          )}
          <button className={styles.btnCancel} onClick={handleLogout}>
            <FaSignOutAlt className={styles.icon} /> Sair
          </button>
        </div>
      </div>

      <div className={styles.rightPanel}>
        <section className={styles.infoQuadrante}>
          <h3>Dados Pessoais</h3>
          <div className={styles.infoCard}><strong>Nome:</strong> {dadosUsuario.nome}</div>
          <div className={styles.divider}></div>
          <div className={styles.infoCard}><strong>Email:</strong> {dadosUsuario.email}</div>
          <div className={styles.divider}></div>
          <div className={styles.infoCard}><strong>Telefone:</strong> {dadosUsuario.telefone}</div>
          <div className={styles.divider}></div>
          <div className={styles.infoCard}><strong>CPF:</strong> {dadosUsuario.cpf}</div>
          <div className={styles.divider}></div>
          <div className={styles.infoCard}>
            <strong>Cargo:</strong> 
            <span className={`${styles.cargoBadge} ${dadosUsuario.permissao === 'admin' ? styles.cargoBadgeAdmin : styles.cargoBadgeUser}`}>
              {dadosUsuario.permissao}
            </span>
          </div>
        </section>

        {dadosUsuario.permissao === 'admin' && (
          <section className={styles.infoQuadrante}>
            <h3>Empresa</h3>
            <div className={styles.infoCard}><strong>Empresa:</strong> {dadosEmpresa.nome}</div>
            <div className={styles.divider}></div>
            <div className={styles.infoCard}><strong>CNPJ:</strong> {dadosEmpresa.cnpj}</div>
            <div className={styles.divider}></div>
            <div className={styles.infoCard}><strong>Endereço:</strong> {dadosEmpresa.endereco}</div>
          </section>
        )}

        <section className={styles.infoQuadrante}>
          <h3>Plano</h3>
          <div className={styles.infoCard}><strong>Nome do Plano:</strong> {dadosPlano.nome}</div>
          <div className={styles.divider}></div>
          <div className={styles.infoCard}><strong>Período:</strong> {dadosPlano.periodo}</div>
          <div className={styles.divider}></div>
          <div className={styles.infoCard}><strong>Preço:</strong> R$ {dadosPlano.preco.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</div>
          <div className={styles.divider}></div>
          <div className={styles.infoCard}><strong>Duração:</strong> {dadosPlano.duracao_dias} dias</div>
          <div className={styles.divider}></div>
          <div className={styles.infoCard}><strong>Data de Assinatura:</strong> {dadosPlano.data_assinatura}</div>
          <div className={styles.divider}></div>
          <div className={styles.infoCard}><strong>Data de Vencimento:</strong> {dadosPlano.data_vencimento}</div>
          <div className={styles.divider}></div>
          <div className={styles.infoCard}><strong>Status do Plano:</strong> {dadosPlano.status === 'ativa' ? '✓ Ativo' : '✗ Inativo'}</div>
          <div className={styles.divider}></div>
          <div className={styles.infoCard}>
            <strong className={styles.tempoRestanteTitulo}>⏱ Tempo Restante</strong>
            <div className={styles.tempoRestanteContainer}>
              {/* Dias e Percentual */}
              <div className={styles.diasPercentualContainer}>
                <div className={styles.diasContainer}>
                  <div className={`${styles.diasNumero} ${dadosPlano.percentualDias > 50 ? '' : dadosPlano.percentualDias > 20 ? '' : ''}`}
                    style={{
                      color: dadosPlano.percentualDias > 50 ? '#10b981' : dadosPlano.percentualDias > 20 ? '#f59e0b' : '#ef4444',
                    }}>
                    {dadosPlano.diasRestantes}
                  </div>
                  <div className={styles.diasTexto}>
                    <span className={styles.diasLabel}>dias</span>
                    <span className={styles.diasDescricao}>restantes</span>
                  </div>
                </div>
                <div className={styles.percentualContainer}>
                  <div className={styles.percentualNumero}>{dadosPlano.percentualDias.toFixed(0)}%</div>
                  <span className={styles.percentualLabel}>progresso</span>
                </div>
              </div>

              {/* Barra de Progresso com Efeito */}
              <div className={styles.progressBar}>
                <div 
                  className={`${styles.progressBarFill} ${
                    dadosPlano.percentualDias > 50 
                      ? styles.progressBarFillGreen
                      : dadosPlano.percentualDias > 20
                      ? styles.progressBarFillYellow
                      : styles.progressBarFillRed
                  }`}
                  style={{ width: `${dadosPlano.percentualDias}%` }}>
                </div>
              </div>

              {/* Status Text */}
              <div className={styles.statusText}>
                {dadosPlano.percentualDias > 50 ? '✓ Plano com prazo confortável' : dadosPlano.percentualDias > 20 ? '⚠ Atenção: prazo se aproximando' : '⛔ Urgente: renovação necessária'}
              </div>
            </div>
          </div>
          {dadosPlano.beneficios && dadosPlano.beneficios.length > 0 && (
            <>
              <div className={styles.divider}></div>
              <div className={styles.infoCard}>
                <strong>Benefícios inclusos:</strong>
                <div className={styles.beneficiosGrid}>
                  {dadosPlano.beneficios.map((beneficio, index) => (
                    <div key={index} className={styles.beneficioItem}>
                      <span className={styles.beneficioCheck}>✓</span>
                      <span className={styles.beneficioTexto}>{beneficio}</span>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </section>
      </div>

      {renderModais()}
    </div>
  );

  return <Sidebar>{conteudo}</Sidebar>;
}

export default Perfil;