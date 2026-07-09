import {
  BackendSimulacaoResult,
  ParticipanteSummary,
  SimulacaoSummary,
  ChartDataPoint,
} from "@/types/simulacao";

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

  // Usa o snapshot do inicio e os dados acumulados de cada um
  return lastRow.participantes.map((p) => {
    // Para calcular os totais exatos acumulados até aquele mês, podemos somar as linhas
    // Mas a API já nos diz o saldo da última linha.
    // O snapshot nos diz o valor inicial
    const snapshot = result.participantesSnapshot?.find((s) => s.participanteId === p.participanteId);
    const valorInicial = snapshot?.valorInicial ?? 0;
    
    // A API só traz o aporte do *mês* na linha, e não o acumulado até aquele mês.
    // Então, para saber "Aportado Total" até a última linha, vamos varrer os detalhesMensais.
    let aportadoTotal = 0;
    let rendimentoTotal = 0;
    
    result.detalhesMensais.forEach((row) => {
      const part = row.participantes?.find((pRow) => pRow.participanteId === p.participanteId);
      if (part) {
        aportadoTotal += part.aporteMensal + part.aportesExtras;
        rendimentoTotal += part.rendimentoLiquido;
      }
    });

    return {
      participanteId: p.participanteId,
      nome: p.nome,
      valorInicial,
      aportadoTotal,
      rendimentoTotal,
      saldoFinal: p.saldo,
      percentualDoTotal: (p.saldo / totalAcumuladoGlobal) * 100,
    };
  });
}

export function extractChartData(
  result: BackendSimulacaoResult | null
): ChartDataPoint[] {
  if (!result || !result.detalhesMensais) return [];

  return result.detalhesMensais.map((row) => {
    // Calculamos o total investido (soma dos aportes até este mês + valor inicial)
    // Para simplificar, como o chart precisa do total investido acumulado naquela linha,
    // nós iteramos acumulando (o backend poderia enviar isso pronto no futuro, mas o front pode só somar os inputs)
    let investidoAcumulado = result.valorJaGuardado;
    
    // Varremos até a linha atual para somar aportes
    for (let i = 0; i <= row.mes; i++) {
        const r = result.detalhesMensais[i];
        if (r && i > 0) { // mes 0 não tem aporte, é só saldo inicial
             investidoAcumulado += r.aporteMensal + r.aportesExtras;
        }
    }

    return {
      mes: row.mes,
      label: row.dataReferencia, // formataremos com formatChartLabel no componente
      investido: investidoAcumulado,
      saldo: row.totalAcumulado,
    };
  });
}
