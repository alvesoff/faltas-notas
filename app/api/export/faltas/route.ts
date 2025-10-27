import { NextRequest, NextResponse } from 'next/server';
import { executeQuery } from '@/lib/database';
import * as XLSX from 'xlsx';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { anoLetivo, tipoFalta = 'detalhadas', aluno, disciplina, turma, dataInicio, dataFim } = body;

    if (!anoLetivo) {
      return NextResponse.json({
        success: false,
        error: 'Ano letivo é obrigatório'
      }, { status: 400 });
    }

    let query = '';
    let params: any[] = [];
    let results: any[];

    if (tipoFalta === 'resumidas') {
      // Query para faltas resumidas (baseada na rota de relatórios)
      query = `
        SELECT 
          a.Mat as Matricula,
          a.Nome as Aluno,
          CASE 
            WHEN cur.Descricao IS NOT NULL AND cur.Descricao != 'Ens. Fund. 9 anos' 
            THEN CONCAT(cur.Descricao, ' - ', c.Turma)
            ELSE CONCAT(c.Serie, 'ª ', c.Turma)
          END as Turma,
          COUNT(DISTINCT f.data) as 'Dias com Falta',
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
          ) as 'Aulas Perdidas',
          CASE 
            WHEN COUNT(DISTINCT f.data) >= 25 THEN 'Atenção'
            WHEN COUNT(DISTINCT f.data) >= 15 THEN 'Observação'
            ELSE 'Aceitável'
          END as Status
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
      // Query para faltas detalhadas (baseada na rota de relatórios)
      query = `
        SELECT 
          a.Mat as Matricula,
          a.Nome as Aluno,
          CASE 
            WHEN cur.Descricao IS NOT NULL AND cur.Descricao != 'Ens. Fund. 9 anos' 
            THEN CONCAT(cur.Descricao, ' - ', c.Turma)
            ELSE CONCAT(c.Serie, 'ª ', c.Turma)
          END as Turma,
          d.Nome as Disciplina,
          nf.Falta as Faltas,
          nf.Bim as Bimestre,
          DATE_FORMAT(nf.DtInclusao, '%d/%m/%Y') as 'Data de Inclusão'
        FROM NotasFaltas nf
        JOIN Alunos a ON nf.Mat = a.Mat
        JOIN Turmas t ON nf.Mat = t.Mat AND nf.AnoLetivo = t.AnoLetivo
        JOIN Classe1 c ON t.idClasse1 = c.idClasse1 AND t.AnoLetivo = c.AnoLetivo
        LEFT JOIN Cursos cur ON c.idCursos = cur.idCursos
        JOIN Disciplina1 d ON nf.Disc = d.Codigo AND nf.AnoLetivo = d.AnoLetivo
        WHERE nf.AnoLetivo = ? AND nf.Falta > 0
      `;

      params = [anoLetivo];

      // Filtros de data para faltas detalhadas
      if (dataInicio) {
        query += ' AND DATE(nf.DtInclusao) >= ?';
        params.push(dataInicio);
      }
      
      if (dataFim) {
        query += ' AND DATE(nf.DtInclusao) <= ?';
        params.push(dataFim);
      }

      if (turma) {
        query += ' AND c.idClasse1 = ?';
        params.push(turma);
      }

      if (disciplina) {
        query += ' AND nf.Disc = ?';
        params.push(disciplina);
      }

      if (aluno) {
        query += ' AND (a.Nome LIKE ? OR a.Mat = ?)';
        params.push(`%${aluno}%`, aluno);
      }

      query += ' ORDER BY a.Nome, d.Nome, nf.Bim';
    }

    // Executar query
    results = await executeQuery(query, params) as any[];

    if (!results || !Array.isArray(results) || results.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'Nenhum dado encontrado para os filtros especificados'
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

    // Ajustar largura das colunas baseado no tipo de falta
    let colWidths;
    if (tipoFalta === 'resumidas') {
      colWidths = [
        { wch: 12 }, // Matricula
        { wch: 30 }, // Aluno
        { wch: 20 }, // Turma
        { wch: 15 }, // Dias com Falta
        { wch: 15 }, // Aulas Perdidas
        { wch: 15 }  // Status
      ];
    } else {
      colWidths = [
        { wch: 12 }, // Matricula
        { wch: 30 }, // Aluno
        { wch: 20 }, // Turma
        { wch: 25 }, // Disciplina
        { wch: 10 }, // Faltas
        { wch: 12 }, // Bimestre
        { wch: 15 }  // Data de Inclusão
      ];
    }
    worksheet['!cols'] = colWidths;

    // Adicionar filtros automáticos nas colunas
    if (worksheet['!ref']) {
      worksheet['!autofilter'] = { ref: worksheet['!ref'] };
    }

    // Adicionar worksheet ao workbook
    const sheetName = tipoFalta === 'resumidas' ? 'Faltas Resumidas' : 'Faltas Detalhadas';
    XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);

    // Gerar buffer do Excel
    const excelBuffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
    
    // Criar nome do arquivo
    const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-');
    const tipoTexto = tipoFalta === 'resumidas' ? 'Resumidas' : 'Detalhadas';
    const excelFilename = `Relatorio_Faltas_${tipoTexto}_${anoLetivo}_${timestamp}.xlsx`;

    return new NextResponse(new Uint8Array(excelBuffer), {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="${excelFilename}"`,
        'Content-Length': excelBuffer.length.toString(),
      },
    });

  } catch (error) {
    console.error('Erro ao exportar relatório de faltas:', error);
    return NextResponse.json({
      success: false,
      error: 'Erro interno do servidor'
    }, { status: 500 });
  }
}