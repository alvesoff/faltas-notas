import { NextRequest, NextResponse } from 'next/server';
import { executeQuery } from '@/lib/database';
import * as XLSX from 'xlsx';
import JSZip from 'jszip';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { anoLetivo, aluno, bimestre, turma, disciplina, dataInicio, dataFim } = body;

    if (!anoLetivo) {
      return NextResponse.json({
        success: false,
        error: 'Ano letivo é obrigatório'
      }, { status: 400 });
    }

    // Query atualizada para notas incluindo Disciplina e todos os filtros
    let query = `
      SELECT 
        nf.Mat as Matricula,
        a.Nome as Aluno,
        nf.AnoLetivo as 'Ano Letivo',
        CASE 
          WHEN cur.Descricao IS NOT NULL AND cur.Descricao != 'Ens. Fund. 9 anos' 
          THEN CONCAT(cur.Descricao, ' - ', c.Turma)
          ELSE CONCAT(c.Serie, 'ª ', c.Turma)
        END as Turma,
        d.Nome as Disciplina,
        nf.Nota as Nota,
        nf.Falta as Faltas,
        nf.Bim as Bimestre,
        CASE 
          WHEN nf.Nota < 6 THEN 'Reprovado'
          WHEN nf.Nota < 7 THEN 'Recuperação'
          ELSE 'Aprovado'
        END as Status,
        DATE_FORMAT(nf.DtInclusao, '%d/%m/%Y') as 'Data de Inclusão'
      FROM NotasFaltas nf
      JOIN Alunos a ON nf.Mat = a.Mat
      JOIN Turmas t ON nf.Mat = t.Mat AND nf.AnoLetivo = t.AnoLetivo
      JOIN Classe1 c ON t.idClasse1 = c.idClasse1 AND t.AnoLetivo = c.AnoLetivo
      LEFT JOIN Cursos cur ON c.idCursos = cur.idCursos
      JOIN Disciplina1 d ON nf.Disc = d.Codigo AND nf.AnoLetivo = d.AnoLetivo
      WHERE nf.AnoLetivo = ?
    `;

    const params = [anoLetivo];

    // Aplicar filtros adicionais
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

    if (dataInicio) {
      query += ' AND DATE(nf.DtInclusao) >= ?';
      params.push(dataInicio);
    }

    if (dataFim) {
      query += ' AND DATE(nf.DtInclusao) <= ?';
      params.push(dataFim);
    }

    query += ' ORDER BY a.Nome, nf.Bim';

    const results = await executeQuery(query, params);

    if (!results || !Array.isArray(results) || results.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'Nenhum dado encontrado para os filtros aplicados'
      }, { status: 404 });
    }

    // Criar workbook
    const workbook = XLSX.utils.book_new();
    const worksheet = XLSX.utils.json_to_sheet(results);

    // Aplicar estilos
    const range = XLSX.utils.decode_range(worksheet['!ref'] || 'A1');
    
    // Estilo para cabeçalho
    for (let col = range.s.c; col <= range.e.c; col++) {
      const cellAddress = XLSX.utils.encode_cell({ r: 0, c: col });
      if (!worksheet[cellAddress]) continue;
      
      worksheet[cellAddress].s = {
        font: { bold: true, color: { rgb: "FFFFFF" } },
        fill: { fgColor: { rgb: "4472C4" } },
        alignment: { horizontal: "center", vertical: "center" }
      };
    }

    // Ajustar largura das colunas
    const colWidths = [
      { wch: 12 }, // Matricula
      { wch: 30 }, // Aluno
      { wch: 12 }, // Ano Letivo
      { wch: 10 }, // Nota
      { wch: 10 }, // Faltas
      { wch: 12 }, // Bimestre
      { wch: 15 }, // Status
      { wch: 15 }  // Data de Inclusão
    ];
    worksheet['!cols'] = colWidths;

    // Adicionar filtros automáticos nas colunas
    if (worksheet['!ref']) {
      worksheet['!autofilter'] = { ref: worksheet['!ref'] };
    }

    const sheetName = 'Relatório de Notas';
    XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);

    // Gerar buffer do Excel
    const excelBuffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
    
    // Criar nome do arquivo
    const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-');
    const excelFilename = `Relatorio_Notas_${anoLetivo}_${timestamp}.xlsx`;

    return new NextResponse(new Uint8Array(excelBuffer), {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="${excelFilename}"`,
        'Content-Length': excelBuffer.length.toString(),
      },
    });

  } catch (error) {
    console.error('Erro ao exportar relatório de notas:', error);
    return NextResponse.json({
      success: false,
      error: 'Erro interno do servidor'
    }, { status: 500 });
  }
}