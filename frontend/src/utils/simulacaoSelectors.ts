import {
  BackendSimulacaoResult,
  ParticipanteSummary,
  SimulacaoSummary,
  ChartDataPoint,
} from "@/types/simulacao";
import { projetarDataMeta } from "@/utils/projecaoAuxiliar";

export function extractSimulacaoSummary(
  result: BackendSimulacaoResult | null
): SimulacaoSummary | null {
  if (!result) return null;

  return {
    totalNecessario: result.totalNecessario,
    valorJaGuardado: result.valorJaGuardado,
    totalInvestido: result.totalInvestido,
    totalAcumulado: result.totalAcumulado,
    lucroLiquido: result.lucroLiquido,
    atingiuMeta: result.atingiuMeta,
    mesesParaAtingir: result.mesesParaAtingir,
    dataPrevistaAlvo: result.dataPrevistaAlvo,
    falta: result.falta,
    projecaoDataMeta: projetarDataMeta(result),
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
