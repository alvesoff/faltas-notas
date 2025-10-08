'use client';

import { useState, useEffect } from 'react';
import Filtros from '@/components/Filtros';
import TabelaRelatorios from '@/components/TabelaRelatorios';
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
  const [filtros, setFiltros] = useState({
    anoLetivo: '2025',
    bimestre: '',
    turma: '',
    disciplina: '',
    aluno: '',
    tipo: 'faltas',
    tipoFalta: 'detalhadas'
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

  const buscarDados = async () => {
    setCarregando(true);
    try {
      const params = new URLSearchParams();
      Object.entries(filtros).forEach(([key, value]) => {
        if (value) params.append(key, value);
      });

      const response = await fetch(`/api/relatorios?${params.toString()}`);
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
      const response = await fetch('/api/export', {
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
        
        const timestamp = new Date().toISOString().split('T')[0];
        const filename = `relatorio_${filtros.tipo}_${filtros.anoLetivo}_${timestamp}.xlsx`;
        a.download = filename;
        
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      } else {
        const error = await response.json();
        console.error('Erro na exportação:', error);
        alert('Erro ao exportar dados. Tente novamente.');
      }
    } catch (error) {
      console.error('Erro na exportação:', error);
      alert('Erro ao exportar dados. Tente novamente.');
    } finally {
      setCarregando(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Componente de Filtros */}
      <Filtros 
        onFiltroChange={setFiltros}
        onExportar={handleExportar}
        carregando={carregando}
      />

      {/* Tabela de Relatórios */}
      <TabelaRelatorios 
        dados={dados}
        carregando={carregando}
        tipo={filtros.tipo as 'faltas' | 'notas'}
        tipoFalta={filtros.tipoFalta as 'detalhadas' | 'resumidas'}
      />
    </div>
  );
}