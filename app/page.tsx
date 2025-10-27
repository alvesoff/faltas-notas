'use client';

import { useState, useEffect } from 'react';
import FiltrosFaltas from '@/components/FiltrosFaltas';
import FiltrosNotas from '@/components/FiltrosNotas';
import TabelaFaltas from '@/components/TabelaFaltas';
import TabelaNotas from '@/components/TabelaNotas';
import { BookOpen, Users, AlertCircle } from 'lucide-react';

interface DadosRelatorio {
  matricula: string;
  nomeAluno: string;
  anoLetivo: string;
  classe: string;
  turma: string;
  disciplina: string;
  nota: number;
  faltas: number;
  atrasos: number;
  aulasDadas: number;
  bimestre: string;
  percentualFaltas: number;
}

export default function Home() {
  const [dados, setDados] = useState<DadosRelatorio[]>([]);
  const [carregando, setCarregando] = useState(false);
  const [tipoRelatorio, setTipoRelatorio] = useState<'faltas' | 'notas'>('faltas');
  
  // Função para obter data padrão (7 dias atrás)
  const getDataPadrao = () => {
    const hoje = new Date();
    const seteDiasAtras = new Date(hoje);
    seteDiasAtras.setDate(hoje.getDate() - 7);
    
    const ano = seteDiasAtras.getFullYear();
    const mes = String(seteDiasAtras.getMonth() + 1).padStart(2, '0');
    const dia = String(seteDiasAtras.getDate()).padStart(2, '0');
    
    return `${ano}-${mes}-${dia}`;
  };

  // Função para obter data atual
  const getDataAtual = () => {
    const hoje = new Date();
    
    const ano = hoje.getFullYear();
    const mes = String(hoje.getMonth() + 1).padStart(2, '0');
    const dia = String(hoje.getDate()).padStart(2, '0');
    
    return `${ano}-${mes}-${dia}`;
  };

  const [filtros, setFiltros] = useState({
    anoLetivo: new Date().getFullYear().toString(),
    bimestre: '',
    turma: '',
    disciplina: '',
    aluno: '',
    tipo: 'faltas',
    dataInicio: getDataPadrao(),
    dataFim: getDataAtual()
  });
  const [estatisticas, setEstatisticas] = useState({
    totalAlunos: 0,
    totalFaltas: 0,
    mediaNotas: 0,
    alunosComFaltasExcessivas: 0
  });

  useEffect(() => {
    buscarDados();
  }, [filtros]);

  const handleFiltroChange = (novosFiltros: any) => {
    setFiltros(novosFiltros);
    setTipoRelatorio(novosFiltros.tipo);
  };

  const buscarDados = async () => {
    setCarregando(true);
    try {
      const params = new URLSearchParams();
      Object.entries(filtros).forEach(([key, value]) => {
        if (value) params.append(key, value);
      });

      const endpoint = filtros.tipo === 'notas' ? '/funcoes/relatorio-notas' : '/funcoes/relatorio-faltas';
      const response = await fetch(`${endpoint}?${params.toString()}`);
      const result = await response.json();

      if (result.success) {
        setDados(result.data);
        calcularEstatisticas(result.data);
      } else {
        console.error('Erro ao buscar dados:', result.error);
        setDados([]);
      }
    } catch (error) {
      console.error('Erro na requisição:', error);
      setDados([]);
    } finally {
      setCarregando(false);
    }
  };

  const calcularEstatisticas = (dadosRelatorio: DadosRelatorio[]) => {
    if (dadosRelatorio.length === 0) {
      setEstatisticas({
        totalAlunos: 0,
        totalFaltas: 0,
        mediaNotas: 0,
        alunosComFaltasExcessivas: 0
      });
      return;
    }

    const alunosUnicos = new Set(dadosRelatorio.map(d => d.matricula));
    const totalFaltas = dadosRelatorio.reduce((sum, d) => sum + d.faltas, 0);
    const somaNotas = dadosRelatorio.reduce((sum, d) => sum + d.nota, 0);
    const mediaNotas = somaNotas / dadosRelatorio.length;
    const alunosComFaltasExcessivas = new Set(
      dadosRelatorio.filter(d => d.percentualFaltas >= 25).map(d => d.matricula)
    ).size;

    setEstatisticas({
      totalAlunos: alunosUnicos.size,
      totalFaltas,
      mediaNotas,
      alunosComFaltasExcessivas
    });
  };

  const handleExportar = async () => {
    setCarregando(true);
    try {
      // Determinar a rota baseada no tipo de relatório
      let endpoint = '';
      if (filtros.tipo === 'notas') {
        endpoint = '/funcoes/export/notas';
      } else if (filtros.tipo === 'faltas') {
        endpoint = '/funcoes/export/faltas';
      } else {
        throw new Error('Tipo de relatório não suportado');
      }

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(filtros),
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.style.display = 'none';
        a.href = url;
        
        const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-');
        const filename = filtros.tipo === 'notas' 
          ? `Relatorio_Notas_${filtros.anoLetivo}_${timestamp}.xlsx`
          : `Relatorio_Faltas_${filtros.anoLetivo}_${timestamp}.xlsx`;
        a.download = filename;
        
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      } else {
        // Tratamento melhorado para diferentes tipos de erro HTTP
        let errorMessage = 'Erro ao exportar dados.';
        
        if (response.status === 404) {
          errorMessage = 'API de exportação não encontrada. Verifique se o servidor está funcionando corretamente.';
        } else if (response.status === 405) {
          errorMessage = 'Método não permitido. A API pode não estar configurada corretamente no servidor.';
        } else if (response.status === 500) {
          errorMessage = 'Erro interno do servidor. Tente novamente em alguns minutos.';
        }

        try {
          // Tenta fazer parse do JSON apenas se o content-type for application/json
          const contentType = response.headers.get('content-type');
          if (contentType && contentType.includes('application/json')) {
            const error = await response.json();
            if (error.error) {
              errorMessage = error.error;
            }
          }
        } catch (jsonError) {
          // Se não conseguir fazer parse do JSON, usa a mensagem padrão baseada no status
          console.warn('Não foi possível fazer parse da resposta de erro como JSON:', jsonError);
        }

        console.error('Erro na exportação:', { status: response.status, statusText: response.statusText });
        alert(errorMessage);
      }
    } catch (error) {
      console.error('Erro na exportação:', error);
      let errorMessage = 'Erro de conexão. Verifique sua internet e tente novamente.';
      
      if (error instanceof TypeError && error.message.includes('fetch')) {
        errorMessage = 'Não foi possível conectar ao servidor. Verifique se o servidor está funcionando.';
      }
      
      alert(errorMessage);
    } finally {
      setCarregando(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Seletor de Tipo de Relatório */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <div className="flex items-center gap-4">
          <h2 className="text-lg font-semibold text-gray-800">Tipo de Relatório</h2>
          <div className="flex gap-2">
            <button
              onClick={() => setTipoRelatorio('faltas')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                tipoRelatorio === 'faltas'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Faltas
            </button>
            <button
              onClick={() => setTipoRelatorio('notas')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                tipoRelatorio === 'notas'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Notas
            </button>
          </div>
        </div>
      </div>

      {/* Componentes de Filtros baseados no tipo */}
      {tipoRelatorio === 'faltas' ? (
        <FiltrosFaltas 
          onFiltroChange={handleFiltroChange}
          onExportar={handleExportar}
          carregando={carregando}
        />
      ) : (
        <FiltrosNotas 
          onFiltroChange={handleFiltroChange}
          onExportar={handleExportar}
          carregando={carregando}
        />
      )}

      {/* Componentes de Tabela baseados no tipo */}
      {tipoRelatorio === 'faltas' ? (
        <TabelaFaltas 
          dados={dados}
          carregando={carregando}
        />
      ) : (
        <TabelaNotas 
          dados={dados}
          carregando={carregando}
        />
      )}
    </div>
  );
}