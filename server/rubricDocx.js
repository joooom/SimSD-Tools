import { Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell, AlignmentType, WidthType, VerticalAlign, TableLayoutType, BorderStyle } from 'docx';
import { EVALUATION_CRITERIA } from './evaluationCriteria.js';
import { DPO_QUESTION_IDS, DPO_QUESTIONS, GENERAL_RUBRIC_KEYS, rubricLabel, scoreConcept, scoreStars } from './rubricConfig.js';

const width = 9026;
const border = { style: BorderStyle.SINGLE, size: 4, color: 'B7B7B7' };
const borders = { top: border, bottom: border, left: border, right: border, insideHorizontal: border, insideVertical: border };
const paragraph = (text, { bold = false, center = false, size = 20, ...rest } = {}) => new Paragraph({
  alignment: center ? AlignmentType.CENTER : AlignmentType.LEFT,
  spacing: { after: 60, line: 230 }, ...rest,
  children: [new TextRun({ text, bold, size, font: 'Candara', color: '000000' })],
});
const cell = (text, index, widths, shaded, bold) => new TableCell({
  width: { size: widths[index], type: WidthType.DXA },
  verticalAlign: VerticalAlign.CENTER,
  margins: { top: 65, bottom: 65, left: 90, right: 90 },
  shading: shaded ? { fill: 'D9D9D9' } : undefined,
  children: [paragraph(text, { center: index > 0 || bold, bold })],
});
function table(headers, rows, widths, shadeLabels = false) {
  return new Table({ width: { size: width, type: WidthType.DXA }, columnWidths: widths, layout: TableLayoutType.FIXED, borders,
    rows: [new TableRow({ tableHeader: true, cantSplit: true, children: headers.map((text, i) => cell(text, i, widths, true, true)) }),
      ...rows.map(row => new TableRow({ cantSplit: true, children: row.map((text, i) => cell(text, i, widths, shadeLabels && i === 0, false)) }))],
  });
}
const conceptRow = (question, score) => [question, ...['A', 'B', 'C', 'D'].map(concept => scoreConcept(score) === concept ? 'X' : '')];

export async function buildRubricDocx(report) {
  const children = [];
  for (const committee of report.comites) {
    const key = committee.chave_comite;
    for (const delegation of committee.delegacoes) {
      children.push(paragraph('RUBRICA DE AVALIAÇÃO DAS DELEGAÇÕES', { bold: true, center: true, size: 24, pageBreakBefore: children.length > 0, keepNext: true }));
      children.push(paragraph(`${committee.nome_comite} — Sim SD 2026`, { bold: true, center: true, size: 24, keepNext: true }));
      children.push(paragraph(`${key === 'camara' ? 'Representação' : 'Delegação'}: ${delegation.nome}`, { bold: true, size: 24, spacing: { before: 140, after: 140 }, keepNext: true }));
      children.push(table(['Critério', 'Avaliação'], EVALUATION_CRITERIA.filter(criterion => Object.hasOwn(GENERAL_RUBRIC_KEYS, criterion.id)).map(criterion => [rubricLabel(criterion, key), scoreStars(delegation.ratings[criterion.id])]), [6800, width - 6800]));
      children.push(paragraph('SOBRE O DPO (Documento de Posição Oficial)', { bold: true, center: true, spacing: { before: 180, after: 70 }, keepNext: true }));
      children.push(paragraph('Em relação aos conteúdos, o documento responde adequadamente às questões norteadoras?', { center: true, keepNext: true }));
      const matrixWidths = [6426, 650, 650, 650, 650];
      children.push(table(['Critérios', 'A', 'B', 'C', 'D'], DPO_QUESTIONS[key].map((question, index) => conceptRow(question, delegation.ratings[DPO_QUESTION_IDS[index]])), matrixWidths, true));
      children.push(paragraph('Em relação à formatação e organização do DPO, de acordo com as orientações e exigências do Guia de Estudos.', { center: true, spacing: { before: 150, after: 70 }, keepNext: true }));
      children.push(table(['Critérios', 'A', 'B', 'C', 'D'], [conceptRow('O documento respeitou a estrutura do DPO explicada no guia de estudos?', delegation.ratings.dpoStructure)], matrixWidths, true));
      children.push(paragraph('Avaliação geral: 1 a 5 estrelas, conforme a nota. DPO: 1–2 = D; 3 = C; 4 = B; 5 = A. Campos sem marcação: não avaliados.', { size: 17, spacing: { before: 110, after: 100 } }));
      children.push(paragraph(`AVALIAÇÃO FINAL: ${delegation.avaliacao_final || 'Não preenchida'}`, { bold: true, size: 22, spacing: { before: 90, after: 0 } }));
    }
  }
  if (!children.length) throw Object.assign(new Error('Nenhuma delegação para gerar. Revise a seleção.'), { status: 400 });
  const doc = new Document({ creator: 'SimSD Tools', title: 'Rubricas de avaliação',
    styles: { default: { document: { run: { font: 'Candara', size: 20 }, paragraph: { spacing: { after: 80 } } } } },
    sections: [{ properties: { page: { size: { width: 11906, height: 16838 }, margin: { top: 900, bottom: 900, left: 1440, right: 1440 } } }, children }],
  });
  return Packer.toBuffer(doc);
}
