'use client';

import { useState, useEffect } from 'react';
import { Search, Filter, Download, Calendar } from 'lucide-react';

interface FiltrosFaltasProps {
  onFiltroChange: (filtros: any) => void;
  onExportar: () => void;
  carregando: boolean;
}

interface OpcoesSelect {
  anosLetivos: { AnoLetivo: string }[];
  turmas: { numero: string; classe: string; serie: string; turma: string }[];
  disciplinas: { codigo: string; nome: string }[];
}

export default function FiltrosFaltas({ onFiltroChange, onExportar, carregando }: FiltrosFaltasProps) {
  // Função para obter data padrão (7 dias atrás) no formato brasileiro
  const getDataPadrao = () => {
    const hoje = new Date();
    const seteDiasAtras = new Date(hoje);
    seteDiasAtras.setDate(hoje.getDate() - 7);
    
    // Formatação brasileira: DD/MM/YYYY -> YYYY-MM-DD para input date
    const ano = seteDiasAtras.getFullYear();
    const mes = String(seteDiasAtras.getMonth() + 1).padStart(2, '0');
    const dia = String(seteDiasAtras.getDate()).padStart(2, '0');
    
    return `${ano}-${mes}-${dia}`;
  };

  // Função para obter data atual no formato brasileiro
  const getDataAtual = () => {
    const hoje = new Date();
    
    // Formatação brasileira: DD/MM/YYYY -> YYYY-MM-DD para input date
    const ano = hoje.getFullYear();
    const mes = String(hoje.getMonth() + 1).padStart(2, '0');
    const dia = String(hoje.getDate()).padStart(2, '0');
    
    return `${ano}-${mes}-${dia}`;
  };

  const [filtros, setFiltros] = useState({
    anoLetivo: new Date().getFullYear().toString(),
    turma: '',
    disciplina: '',
    aluno: '',
    tipo: 'faltas',
    dataInicio: getDataPadrao(),
    dataFim: getDataAtual()
  });

  const [opcoes, setOpcoes] = useState<OpcoesSelect>({
    anosLetivos: [],
    turmas: [],
    disciplinas: []
  });

  const [carregandoOpcoes, setCarregandoOpcoes] = useState(false);

  // Carregar opções dos filtros
  useEffect(() => {
    carregarOpcoes();
  }, []);

  // Atualizar turmas e disciplinas quando o ano muda
  useEffect(() => {
    if (filtros.anoLetivo) {
      carregarTurmas();
      carregarDisciplinas();
    }
  }, [filtros.anoLetivo]);

  const carregarOpcoes = async () => {
    setCarregandoOpcoes(true);
    try {
      // Carregar anos
      const anosRes = await fetch(`/funcoes/filtros/relatorio-faltas?tipo=anos`);
      const anosData = await anosRes.json();

      setOpcoes(prev => ({
        ...prev,
        anosLetivos: anosData.success ? anosData.data : []
      }));
    } catch (error) {
      console.error('Erro ao carregar opções:', error);
    } finally {
      setCarregandoOpcoes(false);
    }
  };

  const carregarTurmas = async () => {
    try {
      const res = await fetch(`/funcoes/filtros/relatorio-faltas?tipo=turmas&anoLetivo=${filtros.anoLetivo}`);
      const data = await res.json();
      setOpcoes(prev => ({
        ...prev,
        turmas: data.success ? data.data : []
      }));
    } catch (error) {
      console.error('Erro ao carregar turmas:', error);
    }
  };

  const carregarDisciplinas = async () => {
    try {
      const res = await fetch(`/funcoes/filtros/relatorio-faltas?tipo=disciplinas&anoLetivo=${filtros.anoLetivo}`);
      const data = await res.json();
      setOpcoes(prev => ({
        ...prev,
        disciplinas: data.success ? data.data : []
      }));
    } catch (error) {
      console.error('Erro ao carregar disciplinas:', error);
    }
  };

  const handleFiltroChange = (campo: string, valor: string) => {
    setFiltros(prev => {
      const novosFiltros = { ...prev, [campo]: valor };
      return novosFiltros;
    });
  };

  // useEffect para carregar opções iniciais
  useEffect(() => {
    carregarOpcoes();
  }, []);

  // useEffect para carregar turmas e disciplinas quando ano letivo mudar
  useEffect(() => {
    if (filtros.anoLetivo) {
      carregarTurmas();
      carregarDisciplinas();
    }
  }, [filtros.anoLetivo]);

  // useEffect para notificar mudanças nos filtros
  useEffect(() => {
    onFiltroChange(filtros);
  }, [filtros, onFiltroChange]);

  const limparFiltros = () => {
    const filtrosLimpos = {
      anoLetivo: '2025',
      turma: '',
      disciplina: '',
      aluno: '',
      tipo: 'faltas',
      dataInicio: getDataPadrao(),
      dataFim: getDataAtual()
    };
    setFiltros(filtrosLimpos);
    onFiltroChange(filtrosLimpos);
  };

  return (
    <div className="filter-container">
      <div className="flex items-center gap-2 mb-4">
        <Filter className="w-5 h-5 text-blue-600" />
        <h2 className="text-lg font-semibold text-gray-800">Filtros - Relatório de Faltas</h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 mb-6">
        {/* Ano Letivo */}
        <div className="form-group">
          <label htmlFor="anoLetivo" className="form-label">
            Ano Letivo
          </label>
          <select
            id="anoLetivo"
            value={filtros.anoLetivo}
            onChange={(e) => handleFiltroChange('anoLetivo', e.target.value)}
            className="form-select"
            disabled={carregandoOpcoes}
          >
            <option value="">Selecione o ano letivo</option>
            {opcoes.anosLetivos?.map((ano: any) => (
              <option key={ano.AnoLetivo} value={ano.AnoLetivo}>
                {ano.AnoLetivo}
              </option>
            ))}
          </select>
        </div>

        {/* Turma */}
        <div className="form-group">
          <label htmlFor="turma" className="form-label">
            Turma
          </label>
          <select
            id="turma"
            value={filtros.turma}
            onChange={(e) => handleFiltroChange('turma', e.target.value)}
            className="form-select"
            disabled={carregandoOpcoes}
          >
            <option value="">Todas as turmas</option>
            {opcoes.turmas?.map((turma: any) => (
              <option key={turma.numero} value={turma.numero}>
                {turma.classe}
              </option>
            ))}
          </select>
        </div>

        {/* Disciplina */}
        <div className="form-group">
          <label htmlFor="disciplina" className="form-label">
            Disciplina
          </label>
          <select
            id="disciplina"
            value={filtros.disciplina}
            onChange={(e) => handleFiltroChange('disciplina', e.target.value)}
            className="form-select"
            disabled={carregandoOpcoes}
          >
            <option value="">Todas as disciplinas</option>
            {opcoes.disciplinas?.map((disciplina: any) => (
              <option key={disciplina.codigo} value={disciplina.codigo}>
                {disciplina.nome}
              </option>
            ))}
          </select>
        </div>

        {/* Aluno */}
        <div className="form-group">
          <label htmlFor="aluno" className="form-label">
            Aluno
          </label>
          <div className="relative">
            <Search className="input-icon" />
            <input
              type="text"
              id="aluno"
              placeholder="Nome do aluno"
              value={filtros.aluno}
              onChange={(e) => handleFiltroChange('aluno', e.target.value)}
              className="form-input-with-icon"
            />
          </div>
        </div>

        {/* Data Início */}
        <div className="form-group">
          <label htmlFor="dataInicio" className="form-label">
            <Calendar className="w-4 h-4 inline mr-1" />
            Data Início
          </label>
          <input
            type="date"
            id="dataInicio"
            value={filtros.dataInicio}
            onChange={(e) => handleFiltroChange('dataInicio', e.target.value)}
            className="form-input"
          />
        </div>

        {/* Data Fim */}
        <div className="form-group">
          <label htmlFor="dataFim" className="form-label">
            <Calendar className="w-4 h-4 inline mr-1" />
            Data Final
          </label>
          <input
            type="date"
            id="dataFim"
            value={filtros.dataFim}
            onChange={(e) => handleFiltroChange('dataFim', e.target.value)}
            className="form-input"
          />
        </div>
      </div>

      {/* Botões de Ação */}
      <div className="flex flex-wrap gap-3">
        <button
          onClick={limparFiltros}
          className="btn-secondary"
          disabled={carregando}
        >
          Limpar Filtros
        </button>
        
        <button
          onClick={onExportar}
          disabled={carregando}
          className="btn-primary flex items-center gap-2"
        >
          <Download className="w-4 h-4" />
          {carregando ? 'Exportando...' : 'Exportar Excel'}
        </button>
      </div>
    </div>
  );
}