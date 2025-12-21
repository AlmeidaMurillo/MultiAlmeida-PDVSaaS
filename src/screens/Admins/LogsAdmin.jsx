import { useState, useEffect, useCallback } from 'react';
import styles from './LogsAdmin.module.css';
import Spinner from '../../Components/Spinner/Spinner';
import Sidebar from '../../Components/Sidebar/Sidebar.jsx';
import { api } from "../../auth";
import { Search, AlertCircle, X, FileText as FileTextIcon, Trash2, BarChart3, FileText, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, Clock, Calendar, TrendingUp, Activity, AlertTriangle, Shield } from "lucide-react";
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

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

const SEVERIDADE_LOG = {
  rate_limit: 'warning',
  login: 'info',
  logout: 'info',
  registro: 'success',
  pagamento: 'success',
  compra: 'success',
  erro: 'error',
  admin: 'info',
  sessao: 'info',
  acesso: 'info',
  carrinho_adicionar: 'info',
  carrinho_remover: 'info',
  carrinho_limpar: 'info',
  cupom_aplicado: 'success',
  cupom_removido: 'info',
  cupom_invalido: 'warning',
  perfil_atualizado: 'success',
  senha_alterada: 'warning',
  admin_cupom: 'info',
  admin_plano: 'info',
  admin_empresa: 'info',
  admin_usuario: 'info',
  tentativa_acesso: 'warning',
  validacao_falha: 'warning',
  ataque_detectado: 'error',
  token_invalido: 'error',
  sessao_expirada: 'warning',
};

const PERIODOS_RAPIDOS = [
  { label: 'Última Hora', valor: 'ultima_hora', horas: 1 },
  { label: 'Últimas 24h', valor: 'ultimo_dia', horas: 24 },
  { label: 'Últimos 7 dias', valor: 'ultima_semana', dias: 7 },
  { label: 'Últimos 30 dias', valor: 'ultimo_mes', dias: 30 },
  { label: 'Últimos 90 dias', valor: 'ultimo_trimestre', dias: 90 },
];

