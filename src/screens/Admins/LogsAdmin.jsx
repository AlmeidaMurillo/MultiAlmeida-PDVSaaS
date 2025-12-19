import { useState, useEffect, useCallback } from 'react';
import styles from './LogsAdmin.module.css';
import Spinner from '../../Components/Spinner/Spinner';
import Sidebar from '../../Components/Sidebar/Sidebar.jsx';
import { api } from "../../auth";
import { Search, AlertCircle, X, FileText as FileTextIcon, Trash2, BarChart3, FileText } from "lucide-react";
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

// Mapeamento de tipos de log para português
const TIPOS_LOG = {
  rate_limit: 'Rate Limit',
  login: 'Login',
  logout: 'Logout',
  registro: 'Registro',
  pagamento: 'Pagamento',
  compra: 'Compra',
  erro: 'Erro',
  admin: 'Administração',
  sessao: 'Sessão',
  acesso: 'Acesso',
  carrinho_adicionar: 'Carrinho +',
  carrinho_remover: 'Carrinho -',
  carrinho_limpar: 'Carrinho Limpo',
  cupom_aplicado: 'Cupom Aplicado',
  cupom_removido: 'Cupom Removido',
  cupom_invalido: 'Cupom Inválido',
  perfil_atualizado: 'Perfil Atualizado',
  senha_alterada: 'Senha Alterada',
  admin_cupom: 'Admin - Cupom',
  admin_plano: 'Admin - Plano',
  admin_empresa: 'Admin - Empresa',
  admin_usuario: 'Admin - Usuário',
  tentativa_acesso: 'Tentativa Acesso',
  validacao_falha: 'Validação Falha',
  ataque_detectado: 'Ataque',
  token_invalido: 'Token Inválido',
  sessao_expirada: 'Sessão Expirada',
};

