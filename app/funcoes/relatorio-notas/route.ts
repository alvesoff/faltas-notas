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

    let query = `
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
        nf.Nota as nota,
        nf.Falta as faltas,
        nf.Bim as bimestre,
        nf.DtInclusao as dataInclusao,
        CASE 
          WHEN nf.Nota >= 7 THEN 'Aprovado'
          WHEN nf.Nota >= 5 THEN 'Recuperação'
          ELSE 'Reprovado'
        END as situacao
      FROM NotasFaltas nf
      JOIN Alunos a ON nf.Mat = a.Mat
      JOIN Turmas t ON nf.Mat = t.Mat AND nf.AnoLetivo = t.AnoLetivo
      JOIN Classe1 c ON t.idClasse1 = c.idClasse1 AND t.AnoLetivo = c.AnoLetivo
      LEFT JOIN Cursos cur ON c.idCursos = cur.idCursos
      JOIN Disciplina1 d ON nf.Disc = d.Codigo AND nf.AnoLetivo = d.AnoLetivo
      WHERE nf.AnoLetivo = ?
    `;

    let params: any[] = [anoLetivo];

    if (bimestre) {
      query += ' AND nf.Bim = ?';
      params.push(bimestre);
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

    const results = await executeQuery(query, params);

    return NextResponse.json({
      success: true,
      data: results,
      total: Array.isArray(results) ? results.length : 0,
      tipo: 'notas',
      filtros: {
        anoLetivo,
        bimestre,
        turma,
        disciplina,
        aluno
      }
    });

  } catch (error) {
    console.error('Erro na API de relatório de notas:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Erro interno do servidor - Relatório de Notas',
        details: error instanceof Error ? error.message : 'Erro desconhecido'
      },
      { status: 500 }
    );
  }
}