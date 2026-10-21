import {
  BackendSimulacaoResult,
  ParticipanteSummary,
  SimulacaoSummary,
  ChartDataPoint,
} from "@/types/simulacao";
import { getBrasiliaToday } from "@/utils/dates";
import { calcularEvolucaoDiariaDoMes } from "@/lib/finance";

export function extractSaldoAtual(result: BackendSimulacaoResult | null): number {
  if (!result) return 0;

  const { ano: hojeAno, mes: hojeMes, dia: diaHoje } = getBrasiliaToday();
  const mesesEvolucao = (result.detalhesMensais || []).filter((r) => r.mes > 0);

  if (!mesesEvolucao.length) {
    return Number(result.valorJaGuardado) || 0;
  }

  // 1. Localiza a linha do mês atual no calendário de Brasília
  const rowMesAtual = mesesEvolucao.find((r) => {
    if (!r.dataReferencia) return false;
    const match = String(r.dataReferencia).match(/^(\d{4})-(\d{2})/);
    if (match) {
      const refAno = parseInt(match[1], 10);
      const refMes = parseInt(match[2], 10);
      return refAno === hojeAno && refMes === hojeMes;
    }
    return false;
  });

  // Se o mês atual não foi encontrado por data exata:
  if (!rowMesAtual) {
    const primeiroMes = mesesEvolucao[0];
    const matchPrim = String(primeiroMes.dataReferencia || "").match(/^(\d{4})-(\d{2})/);
    if (matchPrim) {
      const pAno = parseInt(matchPrim[1], 10);
      const pMes = parseInt(matchPrim[2], 10);
      if (hojeAno < pAno || (hojeAno === pAno && hojeMes < pMes)) {
        return Number(result.valorJaGuardado) || 0;
      }
    }

    const ultimoMes = mesesEvolucao[mesesEvolucao.length - 1];
    const matchUlt = String(ultimoMes.dataReferencia || "").match(/^(\d{4})-(\d{2})/);
    if (matchUlt) {
      const uAno = parseInt(matchUlt[1], 10);
      const uMes = parseInt(matchUlt[2], 10);
      if (hojeAno > uAno || (hojeAno === uAno && hojeMes > uMes)) {
        return Number(result.totalAcumulado) || Number(ultimoMes.totalAcumulado) || 0;
      }
    }

    return Number(result.valorJaGuardado) || 0;
  }

  // 2. Com rowMesAtual localizado, calcula a evolução diária até o dia de hoje
  const prevRow = result.detalhesMensais?.find((x) => x.mes === rowMesAtual.mes - 1);
  const saldoInicialMes = prevRow 
    ? Number(prevRow.totalAcumulado || 0)
    : Number(result.valorJaGuardado || 0);

  const prevParts = prevRow?.participantes || [];
  const saldosIniciaisPorPessoa: Record<string, number> = {};
  if (prevParts.length > 0) {
    prevParts.forEach((p) => {
      saldosIniciaisPorPessoa[p.participanteId] = Number(p.saldo || 0);
    });
  } else if (result.participantesSnapshot?.length) {
    result.participantesSnapshot.forEach((p) => {
      saldosIniciaisPorPessoa[p.participanteId] = Number(p.valorInicial || 0);
    });
  }

  const partRows = rowMesAtual.participantes || [];
  const aportesParticipantes = partRows.length > 0
    ? partRows.map((p) => ({
        pessoaId: p.participanteId,
        pessoaNome: p.nome,
        valor: Number(p.aporteMensal || 0),
        diaAporte: 5,
      }))
    : (result.participantesSnapshot || []).map((p) => ({
        pessoaId: p.participanteId,
        pessoaNome: p.nome,
        valor: Number(p.aporteMensal || 0),
        diaAporte: 5,
      }));

  const aportesExtras: Array<{ data?: string; valor: number; origem?: string }> = [];
  if (rowMesAtual.aportesExtras && rowMesAtual.aportesExtras > 0) {
    aportesExtras.push({
      data: `${hojeAno}-${String(hojeMes).padStart(2, "0")}-01`,
      valor: rowMesAtual.aportesExtras,
      origem: "Aporte Extra",
    });
  }
  if (rowMesAtual.retiradas && rowMesAtual.retiradas > 0) {
    aportesExtras.push({
      data: `${hojeAno}-${String(hojeMes).padStart(2, "0")}-01`,
      valor: -rowMesAtual.retiradas,
      origem: "Retirada",
    });
  }

  const evolucaoMes = calcularEvolucaoDiariaDoMes({
    dataReferencia: rowMesAtual.dataReferencia,
    saldoInicialMes,
    saldosIniciaisPorPessoa,
    aporteRegular: Number(rowMesAtual.aporteMensal || 0),
    diaAporteRegular: 5,
    aportesParticipantes,
    aportesExtras,
    taxaCdiAnual: Number(result.taxaCdiAnual || 10.5),
    tipoInvestimento: "cdb_100",
  });

  const diaCorrespondente = evolucaoMes.dias.find((d) => d.dia === diaHoje) || evolucaoMes.dias[evolucaoMes.dias.length - 1];
  if (diaCorrespondente && diaCorrespondente.saldoFinal > 0) {
    return diaCorrespondente.saldoFinal;
  }

  return Number(result.valorJaGuardado) || 0;
}