function LogsAdmin() {
  const [logs, setLogs] = useState([]);
  const [busca, setBusca] = useState("");
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadingStats, setLoadingStats] = useState(true);
  const [erro, setErro] = useState('');

  useEffect(() => {
    document.title = 'MultiAlmeida | Logs do Sistema';
  })
  
  const [filtros, setFiltros] = useState({
    tipo: '',
    email: '',
    nome: '',
    cargo: '',
    ip: '',
    data_inicio: '',
    data_fim: '',
    data_inicio_api: '', // Valor interno com datetime para API
    data_fim_api: '', // Valor interno com datetime para API
    limite: 25,
    pagina: 1,
    severidade: '',
    periodo_rapido: '',
  });

  const [pagination, setPagination] = useState({
    total: 0,
    pagina: 1,
    limite: 50,
    totalPaginas: 0,
  });

  const [abaAtiva, setAbaAtiva] = useState('logs');

  const [logSelecionado, setLogSelecionado] = useState(null);

  const [periodoStats, setPeriodoStats] = useState('30');

  const buscarLogsComFiltros = useCallback(async (filtrosParaBusca) => {
    setLoading(true);
    setErro('');
    try {
      const params = new URLSearchParams();
      
      if (filtrosParaBusca.data_inicio_api) {
        params.append('data_inicio', filtrosParaBusca.data_inicio_api);
      } else if (filtrosParaBusca.data_inicio) {
        params.append('data_inicio', filtrosParaBusca.data_inicio);
      }

      if (filtrosParaBusca.data_fim_api) {
        params.append('data_fim', filtrosParaBusca.data_fim_api);
      } else if (filtrosParaBusca.data_fim) {
        params.append('data_fim', filtrosParaBusca.data_fim);
      }
      Object.keys(filtrosParaBusca).forEach(key => {
        if (key !== 'data_inicio' && key !== 'data_fim' && key !== 'data_inicio_api' && key !== 'data_fim_api' && filtrosParaBusca[key]) {
          params.append(key, filtrosParaBusca[key]);
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
  }, []);

  const buscarEstatisticas = useCallback(async () => {
    setLoadingStats(true);
    try {
      const response = await api.get(`/api/admin/logs/stats?periodo=${periodoStats}`);
      setStats(response.data.data);
    } catch (error) {
      console.error('Erro:', error);
    } finally {
      setLoadingStats(false);
    }
  }, [periodoStats]);

  useEffect(() => {
    buscarLogsComFiltros(filtros);
  }, [buscarLogsComFiltros, filtros]);

  useEffect(() => {
    buscarEstatisticas();
  }, [buscarEstatisticas]);

  const limparLogsAntigos = async () => {
    if (!confirm('Deseja realmente limpar logs com mais de 90 dias?')) return;

    try {
      const response = await api.delete('/api/admin/logs', { data: { dias: 90 } });
      alert(response.data.message);
      buscarLogsComFiltros(filtros);
      buscarEstatisticas();
    } catch (error) {
      console.error('Erro:', error);
    }
  };

  const formatarData = (data) => {
    return new Date(data).toLocaleString('pt-BR');
  };

  const formatarChave = (chave) => {
    return chave
      .split('_')
      .map(palavra => palavra.charAt(0).toUpperCase() + palavra.slice(1))
      .join(' ');
  };

  const formatarValor = (valor, chave = '') => {
    if (valor === null || valor === undefined) return 'N/A';
    if (typeof valor === 'boolean') return valor ? 'Sim' : 'Não';
    if (typeof valor === 'number') {
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
    const novosFiltros = { ...filtros, pagina: novaPagina };
    setFiltros(novosFiltros);
    buscarLogsComFiltros(novosFiltros);
  };

  const aplicarPeriodoRapido = (periodo) => {
    const agora = new Date();
    let dataInicio = new Date();
    
    const periodoConfig = PERIODOS_RAPIDOS.find(p => p.valor === periodo);
    if (!periodoConfig) return;
    
    if (periodoConfig.horas) {
      dataInicio = new Date(agora.getTime() - periodoConfig.horas * 60 * 60 * 1000);
    } else if (periodoConfig.dias) {
      dataInicio = new Date(agora.getTime() - periodoConfig.dias * 24 * 60 * 60 * 1000);
    }
    
    const formatarDataTimeMySQL = (data) => {
      const ano = data.getUTCFullYear();
      const mes = String(data.getUTCMonth() + 1).padStart(2, '0');
      const dia = String(data.getUTCDate()).padStart(2, '0');
      const hora = String(data.getUTCHours()).padStart(2, '0');
      const minuto = String(data.getUTCMinutes()).padStart(2, '0');
      const segundo = String(data.getUTCSeconds()).padStart(2, '0');
      return `${ano}-${mes}-${dia} ${hora}:${minuto}:${segundo}`;
    };
    
    const novosFiltros = {
      ...filtros,
      data_inicio: '', // Limpa o input visual
      data_fim: '', // Limpa o input visual
      data_inicio_api: formatarDataTimeMySQL(dataInicio), // Valor para API
      data_fim_api: formatarDataTimeMySQL(agora), // Valor para API
      periodo_rapido: periodo,
      pagina: 1
    };
    
    setFiltros(novosFiltros);
    buscarLogsComFiltros(novosFiltros);
  };

  const aplicarFiltroSeveridade = (severidade) => {
    const novosFiltros = {
      ...filtros,
      severidade,
      pagina: 1
    };
    setFiltros(novosFiltros);
    buscarLogsComFiltros(novosFiltros);
  };

  const exportarPDF = () => {
    const doc = new jsPDF('l', 'mm', 'a4');
    const dataAtual = new Date().toLocaleDateString('pt-BR');
    const horaAtual = new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    
    const corPreta = [0, 0, 0];
    const corCinzaEscuro = [45, 45, 45];
    const corCinza = [100, 100, 100];
    const corCinzaClaro = [180, 180, 180];
    const corCinzaMuitoClaro = [240, 240, 240];
    const corBranca = [255, 255, 255];
    
    doc.setFillColor(corPreta[0], corPreta[1], corPreta[2]);
    doc.rect(0, 0, 297, 40, 'F');
    
    doc.setFillColor(corCinzaClaro[0], corCinzaClaro[1], corCinzaClaro[2]);
    doc.rect(0, 0, 297, 1, 'F');
    
    doc.setFillColor(corBranca[0], corBranca[1], corBranca[2]);
    doc.roundedRect(15, 12, 16, 16, 1, 1, 'F');
    doc.setFillColor(corPreta[0], corPreta[1], corPreta[2]);
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('MA', 18, 22);
    
    doc.setTextColor(corBranca[0], corBranca[1], corBranca[2]);
    doc.setFontSize(24);
    doc.setFont('helvetica', 'bold');
    doc.text('RELATÓRIO DE LOGS', 35, 18);
    
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(corCinzaClaro[0], corCinzaClaro[1], corCinzaClaro[2]);
    doc.text('MultiAlmeida PDV • Sistema de Gestão Empresarial', 35, 26);
    
    doc.setDrawColor(corCinza[0], corCinza[1], corCinza[2]);
    doc.setLineWidth(0.2);
    doc.line(35, 29, 180, 29);
    doc.setFillColor(corCinzaEscuro[0], corCinzaEscuro[1], corCinzaEscuro[2]);
    doc.roundedRect(230, 10, 55, 20, 2, 2, 'F');
    
    doc.setFontSize(6);
    doc.setTextColor(corCinzaClaro[0], corCinzaClaro[1], corCinzaClaro[2]);
    doc.setFont('helvetica', 'normal');
    doc.text('GERADO EM', 234, 14);
    
    doc.setFontSize(9);
    doc.setTextColor(corBranca[0], corBranca[1], corBranca[2]);
    doc.setFont('helvetica', 'bold');
    doc.text(dataAtual, 234, 19);
    doc.setFontSize(8);
    doc.text(horaAtual, 234, 23.5);
    
    doc.setFontSize(6);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(corCinzaClaro[0], corCinzaClaro[1], corCinzaClaro[2]);
    doc.text(`${logs.length} LOGS`, 234, 27.5);
    
    let yPos = 48;
    if (filtros.tipo || filtros.email || filtros.nome || filtros.cargo || filtros.data_inicio || filtros.data_fim || filtros.periodo_rapido) {
      doc.setDrawColor(corCinzaClaro[0], corCinzaClaro[1], corCinzaClaro[2]);
      doc.setLineWidth(0.3);
      doc.line(14, yPos, 283, yPos);
      
      yPos += 5;
      
      doc.setFontSize(7);
      doc.setTextColor(corCinza[0], corCinza[1], corCinza[2]);
      doc.setFont('helvetica', 'bold');
      doc.text('FILTROS APLICADOS', 14, yPos);
      
      yPos += 4;
      
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7);
      doc.setTextColor(corCinzaEscuro[0], corCinzaEscuro[1], corCinzaEscuro[2]);
      let xFilter = 14;
      
      const filtrosTexto = [];
      if (filtros.tipo) filtrosTexto.push(`Tipo: ${TIPOS_LOG[filtros.tipo]}`);
      if (filtros.periodo_rapido) {
        const periodo = PERIODOS_RAPIDOS.find(p => p.valor === filtros.periodo_rapido);
        filtrosTexto.push(`Período: ${periodo?.label}`);
      }
      if (filtros.email) filtrosTexto.push(`Email: ${filtros.email}`);
      if (filtros.nome) filtrosTexto.push(`Nome: ${filtros.nome}`);
      if (filtros.cargo) filtrosTexto.push(`Cargo: ${filtros.cargo}`);
      
      doc.text(filtrosTexto.join(' • '), xFilter, yPos);
      
      yPos += 5;
      doc.setLineWidth(0.3);
      doc.line(14, yPos, 283, yPos);
      yPos += 3;
    }
    
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
    
    autoTable(doc, {
      startY: yPos,
      head: [['DATA', 'HORA', 'TIPO', 'EMAIL', 'NOME', 'CARGO', 'IP', 'AÇÃO']],
      body: tableData,
      theme: 'plain',
      headStyles: {
        fillColor: [corCinzaEscuro[0], corCinzaEscuro[1], corCinzaEscuro[2]],
        textColor: [255, 255, 255],
        fontSize: 7,
        fontStyle: 'bold',
        halign: 'center',
        cellPadding: { top: 3, right: 2, bottom: 3, left: 2 },
        lineWidth: 0,
        valign: 'middle'
      },
      bodyStyles: {
        fontSize: 7,
        textColor: [corCinzaEscuro[0], corCinzaEscuro[1], corCinzaEscuro[2]],
        cellPadding: { top: 2.5, right: 2, bottom: 2.5, left: 2 },
        lineWidth: 0.1,
        lineColor: [230, 230, 230],
        valign: 'middle'
      },
      alternateRowStyles: {
        fillColor: [248, 248, 248]
      },
      columnStyles: {
        0: { cellWidth: 22, halign: 'center', fontStyle: 'bold', textColor: [corPreta[0], corPreta[1], corPreta[2]] },
        1: { cellWidth: 18, halign: 'center', textColor: [corCinza[0], corCinza[1], corCinza[2]] },
        2: { cellWidth: 28, halign: 'center', fontStyle: 'bold', fontSize: 6.5 },
        3: { cellWidth: 42, fontSize: 6.5 },
        4: { cellWidth: 35, fontSize: 7 },
        5: { cellWidth: 24, halign: 'center', fontSize: 6.5 },
        6: { cellWidth: 28, halign: 'center', fontStyle: 'italic', textColor: [corCinza[0], corCinza[1], corCinza[2]], fontSize: 6.5 },
        7: { cellWidth: 'auto', fontSize: 6 }
      },
      margin: { left: 14, right: 14 },
      didDrawPage: function(data) {
        const pageCount = doc.internal.getNumberOfPages();
        const pageHeight = doc.internal.pageSize.height;
        
        doc.setFillColor(corCinzaMuitoClaro[0], corCinzaMuitoClaro[1], corCinzaMuitoClaro[2]);
        doc.rect(0, pageHeight - 12, 297, 12, 'F');
        
        doc.setDrawColor(corCinzaClaro[0], corCinzaClaro[1], corCinzaClaro[2]);
        doc.setLineWidth(0.3);
        doc.line(0, pageHeight - 12, 297, pageHeight - 12);
        
        doc.setFontSize(6);
        doc.setTextColor(corCinza[0], corCinza[1], corCinza[2]);
        doc.setFont('helvetica', 'normal');
        doc.text('MultiAlmeida PDV', 14, pageHeight - 6);
        
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(corCinzaEscuro[0], corCinzaEscuro[1], corCinzaEscuro[2]);
        doc.text(
          `${data.pageNumber} / ${pageCount}`,
          148.5,
          pageHeight - 6,
          { align: 'center' }
        );
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(corCinza[0], corCinza[1], corCinza[2]);
        doc.text('CONFIDENCIAL', 283, pageHeight - 6, { align: 'right' });
      }
    });
    
    const nomeArquivo = `logs-multialmeida-${new Date().toISOString().split('T')[0]}.pdf`;
    doc.save(nomeArquivo);
  };

  const exportarEstatisticasPDF = () => {
    if (!stats) return;
    
    const doc = new jsPDF('p', 'mm', 'a4');
    const dataAtual = new Date().toLocaleDateString('pt-BR');
    const horaAtual = new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    
    const corPreta = [0, 0, 0];
    const corCinzaEscuro = [45, 45, 45];
    const corCinza = [100, 100, 100];
    const corCinzaClaro = [180, 180, 180];
    const corCinzaMuitoClaro = [240, 240, 240];
    const corBranca = [255, 255, 255];
    
    doc.setFillColor(corPreta[0], corPreta[1], corPreta[2]);
    doc.rect(0, 0, 210, 40, 'F');
    
    doc.setFillColor(corCinzaClaro[0], corCinzaClaro[1], corCinzaClaro[2]);
    doc.rect(0, 0, 210, 1, 'F');
    doc.setFillColor(corBranca[0], corBranca[1], corBranca[2]);
    doc.roundedRect(15, 12, 16, 16, 1, 1, 'F');
    doc.setFillColor(corPreta[0], corPreta[1], corPreta[2]);
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('MA', 18, 22);
    
    doc.setTextColor(corBranca[0], corBranca[1], corBranca[2]);
    doc.setFontSize(20);
    doc.setFont('helvetica', 'bold');
    doc.text('RELATÓRIO DE ESTATÍSTICAS', 35, 18);
    
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(corCinzaClaro[0], corCinzaClaro[1], corCinzaClaro[2]);
    doc.text('MultiAlmeida PDV • Sistema de Gestão Empresarial', 35, 26);
    
    doc.setDrawColor(corCinza[0], corCinza[1], corCinza[2]);
    doc.setLineWidth(0.2);
    doc.line(35, 29, 160, 29);
    
    doc.setFillColor(corCinzaEscuro[0], corCinzaEscuro[1], corCinzaEscuro[2]);
    doc.roundedRect(155, 10, 45, 20, 2, 2, 'F');
    
    doc.setFontSize(6);
    doc.setTextColor(corCinzaClaro[0], corCinzaClaro[1], corCinzaClaro[2]);
    doc.setFont('helvetica', 'normal');
    doc.text('GERADO EM', 159, 14);
    
    doc.setFontSize(9);
    doc.setTextColor(corBranca[0], corBranca[1], corBranca[2]);
    doc.setFont('helvetica', 'bold');
    doc.text(dataAtual, 159, 19);
    doc.setFontSize(8);
    doc.text(horaAtual, 159, 23.5);
    
    let yPos = 48;
    
    doc.setFontSize(11);
    doc.setTextColor(corPreta[0], corPreta[1], corPreta[2]);
    doc.setFont('helvetica', 'bold');
    doc.text('RESUMO EXECUTIVO', 20, yPos);
    
    yPos += 6;
    const metricas = [
      { label: 'TOTAL DE EVENTOS', valor: (stats.total || 0).toLocaleString('pt-BR') },
      { label: 'TIPOS DE EVENTOS', valor: (stats.porTipo?.length || 0).toString() },
      { label: 'USUÁRIOS ATIVOS', valor: (stats.topUsuarios?.length || 0).toString() },
      { label: 'IPs ÚNICOS', valor: (stats.topIPs?.length || 0).toString() }
    ];
    
    const cardWidth = 40;
    const cardHeight = 18;
    const spacing = 3;
    let xCard = 20;
    
    metricas.forEach((metrica) => {
      doc.setFillColor(corCinzaMuitoClaro[0], corCinzaMuitoClaro[1], corCinzaMuitoClaro[2]);
      doc.roundedRect(xCard, yPos, cardWidth, cardHeight, 1, 1, 'F');
      doc.setDrawColor(corCinzaClaro[0], corCinzaClaro[1], corCinzaClaro[2]);
      doc.setLineWidth(0.2);
      doc.roundedRect(xCard, yPos, cardWidth, cardHeight, 1, 1, 'S');
      
      doc.setFontSize(6);
      doc.setTextColor(corCinza[0], corCinza[1], corCinza[2]);
      doc.setFont('helvetica', 'bold');
      doc.text(metrica.label, xCard + cardWidth / 2, yPos + 6, { align: 'center' });
      
      doc.setFontSize(14);
      doc.setTextColor(corPreta[0], corPreta[1], corPreta[2]);
      doc.setFont('helvetica', 'bold');
      doc.text(metrica.valor, xCard + cardWidth / 2, yPos + 14, { align: 'center' });
      
      xCard += cardWidth + spacing;
    });
    
    yPos += cardHeight + 8;
    
    if (stats.porTipo && stats.porTipo.length > 0) {
      doc.setFontSize(11);
      doc.setTextColor(corPreta[0], corPreta[1], corPreta[2]);
      doc.setFont('helvetica', 'bold');
      doc.text('EVENTOS POR TIPO', 20, yPos);
      yPos += 5;
      
      const tiposData = stats.porTipo.slice(0, 15).map(item => [
        TIPOS_LOG[item.tipo] || item.tipo,
        item.total.toLocaleString('pt-BR'),
        `${((item.total / stats.total) * 100).toFixed(1)}%`
      ]);
      
      autoTable(doc, {
        startY: yPos,
        head: [['Tipo de Evento', 'Quantidade', '%']],
        body: tiposData,
        theme: 'striped',
        headStyles: {
          fillColor: [corPreta[0], corPreta[1], corPreta[2]],
          textColor: [255, 255, 255],
          fontSize: 8,
          fontStyle: 'bold',
          halign: 'center'
        },
        bodyStyles: {
          fontSize: 7,
          textColor: corCinzaEscuro
        },
        alternateRowStyles: {
          fillColor: [250, 250, 250]
        },
        columnStyles: {
          0: { cellWidth: 80 },
          1: { cellWidth: 45, halign: 'center', fontStyle: 'bold' },
          2: { cellWidth: 45, halign: 'center' }
        },
        margin: { left: 20, right: 20 }
      });
      
      yPos = doc.lastAutoTable.finalY + 10;
    }
    
    if (stats.topUsuarios && stats.topUsuarios.length > 0 && yPos < 250) {
      if (yPos > 240) {
        doc.addPage();
        yPos = 20;
      }
      
      doc.setFontSize(11);
      doc.setTextColor(corPreta[0], corPreta[1], corPreta[2]);
      doc.setFont('helvetica', 'bold');
      doc.text('TOP USUÁRIOS', 20, yPos);
      yPos += 5;
      
      const usuariosData = stats.topUsuarios.slice(0, 10).map((user, idx) => [
        `#${idx + 1}`,
        user.email,
        user.total.toLocaleString('pt-BR')
      ]);
      
      autoTable(doc, {
        startY: yPos,
        head: [['Rank', 'E-mail', 'Total']],
        body: usuariosData,
        theme: 'striped',
        headStyles: {
          fillColor: [corCinzaEscuro[0], corCinzaEscuro[1], corCinzaEscuro[2]],
          textColor: [255, 255, 255],
          fontSize: 8,
          fontStyle: 'bold',
          halign: 'center'
        },
        bodyStyles: {
          fontSize: 7,
          textColor: corCinzaEscuro
        },
        alternateRowStyles: {
          fillColor: [250, 250, 250]
        },
        columnStyles: {
          0: { cellWidth: 10, halign: 'center', fontStyle: 'bold' },
          1: { cellWidth: 'auto' },
          2: { cellWidth: 20, halign: 'center', fontStyle: 'bold' }
        },
        margin: { left: 20, right: 20 }
      });
      
      yPos = doc.lastAutoTable.finalY + 10;
    }
    
    if (stats.topIPs && stats.topIPs.length > 0 && yPos < 250) {
      if (yPos > 240) {
        doc.addPage();
        yPos = 20;
      }
      
      doc.setFontSize(11);
      doc.setTextColor(corPreta[0], corPreta[1], corPreta[2]);
      doc.setFont('helvetica', 'bold');
      doc.text('TOP ENDEREÇOS IP', 20, yPos);
      yPos += 5;
      
      const ipsData = stats.topIPs.slice(0, 10).map((ip, idx) => [
        `#${idx + 1}`,
        ip.ip,
        ip.total.toLocaleString('pt-BR')
      ]);
      
      autoTable(doc, {
        startY: yPos,
        head: [['Rank', 'Endereço IP', 'Total']],
        body: ipsData,
        theme: 'striped',
        headStyles: {
          fillColor: [corCinzaEscuro[0], corCinzaEscuro[1], corCinzaEscuro[2]],
          textColor: [255, 255, 255],
          fontSize: 8,
          fontStyle: 'bold',
          halign: 'center'
        },
        bodyStyles: {
          fontSize: 7,
          textColor: corCinzaEscuro
        },
        alternateRowStyles: {
          fillColor: [250, 250, 250]
        },
        columnStyles: {
          0: { cellWidth: 10, halign: 'center', fontStyle: 'bold' },
          1: { cellWidth: 'auto', halign: 'center' },
          2: { cellWidth: 20, halign: 'center', fontStyle: 'bold' }
        },
        margin: { left: 20, right: 20 }
      });
    }
    
    if (stats.eventosPorDia && stats.eventosPorDia.length > 0) {
      doc.addPage();
      yPos = 20;
      
      doc.setFontSize(11);
      doc.setTextColor(corPreta[0], corPreta[1], corPreta[2]);
      doc.setFont('helvetica', 'bold');
      doc.text('ATIVIDADE DIÁRIA', 20, yPos);
      yPos += 5;
      
      const diasData = stats.eventosPorDia.slice(0, 30).map(dia => [
        new Date(dia.data).toLocaleDateString('pt-BR'),
        dia.total.toLocaleString('pt-BR')
      ]);
      
      autoTable(doc, {
        startY: yPos,
        head: [['Data', 'Total']],
        body: diasData,
        theme: 'striped',
        headStyles: {
          fillColor: [corCinzaEscuro[0], corCinzaEscuro[1], corCinzaEscuro[2]],
          textColor: [255, 255, 255],
          fontSize: 8,
          fontStyle: 'bold',
          halign: 'center'
        },
        bodyStyles: {
          fontSize: 7,
          textColor: corCinzaEscuro
        },
        alternateRowStyles: {
          fillColor: [250, 250, 250]
        },
        columnStyles: {
          0: { cellWidth: 35, halign: 'center' },
          1: { cellWidth: 'auto', halign: 'center', fontStyle: 'bold' }
        },
        margin: { left: 20, right: 20 }
      });
    }
    
    const totalPages = doc.internal.getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
      doc.setPage(i);
      const pageHeight = doc.internal.pageSize.height;
      
      doc.setFillColor(corCinzaMuitoClaro[0], corCinzaMuitoClaro[1], corCinzaMuitoClaro[2]);
      doc.rect(0, pageHeight - 12, 210, 12, 'F');
      doc.setDrawColor(corCinzaClaro[0], corCinzaClaro[1], corCinzaClaro[2]);
      doc.setLineWidth(0.3);
      doc.line(0, pageHeight - 12, 210, pageHeight - 12);
      
      doc.setFontSize(6);
      doc.setTextColor(corCinza[0], corCinza[1], corCinza[2]);
      doc.setFont('helvetica', 'normal');
      doc.text('MultiAlmeida PDV', 20, pageHeight - 6);
      
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(corCinzaEscuro[0], corCinzaEscuro[1], corCinzaEscuro[2]);
      doc.text(`${i} / ${totalPages}`, 105, pageHeight - 6, { align: 'center' });
      
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(corCinza[0], corCinza[1], corCinza[2]);
      doc.text('CONFIDENCIAL', 190, pageHeight - 6, { align: 'right' });
    }
    
    const nomeArquivo = `estatisticas-multialmeida-${new Date().toISOString().split('T')[0]}.pdf`;
    doc.save(nomeArquivo);
  };

  // Filtro local de busca no padrão das telas Cupons/Planos
  const logsFiltrados = logs.filter((log) => {
    const texto = busca.toLowerCase();
    if (!texto) return true;
    const campos = [
      TIPOS_LOG[log.tipo] || log.tipo,
      log.email || "",
      log.nome || "",
      log.cargo || "",
      log.ip || "",
      log.acao || "",
    ];
    return campos.some((c) => c.toLowerCase().includes(texto));
  });

  return (
    <Sidebar>
      <div className={styles.logsContent}>
        {/* Header */}
        <div className={styles.titleRow}>
          <h1>Logs do Sistema</h1>
          <div className={styles.headerActions}>
            <button 
              onClick={abaAtiva === 'stats' ? exportarEstatisticasPDF : exportarPDF} 
              className={styles.btnExportar} 
              disabled={abaAtiva === 'logs' ? logs.length === 0 : !stats}
              title={abaAtiva === 'stats' ? 'Exportar estatísticas para PDF' : 'Exportar logs para PDF'}
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
            {/* Busca simples, igual ao padrão das páginas Cupons/Planos */}
            <div className={styles.searchBox}>
              <Search size={18} />
              <input
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
                placeholder="Pesquisar logs..."
              />
            </div>
            {/* Filtros */}
            <div className={styles.filtrosContainer}>
              {/* Filtros Rápidos de Período */}
              <div className={styles.secaoFiltro}>
                <div className={styles.labelFiltro}>
                  <Clock size={16} />
                  <span>Períodos Rápidos:</span>
                </div>
                <div className={styles.botoesGrid}>
                  {PERIODOS_RAPIDOS.map(periodo => (
                    <button
                      key={periodo.valor}
                      onClick={() => aplicarPeriodoRapido(periodo.valor)}
                      className={`${styles.btnPeriodo} ${
                        filtros.periodo_rapido === periodo.valor ? styles.btnPeriodoAtivo : ''
                      }`}
                    >
                      {periodo.label}
                    </button>
                  ))}
                  <button
                    onClick={() => {
                      const novosFiltros = { ...filtros, data_inicio: '', data_fim: '', data_inicio_api: '', data_fim_api: '', periodo_rapido: '', pagina: 1 };
                      setFiltros(novosFiltros);
                      buscarLogsComFiltros(novosFiltros);
                    }}
                    className={`${styles.btnPeriodo} ${!filtros.periodo_rapido ? styles.btnPeriodoAtivo : ''}`}
                  >
                    Personalizado
                  </button>
                </div>
              </div>

              {/* Filtros por Severidade */}
              <div className={styles.secaoFiltro}>
                <div className={styles.labelFiltro}>
                  <Shield size={16} />
                  <span>Filtrar por Severidade:</span>
                </div>
                <div className={styles.botoesGrid}>
                  <button
                    onClick={() => aplicarFiltroSeveridade('')}
                    className={`${styles.btnSeveridade} ${
                      !filtros.severidade ? styles.btnSeveridadeAtivo : ''
                    }`}
                  >
                    Todos
                  </button>
                  <button
                    onClick={() => aplicarFiltroSeveridade('info')}
                    className={`${styles.btnSeveridade} ${styles.btnSeveridadeInfo} ${
                      filtros.severidade === 'info' ? styles.btnSeveridadeAtivo : ''
                    }`}
                  >
                    Info
                  </button>
                  <button
                    onClick={() => aplicarFiltroSeveridade('success')}
                    className={`${styles.btnSeveridade} ${styles.btnSeveridadeSuccess} ${
                      filtros.severidade === 'success' ? styles.btnSeveridadeAtivo : ''
                    }`}
                  >
                    Sucesso
                  </button>
                  <button
                    onClick={() => aplicarFiltroSeveridade('warning')}
                    className={`${styles.btnSeveridade} ${styles.btnSeveridadeWarning} ${
                      filtros.severidade === 'warning' ? styles.btnSeveridadeAtivo : ''
                    }`}
                  >
                    Aviso
                  </button>
                  <button
                    onClick={() => aplicarFiltroSeveridade('error')}
                    className={`${styles.btnSeveridade} ${styles.btnSeveridadeError} ${
                      filtros.severidade === 'error' ? styles.btnSeveridadeAtivo : ''
                    }`}
                  >
                    Erro
                  </button>
                </div>
              </div>

              {/* Demais Filtros */}
              <div className={styles.filtrosGrid}>
                <div className={styles.inputGroup}>
                  <label>Tipo de Log</label>
                  <select
                    value={filtros.tipo}
                    onChange={(e) => {
                      const novosFiltros = { ...filtros, tipo: e.target.value, pagina: 1 };
                      setFiltros(novosFiltros);
                      buscarLogsComFiltros(novosFiltros);
                    }}
                  >
                    <option value="">Todos os Tipos</option>
                    {Object.keys(TIPOS_LOG).map(tipo => (
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
                    onChange={(e) => {
                      const novoValor = e.target.value;
                      const novosFiltros = { ...filtros, email: novoValor, pagina: 1 };
                      setFiltros(novosFiltros);
                      buscarLogsComFiltros(novosFiltros);
                    }}
                  />
                </div>

                <div className={styles.inputGroup}>
                  <label>Nome do Usuário</label>
                  <input
                    type="text"
                    placeholder="Filtrar por nome..."
                    value={filtros.nome}
                    onChange={(e) => {
                      const novoValor = e.target.value;
                      const novosFiltros = { ...filtros, nome: novoValor, pagina: 1 };
                      setFiltros(novosFiltros);
                      buscarLogsComFiltros(novosFiltros);
                    }}
                  />
                </div>

                <div className={styles.inputGroup}>
                  <label>Cargo/Função</label>
                  <input
                    type="text"
                    placeholder="Filtrar por cargo..."
                    value={filtros.cargo}
                    onChange={(e) => {
                      const novoValor = e.target.value;
                      const novosFiltros = { ...filtros, cargo: novoValor, pagina: 1 };
                      setFiltros(novosFiltros);
                      buscarLogsComFiltros(novosFiltros);
                    }}
                  />
                </div>

                <div className={styles.inputGroup}>
                  <label>IP</label>
                  <input
                    type="text"
                    placeholder="Filtrar por IP..."
                    value={filtros.ip}
                    onChange={(e) => {
                      const novoValor = e.target.value;
                      const novosFiltros = { ...filtros, ip: novoValor, pagina: 1 };
                      setFiltros(novosFiltros);
                      buscarLogsComFiltros(novosFiltros);
                    }}
                  />
                </div>

                <div className={styles.inputGroup}>
                  <label>Data Início</label>
                  <input
                    type="date"
                    value={filtros.data_inicio}
                    onChange={(e) => {
                      const novosFiltros = { ...filtros, data_inicio: e.target.value, data_inicio_api: '', periodo_rapido: '', pagina: 1 };
                      setFiltros(novosFiltros);
                      buscarLogsComFiltros(novosFiltros);
                    }}
                  />
                </div>

                <div className={styles.inputGroup}>
                  <label>Data Fim</label>
                  <input
                    type="date"
                    value={filtros.data_fim}
                    onChange={(e) => {
                      const novosFiltros = { ...filtros, data_fim: e.target.value, data_fim_api: '', periodo_rapido: '', pagina: 1 };
                      setFiltros(novosFiltros);
                      buscarLogsComFiltros(novosFiltros);
                    }}
                  />
                </div>

                <div className={styles.inputGroup}>
                  <label>Por Página</label>
                  <select
                    value={filtros.limite}
                    onChange={(e) => {
                      const novosFiltros = { ...filtros, limite: e.target.value, pagina: 1 };
                      setFiltros(novosFiltros);
                      buscarLogsComFiltros(novosFiltros);
                    }}
                  >
                    <option value="25">25 por página</option>
                    <option value="50">50 por página</option>
                    <option value="100">100 por página</option>
                    <option value="200">200 por página</option>
                  </select>
                </div>
              </div>

              <button onClick={() => {
                const novosFiltros = { tipo: '', email: '', nome: '', cargo: '', ip: '', data_inicio: '', data_fim: '', data_inicio_api: '', data_fim_api: '', limite: 25, pagina: 1, severidade: '', periodo_rapido: '' };
                setFiltros(novosFiltros);
                buscarLogsComFiltros(novosFiltros);
              }} className={styles.btnBuscar}>
                <Search size={18} />
                Limpar Filtros
              </button>
            </div>

            {/* Lista de Logs */}
            {logsFiltrados.length === 0 && !loading ? (
              <div className={styles.emptyState}>
                <FileText size={64} />
                <p>Nenhum log encontrado</p>
              </div>
            ) : logsFiltrados.length > 0 && (
              <>
                <div className={styles.logsListContainer}>
                  <div className={styles.logsList}>
                    {logsFiltrados.map((log) => {
                      const severidade = SEVERIDADE_LOG[log.tipo] || 'info';
                      return (
                        <div 
                          key={log.id} 
                          className={`${styles.logItem} ${styles[`logItem${severidade.charAt(0).toUpperCase() + severidade.slice(1)}`]}`}
                          onClick={() => setLogSelecionado(log)}
                        >
                          <div className={styles.logHeader}>
                            <div className={styles.logTipoWrapper}>
                              <span className={`${styles.logTipo} ${styles[`logTipo${severidade.charAt(0).toUpperCase() + severidade.slice(1)}`]}`}>
                                {severidade === 'error' && <AlertTriangle size={14} />}
                                {severidade === 'warning' && <AlertCircle size={14} />}
                                {severidade === 'success' && <Activity size={14} />}
                                {TIPOS_LOG[log.tipo]}
                              </span>
                              <span className={`${styles.severidadeBadge} ${styles[`severidade${severidade.charAt(0).toUpperCase() + severidade.slice(1)}`]}`}>
                                {severidade === 'info' && 'Info'}
                                {severidade === 'success' && 'Sucesso'}
                                {severidade === 'warning' && 'Aviso'}
                                {severidade === 'error' && 'Erro'}
                              </span>
                            </div>
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
                      );
                    })}
                  </div>
                </div>

                {/* Paginação Moderna */}
                <div className={styles.paginacaoContainer}>
                  <div className={styles.paginacaoInfo}>
                    <span className={styles.resultadosTexto}>
                      Mostrando <strong>{logsFiltrados.length}</strong> de <strong>{pagination.total}</strong> logs
                    </span>
                  </div>
                  
                  <div className={styles.paginacao}>
                    {/* Página anterior */}
                    <button
                      onClick={() => mudarPagina(pagination.pagina - 1)}
                      disabled={pagination.pagina === 1}
                      className={`${styles.btnPaginacao} ${styles.btnSeta}`}
                      title="Página anterior"
                    >
                      <ChevronLeft size={18} />
                    </button>
                    
                    {/* Números das páginas */}
                    <div className={styles.numerosContainer}>
                      {(() => {
                        const paginas = [];
                        const totalPaginas = pagination.totalPaginas;
                        const paginaAtual = pagination.pagina;
                        
                        if (totalPaginas > 0) {
                          paginas.push(
                            <button
                              key={1}
                              onClick={() => mudarPagina(1)}
                              className={`${styles.btnNumero} ${paginaAtual === 1 ? styles.btnNumeroAtivo : ''}`}
                            >
                              1
                            </button>
                          );
                        }
                        
                        if (paginaAtual > 3) {
                          paginas.push(<span key="dots1" className={styles.dots}>...</span>);
                        }
                        const inicio = Math.max(2, paginaAtual - 1);
                        const fim = Math.min(totalPaginas - 1, paginaAtual + 1);
                        
                        for (let i = inicio; i <= fim; i++) {
                          paginas.push(
                            <button
                              key={i}
                              onClick={() => mudarPagina(i)}
                              className={`${styles.btnNumero} ${paginaAtual === i ? styles.btnNumeroAtivo : ''}`}
                            >
                              {i}
                            </button>
                          );
                        }
                        
                        if (paginaAtual < totalPaginas - 2) {
                          paginas.push(<span key="dots2" className={styles.dots}>...</span>);
                        }
                        
                        if (totalPaginas > 1) {
                          paginas.push(
                            <button
                              key={totalPaginas}
                              onClick={() => mudarPagina(totalPaginas)}
                              className={`${styles.btnNumero} ${paginaAtual === totalPaginas ? styles.btnNumeroAtivo : ''}`}
                            >
                              {totalPaginas}
                            </button>
                          );
                        }
                        
                        return paginas;
                      })()}
                    </div>
                    
                    {/* Próxima página */}
                    <button
                      onClick={() => mudarPagina(pagination.pagina + 1)}
                      disabled={pagination.pagina === pagination.totalPaginas}
                      className={`${styles.btnPaginacao} ${styles.btnSeta}`}
                      title="Próxima página"
                    >
                      <ChevronRight size={18} />
                    </button>
                    
                  </div>
                  
                  <div className={styles.irParaContainer}>
                    <span>Ir para:</span>
                    <input
                      type="number"
                      min="1"
                      max={pagination.totalPaginas}
                      placeholder={pagination.pagina.toString()}
                      onChange={(e) => {
                        const valor = parseInt(e.target.value);
                        if (valor >= 1 && valor <= pagination.totalPaginas) {
                          mudarPagina(valor);
                        }
                      }}
                      onKeyPress={(e) => {
                        if (e.key === 'Enter') {
                          const valor = parseInt(e.target.value);
                          if (valor >= 1 && valor <= pagination.totalPaginas) {
                            mudarPagina(valor);
                          }
                        }
                      }}
                      className={styles.inputIrPara}
                    />
                  </div>
                </div>
              </>
            )}
          </>
        )}

        {abaAtiva === 'stats' && (
          <div>
            {/* Filtro de Período para Estatísticas */}
            <div className={styles.periodoStatsContainer}>
              <div className={styles.periodoStatsLabel}>
                <Calendar size={16} />
                <span>Período de Análise:</span>
              </div>
              <div className={styles.periodoStatsButtons}>
                <button
                  onClick={() => setPeriodoStats('7')}
                  className={`${styles.btnPeriodoStats} ${periodoStats === '7' ? styles.btnPeriodoStatsAtivo : ''}`}
                >
                  Últimos 7 dias
                </button>
                <button
                  onClick={() => setPeriodoStats('15')}
                  className={`${styles.btnPeriodoStats} ${periodoStats === '15' ? styles.btnPeriodoStatsAtivo : ''}`}
                >
                  Últimos 15 dias
                </button>
                <button
                  onClick={() => setPeriodoStats('30')}
                  className={`${styles.btnPeriodoStats} ${periodoStats === '30' ? styles.btnPeriodoStatsAtivo : ''}`}
                >
                  Últimos 30 dias
                </button>
                <button
                  onClick={() => setPeriodoStats('60')}
                  className={`${styles.btnPeriodoStats} ${periodoStats === '60' ? styles.btnPeriodoStatsAtivo : ''}`}
                >
                  Últimos 60 dias
                </button>
                <button
                  onClick={() => setPeriodoStats('90')}
                  className={`${styles.btnPeriodoStats} ${periodoStats === '90' ? styles.btnPeriodoStatsAtivo : ''}`}
                >
                  Últimos 90 dias
                </button>
              </div>
            </div>

            {loadingStats ? (
              <div className={styles.loadingContainer}>
                <Spinner />
              </div>
            ) : stats ? (
              <>
                {/* Cards de Estatísticas */}
                <div className={styles.statsGrid}>
                  <div className={`${styles.statCard} ${styles.statCardPrimary}`}>
                    <div className={styles.statIcon}>
                      <Activity size={24} />
                    </div>
                    <div className={styles.statContent}>
                      <div className={styles.statLabel}>Total de Eventos</div>
                      <div className={styles.statValue}>{stats.total?.toLocaleString('pt-BR') || 0}</div>
                    </div>
                  </div>
                  <div className={`${styles.statCard} ${styles.statCardSuccess}`}>
                    <div className={styles.statIcon}>
                      <BarChart3 size={24} />
                    </div>
                    <div className={styles.statContent}>
                      <div className={styles.statLabel}>Tipos de Eventos</div>
                      <div className={styles.statValue}>{stats.porTipo?.length || 0}</div>
                    </div>
                  </div>
                  <div className={`${styles.statCard} ${styles.statCardInfo}`}>
                    <div className={styles.statIcon}>
                      <TrendingUp size={24} />
                    </div>
                    <div className={styles.statContent}>
                      <div className={styles.statLabel}>Usuários Ativos</div>
                      <div className={styles.statValue}>{stats.topUsuarios?.length || 0}</div>
                    </div>
                  </div>
                  <div className={`${styles.statCard} ${styles.statCardWarning}`}>
                    <div className={styles.statIcon}>
                      <Shield size={24} />
                    </div>
                    <div className={styles.statContent}>
                      <div className={styles.statLabel}>IPs Únicos</div>
                      <div className={styles.statValue}>{stats.topIPs?.length || 0}</div>
                    </div>
                  </div>
                </div>

                {/* Estatísticas Avançadas */}
                {stats.eventosPorDia && stats.eventosPorDia.length > 0 && (
                  <div className={styles.logsListContainerStats}>
                    <h2 className={styles.statsTitle}>
                      <Calendar size={20} />
                      Atividade Diária (Últimos 30 dias)
                    </h2>
                    <div className={styles.atividadeDiariaGrid}>
                      {stats.eventosPorDia.slice(0, 30).map(dia => (
                        <div key={dia.data} className={styles.diaCard}>
                          <div className={styles.diaData}>
                            {new Date(dia.data).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}
                          </div>
                          <div className={styles.diaValor}>{dia.total}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Eventos por Hora */}
                {stats.eventosPorHora && stats.eventosPorHora.length > 0 && (
                  <div className={styles.logsListContainerStats}>
                    <h2 className={styles.statsTitle}>
                      <Clock size={20} />
                      Distribuição por Hora do Dia
                    </h2>
                    <div className={styles.horaGrid}>
                      {stats.eventosPorHora.map(hora => (
                        <div key={hora.hora} className={styles.horaCard}>
                          <div className={styles.horaLabel}>{hora.hora}h</div>
                          <div className={styles.horaBarra}>
                            <div 
                              className={styles.horaBarraFill} 
                              style={{ 
                                width: `${(hora.total / Math.max(...stats.eventosPorHora.map(h => h.total))) * 100}%` 
                              }}
                            ></div>
                          </div>
                          <div className={styles.horaValor}>{hora.total}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Eventos por Tipo */}
                {stats.porTipo && stats.porTipo.length > 0 && (
                  <div className={styles.logsListContainerStats}>
                    <h2 className={styles.statsTitle}>Eventos por Tipo</h2>
                    <div className={styles.statsListScrollable}>
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
                  </div>
                )}

                {/* Top Usuários */}
                {stats.topUsuarios && stats.topUsuarios.length > 0 && (
                  <div className={styles.logsListContainerStats}>
                    <h2 className={styles.statsTitle}>Top Usuários</h2>
                    <div className={styles.statsListScrollable}>
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
                  </div>
                )}

                {/* Top IPs */}
                {stats.topIPs && stats.topIPs.length > 0 && (
                  <div className={styles.logsListContainerStats}>
                    <h2 className={styles.statsTitle}>Top IPs</h2>
                    <div className={styles.statsListScrollable}>
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
