'use client';

import { useState, useEffect } from 'react';
import { Search, Filter, Download } from 'lucide-react';

interface FiltrosNotasProps {
  onFiltroChange: (filtros: any) => void;
  onExportar: () => void;
  carregando: boolean;
}

interface OpcoesSelect {
  anosLetivos: { AnoLetivo: string }[];
  turmas: { numero: string; classe: string; serie: string; turma: string }[];
  disciplinas: { codigo: string; nome: string }[];
  bimestres: { Bim: string }[];
}

export default function FiltrosNotas({ onFiltroChange, onExportar, carregando }: FiltrosNotasProps) {
  const [filtros, setFiltros] = useState({
    anoLetivo: new Date().getFullYear().toString(),
    bimestre: '',
    turma: '',
    disciplina: '',
    aluno: '',
    tipo: 'notas'
  });

  const [opcoes, setOpcoes] = useState<OpcoesSelect>({
    anosLetivos: [],
    turmas: [],
    disciplinas: [],
    bimestres: []
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
    try {
      // Carregar anos
      const anosRes = await fetch(`/funcoes/filtros/relatorio-notas?tipo=anos`);
      const anosData = await anosRes.json();

      if (anosData.success) {
        setOpcoes(prev => ({
          ...prev,
          anosLetivos: anosData.data
        }));
      }
    } catch (error) {
      console.error('Erro ao carregar opções:', error);
    }
  };

  const carregarTurmas = async () => {
    try {
      const res = await fetch(`/funcoes/filtros/relatorio-notas?tipo=turmas&anoLetivo=${filtros.anoLetivo}`);
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
      const res = await fetch(`/funcoes/filtros/relatorio-notas?tipo=disciplinas&anoLetivo=${filtros.anoLetivo}`);
      const data = await res.json();
      setOpcoes(prev => ({
        ...prev,
        disciplinas: data.success ? data.data : []
      }));
    } catch (error) {
      console.error('Erro ao carregar disciplinas:', error);
    }
  };

  const carregarBimestres = async () => {
    try {
      const res = await fetch(`/funcoes/filtros/relatorio-notas?tipo=bimestres&anoLetivo=${filtros.anoLetivo}`);
      const data = await res.json();
      setOpcoes(prev => ({
        ...prev,
        bimestres: data.success ? data.data : []
      }));
    } catch (error) {
      console.error('Erro ao carregar bimestres:', error);
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

  // useEffect para carregar turmas quando ano letivo mudar
  useEffect(() => {
    if (filtros.anoLetivo) {
      carregarTurmas();
      carregarDisciplinas();
      carregarBimestres();
    }
  }, [filtros.anoLetivo]);

  // useEffect para notificar mudanças nos filtros
  useEffect(() => {
    onFiltroChange(filtros);
  }, [filtros, onFiltroChange]);

  const limparFiltros = () => {
    const filtrosLimpos = {
      anoLetivo: '2025',
      bimestre: '',
      turma: '',
      disciplina: '',
      aluno: '',
      tipo: 'notas'
    };
    setFiltros(filtrosLimpos);
    onFiltroChange(filtrosLimpos);
  };

  return (
    <div className="filter-container">
      <div className="flex items-center gap-2 mb-4">
        <Filter className="w-5 h-5 text-blue-600" />
        <h2 className="text-lg font-semibold text-gray-800">Filtros - Relatório de Notas</h2>
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
            <option value="">Selecione o ano</option>
            {opcoes.anosLetivos?.map((ano: any) => (
              <option key={ano.AnoLetivo} value={ano.AnoLetivo}>
                {ano.AnoLetivo}
              </option>
            ))}
          </select>
        </div>

        {/* Bimestre */}
        <div className="form-group">
          <label htmlFor="bimestre" className="form-label">
            Bimestre
          </label>
          <select
            id="bimestre"
            value={filtros.bimestre}
            onChange={(e) => handleFiltroChange('bimestre', e.target.value)}
            className="form-select"
          >
            <option value="">Todos os Bimestres</option>
            {opcoes.bimestres?.map((bim: any) => (
              <option key={bim.Bim} value={bim.Bim}>
                {bim.Bim}º Bimestre
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