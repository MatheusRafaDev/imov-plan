import ExcelJS from "exceljs";
import { getBrasiliaToday } from "@/utils/dates";
import { formatCurrency, formatPercent } from "@/utils/formatters";
import { extractSimulacaoSummary, extractParticipantesSummary } from "@/utils/simulacaoSelectors";
import type { BackendSimulacaoResult, BackendDetalheMensal } from "@/types/simulacao";

export interface ExportPessoa {
  id: string;
  nome: string;
  renda?: number;
  aporteMensal?: number;
  valorInicial?: number;
}

export interface ExportAporteExtra {
  mes?: number;
  data?: string;
  valor: number;
  tipo?: "aporte" | "retirada";
  motivo?: string;
  origem?: string;
  pessoaNome?: string;
}

export interface ExportPlanOptions {
  objetivo?: any;
  pessoas?: ExportPessoa[];
  backendData?: BackendSimulacaoResult | null;
  cenario?: string;
  aportesExtras?: ExportAporteExtra[];
  showFinancials?: boolean;
}

export interface DisplayRowData {
  mes: number;
  mesLabel: string;
  data: string;
  dataFormatada: string;
  aporteRegular: number;
  aportesExtras: number;
  retiradas: number;
  aporteLiquidoMes: number;
  rendimentoLiquido: number;
  saldoAcumulado: number;
  atingiu: boolean;
  isZero: boolean;
  aporteFinalPorPessoa: Record<string, number>;
  saldoPorPessoa: Record<string, number>;
}

export function buildExportRows(
  detalhesMensais: BackendDetalheMensal[],
  pessoas: ExportPessoa[],
  mesesParaAtingir?: number,
  atingiuMeta?: boolean
): DisplayRowData[] {
  if (!detalhesMensais || !detalhesMensais.length) return [];

  return detalhesMensais.map((r) => {
    const parts = r.participantes || [];
    const aporteFinalPorPessoa: Record<string, number> = {};
    const saldoPorPessoa: Record<string, number> = {};

    pessoas.forEach((p, idx) => {
      let match = parts.find((part) => (part.participanteId || (part as any).id) === p.id);
      if (!match && p.nome) {
        match = parts.find((part) => part.nome && part.nome.trim().toLowerCase() === p.nome.trim().toLowerCase());
      }
      if (!match && parts.length === 1 && pessoas.length === 1) {
        match = parts[0];
      }
      if (!match && parts[idx]) {
        match = parts[idx];
      }

      if (match) {
        aporteFinalPorPessoa[p.id] = match.aporteMensal;
        saldoPorPessoa[p.id] = match.saldo;
      } else {
        aporteFinalPorPessoa[p.id] = 0;
        saldoPorPessoa[p.id] = 0;
      }
    });

    parts.forEach((part) => {
      if (saldoPorPessoa[part.participanteId] === undefined) {
        saldoPorPessoa[part.participanteId] = part.saldo;
        aporteFinalPorPessoa[part.participanteId] = part.aporteMensal;
      }
    });

    const isZero = r.mes === 0;
    const aporteLiquidoMes = r.aporteMensal + r.aportesExtras - (r.retiradas || 0);

    let dataFormatada = "";
    try {
      const d = new Date(r.dataReferencia);
      dataFormatada = d.toLocaleDateString("pt-BR", { month: "short", year: "2-digit", timeZone: "UTC" }).replace(" de ", " ");
      dataFormatada = dataFormatada.charAt(0).toUpperCase() + dataFormatada.slice(1);
    } catch {
      dataFormatada = r.dataReferencia || "";
    }

    return {
      mes: r.mes,
      mesLabel: isZero ? "Início" : `Mês ${r.mes}`,
      data: r.dataReferencia,
      dataFormatada,
      aporteRegular: r.aporteMensal,
      aportesExtras: r.aportesExtras,
      retiradas: r.retiradas || 0,
      aporteLiquidoMes,
      rendimentoLiquido: r.rendimentoLiquido,
      saldoAcumulado: r.totalAcumulado,
      atingiu: Boolean(atingiuMeta && mesesParaAtingir === r.mes),
      isZero,
      aporteFinalPorPessoa,
      saldoPorPessoa,
    };
  });
}

