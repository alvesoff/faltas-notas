import { NextRequest, NextResponse } from 'next/server';
import { executeQuery } from '@/lib/database';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const tipo = searchParams.get('tipo');

    let query = '';
    let results;

    switch (tipo) {
      case 'anos':
        query = 'SELECT DISTINCT AnoLetivo FROM NotasFaltas ORDER BY AnoLetivo DESC';
        results = await executeQuery(query);
        break;

      case 'turmas':
        const anoLetivo = searchParams.get('anoLetivo') || '2025';
        query = `
          SELECT DISTINCT 
            CASE 
              WHEN cur.Descricao IS NOT NULL AND cur.Descricao != 'Ens. Fund. 9 anos' 
              THEN CONCAT(cur.Descricao, ' - ', c.Turma)
              ELSE CONCAT(c.Serie, 'ª ', c.Turma)
            END as numero, 
            c.idClasse1 as classe,
            c.Serie,
            c.Turma,
            cur.Descricao as curso
          FROM Classe1 c 
          LEFT JOIN Cursos cur ON c.idCursos = cur.idCursos
          WHERE c.AnoLetivo = ? 
          ORDER BY c.idCursos, c.Serie, c.Turma
        `;
        results = await executeQuery(query, [anoLetivo]);
        break;

      case 'disciplinas':
        const ano = searchParams.get('anoLetivo') || '2025';
        query = `
          SELECT DISTINCT d.Codigo as codigo, d.Nome as nome
          FROM Disciplina1 d 
          WHERE d.AnoLetivo = ? 
          ORDER BY d.Nome
        `;
        results = await executeQuery(query, [ano]);
        break;

      case 'bimestres':
        query = 'SELECT DISTINCT Bim FROM NotasFaltas WHERE Bim IS NOT NULL ORDER BY Bim';
        results = await executeQuery(query);
        break;

      default:
        return NextResponse.json(
          { success: false, error: 'Tipo de filtro não especificado' },
          { status: 400 }
        );
    }

    return NextResponse.json({
      success: true,
      data: results
    });

  } catch (error) {
    console.error('Erro na API de filtros:', error);
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