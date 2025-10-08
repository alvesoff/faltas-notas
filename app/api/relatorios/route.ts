import { NextRequest, NextResponse } from 'next/server';
import { executeQuery } from '@/lib/database';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const anoLetivo = searchParams.get('anoLetivo') || '2025';
    const bimestre = searchParams.get('bimestre');
    const turma = searchParams.get('turma');
    const disciplina = searchParams.get('disciplina');
    const aluno = searchParams.get('aluno');
    const tipo = searchParams.get('tipo') || 'faltas'; // 'faltas' ou 'notas'
    const tipoFalta = searchParams.get('tipoFalta') || 'detalhadas'; // 'detalhadas' ou 'resumidas'
    const dataInicio = searchParams.get('dataInicio');
    const dataFim = searchParams.get('dataFim');

    let query = '';
    let params: any[] = [];

    // Query para faltas resumidas - USANDO TABELA FREQUENCIA
    if (tipo === 'faltas' && tipoFalta === 'resumidas') {
      query = `
        SELECT 
          a.Mat as matricula,
          a.Nome as nomeAluno,
          CASE 
            WHEN cur.Descricao IS NOT NULL AND cur.Descricao != 'Ens. Fund. 9 anos' 
            THEN CONCAT(cur.Descricao, ' - ', c.Turma)
            ELSE CONCAT(c.Serie, 'ª ', c.Turma)
          END as turma,
          COUNT(DISTINCT f.data) as totalDiasComFalta,
          SUM(
            (CASE WHEN f.aula1 = 'A' THEN 1 ELSE 0 END) +
            (CASE WHEN f.aula2 = 'A' THEN 1 ELSE 0 END) +
            (CASE WHEN f.aula3 = 'A' THEN 1 ELSE 0 END) +
            (CASE WHEN f.aula4 = 'A' THEN 1 ELSE 0 END) +
            (CASE WHEN f.aula5 = 'A' THEN 1 ELSE 0 END) +
            (CASE WHEN f.aula6 = 'A' THEN 1 ELSE 0 END) +
            (CASE WHEN f.aula7 = 'A' THEN 1 ELSE 0 END) +
            (CASE WHEN f.aula8 = 'A' THEN 1 ELSE 0 END) +
            (CASE WHEN f.aula9 = 'A' THEN 1 ELSE 0 END) +
            (CASE WHEN f.aula10 = 'A' THEN 1 ELSE 0 END)
          ) as totalFaltas,
          CASE 
            WHEN COUNT(DISTINCT f.data) >= 25 THEN 'Atenção'
            WHEN COUNT(DISTINCT f.data) >= 15 THEN 'Observação'
            ELSE 'Aceitável'
          END as status
        FROM Frequencia f
        JOIN Alunos a ON f.matricula_aluno = a.Mat
        JOIN Turmas t ON f.matricula_aluno = t.Mat AND f.ano_letivo = t.AnoLetivo
        JOIN Classe1 c ON t.idClasse1 = c.idClasse1 AND t.AnoLetivo = c.AnoLetivo
        LEFT JOIN Cursos cur ON c.idCursos = cur.idCursos
        WHERE f.ano_letivo = ? 
        AND (f.aula1 = 'A' OR f.aula2 = 'A' OR f.aula3 = 'A' OR f.aula4 = 'A' OR f.aula5 = 'A' OR 
             f.aula6 = 'A' OR f.aula7 = 'A' OR f.aula8 = 'A' OR f.aula9 = 'A' OR f.aula10 = 'A')
      `;
      
      params = [anoLetivo];
      
      // Filtros de data para faltas resumidas
      if (dataInicio) {
        query += ' AND f.data >= ?';
        params.push(dataInicio);
      }
      
      if (dataFim) {
        query += ' AND f.data <= ?';
        params.push(dataFim);
      }
      
      if (turma) {
        query += ' AND c.idClasse1 = ?';
        params.push(turma);
      }
      
      if (aluno) {
        query += ' AND (a.Nome LIKE ? OR a.Mat = ?)';
        params.push(`%${aluno}%`, aluno);
      }
      
      query += ' GROUP BY a.Mat, a.Nome, c.Serie, c.Turma ORDER BY a.Nome';
      
    } else {
      // Query original para faltas detalhadas e notas
      query = `
        SELECT 
          a.Mat as matricula,
          a.Nome as nomeAluno,
          c.AnoLetivo as anoLetivo,
          CASE 
            WHEN cur.Descricao IS NOT NULL AND cur.Descricao != 'Ens. Fund. 9 anos' 
            THEN CONCAT(cur.Descricao, ' - ', c.Turma)
            ELSE CONCAT(c.Serie, 'ª ', c.Turma)
          END as classe,
          c.idClasse1 as turma,
          d.Nome as disciplina,
          ${tipo === 'notas' ? 'nf.Nota as nota,' : ''}
          nf.Falta as faltas,
          nf.Bim as bimestre,
          nf.DtInclusao as dataInclusao
        FROM NotasFaltas nf
        JOIN Alunos a ON nf.Mat = a.Mat
        JOIN Turmas t ON nf.Mat = t.Mat AND nf.AnoLetivo = t.AnoLetivo
        JOIN Classe1 c ON t.idClasse1 = c.idClasse1 AND t.AnoLetivo = c.AnoLetivo
        LEFT JOIN Cursos cur ON c.idCursos = cur.idCursos
        JOIN Disciplina1 d ON nf.Disc = d.Codigo AND nf.AnoLetivo = d.AnoLetivo
        WHERE nf.AnoLetivo = ?
      `;

      params = [anoLetivo];

      // Filtros específicos para relatório de notas
      if (tipo === 'notas') {
        if (bimestre) {
          query += ' AND nf.Bim = ?';
          params.push(bimestre);
        }
      }

      // Filtros específicos para relatório de faltas detalhadas
      if (tipo === 'faltas') {
        query += ' AND nf.Falta > 0';
        
        // Filtros de data para faltas
        if (dataInicio) {
          query += ' AND DATE(nf.DtInclusao) >= ?';
          params.push(dataInicio);
        }
        
        if (dataFim) {
          query += ' AND DATE(nf.DtInclusao) <= ?';
          params.push(dataFim);
        }
      }

      if (turma) {
        query += ' AND c.idClasse1 = ?';
        params.push(turma);
      }

      if (disciplina) {
        query += ' AND d.Codigo = ?';
        params.push(disciplina);
      }

      if (aluno) {
        query += ' AND (a.Nome LIKE ? OR a.Mat = ?)';
        params.push(`%${aluno}%`, aluno);
      }

      query += ' ORDER BY a.Nome, d.Nome, nf.Bim';
    }

    const results = await executeQuery(query, params);

    return NextResponse.json({
      success: true,
      data: results,
      total: Array.isArray(results) ? results.length : 0,
      filtros: {
        anoLetivo,
        bimestre,
        turma,
        disciplina,
        aluno,
        tipo,
        tipoFalta,
        dataInicio,
        dataFim
      }
    });

  } catch (error) {
    console.error('Erro na API de relatórios:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Erro interno do servidor',
        details: error instanceof Error ? error.message : 'Erro desconhecido'
      },
      { status: 500 }
    );
  }
}