function autoFitColumns(worksheet: ExcelJS.Worksheet, minWidth = 12, maxWidth = 40) {
  worksheet.columns.forEach((column) => {
    let maxLength = 0;
    if (column.eachCell) {
      column.eachCell({ includeEmpty: false }, (cell) => {
        const cellValue = cell.value;
        if (cellValue !== null && cellValue !== undefined) {
          let str = "";
          if (typeof cellValue === "object") {
            if ("result" in cellValue) str = String(cellValue.result || "");
            else if ("text" in cellValue) str = String(cellValue.text || "");
            else str = String(cellValue);
          } else {
            str = String(cellValue);
          }
          if (str.length > maxLength) {
            maxLength = str.length;
          }
        }
      });
    }
    column.width = Math.max(minWidth, Math.min(maxWidth, maxLength + 4));
  });
}

const BRL_FORMAT = '"R$" #,##0.00;[Red]-"R$" #,##0.00;"R$" 0.00';
const PERCENT_FORMAT = "0.0%";

export async function exportPlanToExcel(options: ExportPlanOptions): Promise<void> {
  const {
    objetivo = {},
    pessoas = [],
    backendData,
    cenario = "entrada",
    aportesExtras = [],
    showFinancials = true,
  } = options;

  if (!backendData || !backendData.detalhesMensais?.length) {
    throw new Error("Não há dados de simulação disponíveis para exportar.");
  }

  const summary = extractSimulacaoSummary(backendData);
  const participantes = extractParticipantesSummary(backendData);
  const displayRows = buildExportRows(
    backendData.detalhesMensais,
    pessoas,
    backendData.mesesParaAtingir,
    backendData.atingiuMeta
  );

  const workbook = new ExcelJS.Workbook();
  workbook.creator = "ImovPlan";
  workbook.lastModifiedBy = "ImovPlan";
  workbook.created = new Date();
  workbook.modified = new Date();

  const hoje = getBrasiliaToday();
  const dataHojeStr = `${String(hoje.dia).padStart(2, "0")}/${String(hoje.mes).padStart(2, "0")}/${hoje.ano}`;

  // ──────────────────────────────────────────────────────────────────────────
  // ABA 1: RESUMO DO PLANO
  // ──────────────────────────────────────────────────────────────────────────
  const wsResumo = workbook.addWorksheet("Resumo do Plano", {
    views: [{ showGridLines: true }],
  });

  // Título e Banner
  wsResumo.mergeCells("A1:F1");
  const bannerCell = wsResumo.getCell("A1");
  bannerCell.value = "IMOV-PLAN • Planejamento Imobiliário";
  bannerCell.fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "FF0F172A" }, // Slate 900
  };
  bannerCell.font = { name: "Calibri", size: 16, bold: true, color: { argb: "FFFFFFFF" } };
  bannerCell.alignment = { vertical: "middle", horizontal: "center" };
  wsResumo.getRow(1).height = 38;

  wsResumo.mergeCells("A2:F2");
  const subBanner = wsResumo.getCell("A2");
  subBanner.value = `Relatório Financeiro Consolidado • Emitido em ${dataHojeStr}`;
  subBanner.fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "FF1E293B" }, // Slate 800
  };
  subBanner.font = { name: "Calibri", size: 10, italic: true, color: { argb: "FFE2E8F0" } };
  subBanner.alignment = { vertical: "middle", horizontal: "center" };
  wsResumo.getRow(2).height = 22;

  // 1. OBJETIVO DO IMÓVEL
  wsResumo.mergeCells("A4:F4");
  const sec1 = wsResumo.getCell("A4");
  sec1.value = "1. OBJETIVO DO IMÓVEL & PARÂMETROS";
  sec1.fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "FFDF5B17" }, // Brand Terracotta Accent
  };
  sec1.font = { name: "Calibri", size: 11, bold: true, color: { argb: "FFFFFFFF" } };
  sec1.alignment = { vertical: "middle", indent: 1 };
  wsResumo.getRow(4).height = 25;

  const cenarioLabels: Record<string, string> = {
    entrada: "Juntar Valor da Entrada",
    a_vista: "Comprar Imóvel à Vista",
    financiamento: "Planejamento de Financiamento",
    aluguel: "Aluguel vs Compra",
  };

  const valorImovel = Number(objetivo.valorImovel) || 0;
  const percEntrada = Number(objetivo.percentualEntrada) || 20;
  const percCustos = Number(objetivo.percentualCustosExtras) || 0;
  const valorEntrada = (valorImovel * percEntrada) / 100;
  const valorCustos = (valorImovel * percCustos) / 100;
  const metaTotal = summary?.totalNecessario || valorEntrada + valorCustos;
  const valorJaGuardado = Number(backendData.valorJaGuardado) || Number(objetivo.valorJaGuardado) || 0;
  const taxaCdi = Number(objetivo.taxaCdiAnual) || 10.5;

  const paramRows = [
    [
      "Meta Total de Compra",
      metaTotal,
      BRL_FORMAT,
      "Cenário Escolhido",
      cenarioLabels[cenario] || cenario,
    ],
    [
      "Valor do Imóvel",
      valorImovel,
      BRL_FORMAT,
      "Entrada Desejada",
      `${percEntrada}% (${formatCurrency(valorEntrada)})`,
    ],
    [
      "Custos Extras (ITBI/Cartório)",
      valorCustos,
      BRL_FORMAT,
      "Percentual Custos",
      `${percCustos}%`,
    ],
    [
      "Valor Inicial Já Guardado",
      valorJaGuardado,
      BRL_FORMAT,
      "Taxa CDI Estimada",
      `${taxaCdi}% a.a.`,
    ],
  ];

  paramRows.forEach((p, idx) => {
    const rowNum = 5 + idx;
    const r = wsResumo.getRow(rowNum);
    r.height = 22;

    const cellA = wsResumo.getCell(`A${rowNum}`);
    cellA.value = p[0];
    cellA.font = { name: "Calibri", bold: true, color: { argb: "FF334155" }, size: 10 };
    cellA.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFF8FAFC" } };

    const cellB = wsResumo.getCell(`B${rowNum}`);
    cellB.value = p[1];
    if (p[2]) cellB.numFmt = p[2] as string;
    cellB.font = { name: "Calibri", bold: true, size: 10 };

    const cellD = wsResumo.getCell(`D${rowNum}`);
    cellD.value = p[3];
    cellD.font = { name: "Calibri", bold: true, color: { argb: "FF334155" }, size: 10 };
    cellD.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFF8FAFC" } };

    const cellE = wsResumo.getCell(`E${rowNum}`);
    cellE.value = p[4];
    cellE.font = { name: "Calibri", size: 10 };
  });

  // 2. RESULTADOS DA SIMULAÇÃO
  wsResumo.mergeCells("A10:F10");
  const sec2 = wsResumo.getCell("A10");
  sec2.value = "2. RESULTADOS DA SIMULAÇÃO";
  sec2.fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "FF0F172A" },
  };
  sec2.font = { name: "Calibri", size: 11, bold: true, color: { argb: "FFFFFFFF" } };
  sec2.alignment = { vertical: "middle", indent: 1 };
  wsResumo.getRow(10).height = 25;

  const mesesParaAtingir = backendData.mesesParaAtingir || 0;
  const anos = Math.floor(mesesParaAtingir / 12);
  const mesesResto = mesesParaAtingir % 12;
  const prazoTexto = anos > 0
    ? `${mesesParaAtingir} meses (${anos} ano${anos > 1 ? "s" : ""}${mesesResto > 0 ? ` e ${mesesResto} m` : ""})`
    : `${mesesParaAtingir} meses`;

  let dataAlvoFormatada = "-";
  if (backendData.dataPrevistaAlvo) {
    try {
      const d = new Date(backendData.dataPrevistaAlvo);
      dataAlvoFormatada = d.toLocaleDateString("pt-BR", { month: "long", year: "numeric", timeZone: "UTC" });
      dataAlvoFormatada = dataAlvoFormatada.charAt(0).toUpperCase() + dataAlvoFormatada.slice(1);
    } catch {
      dataAlvoFormatada = backendData.dataPrevistaAlvo;
    }
  }

  const resultRows = [
    [
      "Status da Meta",
      backendData.atingiuMeta ? "META ATINGIDA COM SUCESSO" : "EM ANDAMENTO",
      backendData.atingiuMeta ? "FF15803D" : "FF2563EB",
      "Prazo Estimado",
      prazoTexto,
    ],
    [
      "Data Prevista de Conquista",
      dataAlvoFormatada,
      undefined,
      "Patrimônio Final Acumulado",
      backendData.totalAcumulado || 0,
      BRL_FORMAT,
    ],
    [
      "Total Aportado pelo Grupo",
      backendData.totalInvestido || 0,
      BRL_FORMAT,
      "Lucro com Rendimentos Líquidos",
      backendData.lucroLiquido || 0,
      BRL_FORMAT,
    ],
    [
      "Total Retirado",
      backendData.totalRetirado || 0,
      BRL_FORMAT,
      "Diferença p/ Meta",
      (backendData.falta || 0) > 0 ? `Falta ${formatCurrency(backendData.falta)}` : "Meta 100% atingida",
    ],
  ];

  resultRows.forEach((rData, idx) => {
    const rowNum = 11 + idx;
    const r = wsResumo.getRow(rowNum);
    r.height = 22;

    const cellA = wsResumo.getCell(`A${rowNum}`);
    cellA.value = rData[0];
    cellA.font = { name: "Calibri", bold: true, color: { argb: "FF334155" }, size: 10 };
    cellA.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFF8FAFC" } };

    const cellB = wsResumo.getCell(`B${rowNum}`);
    cellB.value = rData[1];
    if (typeof rData[2] === "string" && rData[2].startsWith("FF")) {
      cellB.font = { name: "Calibri", bold: true, color: { argb: rData[2] }, size: 10 };
    } else if (typeof rData[2] === "string") {
      cellB.numFmt = rData[2];
      cellB.font = { name: "Calibri", bold: true, size: 10 };
    } else {
      cellB.font = { name: "Calibri", bold: true, size: 10 };
    }

    const cellD = wsResumo.getCell(`D${rowNum}`);
    cellD.value = rData[3];
    cellD.font = { name: "Calibri", bold: true, color: { argb: "FF334155" }, size: 10 };
    cellD.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFF8FAFC" } };

    const cellE = wsResumo.getCell(`E${rowNum}`);
    cellE.value = rData[4];
    if (typeof rData[5] === "string") {
      cellE.numFmt = rData[5];
      cellE.font = { name: "Calibri", bold: true, size: 10 };
    } else {
      cellE.font = { name: "Calibri", size: 10 };
    }
  });

  // 3. PARTICIPANTES & DISTRIBUIÇÃO
  wsResumo.mergeCells("A16:F16");
  const sec3 = wsResumo.getCell("A16");
  sec3.value = "3. PARTICIPANTES & DISTRIBUIÇÃO";
  sec3.fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "FF0F172A" },
  };
  sec3.font = { name: "Calibri", size: 11, bold: true, color: { argb: "FFFFFFFF" } };
  sec3.alignment = { vertical: "middle", indent: 1 };
  wsResumo.getRow(16).height = 25;

  const partHeaders = [
    "Participante",
    "Valor Inicial",
    "Total Aportado",
    "Rendimento Líquido",
    "Saldo Final",
    "Participação (%)",
  ];

  const partHeaderRow = wsResumo.getRow(17);
  partHeaderRow.height = 24;
  partHeaders.forEach((title, colIdx) => {
    const cell = partHeaderRow.getCell(colIdx + 1);
    cell.value = title;
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFE2E8F0" } };
    cell.font = { name: "Calibri", bold: true, size: 10, color: { argb: "FF0F172A" } };
    cell.alignment = {
      vertical: "middle",
      horizontal: colIdx === 0 ? "left" : "right",
    };
    cell.border = {
      bottom: { style: "thin", color: { argb: "FF94A3B8" } },
      top: { style: "thin", color: { argb: "FF94A3B8" } },
    };
  });

  let currentPartRow = 18;
  participantes.forEach((p) => {
    const row = wsResumo.getRow(currentPartRow);
    row.height = 20;

    row.getCell(1).value = p.nome;
    row.getCell(1).alignment = { vertical: "middle", horizontal: "left" };

    row.getCell(2).value = p.valorInicial;
    row.getCell(2).numFmt = BRL_FORMAT;

    row.getCell(3).value = p.aportadoTotal;
    row.getCell(3).numFmt = BRL_FORMAT;

    row.getCell(4).value = p.rendimentoTotal;
    row.getCell(4).numFmt = BRL_FORMAT;

    row.getCell(5).value = p.saldoFinal;
    row.getCell(5).numFmt = BRL_FORMAT;
    row.getCell(5).font = { name: "Calibri", bold: true };

    row.getCell(6).value = p.percentualDoTotal / 100;
    row.getCell(6).numFmt = PERCENT_FORMAT;
    row.getCell(6).alignment = { vertical: "middle", horizontal: "right" };

    currentPartRow++;
  });

  // Linha de total dos participantes
  if (participantes.length > 0) {
    const totalPartRow = wsResumo.getRow(currentPartRow);
    totalPartRow.height = 22;
    totalPartRow.getCell(1).value = "TOTAL DO GRUPO";
    totalPartRow.getCell(1).font = { name: "Calibri", bold: true };

    const firstRow = 18;
    const lastRow = currentPartRow - 1;

    totalPartRow.getCell(2).value = { formula: `SUM(B${firstRow}:B${lastRow})` };
    totalPartRow.getCell(2).numFmt = BRL_FORMAT;
    totalPartRow.getCell(2).font = { name: "Calibri", bold: true };

    totalPartRow.getCell(3).value = { formula: `SUM(C${firstRow}:C${lastRow})` };
    totalPartRow.getCell(3).numFmt = BRL_FORMAT;
    totalPartRow.getCell(3).font = { name: "Calibri", bold: true };

    totalPartRow.getCell(4).value = { formula: `SUM(D${firstRow}:D${lastRow})` };
    totalPartRow.getCell(4).numFmt = BRL_FORMAT;
    totalPartRow.getCell(4).font = { name: "Calibri", bold: true };

    totalPartRow.getCell(5).value = { formula: `SUM(E${firstRow}:E${lastRow})` };
    totalPartRow.getCell(5).numFmt = BRL_FORMAT;
    totalPartRow.getCell(5).font = { name: "Calibri", bold: true };

    totalPartRow.getCell(6).value = { formula: `SUM(F${firstRow}:F${lastRow})` };
    totalPartRow.getCell(6).numFmt = PERCENT_FORMAT;
    totalPartRow.getCell(6).font = { name: "Calibri", bold: true };
    totalPartRow.getCell(6).alignment = { vertical: "middle", horizontal: "right" };

    for (let c = 1; c <= 6; c++) {
      totalPartRow.getCell(c).border = {
        top: { style: "thin", color: { argb: "FF0F172A" } },
        bottom: { style: "double", color: { argb: "FF0F172A" } },
      };
      totalPartRow.getCell(c).fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FFF1F5F9" },
      };
    }
  }

  autoFitColumns(wsResumo, 15, 35);

  // ──────────────────────────────────────────────────────────────────────────
  // ABA 2: EVOLUÇÃO MÊS A MÊS
  // ──────────────────────────────────────────────────────────────────────────
  const wsEvolucao = workbook.addWorksheet("Evolução Mês a Mês", {
    views: [{ state: "frozen", ySplit: 1, showGridLines: true }],
  });

  const headers = [
    "Mês",
    "Data Referência",
    ...pessoas.map((p) => `Aporte ${p.nome}`),
    "Aporte Regular Grupo",
    "Aportes Extras",
    "Retiradas",
    "Aporte Líquido Mês",
    ...(showFinancials
      ? [
          "Rendimento Líquido",
          ...pessoas.map((p) => `Acum. ${p.nome}`),
          "Saldo Acumulado Grupo",
        ]
      : []),
    "Status da Meta",
  ];

  const headerRow = wsEvolucao.addRow(headers);
  headerRow.height = 28;
  headerRow.eachCell((cell) => {
    cell.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FF0F172A" },
    };
    cell.font = { name: "Calibri", bold: true, color: { argb: "FFFFFFFF" }, size: 10 };
    cell.alignment = { vertical: "middle", horizontal: "center", wrapText: true };
    cell.border = { bottom: { style: "medium", color: { argb: "FF94A3B8" } } };
  });

  wsEvolucao.autoFilter = {
    from: { row: 1, column: 1 },
    to: { row: 1, column: headers.length },
  };

  displayRows.forEach((r, idx) => {
    const isZero = r.mes === 0;
    const rowValues = [
      isZero ? "Início" : `Mês ${r.mes}`,
      r.dataFormatada,
      ...pessoas.map((p) => {
        const val = isZero ? (r.saldoPorPessoa[p.id] ?? Number(p.valorInicial) ?? 0) : r.aporteFinalPorPessoa[p.id] || 0;
        return val;
      }),
      r.aporteRegular,
      r.aportesExtras,
      r.retiradas,
      r.aporteLiquidoMes,
      ...(showFinancials
        ? [
            r.rendimentoLiquido,
            ...pessoas.map((p) => r.saldoPorPessoa[p.id] || 0),
            r.saldoAcumulado,
          ]
        : []),
      r.atingiu ? "Meta Atingida! 🎉" : isZero ? "Ponto de Partida" : "Em andamento",
    ];

    const excelRow = wsEvolucao.addRow(rowValues);
    excelRow.height = 20;

    const isEven = idx % 2 === 0;
    const defaultBg = isEven ? "FFFFFFFF" : "FFF8FAFC";
    const bg = r.atingiu ? "FFECFDF5" : defaultBg; // Soft emerald highlight when target achieved

    excelRow.eachCell({ includeEmpty: true }, (cell, colNumber) => {
      cell.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: bg },
      };
      cell.font = {
        name: "Calibri",
        size: 10,
        bold: r.atingiu,
        color: r.atingiu ? { argb: "FF065F46" } : { argb: "FF0F172A" },
      };
      cell.border = {
        bottom: { style: "thin", color: { argb: "FFE2E8F0" } },
      };

      // Alignment and number formatting
      if (colNumber === 1 || colNumber === 2 || colNumber === headers.length) {
        cell.alignment = { vertical: "middle", horizontal: "center" };
      } else {
        cell.numFmt = BRL_FORMAT;
        cell.alignment = { vertical: "middle", horizontal: "right" };
      }
    });
  });

  // Linha de Totais da Evolução
  if (displayRows.length > 0) {
    const firstDataRow = 2;
    const lastDataRow = displayRows.length + 1;
    const totalRowValues: any[] = ["TOTAL ACUMULADO", ""];

    // Sum columns
    for (let c = 3; c <= headers.length; c++) {
      if (c === headers.length) {
        totalRowValues.push("");
      } else {
        const colLetter = wsEvolucao.getColumn(c).letter;
        totalRowValues.push({ formula: `SUM(${colLetter}${firstDataRow}:${colLetter}${lastDataRow})` });
      }
    }

    const totalRow = wsEvolucao.addRow(totalRowValues);
    totalRow.height = 24;
    totalRow.eachCell((cell, colNumber) => {
      cell.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FFE2E8F0" },
      };
      cell.font = { name: "Calibri", bold: true, size: 10, color: { argb: "FF0F172A" } };
      cell.border = {
        top: { style: "thin", color: { argb: "FF0F172A" } },
        bottom: { style: "double", color: { argb: "FF0F172A" } },
      };
      if (colNumber > 2 && colNumber < headers.length) {
        cell.numFmt = BRL_FORMAT;
        cell.alignment = { vertical: "middle", horizontal: "right" };
      } else {
        cell.alignment = { vertical: "middle", horizontal: "center" };
      }
    });
  }

  autoFitColumns(wsEvolucao, 13, 30);

  // ──────────────────────────────────────────────────────────────────────────
  // ABA 3: APORTES EXTRAS & RETIRADAS (se houver)
  // ──────────────────────────────────────────────────────────────────────────
  if (aportesExtras && aportesExtras.length > 0) {
    const wsExtras = workbook.addWorksheet("Aportes Extras & Saídas", {
      views: [{ state: "frozen", ySplit: 1, showGridLines: true }],
    });

    const extraHeaders = ["Mês", "Data Estimada", "Tipo", "Participante", "Descrição / Motivo", "Valor"];
    const extraHeaderRow = wsExtras.addRow(extraHeaders);
    extraHeaderRow.height = 26;
    extraHeaderRow.eachCell((cell) => {
      cell.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FF0F172A" },
      };
      cell.font = { name: "Calibri", bold: true, color: { argb: "FFFFFFFF" }, size: 10 };
      cell.alignment = { vertical: "middle", horizontal: "center" };
    });

    aportesExtras.forEach((ex, idx) => {
      const tipo = ex.tipo === "retirada" || ex.valor < 0 ? "Retirada" : "Aporte Extra";
      const valor = Math.abs(ex.valor);
      const row = wsExtras.addRow([
        ex.mes !== undefined ? `Mês ${ex.mes}` : "-",
        ex.data ? ex.data.slice(0, 10) : "-",
        tipo,
        ex.pessoaNome || "-",
        ex.motivo || ex.origem || "Lançamento Avulso",
        valor,
      ]);
      row.height = 20;

      const isEven = idx % 2 === 0;
      row.eachCell((cell, colNum) => {
        cell.fill = {
          type: "pattern",
          pattern: "solid",
          fgColor: { argb: isEven ? "FFFFFFFF" : "FFF8FAFC" },
        };
        cell.font = { name: "Calibri", size: 10 };
        cell.border = { bottom: { style: "thin", color: { argb: "FFE2E8F0" } } };

        if (colNum === 6) {
          cell.numFmt = BRL_FORMAT;
          cell.alignment = { vertical: "middle", horizontal: "right" };
          if (tipo === "Retirada") {
            cell.font = { name: "Calibri", color: { argb: "FFDC2626" }, bold: true };
          }
        } else if (colNum === 1 || colNum === 2 || colNum === 3) {
          cell.alignment = { vertical: "middle", horizontal: "center" };
        }
      });
    });

    autoFitColumns(wsExtras, 14, 35);
  }

  // Gera e descarrega o arquivo no navegador
  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
  triggerFileDownload(blob, `imov-plan-planejamento-${hoje.dataStr}.xlsx`);
}