function LogsAdmin() {
  const [logs, setLogs] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadingStats, setLoadingStats] = useState(true);
  const [erro, setErro] = useState('');

  useEffect(() => {
    document.title = 'MultiAlmeida | Logs do Sistema';
  })
  
  // Filtros
  const [filtros, setFiltros] = useState({
    tipo: '',
    email: '',
    nome: '',
    cargo: '',
    ip: '',
    data_inicio: '',
    data_fim: '',
    limite: 50,
    pagina: 1,
  });

  // Paginação
  const [pagination, setPagination] = useState({
    total: 0,
    pagina: 1,
    limite: 50,
    totalPaginas: 0,
  });

  // Aba ativa
  const [abaAtiva, setAbaAtiva] = useState('logs'); // 'logs' ou 'stats'

  // Log selecionado para detalhes
  const [logSelecionado, setLogSelecionado] = useState(null);

  // Busca de tipos
  const [buscaTipo, setBuscaTipo] = useState('');

  const buscarLogs = useCallback(async () => {
    setLoading(true);
    setErro('');
    try {
      const params = new URLSearchParams();
      Object.keys(filtros).forEach(key => {
        if (filtros[key]) {
          params.append(key, filtros[key]);
        }
      });

      const response = await api.get(`/api/admin/logs?${params}`);
      setLogs(response.data.data || []);
      setPagination(response.data.pagination || {});
    } catch (error) {
      console.error('Erro ao buscar logs:', error);
      const errorMsg = error.response?.data?.error || error.response?.data?.message || 'Erro ao carregar logs';
      setErro(errorMsg);
      setLogs([]);
    } finally {
      setLoading(false);
    }
  }, [filtros]);

  const buscarEstatisticas = useCallback(async () => {
    setLoadingStats(true);
    try {
      const response = await api.get('/api/admin/logs/stats?periodo=30');
      setStats(response.data.data);
    } catch (error) {
      console.error('Erro:', error);
    } finally {
      setLoadingStats(false);
    }
  }, []);

  // Buscar logs quando filtros mudarem
  useEffect(() => {
    buscarLogs();
  }, [buscarLogs]);

  // Buscar estatísticas ao montar
  useEffect(() => {
    buscarEstatisticas();
  }, [buscarEstatisticas]);

  const limparLogsAntigos = async () => {
    if (!confirm('Deseja realmente limpar logs com mais de 90 dias?')) return;

    try {
      const response = await api.delete('/api/admin/logs', { data: { dias: 90 } });
      alert(response.data.message);
      buscarLogs();
      buscarEstatisticas();
    } catch (error) {
      console.error('Erro:', error);
    }
  };

  const formatarData = (data) => {
    return new Date(data).toLocaleString('pt-BR');
  };

  const formatarChave = (chave) => {
    // Converte snake_case para Título
    return chave
      .split('_')
      .map(palavra => palavra.charAt(0).toUpperCase() + palavra.slice(1))
      .join(' ');
  };

  const formatarValor = (valor, chave = '') => {
    if (valor === null || valor === undefined) return 'N/A';
    if (typeof valor === 'boolean') return valor ? 'Sim' : 'Não';
    if (typeof valor === 'number') {
      // Campos que devem ser formatados como moeda
      const camposMonetarios = ['valor', 'preco', 'desconto', 'valor_total', 'valor_desconto', 'valor_final_compra', 'valor_original', 'valor_final', 'desconto_aplicado'];
      const ehMonetario = camposMonetarios.some(campo => chave.toLowerCase().includes(campo));
      
      if (ehMonetario) {
        return `R$ ${valor.toFixed(2).replace('.', ',')}`;
      }
      return valor.toLocaleString('pt-BR');
    }
    if (typeof valor === 'object') {
      return <code className={styles.codeText}>{JSON.stringify(valor, null, 2)}</code>;
    }
    return String(valor);
  };

  const mudarPagina = (novaPagina) => {
    setFiltros(prev => ({ ...prev, pagina: novaPagina }));
  };

  const exportarPDF = () => {
    const doc = new jsPDF('l', 'mm', 'a4');
    const dataAtual = new Date().toLocaleDateString('pt-BR');
    const horaAtual = new Date().toLocaleTimeString('pt-BR');
    
    // Cores modernas
    const corPrimaria = [88, 101, 242]; // Roxo vibrante
    const corSecundaria = [139, 92, 246]; // Roxo claro
    const corAcento = [59, 130, 246]; // Azul
    const corTexto = [30, 30, 30];
    const corSubtexto = [100, 100, 100];
    
    // Função para criar gradiente simulado com retângulos
    const criarGradienteHeader = () => {
      for (let i = 0; i < 40; i++) {
        const r = corPrimaria[0] + (255 - corPrimaria[0]) * (i / 40);
        const g = corPrimaria[1] + (255 - corPrimaria[1]) * (i / 40);
        const b = corPrimaria[2] + (255 - corPrimaria[2]) * (i / 40);
        doc.setFillColor(r, g, b);
        doc.rect(0, i, 297, 1, 'F');
      }
    };
    
    // Header com gradiente
    criarGradienteHeader();
    
    // Logo/Ícone (simulado com formas)
    doc.setFillColor(255, 255, 255);
    doc.circle(25, 20, 8, 'F');
    doc.setFillColor(corPrimaria[0], corPrimaria[1], corPrimaria[2]);
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(255, 255, 255);
    doc.text('M', 23, 22.5);
    
    // Título principal
    doc.setFontSize(24);
    doc.setFont('helvetica', 'bold');
    doc.text('RELATÓRIO DE LOGS', 40, 18);
    
    // Subtítulo
    doc.setFontSize(11);
    doc.setFont('helvetica', 'normal');
    doc.text('Sistema MultiAlmeida PDV', 40, 25);
    
    // Linha decorativa
    doc.setDrawColor(255, 255, 255);
    doc.setLineWidth(0.5);
    doc.line(40, 28, 260, 28);
    
    // Card de informações (canto superior direito)
    doc.setFillColor(255, 255, 255);
    doc.roundedRect(200, 10, 85, 24, 3, 3, 'F');
    doc.setFontSize(8);
    doc.setTextColor(corSubtexto[0], corSubtexto[1], corSubtexto[2]);
    doc.setFont('helvetica', 'normal');
    doc.text('GERADO EM', 205, 15);
    doc.setFontSize(9);
    doc.setTextColor(corTexto[0], corTexto[1], corTexto[2]);
    doc.setFont('helvetica', 'bold');
    doc.text(dataAtual, 205, 20);
    doc.text(horaAtual, 205, 25);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(corSubtexto[0], corSubtexto[1], corSubtexto[2]);
    doc.text(`Total: ${logs.length} registros`, 205, 30);
    
    // Seção de filtros aplicados
    let yPos = 48;
    if (filtros.tipo || filtros.email || filtros.nome || filtros.cargo || filtros.data_inicio || filtros.data_fim) {
      doc.setFillColor(245, 247, 250);
      doc.roundedRect(14, yPos, 269, 15, 2, 2, 'F');
      
      doc.setFontSize(9);
      doc.setTextColor(corTexto[0], corTexto[1], corTexto[2]);
      doc.setFont('helvetica', 'bold');
      doc.text('🔍 FILTROS APLICADOS:', 18, yPos + 5);
      
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      let xFilter = 18;
      let yFilter = yPos + 10;
      
      if (filtros.tipo) {
        doc.text(`Tipo: ${TIPOS_LOG[filtros.tipo]}`, xFilter, yFilter);
        xFilter += 50;
      }
      if (filtros.email) {
        doc.text(`Email: ${filtros.email}`, xFilter, yFilter);
        xFilter += 60;
      }
      if (filtros.nome) {
        doc.text(`Nome: ${filtros.nome}`, xFilter, yFilter);
        xFilter += 50;
      }
      if (filtros.cargo) {
        doc.text(`Cargo: ${filtros.cargo}`, xFilter, yFilter);
      }
      
      if (filtros.data_inicio || filtros.data_fim) {
        yFilter += 5;
        doc.text(`Período: ${filtros.data_inicio || 'início'} até ${filtros.data_fim || 'hoje'}`, 18, yFilter);
      }
      
      yPos += 18;
    }
    
    // Preparar dados da tabela
    const tableData = logs.map(log => [
      formatarData(log.criado_em).split(' ')[0],
      formatarData(log.criado_em).split(' ')[1],
      TIPOS_LOG[log.tipo] || log.tipo,
      log.email || '-',
      log.nome || '-',
      log.cargo || '-',
      log.ip || '-',
      log.acao.substring(0, 35) + (log.acao.length > 35 ? '...' : '')
    ]);
    
    // Criar tabela moderna
    autoTable(doc, {
      startY: yPos,
      head: [['Data', 'Hora', 'Tipo', 'Email', 'Nome', 'Cargo', 'IP', 'Ação']],
      body: tableData,
      theme: 'grid',
      headStyles: {
        fillColor: [corSecundaria[0], corSecundaria[1], corSecundaria[2]],
        textColor: [255, 255, 255],
        fontSize: 9,
        fontStyle: 'bold',
        halign: 'center',
        cellPadding: 3
      },
      bodyStyles: {
        fontSize: 8,
        textColor: corTexto,
        cellPadding: 2.5
      },
      alternateRowStyles: {
        fillColor: [248, 250, 252]
      },
      columnStyles: {
        0: { cellWidth: 22, halign: 'center', fontStyle: 'bold' },
        1: { cellWidth: 18, halign: 'center' },
        2: { cellWidth: 28, halign: 'center', fontStyle: 'bold', textColor: corAcento },
        3: { cellWidth: 42 },
        4: { cellWidth: 35 },
        5: { cellWidth: 24, halign: 'center' },
        6: { cellWidth: 28, halign: 'center', fontStyle: 'italic' },
        7: { cellWidth: 'auto' }
      },
      margin: { left: 14, right: 14 },
      didDrawPage: function(data) {
        const pageCount = doc.internal.getNumberOfPages();
        const pageHeight = doc.internal.pageSize.height;
        
        // Linha decorativa no rodapé
        doc.setDrawColor(corSecundaria[0], corSecundaria[1], corSecundaria[2]);
        doc.setLineWidth(1.5);
        doc.line(14, pageHeight - 18, 283, pageHeight - 18);
        
        // Rodapé esquerdo
        doc.setFontSize(8);
        doc.setTextColor(corSubtexto[0], corSubtexto[1], corSubtexto[2]);
        doc.setFont('helvetica', 'italic');
        doc.text('MultiAlmeida PDV - Sistema de Gestão', 14, pageHeight - 12);
        
        // Paginação central
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(corPrimaria[0], corPrimaria[1], corPrimaria[2]);
        doc.text(
          `Página ${data.pageNumber} de ${pageCount}`,
          148.5,
          pageHeight - 12,
          { align: 'center' }
        );
        
        // Informação direita
        doc.setFont('helvetica', 'italic');
        doc.setTextColor(corSubtexto[0], corSubtexto[1], corSubtexto[2]);
        doc.text('Confidencial', 283, pageHeight - 12, { align: 'right' });
      }
    });
    
    // Salvar PDF
    const nomeArquivo = `logs-multialmeida-${new Date().toISOString().split('T')[0]}.pdf`;
    doc.save(nomeArquivo);
  };

  return (
    <Sidebar>
      <div className={styles.logsContent}>
        {/* Header */}
        <div className={styles.titleRow}>
          <h1>Logs do Sistema</h1>
          <div className={styles.headerActions}>
            <button 
              onClick={exportarPDF} 
              className={styles.btnExportar} 
              disabled={logs.length === 0}
              title="Exportar logs para PDF"
            >
              <FileTextIcon size={18} />
              Exportar PDF
            </button>
            <button 
              onClick={limparLogsAntigos} 
              className={styles.btnLimpar}
              title="Limpar logs com mais de 90 dias"
            >
              <Trash2 size={18} />
              Limpar Antigos
            </button>
          </div>
        </div>

        {/* Erro */}
        {erro && (
          <div className={styles.errorContainer}>
            <AlertCircle size={20} />
            <p>{erro}</p>
            <button onClick={() => setErro('')} className={styles.btnFechar}>
              <X size={16} />
            </button>
          </div>
        )}

        {/* Abas */}
        <div className={styles.tabsContainer}>
          <button
            className={`${styles.tab} ${abaAtiva === 'logs' ? styles.tabActive : ''}`}
            onClick={() => setAbaAtiva('logs')}
          >
            <FileText size={18} />
            Logs
          </button>
          <button
            className={`${styles.tab} ${abaAtiva === 'stats' ? styles.tabActive : ''}`}
            onClick={() => setAbaAtiva('stats')}
          >
            <BarChart3 size={18} />
            Estatísticas
          </button>
        </div>

        {/* Conteúdo das abas */}
        {abaAtiva === 'logs' && (
          <>
            {/* Filtros */}
            <div className={styles.filtrosContainer}>
              <div className={styles.filtrosGrid}>
                <div className={styles.inputGroup}>
                  <label>Buscar Tipo de Log</label>
                  <input
                    type="text"
                    placeholder="Digite para filtrar tipos..."
                    value={buscaTipo}
                    onChange={(e) => {
                      setBuscaTipo(e.target.value);
                      // Se limpar a busca, limpar o filtro também
                      if (!e.target.value) {
                        setFiltros(prev => ({ ...prev, tipo: '', pagina: 1 }));
                      }
                    }}
                  />
                </div>

                <div className={styles.inputGroup}>
                  <label>Tipo de Log</label>
                  <select
                    value={filtros.tipo}
                    onChange={(e) => setFiltros(prev => ({ ...prev, tipo: e.target.value, pagina: 1 }))}
                  >
                    <option value="">Todos os Tipos</option>
                    {Object.keys(TIPOS_LOG)
                      .filter(tipo => 
                        !buscaTipo || TIPOS_LOG[tipo].toLowerCase().includes(buscaTipo.toLowerCase())
                      )
                      .map(tipo => (
                        <option key={tipo} value={tipo}>{TIPOS_LOG[tipo]}</option>
                      ))}
                  </select>
                </div>

                <div className={styles.inputGroup}>
                  <label>Email do Usuário</label>
                  <input
                    type="text"
                    placeholder="Filtrar por email..."
                    value={filtros.email}
                    onChange={(e) => setFiltros(prev => ({ ...prev, email: e.target.value, pagina: 1 }))}
                  />
                </div>

                <div className={styles.inputGroup}>
                  <label>Nome do Usuário</label>
                  <input
                    type="text"
                    placeholder="Filtrar por nome..."
                    value={filtros.nome}
                    onChange={(e) => setFiltros(prev => ({ ...prev, nome: e.target.value, pagina: 1 }))}
                  />
                </div>

                <div className={styles.inputGroup}>
                  <label>Cargo/Função</label>
                  <input
                    type="text"
                    placeholder="Filtrar por cargo..."
                    value={filtros.cargo}
                    onChange={(e) => setFiltros(prev => ({ ...prev, cargo: e.target.value, pagina: 1 }))}
                  />
                </div>

                <div className={styles.inputGroup}>
                  <label>IP</label>
                  <input
                    type="text"
                    placeholder="Filtrar por IP..."
                    value={filtros.ip}
                    onChange={(e) => setFiltros(prev => ({ ...prev, ip: e.target.value, pagina: 1 }))}
                  />
                </div>

                <div className={styles.inputGroup}>
                  <label>Data Início</label>
                  <input
                    type="date"
                    value={filtros.data_inicio}
                    onChange={(e) => setFiltros(prev => ({ ...prev, data_inicio: e.target.value, pagina: 1 }))}
                  />
                </div>

                <div className={styles.inputGroup}>
                  <label>Data Fim</label>
                  <input
                    type="date"
                    value={filtros.data_fim}
                    onChange={(e) => setFiltros(prev => ({ ...prev, data_fim: e.target.value, pagina: 1 }))}
                  />
                </div>

                <div className={styles.inputGroup}>
                  <label>Por Página</label>
                  <select
                    value={filtros.limite}
                    onChange={(e) => setFiltros(prev => ({ ...prev, limite: e.target.value, pagina: 1 }))}
                  >
                    <option value="25">25 por página</option>
                    <option value="50">50 por página</option>
                    <option value="100">100 por página</option>
                    <option value="200">200 por página</option>
                  </select>
                </div>
              </div>

              <button onClick={() => {
                setFiltros({ tipo: '', email: '', nome: '', cargo: '', ip: '', data_inicio: '', data_fim: '', limite: 50, pagina: 1 });
                setBuscaTipo('');
              }} className={styles.btnBuscar}>
                <Search size={18} />
                Limpar Filtros
              </button>
            </div>

            {/* Lista de Logs */}
            {logs.length === 0 && !loading ? (
              <div className={styles.emptyState}>
                <FileText size={64} />
                <p>Nenhum log encontrado</p>
              </div>
            ) : logs.length > 0 && (
              <>
                <div className={styles.logsListContainer}>
                  <div className={styles.logsList}>
                    {logs.map((log) => (
                      <div key={log.id} className={styles.logItem} onClick={() => setLogSelecionado(log)}>
                        <div className={styles.logHeader}>
                          <span className={styles.logTipo}>
                            {TIPOS_LOG[log.tipo]}
                          </span>
                          <span className={styles.logData}>{formatarData(log.criado_em)}</span>
                        </div>
                        <div className={styles.logInfo}>
                          {log.email && <p><strong>Email:</strong> {log.email}</p>}
                          {log.nome && <p><strong>Nome:</strong> {log.nome}</p>}
                          {log.cargo && <p><strong>Cargo:</strong> {log.cargo}</p>}
                          {log.ip && <p><strong>IP:</strong> {log.ip}</p>}
                          <p><strong>Ação:</strong> {log.acao}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Paginação */}
                <div className={styles.paginacao}>
                  <span className={styles.paginacaoInfo}>
                    Mostrando {logs.length} de {pagination.total} logs | Página {pagination.pagina} de {pagination.totalPaginas}
                  </span>
                  <div className={styles.paginacaoBtns}>
                    <button
                      onClick={() => mudarPagina(1)}
                      disabled={pagination.pagina === 1}
                      className={styles.btnPaginacao}
                    >
                      Primeira
                    </button>
                    <button
                      onClick={() => mudarPagina(pagination.pagina - 1)}
                      disabled={pagination.pagina === 1}
                      className={styles.btnPaginacao}
                    >
                      Anterior
                    </button>
                    <button
                      onClick={() => mudarPagina(pagination.pagina + 1)}
                      disabled={pagination.pagina === pagination.totalPaginas}
                      className={styles.btnPaginacao}
                    >
                      Próxima
                    </button>
                    <button
                      onClick={() => mudarPagina(pagination.totalPaginas)}
                      disabled={pagination.pagina === pagination.totalPaginas}
                      className={styles.btnPaginacao}
                    >
                      Última
                    </button>
                  </div>
                </div>
              </>
            )}
          </>
        )}

        {abaAtiva === 'stats' && (
          <div>
            {loadingStats ? (
              <div className={styles.loadingContainer}>
                <Spinner />
              </div>
            ) : stats ? (
              <>
                {/* Cards de Estatísticas */}
                <div className={styles.statsGrid}>
                  <div className={styles.statCard}>
                    <div className={styles.statLabel}>Total de Eventos</div>
                    <div className={styles.statValue}>{stats.total?.toLocaleString('pt-BR') || 0}</div>
                  </div>
                  <div className={styles.statCard}>
                    <div className={styles.statLabel}>Tipos de Eventos</div>
                    <div className={styles.statValue}>{stats.porTipo?.length || 0}</div>
                  </div>
                  <div className={styles.statCard}>
                    <div className={styles.statLabel}>Usuários Ativos</div>
                    <div className={styles.statValue}>{stats.topUsuarios?.length || 0}</div>
                  </div>
                  <div className={styles.statCard}>
                    <div className={styles.statLabel}>IPs Únicos</div>
                    <div className={styles.statValue}>{stats.topIPs?.length || 0}</div>
                  </div>
                </div>

                {/* Eventos por Tipo */}
                {stats.porTipo && stats.porTipo.length > 0 && (
                  <div className={styles.logsListContainerStats}>
                    <h2 className={styles.statsTitle}>Eventos por Tipo</h2>
                    <div className={styles.logsList}>
                      {stats.porTipo.map(item => (
                        <div key={item.tipo} className={styles.logItem}>
                          <div className={styles.logHeader}>
                            <span className={styles.logTipo}>{TIPOS_LOG[item.tipo]}</span>
                            <span className={styles.logData}>{item.total} eventos</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Top Usuários */}
                {stats.topUsuarios && stats.topUsuarios.length > 0 && (
                  <div className={styles.logsListContainerStats}>
                    <h2 className={styles.statsTitle}>Top Usuários</h2>
                    <div className={styles.logsList}>
                      {stats.topUsuarios.map((user, idx) => (
                        <div key={idx} className={styles.logItem}>
                          <div className={styles.logHeader}>
                            <span className={styles.logData}>#{idx + 1}</span>
                            <span className={styles.logData}>{user.total} eventos</span>
                          </div>
                          <div className={styles.logInfo}>
                            <p><strong>Email:</strong> {user.email}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Top IPs */}
                {stats.topIPs && stats.topIPs.length > 0 && (
                  <div className={styles.logsListContainerStats}>
                    <h2 className={styles.statsTitle}>Top IPs</h2>
                    <div className={styles.logsList}>
                      {stats.topIPs.map((ip, idx) => (
                        <div key={idx} className={styles.logItem}>
                          <div className={styles.logHeader}>
                            <span className={styles.logData}>#{idx + 1}</span>
                            <span className={styles.logData}>{ip.total} eventos</span>
                          </div>
                          <div className={styles.logInfo}>
                            <p><strong>IP:</strong> {ip.ip}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className={styles.emptyState}>
                <BarChart3 size={64} />
                <p>Nenhuma estatística disponível</p>
              </div>
            )}
          </div>
        )}

        {/* Modal de Detalhes */}
        {logSelecionado && (
          <div className={styles.modalOverlay} onClick={() => setLogSelecionado(null)}>
            <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
              <div className={styles.modalHeader}>
                <h2>Detalhes Completos do Log</h2>
                <button onClick={() => setLogSelecionado(null)} className={styles.btnFechar}>
                  <X size={20} />
                </button>
              </div>
              <div className={styles.modalBody}>
                {/* Informações Principais */}
                <div className={styles.detalhesSection}>
                  <h3 className={styles.detalhesTitle}>📋 Informações Básicas</h3>
                  
                  <div className={styles.detailRow}>
                    <div className={styles.detailLabel}>ID do Log</div>
                    <div className={styles.detailValue}>{logSelecionado.id}</div>
                  </div>
                  
                  <div className={styles.detailRow}>
                    <div className={styles.detailLabel}>Tipo de Evento</div>
                    <div className={styles.detailValue}>
                      <span className={styles.logTipo}>{TIPOS_LOG[logSelecionado.tipo]}</span>
                    </div>
                  </div>
                  
                  <div className={styles.detailRow}>
                    <div className={styles.detailLabel}>Data e Hora</div>
                    <div className={styles.detailValue}>{formatarData(logSelecionado.criado_em)}</div>
                  </div>
                  
                  <div className={styles.detailRow}>
                    <div className={styles.detailLabel}>Ação Realizada</div>
                    <div className={styles.detailValue}>{logSelecionado.acao}</div>
                  </div>
                </div>

                {/* Informações do Usuário */}
                {(logSelecionado.email || logSelecionado.nome || logSelecionado.cargo || logSelecionado.usuario_id) && (
                  <div className={styles.detalhesSection}>
                    <h3 className={styles.detalhesTitle}>👤 Informações do Usuário</h3>
                    
                    {logSelecionado.usuario_id && (
                      <div className={styles.detailRow}>
                        <div className={styles.detailLabel}>ID do Usuário</div>
                        <div className={styles.detailValue}>{logSelecionado.usuario_id}</div>
                      </div>
                    )}
                    
                    {logSelecionado.email && (
                      <div className={styles.detailRow}>
                        <div className={styles.detailLabel}>E-mail</div>
                        <div className={styles.detailValue}>{logSelecionado.email}</div>
                      </div>
                    )}
                    
                    {logSelecionado.nome && (
                      <div className={styles.detailRow}>
                        <div className={styles.detailLabel}>Nome Completo</div>
                        <div className={styles.detailValue}>{logSelecionado.nome}</div>
                      </div>
                    )}
                    
                    {logSelecionado.cargo && (
                      <div className={styles.detailRow}>
                        <div className={styles.detailLabel}>Cargo/Função</div>
                        <div className={styles.detailValue}>
                          <span className={styles.cargoBadge}>{logSelecionado.cargo}</span>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Informações Técnicas */}
                {logSelecionado.ip && (
                  <div className={styles.detalhesSection}>
                    <h3 className={styles.detalhesTitle}>🌐 Informações Técnicas</h3>
                    
                    <div className={styles.detailRow}>
                      <div className={styles.detailLabel}>Endereço IP</div>
                      <div className={styles.detailValue}>
                        <code className={styles.codeText}>{logSelecionado.ip}</code>
                      </div>
                    </div>
                  </div>
                )}

                {/* Detalhes Adicionais */}
                {logSelecionado.detalhes && Object.keys(logSelecionado.detalhes).length > 0 && (
                  <div className={styles.detalhesSection}>
                    <h3 className={styles.detalhesTitle}>📊 Detalhes Completos do Evento</h3>
                    
                    {/* Renderizar detalhes de forma estruturada */}
                    {Object.entries(logSelecionado.detalhes).map(([key, value]) => (
                      <div key={key} className={styles.detailRow}>
                        <div className={styles.detailLabel}>{formatarChave(key)}</div>
                        <div className={styles.detailValue}>
                          {formatarValor(value, key)}
                        </div>
                      </div>
                    ))}
                    
                    {/* JSON completo expandível */}
                    <div className={styles.detailRow}>
                      <div className={styles.detailLabel}>JSON Completo</div>
                      <div className={styles.detailValueCode}>
                        {JSON.stringify(logSelecionado.detalhes, null, 2)}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </Sidebar>
  );
}

export default LogsAdmin;
