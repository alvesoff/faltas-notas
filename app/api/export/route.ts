import { NextRequest, NextResponse } from 'next/server';
import { executeQuery } from '@/lib/database';
import * as XLSX from 'xlsx';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      anoLetivo = '2025', 
      bimestre, 
      turma, 
      disciplina, 
      aluno, 
      tipo = 'faltas',
      tipoFalta = 'detalhadas',
      dataInicio,
      dataFim
    } = body;

    let query = '';
    let params: any[] = [anoLetivo];
    let sheetName = '';

    // Query para faltas resumidas
    if (tipo === 'faltas' && tipoFalta === 'resumidas') {
      query = `
        SELECT 
          a.Mat as 'Matrícula',
          a.Nome as 'Nome do Aluno',
          CASE 
            WHEN cur.Descricao IS NOT NULL AND cur.Descricao != 'Ens. Fund. 9 anos' 
            THEN CONCAT(cur.Descricao, ' - ', c.Turma)
            ELSE CONCAT(c.Serie, 'ª ', c.Turma)
          END as 'Turma',
          COUNT(DISTINCT DATE(nf.DtInclusao)) as 'Dias com Falta no Período',
          SUM(nf.Falta) as 'Aulas Perdidas',
          CASE 
            WHEN (SUM(nf.Falta) / NULLIF(SUM(nf.AulasDadas), 0)) * 100 >= 25 THEN 'Atenção'
            WHEN (SUM(nf.Falta) / NULLIF(SUM(nf.AulasDadas), 0)) * 100 >= 15 THEN 'Observação'
            ELSE 'Aceitável'
          END as 'Status'
        FROM NotasFaltas nf
        JOIN Alunos a ON nf.Mat = a.Mat
        JOIN Turmas t ON nf.Mat = t.Mat AND nf.AnoLetivo = t.AnoLetivo
        JOIN Classe1 c ON t.idClasse1 = c.idClasse1 AND t.AnoLetivo = c.AnoLetivo
        LEFT JOIN Cursos cur ON c.idCursos = cur.idCursos
        WHERE nf.AnoLetivo = ? AND nf.Falta > 0
      `;
      sheetName = 'Faltas Resumidas';
    } else {
      // Query para faltas detalhadas e notas
      query = `
        SELECT 
          a.Mat as 'Matrícula',
          a.Nome as 'Nome do Aluno',
          c.AnoLetivo as 'Ano Letivo',
          CASE 
            WHEN cur.Descricao IS NOT NULL AND cur.Descricao != 'Ens. Fund. 9 anos' 
            THEN CONCAT(cur.Descricao, ' - ', c.Turma)
            ELSE CONCAT(c.Serie, 'ª ', c.Turma)
          END as 'Turma',
          d.Nome as 'Disciplina',
          ${tipo === 'notas' ? "nf.Nota as 'Nota'," : ''}
          nf.Falta as 'Faltas',
          nf.Bim as 'Bimestre',
          ${tipo === 'notas' ? `
          CASE 
            WHEN nf.Nota < 6 THEN 'Reprovado'
            WHEN nf.Nota < 7 THEN 'Recuperação'
            ELSE 'Aprovado'
          END as 'Status',` : ''}
          DATE_FORMAT(nf.DtInclusao, '%d/%m/%Y') as 'Data de Inclusão'
        FROM NotasFaltas nf
        JOIN Alunos a ON nf.Mat = a.Mat
        JOIN Turmas t ON nf.Mat = t.Mat AND nf.AnoLetivo = t.AnoLetivo
        JOIN Classe1 c ON t.idClasse1 = c.idClasse1 AND t.AnoLetivo = c.AnoLetivo
        LEFT JOIN Cursos cur ON c.idCursos = cur.idCursos
        JOIN Disciplina1 d ON nf.Disc = d.Codigo AND nf.AnoLetivo = d.AnoLetivo
        WHERE nf.AnoLetivo = ?
      `;
      sheetName = tipo === 'faltas' ? 'Faltas Detalhadas' : 'Relatório de Notas';
    }

    // Filtros específicos para relatório de notas
    if (tipo === 'notas') {
      if (bimestre) {
        query += ' AND nf.Bim = ?';
        params.push(bimestre);
      }
    }

    // Filtros específicos para relatório de faltas detalhadas
    if (tipo === 'faltas' && tipoFalta === 'detalhadas') {
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

    // Filtros de data para faltas resumidas
    if (tipo === 'faltas' && tipoFalta === 'resumidas') {
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

    if (disciplina && tipo !== 'faltas' || (tipo === 'faltas' && tipoFalta === 'detalhadas')) {
      query += ' AND d.Codigo = ?';
      params.push(disciplina);
    }

    if (aluno) {
      query += ' AND (a.Nome LIKE ? OR a.Mat = ?)';
      params.push(`%${aluno}%`, aluno);
    }

    // Ordenação e agrupamento
    if (tipo === 'faltas' && tipoFalta === 'resumidas') {
      query += ' GROUP BY a.Mat, a.Nome, c.Serie, c.Turma ORDER BY a.Nome';
    } else {
      query += ' ORDER BY a.Nome, d.Nome, nf.Bim';
    }

    const results = await executeQuery(query, params);

    if (!results || !Array.isArray(results) || results.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'Nenhum dado encontrado para os filtros aplicados'
      }, { status: 404 });
    }

    // Criar workbook do Excel
    const workbook = XLSX.utils.book_new();
    const worksheet = XLSX.utils.json_to_sheet(results);
    
    // Configurar formatação da tabela
    const range = XLSX.utils.decode_range(worksheet['!ref'] || 'A1');
    
    // Aplicar formatação de tabela do Excel
    if (worksheet['!ref']) {
      worksheet['!autofilter'] = { ref: worksheet['!ref'] };
    }
    
    // Configurar largura das colunas automaticamente
    const colWidths: any[] = [];
    const headers = Object.keys(results[0] || {});
    
    headers.forEach((header, index) => {
      let maxWidth = header.length;
      results.forEach((row: any) => {
        const cellValue = String(row[header] || '');
        if (cellValue.length > maxWidth) {
          maxWidth = cellValue.length;
        }
      });
      // Limitar largura máxima e mínima
      colWidths.push({ wch: Math.min(Math.max(maxWidth + 2, 10), 50) });
    });
    
    worksheet['!cols'] = colWidths;
    
    // Aplicar estilo aos cabeçalhos
    for (let col = 0; col <= range.e.c; col++) {
      const cellAddress = XLSX.utils.encode_cell({ r: 0, c: col });
      if (!worksheet[cellAddress]) continue;
      
      worksheet[cellAddress].s = {
        font: { bold: true, color: { rgb: "FFFFFF" } },
        fill: { fgColor: { rgb: "366092" } },
        alignment: { horizontal: "center", vertical: "center" },
        border: {
          top: { style: "thin", color: { rgb: "000000" } },
          bottom: { style: "thin", color: { rgb: "000000" } },
          left: { style: "thin", color: { rgb: "000000" } },
          right: { style: "thin", color: { rgb: "000000" } }
        }
      };
    }
    
    // Aplicar bordas e alinhamento às células de dados
    for (let row = 1; row <= range.e.r; row++) {
      for (let col = 0; col <= range.e.c; col++) {
        const cellAddress = XLSX.utils.encode_cell({ r: row, c: col });
        if (!worksheet[cellAddress]) continue;
        
        worksheet[cellAddress].s = {
          alignment: { horizontal: "left", vertical: "center" },
          border: {
            top: { style: "thin", color: { rgb: "CCCCCC" } },
            bottom: { style: "thin", color: { rgb: "CCCCCC" } },
            left: { style: "thin", color: { rgb: "CCCCCC" } },
            right: { style: "thin", color: { rgb: "CCCCCC" } }
          }
        };
        
        // Aplicar cores alternadas nas linhas
        if (row % 2 === 0) {
          worksheet[cellAddress].s.fill = { fgColor: { rgb: "F8F9FA" } };
        }
      }
    }
    
    // Usar o nome da planilha definido anteriormente
    XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);

    // Gerar arquivo Excel
    const excelBuffer = XLSX.write(workbook, { 
      bookType: 'xlsx', 
      type: 'buffer' 
    });

    // Gerar nome do arquivo com timestamp
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
    const filename = `${sheetName.replace(/\s+/g, '_')}_${timestamp}.xlsx`;

    return new NextResponse(excelBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Content-Length': excelBuffer.length.toString(),
      },
    });

  } catch (error) {
    console.error('Erro ao gerar arquivo Excel:', error);
    return NextResponse.json({
      success: false,
      error: 'Erro ao gerar arquivo Excel',
      details: error instanceof Error ? error.message : 'Erro desconhecido'
    }, { status: 500 });
  }
}