import { NextRequest, NextResponse } from 'next/server';
import { executeQuery } from '@/lib/database';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const tipo = searchParams.get('tipo');
    const anoLetivo = searchParams.get('anoLetivo') || '2025';

    let query = '';
    let params: any[] = [];

    switch (tipo) {
      case 'anos':
        // Para faltas, buscar anos tanto da tabela NotasFaltas quanto da Frequencia
        query = `
          SELECT DISTINCT AnoLetivo FROM NotasFaltas WHERE Falta > 0
          UNION
          SELECT DISTINCT ano_letivo as AnoLetivo FROM Frequencia
          ORDER BY AnoLetivo DESC
        `;
        break;

      case 'turmas':
        query = `
          SELECT DISTINCT 
            c.idClasse1 as numero,
            CASE 
              WHEN cur.Descricao IS NOT NULL AND cur.Descricao != 'Ens. Fund. 9 anos' 
              THEN CONCAT(cur.Descricao, ' - ', c.Turma)
              WHEN c.Serie = 0 AND c.Turma IN ('A', 'B', 'C')
              THEN CONCAT('Pré I - ', c.Turma)
              WHEN c.Serie = 1 AND cur.Descricao LIKE '%Pré%'
              THEN CONCAT('Pré II - ', c.Turma)
              WHEN c.Serie >= 1 AND c.Serie <= 9 AND c.Turma IN ('A', 'B', 'C', 'D', 'E')
              THEN CONCAT(c.Serie, 'º - ', c.Turma)
              ELSE CONCAT(c.Serie, 'ª ', c.Turma)
            END as classe,
            c.Serie as serie,
            c.Turma as turma
          FROM (
            SELECT DISTINCT Mat, AnoLetivo FROM NotasFaltas WHERE Falta > 0 AND AnoLetivo = ?
            UNION
            SELECT DISTINCT matricula_aluno as Mat, ano_letivo as AnoLetivo FROM Frequencia WHERE ano_letivo = ?
          ) dados
          JOIN Turmas t ON dados.Mat = t.Mat AND dados.AnoLetivo = t.AnoLetivo
          JOIN Classe1 c ON t.idClasse1 = c.idClasse1 AND t.AnoLetivo = c.AnoLetivo
          LEFT JOIN Cursos cur ON c.idCursos = cur.idCursos
          ORDER BY 
            CASE 
              WHEN c.Serie = 0 THEN CONCAT('01-', c.Turma)
              WHEN c.Serie = 1 AND cur.Descricao LIKE '%Pré%' THEN CONCAT('02-', c.Turma)
              WHEN c.Serie >= 1 AND c.Serie <= 9 THEN CONCAT(LPAD(c.Serie + 2, 2, '0'), '-', c.Turma)
              ELSE CONCAT(LPAD(c.Serie + 10, 2, '0'), '-', c.Turma)
            END
        `;
        params = [anoLetivo, anoLetivo];
        break;

      case 'disciplinas':
        query = `
          SELECT DISTINCT 
            d.Codigo as codigo,
            d.Nome as nome
          FROM NotasFaltas nf
          JOIN Disciplina1 d ON nf.Disc = d.Codigo AND nf.AnoLetivo = d.AnoLetivo
          WHERE nf.AnoLetivo = ? AND nf.Falta > 0
          ORDER BY d.Nome
        `;
        params = [anoLetivo];
        break;

      default:
        return NextResponse.json(
          { success: false, error: 'Tipo de filtro não suportado para relatório de faltas' },
          { status: 400 }
        );
    }

    const results = await executeQuery(query, params);

    return NextResponse.json({
      success: true,
      data: results,
      tipo: 'relatorio-faltas'
    });

  } catch (error) {
    console.error('Erro na API de filtros - Relatório de Faltas:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Erro interno do servidor - Filtros Relatório de Faltas',
        details: error instanceof Error ? error.message : 'Erro desconhecido'
      },
      { status: 500 }
    );
  }
}