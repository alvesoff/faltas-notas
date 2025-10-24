'use client';

import { useState, useEffect } from 'react';
import { Search, Filter, Download, Calendar } from 'lucide-react';

interface FiltrosProps {
  onFiltroChange: (filtros: any) => void;
  onExportar: () => void;
  carregando: boolean;
}

interface OpcoesSelect {
  anos: string[];
  turmas: { numero: string; classe: string; serie: string; turma: string }[];
  disciplinas: { codigo: string; nome: string }[];
  bimestres: string[];
}

export default function Filtros({ onFiltroChange, onExportar, carregando }: FiltrosProps) {
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
    anoLetivo: '2025',
    bimestre: '',
    turma: '',
    disciplina: '',
    aluno: '',
    tipo: 'faltas',
    tipoFalta: 'detalhadas', // novo campo para tipo de falta
    dataInicio: getDataPadrao(),
    dataFim: getDataAtual()
  });

  const [opcoes, setOpcoes] = useState<OpcoesSelect>({
    anos: [],
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
    setCarregandoOpcoes(true);
    try {
      // Carregar anos
      const anosRes = await fetch('/api/filtros?tipo=anos');
      const anosData = await anosRes.json();
      
      // Carregar bimestres
      const bimRes = await fetch('/api/filtros?tipo=bimestres');
      const bimData = await bimRes.json();

      setOpcoes(prev => ({
        ...prev,
        anos: anosData.success ? anosData.data.map((item: any) => item.AnoLetivo) : [],
        bimestres: bimData.success ? bimData.data.map((item: any) => item.Bim) : []
      }));
    } catch (error) {
      console.error('Erro ao carregar opções:', error);
    } finally {
      setCarregandoOpcoes(false);
    }
  };

  const carregarTurmas = async () => {
    try {
      const res = await fetch(`/api/filtros?tipo=turmas&anoLetivo=${filtros.anoLetivo}`);
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
      const res = await fetch(`/api/filtros?tipo=disciplinas&anoLetivo=${filtros.anoLetivo}`);
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
      
      // Reset específico quando muda o tipo de relatório
      if (campo === 'tipo') {
        if (valor === 'faltas') {
          // Reset bimestre para relatório de faltas
          novosFiltros.bimestre = '';
          // Manter tipoFalta como estava
        } else {
          // Reset datas para relatório de notas
          novosFiltros.dataInicio = getDataPadrao();
          novosFiltros.dataFim = getDataAtual();
          // Reset tipoFalta para relatório de notas
          novosFiltros.tipoFalta = 'detalhadas';
        }
      }
      
      // Reset disciplina quando muda para faltas resumidas
      if (campo === 'tipoFalta' && valor === 'resumidas') {
        novosFiltros.disciplina = '';
      }
      
      return novosFiltros;
    });
  };

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
      tipo: 'faltas',
      tipoFalta: 'detalhadas',
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
        <h2 className="text-lg font-semibold text-gray-800">Filtros de Pesquisa</h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 mb-4">
        {/* Tipo de Relatório */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Tipo de Relatório
          </label>
          <select
            value={filtros.tipo}
            onChange={(e) => handleFiltroChange('tipo', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
          >
            <option value="faltas">Relatório de Faltas</option>
            <option value="notas">Relatório de Notas</option>
          </select>
        </div>

        {/* Busca por Aluno - Sempre visível */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Buscar Aluno
          </label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={filtros.aluno}
              onChange={(e) => handleFiltroChange('aluno', e.target.value)}
              placeholder="Nome ou matrícula..."
              className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 placeholder-gray-500"
            />
          </div>
        </div>

        {/* Filtros específicos para Relatório de Faltas */}
        {filtros.tipo === 'faltas' && (
          <>
            {/* Tipo de Falta */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Tipo de Falta
              </label>
              <select
                value={filtros.tipoFalta}
                onChange={(e) => handleFiltroChange('tipoFalta', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
              >
                <option value="detalhadas">Faltas Detalhadas</option>
                <option value="resumidas">Faltas Resumidas</option>
              </select>
            </div>

            {/* Data Início */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Data Início
              </label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="date"
                  value={filtros.dataInicio}
                  onChange={(e) => handleFiltroChange('dataInicio', e.target.value)}
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                />
              </div>
            </div>

            {/* Data Fim */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Data Fim
              </label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="date"
                  value={filtros.dataFim}
                  onChange={(e) => handleFiltroChange('dataFim', e.target.value)}
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                />
              </div>
            </div>
          </>
        )}

        {/* Filtros específicos para Relatório de Notas */}
        {filtros.tipo === 'notas' && (
          <>
            {/* Ano Letivo - Apenas para Notas */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Ano Letivo
              </label>
              <select
                value={filtros.anoLetivo}
                onChange={(e) => handleFiltroChange('anoLetivo', e.target.value)}
                disabled={carregandoOpcoes}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
              >
                {opcoes.anos.map(ano => (
                  <option key={ano} value={ano}>{ano}</option>
                ))}
              </select>
            </div>

            {/* Bimestre - Apenas para Notas */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Bimestre
              </label>
              <select
                value={filtros.bimestre}
                onChange={(e) => handleFiltroChange('bimestre', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
              >
                <option value="">Todos os Bimestres</option>
                {opcoes.bimestres.map(bim => (
                  <option key={bim} value={bim}>{bim}º Bimestre</option>
                ))}
              </select>
            </div>
          </>
        )}

        {/* Turma - Sempre visível */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Turma
          </label>
          <select
            value={filtros.turma}
            onChange={(e) => handleFiltroChange('turma', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
          >
            <option value="">Todas as Turmas</option>
            {opcoes.turmas.map(turma => (
              <option key={turma.classe} value={turma.classe}>
                {turma.numero}
              </option>
            ))}
          </select>
        </div>

        {/* Disciplina - Ocultar quando faltas resumidas */}
        {!(filtros.tipo === 'faltas' && filtros.tipoFalta === 'resumidas') && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Disciplina
            </label>
            <select
              value={filtros.disciplina}
              onChange={(e) => handleFiltroChange('disciplina', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
            >
              <option value="">Todas as Disciplinas</option>
              {opcoes.disciplinas.map(disc => (
                <option key={disc.codigo} value={disc.codigo}>
                  {disc.nome}
                </option>
              ))}
            </select>
          </div>
        )}
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