export function exportPlanToCSV(options: ExportPlanOptions): void {
  const { pessoas = [], backendData, showFinancials = true } = options;

  if (!backendData || !backendData.detalhesMensais?.length) {
    throw new Error("Não há dados de simulação disponíveis para exportar.");
  }

  const displayRows = buildExportRows(
    backendData.detalhesMensais,
    pessoas,
    backendData.mesesParaAtingir,
    backendData.atingiuMeta
  );

  const headers = [
    "Mes",
    "Data",
    ...pessoas.map((p) => p.nome),
    "Aporte Regular Grupo",
    "Aportes Extras",
    "Retiradas",
    "Aporte Liquido Mes",
    ...(showFinancials
      ? [
          "Rendimento Liquido",
          ...pessoas.map((p) => `Acum. ${p.nome.split(" ")[0]}`),
          "Saldo Acumulado",
        ]
      : []),
    "Status",
  ];

  const rows = displayRows.map((r) => {
    const isZero = r.mes === 0;
    const rowData = [
      r.mesLabel,
      r.dataFormatada,
      ...pessoas.map((p) => {
        const real = isZero ? (r.saldoPorPessoa[p.id] ?? Number(p.valorInicial) ?? 0) : r.aporteFinalPorPessoa[p.id] || 0;
        return real.toFixed(2).replace(".", ",");
      }),
      r.aporteRegular.toFixed(2).replace(".", ","),
      r.aportesExtras.toFixed(2).replace(".", ","),
      r.retiradas.toFixed(2).replace(".", ","),
      r.aporteLiquidoMes.toFixed(2).replace(".", ","),
      ...(showFinancials
        ? [
            r.rendimentoLiquido.toFixed(2).replace(".", ","),
            ...pessoas.map((p) => (r.saldoPorPessoa[p.id] || 0).toFixed(2).replace(".", ",")),
            r.saldoAcumulado.toFixed(2).replace(".", ","),
          ]
        : []),
      r.atingiu ? "Meta Atingida" : isZero ? "Inicio" : "Em andamento",
    ];
    return rowData.join(";");
  });

  // \uFEFF é o Byte Order Mark (BOM) UTF-8, essencial para o Microsoft Excel
  // abrir caracteres com acentos (ç, ã, é, etc.) sem desconfigurar.
  const csvContent = "\uFEFF" + [headers.join(";"), ...rows].join("\r\n");
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const hoje = getBrasiliaToday();
  triggerFileDownload(blob, `imov-plan-planejamento-${hoje.dataStr}.csv`);
}

function triggerFileDownload(blob: Blob, filename: string): void {
  if (typeof window === "undefined") return;
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.setAttribute("download", filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