export function extractSimulacaoSummary(
  result: BackendSimulacaoResult | null
): SimulacaoSummary | null {
  if (!result) return null;

  return {
    totalNecessario: result.totalNecessario,
    valorJaGuardado: result.valorJaGuardado,
    saldoAtual: extractSaldoAtual(result),
    totalInvestido: result.totalInvestido,
    totalRetirado: result.totalRetirado,
    totalAcumulado: result.totalAcumulado,
    lucroLiquido: result.lucroLiquido,
    atingiuMeta: result.atingiuMeta,
    mesesParaAtingir: result.mesesParaAtingir,
    dataPrevistaAlvo: result.dataPrevistaAlvo,
    falta: result.falta,
  };
}

export function extractParticipantesSummary(
  result: BackendSimulacaoResult | null
): ParticipanteSummary[] {
  if (!result || !result.detalhesMensais || result.detalhesMensais.length === 0) return [];

  // Pega a última linha válida onde todos terminaram de aportar/render
  const lastRow = result.detalhesMensais[result.detalhesMensais.length - 1];

  if (!lastRow.participantes || lastRow.participantes.length === 0) return [];

  const totalAcumuladoGlobal = lastRow.totalAcumulado > 0 ? lastRow.totalAcumulado : 1;

  // Otimização: pré-calcular totais por participante em uma única passagem O(n)
  const totaisPorParticipante = new Map<string, { aportadoTotal: number; rendimentoTotal: number }>();

  result.detalhesMensais.forEach((row) => {
    if (!row.participantes) return;
    row.participantes.forEach((part) => {
      const existing = totaisPorParticipante.get(part.participanteId) || { aportadoTotal: 0, rendimentoTotal: 0 };
      totaisPorParticipante.set(part.participanteId, {
        aportadoTotal: existing.aportadoTotal + part.aporteMensal + part.aportesExtras,
        rendimentoTotal: existing.rendimentoTotal + part.rendimentoLiquido,
      });
    });
  });

  // Usa o snapshot do inicio e os dados acumulados de cada um
  return lastRow.participantes.map((p) => {
    const snapshot = result.participantesSnapshot?.find((s) => s.participanteId === p.participanteId);
    const valorInicial = snapshot?.valorInicial ?? 0;
    const totais = totaisPorParticipante.get(p.participanteId) || { aportadoTotal: 0, rendimentoTotal: 0 };

    return {
      participanteId: p.participanteId,
      nome: p.nome,
      valorInicial,
      aportadoTotal: totais.aportadoTotal,
      rendimentoTotal: totais.rendimentoTotal,
      saldoFinal: p.saldo,
      percentualDoTotal: (p.saldo / totalAcumuladoGlobal) * 100,
    };
  });
}

export function extractChartData(
  result: BackendSimulacaoResult | null
): ChartDataPoint[] {
  if (!result || !result.detalhesMensais) return [];

  // Otimização: calcular acumulado em uma única passagem O(n) em vez de O(n²)
  let investidoAcumulado = result.valorJaGuardado;

  return result.detalhesMensais.map((row) => {
    // mes 0 não tem aporte, é só saldo inicial
    if (row.mes > 0) {
      investidoAcumulado += row.aporteMensal + row.aportesExtras;
    }

    return {
      mes: row.mes,
      label: row.dataReferencia, // formataremos com formatChartLabel no componente
      investido: investidoAcumulado,
      saldo: row.totalAcumulado,
    };
  });
}
