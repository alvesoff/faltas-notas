'use client';

import { useState } from 'react';
import { ChevronUp, ChevronDown, AlertTriangle, CheckCircle } from 'lucide-react';

interface DadosFaltas {
  matricula: string;
  nomeAluno: string;
  anoLetivo?: string;
  classe?: string;
  turma: string;
  totalDiasComFalta?: number;
  totalFaltas?: number;
  status?: string;
}

interface TabelaFaltasProps {
  dados: DadosFaltas[];
  carregando: boolean;
}

type CampoOrdenacao = keyof DadosFaltas;

export default function TabelaFaltas({ dados, carregando }: TabelaFaltasProps) {
  const [ordenacao, setOrdenacao] = useState<{
    campo: CampoOrdenacao;
    direcao: 'asc' | 'desc';
  }>({
    campo: 'nomeAluno',
    direcao: 'asc'
  });

  const [paginaAtual, setPaginaAtual] = useState(1);
  const itensPorPagina = 50;

  const handleOrdenacao = (campo: CampoOrdenacao) => {
    setOrdenacao(prev => ({
      campo,
      direcao: prev.campo === campo && prev.direcao === 'asc' ? 'desc' : 'asc'
    }));
  };

  const dadosOrdenados = [...dados].sort((a, b) => {
    const valorA = a[ordenacao.campo];
    const valorB = b[ordenacao.campo];
    
    if (typeof valorA === 'string' && typeof valorB === 'string') {
      return ordenacao.direcao === 'asc' 
        ? valorA.localeCompare(valorB)
        : valorB.localeCompare(valorA);
    }
    
    if (typeof valorA === 'number' && typeof valorB === 'number') {
      return ordenacao.direcao === 'asc' 
        ? valorA - valorB
        : valorB - valorA;
    }
    
    return 0;
  });

  const totalPaginas = Math.ceil(dadosOrdenados.length / itensPorPagina);
  const indiceInicio = (paginaAtual - 1) * itensPorPagina;
  const indiceFim = indiceInicio + itensPorPagina;
  const dadosPaginados = dadosOrdenados.slice(indiceInicio, indiceFim);

  const IconeOrdenacao = ({ campo }: { campo: CampoOrdenacao }) => {
    if (ordenacao.campo !== campo) return null;
    return ordenacao.direcao === 'asc' ? 
      <ChevronUp className="w-4 h-4" /> : 
      <ChevronDown className="w-4 h-4" />;
  };

  if (carregando) {
    return (
      <div className="table-container">
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-3 text-gray-600">Carregando dados...</span>
        </div>
      </div>
    );
  }

  if (dados.length === 0) {
    return (
      <div className="table-container">
        <div className="text-center py-12">
          <AlertTriangle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhum dado encontrado</h3>
          <p className="text-gray-600">Tente ajustar os filtros para encontrar os dados desejados.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Informações do Relatório */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h3 className="text-lg font-semibold text-blue-900">
              Relatório de Faltas
            </h3>
            <p className="text-blue-700">
              Total de registros: <span className="font-medium">{dados.length}</span>
            </p>
          </div>
          <div className="text-sm text-blue-600">
            Página {paginaAtual} de {totalPaginas}
          </div>
        </div>
      </div>

      {/* Tabela */}
      <div className="table-container">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="table-header">
            <tr>
              <th 
                className="table-cell cursor-pointer hover:bg-gray-100 select-none"
                onClick={() => handleOrdenacao('matricula')}
              >
                <div className="flex items-center gap-1">
                  Matrícula
                  <IconeOrdenacao campo="matricula" />
                </div>
              </th>
              <th 
                className="table-cell cursor-pointer hover:bg-gray-100 select-none"
                onClick={() => handleOrdenacao('nomeAluno')}
              >
                <div className="flex items-center gap-1">
                  Nome do Aluno
                  <IconeOrdenacao campo="nomeAluno" />
                </div>
              </th>
              <th 
                className="table-cell cursor-pointer hover:bg-gray-100 select-none"
                onClick={() => handleOrdenacao('turma')}
              >
                <div className="flex items-center gap-1">
                  Turma
                  <IconeOrdenacao campo="turma" />
                </div>
              </th>
              <th 
                className="table-cell cursor-pointer hover:bg-gray-100 select-none"
                onClick={() => handleOrdenacao('totalDiasComFalta')}
              >
                <div className="flex items-center gap-1">
                  Dias com Falta no Período
                  <IconeOrdenacao campo="totalDiasComFalta" />
                </div>
              </th>
              <th 
                className="table-cell cursor-pointer hover:bg-gray-100 select-none"
                onClick={() => handleOrdenacao('totalFaltas')}
              >
                <div className="flex items-center gap-1">
                  Aulas Perdidas
                  <IconeOrdenacao campo="totalFaltas" />
                </div>
              </th>
              <th 
                className="table-cell cursor-pointer hover:bg-gray-100 select-none"
                onClick={() => handleOrdenacao('status')}
              >
                <div className="flex items-center gap-1">
                  Status
                  <IconeOrdenacao campo="status" />
                </div>
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {dadosPaginados.map((item, index) => (
              <tr key={`${item.matricula}-${index}`} className="table-row">
                <td className="table-cell font-medium text-gray-900">{item.matricula}</td>
                <td className="table-cell font-medium text-gray-900">{item.nomeAluno}</td>
                <td className="table-cell text-gray-600">{item.classe || item.turma}</td>
                <td className="table-cell text-center">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                    {item.totalDiasComFalta || 0} dias
                  </span>
                </td>
                <td className="table-cell text-center">
                  <span className={`font-semibold ${(item.totalFaltas || 0) > 0 ? 'text-red-600' : 'text-green-600'}`}>
                    {item.totalFaltas || 0}
                  </span>
                </td>
                <td className="table-cell">
                  <div className={`flex items-center gap-1 ${
                    item.status === 'Atenção' ? 'text-red-600' :
                    item.status === 'Observação' ? 'text-yellow-600' :
                    item.status === 'Aceitável' ? 'text-green-600' :
                    'text-gray-600'
                  }`}>
                    {item.status === 'Atenção' && <AlertTriangle className="w-4 h-4" />}
                    {item.status === 'Observação' && <AlertTriangle className="w-4 h-4" />}
                    {item.status === 'Aceitável' && <CheckCircle className="w-4 h-4" />}
                    <span className="text-xs font-medium">{item.status || 'SEM DADOS'}</span>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Paginação */}
      {totalPaginas > 1 && (
        <div className="flex items-center justify-between bg-white px-4 py-3 border-t border-gray-200 sm:px-6">
          <div className="flex-1 flex justify-between sm:hidden">
            <button
              onClick={() => setPaginaAtual(Math.max(1, paginaAtual - 1))}
              disabled={paginaAtual === 1}
              className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
            >
              Anterior
            </button>
            <button
              onClick={() => setPaginaAtual(Math.min(totalPaginas, paginaAtual + 1))}
              disabled={paginaAtual === totalPaginas}
              className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
            >
              Próxima
            </button>
          </div>
          <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
            <div>
              <p className="text-sm text-gray-700">
                Mostrando <span className="font-medium">{indiceInicio + 1}</span> até{' '}
                <span className="font-medium">{Math.min(indiceFim, dados.length)}</span> de{' '}
                <span className="font-medium">{dados.length}</span> resultados
              </p>
            </div>
            <div>
              <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                <button
                  onClick={() => setPaginaAtual(Math.max(1, paginaAtual - 1))}
                  disabled={paginaAtual === 1}
                  className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                >
                  <ChevronUp className="h-5 w-5 rotate-[-90deg]" />
                </button>
                
                {Array.from({ length: Math.min(5, totalPaginas) }, (_, i) => {
                  const pagina = i + 1;
                  return (
                    <button
                      key={pagina}
                      onClick={() => setPaginaAtual(pagina)}
                      className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                        paginaAtual === pagina
                          ? 'z-10 bg-blue-50 border-blue-500 text-blue-600'
                          : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                      }`}
                    >
                      {pagina}
                    </button>
                  );
                })}
                
                <button
                  onClick={() => setPaginaAtual(Math.min(totalPaginas, paginaAtual + 1))}
                  disabled={paginaAtual === totalPaginas}
                  className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                >
                  <ChevronDown className="h-5 w-5 rotate-[-90deg]" />
                </button>
              </nav>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}